import { pgTable, serial, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  email: text("email"),
  notes: text("notes"),
  // NEW: accounting fields (safe migration)
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPurchases: numeric("total_purchases", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Supplier = typeof suppliersTable.$inferSelect;
