import { expect, test } from "@playwright/test";
import { createDealerLocalAdapter } from "@/lib/dealer/local-adapter";
import type { DealerCommandResult } from "@/lib/dealer/contracts";
import { initialDemoState } from "@/lib/mock-data";
import type {
  Customer,
  CustomerInput,
  DemoState,
  Equipment,
  EquipmentInput,
  OrderInput,
  WorkshopOrder,
  WorkshopOrderInput,
} from "@/lib/types";

type MutationCalls = {
  setCartQuantity: number;
  removeCartLine: number;
  appendOrderMessage: number;
  setOrderLineNote: number;
  createWorkshopOrder: number;
};

function createHarness() {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.cart = [];
  const calls: MutationCalls = {
    setCartQuantity: 0,
    removeCartLine: 0,
    appendOrderMessage: 0,
    setOrderLineNote: 0,
    createWorkshopOrder: 0,
  };

  const commands = createDealerLocalAdapter({
    state,
    addToCart() {},
    setCartQuantity() {
      calls.setCartQuantity += 1;
    },
    removeFromCart() {
      calls.removeCartLine += 1;
    },
    clearCart() {},
    addCustomer(input: CustomerInput): Customer {
      return { ...input, id: "customer-created", createdAt: "2026-07-21T00:00:00.000Z" };
    },
    updateCustomer() {},
    addEquipment(input: EquipmentInput): Equipment {
      return { ...input, id: "equipment-created" };
    },
    createOrder(input: OrderInput) {
      const existing = state.orders[0];
      if (!existing) throw new Error(`No order fixture for ${input.customerId}`);
      return existing;
    },
    addOrderMessage() {
      calls.appendOrderMessage += 1;
    },
    setLineNote() {
      calls.setOrderLineNote += 1;
    },
    addWorkshopOrder(input: WorkshopOrderInput): WorkshopOrder {
      calls.createWorkshopOrder += 1;
      return { ...input, id: "workshop-created", status: "new" };
    },
  }, {
    async writeClipboard() {},
  });

  return { calls, commands, state };
}

function expectValidationError<T>(result: DealerCommandResult<T>) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.kind).toBe("validation-error");
}

test("set quantity rejects a missing cart line without calling the store", async () => {
  const { calls, commands } = createHarness();

  const result = await commands.setCartQuantity({ partNumber: "9779150", quantity: 2 });

  expectValidationError(result);
  expect(calls.setCartQuantity).toBe(0);
});

test("remove rejects a missing cart line without calling the store", async () => {
  const { calls, commands } = createHarness();

  const result = await commands.removeCartLine({ partNumber: "9779150" });

  expectValidationError(result);
  expect(calls.removeCartLine).toBe(0);
});

test("message append rejects a missing order without calling the store", async () => {
  const { calls, commands } = createHarness();

  const result = await commands.appendOrderMessage({ orderId: "missing-order", body: "Message" });

  expectValidationError(result);
  expect(calls.appendOrderMessage).toBe(0);
});

test("line note rejects missing orders and lines without calling the store", async () => {
  const { calls, commands, state } = createHarness();
  const order = state.orders[0];
  if (!order) throw new Error("Order fixture is required");

  const missingOrder = await commands.setOrderLineNote({
    orderId: "missing-order",
    partNumber: "9779150",
    note: "Note",
  });
  const missingLine = await commands.setOrderLineNote({
    orderId: order.id,
    partNumber: "missing-part",
    note: "Note",
  });

  expectValidationError(missingOrder);
  expectValidationError(missingLine);
  expect(calls.setOrderLineNote).toBe(0);
});

test("workshop creation rejects an unknown customer without calling the store", async () => {
  const { calls, commands } = createHarness();

  const result = await commands.createWorkshopOrder({
    type: "maintenance",
    customerId: "missing-customer",
    description: "Seasonal service",
    mechanic: "",
    scheduledAt: "",
    notes: "",
  });

  expectValidationError(result);
  expect(calls.createWorkshopOrder).toBe(0);
});
