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

itemsRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const existing = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Barang tidak ditemukan" });
    return;
  }
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
