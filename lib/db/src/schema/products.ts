import {
  pgTable,
  serial,
  text,
  numeric,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),

  // معلومات المنتج
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),

  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),

  // البيع
  price: numeric("price", {
    precision: 10,
    scale: 2,
  }).notNull(),

  unit: text("unit").notNull().default("كيلو"),
  pricePerUnit: text("price_per_unit"),

  // التصنيف والصورة
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),

  // المخزون
  inStock: boolean("in_stock").notNull().default(true),

  stockQuantity: numeric("stock_quantity", {
    precision: 10,
    scale: 3,
  }),

  minimumStock: numeric("minimum_stock", {
    precision: 10,
    scale: 3,
  }),

  // المنتج المميز
  featured: boolean("featured").notNull().default(false),

  // البيع بالوزن
  soldByWeight: boolean("sold_by_weight").notNull().default(false),

  availableWeights: jsonb("available_weights").$type<number[]>(),

  allowCustomWeight: boolean("allow_custom_weight")
    .notNull()
    .default(false),

  // النكهات
  availableFlavors: jsonb("available_flavors").$type<string[]>(),

  // ترتيب المنتج
  sortOrder: integer("sort_order").notNull().default(0),

  // كود المنتج والباركود
  sku: text("sku"),
  barcode: text("barcode"),

  // المحاسبة والمشتريات
  purchasePrice: numeric("purchase_price", {
    precision: 10,
    scale: 2,
  }),

  supplierId: integer("supplier_id"),

  purchaseUnit: text("purchase_unit"),
  salesUnit: text("sales_unit"),

  // مثال:
  // كرتونة = 24 قطعة
  unitsPerPurchaseUnit: integer("units_per_purchase_unit"),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Product = typeof productsTable.$inferSelect;
