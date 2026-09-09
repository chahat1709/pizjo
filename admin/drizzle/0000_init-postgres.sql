CREATE TYPE "public"."access_role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."applies_to" AS ENUM('order', 'category', 'menu_item');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed', 'bogo', 'free_item');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'void');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'expired');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('whatsapp', 'walk_in', 'phone', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'upi', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('instagram', 'facebook', 'zomato', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stock_reason" AS ENUM('opening', 'restock', 'usage', 'adjustment', 'waste');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actorUserId" integer,
	"employeeId" integer,
	"action" varchar(140) NOT NULL,
	"entityType" varchar(80) NOT NULL,
	"entityId" varchar(80),
	"detail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "business_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"businessName" varchar(180) NOT NULL,
	"address" text,
	"phone" varchar(32),
	"gstin" varchar(32),
	"invoicePrefix" varchar(24) DEFAULT 'PIZ' NOT NULL,
	"taxRateBps" integer DEFAULT 0 NOT NULL,
	"updatedById" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employees_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"fullName" varchar(180) NOT NULL,
	"phone" varchar(32),
	"email" varchar(320),
	"jobTitle" varchar(120),
	"accessRole" "access_role" DEFAULT 'staff' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inventory_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(180) NOT NULL,
	"sku" varchar(80),
	"unit" varchar(30) NOT NULL,
	"currentStock" integer DEFAULT 0 NOT NULL,
	"lowStockThreshold" integer DEFAULT 0 NOT NULL,
	"linkedMenuItemId" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoiceNumber" varchar(48) NOT NULL,
	"orderId" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'issued' NOT NULL,
	"customerName" varchar(180),
	"customerPhone" varchar(32),
	"subtotalPaise" integer NOT NULL,
	"taxPaise" integer DEFAULT 0 NOT NULL,
	"discountPaise" integer DEFAULT 0 NOT NULL,
	"totalPaise" integer NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	"createdById" integer NOT NULL,
	CONSTRAINT "invoices_invoiceNumber_unique" UNIQUE("invoiceNumber"),
	CONSTRAINT "invoices_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "menu_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"catalogKey" varchar(180) NOT NULL,
	"name" varchar(180) NOT NULL,
	"sortOrder" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_categories_catalogKey_unique" UNIQUE("catalogKey")
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "menu_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"catalogId" varchar(240) NOT NULL,
	"categoryId" integer NOT NULL,
	"name" varchar(240) NOT NULL,
	"description" text,
	"imageUrl" text,
	"pricePaise" integer NOT NULL,
	"isVegetarian" boolean DEFAULT true NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"isOutOfStock" boolean DEFAULT false NOT NULL,
	"sortOrder" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_items_catalogId_unique" UNIQUE("catalogId")
);
--> statement-breakpoint
CREATE TABLE "offer_campaigns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "offer_campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(180) NOT NULL,
	"displayLabel" varchar(80) NOT NULL,
	"description" text,
	"terms" text,
	"promoCode" varchar(48),
	"discountType" "discount_type" NOT NULL,
	"discountValue" integer DEFAULT 0 NOT NULL,
	"minimumOrderPaise" integer DEFAULT 0 NOT NULL,
	"maximumDiscountPaise" integer,
	"appliesTo" "applies_to" DEFAULT 'order' NOT NULL,
	"menuItemId" integer,
	"categoryId" integer,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"startsAt" timestamp,
	"endsAt" timestamp,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"createdById" integer NOT NULL,
	"updatedById" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offer_campaigns_promoCode_unique" UNIQUE("promoCode")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"orderId" integer NOT NULL,
	"menuItemId" integer,
	"catalogId" varchar(240),
	"itemName" varchar(240) NOT NULL,
	"unitPricePaise" integer NOT NULL,
	"quantity" integer NOT NULL,
	"lineTotalPaise" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"orderNumber" varchar(40) NOT NULL,
	"source" "order_source" DEFAULT 'whatsapp' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"customerName" varchar(180),
	"customerPhone" varchar(32),
	"notes" text,
	"paymentMethod" "payment_method" DEFAULT 'cash' NOT NULL,
	"paymentStatus" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"subtotalPaise" integer NOT NULL,
	"taxPaise" integer DEFAULT 0 NOT NULL,
	"discountPaise" integer DEFAULT 0 NOT NULL,
	"totalPaise" integer NOT NULL,
	"placedAt" timestamp DEFAULT now() NOT NULL,
	"deliveredAt" timestamp,
	"createdById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shifts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employeeId" integer NOT NULL,
	"startsAt" timestamp NOT NULL,
	"endsAt" timestamp NOT NULL,
	"status" "shift_status" DEFAULT 'scheduled' NOT NULL,
	"note" text,
	"createdById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"platform" "platform" NOT NULL,
	"handle" varchar(180) NOT NULL,
	"url" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"updatedById" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_accounts_platform_unique" UNIQUE("platform")
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"socialAccountId" integer,
	"platform" "platform" NOT NULL,
	"title" varchar(240) NOT NULL,
	"caption" text NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"scheduledAt" timestamp,
	"publishedAt" timestamp,
	"createdById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stock_movements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"inventoryItemId" integer NOT NULL,
	"changeQuantity" integer NOT NULL,
	"reason" "stock_reason" NOT NULL,
	"note" text,
	"performedById" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(64) NOT NULL,
	"passwordHash" text NOT NULL,
	"name" text,
	"email" varchar(320),
	"role" "role" DEFAULT 'staff' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorUserId_users_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_employeeId_employees_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_updatedById_users_id_fk" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_linkedMenuItemId_menu_items_id_fk" FOREIGN KEY ("linkedMenuItemId") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_users_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_menu_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."menu_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_campaigns" ADD CONSTRAINT "offer_campaigns_menuItemId_menu_items_id_fk" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_campaigns" ADD CONSTRAINT "offer_campaigns_categoryId_menu_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_campaigns" ADD CONSTRAINT "offer_campaigns_createdById_users_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_campaigns" ADD CONSTRAINT "offer_campaigns_updatedById_users_id_fk" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_menu_items_id_fk" FOREIGN KEY ("menuItemId") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_users_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employeeId_employees_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_createdById_users_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_updatedById_users_id_fk" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_socialAccountId_social_accounts_id_fk" FOREIGN KEY ("socialAccountId") REFERENCES "public"."social_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_createdById_users_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventoryItemId_inventory_items_id_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performedById_users_id_fk" FOREIGN KEY ("performedById") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_employee_created_idx" ON "activity_logs" USING btree ("employeeId","createdAt");--> statement-breakpoint
CREATE INDEX "employees_active_idx" ON "employees" USING btree ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_sku_unique" ON "inventory_items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "inventory_menu_item_idx" ON "inventory_items" USING btree ("linkedMenuItemId");--> statement-breakpoint
CREATE INDEX "invoices_issued_at_idx" ON "invoices" USING btree ("issuedAt");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "offer_campaigns_status_window_idx" ON "offer_campaigns" USING btree ("status","startsAt","endsAt");--> statement-breakpoint
CREATE INDEX "offer_campaigns_menu_item_idx" ON "offer_campaigns" USING btree ("menuItemId");--> statement-breakpoint
CREATE INDEX "offer_campaigns_category_idx" ON "offer_campaigns" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "orders_status_placed_idx" ON "orders" USING btree ("status","placedAt");--> statement-breakpoint
CREATE INDEX "orders_customer_phone_idx" ON "orders" USING btree ("customerPhone");--> statement-breakpoint
CREATE INDEX "shifts_employee_start_idx" ON "shifts" USING btree ("employeeId","startsAt");--> statement-breakpoint
CREATE INDEX "social_posts_status_scheduled_idx" ON "social_posts" USING btree ("status","scheduledAt");--> statement-breakpoint
CREATE INDEX "stock_movements_item_created_idx" ON "stock_movements" USING btree ("inventoryItemId","createdAt");