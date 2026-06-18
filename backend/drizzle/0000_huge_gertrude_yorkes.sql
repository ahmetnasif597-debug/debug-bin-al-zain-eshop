CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text DEFAULT '🛒' NOT NULL,
	"image_url" text,
	"product_count" integer DEFAULT 0 NOT NULL,
	"row_number" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"price" numeric(10, 2) NOT NULL,
	"unit" text DEFAULT 'كيلو' NOT NULL,
	"price_per_unit" text,
	"category_id" integer NOT NULL,
	"image_url" text,
	"in_stock" boolean DEFAULT true NOT NULL,
	"stock_quantity" numeric(10, 3),
	"featured" boolean DEFAULT false NOT NULL,
	"sold_by_weight" boolean DEFAULT false NOT NULL,
	"available_weights" jsonb,
	"allow_custom_weight" boolean DEFAULT false NOT NULL,
	"available_flavors" jsonb
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"customer_name" text,
	"customer_phone" text,
	"items" jsonb NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"customer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;