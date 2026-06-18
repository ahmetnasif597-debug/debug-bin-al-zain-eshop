import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'offer' | 'discount' | 'warning'
  title: text("title").notNull(),
  body: text("body").notNull(),
  customerId: integer("customer_id").references(() => customersTable.id, { onDelete: "cascade" }), // null = broadcast
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationReadsTable = pgTable("notification_reads", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notificationsTable.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NotificationRead = typeof notificationReadsTable.$inferSelect;
