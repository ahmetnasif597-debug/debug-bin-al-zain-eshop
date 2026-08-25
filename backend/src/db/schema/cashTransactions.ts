import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";

export const cashTransactionsTable = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  transactionType: text("transaction_type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CashTransaction = typeof cashTransactionsTable.$inferSelect;