import { Router } from "express";
import { db } from "../db";
import { categoriesTable } from "../db/schema/categories";
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
    const [cat] = await db.insert(categoriesTable).values({
      nameAr, nameEn, slug, icon: icon || "🛒", imageUrl, rowNumber: rowNumber || 1
    }).returning();
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: "فشل في إضافة الفئة" });
  }
});

router.put("/categories/:id", async (req: any, res: any) => {
  try {
    const { nameAr, nameEn, slug, icon, imageUrl, rowNumber } = req.body;
    const [cat] = await db.update(categoriesTable).set({
      nameAr, nameEn, slug, icon: icon || "🛒", imageUrl, rowNumber: rowNumber || 1
    }).where(eq(categoriesTable.id, Number(req.params.id))).returning();
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: "فشل في تعديل الفئة" });
  }
});

router.delete("/categories/:id", async (req: any, res: any) => {
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "فشل في حذف الفئة" });
  }
});

export default router;
