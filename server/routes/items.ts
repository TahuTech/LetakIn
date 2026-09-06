import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const itemsRouter = Router();

itemsRouter.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const items = await prisma.item.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: { bin: { include: { rack: true } }, category: true },
    orderBy: { name: "asc" },
  });
  res.json(items);
});

itemsRouter.post("/", async (req: Request, res: Response) => {
  const { name, description, categoryId, binId, quantity, minStock, unit } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nama wajib diisi" });
    return;
  }

  const item = await prisma.item.create({
    data: {
      name,
      description: description || null,
      categoryId: categoryId || null,
      binId: binId || null,
      quantity: Math.max(0, Number(quantity) || 0),
      minStock: Math.max(0, Number(minStock) || 5),
      unit: unit || "pcs",
    },
    include: { bin: { include: { rack: true } }, category: true },
  });

  if (item.quantity > 0) {
    await prisma.transaction.create({
      data: { itemId: item.id, type: "in", quantity: item.quantity, note: "Stok awal" },
    });
  }

  res.status(201).json(item);
});

itemsRouter.get("/:id", async (req: Request, res: Response) => {
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

itemsRouter.put("/:id", async (req: Request, res: Response) => {
  const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }

  const item = await prisma.item.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name ?? existing.name,
      description: req.body.description !== undefined ? req.body.description || null : existing.description,
      categoryId: req.body.categoryId !== undefined ? req.body.categoryId || null : existing.categoryId,
      binId: req.body.binId !== undefined ? req.body.binId || null : existing.binId,
      minStock: req.body.minStock !== undefined ? Math.max(0, Number(req.body.minStock) || 0) : existing.minStock,
      unit: req.body.unit ?? existing.unit,
    },
    include: { bin: { include: { rack: true } }, category: true },
  });
  res.json(item);
});

itemsRouter.delete("/:id", async (req: Request, res: Response) => {
  const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
