import { getPart } from "@/lib/mock-data";
import type { DemoState, Order, OrderMessage } from "@/lib/types";
import type {
  DealerAttachmentMetadata,
  DealerCustomer,
  DealerCustomerCategory,
  DealerIdentity,
  DealerLocalState,
  DealerOrder,
  DealerOrderBuilder,
  DealerOrderDraft,
  DealerOrderMessage,
  DealerSnapshot,
} from "@/lib/dealer/contracts";
import { dealerCustomerCategories } from "@/lib/dealer/contracts";
import type { CustomerInput, EquipmentInput } from "@/lib/types";

const sourceFixtureCustomerId = "codex-qa-client";
const sourceFixtureOrderId = "a20b2bdd-2a1f-4322-a50a-fe68a17f4963";

function initialBuilder(now: string, submissionKey: string): DealerOrderBuilder {
  return {
    title: "Нове замовлення",
    customerId: "",
    po: "",
    note: "",
    delivery: "standard",
    activeDraftId: null,
    submissionKey,
    updatedAt: now,
  };
}

function projectMessage(message: OrderMessage, replaceFixtureCopy: boolean): DealerOrderMessage {
  return {
    id: message.id,
    author: replaceFixtureCopy ? "Дилер" : message.author,
    role: message.role,
    body: replaceFixtureCopy
      ? "Уточніть, будь ласка, наявність позиції."
      : message.body,
    createdAt: message.createdAt,
    attachments: [],
  };
}

function projectOrder(order: Order): DealerOrder {
  const replaceFixtureCopy = order.id === sourceFixtureOrderId;
  return {
    ...order,
    po: replaceFixtureCopy ? "PO-2026-001" : order.po,
    note: replaceFixtureCopy ? "" : order.note,
    lines: order.lines.map((line) => ({
      ...line,
      privateNote: replaceFixtureCopy && line.privateNote
        ? "Уточнити сумісність позиції"
        : line.privateNote,
    })),
    messages: order.messages.map((message) => projectMessage(message, replaceFixtureCopy)),
    timeline: order.timeline.map((event) => ({
      ...event,
      detail: replaceFixtureCopy && event.id === "event-2"
        ? "Додано повідомлення дилера"
        : event.detail,
    })),
  };
}

export function createEmptyDealerState(now: string, submissionKey: string): DealerLocalState {
  return {
    version: 2,
    ownerKey: "",
    customers: [],
    equipment: [],
    cart: [],
    orders: [],
    workshopOrders: [],
    builder: initialBuilder(now, submissionKey),
    drafts: [],
  };
}

export function createInitialDealerState(
  source: DemoState,
  ownerKey: string,
  company: string,
  now: string,
  submissionKey: string,
): DealerLocalState {
  const normalizedCompany = company.trim().toLocaleLowerCase("uk-UA");
  const scopedOrders = source.orders.filter(
    (order) => order.company.trim().toLocaleLowerCase("uk-UA") === normalizedCompany,
  );
  const scopedCustomerIds = new Set(scopedOrders.map((order) => order.customerId));
  const scopedCustomers = source.customers.filter((customer) => scopedCustomerIds.has(customer.id));
  const scopedEquipment = source.equipment.filter((item) => scopedCustomerIds.has(item.customerId));
  const scopedWorkshopOrders = source.workshopOrders.filter((item) => scopedCustomerIds.has(item.customerId));

  return {
    version: 2,
    ownerKey,
    customers: scopedCustomers.map((customer): DealerCustomer => ({
      ...customer,
      category: "retail",
      ...(customer.id === sourceFixtureCustomerId ? {
        name: "Клієнт Logos",
        phone: "+380 44 000 00 00",
        email: "client@logos.ua",
        address: "Київ",
        notes: "",
      } : {}),
    })),
    equipment: scopedEquipment.map((item) => ({ ...item })),
    cart: [],
    orders: scopedOrders.map(projectOrder),
    workshopOrders: scopedWorkshopOrders.map((item) => ({ ...item })),
    builder: initialBuilder(now, submissionKey),
    drafts: [],
  };
}

export function createDealerCustomer(
  state: DealerLocalState,
  input: { customer: CustomerInput; category?: DealerCustomerCategory; id: string; now: string },
): { state: DealerLocalState; customer: DealerCustomer } {
  const customer: DealerCustomer = {
    ...input.customer,
    category: input.category ?? "retail",
    id: input.id,
    createdAt: input.now,
  };
  return {
    customer,
    state: { ...state, customers: [customer, ...state.customers] },
  };
}

export function updateDealerCustomer(
  state: DealerLocalState,
  input: { id: string; customer: CustomerInput; category?: DealerCustomerCategory },
): DealerLocalState {
  if (!state.customers.some((customer) => customer.id === input.id)) {
    throw new Error("Клієнта не знайдено.");
  }
  return {
    ...state,
    customers: state.customers.map((customer) => customer.id === input.id
      ? { ...customer, ...input.customer, category: input.category ?? customer.category }
      : customer),
  };
}

export function deleteDealerCustomer(state: DealerLocalState, customerId: string): DealerLocalState {
  const customer = state.customers.find((item) => item.id === customerId);
  if (!customer) throw new Error("Клієнта не знайдено.");
  const related = state.orders.some((order) => order.customerId === customerId)
    || state.equipment.some((equipment) => equipment.customerId === customerId)
    || state.workshopOrders.some((order) => order.customerId === customerId);
  if (related) throw new Error("Клієнта неможливо видалити: є пов’язані записи.");
  return { ...state, customers: state.customers.filter((item) => item.id !== customerId) };
}

export function updateDealerEquipment(
  state: DealerLocalState,
  input: { id: string; customerId: string; equipment: EquipmentInput },
): DealerLocalState {
  const equipment = state.equipment.find((item) => item.id === input.id);
  if (!equipment) throw new Error("Техніку не знайдено.");
  if (equipment.customerId !== input.customerId || input.equipment.customerId !== input.customerId) {
    throw new Error("Техніка не належить клієнту.");
  }
  if (!state.customers.some((customer) => customer.id === input.customerId)) {
    throw new Error("Клієнта не знайдено.");
  }
  return {
    ...state,
    equipment: state.equipment.map((item) => item.id === input.id
      ? { ...item, ...input.equipment, customerId: input.customerId }
      : item),
  };
}

export function deleteDealerEquipment(
  state: DealerLocalState,
  input: { id: string; customerId: string },
): DealerLocalState {
  const equipment = state.equipment.find((item) => item.id === input.id);
  if (!equipment) throw new Error("Техніку не знайдено.");
  if (equipment.customerId !== input.customerId) throw new Error("Техніка не належить клієнту.");
  return { ...state, equipment: state.equipment.filter((item) => item.id !== input.id) };
}

export function updateDealerOrderBuilder(
  state: DealerLocalState,
  input: Partial<Pick<DealerOrderBuilder, "title" | "customerId" | "po" | "note" | "delivery">>,
  now: string,
): DealerLocalState {
  return {
    ...state,
    builder: {
      ...state.builder,
      ...input,
      updatedAt: now,
    },
  };
}

function sameCartLines(
  left: readonly { partNumber: string; quantity: number; sourceDiagramId?: string }[],
  right: readonly { partNumber: string; quantity: number; sourceDiagramId?: string }[],
) {
  return left.length === right.length && left.every((line, index) => {
    const other = right[index];
    return other?.partNumber === line.partNumber
      && other.quantity === line.quantity
      && other.sourceDiagramId === line.sourceDiagramId;
  });
}

export function hasUnsavedDealerOrderWork(state: DealerLocalState) {
  const active = state.builder.activeDraftId
    ? state.drafts.find((draft) => draft.id === state.builder.activeDraftId)
    : undefined;
  if (!active) {
    return state.cart.length > 0
      || state.builder.title !== "Нове замовлення"
      || Boolean(state.builder.customerId || state.builder.po || state.builder.note)
      || state.builder.delivery !== "standard";
  }
  return active.title !== state.builder.title
    || active.customerId !== state.builder.customerId
    || active.po !== state.builder.po
    || active.note !== state.builder.note
    || active.delivery !== state.builder.delivery
    || !sameCartLines(active.lines, state.cart);
}

export function startDealerOrderDraft(
  state: DealerLocalState,
  now: string,
  submissionKey: string,
): DealerLocalState {
  if (hasUnsavedDealerOrderWork(state)) {
    throw new Error("Спочатку збережіть або завершіть поточне замовлення.");
  }
  return {
    ...state,
    cart: [],
    builder: initialBuilder(now, submissionKey),
  };
}

export function saveDealerOrderDraft(
  state: DealerLocalState,
  draftId: string,
  now: string,
): { state: DealerLocalState; draft: DealerOrderDraft } {
  const existing = state.builder.activeDraftId
    ? state.drafts.find((draft) => draft.id === state.builder.activeDraftId)
    : undefined;
  const resolvedId = existing?.id ?? draftId;
  const title = state.builder.title.trim() || "Нове замовлення";
  const draft: DealerOrderDraft = {
    id: resolvedId,
    title,
    customerId: state.builder.customerId,
    po: state.builder.po,
    note: state.builder.note,
    delivery: state.builder.delivery,
    lines: state.cart.map((line) => ({ ...line })),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const drafts = existing
    ? state.drafts.map((item) => item.id === existing.id ? draft : item)
    : [draft, ...state.drafts];

  return {
    draft,
    state: {
      ...state,
      drafts,
      builder: {
        ...state.builder,
        title,
        activeDraftId: resolvedId,
        updatedAt: now,
      },
    },
  };
}

export function openDealerOrderDraft(
  state: DealerLocalState,
  draftId: string,
  now: string,
): DealerLocalState {
  const draft = state.drafts.find((item) => item.id === draftId);
  if (!draft) throw new Error("Чернетку не знайдено.");
  if (state.builder.activeDraftId === draftId && !hasUnsavedDealerOrderWork(state)) return state;
  if (hasUnsavedDealerOrderWork(state)) {
    throw new Error("Спочатку збережіть або завершіть поточне замовлення.");
  }
  return {
    ...state,
    cart: draft.lines.map((line) => ({ ...line })),
    builder: {
      ...state.builder,
      title: draft.title,
      customerId: draft.customerId,
      po: draft.po,
      note: draft.note,
      delivery: draft.delivery,
      activeDraftId: draft.id,
      updatedAt: now,
    },
  };
}

export function deleteDealerOrderDraft(
  state: DealerLocalState,
  draftId: string,
  submissionKey: string,
  now: string,
): DealerLocalState {
  const wasActive = state.builder.activeDraftId === draftId;
  return {
    ...state,
    cart: wasActive ? [] : state.cart,
    drafts: state.drafts.filter((draft) => draft.id !== draftId),
    builder: wasActive ? initialBuilder(now, submissionKey) : state.builder,
  };
}

function orderCodePrefix(company: string) {
  const latin = company.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return latin.slice(0, 3) || "ORD";
}

export function findDealerOrder(state: Pick<DealerSnapshot, "orders">, idOrCode: string) {
  const normalized = idOrCode.trim().toLocaleLowerCase("uk-UA");
  return state.orders.find((order) => (
    order.id.toLocaleLowerCase("uk-UA") === normalized
    || order.code.toLocaleLowerCase("uk-UA") === normalized
  ));
}

export function createLocalDealerOrder(
  state: DealerLocalState,
  identity: DealerIdentity,
  now: string,
  orderId: string,
  nextSubmissionKey: string,
): { state: DealerLocalState; order: DealerOrder; created: boolean } {
  const duplicate = state.orders.find((order) => order.localSubmissionKey === state.builder.submissionKey);
  if (duplicate) return { state, order: duplicate, created: false };
  if (!state.customers.some((customer) => customer.id === state.builder.customerId)) {
    throw new Error("Оберіть клієнта.");
  }
  const unresolved = state.cart.find((cartLine) => !getPart(cartLine.partNumber));
  if (unresolved) {
    throw new Error(`Запчастину ${unresolved.partNumber} не знайдено. Кошик не змінено.`);
  }
  const lines = state.cart.map((cartLine) => {
    const part = getPart(cartLine.partNumber);
    if (!part) throw new Error(`Запчастину ${cartLine.partNumber} не знайдено.`);
    return {
      partNumber: part.number,
      description: part.description,
      quantity: cartLine.quantity,
      dealerPrice: part.dealerPrice,
      source: cartLine.sourceDiagramId ? "catalog" as const : "warehouse" as const,
    };
  });
  if (!lines.length) throw new Error("Додайте хоча б одну запчастину.");
  if (lines.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)) {
    throw new Error("Перевірте кількість позицій.");
  }

  const prefix = orderCodePrefix(identity.company);
  const sequence = Math.max(0, ...state.orders.map((order) => {
    const match = order.code.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
  })) + 1;
  const order: DealerOrder = {
    id: orderId,
    code: `${prefix}-${String(sequence).padStart(2, "0")}`,
    company: identity.company,
    creator: identity.displayName,
    customerId: state.builder.customerId,
    po: state.builder.po.trim(),
    note: state.builder.note.trim(),
    delivery: state.builder.delivery,
    status: "new",
    stage: "Створено",
    createdAt: now,
    lines,
    messages: [],
    timeline: [{
      id: `event-${orderId}`,
      label: "Замовлення створено",
      detail: "Замовлення додано до списку дилера",
      createdAt: now,
    }],
    localSubmissionKey: state.builder.submissionKey,
  };

  return {
    created: true,
    order,
    state: {
      ...state,
      cart: [],
      orders: [order, ...state.orders],
      drafts: state.builder.activeDraftId
        ? state.drafts.filter((draft) => draft.id !== state.builder.activeDraftId)
        : state.drafts,
      builder: initialBuilder(now, nextSubmissionKey),
    },
  };
}

function normalizeAttachments(attachments: readonly DealerAttachmentMetadata[]) {
  return attachments.map((attachment) => ({
    name: attachment.name.trim(),
    size: Math.max(0, Math.trunc(attachment.size)),
    mimeType: attachment.mimeType.trim() || "application/octet-stream",
  })).filter((attachment) => attachment.name.length > 0);
}

export function appendDealerOrderMessage(
  state: DealerLocalState,
  input: {
    orderId: string;
    body: string;
    attachments: readonly DealerAttachmentMetadata[];
    identity: DealerIdentity;
    now: string;
    messageId: string;
    eventId: string;
  },
): DealerLocalState {
  const order = findDealerOrder(state, input.orderId);
  if (!order) throw new Error("Замовлення не знайдено.");
  const attachments = normalizeAttachments(input.attachments);
  const body = input.body.trim();
  if (!body && !attachments.length) throw new Error("Введіть повідомлення або оберіть файл.");
  const message: DealerOrderMessage = {
    id: input.messageId,
    author: input.identity.displayName,
    role: "dealer",
    body,
    createdAt: input.now,
    attachments,
  };
  return {
    ...state,
    orders: state.orders.map((item) => item.id === order.id ? {
      ...item,
      messages: [...item.messages, message],
      timeline: [...item.timeline, {
        id: input.eventId,
        label: "Повідомлення додано",
        detail: attachments.length
          ? `${attachments.length} вкладення · ${body || "Без тексту"}`
          : body,
        createdAt: input.now,
      }],
    } : item),
  };
}

export function setDealerOrderLineNote(
  state: DealerLocalState,
  input: {
    orderId: string;
    partNumber: string;
    note: string;
    now: string;
    eventId: string;
  },
): DealerLocalState {
  const order = findDealerOrder(state, input.orderId);
  if (!order) throw new Error("Замовлення не знайдено.");
  if (!order.lines.some((line) => line.partNumber === input.partNumber)) {
    throw new Error("Позицію замовлення не знайдено.");
  }
  const note = input.note.trim();
  return {
    ...state,
    orders: state.orders.map((item) => item.id === order.id ? {
      ...item,
      lines: item.lines.map((line) => line.partNumber === input.partNumber
        ? { ...line, privateNote: note || undefined }
        : line),
      timeline: [...item.timeline, {
        id: input.eventId,
        label: "Нотатку оновлено",
        detail: `${input.partNumber} · ${note || "Нотатку очищено"}`,
        createdAt: input.now,
      }],
    } : item),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasStringFields(value: Record<string, unknown>, fields: readonly string[]) {
  return fields.every((field) => typeof value[field] === "string");
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function isCartLine(value: unknown) {
  return isRecord(value)
    && typeof value.partNumber === "string"
    && Number.isInteger(value.quantity)
    && Number(value.quantity) > 0
    && (value.sourceDiagramId === undefined || typeof value.sourceDiagramId === "string");
}

function isCustomer(value: unknown) {
  return isRecord(value) && hasStringFields(value, [
    "id", "name", "phone", "email", "address", "notes", "createdAt",
  ]) && dealerCustomerCategories.includes(value.category as DealerCustomerCategory);
}

function isCustomerWithOptionalCategory(value: unknown) {
  return isRecord(value) && hasStringFields(value, [
    "id", "name", "phone", "email", "address", "notes", "createdAt",
  ]) && (value.category === undefined || dealerCustomerCategories.includes(value.category as DealerCustomerCategory));
}

function isEquipment(value: unknown) {
  return isRecord(value) && hasStringFields(value, [
    "id", "customerId", "model", "vin", "year", "engineNumber", "purchasedAt", "notes",
  ]);
}

function isAttachment(value: unknown) {
  return isRecord(value)
    && typeof value.name === "string"
    && isFiniteNumber(value.size)
    && typeof value.mimeType === "string";
}

function isMessage(value: unknown) {
  return isRecord(value)
    && hasStringFields(value, ["id", "author", "body", "createdAt"])
    && (value.role === "dealer" || value.role === "admin")
    && Array.isArray(value.attachments)
    && value.attachments.every(isAttachment);
}

function isTimelineEvent(value: unknown) {
  return isRecord(value) && hasStringFields(value, ["id", "label", "detail", "createdAt"]);
}

function isOrderLine(value: unknown) {
  return isRecord(value)
    && hasStringFields(value, ["partNumber", "description"])
    && Number.isInteger(value.quantity)
    && Number(value.quantity) > 0
    && isFiniteNumber(value.dealerPrice)
    && (value.source === "warehouse" || value.source === "bossweb" || value.source === "catalog")
    && (value.privateNote === undefined || typeof value.privateNote === "string");
}

function isOrder(value: unknown) {
  const statuses = ["new", "waiting", "supplier", "ready", "sent", "done", "cancelled"];
  return isRecord(value)
    && hasStringFields(value, [
      "id", "code", "company", "creator", "customerId", "po", "note", "stage", "createdAt",
    ])
    && (value.delivery === "standard" || value.delivery === "pickup")
    && typeof value.status === "string"
    && statuses.includes(value.status)
    && Array.isArray(value.lines)
    && value.lines.every(isOrderLine)
    && Array.isArray(value.messages)
    && value.messages.every(isMessage)
    && Array.isArray(value.timeline)
    && value.timeline.every(isTimelineEvent)
    && (value.localSubmissionKey === undefined || typeof value.localSubmissionKey === "string");
}

function isBuilder(value: unknown) {
  return isRecord(value)
    && hasStringFields(value, ["title", "customerId", "po", "note", "submissionKey", "updatedAt"])
    && (value.delivery === "standard" || value.delivery === "pickup")
    && (value.activeDraftId === null || typeof value.activeDraftId === "string");
}

function isDraft(value: unknown) {
  return isRecord(value)
    && hasStringFields(value, ["id", "title", "customerId", "po", "note", "createdAt", "updatedAt"])
    && (value.delivery === "standard" || value.delivery === "pickup")
    && Array.isArray(value.lines)
    && value.lines.every(isCartLine);
}

function isWorkshopOrder(value: unknown) {
  const types = ["maintenance", "repair", "warranty", "inspection", "recall"];
  const statuses = ["new", "scheduled", "in_progress", "done"];
  return isRecord(value)
    && hasStringFields(value, [
      "id", "customerId", "description", "mechanic", "scheduledAt", "notes", "type", "status",
    ])
    && types.includes(String(value.type))
    && statuses.includes(String(value.status));
}

export function isDealerLocalState(value: unknown): value is DealerLocalState {
  if (!isRecord(value) || value.version !== 2 || typeof value.ownerKey !== "string" || !value.ownerKey) return false;
  return Array.isArray(value.customers) && value.customers.every(isCustomer)
    && Array.isArray(value.equipment) && value.equipment.every(isEquipment)
    && Array.isArray(value.cart) && value.cart.every(isCartLine)
    && Array.isArray(value.orders) && value.orders.every(isOrder)
    && Array.isArray(value.workshopOrders) && value.workshopOrders.every(isWorkshopOrder)
    && Array.isArray(value.drafts) && value.drafts.every(isDraft)
    && isBuilder(value.builder);
}

export function isDealerLocalStateForOwner(value: unknown, ownerKey: string): value is DealerLocalState {
  return isDealerLocalState(value) && value.ownerKey === ownerKey;
}

export function normalizeDealerLocalStateForOwner(value: unknown, ownerKey: string): DealerLocalState | null {
  if (!isRecord(value) || value.version !== 2 || value.ownerKey !== ownerKey) return null;
  if (!Array.isArray(value.customers) || !value.customers.every(isCustomerWithOptionalCategory)) return null;
  if (!Array.isArray(value.equipment) || !value.equipment.every(isEquipment)) return null;
  if (!Array.isArray(value.cart) || !value.cart.every(isCartLine)) return null;
  if (!Array.isArray(value.orders) || !value.orders.every(isOrder)) return null;
  if (!Array.isArray(value.workshopOrders) || !value.workshopOrders.every(isWorkshopOrder)) return null;
  if (!Array.isArray(value.drafts) || !value.drafts.every(isDraft) || !isBuilder(value.builder)) return null;

  return {
    version: 2,
    ownerKey,
    customers: value.customers.map((customer): DealerCustomer => ({
      id: customer.id as string,
      name: customer.name as string,
      phone: customer.phone as string,
      email: customer.email as string,
      address: customer.address as string,
      notes: customer.notes as string,
      createdAt: customer.createdAt as string,
      category: dealerCustomerCategories.includes(customer.category as DealerCustomerCategory)
        ? customer.category as DealerCustomerCategory
        : "retail",
    })),
    equipment: value.equipment as DealerLocalState["equipment"],
    cart: value.cart as DealerLocalState["cart"],
    orders: value.orders as DealerLocalState["orders"],
    workshopOrders: value.workshopOrders as DealerLocalState["workshopOrders"],
    drafts: value.drafts as DealerLocalState["drafts"],
    builder: value.builder as DealerLocalState["builder"],
  };
}
