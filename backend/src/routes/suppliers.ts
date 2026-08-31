import { Router } from "express";
import { db } from "../db/index.js";
import { suppliersTable, purchasesTable, paymentsTable } from "../db/schema/index.js";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.user?.isAdmin) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/admin/suppliers", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const suppliers = await db.select().from(suppliersTable).orderBy(desc(suppliersTable.createdAt));
    return res.json(suppliers.map((s) => ({ ...s, balance: Number(s.balance), totalPurchases: Number(s.totalPurchases), totalPaid: Number(s.totalPaid) })));
  } catch (err) { req.log.error({ err }, "Failed to list suppliers"); return res.status(500).json({ error: "Internal server error" }); }
});

router.post("/admin/suppliers", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { name, phone, address, email, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const [supplier] = await db.insert(suppliersTable).values({ name, phone: phone ?? null, address: address ?? null, email: email ?? null, notes: notes ?? null }).returning();
    return res.status(201).json({ ...supplier, balance: 0, totalPurchases: 0, totalPaid: 0 });
  } catch (err) { req.log.error({ err }, "Failed to create supplier"); return res.status(500).json({ error: "Internal server error" }); }
});

router.put("/admin/suppliers/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const { name, phone, address, email, notes } = req.body;
    const [existing] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Supplier not found" });
    await db.update(suppliersTable).set({ name: name ?? existing.name, phone: phone ?? existing.phone, address: address ?? existing.address, email: email ?? existing.email, notes: notes ?? existing.notes }).where(eq(suppliersTable.id, id));
    const [updated] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id)).limit(1);
    return res.json({ ...updated, balance: Number(updated.balance), totalPurchases: Number(updated.totalPurchases), totalPaid: Number(updated.totalPaid) });
  } catch (err) { req.log.error({ err }, "Failed to update supplier"); return res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/admin/suppliers/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Supplier not found" });
    const purchaseCount = await db.$count(purchasesTable, eq(purchasesTable.supplierId, id));
    if (purchaseCount > 0) return res.status(400).json({ error: "Cannot delete supplier with existing purchases" });
    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    return res.status(204).send();
  } catch (err) { req.log.error({ err }, "Failed to delete supplier"); return res.status(500).json({ error: "Internal server error" }); }
});

router.get("/admin/suppliers/:id/statement", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id)).limit(1);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    const purchases = await db.select().from(purchasesTable).where(eq(purchasesTable.supplierId, id)).orderBy(desc(purchasesTable.invoiceDate));
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.supplierId, id)).orderBy(desc(paymentsTable.paidAt));
    const transactions = [
      ...purchases.map((p) => ({ date: p.invoiceDate.toISOString(), type: "purchase", description: `فاتورة شراء #${p.invoiceNumber}`, debit: Number(p.totalAmount), credit: 0, balance: 0 })),
      ...payments.map((p) => ({ date: p.paidAt.toISOString(), type: "payment", description: p.notes || "دفعة", debit: 0, credit: Number(p.amount), balance: 0 })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    for (const t of transactions) { runningBalance += t.debit - t.credit; t.balance = runningBalance; }
    return res.json({ supplier: { ...supplier, balance: Number(supplier.balance), totalPurchases: Number(supplier.totalPurchases), totalPaid: Number(supplier.totalPaid) }, transactions });
  } catch (err) { req.log.error({ err }, "Failed to get supplier statement"); return res.status(500).json({ error: "Internal server error" }); }
});

export default router;
