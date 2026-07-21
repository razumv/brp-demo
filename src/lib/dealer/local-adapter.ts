import { getPart } from "@/lib/mock-data";
import type {
  Customer,
  CustomerInput,
  DemoState,
  Equipment,
  EquipmentInput,
  Order,
  OrderInput,
  WorkshopOrder,
  WorkshopOrderInput,
} from "@/lib/types";
import type {
  DealerCapability,
  DealerCommandResult,
  DealerCommands,
  DealerExternalOperation,
  DealerIdentity,
} from "@/lib/dealer/contracts";

type DealerStorePort = {
  state: DemoState;
  addToCart: (partNumber: string, quantity?: number, sourceDiagramId?: string) => void;
  setCartQuantity: (partNumber: string, quantity: number) => void;
  removeFromCart: (partNumber: string) => void;
  clearCart: () => void;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, input: CustomerInput) => void;
  addEquipment: (input: EquipmentInput) => Equipment;
  createOrder: (input: OrderInput) => Order;
  addOrderMessage: (orderId: string, body: string, role?: "dealer" | "admin") => void;
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

export function getDealerIdentity(state: DemoState): DealerIdentity {
  return state.session?.role === "dealer"
    ? {
        email: state.session.email,
        displayName: state.session.displayName,
        company: state.session.company,
      }
    : {
        email: "dealer@logos.local",
        displayName: "Финансы",
        company: "Logos",
      };
}

export function createDealerLocalAdapter(
  store: DealerStorePort,
  browser: BrowserPort,
): DealerCommands {
  return {
    async addCartLine({ partNumber, quantity = 1, sourceDiagramId }) {
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
      if (!store.state.cart.some((line) => line.partNumber === partNumber)) {
        return validationError("partNumber", "not-found", "Позицію кошика не знайдено.");
      }
      store.removeFromCart(partNumber);
      return localMutation(undefined);
    },
    async clearCart() {
      store.clearCart();
      return localMutation(undefined);
    },
    async createCustomer(input) {
      if (!input.name.trim()) {
        return validationError("name", "required", "Вкажіть ім’я клієнта.");
      }
      return localMutation(store.addCustomer(input));
    },
    async updateCustomer({ id, customer }) {
      if (!store.state.customers.some((item) => item.id === id)) {
        return validationError("id", "not-found", "Клієнта не знайдено.");
      }
      store.updateCustomer(id, customer);
      return localMutation(undefined);
    },
    async createEquipment(input) {
      if (!store.state.customers.some((item) => item.id === input.customerId)) {
        return validationError("customerId", "not-found", "Клієнта не знайдено.");
      }
      return localMutation(store.addEquipment(input));
    },
    async stageOrder(input) {
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
    async appendOrderMessage({ orderId, body }) {
      if (!body.trim()) {
        return validationError("body", "required", "Введіть повідомлення.");
      }
      if (!store.state.orders.some((order) => order.id === orderId)) {
        return validationError("orderId", "not-found", "Замовлення не знайдено.");
      }
      store.addOrderMessage(orderId, body.trim(), "dealer");
      return localMutation(undefined);
    },
    async setOrderLineNote({ orderId, partNumber, note }) {
      const order = store.state.orders.find((item) => item.id === orderId);
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
      if (!input.customerId || !input.description.trim()) {
        return validationError("workshopOrder", "required", "Заповніть обов’язкові поля.");
      }
      if (!store.state.customers.some((customer) => customer.id === input.customerId)) {
        return validationError("customerId", "not-found", "Клієнта не знайдено.");
      }
      return localMutation(store.addWorkshopOrder(input));
    },
    async copyText({ text }) {
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
