import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const racksRouter = Router();

/** Label sel: huruf baris (A–T) + angka kolom (1–20) → A1, B3, ... */
function cellLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + row)}${col + 1}`;
}

type SpanArea = { row: number; col: number; rowSpan: number; colSpan: number };

function areasOverlap(a: SpanArea, b: SpanArea) {
  return (
    a.row < b.row + b.rowSpan &&
    a.row + a.rowSpan > b.row &&
    a.col < b.col + b.colSpan &&
    a.col + a.colSpan > b.col
  );
}

/** Buat bins untuk sebuah template dalam sebuah rak. */
function templateBins(
  rackId: string,
  rows: number,
  cols: number,
  template: "fill" | "rows" | "cols"
) {
  const data = [];
  if (template === "fill") {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        data.push({ rackId, label: cellLabel(r, c), row: r, col: c, rowSpan: 1, colSpan: 1 });
      }
    }
  } else if (template === "rows") {
    for (let r = 0; r < rows; r++) {
      data.push({ rackId, label: String.fromCharCode(65 + r), row: r, col: 0, rowSpan: 1, colSpan: cols });
    }
  } else if (template === "cols") {
    for (let c = 0; c < cols; c++) {
      data.push({ rackId, label: String(c + 1), row: 0, col: c, rowSpan: rows, colSpan: 1 });
    }
  }
  return data;
}

racksRouter.get("/", async (_req: Request, res: Response) => {
  const racks = await prisma.rack.findMany({
    include: {
      bins: {
        include: { items: true },
        orderBy: [{ row: "asc" }, { col: "asc" }],
      },
    },
    orderBy: { code: "asc" },
  });
  res.json(racks);
});

racksRouter.post("/", async (req: Request, res: Response) => {
  const { name, code, rows, cols, template } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: "name dan code wajib" });
    return;
  }
  if (template !== undefined && !["fill", "rows", "cols"].includes(template)) {
    res.status(400).json({ error: "template harus salah satu dari: fill, rows, cols" });
    return;
  }
  const nRows = Math.max(1, Number(rows) || 4);
  const nCols = Math.max(1, Number(cols) || 3);
  try {
    const rack = await prisma.$transaction(async (tx) => {
      const created = await tx.rack.create({
        data: { name, code, rows: nRows, cols: nCols },
      });
      if (template) {
        await tx.bin.createMany({
          data: templateBins(created.id, nRows, nCols, template),
        });
      }
      return tx.rack.findUniqueOrThrow({
        where: { id: created.id },
        include: { bins: true },
      });
    });
    res.status(201).json(rack);
  } catch {
    res.status(409).json({ error: "Kode rak sudah dipakai" });
  }
});

// POST /:id/reset — hapus semua bin kosong dalam rak
racksRouter.post("/:id/reset", async (req: Request<{ id: string }>, res: Response) => {
  const rack = await prisma.rack.findUnique({
    where: { id: req.params.id },
    include: { bins: { include: { items: true } } },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }
  const filled = rack.bins.find((b) => b.items.length > 0);
  if (filled) {
    res.status(400).json({
      error: `Bin "${filled.label}" masih berisi ${filled.items.length} barang. Kosongkan atau pindahkan dulu.`,
    });
    return;
  }
  const { count } = await prisma.bin.deleteMany({ where: { rackId: rack.id } });
  res.json({ ok: true, deleted: count });
});

// POST /:id/autofill — buat bin 1x1 di setiap sel kosong (label A1, B2, ...)
racksRouter.post("/:id/autofill", async (req: Request<{ id: string }>, res: Response) => {
  const rack = await prisma.rack.findUnique({
    where: { id: req.params.id },
    include: { bins: true },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }

  // Peta sel terisi
  const occupied = new Set<string>();
  for (const b of rack.bins) {
    for (let r = b.row; r < b.row + b.rowSpan; r++) {
      for (let c = b.col; c < b.col + b.colSpan; c++) {
        occupied.add(`${r},${c}`);
      }
    }
  }

  const data = [];
  for (let r = 0; r < rack.rows; r++) {
    for (let c = 0; c < rack.cols; c++) {
      if (!occupied.has(`${r},${c}`)) {
        data.push({ rackId: rack.id, label: cellLabel(r, c), row: r, col: c, rowSpan: 1, colSpan: 1 });
      }
    }
  }

  if (data.length === 0) {
    res.json({ created: 0 });
    return;
  }
  await prisma.bin.createMany({ data });
  res.status(201).json({ created: data.length });
});

// POST /:id/area-check — validasi area bebas untuk bin baru (dipakai drag-select)
racksRouter.post("/:id/area-check", async (req: Request<{ id: string }>, res: Response) => {
  const rack = await prisma.rack.findUnique({
    where: { id: req.params.id },
    include: { bins: true },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }
  const area: SpanArea = {
    row: Number(req.body.row),
    col: Number(req.body.col),
    rowSpan: Math.max(1, Number(req.body.rowSpan) || 1),
    colSpan: Math.max(1, Number(req.body.colSpan) || 1),
  };
  if (
    area.row < 0 || area.col < 0 ||
    area.row + area.rowSpan > rack.rows ||
    area.col + area.colSpan > rack.cols
  ) {
    res.status(400).json({ error: "Area keluar dari grid" });
    return;
  }
  const hit = rack.bins.find((b) => areasOverlap(area, b));
  if (hit) {
    res.status(409).json({ error: `Area bertabrakan dengan bin "${hit.label}"` });
    return;
  }
  res.json({ ok: true });
});

racksRouter.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const rack = await prisma.rack.findUnique({
    where: { id: req.params.id },
    include: {
      bins: {
        include: { items: { include: { category: true } } },
        orderBy: [{ row: "asc" }, { col: "asc" }],
      },
    },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }
  res.json(rack);
});

racksRouter.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const { name, rows, cols } = req.body;

  const rack = await prisma.rack.findUnique({
    where: { id: req.params.id },
    include: { bins: true },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }

  const newRows = Math.max(1, Number(rows) || rack.rows);
  const newCols = Math.max(1, Number(cols) || rack.cols);

  // Validasi: tidak boleh ada bin yang keluar dari grid baru
  for (const bin of rack.bins) {
    if (bin.row + bin.rowSpan > newRows || bin.col + bin.colSpan > newCols) {
      res.status(400).json({
        error: `Bin "${bin.label}" akan keluar dari grid ${newRows}x${newCols}. Pindahkan atau kecilkan dulu.`,
      });
      return;
    }
  }

  const updated = await prisma.rack.update({
    where: { id: req.params.id },
    data: { name: name ?? rack.name, rows: newRows, cols: newCols },
    include: { bins: { include: { items: true } } },
  });
  res.json(updated);
});

racksRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const rack = await prisma.rack.findUnique({
    where: { id: req.params.id },
    include: { bins: { include: { items: true } } },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }
  const itemCount = rack.bins.reduce((s, b) => s + b.items.length, 0);
  if (itemCount > 0) {
    res.status(400).json({
      error: `Rak masih berisi ${itemCount} barang. Kosongkan dulu.`,
    });
    return;
  }
  await prisma.rack.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
