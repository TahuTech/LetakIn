import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const racksRouter = Router();

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
  const { name, code, rows, cols } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: "name dan code wajib" });
    return;
  }
  try {
    const rack = await prisma.rack.create({
      data: {
        name,
        code,
        rows: Math.max(1, Number(rows) || 4),
        cols: Math.max(1, Number(cols) || 3),
      },
      include: { bins: true },
    });
    res.status(201).json(rack);
  } catch {
    res.status(409).json({ error: "Kode rak sudah dipakai" });
  }
});

racksRouter.get("/:id", async (req: Request, res: Response) => {
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

racksRouter.put("/:id", async (req: Request, res: Response) => {
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

racksRouter.delete("/:id", async (req: Request, res: Response) => {
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
