import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
});

categoriesRouter.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Nama wajib" });
    return;
  }
  try {
    const cat = await prisma.category.create({ data: { name } });
    res.status(201).json(cat);
  } catch {
    res.status(409).json({ error: "Kategori sudah ada" });
  }
});
