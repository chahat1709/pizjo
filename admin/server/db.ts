import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityLogs,
  businessSettings,
  employees,
  inventoryItems,
  invoices,
  menuCategories,
  menuItems,
  offerCampaigns,
  orderItems,
  orders,
  shifts,
  socialAccounts,
  socialPosts,
  stockMovements,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { catalogBaseline, catalogCategoryCount, catalogItemCount, pizjoCatalog } from "../shared/catalog";
import { ENV } from "./_core/env";

let connection: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!connection && process.env.DATABASE_URL) {
    connection = drizzle(process.env.DATABASE_URL);
  }
  return connection;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "staff");
  values.role = role;
  updateSet.role = role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function recordActivity(input: {
  actorUserId?: number | null;
  employeeId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  const db = await requireDb();
  await db.insert(activityLogs).values(input);
}

export async function syncCatalogBaseline() {
  const db = await requireDb();
  for (const [index, category] of pizjoCatalog.categories.entries()) {
    const catalogKey = category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await db.insert(menuCategories).values({ catalogKey, name: category.name, sortOrder: index }).onDuplicateKeyUpdate({
      set: { name: category.name, sortOrder: index },
    });
  }

  const categories = await db.select().from(menuCategories);
  const categoryIdByName = new Map(categories.map(category => [category.name, category.id]));

  for (const item of catalogBaseline) {
    const categoryId = categoryIdByName.get(item.categoryName);
    if (!categoryId) throw new Error(`Missing category for ${item.name}`);
    await db.insert(menuItems).values({
      catalogId: item.id,
      categoryId,
      name: item.name,
      description: item.description ?? null,
      imageUrl: item.image ?? null,
      pricePaise: Math.round(item.price * 100),
      isVegetarian: item.veg ?? true,
      sortOrder: item.itemIndex,
    }).onDuplicateKeyUpdate({
      set: {
        categoryId,
        name: item.name,
        description: item.description ?? null,
        imageUrl: item.image ?? null,
        pricePaise: Math.round(item.price * 100),
        isVegetarian: item.veg ?? true,
        sortOrder: item.itemIndex,
      },
    });
  }

  return { categories: catalogCategoryCount, items: catalogItemCount };
}

export async function listMenuItems() {
  const db = await requireDb();
  const query = () => db.select({
    id: menuItems.id,
    catalogId: menuItems.catalogId,
    name: menuItems.name,
    description: menuItems.description,
    imageUrl: menuItems.imageUrl,
    pricePaise: menuItems.pricePaise,
    isVegetarian: menuItems.isVegetarian,
    isAvailable: menuItems.isAvailable,
    isOutOfStock: menuItems.isOutOfStock,
    sortOrder: menuItems.sortOrder,
    categoryId: menuCategories.id,
    categoryName: menuCategories.name,
    categoryKey: menuCategories.catalogKey,
  }).from(menuItems).innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id)).orderBy(asc(menuCategories.sortOrder), asc(menuItems.sortOrder));
  const existing = await query();
  if (existing.length) return existing;
  await syncCatalogBaseline();
  return query();
}

export async function listCategories() {
  const db = await requireDb();
  return db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder));
}

export async function updateMenuItem(input: {
  id: number;
  name?: string;
  description?: string | null;
  pricePaise?: number;
  categoryId?: number;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
}) {
  const db = await requireDb();
  const { id, ...updates } = input;
  await db.update(menuItems).set(updates).where(eq(menuItems.id, id));
}

export async function createMenuItem(input: {
  catalogId: string;
  categoryId: number;
  name: string;
  description?: string | null;
  pricePaise: number;
  isVegetarian: boolean;
}) {
  const db = await requireDb();
  const last = await db.select().from(menuItems).where(eq(menuItems.categoryId, input.categoryId)).orderBy(desc(menuItems.sortOrder)).limit(1);
  const result = await db.insert(menuItems).values({ ...input, sortOrder: (last[0]?.sortOrder ?? -1) + 1 });
  return Number(result[0].insertId);
}

export async function listOrders(input?: { status?: string; from?: Date; to?: Date }) {
  const db = await requireDb();
  const allOrders = await db.select().from(orders).orderBy(desc(orders.placedAt));
  const filtered = allOrders.filter(order => {
    if (input?.status && order.status !== input.status) return false;
    if (input?.from && order.placedAt < input.from) return false;
    if (input?.to && order.placedAt > input.to) return false;
    return true;
  });
  const ids = filtered.map(order => order.id);
  const lines = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return filtered.map(order => ({ ...order, items: lines.filter(line => line.orderId === order.id) }));
}

export const orderTransitions: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function isMenuItemSellable(item: { isAvailable: boolean; isOutOfStock: boolean }) {
  return item.isAvailable && !item.isOutOfStock;
}

export function calculateOrderTotals(subtotalPaise: number, discountPaise: number, taxRateBps: number) {
  const taxableAmountPaise = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = Math.round((taxableAmountPaise * taxRateBps) / 10_000);
  return { taxableAmountPaise, taxPaise, totalPaise: taxableAmountPaise + taxPaise };
}

export function nextStockLevel(currentStock: number, changeQuantity: number) {
  const nextStock = currentStock + changeQuantity;
  if (nextStock < 0) throw new Error("Stock cannot fall below zero");
  return nextStock;
}

export async function createOrder(input: {
  customerName?: string | null;
  customerPhone?: string | null;
  source: "whatsapp" | "walk_in" | "phone" | "other";
  notes?: string | null;
  paymentMethod: "cash" | "upi" | "card" | "other";
  paymentStatus: "unpaid" | "paid" | "refunded";
  discountPaise: number;
  lines: { menuItemId: number; quantity: number }[];
  createdById: number;
}) {
  const db = await requireDb();
  const ids = [...new Set(input.lines.map(line => line.menuItemId))];
  const products = await db.select().from(menuItems).where(inArray(menuItems.id, ids));
  if (products.length !== ids.length) throw new Error("One or more menu items no longer exist");
  const productById = new Map(products.map(product => [product.id, product]));
  const calculatedLines = input.lines.map(line => {
    const product = productById.get(line.menuItemId);
    if (!product || !isMenuItemSellable(product)) throw new Error(`${product?.name ?? "Selected item"} is unavailable`);
    const lineTotalPaise = product.pricePaise * line.quantity;
    return { product, quantity: line.quantity, lineTotalPaise };
  });
  const subtotalPaise = calculatedLines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const settings = await getBusinessSettings(input.createdById);
  const { taxPaise, totalPaise } = calculateOrderTotals(subtotalPaise, input.discountPaise, settings.taxRateBps);
  const orderNumber = `PZ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;

  const result = await db.transaction(async tx => {
    const inserted = await tx.insert(orders).values({
      orderNumber,
      source: input.source,
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      notes: input.notes ?? null,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      subtotalPaise,
      taxPaise,
      discountPaise: input.discountPaise,
      totalPaise,
      createdById: input.createdById,
    });
    const orderId = Number(inserted[0].insertId);
    await tx.insert(orderItems).values(calculatedLines.map(line => ({
      orderId,
      menuItemId: line.product.id,
      catalogId: line.product.catalogId,
      itemName: line.product.name,
      unitPricePaise: line.product.pricePaise,
      quantity: line.quantity,
      lineTotalPaise: line.lineTotalPaise,
    })));
    return orderId;
  });

  await recordActivity({ actorUserId: input.createdById, action: "order.created", entityType: "order", entityId: String(result), detail: orderNumber });
  return result;
}

export async function updateOrderStatus(input: { orderId: number; status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"; actorUserId: number }) {
  const db = await requireDb();
  const current = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  const order = current[0];
  if (!order) throw new Error("Order not found");
  if (!orderTransitions[order.status].includes(input.status)) throw new Error(`Cannot move an order from ${order.status} to ${input.status}`);
  await db.update(orders).set({
    status: input.status,
    deliveredAt: input.status === "delivered" ? new Date() : order.deliveredAt,
  }).where(eq(orders.id, order.id));
  await recordActivity({ actorUserId: input.actorUserId, action: "order.status_changed", entityType: "order", entityId: String(order.id), detail: `${order.status} → ${input.status}` });
}

export async function getBusinessSettings(actorUserId?: number) {
  const db = await requireDb();
  const existing = await db.select().from(businessSettings).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(businessSettings).values({ businessName: "Pizjo", updatedById: actorUserId ?? null });
  const created = await db.select().from(businessSettings).limit(1);
  return created[0]!;
}

export async function updateBusinessSettings(input: {
  actorUserId: number;
  businessName: string;
  address?: string | null;
  phone?: string | null;
  gstin?: string | null;
  invoicePrefix: string;
  taxRateBps: number;
}) {
  const db = await requireDb();
  const settings = await getBusinessSettings(input.actorUserId);
  const { actorUserId, ...updates } = input;
  await db.update(businessSettings).set({ ...updates, updatedById: actorUserId }).where(eq(businessSettings.id, settings.id));
}

export async function getOrCreateInvoice(orderId: number, actorUserId: number) {
  const db = await requireDb();
  const existing = await db.select().from(invoices).where(eq(invoices.orderId, orderId)).limit(1);
  if (existing[0]) return existing[0];
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
  if (!order) throw new Error("Order not found");
  const settings = await getBusinessSettings(actorUserId);
  const invoiceNumber = `${settings.invoicePrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(order.id).padStart(5, "0")}`;
  await db.insert(invoices).values({
    invoiceNumber,
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    subtotalPaise: order.subtotalPaise,
    taxPaise: order.taxPaise,
    discountPaise: order.discountPaise,
    totalPaise: order.totalPaise,
    createdById: actorUserId,
  });
  await recordActivity({ actorUserId, action: "invoice.issued", entityType: "invoice", entityId: invoiceNumber, detail: order.orderNumber });
  return (await db.select().from(invoices).where(eq(invoices.orderId, orderId)).limit(1))[0]!;
}

export async function getInvoiceDetail(invoiceId: number) {
  const db = await requireDb();
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
  if (!invoice) throw new Error("Invoice not found");
  const order = (await db.select().from(orders).where(eq(orders.id, invoice.orderId)).limit(1))[0]!;
  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const settings = await getBusinessSettings();
  return { invoice, order, lines, settings };
}

export async function listInventory() {
  const db = await requireDb();
  return db.select({
    id: inventoryItems.id,
    name: inventoryItems.name,
    sku: inventoryItems.sku,
    unit: inventoryItems.unit,
    currentStock: inventoryItems.currentStock,
    lowStockThreshold: inventoryItems.lowStockThreshold,
    isActive: inventoryItems.isActive,
    linkedMenuItemId: inventoryItems.linkedMenuItemId,
    linkedMenuItemName: menuItems.name,
  }).from(inventoryItems).leftJoin(menuItems, eq(inventoryItems.linkedMenuItemId, menuItems.id)).orderBy(asc(inventoryItems.name));
}

export async function createInventoryItem(input: { name: string; sku?: string | null; unit: string; currentStock: number; lowStockThreshold: number; linkedMenuItemId?: number | null; actorUserId: number }) {
  const db = await requireDb();
  const result = await db.insert(inventoryItems).values({
    name: input.name,
    sku: input.sku ?? null,
    unit: input.unit,
    currentStock: input.currentStock,
    lowStockThreshold: input.lowStockThreshold,
    linkedMenuItemId: input.linkedMenuItemId ?? null,
  });
  const inventoryItemId = Number(result[0].insertId);
  await db.insert(stockMovements).values({ inventoryItemId, changeQuantity: input.currentStock, reason: "opening", performedById: input.actorUserId });
  await recordActivity({ actorUserId: input.actorUserId, action: "inventory.created", entityType: "inventory", entityId: String(inventoryItemId), detail: input.name });
  return inventoryItemId;
}

export async function adjustInventory(input: { inventoryItemId: number; changeQuantity: number; reason: "restock" | "usage" | "adjustment" | "waste"; note?: string | null; actorUserId: number }) {
  const db = await requireDb();
  const item = (await db.select().from(inventoryItems).where(eq(inventoryItems.id, input.inventoryItemId)).limit(1))[0];
  if (!item) throw new Error("Inventory item not found");
  const nextStock = nextStockLevel(item.currentStock, input.changeQuantity);
  await db.transaction(async tx => {
    await tx.update(inventoryItems).set({ currentStock: nextStock }).where(eq(inventoryItems.id, item.id));
    await tx.insert(stockMovements).values({
      inventoryItemId: item.id,
      changeQuantity: input.changeQuantity,
      reason: input.reason,
      note: input.note ?? null,
      performedById: input.actorUserId,
    });
  });
  await recordActivity({ actorUserId: input.actorUserId, action: "inventory.adjusted", entityType: "inventory", entityId: String(item.id), detail: `${input.reason}: ${input.changeQuantity}` });
}

export async function getDashboardData() {
  const db = await requireDb();
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const allOrders = await db.select().from(orders).orderBy(desc(orders.placedAt));
  const todayOrders = allOrders.filter(order => order.placedAt >= dayStart && order.status !== "cancelled");
  const deliveredToday = todayOrders.filter(order => order.status === "delivered");
  const inventory = await listInventory();
  return {
    todayRevenuePaise: deliveredToday.reduce((sum, order) => sum + order.totalPaise, 0),
    todayOrderCount: todayOrders.length,
    lowStock: inventory.filter(item => item.isActive && item.currentStock <= item.lowStockThreshold),
    recentOrders: allOrders.slice(0, 8),
  };
}

export async function getSalesReport(input: { from: Date; to: Date }) {
  const db = await requireDb();
  const allOrders = await db.select().from(orders).where(and(gte(orders.placedAt, input.from), lte(orders.placedAt, input.to))).orderBy(asc(orders.placedAt));
  const completed = allOrders.filter(order => order.status === "delivered");
  const ids = completed.map(order => order.id);
  const lines = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  const daily = new Map<string, { revenuePaise: number; orders: number }>();
  for (const order of completed) {
    const key = order.placedAt.toISOString().slice(0, 10);
    const current = daily.get(key) ?? { revenuePaise: 0, orders: 0 };
    current.revenuePaise += order.totalPaise;
    current.orders += 1;
    daily.set(key, current);
  }
  const productTotals = new Map<string, { name: string; quantity: number; revenuePaise: number }>();
  for (const line of lines) {
    const current = productTotals.get(line.itemName) ?? { name: line.itemName, quantity: 0, revenuePaise: 0 };
    current.quantity += line.quantity;
    current.revenuePaise += line.lineTotalPaise;
    productTotals.set(line.itemName, current);
  }
  const totalRevenuePaise = completed.reduce((sum, order) => sum + order.totalPaise, 0);
  return {
    totalRevenuePaise,
    orderCount: completed.length,
    averageOrderValuePaise: completed.length ? Math.round(totalRevenuePaise / completed.length) : 0,
    daily: [...daily.entries()].map(([date, value]) => ({ date, ...value })),
    topItems: [...productTotals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
  };
}

export async function getSalesSummary() {
  const db = await requireDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recentOrders = await db.select().from(orders).where(gte(orders.placedAt, monthStart));
  const delivered = recentOrders.filter(order => order.status === "delivered");
  const sumFrom = (from: Date) => delivered.filter(order => order.placedAt >= from).reduce((sum, order) => sum + order.totalPaise, 0);
  return {
    dailyRevenuePaise: sumFrom(dayStart),
    weeklyRevenuePaise: sumFrom(weekStart),
    monthlyRevenuePaise: sumFrom(monthStart),
  };
}

export async function listEmployees() {
  const db = await requireDb();
  return db.select().from(employees).orderBy(desc(employees.isActive), asc(employees.fullName));
}

export async function saveEmployee(input: { id?: number; fullName: string; phone?: string | null; email?: string | null; jobTitle?: string | null; accessRole: "admin" | "staff"; isActive: boolean; actorUserId: number }) {
  const db = await requireDb();
  const matchingUser = input.email ? (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0] : undefined;
  if (matchingUser) {
    await db.update(users).set({ role: input.accessRole }).where(eq(users.id, matchingUser.id));
  }
  const values = {
    userId: matchingUser?.id ?? null,
    fullName: input.fullName,
    phone: input.phone ?? null,
    email: input.email ?? null,
    jobTitle: input.jobTitle ?? null,
    accessRole: input.accessRole,
    isActive: input.isActive,
  } as const;
  if (input.id) {
    await db.update(employees).set(values).where(eq(employees.id, input.id));
    await recordActivity({ actorUserId: input.actorUserId, employeeId: input.id, action: "employee.updated", entityType: "employee", entityId: String(input.id), detail: input.fullName });
    return input.id;
  }
  const result = await db.insert(employees).values(values);
  const id = Number(result[0].insertId);
  await recordActivity({ actorUserId: input.actorUserId, employeeId: id, action: "employee.created", entityType: "employee", entityId: String(id), detail: input.fullName });
  return id;
}

export async function listShifts() {
  const db = await requireDb();
  return db.select({ id: shifts.id, employeeId: shifts.employeeId, employeeName: employees.fullName, startsAt: shifts.startsAt, endsAt: shifts.endsAt, status: shifts.status, note: shifts.note }).from(shifts).innerJoin(employees, eq(shifts.employeeId, employees.id)).orderBy(asc(shifts.startsAt));
}

export async function saveShift(input: { employeeId: number; startsAt: Date; endsAt: Date; status: "scheduled" | "completed" | "cancelled"; note?: string | null; actorUserId: number }) {
  if (input.endsAt <= input.startsAt) throw new Error("A shift must end after it starts");
  const db = await requireDb();
  const result = await db.insert(shifts).values({
    employeeId: input.employeeId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: input.status,
    note: input.note ?? null,
    createdById: input.actorUserId,
  });
  const id = Number(result[0].insertId);
  await recordActivity({ actorUserId: input.actorUserId, employeeId: input.employeeId, action: "shift.scheduled", entityType: "shift", entityId: String(id) });
  return id;
}

export async function listActivity(employeeId?: number) {
  const db = await requireDb();
  const logs = employeeId ? await db.select().from(activityLogs).where(eq(activityLogs.employeeId, employeeId)).orderBy(desc(activityLogs.createdAt)) : await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  return logs.slice(0, 100);
}

export async function listSocialAccounts() {
  const db = await requireDb();
  return db.select().from(socialAccounts).orderBy(asc(socialAccounts.platform));
}

export async function saveSocialAccount(input: { platform: "instagram" | "facebook" | "zomato" | "whatsapp"; handle: string; url: string; isActive: boolean; actorUserId: number }) {
  const db = await requireDb();
  const { actorUserId, ...account } = input;
  await db.insert(socialAccounts).values({ ...account, updatedById: actorUserId }).onDuplicateKeyUpdate({
    set: { handle: account.handle, url: account.url, isActive: account.isActive, updatedById: actorUserId },
  });
}

export async function listSocialPosts() {
  const db = await requireDb();
  return db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt));
}

export async function saveSocialPost(input: { id?: number; socialAccountId?: number | null; platform: "instagram" | "facebook" | "zomato" | "whatsapp"; title: string; caption: string; status: "draft" | "scheduled" | "published"; scheduledAt?: Date | null; actorUserId: number }) {
  const db = await requireDb();
  const values = {
    socialAccountId: input.socialAccountId ?? null,
    platform: input.platform,
    title: input.title,
    caption: input.caption,
    status: input.status,
    scheduledAt: input.scheduledAt ?? null,
    publishedAt: input.status === "published" ? new Date() : null,
  } as const;
  if (input.id) {
    await db.update(socialPosts).set(values).where(eq(socialPosts.id, input.id));
    return input.id;
  }
  const result = await db.insert(socialPosts).values({ ...values, createdById: input.actorUserId });
  return Number(result[0].insertId);
}

export type OfferDiscountType = "percentage" | "fixed" | "bogo" | "free_item";
export type OfferAppliesTo = "order" | "category" | "menu_item";
export type OfferStatus = "draft" | "scheduled" | "active" | "paused" | "expired";

export function validateOfferCampaign(input: {
  discountType: OfferDiscountType;
  discountValue: number;
  minimumOrderPaise: number;
  maximumDiscountPaise?: number | null;
  appliesTo: OfferAppliesTo;
  menuItemId?: number | null;
  categoryId?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) throw new Error("An offer must end after it starts");
  if (input.appliesTo === "menu_item" && !input.menuItemId) throw new Error("Select a menu item for this offer");
  if (input.appliesTo === "category" && !input.categoryId) throw new Error("Select a menu category for this offer");
  if (input.appliesTo === "order" && (input.menuItemId || input.categoryId)) throw new Error("Order-wide offers cannot target an item or category");
  if (input.discountType === "percentage" && (input.discountValue < 1 || input.discountValue > 10_000)) throw new Error("Percentage discounts must be between 0.01% and 100%");
  if (input.discountType === "fixed" && input.discountValue < 1) throw new Error("Fixed discounts must be at least ₹0.01");
  if (["bogo", "free_item"].includes(input.discountType) && input.discountValue !== 0) throw new Error("BOGO and free-item offers do not use a discount amount");
  if (input.minimumOrderPaise < 0) throw new Error("Minimum order value cannot be negative");
  if (input.maximumDiscountPaise !== null && input.maximumDiscountPaise !== undefined && input.maximumDiscountPaise < 1) throw new Error("Maximum discount must be positive when supplied");
}

export function isOfferVisibleOnStorefront(offer: { status: OfferStatus; startsAt: Date | null; endsAt: Date | null }, now = new Date()) {
  return offer.status === "active" && (!offer.startsAt || offer.startsAt <= now) && (!offer.endsAt || offer.endsAt >= now);
}

export async function listOfferCampaigns() {
  const db = await requireDb();
  return db.select().from(offerCampaigns).orderBy(desc(offerCampaigns.isFeatured), desc(offerCampaigns.updatedAt));
}

export async function listStorefrontOffers() {
  const offers = await listOfferCampaigns();
  return offers.filter(offer => isOfferVisibleOnStorefront(offer)).map(offer => ({
    id: offer.id,
    title: offer.title,
    displayLabel: offer.displayLabel,
    description: offer.description,
    terms: offer.terms,
    promoCode: offer.promoCode,
    discountType: offer.discountType,
    discountValue: offer.discountValue,
    minimumOrderPaise: offer.minimumOrderPaise,
    maximumDiscountPaise: offer.maximumDiscountPaise,
    appliesTo: offer.appliesTo,
    menuItemId: offer.menuItemId,
    categoryId: offer.categoryId,
    startsAt: offer.startsAt,
    endsAt: offer.endsAt,
    isFeatured: offer.isFeatured,
  }));
}

export async function saveOfferCampaign(input: {
  id?: number;
  title: string;
  displayLabel: string;
  description?: string | null;
  terms?: string | null;
  promoCode?: string | null;
  discountType: OfferDiscountType;
  discountValue: number;
  minimumOrderPaise: number;
  maximumDiscountPaise?: number | null;
  appliesTo: OfferAppliesTo;
  menuItemId?: number | null;
  categoryId?: number | null;
  status: OfferStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isFeatured: boolean;
  actorUserId: number;
}) {
  validateOfferCampaign(input);
  const db = await requireDb();
  const values = {
    title: input.title,
    displayLabel: input.displayLabel,
    description: input.description ?? null,
    terms: input.terms ?? null,
    promoCode: input.promoCode ? input.promoCode.trim().toUpperCase() : null,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minimumOrderPaise: input.minimumOrderPaise,
    maximumDiscountPaise: input.maximumDiscountPaise ?? null,
    appliesTo: input.appliesTo,
    menuItemId: input.appliesTo === "menu_item" ? input.menuItemId ?? null : null,
    categoryId: input.appliesTo === "category" ? input.categoryId ?? null : null,
    status: input.status,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    isFeatured: input.isFeatured,
    updatedById: input.actorUserId,
  } as const;
  if (input.id) {
    await db.update(offerCampaigns).set(values).where(eq(offerCampaigns.id, input.id));
    await recordActivity({ actorUserId: input.actorUserId, action: "offer.updated", entityType: "offer", entityId: String(input.id), detail: input.title });
    return input.id;
  }
  const result = await db.insert(offerCampaigns).values({ ...values, createdById: input.actorUserId });
  const id = Number(result[0].insertId);
  await recordActivity({ actorUserId: input.actorUserId, action: "offer.created", entityType: "offer", entityId: String(id), detail: input.title });
  return id;
}
