import { getPart } from "@/lib/mock-data";
import type {
  Customer,
  CustomerInput,
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
  DealerExternalOperation,
  DealerLocalState,
  DealerOrder,
  DealerOrderDraft,
  DealerOrderBuilder,
} from "@/lib/dealer/contracts";
import { findDealerOrder } from "@/lib/dealer/order-state";

export type DealerStorePort = {
  readonly state: DealerLocalState;
  isReady: () => boolean;
  addToCart: (partNumber: string, quantity?: number, sourceDiagramId?: string) => void;
  setCartQuantity: (partNumber: string, quantity: number) => void;
  removeFromCart: (partNumber: string) => void;
  clearCart: () => void;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, input: CustomerInput) => void;
  addEquipment: (input: EquipmentInput) => Equipment;
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

const unavailableOperations = [
  "sync",
  "sync-1c",
  "upload",
  "download",
  "export",
  "remote-order-submit",
  "approval",
  "shipment",
  "team-management",
  "permission-management",
] as const satisfies readonly DealerExternalOperation[];

export const dealerCapabilities = Object.fromEntries(
  unavailableOperations.map((operation) => [
    operation,
    { status: "unavailable", reason: "contract-unconfirmed" },
  ]),
) as Record<DealerExternalOperation, DealerCapability>;

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
      store.addToCart(partNumber, quantity, sourceDiagramId);
      return localMutation(undefined);
    },
    async setCartQuantity({ partNumber, quantity }) {
      if (!store.isReady()) return sessionRequired();
      if (!Number.isInteger(quantity)) {
        return validationError("quantity", "invalid-quantity", "Кількість має бути цілим числом.");
      }
      if (!store.state.cart.some((line) => line.partNumber === partNumber)) {
        return validationError("partNumber", "not-found", "Позицію кошика не знайдено.");
      }
      store.setCartQuantity(partNumber, quantity);
      return localMutation(undefined);
    },
    async removeCartLine({ partNumber }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.cart.some((line) => line.partNumber === partNumber)) {
        return validationError("partNumber", "not-found", "Позицію кошика не знайдено.");
      }
      store.removeFromCart(partNumber);
      return localMutation(undefined);
    },
    async clearCart() {
      if (!store.isReady()) return sessionRequired();
      store.clearCart();
      return localMutation(undefined);
    },
    async createCustomer(input) {
      if (!store.isReady()) return sessionRequired();
      if (!input.name.trim()) {
        return validationError("name", "required", "Вкажіть ім’я клієнта.");
      }
      return localMutation(store.addCustomer(input));
    },
    async updateCustomer({ id, customer }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.customers.some((item) => item.id === id)) {
        return validationError("id", "not-found", "Клієнта не знайдено.");
      }
      store.updateCustomer(id, customer);
      return localMutation(undefined);
    },
    async createEquipment(input) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.customers.some((item) => item.id === input.customerId)) {
        return validationError("customerId", "not-found", "Клієнта не знайдено.");
      }
      return localMutation(store.addEquipment(input));
    },
    async updateOrderBuilder(input) {
      if (!store.isReady()) return sessionRequired();
      store.updateOrderBuilder(input);
      return localMutation(undefined);
    },
    async startOrderDraft() {
      if (!store.isReady()) return sessionRequired();
      try {
        store.startOrderDraft();
        return localMutation(undefined);
      } catch (error) {
        return validationError("draft", "unsaved-order", error instanceof Error ? error.message : "Не вдалося створити чернетку.");
      }
    },
    async saveOrderDraft() {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.builder.title.trim()) {
        return validationError("title", "required", "Вкажіть назву чернетки.");
      }
      return localMutation(store.saveOrderDraft());
    },
    async openOrderDraft({ draftId }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.drafts.some((draft) => draft.id === draftId)) {
        return validationError("draftId", "not-found", "Чернетку не знайдено.");
      }
      try {
        store.openOrderDraft(draftId);
        return localMutation(undefined);
      } catch (error) {
        return validationError("draftId", "unsaved-order", error instanceof Error ? error.message : "Не вдалося відкрити чернетку.");
      }
    },
    async deleteOrderDraft({ draftId }) {
      if (!store.isReady()) return sessionRequired();
      if (!store.state.drafts.some((draft) => draft.id === draftId)) {
        return validationError("draftId", "not-found", "Чернетку не знайдено.");
      }
      store.deleteOrderDraft(draftId);
      return localMutation(undefined);
    },
    async refreshOrderDrafts() {
      if (!store.isReady()) return sessionRequired();
      return { ok: true, kind: "local-preview", value: store.refreshOrderDrafts() };
    },
    async stageOrder(input) {
      if (!store.isReady()) return sessionRequired();
      try {
        return localMutation(store.createOrder(input));
      } catch (error) {
        return validationError(
          "order",
          "invalid-order",
          error instanceof Error ? error.message : "Не вдалося зберегти замовлення.",
        );
      }
    },
    async appendOrderMessage({ orderId, body, attachments = [] }) {
      if (!store.isReady()) return sessionRequired();
      if (!body.trim() && attachments.length === 0) {
        return validationError("body", "required", "Введіть повідомлення або оберіть файл.");
      }
      if (!findDealerOrder(store.state, orderId)) {
        return validationError("orderId", "not-found", "Замовлення не знайдено.");
      }
      store.addOrderMessage(orderId, body.trim(), attachments);
      return localMutation(undefined);
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
      store.setLineNote(orderId, partNumber, note);
      return localMutation(undefined);
    },
    async createWorkshopOrder(input) {
      if (!store.isReady()) return sessionRequired();
      if (!input.customerId || !input.description.trim()) {
        return validationError("workshopOrder", "required", "Заповніть обов’язкові поля.");
      }
      if (!store.state.customers.some((customer) => customer.id === input.customerId)) {
        return validationError("customerId", "not-found", "Клієнта не знайдено.");
      }
      return localMutation(store.addWorkshopOrder(input));
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
