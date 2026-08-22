import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { catalogCategoryCount, catalogItemCount } from "../../shared/catalog";
import { calculateOrderTotals, isMenuItemSellable, nextStockLevel, orderTransitions } from "../db";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function contextFor(role: "admin" | "staff" | null): TrpcContext {
  return {
    user: role ? {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin protection", () => {
  it("rejects unauthenticated access before administrative data is queried", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.admin.dashboard()).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });

  it("rejects authenticated staff access to administrative procedures", async () => {
    const caller = appRouter.createCaller(contextFor("staff"));
    await expect(caller.admin.dashboard()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});

describe("restaurant operational rules", () => {
  it("retains the exact approved order status flow", () => {
    expect(orderTransitions).toEqual({
      pending: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    });
  });

  it("calculates invoice totals in paise from trustworthy server-side values", () => {
    expect(calculateOrderTotals(27_800, 2_800, 500)).toEqual({ taxableAmountPaise: 25_000, taxPaise: 1_250, totalPaise: 26_250 });
  });

  it("honors menu availability and prevents negative stock", () => {
    expect(isMenuItemSellable({ isAvailable: true, isOutOfStock: false })).toBe(true);
    expect(isMenuItemSellable({ isAvailable: false, isOutOfStock: false })).toBe(false);
    expect(isMenuItemSellable({ isAvailable: true, isOutOfStock: true })).toBe(false);
    expect(nextStockLevel(10, -4)).toBe(6);
    expect(() => nextStockLevel(2, -3)).toThrow("Stock cannot fall below zero");
  });

  it("keeps the authoritative catalog baseline at 81 items across 11 categories", () => {
    expect(catalogItemCount).toBe(81);
    expect(catalogCategoryCount).toBe(11);
  });
});
