import type {
  CartLine,
  Customer,
  CustomerInput,
  Equipment,
  EquipmentInput,
  OrderInput,
  OrderLine,
  OrderStatus,
  TimelineEvent,
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

export type DealerAttachmentMetadata = Readonly<{
  name: string;
  size: number;
  mimeType: string;
}>;

export type DealerOrderMessage = {
  id: string;
  author: string;
  role: "dealer" | "admin";
  body: string;
  createdAt: string;
  attachments: DealerAttachmentMetadata[];
};

export type DealerOrder = {
  id: string;
  code: string;
  company: string;
  creator: string;
  customerId: string;
  po: string;
  note: string;
  delivery: "standard" | "pickup";
  status: OrderStatus;
  stage: string;
  createdAt: string;
  lines: OrderLine[];
  messages: DealerOrderMessage[];
  timeline: TimelineEvent[];
  localSubmissionKey?: string;
};

export type DealerOrderBuilder = {
  title: string;
  customerId: string;
  po: string;
  note: string;
  delivery: "standard" | "pickup";
  activeDraftId: string | null;
  submissionKey: string;
  updatedAt: string;
};

export type DealerOrderDraft = {
  id: string;
  title: string;
  customerId: string;
  po: string;
  note: string;
  delivery: "standard" | "pickup";
  lines: CartLine[];
  createdAt: string;
  updatedAt: string;
};

export type DealerLocalState = {
  version: 2;
  ownerKey: string;
  customers: Customer[];
  equipment: Equipment[];
  cart: CartLine[];
  orders: DealerOrder[];
  workshopOrders: WorkshopOrder[];
  builder: DealerOrderBuilder;
  drafts: DealerOrderDraft[];
};

export type DealerSnapshot = DeepReadonly<DealerLocalState>;

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
  updateOrderBuilder: (
    input: Partial<Pick<DealerOrderBuilder, "title" | "customerId" | "po" | "note" | "delivery">>,
  ) => Promise<DealerCommandResult<void>>;
  startOrderDraft: () => Promise<DealerCommandResult<void>>;
  saveOrderDraft: () => Promise<DealerCommandResult<DealerOrderDraft>>;
  openOrderDraft: (input: { draftId: string }) => Promise<DealerCommandResult<void>>;
  deleteOrderDraft: (input: { draftId: string }) => Promise<DealerCommandResult<void>>;
  refreshOrderDrafts: () => Promise<DealerCommandResult<readonly DealerOrderDraft[]>>;
  stageOrder: (input: OrderInput) => Promise<DealerCommandResult<DealerOrder>>;
  appendOrderMessage: (input: {
    orderId: string;
    body: string;
    attachments?: readonly DealerAttachmentMetadata[];
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
  readonly identity: DealerIdentity | null;
  readonly capabilities: Readonly<Record<DealerExternalOperation, DealerCapability>>;
  readonly commands: Readonly<DealerCommands>;
};
