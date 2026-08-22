import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

const databaseIt = process.env.DATABASE_URL ? it : it.skip;

function adminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-integration-test",
      name: "Admin Integration Test",
      email: "admin-integration@example.com",
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

describe("protected operational procedures", () => {
  databaseIt("synchronizes and exposes the persisted 81-item, 11-category catalog baseline", async () => {
    const caller = appRouter.createCaller(adminContext());
    const sync = await caller.admin.catalog.sync();
    const items = await caller.admin.catalog.list();

    expect(sync).toEqual({ categories: 11, items: 81 });
    expect(items).toHaveLength(81);
    expect(new Set(items.map(item => item.categoryName)).size).toBe(11);
  }, 30_000);

  databaseIt("rejects invalid persisted-resource inputs without inserting operating data", async () => {
    const caller = appRouter.createCaller(adminContext());

    await expect(caller.admin.orders.create({
      source: "whatsapp",
      paymentMethod: "cash",
      paymentStatus: "unpaid",
      discountPaise: 0,
      lines: [{ menuItemId: 999_999_999, quantity: 1 }],
    })).rejects.toThrow("One or more menu items no longer exist");

    await expect(caller.admin.inventory.adjust({
      inventoryItemId: 999_999_999,
      changeQuantity: 1,
      reason: "restock",
    })).rejects.toThrow("Inventory item not found");

    await expect(caller.admin.invoices.detail({ invoiceId: 999_999_999 })).rejects.toThrow("Invoice not found");
  });
});
