-- Accounting foundation migration.
-- Safe for existing installations: no DROP, DELETE, TRUNCATE, or data rewrites.

CREATE TABLE IF NOT EXISTS "accounting_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "account_type" text NOT NULL,
  "parent_id" integer,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "accounting_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "entry_number" text NOT NULL,
  "entry_date" timestamp DEFAULT now() NOT NULL,
  "description" text,
  "source_type" text,
  "source_id" integer,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_by" integer,
  "approved_by" integer,
  "approved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "journal_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal_entry_lines" (
  "id" serial PRIMARY KEY NOT NULL,
  "journal_entry_id" integer NOT NULL,
  "account_id" integer NOT NULL,
  "description" text,
  "debit" numeric(12, 2) DEFAULT '0' NOT NULL,
  "credit" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "movement_type" text NOT NULL,
  "quantity" numeric(12, 3) NOT NULL,
  "quantity_before" numeric(12, 3),
  "quantity_after" numeric(12, 3),
  "reason" text,
  "reference_type" text,
  "reference_id" integer,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "address" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" serial PRIMARY KEY NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "amount" numeric(12, 2) NOT NULL,
  "expense_date" timestamp DEFAULT now() NOT NULL,
  "payment_method" text,
  "notes" text,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "transaction_type" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "description" text,
  "reference_type" text,
  "reference_id" integer,
  "transaction_date" timestamp DEFAULT now() NOT NULL,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "direction" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "payment_method" text NOT NULL,
  "customer_id" integer,
  "supplier_id" integer,
  "reference_type" text,
  "reference_id" integer,
  "notes" text,
  "paid_at" timestamp DEFAULT now() NOT NULL,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" integer,
  "old_value" jsonb,
  "new_value" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE "products" ADD COLUMN "sku" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'barcode') THEN
    ALTER TABLE "products" ADD COLUMN "barcode" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'purchase_price') THEN
    ALTER TABLE "products" ADD COLUMN "purchase_price" numeric(10, 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'minimum_stock') THEN
    ALTER TABLE "products" ADD COLUMN "minimum_stock" numeric(10, 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'supplier_id') THEN
    ALTER TABLE "products" ADD COLUMN "supplier_id" integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'purchase_unit') THEN
    ALTER TABLE "products" ADD COLUMN "purchase_unit" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sales_unit') THEN
    ALTER TABLE "products" ADD COLUMN "sales_unit" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'units_per_purchase_unit') THEN
    ALTER TABLE "products" ADD COLUMN "units_per_purchase_unit" numeric(12, 3);
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_unique" ON "products" ("sku");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_barcode_unique" ON "products" ("barcode");
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_id_suppliers_id_fk'
  ) THEN
    ALTER TABLE "products"
      ADD CONSTRAINT "products_supplier_id_suppliers_id_fk"
      FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;