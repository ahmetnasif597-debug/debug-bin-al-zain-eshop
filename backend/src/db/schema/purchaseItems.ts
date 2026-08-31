import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { purchasesTable } from "./purchases";
import { productsTable } from "./products";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchaseItemsTable = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchasesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  unitsPerPurchaseUnit: numeric("units_per_purchase_unit", { precision: 12, scale: 3 }).notNull(),
  baseQuantity: numeric("base_quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItemsTable).omit({ id: true, createdAt: true });
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type PurchaseItem = typeof purchaseItemsTable.$inferSelect;
