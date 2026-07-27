import { Router } from "express";
import { db, bannersTable } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/banners", async (_req: any, res: any) => {
  try {
    const all = await db.select().from(bannersTable);
    res.json(all);
  } catch {
    res.status(500).json({ error: "فشل في جلب البانرات" });
  }
});

router.post("/banners", async (req: any, res: any) => {
  try {
    const [banner] = await db.insert(bannersTable).values(req.body).returning();
    res.json(banner);
  } catch {
    res.status(500).json({ error: "فشل في إضافة البانر" });
  }
});

router.put("/banners/:id", async (req: any, res: any) => {
  try {
    const [banner] = await db.update(bannersTable).set(req.body).where(eq(bannersTable.id, Number(req.params.id))).returning();
    res.json(banner);
  } catch {
    res.status(500).json({ error: "فشل في تعديل البانر" });
  }
});

router.delete("/banners/:id", async (req: any, res: any) => {
  try {
    await db.delete(bannersTable).where(eq(bannersTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "فشل في حذف البانر" });
  }
});

export default router;
