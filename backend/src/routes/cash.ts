import { Router } from "express";
import { db } from "../db/index.js";
import { cashTransactionsTable, paymentsTable } from "../db/schema/index.js";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.user?.isAdmin) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/admin/cash/transactions", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db.select().from(cashTransactionsTable).orderBy(desc(cashTransactionsTable.transactionDate)).limit(200);
    return res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
  } catch (err) { req.log.error({ err }, "Failed to list cash"); return res.status(500).json({ error: "Internal server error" }); }
});

router.get("/admin/cash/balance", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const inR = await db.select({ total: sql<number>`COALESCE(SUM(${cashTransactionsTable.amount}),0)` }).from(cashTransactionsTable).where(eq(cashTransactionsTable.transactionType, "in"));
    const outR = await db.select({ total: sql<number>`COALESCE(SUM(${cashTransactionsTable.amount}),0)` }).from(cashTransactionsTable).where(eq(cashTransactionsTable.transactionType, "out"));
    const balance = Number(inR[0]?.total ?? 0) - Number(outR[0]?.total ?? 0);
    return res.json({ balance, totalIn: Number(inR[0]?.total ?? 0), totalOut: Number(outR[0]?.total ?? 0) });
  } catch (err) { req.log.error({ err }, "Failed to get cash balance"); return res.status(500).json({ error: "Internal server error" }); }
});

router.get("/admin/cash/payments", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.paidAt)).limit(200);
    return res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
  } catch (err) { req.log.error({ err }, "Failed to list payments"); return res.status(500).json({ error: "Internal server error" }); }
});

export default router;
