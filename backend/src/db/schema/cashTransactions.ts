import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

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

export const insertCashTransactionSchema = createInsertSchema(cashTransactionsTable).omit({ id: true, createdAt: true });
export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;
export type CashTransaction = typeof cashTransactionsTable.$inferSelect;
