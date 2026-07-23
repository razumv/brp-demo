import { expect, test } from "@playwright/test";
import { createDealerLocalAdapter, DealerLocalPersistenceError } from "@/lib/dealer/local-adapter";
import type { DealerCommandResult, DealerCustomer, DealerCustomerInput } from "@/lib/dealer/contracts";
import { createInitialDealerState } from "@/lib/dealer/order-state";
import { initialDemoState } from "@/lib/mock-data";
import type {
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
  transitionWorkshopOrder: number;
};

function createHarness(options: { failUpdateOrderBuilder?: boolean; failWorkshopTransition?: boolean } = {}) {
  const state = createInitialDealerState(initialDemoState, "dealer@example.invalid::logos", "Logos", "2026-07-21T00:00:00.000Z", "submission-test");
  state.cart = [];
  const calls: MutationCalls = {
    setCartQuantity: 0,
    removeCartLine: 0,
    appendOrderMessage: 0,
    setOrderLineNote: 0,
    createWorkshopOrder: 0,
    transitionWorkshopOrder: 0,
  };

  const commands = createDealerLocalAdapter({
    state,
    isReady() { return true; },
    addToCart() {},
    setCartQuantity() {
      calls.setCartQuantity += 1;
    },
    removeFromCart() {
      calls.removeCartLine += 1;
    },
    clearCart() {},
    addCustomer(input: DealerCustomerInput): DealerCustomer {
      return { ...input, category: input.category ?? "retail", id: "customer-created", createdAt: "2026-07-21T00:00:00.000Z" };
    },
    updateCustomer() {},
    deleteCustomer() {},
    addEquipment(input: EquipmentInput): Equipment {
      return { ...input, id: "equipment-created" };
    },
    updateEquipment() {},
    deleteEquipment() {},
    updateOrderBuilder() {
      if (options.failUpdateOrderBuilder) {
        throw new DealerLocalPersistenceError();
      }
    },
    startOrderDraft() {},
    saveOrderDraft() {
      return {
        id: "draft-created",
        title: "Draft",
        customerId: "",
        po: "",
        note: "",
        delivery: "standard",
        lines: [],
        createdAt: "2026-07-21T00:00:00.000Z",
        updatedAt: "2026-07-21T00:00:00.000Z",
      };
    },
    openOrderDraft() {},
    deleteOrderDraft() {},
    refreshOrderDrafts() {
      return state.drafts;
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
    transitionWorkshopOrder() {
      calls.transitionWorkshopOrder += 1;
      if (options.failWorkshopTransition) throw new DealerLocalPersistenceError();
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

test("workshop status transition validates the record and returns a durable local result", async () => {
  const { calls, commands, state } = createHarness();
  const existing = {
    id: "workshop-existing",
    type: "maintenance" as const,
    customerId: state.customers[0]?.id ?? "",
    description: "Seasonal service",
    mechanic: "",
    scheduledAt: "",
    notes: "",
    status: "new" as const,
  };
  state.workshopOrders = [existing];

  const missing = await commands.transitionWorkshopOrder({ id: "missing-workshop", status: "done" });
  const moved = await commands.transitionWorkshopOrder({ id: existing.id, status: "scheduled" });

  expectValidationError(missing);
  expect(calls.transitionWorkshopOrder).toBe(1);
  expect(moved).toEqual({ ok: true, kind: "local-mutation", value: undefined });
});

test("workshop status transition reports a persistence failure without claiming success", async () => {
  const { commands, state } = createHarness({ failWorkshopTransition: true });
  const existing = {
    id: "workshop-existing",
    type: "maintenance" as const,
    customerId: state.customers[0]?.id ?? "",
    description: "Seasonal service",
    mechanic: "",
    scheduledAt: "",
    notes: "",
    status: "new" as const,
  };
  state.workshopOrders = [existing];

  await expect(commands.transitionWorkshopOrder({ id: existing.id, status: "done" })).resolves.toEqual({
    ok: false,
    kind: "local-error",
    message: "Не вдалося зберегти зміни на пристрої.",
    retryable: true,
  });
});

test("local mutations return a truthful failure when durable persistence is unavailable", async () => {
  const { commands } = createHarness({ failUpdateOrderBuilder: true });

  const result = await commands.updateOrderBuilder({ title: "Saved only in memory" });

  expect(result).toEqual({
    ok: false,
    kind: "local-error",
    message: "Не вдалося зберегти зміни на пристрої.",
    retryable: true,
  });
});
