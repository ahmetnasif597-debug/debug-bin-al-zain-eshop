import { Router, Request, Response } from "express"; // أضفنا Request و Response هنا
import { db, categoriesTable } from "../db";
import { eq } from "drizzle-orm";
import { GetCategoryParams, CreateCategoryBody, UpdateCategoryBody } from "../schemas";

const router = Router();

// تعريف الأنواع هنا يحل خطأ الـ any
function requireAdmin(req: Request, res: Response): boolean {
  // ملاحظة: إذا كان session.isAdmin يسبب خطأ، قد تحتاج لإضافة النوع الخاص بك للـ Request
  if (!(req as any).session.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
    return res.json(categories);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to list categories"); // استخدام as any للمكتبات الخارجية مثل Logger
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = CreateCategoryBody.parse(req.body);
    const [category] = await db.insert(categoriesTable).values(body).returning();
    return res.status(201).json(category);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to create category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories/:id", async (req: Request, res: Response) => {
  try {
    const { id } = GetCategoryParams.parse({ id: Number(req.params.id) });
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    if (!category) return res.status(404).json({ error: "Category not found" });
    return res.json(category);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/categories/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = GetCategoryParams.parse({ id: Number(req.params.id) });
    const body = UpdateCategoryBody.parse(req.body);
    const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    if (!existing) return res.status(404).json({ error: "Category not found" });

    const [category] = await db
      .update(categoriesTable)
      .set(body)
      .where(eq(categoriesTable.id, id))
      .returning();
    return res.json(category);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to update category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categories/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = GetCategoryParams.parse({ id: Number(req.params.id) });
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    (req as any).log.error({ err }, "Failed to delete delete category");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
