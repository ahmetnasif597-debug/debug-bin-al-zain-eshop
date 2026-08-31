import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { suppliersTable } from "./suppliers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchasesTable = pgTable("purchases", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull().references(() => suppliersTable.id, { onDelete: "restrict" }),
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method"),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
