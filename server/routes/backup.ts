import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const backupRouter = Router();

type BackupFile = {
  version: number;
  exportedAt: string;
  racks: unknown[];
  bins: unknown[];
  categories: unknown[];
  items: unknown[];
  transactions: unknown[];
};

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

// ===== GET /api/export — backup penuh semua tabel (JSON) =====
backupRouter.get("/export", async (_req: Request, res: Response) => {
  const [racks, bins, categories, items, transactions] = await Promise.all([
    prisma.rack.findMany(),
    prisma.bin.findMany(),
    prisma.category.findMany(),
    prisma.item.findMany(),
    prisma.transaction.findMany(),
  ]);

  const payload: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    racks,
    bins,
    categories,
    items,
    transactions,
  };

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="letakin-backup-${dateStamp()}.json"`
  );
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(payload, null, 2));
});

// ===== GET /api/export/items.csv — barang saja (untuk Excel) =====
backupRouter.get("/export/items.csv", async (_req: Request, res: Response) => {
  const items = await prisma.item.findMany({
    include: { bin: { include: { rack: true } }, category: true },
    orderBy: { name: "asc" },
  });

  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = "nama,deskripsi,kategori,rak,bin,stok,stok_min,satuan";
  const rows = items.map((i) =>
    [
      esc(i.name),
      esc(i.description),
      esc(i.category?.name),
      esc(i.bin?.rack.name),
      esc(i.bin?.label),
      i.quantity,
      i.minStock,
      esc(i.unit),
    ].join(",")
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="letakin-barang-${dateStamp()}.csv"`
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  // BOM agar Excel membaca UTF-8 dengan benar
  res.send("﻿" + [header, ...rows].join("\r\n"));
});

// ===== POST /api/import — ganti SEMUA data dari file backup =====
backupRouter.post("/import", async (req: Request, res: Response) => {
  const body = req.body as Partial<BackupFile>;

  // Validasi struktur dasar
  const arrays: (keyof BackupFile)[] = [
    "racks",
    "bins",
    "categories",
    "items",
    "transactions",
  ];
  if (
    body.version !== 1 ||
    !arrays.every((k) => Array.isArray(body[k]))
  ) {
    res.status(400).json({
      error:
        "File tidak valid. Harus berupa backup JSON LetakIN (version 1) berisi racks, bins, categories, items, transactions.",
    });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Hapus dengan urutan aman foreign key
      await tx.transaction.deleteMany();
      await tx.item.deleteMany();
      await tx.bin.deleteMany();
      await tx.category.deleteMany();
      await tx.rack.deleteMany();

      // Pulihkan dengan id lama agar relasi tetap utuh
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.rack.createMany({ data: body.racks as any[] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.category.createMany({ data: body.categories as any[] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.bin.createMany({ data: body.bins as any[] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.item.createMany({ data: body.items as any[] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.transaction.createMany({ data: body.transactions as any[] });
    });

    res.json({
      ok: true,
      restored: {
        racks: body.racks!.length,
        bins: body.bins!.length,
        categories: body.categories!.length,
        items: body.items!.length,
        transactions: body.transactions!.length,
      },
    });
  } catch (e) {
    console.error("Import gagal:", e);
    res.status(500).json({
      error:
        "Import gagal di tengah jalan. Data dikembalikan seperti semula (rollback).",
    });
  }
});
