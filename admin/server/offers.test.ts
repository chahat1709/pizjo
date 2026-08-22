import { describe, expect, it } from "vitest";
import { isOfferVisibleOnStorefront, validateOfferCampaign } from "./db";

const baseOffer = {
  discountType: "percentage" as const,
  discountValue: 1500,
  minimumOrderPaise: 0,
  maximumDiscountPaise: null,
  appliesTo: "order" as const,
  menuItemId: null,
  categoryId: null,
  startsAt: new Date("2026-08-01T00:00:00Z"),
  endsAt: new Date("2026-08-31T23:59:59Z"),
};

describe("offer campaign rules", () => {
  it("accepts a valid percentage discount and correctly rejects unsafe campaign shapes", () => {
    expect(() => validateOfferCampaign(baseOffer)).not.toThrow();
    expect(() => validateOfferCampaign({ ...baseOffer, discountValue: 10_001 })).toThrow("Percentage discounts");
    expect(() => validateOfferCampaign({ ...baseOffer, startsAt: new Date("2026-08-31T00:00:00Z"), endsAt: new Date("2026-08-01T00:00:00Z") })).toThrow("must end after");
    expect(() => validateOfferCampaign({ ...baseOffer, appliesTo: "menu_item", menuItemId: null })).toThrow("Select a menu item");
    expect(() => validateOfferCampaign({ ...baseOffer, appliesTo: "order", categoryId: 12 })).toThrow("Order-wide offers");
  });

  it("requires BOGO and free-item promotions to carry no arbitrary cash discount", () => {
    expect(() => validateOfferCampaign({ ...baseOffer, discountType: "bogo", discountValue: 1 })).toThrow("do not use a discount amount");
    expect(() => validateOfferCampaign({ ...baseOffer, discountType: "free_item", discountValue: 0, appliesTo: "menu_item", menuItemId: 9 })).not.toThrow();
  });

  it("only exposes active campaigns within their defined storefront window", () => {
    const now = new Date("2026-08-19T12:00:00Z");
    expect(isOfferVisibleOnStorefront({ status: "active", startsAt: new Date("2026-08-01T00:00:00Z"), endsAt: new Date("2026-08-31T23:59:59Z") }, now)).toBe(true);
    expect(isOfferVisibleOnStorefront({ status: "scheduled", startsAt: new Date("2026-08-01T00:00:00Z"), endsAt: new Date("2026-08-31T23:59:59Z") }, now)).toBe(false);
    expect(isOfferVisibleOnStorefront({ status: "active", startsAt: new Date("2026-08-20T00:00:00Z"), endsAt: null }, now)).toBe(false);
    expect(isOfferVisibleOnStorefront({ status: "active", startsAt: null, endsAt: new Date("2026-08-18T23:59:59Z") }, now)).toBe(false);
  });
});
