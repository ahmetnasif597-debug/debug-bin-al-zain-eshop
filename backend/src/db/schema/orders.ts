import { pgTable, serial, text, numeric, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";

export const OrderItemSchema = z.object({
  productId: z.number(),
  nameAr: z.string(),
  price: z.number(),
  quantity: z.number(),
  selectedWeight: z.number().nullable().optional(),
  lineTotal: z.number(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id, { onDelete: "set null" }),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
