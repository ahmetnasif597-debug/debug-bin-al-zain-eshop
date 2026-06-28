import { Router } from "express";
import { db } from "../db";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// جلب كل الفئات
router.get("/categories", async (_req: any, res: any) => {
  try {
    const all = await db.select().from(categories);
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب الفئات" });
  }
});

// إضافة فئة
router.post("/categories", async (req: any, res: any) => {
  try {
    const { nameAr, nameEn, slug, icon, imageUrl, rowNumber } = req.body;
    const [cat] = await db.insert(categories).values({
      nameAr, nameEn, slug, icon, imageUrl, rowNumber
    }).returning();
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: "فشل في إضافة الفئة" });
  }
});

// تعديل فئة
router.put("/categories/:id", async (req: any, res: any) => {
  try {
    const { nameAr, nameEn, slug, icon, imageUrl, rowNumber } = req.body;
    const [cat] = await db.update(categories).set({
      nameAr, nameEn, slug, icon, imageUrl, rowNumber
    }).where(eq(categories.id, Number(req.params.id))).returning();
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: "فشل في تعديل الفئة" });
  }
});

// حذف فئة
router.delete("/categories/:id", async (req: any, res: any) => {
  try {
    await db.delete(categories).where(eq(categories.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "فشل في حذف الفئة" });
  }
});

export default router;
