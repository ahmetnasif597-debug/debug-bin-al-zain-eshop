import { pgTable, serial, text, numeric, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { suppliersTable } from "./suppliers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("كيلو"),
  pricePerUnit: text("price_per_unit"),
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  stockQuantity: numeric("stock_quantity", { precision: 10, scale: 3 }),
  featured: boolean("featured").notNull().default(false),
  soldByWeight: boolean("sold_by_weight").notNull().default(false),
  availableWeights: jsonb("available_weights").$type<number[]>(),
  allowCustomWeight: boolean("allow_custom_weight").notNull().default(false),
  availableFlavors: jsonb("available_flavors").$type<string[]>(),
  sortOrder: integer("sort_order").notNull().default(0),
  sku: text("sku").unique(),
  barcode: text("barcode").unique(),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  minimumStock: numeric("minimum_stock", { precision: 10, scale: 3 }),
  supplierId: integer("supplier_id").references(() => suppliersTable.id, { onDelete: "set null" }),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
