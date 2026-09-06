import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const binsRouter = Router();

type Span = { row: number; col: number; rowSpan: number; colSpan: number };

function overlaps(a: Span, b: Span) {
  return (
    a.row < b.row + b.rowSpan &&
    a.row + a.rowSpan > b.row &&
    a.col < b.col + b.colSpan &&
    a.col + a.colSpan > b.col
  );
}

// POST /api/bins — buat bin baru (dipakai oleh RackGridEditor)
binsRouter.post("/", async (req: Request, res: Response) => {
  const { rackId, row, col, label, rowSpan, colSpan, color } = req.body;
  if (!rackId || label === undefined) {
    res.status(400).json({ error: "rackId dan label wajib" });
    return;
  }
  const rack = await prisma.rack.findUnique({
    where: { id: rackId },
    include: { bins: true },
  });
  if (!rack) {
    res.status(404).json({ error: "Rak tidak ditemukan" });
    return;
  }

  const r = Number(row);
  const c = Number(col);
  const rs = Math.max(1, Number(rowSpan) || 1);
  const cs = Math.max(1, Number(colSpan) || 1);

  if (r < 0 || c < 0 || r + rs > rack.rows || c + cs > rack.cols) {
    res.status(400).json({ error: "Posisi bin keluar dari grid" });
    return;
  }
  const area = { row: r, col: c, rowSpan: rs, colSpan: cs };
  if (rack.bins.some((b) => overlaps(area, b))) {
    res.status(400).json({ error: "Posisi bertabrakan dengan bin lain" });
    return;
  }

  const bin = await prisma.bin.create({
    data: {
      rackId,
      label: label || `Bin ${r + 1},${c + 1}`,
      row: r,
      col: c,
      rowSpan: rs,
      colSpan: cs,
      color: color || null,
    },
    include: { items: true },
  });
  res.status(201).json(bin);
});

binsRouter.put("/:id", async (req: Request, res: Response) => {
  const bin = await prisma.bin.findUnique({
    where: { id: req.params.id },
    include: { rack: { include: { bins: true } } },
  });
  if (!bin) {
    res.status(404).json({ error: "Bin tidak ditemukan" });
    return;
  }

  const r = Number(req.body.row ?? bin.row);
  const c = Number(req.body.col ?? bin.col);
  const rs = Math.max(1, Number(req.body.rowSpan ?? bin.rowSpan) || 1);
  const cs = Math.max(1, Number(req.body.colSpan ?? bin.colSpan) || 1);

  if (r < 0 || c < 0 || r + rs > bin.rack.rows || c + cs > bin.rack.cols) {
    res.status(400).json({ error: "Posisi bin keluar dari grid" });
    return;
  }
  const area = { row: r, col: c, rowSpan: rs, colSpan: cs };
  if (bin.rack.bins.some((b) => b.id !== bin.id && overlaps(area, b))) {
    res.status(400).json({ error: "Posisi bertabrakan dengan bin lain" });
    return;
  }

  const updated = await prisma.bin.update({
    where: { id: req.params.id },
    data: {
      label: req.body.label ?? bin.label,
      row: r,
      col: c,
      rowSpan: rs,
      colSpan: cs,
      color: req.body.color !== undefined ? req.body.color || null : bin.color,
    },
    include: { items: true },
  });
  res.json(updated);
});

binsRouter.delete("/:id", async (req: Request, res: Response) => {
  const bin = await prisma.bin.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!bin) {
    res.status(404).json({ error: "Bin tidak ditemukan" });
    return;
  }
  if (bin.items.length > 0) {
    res.status(400).json({
      error: `Bin masih berisi ${bin.items.length} barang. Kosongkan dulu.`,
    });
    return;
  }
  await prisma.bin.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
