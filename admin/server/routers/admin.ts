import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adjustInventory,
  createInventoryItem,
  createMenuItem,
  createOrder,
  getDashboardData,
  getInvoiceDetail,
  getOrCreateInvoice,
  getSalesReport,
  getSalesSummary,
  getBusinessSettings,
  listActivity,
  listCategories,
  listEmployees,
  listInventory,
  listMenuItems,
  listOrders,
  listOfferCampaigns,
  listStorefrontOffers,
  listShifts,
  listSocialAccounts,
  listSocialPosts,
  saveEmployee,
  saveOfferCampaign,
  saveShift,
  saveSocialAccount,
  saveSocialPost,
  syncCatalogBaseline,
  updateBusinessSettings,
  updateMenuItem,
  updateOrderStatus,
} from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const orderStatus = z.enum(["pending", "preparing", "ready", "delivered", "cancelled"]);
const paymentMethod = z.enum(["cash", "upi", "card", "other"]);
const paymentStatus = z.enum(["unpaid", "paid", "refunded"]);
const socialPlatform = z.enum(["instagram", "facebook", "zomato", "whatsapp"]);
const offerDiscountType = z.enum(["percentage", "fixed", "bogo", "free_item"]);
const offerAppliesTo = z.enum(["order", "category", "menu_item"]);
const offerStatus = z.enum(["draft", "scheduled", "active", "paused", "expired"]);

function serverError(error: unknown) {
  return new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to complete this action" });
}

export const adminRouter = router({
  dashboard: adminProcedure.query(async () => getDashboardData()),
  catalog: router({
    sync: adminProcedure.mutation(async () => syncCatalogBaseline()),
    categories: adminProcedure.query(async () => listCategories()),
    list: adminProcedure.query(async () => listMenuItems()),
    availability: publicProcedure.query(async () => (await listMenuItems()).map(item => ({ catalogId: item.catalogId, isAvailable: item.isAvailable && !item.isOutOfStock }))),
    create: adminProcedure.input(z.object({ catalogId: z.string().min(3).max(240), categoryId: z.number().int().positive(), name: z.string().min(2).max(240), description: z.string().max(5000).nullable().optional(), pricePaise: z.number().int().min(0), isVegetarian: z.boolean().default(true) })).mutation(async ({ input }) => {
      try { return await createMenuItem(input); } catch (error) { throw serverError(error); }
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(2).max(240).optional(), description: z.string().max(5000).nullable().optional(), pricePaise: z.number().int().min(0).optional(), categoryId: z.number().int().positive().optional(), isAvailable: z.boolean().optional(), isOutOfStock: z.boolean().optional() })).mutation(async ({ input }) => {
      try { await updateMenuItem(input); } catch (error) { throw serverError(error); }
    }),
  }),
  offers: router({
    list: adminProcedure.query(async () => listOfferCampaigns()),
    storefront: publicProcedure.query(async () => listStorefrontOffers()),
    save: adminProcedure.input(z.object({
      id: z.number().int().positive().optional(),
      title: z.string().min(2).max(180),
      displayLabel: z.string().min(2).max(80),
      description: z.string().max(5000).nullable().optional(),
      terms: z.string().max(8000).nullable().optional(),
      promoCode: z.string().max(48).nullable().optional(),
      discountType: offerDiscountType,
      discountValue: z.number().int().min(0),
      minimumOrderPaise: z.number().int().min(0).default(0),
      maximumDiscountPaise: z.number().int().min(0).nullable().optional(),
      appliesTo: offerAppliesTo,
      menuItemId: z.number().int().positive().nullable().optional(),
      categoryId: z.number().int().positive().nullable().optional(),
      status: offerStatus,
      startsAt: z.date().nullable().optional(),
      endsAt: z.date().nullable().optional(),
      isFeatured: z.boolean().default(false),
    })).mutation(async ({ input, ctx }) => {
      try { return await saveOfferCampaign({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
  }),
  orders: router({
    list: adminProcedure.input(z.object({ status: orderStatus.optional(), from: z.date().optional(), to: z.date().optional() }).optional()).query(async ({ input }) => listOrders(input)),
    create: adminProcedure.input(z.object({ customerName: z.string().max(180).nullable().optional(), customerPhone: z.string().max(32).nullable().optional(), source: z.enum(["whatsapp", "walk_in", "phone", "other"]).default("whatsapp"), notes: z.string().max(5000).nullable().optional(), paymentMethod: paymentMethod.default("cash"), paymentStatus: paymentStatus.default("unpaid"), discountPaise: z.number().int().min(0).default(0), lines: z.array(z.object({ menuItemId: z.number().int().positive(), quantity: z.number().int().min(1).max(50) })).min(1).max(50) })).mutation(async ({ input, ctx }) => {
      try { return await createOrder({ ...input, createdById: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
    status: adminProcedure.input(z.object({ orderId: z.number().int().positive(), status: orderStatus })).mutation(async ({ input, ctx }) => {
      try { await updateOrderStatus({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
  }),
  sales: router({
    summary: adminProcedure.query(async () => getSalesSummary()),
    report: adminProcedure.input(z.object({ from: z.date(), to: z.date() })).query(async ({ input }) => getSalesReport(input)),
  }),
  inventory: router({
    list: adminProcedure.query(async () => listInventory()),
    create: adminProcedure.input(z.object({ name: z.string().min(2).max(180), sku: z.string().max(80).nullable().optional(), unit: z.string().min(1).max(30), currentStock: z.number().int().min(0), lowStockThreshold: z.number().int().min(0), linkedMenuItemId: z.number().int().positive().nullable().optional() })).mutation(async ({ input, ctx }) => {
      try { return await createInventoryItem({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
    adjust: adminProcedure.input(z.object({ inventoryItemId: z.number().int().positive(), changeQuantity: z.number().int().refine(value => value !== 0), reason: z.enum(["restock", "usage", "adjustment", "waste"]), note: z.string().max(2000).nullable().optional() })).mutation(async ({ input, ctx }) => {
      try { await adjustInventory({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
  }),
  invoices: router({
    issue: adminProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      try { return await getOrCreateInvoice(input.orderId, ctx.user.id); } catch (error) { throw serverError(error); }
    }),
    detail: adminProcedure.input(z.object({ invoiceId: z.number().int().positive() })).query(async ({ input }) => {
      try { return await getInvoiceDetail(input.invoiceId); } catch (error) { throw serverError(error); }
    }),
    settings: adminProcedure.query(async ({ ctx }) => getBusinessSettings(ctx.user.id)),
    updateSettings: adminProcedure.input(z.object({ businessName: z.string().min(2).max(180), address: z.string().max(4000).nullable().optional(), phone: z.string().max(32).nullable().optional(), gstin: z.string().max(32).nullable().optional(), invoicePrefix: z.string().min(1).max(24), taxRateBps: z.number().int().min(0).max(10000) })).mutation(async ({ input, ctx }) => {
      try { await updateBusinessSettings({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
  }),
  employees: router({
    list: adminProcedure.query(async () => listEmployees()),
    save: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), fullName: z.string().min(2).max(180), phone: z.string().max(32).nullable().optional(), email: z.string().email().max(320).nullable().optional(), jobTitle: z.string().max(120).nullable().optional(), accessRole: z.enum(["admin", "staff"]), isActive: z.boolean() })).mutation(async ({ input, ctx }) => {
      try { return await saveEmployee({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
    shifts: adminProcedure.query(async () => listShifts()),
    saveShift: adminProcedure.input(z.object({ employeeId: z.number().int().positive(), startsAt: z.date(), endsAt: z.date(), status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"), note: z.string().max(2000).nullable().optional() })).mutation(async ({ input, ctx }) => {
      try { return await saveShift({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
    activity: adminProcedure.input(z.object({ employeeId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => listActivity(input?.employeeId)),
  }),
  social: router({
    accounts: adminProcedure.query(async () => listSocialAccounts()),
    saveAccount: adminProcedure.input(z.object({ platform: socialPlatform, handle: z.string().min(1).max(180), url: z.string().url().max(500), isActive: z.boolean() })).mutation(async ({ input, ctx }) => {
      try { await saveSocialAccount({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
    posts: adminProcedure.query(async () => listSocialPosts()),
    savePost: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), socialAccountId: z.number().int().positive().nullable().optional(), platform: socialPlatform, title: z.string().min(2).max(240), caption: z.string().min(1).max(10000), status: z.enum(["draft", "scheduled", "published"]), scheduledAt: z.date().nullable().optional() })).mutation(async ({ input, ctx }) => {
      try { return await saveSocialPost({ ...input, actorUserId: ctx.user.id }); } catch (error) { throw serverError(error); }
    }),
  }),
});
