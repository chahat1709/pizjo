import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Pizjo Admin schema — PostgreSQL (Neon-ready).
 * Ported from the original MySQL schema for the Vercel + Neon migration.
 * Conventions: paise integers for money, camelCase columns, soft status machines.
 */

export const roleEnum = pgEnum("role", ["admin", "staff"]);
export const orderSourceEnum = pgEnum("order_source", ["whatsapp", "walk_in", "phone", "other"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "preparing", "ready", "delivered", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "upi", "card", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);
export const stockReasonEnum = pgEnum("stock_reason", ["opening", "restock", "usage", "adjustment", "waste"]);
export const accessRoleEnum = pgEnum("access_role", ["admin", "staff"]);
export const shiftStatusEnum = pgEnum("shift_status", ["scheduled", "completed", "cancelled"]);
export const platformEnum = pgEnum("platform", ["instagram", "facebook", "zomato", "whatsapp"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "scheduled", "published"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed", "bogo", "free_item"]);
export const appliesToEnum = pgEnum("applies_to", ["order", "category", "menu_item"]);
export const offerStatusEnum = pgEnum("offer_status", ["draft", "scheduled", "active", "paused", "expired"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "issued", "void"]);

/**
 * Local credential login (see server/auth/).
 * The first user created via /api/auth/setup becomes admin.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role").default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export const menuCategories = pgTable("menu_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  catalogKey: varchar("catalogKey", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  sortOrder: integer("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    catalogId: varchar("catalogId", { length: 240 }).notNull().unique(),
    categoryId: integer("categoryId").notNull().references(() => menuCategories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 240 }).notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    pricePaise: integer("pricePaise").notNull(),
    isVegetarian: boolean("isVegetarian").default(true).notNull(),
    isAvailable: boolean("isAvailable").default(true).notNull(),
    isOutOfStock: boolean("isOutOfStock").default(false).notNull(),
    sortOrder: integer("sortOrder").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("menu_items_category_idx").on(table.categoryId)],
);

export const orders = pgTable(
  "orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderNumber: varchar("orderNumber", { length: 40 }).notNull().unique(),
    source: orderSourceEnum("source").default("whatsapp").notNull(),
    status: orderStatusEnum("status").default("pending").notNull(),
    customerName: varchar("customerName", { length: 180 }),
    customerPhone: varchar("customerPhone", { length: 32 }),
    notes: text("notes"),
    paymentMethod: paymentMethodEnum("paymentMethod").default("cash").notNull(),
    paymentStatus: paymentStatusEnum("paymentStatus").default("unpaid").notNull(),
    subtotalPaise: integer("subtotalPaise").notNull(),
    taxPaise: integer("taxPaise").default(0).notNull(),
    discountPaise: integer("discountPaise").default(0).notNull(),
    totalPaise: integer("totalPaise").notNull(),
    placedAt: timestamp("placedAt").defaultNow().notNull(),
    deliveredAt: timestamp("deliveredAt"),
    createdById: integer("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("orders_status_placed_idx").on(table.status, table.placedAt), index("orders_customer_phone_idx").on(table.customerPhone)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: integer("menuItemId").references(() => menuItems.id, { onDelete: "set null" }),
    catalogId: varchar("catalogId", { length: 240 }),
    itemName: varchar("itemName", { length: 240 }).notNull(),
    unitPricePaise: integer("unitPricePaise").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalPaise: integer("lineTotalPaise").notNull(),
  },
  table => [index("order_items_order_idx").on(table.orderId)],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 80 }),
    unit: varchar("unit", { length: 30 }).notNull(),
    currentStock: integer("currentStock").default(0).notNull(),
    lowStockThreshold: integer("lowStockThreshold").default(0).notNull(),
    linkedMenuItemId: integer("linkedMenuItemId").references(() => menuItems.id, { onDelete: "set null" }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("inventory_sku_unique").on(table.sku), index("inventory_menu_item_idx").on(table.linkedMenuItemId)],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    inventoryItemId: integer("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    changeQuantity: integer("changeQuantity").notNull(),
    reason: stockReasonEnum("reason").notNull(),
    note: text("note"),
    performedById: integer("performedById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("stock_movements_item_created_idx").on(table.inventoryItemId, table.createdAt)],
);

export const businessSettings = pgTable("business_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  businessName: varchar("businessName", { length: 180 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  gstin: varchar("gstin", { length: 32 }),
  invoicePrefix: varchar("invoicePrefix", { length: 24 }).default("PIZ").notNull(),
  taxRateBps: integer("taxRateBps").default(0).notNull(),
  updatedById: integer("updatedById").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    invoiceNumber: varchar("invoiceNumber", { length: 48 }).notNull().unique(),
    orderId: integer("orderId").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
    status: invoiceStatusEnum("status").default("issued").notNull(),
    customerName: varchar("customerName", { length: 180 }),
    customerPhone: varchar("customerPhone", { length: 32 }),
    subtotalPaise: integer("subtotalPaise").notNull(),
    taxPaise: integer("taxPaise").default(0).notNull(),
    discountPaise: integer("discountPaise").default(0).notNull(),
    totalPaise: integer("totalPaise").notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
    createdById: integer("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
  },
  table => [index("invoices_issued_at_idx").on(table.issuedAt)],
);

export const employees = pgTable(
  "employees",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("userId").unique().references(() => users.id, { onDelete: "set null" }),
    fullName: varchar("fullName", { length: 180 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 320 }),
    jobTitle: varchar("jobTitle", { length: 120 }),
    accessRole: accessRoleEnum("accessRole").default("staff").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("employees_active_idx").on(table.isActive)],
);

export const shifts = pgTable(
  "shifts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    employeeId: integer("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt").notNull(),
    status: shiftStatusEnum("status").default("scheduled").notNull(),
    note: text("note"),
    createdById: integer("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("shifts_employee_start_idx").on(table.employeeId, table.startsAt)],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    actorUserId: integer("actorUserId").references(() => users.id, { onDelete: "set null" }),
    employeeId: integer("employeeId").references(() => employees.id, { onDelete: "set null" }),
    action: varchar("action", { length: 140 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: varchar("entityId", { length: 80 }),
    detail: text("detail"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("activity_logs_employee_created_idx").on(table.employeeId, table.createdAt)],
);

export const socialAccounts = pgTable("social_accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  platform: platformEnum("platform").notNull().unique(),
  handle: varchar("handle", { length: 180 }).notNull(),
  url: text("url").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  updatedById: integer("updatedById").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const socialPosts = pgTable(
  "social_posts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    socialAccountId: integer("socialAccountId").references(() => socialAccounts.id, { onDelete: "set null" }),
    platform: platformEnum("platform").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    caption: text("caption").notNull(),
    status: postStatusEnum("status").default("draft").notNull(),
    scheduledAt: timestamp("scheduledAt"),
    publishedAt: timestamp("publishedAt"),
    createdById: integer("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [index("social_posts_status_scheduled_idx").on(table.status, table.scheduledAt)],
);

export const offerCampaigns = pgTable(
  "offer_campaigns",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 180 }).notNull(),
    displayLabel: varchar("displayLabel", { length: 80 }).notNull(),
    description: text("description"),
    terms: text("terms"),
    promoCode: varchar("promoCode", { length: 48 }).unique(),
    discountType: discountTypeEnum("discountType").notNull(),
    /** Percentage offers use basis points (e.g. 1500 = 15%); fixed offers use paise. */
    discountValue: integer("discountValue").default(0).notNull(),
    minimumOrderPaise: integer("minimumOrderPaise").default(0).notNull(),
    maximumDiscountPaise: integer("maximumDiscountPaise"),
    appliesTo: appliesToEnum("appliesTo").default("order").notNull(),
    menuItemId: integer("menuItemId").references(() => menuItems.id, { onDelete: "set null" }),
    categoryId: integer("categoryId").references(() => menuCategories.id, { onDelete: "set null" }),
    status: offerStatusEnum("status").default("draft").notNull(),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    createdById: integer("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    updatedById: integer("updatedById").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => [
    index("offer_campaigns_status_window_idx").on(table.status, table.startsAt, table.endsAt),
    index("offer_campaigns_menu_item_idx").on(table.menuItemId),
    index("offer_campaigns_category_idx").on(table.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
