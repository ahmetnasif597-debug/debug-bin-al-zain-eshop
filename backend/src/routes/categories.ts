import { Router } from "express";
import { db, categoriesTable } from "../db";
import { eq } from "drizzle-orm";
const router = Router();
router.get("/categories", async (_req: any, res: any) => {
try { res.json(await db.select().from(categoriesTable)); }
catch { res.status(500).json({ error: "خطأ" }); }
});router.post("/categories", async (req: any, res: any) => {
try {
const [cat] = await db.insert(categoriesTable).values(req.body).returning();
res.json(cat);
} catch { res.status(5router.put("/categories/:id", async (req: any, res: any) => {
try {
const [cat] = await db.update(categoriesTable).set(req.body).where(eq(categoriesTable.id, Number(req.params.id))).returning();
res.json(cat);
} catch { res.status(500).json({ error: "خطأ" }); }
});router.delete("/categories/:id", async (req: any, res: any) => {
try {
await db.delete(categoriesTable).where(eq(categoriesTable.id, Number(req.params.id)));
res.json({ success: true });
} catch { res.status(500).json({ error: "خطأ" }); }
});
export default router;
