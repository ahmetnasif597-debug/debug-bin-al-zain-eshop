import { pgTable, serial, text, numeric, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export interface ProductSalesBreakdown {
  productId: number;
  nameAr: string;
  quantity: number;
  revenue: number;
}

// جدول خفيف يخزن ملخص كل يوم (رقم واحد بالمبيعات + توزيع المنتجات)
// بيضل صغير ودايم بغض النظر عن عدد الطلبات الفعلية بجدول orders
export const dailySalesSummaryTable = pgTable("daily_sales_summary", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // بصيغة YYYY-MM-DD
  totalSales: numeric("total_sales", { precision: 12, scale: 2 }).notNull(),
  orderCount: integer("order_count").notNull(),
  productBreakdown: jsonb("product_breakdown").$type<ProductSalesBreakdown[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DailySalesSummary = typeof dailySalesSummaryTable.$inferSelect;
