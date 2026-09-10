import { Prisma } from "@prisma/client";
import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { getPage, paginated } from "../pagination.js";

export const itemsRouter = Router();

itemsRouter.get("/", async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const categoryId =
    typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const rackId =
    typeof req.query.rackId === "string" ? req.query.rackId : undefined;
  const lowStock = req.query.lowStock === "true";
  const where: Prisma.ItemWhereInput = {
    ...(q ? { name: { contains: q } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(rackId ? { bin: { rackId } } : {}),
    ...(lowStock ? { quantity: { lte: prisma.item.fields.minStock } } : {}),
  };
  const page = getPage(req);
  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      include: { bin: { include: { rack: true } }, category: true },
      orderBy: { name: "asc" },
      skip: page.skip,
      take: page.pageSize,
    }),
    prisma.item.count({ where }),
  ]);
  res.json(paginated(items, total, page));
});

itemsRouter.get("/summary", async (_req: Request, res: Response) => {
  const lowStockWhere: Prisma.ItemWhereInput = {
    quantity: { lte: prisma.item.fields.minStock },
  };
  const [totalItems, quantity, lowStockCount, lowStockItems] =
    await prisma.$transaction([
      prisma.item.count(),
      prisma.item.aggregate({ _sum: { quantity: true } }),
      prisma.item.count({ where: lowStockWhere }),
      prisma.item.findMany({
        where: lowStockWhere,
        include: { bin: { include: { rack: true } }, category: true },
        orderBy: { quantity: "asc" },
        take: 10,
      }),
    ]);
  res.json({
    totalItems,
    totalUnits: quantity._sum.quantity ?? 0,
    lowStockCount,
    lowStockItems,
  });
});

// Validasi & normalisasi jenis barang
function normJenis(v: unknown): "pribadi" | "dijual" {
  return v === "dijual" ? "dijual" : "pribadi";
}

itemsRouter.post("/", async (req: Request, res: Response) => {
  const { name, description, categoryId, binId, quantity, minStock, unit, jenis } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nama wajib diisi" });
    return;
  }

  const j = normJenis(jenis);
  // Barang pribadi: stok terkunci 1, minStock 0 (tidak ada konsep "menipis")
  const finalQty = j === "pribadi" ? 1 : Math.max(0, Number(quantity) || 0);
  const finalMinStock = j === "pribadi" ? 0 : Math.max(0, Number(minStock) || 5);

  const item = await prisma.item.create({
    data: {
      name,
      description: description || null,
      jenis: j,
      categoryId: categoryId || null,
      binId: binId || null,
      quantity: finalQty,
      minStock: finalMinStock,
      unit: unit || "pcs",
    },
    include: { bin: { include: { rack: true } }, category: true },
  });

  // Hanya catat stok awal untuk barang dijual (pribadi tidak pakai transaksi)
  if (j === "dijual" && item.quantity > 0) {
    await prisma.transaction.create({
      data: { itemId: item.id, type: "in", quantity: item.quantity, note: "Stok awal" },
    });
  }

  res.status(201).json(item);
});

itemsRouter.post("/bulk", async (req: Request, res: Response) => {
  const rows = req.body?.items;
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "Body harus berisi array items (minimal 1)" });
    return;
  }
  if (rows.length > 200) {
    res.status(400).json({ error: "Maksimal 200 barang per submit" });
    return;
  }
  // Validasi: setiap baris wajib punya nama
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i]?.name || !String(rows[i].name).trim()) {
      res.status(400).json({ error: `Baris ${i + 1}: nama wajib diisi` });
      return;
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const r of rows) {
        const j = normJenis(r.jenis);
        const quantity = j === "pribadi" ? 1 : Math.max(0, Number(r.quantity) || 0);
        const item = await tx.item.create({
          data: {
            name: String(r.name).trim(),
            description: r.description ? String(r.description).trim() : null,
            jenis: j,
            categoryId: r.categoryId || null,
            binId: r.binId || null,
            quantity,
            minStock: j === "pribadi" ? 0 : Math.max(0, Number(r.minStock) || 5),
            unit: r.unit ? String(r.unit).trim() : "pcs",
          },
        });
        // Hanya barang dijual yang mencatat stok awal
        if (j === "dijual" && quantity > 0) {
          await tx.transaction.create({
            data: { itemId: item.id, type: "in", quantity, note: "Stok awal" },
          });
        }
        count++;
      }
      return count;
    });
    res.status(201).json({ created });
  } catch (e) {
    console.error("Bulk create gagal:", e);
    res.status(400).json({
      error: "Gagal menyimpan. Pastikan kategori/lokasi yang dipilih valid.",
    });
  }
});

// ===== POST /bulk-text — tambah banyak barang pribadi via sintaks teks =====
// Sintaks per baris:  nama [@ kategori] [> labelBin]
//   # komentar & baris kosong diabaikan. Semua jadi barang pribadi (qty 1).
itemsRouter.post("/bulk-text", async (req: Request, res: Response) => {
  const lines = req.body?.lines;
  if (!Array.isArray(lines) || lines.length === 0) {
    res.status(400).json({ error: "Body harus berisi array lines (minimal 1)" });
    return;
  }
  if (lines.length > 300) {
    res.status(400).json({ error: "Maksimal 300 baris per submit" });
    return;
  }

  // Parse tiap baris
  type Parsed = { name: string; categoryName?: string; binLabel?: string };
  const parsed: (Parsed | null)[] = lines.map((raw) => {
    const line = String(raw ?? "").trim();
    if (!line || line.startsWith("#")) return null; // komentar/kosong

    // Pisahkan lokasi dulu (">"), lalu kategori ("@")
    const [beforeLoc, ...locParts] = line.split(">");
    const binLabel = locParts.length > 0 ? locParts.join(">").trim() || undefined : undefined;

    const [namePart, ...catParts] = beforeLoc.split("@");
    const name = namePart.trim();
    const categoryName = catParts.length > 0 ? catParts.join("@").trim() || undefined : undefined;

    if (!name) return null;
    return { name, categoryName, binLabel };
  });

  const valid = parsed.filter((p): p is Parsed => p !== null);
  if (valid.length === 0) {
    res.status(400).json({ error: "Tidak ada baris valid (nama wajib diisi)" });
    return;
  }

  const warnings: string[] = [];
  const categoriesCreated: string[] = [];

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Cache kategori by nama (lowercase) agar get-or-create konsisten
      const catByName = new Map<string, string>(); // nameLower -> id
      const existingCats = await tx.category.findMany();
      for (const c of existingCats) catByName.set(c.name.toLowerCase(), c.id);

      // Cache bin by label (lowercase) — label tidak unik lintas rak, ambil yang pertama
      const binByLabel = new Map<string, string>(); // labelLower -> binId
      const allBins = await tx.bin.findMany({ orderBy: { createdAt: "asc" } });
      for (const b of allBins) {
        const k = b.label.toLowerCase();
        if (!binByLabel.has(k)) binByLabel.set(k, b.id);
      }

      let count = 0;
      for (let i = 0; i < valid.length; i++) {
        const p = valid[i];
        const rowNum = lines.indexOf(lines.find((l) => String(l ?? "").trim() && !String(l ?? "").trim().startsWith("#") && String(l).includes(p.name)) ?? "") + 1;

        // Get-or-create kategori
        let categoryId: string | null = null;
        if (p.categoryName) {
          const key = p.categoryName.toLowerCase();
          const existingId = catByName.get(key);
          if (existingId) {
            categoryId = existingId;
          } else {
            const cat = await tx.category.create({ data: { name: p.categoryName } });
            catByName.set(key, cat.id);
            categoryId = cat.id;
            categoriesCreated.push(p.categoryName);
          }
        }

        // Resolve bin by label
        let binId: string | null = null;
        if (p.binLabel) {
          const found = binByLabel.get(p.binLabel.toLowerCase());
          if (found) {
            binId = found;
          } else {
            warnings.push(
              `Baris ${rowNum > 0 ? rowNum : i + 1} ("${p.name}"): bin "${p.binLabel}" tidak ditemukan — dibuat tanpa lokasi`
            );
          }
        }

        await tx.item.create({
          data: {
            name: p.name,
            jenis: "pribadi",
            categoryId,
            binId,
            quantity: 1,
            minStock: 0,
            unit: "pcs",
          },
        });
        count++;
      }
      return count;
    });

    res.status(201).json({ created, categoriesCreated, warnings });
  } catch (e) {
    console.error("Bulk-text gagal:", e);
    res.status(400).json({ error: "Gagal menyimpan barang dari teks." });
  }
});

itemsRouter.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const item = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      bin: { include: { rack: true } },
      category: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!item) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }
  res.json(item);
});

itemsRouter.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }

  // Jika jenis diubah eksplisit, hormati; jika tidak, pakai existing
  const j = req.body.jenis !== undefined ? normJenis(req.body.jenis) : normJenis(existing.jenis);
  // Barang pribadi: stok terkunci 1, minStock 0
  const finalQty = j === "pribadi" ? 1 : existing.quantity;
  const finalMinStock =
    j === "pribadi"
      ? 0
      : req.body.minStock !== undefined
        ? Math.max(0, Number(req.body.minStock) || 0)
        : existing.minStock;

  const item = await prisma.item.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name ?? existing.name,
      description: req.body.description !== undefined ? req.body.description || null : existing.description,
      jenis: j,
      categoryId: req.body.categoryId !== undefined ? req.body.categoryId || null : existing.categoryId,
      binId: req.body.binId !== undefined ? req.body.binId || null : existing.binId,
      quantity: finalQty,
      minStock: finalMinStock,
      unit: req.body.unit ?? existing.unit,
    },
    include: { bin: { include: { rack: true } }, category: true },
  });
  res.json(item);
});

itemsRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
