import { getPart } from "@/lib/mock-data";
import type {
  Equipment,
  EquipmentInput,
  OrderInput,
  WorkshopOrder,
  WorkshopOrderInput,
} from "@/lib/types";
import type {
  DealerAttachmentMetadata,
  DealerCapability,
  DealerCommandResult,
  DealerCommands,
  DealerCustomer,
  DealerCustomerInput,
  DealerExternalOperation,
  DealerLocalState,
  DealerOrder,
  DealerOrderDraft,
  DealerOrderBuilder,
} from "@/lib/dealer/contracts";
import { dealerCustomerCategories } from "@/lib/dealer/contracts";
import { findDealerOrder } from "@/lib/dealer/order-state";
import { DealerLocalPersistenceError } from "@/lib/dealer/workflow-persistence";

export { DealerLocalPersistenceError } from "@/lib/dealer/workflow-persistence";

export type DealerStorePort = {
  readonly state: DealerLocalState;
  isReady: () => boolean;
  addToCart: (partNumber: string, quantity?: number, sourceDiagramId?: string) => void;
  setCartQuantity: (partNumber: string, quantity: number) => void;
  removeFromCart: (partNumber: string) => void;
  clearCart: () => void;
  addCustomer: (input: DealerCustomerInput) => DealerCustomer;
  updateCustomer: (id: string, input: DealerCustomerInput) => void;
  deleteCustomer: (id: string) => void;
  addEquipment: (input: EquipmentInput) => Equipment;
  updateEquipment: (id: string, customerId: string, input: EquipmentInput) => void;
  deleteEquipment: (id: string, customerId: string) => void;
  updateOrderBuilder: (
    input: Partial<Pick<DealerOrderBuilder, "title" | "customerId" | "po" | "note" | "delivery">>,
  ) => void;
  startOrderDraft: () => void;
  saveOrderDraft: () => DealerOrderDraft;
  openOrderDraft: (draftId: string) => void;
  deleteOrderDraft: (draftId: string) => void;
  refreshOrderDrafts: () => readonly DealerOrderDraft[];
  createOrder: (input: OrderInput) => DealerOrder;
  addOrderMessage: (
    orderId: string,
    body: string,
    attachments: readonly DealerAttachmentMetadata[],
  ) => void;
  setLineNote: (orderId: string, partNumber: string, note: string) => void;
  addWorkshopOrder: (input: WorkshopOrderInput) => WorkshopOrder;
};

type BrowserPort = {
  writeClipboard: (text: string) => Promise<void>;
};

const unavailableCapability = {
  status: "unavailable",
  reason: "contract-unconfirmed",
} as const satisfies DealerCapability;

export const dealerCapabilities = {
  sync: unavailableCapability,
  "sync-1c": unavailableCapability,
  upload: unavailableCapability,
  download: unavailableCapability,
  export: unavailableCapability,
  "remote-order-submit": unavailableCapability,
  approval: unavailableCapability,
  shipment: unavailableCapability,
  "team-management": unavailableCapability,
  "permission-management": unavailableCapability,
} satisfies Record<DealerExternalOperation, DealerCapability>;

function localMutation<T>(value: T): DealerCommandResult<T> {
  return { ok: true, kind: "local-mutation", value };
}

function validationError(
  field: string,
  code: string,
  message: string,
): DealerCommandResult<never> {
  return { ok: false, kind: "validation-error", issues: [{ field, code, message }] };
}

function sessionRequired<T>(): DealerCommandResult<T> {
  return validationError("session", "dealer-session-required", "Дилерська сесія недоступна.");
}

function stateMutationError(field: string, error: unknown): DealerCommandResult<never> {
  if (error instanceof DealerLocalPersistenceError) {
    return {
      ok: false,
      kind: "local-error",
      message: error.message,
      retryable: true,
    };
  }
  return validationError(
    field,
    "state-conflict",
    error instanceof Error ? error.message : "Не вдалося зберегти зміни.",
  );
}

function runLocalMutation<T>(
  field: string,
  operation: () => T,
  fallbackCode = "state-conflict",
  fallbackMessage = "Не вдалося зберегти зміни.",
): DealerCommandResult<T> {
  try {
    return localMutation(operation());
  } catch (error) {
    if (error instanceof DealerLocalPersistenceError) {
      return stateMutationError(field, error);
    }
    return validationError(
      field,
      fallbackCode,
      error instanceof Error ? error.message : fallbackMessage,
    );
  }
}

export function createDealerLocalAdapter(
  store: DealerStorePort,
  browser: BrowserPort,
): DealerCommands {
  return {
    async addCartLine({ partNumber, quantity = 1, sourceDiagramId }) {
      if (!store.isReady()) return sessionRequired();
      if (!getPart(partNumber)) {
        return validationError("partNumber", "unknown-part", "Запчастину не знайдено.");
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return validationError("quantity", "invalid-quantity", "Кількість має бути більшою за нуль.");
      }
      return runLocalMutation("cart", () => store.addToCart(partNumber, quantity, sourceDiagramId));
    },
    async setCartQuantity({ partNumber, quantity }) {
      if (!store.isReady()) return sessionRequired();
      if (!Number.isInteger(quantity)) {
        return validationError("quantity", "invalid-quantity", "Кількість має бути цілим числом.");
      }
      if (!store.state.cart.some((line) => line.partNumber === partNumber)) {
        return validationError("partNumber", "not-found", "Позицію кошика не знайдено.");
      }
      return runLocalMutation("cart", () => store.setCartQuantity(partNumber, quantity));
    },
    async removeCartLine({ partNumber }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.cart.some((line) => line.partNumber === partNumber)) {
        return validationError("partNumber", "not-found", "Позицію кошика не знайдено.");
      }
      return runLocalMutation("cart", () => store.removeFromCart(partNumber));
    },
    async clearCart() {
      if (!store.isReady()) return sessionRequired();
      return runLocalMutation("cart", () => store.clearCart());
    },
    async createCustomer(input) {
      if (!store.isReady()) return sessionRequired();
      if (!input.name.trim()) {
        return validationError("name", "required", "Вкажіть ім’я клієнта.");
      }
      if (input.category && !dealerCustomerCategories.includes(input.category)) {
        return validationError("category", "invalid-category", "Оберіть категорію клієнта.");
      }
      return runLocalMutation("customer", () => store.addCustomer(input));
    },
    async updateCustomer({ id, customer }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.customers.some((item) => item.id === id)) {
        return validationError("id", "not-found", "Клієнта не знайдено.");
      }
      if (customer.category && !dealerCustomerCategories.includes(customer.category)) {
        return validationError("category", "invalid-category", "Оберіть категорію клієнта.");
      }
      return runLocalMutation("id", () => store.updateCustomer(id, customer));
    },
    async deleteCustomer({ id }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.customers.some((item) => item.id === id)) {
        return validationError("id", "not-found", "Клієнта не знайдено.");
      }
      const hasRelatedRecords = store.state.orders.some((order) => order.customerId === id)
        || store.state.equipment.some((equipment) => equipment.customerId === id)
        || store.state.workshopOrders.some((order) => order.customerId === id)
        || store.state.drafts.some((draft) => draft.customerId === id)
        || store.state.builder.customerId === id;
      if (hasRelatedRecords) {
        return validationError("id", "related-records", "Клієнта неможливо видалити: є пов’язані записи.");
      }
      return runLocalMutation("id", () => store.deleteCustomer(id));
    },
    async createEquipment(input) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.customers.some((item) => item.id === input.customerId)) {
        return validationError("customerId", "not-found", "Клієнта не знайдено.");
      }
      return runLocalMutation("equipment", () => store.addEquipment(input));
    },
    async updateEquipment({ id, customerId, equipment }) {
      if (!store.isReady()) return sessionRequired();
      const current = store.state.equipment.find((item) => item.id === id);
      if (!current) return validationError("id", "not-found", "Техніку не знайдено.");
      if (current.customerId !== customerId || equipment.customerId !== customerId) {
        return validationError("customerId", "ownership", "Техніка не належить клієнту.");
      }
      return runLocalMutation("id", () => store.updateEquipment(id, customerId, equipment));
    },
    async deleteEquipment({ id, customerId }) {
      if (!store.isReady()) return sessionRequired();
      const current = store.state.equipment.find((item) => item.id === id);
      if (!current) return validationError("id", "not-found", "Техніку не знайдено.");
      if (current.customerId !== customerId) {
        return validationError("customerId", "ownership", "Техніка не належить клієнту.");
      }
      return runLocalMutation("id", () => store.deleteEquipment(id, customerId));
    },
    async updateOrderBuilder(input) {
      if (!store.isReady()) return sessionRequired();
      return runLocalMutation("builder", () => store.updateOrderBuilder(input));
    },
    async startOrderDraft() {
      if (!store.isReady()) return sessionRequired();
      return runLocalMutation("draft", () => store.startOrderDraft(), "unsaved-order", "Не вдалося створити чернетку.");
    },
    async saveOrderDraft() {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.builder.title.trim()) {
        return validationError("title", "required", "Вкажіть назву чернетки.");
      }
      return runLocalMutation("draft", () => store.saveOrderDraft(), "unsaved-order", "Не вдалося зберегти чернетку.");
    },
    async openOrderDraft({ draftId }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.drafts.some((draft) => draft.id === draftId)) {
        return validationError("draftId", "not-found", "Чернетку не знайдено.");
      }
      return runLocalMutation("draftId", () => store.openOrderDraft(draftId), "unsaved-order", "Не вдалося відкрити чернетку.");
    },
    async deleteOrderDraft({ draftId }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.drafts.some((draft) => draft.id === draftId)) {
        return validationError("draftId", "not-found", "Чернетку не знайдено.");
      }
      return runLocalMutation("draftId", () => store.deleteOrderDraft(draftId));
    },
    async refreshOrderDrafts() {
      if (!store.isReady()) return sessionRequired();
      return { ok: true, kind: "local-preview", value: store.refreshOrderDrafts() };
    },
    async stageOrder(input) {
      if (!store.isReady()) return sessionRequired();
      return runLocalMutation("order", () => store.createOrder(input), "invalid-order", "Не вдалося зберегти замовлення.");
    },
    async appendOrderMessage({ orderId, body, attachments = [] }) {
      if (!store.isReady()) return sessionRequired();
      if (!body.trim() && attachments.length === 0) {
        return validationError("body", "required", "Введіть повідомлення або оберіть файл.");
      }
      if (!findDealerOrder(store.state, orderId)) {
        return validationError("orderId", "not-found", "Замовлення не знайдено.");
      }
      return runLocalMutation("orderId", () => store.addOrderMessage(orderId, body.trim(), attachments));
    },
    async setOrderLineNote({ orderId, partNumber, note }) {
      if (!store.isReady()) return sessionRequired();
      const order = findDealerOrder(store.state, orderId);
      if (!order) {
        return validationError("orderId", "not-found", "Замовлення не знайдено.");
      }
      if (!order.lines.some((line) => line.partNumber === partNumber)) {
        return validationError("partNumber", "not-found", "Позицію замовлення не знайдено.");
      }
      return runLocalMutation("orderId", () => store.setLineNote(orderId, partNumber, note));
    },
    async createWorkshopOrder(input) {
      if (!store.isReady()) return sessionRequired();
      if (!input.customerId || !input.description.trim()) {
        return validationError("workshopOrder", "required", "Заповніть обов’язкові поля.");
      }
      if (!store.state.customers.some((customer) => customer.id === input.customerId)) {
        return validationError("customerId", "not-found", "Клієнта не знайдено.");
      }
      return runLocalMutation("workshopOrder", () => store.addWorkshopOrder(input));
    },
    async copyText({ text }) {
      if (!store.isReady()) return sessionRequired();
      if (!text) {
        return validationError("text", "required", "Немає тексту для копіювання.");
      }
      try {
        await browser.writeClipboard(text);
        return { ok: true, kind: "local-preview", value: undefined };
      } catch {
        return {
          ok: false,
          kind: "local-error",
          message: "Не вдалося скопіювати посилання.",
          retryable: true,
        };
      }
    },
  };
}
