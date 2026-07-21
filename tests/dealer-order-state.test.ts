import assert from "node:assert/strict";
import test from "node:test";
import {
  appendDealerOrderMessage,
  createInitialDealerState,
  createLocalDealerOrder,
  deleteDealerOrderDraft,
  findDealerOrder,
  isDealerLocalStateForOwner,
  openDealerOrderDraft,
  saveDealerOrderDraft,
  setDealerOrderLineNote,
  startDealerOrderDraft,
  updateDealerOrderBuilder,
} from "@/lib/dealer/order-state";
import { initialDemoState } from "@/lib/mock-data";

const NOW = "2026-07-21T12:00:00.000Z";
const OWNER_KEY = "dealer@logos.ua::logos";
const IDENTITY = {
  email: "dealer@logos.ua",
  displayName: "Олена Коваль",
  company: "Logos",
} as const;

function initialState(company = IDENTITY.company, ownerKey = OWNER_KEY) {
  return createInitialDealerState(initialDemoState, ownerKey, company, NOW, "submission-1");
}

test("dealer projection removes seeded environment copy without mutating shared fixtures", () => {
  const sourceBefore = JSON.stringify(initialDemoState);
  const state = initialState();
  const visibleProjection = JSON.stringify({
    customers: state.customers.map(({ name, phone, email, address, notes }) => ({ name, phone, email, address, notes })),
    orders: state.orders.map((order) => ({
      code: order.code,
      company: order.company,
      creator: order.creator,
      po: order.po,
      note: order.note,
      stage: order.stage,
      lines: order.lines.map(({ description, privateNote }) => ({ description, privateNote })),
      messages: order.messages.map(({ author, body }) => ({ author, body })),
      timeline: order.timeline.map(({ label, detail }) => ({ label, detail })),
    })),
  });

  assert.doesNotMatch(visibleProjection, /codex|qa|demo|демо|демонстрац|тест/i);
  assert.equal(JSON.stringify(initialDemoState), sourceBefore);
  assert.equal(state.builder.title, "Нове замовлення");
});

test("dealer projection preserves ordinary backend records instead of rewriting matching words", () => {
  const source = structuredClone(initialDemoState);
  const fixtureCustomer = source.customers[0];
  const fixtureOrder = source.orders[0];
  assert.ok(fixtureCustomer);
  assert.ok(fixtureOrder);

  source.customers.push({
    ...fixtureCustomer,
    id: "customer-demo-service",
    name: "Demo Service LLC",
    email: "qa@test.ua",
    notes: "Test fleet customer",
  });
  source.orders.push({
    ...fixtureOrder,
    id: "order-demo-service",
    code: "TEST-01",
    customerId: "customer-demo-service",
    po: "DEMO-PO-1",
    note: "Test fleet parts",
    messages: fixtureOrder.messages.map((message) => ({
      ...message,
      id: "ordinary-message",
      body: "Demo Service requested a test part",
    })),
  });

  const state = createInitialDealerState(source, OWNER_KEY, IDENTITY.company, NOW, "submission-ordinary");
  const customer = state.customers.find((item) => item.id === "customer-demo-service");
  const order = state.orders.find((item) => item.id === "order-demo-service");

  assert.equal(customer?.name, "Demo Service LLC");
  assert.equal(customer?.email, "qa@test.ua");
  assert.equal(order?.po, "DEMO-PO-1");
  assert.equal(order?.messages[0]?.body, "Demo Service requested a test part");
});

test("draft save, reopen, update, and delete preserve builder metadata and cart", () => {
  let state = initialState();
  state = {
    ...state,
    cart: [{ partNumber: "9779150", quantity: 3, sourceDiagramId: "diagram-1" }],
  };
  state = updateDealerOrderBuilder(state, {
    title: "Термінове замовлення",
    customerId: state.customers[0]?.id ?? "",
    po: "PO-77",
    note: "Передзвонити перед відправкою",
    delivery: "pickup",
  }, "2026-07-21T12:01:00.000Z");

  const firstSave = saveDealerOrderDraft(state, "draft-1", "2026-07-21T12:02:00.000Z");
  assert.equal(firstSave.draft.title, "Термінове замовлення");
  assert.deepEqual(firstSave.draft.lines, state.cart);
  assert.equal(firstSave.state.builder.activeDraftId, "draft-1");

  const cleared = startDealerOrderDraft(
    firstSave.state,
    "2026-07-21T12:02:30.000Z",
    "submission-blank",
  );
  const reopened = openDealerOrderDraft(cleared, "draft-1", "2026-07-21T12:03:00.000Z");
  assert.equal(reopened.builder.title, "Термінове замовлення");
  assert.equal(reopened.builder.po, "PO-77");
  assert.deepEqual(reopened.cart, state.cart);

  const updated = updateDealerOrderBuilder(reopened, { note: "Оновлена примітка" }, "2026-07-21T12:04:00.000Z");
  const secondSave = saveDealerOrderDraft(updated, "unused-id", "2026-07-21T12:05:00.000Z");
  assert.equal(secondSave.state.drafts.length, 1);
  assert.equal(secondSave.draft.id, "draft-1");
  assert.equal(secondSave.draft.note, "Оновлена примітка");

  const deleted = deleteDealerOrderDraft(secondSave.state, "draft-1", "submission-2", "2026-07-21T12:06:00.000Z");
  assert.equal(deleted.drafts.length, 0);
  assert.equal(deleted.builder.activeDraftId, null);
});

test("local order creation is identity-derived, atomic, and idempotent", () => {
  let state = initialState();
  state = {
    ...state,
    cart: [{ partNumber: "9779150", quantity: 2 }],
  };
  state = updateDealerOrderBuilder(state, {
    customerId: state.customers[0]?.id ?? "",
    po: "PO-88",
    note: "Самовивіз після комплектації",
    delivery: "pickup",
  }, "2026-07-21T12:01:00.000Z");

  const first = createLocalDealerOrder(state, IDENTITY, "2026-07-21T12:02:00.000Z", "order-1", "submission-2");
  assert.equal(first.created, true);
  assert.equal(first.order.company, IDENTITY.company);
  assert.equal(first.order.creator, IDENTITY.displayName);
  assert.equal(first.order.po, "PO-88");
  assert.equal(first.state.cart.length, 0);
  assert.equal(first.state.builder.customerId, "");
  assert.equal(first.state.builder.submissionKey, "submission-2");

  const duplicateState = {
    ...first.state,
    builder: { ...state.builder },
    cart: [...state.cart],
  };
  const duplicate = createLocalDealerOrder(duplicateState, IDENTITY, "2026-07-21T12:03:00.000Z", "order-2", "submission-3");
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.order.id, first.order.id);
  assert.equal(duplicate.state.orders.length, first.state.orders.length);
});

test("notes and attachment metadata persist with timeline events but no file contents", () => {
  let state = initialState();
  const order = state.orders[0];
  assert.ok(order);

  state = appendDealerOrderMessage(state, {
    orderId: order.id,
    body: "Уточніть строк поставки",
    attachments: [{ name: "request.pdf", size: 1280, mimeType: "application/pdf" }],
    identity: IDENTITY,
    now: "2026-07-21T12:10:00.000Z",
    messageId: "message-2",
    eventId: "event-message-2",
  });
  const withMessage = findDealerOrder(state, order.code);
  assert.ok(withMessage);
  assert.equal(withMessage.messages.at(-1)?.attachments[0]?.name, "request.pdf");
  assert.equal("bytes" in (withMessage.messages.at(-1)?.attachments[0] ?? {}), false);
  assert.equal(withMessage.timeline.at(-1)?.label, "Повідомлення додано");

  state = setDealerOrderLineNote(state, {
    orderId: order.code,
    partNumber: order.lines[0]?.partNumber ?? "",
    note: "Перевірити сумісність",
    now: "2026-07-21T12:11:00.000Z",
    eventId: "event-note-1",
  });
  const withNote = findDealerOrder(state, order.id);
  assert.equal(withNote?.lines[0]?.privateNote, "Перевірити сумісність");
  assert.equal(withNote?.timeline.at(-1)?.label, "Нотатку оновлено");
});

test("owner validation rejects cross-account and malformed persisted state", () => {
  const state = initialState();
  assert.equal(isDealerLocalStateForOwner(state, OWNER_KEY), true);
  assert.equal(isDealerLocalStateForOwner(state, "other@dealer.ua::other"), false);

  const corrupt = structuredClone(state) as unknown as {
    orders: Array<{ messages: Array<Record<string, unknown>> }>;
  };
  delete corrupt.orders[0]?.messages[0]?.attachments;
  assert.equal(isDealerLocalStateForOwner(corrupt, OWNER_KEY), false);
});

test("initial projection exposes only records owned by the authenticated dealer company", () => {
  const source = structuredClone(initialDemoState);
  const seededOrder = source.orders[0];
  const seededCustomer = source.customers[0];
  assert.ok(seededOrder);
  assert.ok(seededCustomer);
  source.cart = [{ partNumber: "9779150", quantity: 4 }];
  source.customers.push({
    ...seededCustomer,
    id: "customer-other",
    name: "Інший клієнт",
    email: "client@other.ua",
  });
  source.orders.push({
    ...seededOrder,
    id: "order-other",
    code: "OTH-01",
    company: "Other Dealer",
    customerId: "customer-other",
  });

  const other = createInitialDealerState(
    source,
    "operator@other.ua::other-dealer",
    "Other Dealer",
    NOW,
    "submission-other",
  );

  assert.deepEqual(other.orders.map((order) => order.id), ["order-other"]);
  assert.deepEqual(other.customers.map((customer) => customer.id), ["customer-other"]);
  assert.equal(other.orders.some((order) => order.company === "Logos"), false);
  assert.equal(other.customers.some((customer) => customer.id === seededCustomer.id), false);
  assert.deepEqual(other.cart, []);
});

test("draft switching refuses to discard unsaved builder or cart work", () => {
  let state = initialState();
  state = { ...state, cart: [{ partNumber: "9779150", quantity: 1 }] };
  assert.throws(
    () => startDealerOrderDraft(state, "2026-07-21T12:01:00.000Z", "submission-2"),
    /Спочатку збережіть/,
  );

  state = updateDealerOrderBuilder(state, { title: "Поточна чернетка" }, "2026-07-21T12:02:00.000Z");
  const saved = saveDealerOrderDraft(state, "draft-current", "2026-07-21T12:03:00.000Z").state;
  const modified = updateDealerOrderBuilder(saved, { note: "Ще не збережено" }, "2026-07-21T12:04:00.000Z");
  assert.throws(
    () => openDealerOrderDraft(modified, "draft-current", "2026-07-21T12:05:00.000Z"),
    /Спочатку збережіть/,
  );
});

test("order creation rejects an unresolved cart line without clearing work", () => {
  let state = initialState();
  state = {
    ...state,
    cart: [{ partNumber: "UNKNOWN-SKU", quantity: 1 }],
    builder: { ...state.builder, customerId: state.customers[0]?.id ?? "" },
  };
  assert.throws(
    () => createLocalDealerOrder(state, IDENTITY, "2026-07-21T12:02:00.000Z", "order-1", "submission-2"),
    /Кошик не змінено/,
  );
  assert.equal(state.cart[0]?.partNumber, "UNKNOWN-SKU");
});
