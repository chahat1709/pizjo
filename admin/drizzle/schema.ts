import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "staff"]).default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const menuCategories = mysqlTable("menu_categories", {
  id: int("id").autoincrement().primaryKey(),
  catalogKey: varchar("catalogKey", { length: 180 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const menuItems = mysqlTable(
  "menu_items",
  {
    id: int("id").autoincrement().primaryKey(),
    catalogId: varchar("catalogId", { length: 240 }).notNull().unique(),
    categoryId: int("categoryId").notNull().references(() => menuCategories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 240 }).notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    pricePaise: int("pricePaise").notNull(),
    isVegetarian: boolean("isVegetarian").default(true).notNull(),
    isAvailable: boolean("isAvailable").default(true).notNull(),
    isOutOfStock: boolean("isOutOfStock").default(false).notNull(),
    sortOrder: int("sortOrder").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("menu_items_category_idx").on(table.categoryId)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 40 }).notNull().unique(),
    source: mysqlEnum("source", ["whatsapp", "walk_in", "phone", "other"]).default("whatsapp").notNull(),
    status: mysqlEnum("status", ["pending", "preparing", "ready", "delivered", "cancelled"]).default("pending").notNull(),
    customerName: varchar("customerName", { length: 180 }),
    customerPhone: varchar("customerPhone", { length: 32 }),
    notes: text("notes"),
    paymentMethod: mysqlEnum("paymentMethod", ["cash", "upi", "card", "other"]).default("cash").notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
    subtotalPaise: int("subtotalPaise").notNull(),
    taxPaise: int("taxPaise").default(0).notNull(),
    discountPaise: int("discountPaise").default(0).notNull(),
    totalPaise: int("totalPaise").notNull(),
    placedAt: timestamp("placedAt").defaultNow().notNull(),
    deliveredAt: timestamp("deliveredAt"),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("orders_status_placed_idx").on(table.status, table.placedAt), index("orders_customer_phone_idx").on(table.customerPhone)],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: int("menuItemId").references(() => menuItems.id, { onDelete: "set null" }),
    catalogId: varchar("catalogId", { length: 240 }),
    itemName: varchar("itemName", { length: 240 }).notNull(),
    unitPricePaise: int("unitPricePaise").notNull(),
    quantity: int("quantity").notNull(),
    lineTotalPaise: int("lineTotalPaise").notNull(),
  },
  table => [index("order_items_order_idx").on(table.orderId)],
);

export const inventoryItems = mysqlTable(
  "inventory_items",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 80 }),
    unit: varchar("unit", { length: 30 }).notNull(),
    currentStock: int("currentStock").default(0).notNull(),
    lowStockThreshold: int("lowStockThreshold").default(0).notNull(),
    linkedMenuItemId: int("linkedMenuItemId").references(() => menuItems.id, { onDelete: "set null" }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("inventory_sku_unique").on(table.sku), index("inventory_menu_item_idx").on(table.linkedMenuItemId)],
);

export const stockMovements = mysqlTable(
  "stock_movements",
  {
    id: int("id").autoincrement().primaryKey(),
    inventoryItemId: int("inventoryItemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
    changeQuantity: int("changeQuantity").notNull(),
    reason: mysqlEnum("reason", ["opening", "restock", "usage", "adjustment", "waste"]).notNull(),
    note: text("note"),
    performedById: int("performedById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("stock_movements_item_created_idx").on(table.inventoryItemId, table.createdAt)],
);

export const businessSettings = mysqlTable("business_settings", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("businessName", { length: 180 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  gstin: varchar("gstin", { length: 32 }),
  invoicePrefix: varchar("invoicePrefix", { length: 24 }).default("PIZ").notNull(),
  taxRateBps: int("taxRateBps").default(0).notNull(),
  updatedById: int("updatedById").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceNumber: varchar("invoiceNumber", { length: 48 }).notNull().unique(),
    orderId: int("orderId").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
    status: mysqlEnum("status", ["draft", "issued", "void"]).default("issued").notNull(),
    customerName: varchar("customerName", { length: 180 }),
    customerPhone: varchar("customerPhone", { length: 32 }),
    subtotalPaise: int("subtotalPaise").notNull(),
    taxPaise: int("taxPaise").default(0).notNull(),
    discountPaise: int("discountPaise").default(0).notNull(),
    totalPaise: int("totalPaise").notNull(),
    issuedAt: timestamp("issuedAt").defaultNow().notNull(),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
  },
  table => [index("invoices_issued_at_idx").on(table.issuedAt)],
);

export const employees = mysqlTable(
  "employees",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").unique().references(() => users.id, { onDelete: "set null" }),
    fullName: varchar("fullName", { length: 180 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 320 }),
    jobTitle: varchar("jobTitle", { length: 120 }),
    accessRole: mysqlEnum("accessRole", ["admin", "staff"]).default("staff").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("employees_active_idx").on(table.isActive)],
);

export const shifts = mysqlTable(
  "shifts",
  {
    id: int("id").autoincrement().primaryKey(),
    employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt").notNull(),
    status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
    note: text("note"),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("shifts_employee_start_idx").on(table.employeeId, table.startsAt)],
);

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorUserId: int("actorUserId").references(() => users.id, { onDelete: "set null" }),
    employeeId: int("employeeId").references(() => employees.id, { onDelete: "set null" }),
    action: varchar("action", { length: 140 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: varchar("entityId", { length: 80 }),
    detail: text("detail"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("activity_logs_employee_created_idx").on(table.employeeId, table.createdAt)],
);

export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["instagram", "facebook", "zomato", "whatsapp"]).notNull().unique(),
  handle: varchar("handle", { length: 180 }).notNull(),
  url: text("url").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  updatedById: int("updatedById").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const socialPosts = mysqlTable(
  "social_posts",
  {
    id: int("id").autoincrement().primaryKey(),
    socialAccountId: int("socialAccountId").references(() => socialAccounts.id, { onDelete: "set null" }),
    platform: mysqlEnum("platform", ["instagram", "facebook", "zomato", "whatsapp"]).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    caption: text("caption").notNull(),
    status: mysqlEnum("status", ["draft", "scheduled", "published"]).default("draft").notNull(),
    scheduledAt: timestamp("scheduledAt"),
    publishedAt: timestamp("publishedAt"),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("social_posts_status_scheduled_idx").on(table.status, table.scheduledAt)],
);

export const offerCampaigns = mysqlTable(
  "offer_campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    displayLabel: varchar("displayLabel", { length: 80 }).notNull(),
    description: text("description"),
    terms: text("terms"),
    promoCode: varchar("promoCode", { length: 48 }).unique(),
    discountType: mysqlEnum("discountType", ["percentage", "fixed", "bogo", "free_item"]).notNull(),
    /** Percentage offers use basis points (e.g. 1500 = 15%); fixed offers use paise. */
    discountValue: int("discountValue").default(0).notNull(),
    minimumOrderPaise: int("minimumOrderPaise").default(0).notNull(),
    maximumDiscountPaise: int("maximumDiscountPaise"),
    appliesTo: mysqlEnum("appliesTo", ["order", "category", "menu_item"]).default("order").notNull(),
    menuItemId: int("menuItemId").references(() => menuItems.id, { onDelete: "set null" }),
    categoryId: int("categoryId").references(() => menuCategories.id, { onDelete: "set null" }),
    status: mysqlEnum("status", ["draft", "scheduled", "active", "paused", "expired"]).default("draft").notNull(),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    createdById: int("createdById").notNull().references(() => users.id, { onDelete: "restrict" }),
    updatedById: int("updatedById").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("offer_campaigns_status_window_idx").on(table.status, table.startsAt, table.endsAt),
    index("offer_campaigns_menu_item_idx").on(table.menuItemId),
    index("offer_campaigns_category_idx").on(table.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
