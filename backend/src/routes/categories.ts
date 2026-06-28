import { Router } from "express";
import { db, categoriesTable } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/categories", async (_req: any, res: any) => {
  try {
    const all = await db.select().from(categoriesTable);
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب الفئات" });
  }
});

router.post("/categories", async (req: any, res: any) => {
  try {
    const { nameAr, nameEn, slug, icon, imageUrl, rowNumber } = req.body;
    const [cat] =
