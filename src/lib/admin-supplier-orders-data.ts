export type SupplierOrdersTab = "all" | "backorders" | "exceptions";

export type SupplierOrdersSort = "status" | "newest" | "oldest" | "amount";

export type SupplierOrderKpiTone = "neutral" | "blue" | "amber" | "green";

export type SupplierOrderKpi = {
  id: "total" | "active" | "backorder" | "completed";
  label: string;
  value: number;
  tone: SupplierOrderKpiTone;
};

export type SupplierOrderReadOnlyState =
  | "active"
  | "backorder"
  | "completed";

export type SupplierOrderReadOnlyRecord = {
  id: string;
  number: string;
  supplier: string;
  createdAt: string;
  lineCount: number;
  totalEur: number;
  state: SupplierOrderReadOnlyState;
  evidence: "source-observed" | "local-demo";
};

export type SupplierOrderExceptionKind = "missing-pdf";

export type SupplierOrderException = {
  id: string;
  shipmentNumber: string;
  kind: SupplierOrderExceptionKind;
  label: string;
  lineCount: number;
  closed: boolean;
  destination: "/admin/air-freight";
  evidence: "source-observed";
};

export const supplierOrderKpis: readonly SupplierOrderKpi[] = [
  { id: "total", label: "Всього", value: 0, tone: "neutral" },
  { id: "active", label: "Активні", value: 0, tone: "blue" },
  { id: "backorder", label: "Бекордер", value: 0, tone: "amber" },
  { id: "completed", label: "Завершені", value: 0, tone: "green" },
];

export const supplierOrderSortOptions: ReadonlyArray<{
  id: SupplierOrdersSort;
  label: string;
}> = [
  { id: "status", label: "За статусом" },
  { id: "newest", label: "Спочатку нові" },
  { id: "oldest", label: "Спочатку старі" },
  { id: "amount", label: "За сумою" },
];

// The observed source dataset is empty. Do not populate this collection with
// representative records unless they are explicitly marked `local-demo`.
export const sourceSupplierOrders: readonly SupplierOrderReadOnlyRecord[] = [];

// The observed source backorder tab is also empty.
export const sourceSupplierBackorders: readonly SupplierOrderReadOnlyRecord[] = [];

export const supplierOrderExceptions: readonly SupplierOrderException[] = [
  {
    id: "exception-shp-2026-004",
    shipmentNumber: "SHP-2026-004",
    kind: "missing-pdf",
    label: "PDF не прив'язано",
    lineCount: 197,
    closed: false,
    destination: "/admin/air-freight",
    evidence: "source-observed",
  },
  {
    id: "exception-shp-2026-003",
    shipmentNumber: "SHP-2026-003",
    kind: "missing-pdf",
    label: "PDF не прив'язано",
    lineCount: 3,
    closed: false,
    destination: "/admin/air-freight",
    evidence: "source-observed",
  },
];
