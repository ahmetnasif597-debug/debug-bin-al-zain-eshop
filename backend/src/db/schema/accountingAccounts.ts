import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const accountingAccountsTable = pgTable("accounting_accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  accountType: text("account_type").notNull(),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AccountingAccount = typeof accountingAccountsTable.$inferSelect;