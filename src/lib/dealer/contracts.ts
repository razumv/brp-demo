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

export type DealerIdentity = Readonly<{
  email: string;
  displayName: string;
  company: string;
}>;

type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;

export type DealerSnapshot = DeepReadonly<
  Pick<DemoState, "customers" | "equipment" | "cart" | "orders" | "workshopOrders">
>;

export type DealerExternalOperation =
  | "sync"
  | "sync-1c"
  | "upload"
  | "download"
  | "export"
  | "remote-order-submit"
  | "approval"
  | "shipment"
  | "team-management"
  | "permission-management";

export type DealerCapability =
  | Readonly<{ status: "available"; execution: "local" | "remote" }>
  | Readonly<{
      status: "unavailable";
      reason: "contract-unconfirmed" | "not-authorized";
    }>;

export type DealerArtifact = {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type DealerValidationIssue = {
  field?: string;
  code: string;
  message: string;
};

export type DealerCommandResult<T> =
  | { ok: true; kind: "local-mutation"; value: T }
  | { ok: true; kind: "local-preview"; value: T }
  | { ok: true; kind: "generated-artifact"; value: T; artifact: DealerArtifact }
  | {
      ok: false;
      kind: "unavailable";
      operation: DealerExternalOperation;
      reason: "contract-unconfirmed" | "not-authorized";
    }
  | { ok: false; kind: "validation-error"; issues: readonly DealerValidationIssue[] }
  | { ok: false; kind: "local-error"; message: string; retryable: boolean };

export type DealerCommands = {
  addCartLine: (input: {
    partNumber: string;
    quantity?: number;
    sourceDiagramId?: string;
  }) => Promise<DealerCommandResult<void>>;
  setCartQuantity: (input: {
    partNumber: string;
    quantity: number;
  }) => Promise<DealerCommandResult<void>>;
  removeCartLine: (input: { partNumber: string }) => Promise<DealerCommandResult<void>>;
  clearCart: () => Promise<DealerCommandResult<void>>;
  createCustomer: (input: CustomerInput) => Promise<DealerCommandResult<Customer>>;
  updateCustomer: (input: {
    id: string;
    customer: CustomerInput;
  }) => Promise<DealerCommandResult<void>>;
  createEquipment: (input: EquipmentInput) => Promise<DealerCommandResult<Equipment>>;
  stageOrder: (input: OrderInput) => Promise<DealerCommandResult<Order>>;
  appendOrderMessage: (input: {
    orderId: string;
    body: string;
  }) => Promise<DealerCommandResult<void>>;
  setOrderLineNote: (input: {
    orderId: string;
    partNumber: string;
    note: string;
  }) => Promise<DealerCommandResult<void>>;
  createWorkshopOrder: (
    input: WorkshopOrderInput,
  ) => Promise<DealerCommandResult<WorkshopOrder>>;
  copyText: (input: { text: string }) => Promise<DealerCommandResult<void>>;
};

export type DealerWorkflow = {
  readonly hydrated: boolean;
  readonly snapshot: DealerSnapshot;
  readonly identity: DealerIdentity;
  readonly capabilities: Readonly<Record<DealerExternalOperation, DealerCapability>>;
  readonly commands: Readonly<DealerCommands>;
};
