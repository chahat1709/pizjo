import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const persistence = vi.hoisted(() => ({
  createOrder: vi.fn(),
  adjustInventory: vi.fn(),
  getOrCreateInvoice: vi.fn(),
}));

vi.mock("../db", () => ({
  createOrder: persistence.createOrder,
  adjustInventory: persistence.adjustInventory,
  getOrCreateInvoice: persistence.getOrCreateInvoice,
}));

import { appRouter } from "../routers";

function adminContext(): TrpcContext {
  return {
    user: {
      id: 71,
      openId: "isolated-positive-test-admin",
      name: "Isolated Test Admin",
      email: "isolated-test@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("positive operational procedures without database writes", () => {
  it("passes a valid order through the protected router with the authenticated actor", async () => {
    persistence.createOrder.mockResolvedValueOnce({ id: 501, status: "pending", totalPaise: 27_800 });
    const result = await appRouter.createCaller(adminContext()).admin.orders.create({
      source: "walk_in",
      paymentMethod: "cash",
      paymentStatus: "unpaid",
      discountPaise: 0,
      lines: [{ menuItemId: 81, quantity: 2 }],
    });

    expect(result).toEqual({ id: 501, status: "pending", totalPaise: 27_800 });
    expect(persistence.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      createdById: 71,
      source: "walk_in",
      lines: [{ menuItemId: 81, quantity: 2 }],
    }));
  });

  it("passes a valid inventory adjustment through the protected router with the authenticated actor", async () => {
    persistence.adjustInventory.mockResolvedValueOnce(undefined);
    await expect(appRouter.createCaller(adminContext()).admin.inventory.adjust({
      inventoryItemId: 33,
      changeQuantity: 12,
      reason: "restock",
      note: "Isolated test restock",
    })).resolves.toBeUndefined();

    expect(persistence.adjustInventory).toHaveBeenCalledWith(expect.objectContaining({
      inventoryItemId: 33,
      changeQuantity: 12,
      reason: "restock",
      actorUserId: 71,
    }));
  });

  it("issues a valid invoice through the protected router with the authenticated actor", async () => {
    persistence.getOrCreateInvoice.mockResolvedValueOnce({ id: 909, invoiceNumber: "PZ-000909", totalPaise: 27_800 });
    const invoice = await appRouter.createCaller(adminContext()).admin.invoices.issue({ orderId: 501 });

    expect(invoice).toEqual({ id: 909, invoiceNumber: "PZ-000909", totalPaise: 27_800 });
    expect(persistence.getOrCreateInvoice).toHaveBeenCalledWith(501, 71);
  });
});
