import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";

export const inventoryMovementsTable = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  movementType: text("movement_type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  quantityBefore: numeric("quantity_before", { precision: 12, scale: 3 }),
  quantityAfter: numeric("quantity_after", { precision: 12, scale: 3 }),
  reason: text("reason"),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InventoryMovement = typeof inventoryMovementsTable.$inferSelect;