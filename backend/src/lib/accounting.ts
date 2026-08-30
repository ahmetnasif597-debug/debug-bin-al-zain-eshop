import { db } from "../db/index.js";
import {
  journalEntriesTable,
  journalEntryLinesTable,
  accountingAccountsTable,
  inventoryMovementsTable,
  productsTable,
  paymentsTable,
  cashTransactionsTable,
} from "../db/schema/index.js";
import { eq, and, sql, desc } from "drizzle-orm";

export const ACCOUNT_CODES = {
  CASH: "101",
  BANK: "102",
  INVENTORY: "105",
  CUSTOMERS: "110",
  SUPPLIERS: "210",
  SALES: "401",
  PURCHASES: "501",
  EXPENSES: "601",
  CAPITAL: "301",
  RETAINED_EARNINGS: "302",
} as const;

export async function ensureDefaultAccounts() {
  const defaults = [
    { code: "101", name: "الصندوق", accountType: "asset" },
    { code: "102", name: "البنك", accountType: "asset" },
    { code: "105", name: "المخزون", accountType: "asset" },
    { code: "110", name: "العملاء", accountType: "asset" },
    { code: "210", name: "الموردين", accountType: "liability" },
    { code: "301", name: "رأس المال", accountType: "equity" },
    { code: "302", name: "الأرباح المحتجزة", accountType: "equity" },
    { code: "401", name: "المبيعات", accountType: "revenue" },
    { code: "501", name: "المشتريات", accountType: "expense" },
    { code: "502", name: "تكلفة البضاعة المباعة", accountType: "expense" },
    { code: "601", name: "المصروفات العامة", accountType: "expense" },
  ];

  for (const acc of defaults) {
    const existing = await db.select().from(accountingAccountsTable).where(eq(accountingAccountsTable.code, acc.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(accountingAccountsTable).values(acc);
    }
  }
}

export async function getNextEntryNumber(): Promise<string> {
  const result = await db
    .select({ maxNum: sql<string>`MAX(CAST(SUBSTRING(${journalEntriesTable.entryNumber}, 4) AS INTEGER))` })
    .from(journalEntriesTable)
    .where(sql`${journalEntriesTable.entryNumber} LIKE 'QE-%'`);
  const nextNum = (parseInt(result[0]?.maxNum ?? "0", 10) || 0) + 1;
  return `QE-${String(nextNum).padStart(6, "0")}`;
}

export async function createJournalEntry(params: {
  description: string;
  sourceType: string;
  sourceId: number;
  lines: { accountId: number; debit: number; credit: number; description?: string }[];
  createdBy?: number;
}) {
  const totalDebit = params.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = params.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Journal entry not balanced: debit=${totalDebit}, credit=${totalCredit}`);
  }
  const entryNumber = await getNextEntryNumber();
  const [entry] = await db.insert(journalEntriesTable).values({
    entryNumber,
    description: params.description,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    status: "posted",
    createdBy: params.createdBy,
  }).returning();

  for (const line of params.lines) {
    await db.insert(journalEntryLinesTable).values({
      journalEntryId: entry.id,
      accountId: line.accountId,
      description: line.description || params.description,
      debit: String(line.debit || 0),
      credit: String(line.credit || 0),
    });
  }
  return entry;
}

export async function getAccountByCode(code: string) {
  const [acc] = await db.select().from(accountingAccountsTable).where(eq(accountingAccountsTable.code, code)).limit(1);
  return acc;
}

export async function recordInventoryMovement(params: {
  productId: number;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  unit: string;
  baseQuantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  referenceType: string;
  referenceId: number;
  createdBy?: number;
}) {
  await db.insert(inventoryMovementsTable).values({
    productId: params.productId,
    movementType: params.movementType,
    quantity: String(params.quantity),
    unit: params.unit,
    baseQuantity: String(params.baseQuantity),
    quantityBefore: String(params.quantityBefore),
    quantityAfter: String(params.quantityAfter),
    reason: params.reason,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    createdBy: params.createdBy,
  });
}

export async function recordCashTransaction(params: {
  transactionType: "in" | "out";
  amount: number;
  description: string;
  referenceType: string;
  referenceId: number;
  createdBy?: number;
}) {
  await db.insert(cashTransactionsTable).values({
    transactionType: params.transactionType,
    amount: String(params.amount),
    description: params.description,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    createdBy: params.createdBy,
  });
}

export async function recordPayment(params: {
  direction: "in" | "out";
  amount: number;
  paymentMethod: string;
  customerId?: number;
  supplierId?: number;
  referenceType: string;
  referenceId: number;
  notes?: string;
  createdBy?: number;
}) {
  await db.insert(paymentsTable).values({
    direction: params.direction,
    amount: String(params.amount),
    paymentMethod: params.paymentMethod,
    customerId: params.customerId ?? null,
    supplierId: params.supplierId ?? null,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    notes: params.notes,
    createdBy: params.createdBy,
  });
}

export async function getAccountBalance(accountId: number): Promise<number> {
  const result = await db
    .select({
      totalDebit: sql<number>`COALESCE(SUM(${journalEntryLinesTable.debit}), 0)`,
      totalCredit: sql<number>`COALESCE(SUM(${journalEntryLinesTable.credit}), 0)`,
    })
    .from(journalEntryLinesTable)
    .innerJoin(journalEntriesTable, eq(journalEntryLinesTable.journalEntryId, journalEntriesTable.id))
    .where(and(eq(journalEntryLinesTable.accountId, accountId), eq(journalEntriesTable.status, "posted")));
  const [acc] = await db.select().from(accountingAccountsTable).where(eq(accountingAccountsTable.id, accountId)).limit(1);
  const debit = Number(result[0]?.totalDebit ?? 0);
  const credit = Number(result[0]?.totalCredit ?? 0);
  if (acc?.accountType === "asset" || acc?.accountType === "expense") {
    return debit - credit;
  }
  return credit - debit;
}
