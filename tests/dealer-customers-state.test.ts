import assert from "node:assert/strict";
import test from "node:test";
import { initialDemoState } from "@/lib/mock-data";
import {
  createDealerCustomer,
  createInitialDealerState,
  deleteDealerCustomer,
  deleteDealerEquipment,
  normalizeDealerLocalStateForOwner,
  updateDealerEquipment,
} from "@/lib/dealer/order-state";

function createState() {
  return createInitialDealerState(
    initialDemoState,
    "orders@logos.ua::logos",
    "Logos",
    "2026-07-21T10:00:00.000Z",
    "submission-1",
  );
}

test("creates a customer with an explicit category that can be filtered deterministically", () => {
  const state = createState();
  const result = createDealerCustomer(state, {
    customer: {
      name: "ТОВ Водний світ",
      phone: "+380441112233",
      email: "office@water.example",
      address: "Київ",
      notes: "",
    },
    category: "service",
    id: "customer-water",
    now: "2026-07-21T10:00:00.000Z",
  });

  assert.equal(result.customer.category, "service");
  assert.equal(result.state.customers.filter((customer) => customer.category === "service").length, 1);
});

test("does not delete a customer with related orders or equipment", () => {
  const state = createState();
  const customer = state.customers[0];
  assert.ok(customer);

  assert.throws(() => deleteDealerCustomer(state, customer.id), /пов’язані записи/i);
  assert.equal(state.customers.length, 1);
});

test("does not delete a customer referenced by active or saved order work", () => {
  const state = createState();
  const customer = state.customers[0];
  assert.ok(customer);
  const withoutCompletedRelations = {
    ...state,
    orders: [],
    equipment: [],
    workshopOrders: [],
    builder: { ...state.builder, customerId: customer.id },
  };

  assert.throws(() => deleteDealerCustomer(withoutCompletedRelations, customer.id), /пов’язані записи/i);

  const withSavedDraft = {
    ...withoutCompletedRelations,
    builder: { ...withoutCompletedRelations.builder, customerId: "" },
    drafts: [{
      id: "draft-customer",
      title: "Замовлення клієнта",
      customerId: customer.id,
      po: "",
      note: "",
      delivery: "standard" as const,
      lines: [],
      createdAt: "2026-07-21T10:00:00.000Z",
      updatedAt: "2026-07-21T10:00:00.000Z",
    }],
  };
  assert.throws(() => deleteDealerCustomer(withSavedDraft, customer.id), /пов’язані записи/i);
});

test("updates and deletes equipment only for the owning customer", () => {
  const state = createState();
  const customer = state.customers[0];
  assert.ok(customer);
  const withEquipment = {
    ...state,
    equipment: [{
      id: "equipment-1",
      customerId: customer.id,
      model: "Outlander 500",
      vin: "ABC123",
      year: "2024",
      engineNumber: "ENG-1",
      purchasedAt: "2024-06-01",
      notes: "",
    }],
  };

  const edited = updateDealerEquipment(withEquipment, {
    id: "equipment-1",
    customerId: customer.id,
    equipment: {
      customerId: customer.id,
      model: "Outlander 700",
      vin: "ABC123",
      year: "2024",
      engineNumber: "ENG-2",
      purchasedAt: "2024-06-01",
      notes: "Оновлено",
    },
  });
  assert.equal(edited.equipment[0]?.model, "Outlander 700");

  assert.throws(() => updateDealerEquipment(edited, {
    id: "equipment-1",
    customerId: "other-customer",
    equipment: edited.equipment[0]!,
  }), /не належить клієнту/i);
  assert.equal(deleteDealerEquipment(edited, {
    id: "equipment-1",
    customerId: customer.id,
  }).equipment.length, 0);
});

test("migrates a prior v2 dealer payload without categories without discarding workflow data", () => {
  const state = createState();
  const persisted = JSON.parse(JSON.stringify({
    ...state,
    cart: [{ partNumber: "9779150", quantity: 2 }],
    drafts: [{
      id: "draft-1",
      title: "Поставка",
      customerId: state.customers[0]?.id ?? "",
      po: "PO-1",
      note: "",
      delivery: "standard",
      lines: [{ partNumber: "9779150", quantity: 2 }],
      createdAt: "2026-07-21T10:00:00.000Z",
      updatedAt: "2026-07-21T10:00:00.000Z",
    }],
  })) as { customers: Array<Record<string, unknown>> };
  for (const customer of persisted.customers) delete customer.category;

  const migrated = normalizeDealerLocalStateForOwner(persisted, "orders@logos.ua::logos");
  assert.ok(migrated);
  assert.equal(migrated.customers[0]?.category, "retail");
  assert.deepEqual(migrated.cart, [{ partNumber: "9779150", quantity: 2 }]);
  assert.equal(migrated.drafts[0]?.id, "draft-1");
  assert.equal(migrated.orders[0]?.id, state.orders[0]?.id);
});
