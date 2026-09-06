import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const transactionsRouter = Router();

transactionsRouter.get("/", async (_req: Request, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    include: { item: { include: { bin: { include: { rack: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(transactions);
});

transactionsRouter.post("/", async (req: Request, res: Response) => {
  const { itemId, type, quantity, note } = req.body;

  if (!itemId || !["in", "out", "adjust"].includes(type)) {
    res.status(400).json({ error: "itemId dan type (in/out/adjust) wajib" });
    return;
  }
  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    res.status(400).json({ error: "Quantity harus > 0" });
    return;
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }

  let newQty: number;
  if (type === "in") newQty = item.quantity + qty;
  else if (type === "out") {
    if (item.quantity < qty) {
      res.status(400).json({ error: `Stok tidak cukup (tersedia ${item.quantity})` });
      return;
    }
    newQty = item.quantity - qty;
  } else newQty = qty; // adjust = set langsung

  const [tx] = await prisma.$transaction([
    prisma.transaction.create({
      data: { itemId, type, quantity: qty, note: note || null },
      include: { item: true },
    }),
    prisma.item.update({ where: { id: itemId }, data: { quantity: newQty } }),
  ]);

  res.status(201).json(tx);
});
