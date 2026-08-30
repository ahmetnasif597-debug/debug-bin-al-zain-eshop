import { Router } from "express";
import { db } from "../db/index.js";
import { expensesTable } from "../db/schema/index.js";
import { eq, desc } from "drizzle-orm";
import { ensureDefaultAccounts, createJournalEntry, getAccountByCode, recordCashTransaction } from "../lib/accounting.js";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.user?.isAdmin) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/admin/expenses", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db.select().from(expensesTable).orderBy(desc(expensesTable.expenseDate)).limit(200);
    return res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
  } catch (err) { req.log.error({ err }, "Failed to list expenses"); return res.status(500).json({ error: "Internal server error" }); }
});

router.post("/admin/expenses", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { category, description, amount, expenseDate, paymentMethod, notes } = req.body;
    if (!category || amount == null) return res.status(400).json({ error: "category and amount required" });
    const [expense] = await db.insert(expensesTable).values({
      category, description: description ?? null, amount: String(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMethod: paymentMethod ?? "cash", notes: notes ?? null,
      createdBy: req.user?.isAdmin ? 1 : null,
    }).returning();

    await ensureDefaultAccounts();
    const expensesAcc = await getAccountByCode("601");
    const cashAcc = await getAccountByCode("101");
    if (expensesAcc && cashAcc) {
      await createJournalEntry({
        description: `مصروف: ${category} - ${description || ""}`,
        sourceType: "expense", sourceId: expense.id,
        lines: [
          { accountId: expensesAcc.id, debit: Number(amount), credit: 0, description: category },
          { accountId: cashAcc.id, debit: 0, credit: Number(amount), description: "دفع نقدي" },
        ],
        createdBy: req.user?.isAdmin ? 1 : null,
      });
      await recordCashTransaction({
        transactionType: "out", amount: Number(amount),
        description: `مصروف: ${category}`,
        referenceType: "expense", referenceId: expense.id,
        createdBy: req.user?.isAdmin ? 1 : null,
      });
    }
    return res.status(201).json({ ...expense, amount: Number(expense.amount) });
  } catch (err) { req.log.error({ err }, "Failed to create expense"); return res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/admin/expenses/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Expense not found" });
    await ensureDefaultAccounts();
    const expensesAcc = await getAccountByCode("601");
    const cashAcc = await getAccountByCode("101");
    if (expensesAcc && cashAcc) {
      await createJournalEntry({
        description: `عكس مصروف #${id}`,
        sourceType: "expense_reversal", sourceId: id,
        lines: [
          { accountId: expensesAcc.id, debit: 0, credit: Number(existing.amount), description: "عكس مصروف" },
          { accountId: cashAcc.id, debit: Number(existing.amount), credit: 0, description: "استرداد نقدي" },
        ],
        createdBy: req.user?.isAdmin ? 1 : null,
      });
    }
    await db.delete(expensesTable).where(eq(expensesTable.id, id));
    return res.status(204).send();
  } catch (err) { req.log.error({ err }, "Failed to delete expense"); return res.status(500).json({ error: "Internal server error" }); }
});

export default router;
