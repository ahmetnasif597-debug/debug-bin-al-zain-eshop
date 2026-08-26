-- Purchases and inventory-unit foundation.
-- Idempotent by design: no DROP, DELETE, TRUNCATE, RENAME, or data rewrites.

CREATE TABLE IF NOT EXISTS "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"invoice_date" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"remaining_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_method" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit" text NOT NULL,
	"units_per_purchase_unit" numeric(12, 3) NOT NULL,
	"base_quantity" numeric(12, 3) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "purchase_unit" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sales_unit" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "units_per_purchase_unit" numeric(12, 3);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "unit" text;
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "base_quantity" numeric(12, 3);
--> statement-breakpoint
DO $$
DECLARE
  invoice_number_attnum smallint;
BEGIN
  SELECT attnum
    INTO invoice_number_attnum
    FROM pg_attribute
   WHERE attrelid = 'purchases'::regclass
     AND attname = 'invoice_number'
     AND NOT attisdropped;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'purchases'::regclass
       AND (
         conname = 'purchases_invoice_number_unique'
         OR (
           contype IN ('u', 'p')
           AND conkey = ARRAY[invoice_number_attnum]::smallint[]
         )
       )
  )
  AND NOT EXISTS (
    SELECT 1
      FROM pg_index
     WHERE indrelid = 'purchases'::regclass
       AND indisunique
       AND indpred IS NULL
       AND indexprs IS NULL
       AND indnkeyatts = 1
       AND indkey[0] = invoice_number_attnum
  ) THEN
    ALTER TABLE "purchases"
      ADD CONSTRAINT "purchases_invoice_number_unique" UNIQUE ("invoice_number");
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'purchases'::regclass
       AND (
         conname = 'purchases_supplier_id_suppliers_id_fk'
         OR (
           contype = 'f'
           AND conkey = ARRAY[
             (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'purchases'::regclass
                 AND attname = 'supplier_id'
                 AND NOT attisdropped)
           ]::smallint[]
           AND confrelid = 'suppliers'::regclass
           AND confkey = ARRAY[
             (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'suppliers'::regclass
                 AND attname = 'id'
                 AND NOT attisdropped)
           ]::smallint[]
         )
       )
  ) THEN
    ALTER TABLE "purchases"
      ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk"
      FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'purchase_items'::regclass
       AND (
         conname = 'purchase_items_purchase_id_purchases_id_fk'
         OR (
           contype = 'f'
           AND conkey = ARRAY[
             (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'purchase_items'::regclass
                 AND attname = 'purchase_id'
                 AND NOT attisdropped)
           ]::smallint[]
           AND confrelid = 'purchases'::regclass
           AND confkey = ARRAY[
             (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'purchases'::regclass
                 AND attname = 'id'
                 AND NOT attisdropped)
           ]::smallint[]
         )
       )
  ) THEN
    ALTER TABLE "purchase_items"
      ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk"
      FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'purchase_items'::regclass
       AND (
         conname = 'purchase_items_product_id_products_id_fk'
         OR (
           contype = 'f'
           AND conkey = ARRAY[
             (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'purchase_items'::regclass
                 AND attname = 'product_id'
                 AND NOT attisdropped)
           ]::smallint[]
           AND confrelid = 'products'::regclass
           AND confkey = ARRAY[
             (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'products'::regclass
                 AND attname = 'id'
                 AND NOT attisdropped)
           ]::smallint[]
         )
       )
  ) THEN
    ALTER TABLE "purchase_items"
      ADD CONSTRAINT "purchase_items_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;