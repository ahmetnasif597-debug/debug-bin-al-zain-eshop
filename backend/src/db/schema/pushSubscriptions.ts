import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  // null = اشتراك أدمن، رقم = اشتراك زبون
  customerId: integer("customer_id").references(() => customersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;
