import type { OrderStatus } from "@/lib/types";
import { normalizeDealerSearch } from "@/lib/dealer/format";

export type DocumentType = "invoice" | "waybill";
export type DocumentStatus = "paid" | "open" | "overdue";
export type StockFilter = "all" | "in-stock" | "low" | "out";
export type ReportPeriod = "all" | "month" | "30" | "90";

export type DealerDocument = {
  id: string;
  code: string;
  orderCode: string;
  type: DocumentType;
  status: DocumentStatus;
  issuedAt: string;
  amount: number;
};

export type ConsignmentRow = {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  dealer: string;
  status: "available" | "reserved" | "requested";
};

export type SettlementRow = {
  id: string;
  date: string;
  code: string;
  kind: "accrual" | "payment";
  amount: number;
  status: "paid" | "open" | "overdue";
};

export type InventoryRow = {
  id: string;
  partNumber: string;
  description: string;
  stock: number;
  reorderPoint: number;
  dealerPrice: number;
};

export type NetworkPartRow = {
  id: string;
  partNumber: string;
  description: string;
  dealer: string;
  quantity: number;
};

export type NetworkUnitRow = {
  id: string;
  model: string;
  vin: string;
  dealer: string;
  year: string;
};

const referenceDate = "2026-07-21T23:59:59.999Z";

export const dealerDocuments = [
  { id: "document-invoice-001", code: "INV-2026-001", orderCode: "LOG-01", type: "invoice", status: "paid", issuedAt: "2026-07-18T10:15:00.000Z", amount: 13.09 },
  { id: "document-waybill-001", code: "WAY-2026-001", orderCode: "LOG-01", type: "waybill", status: "open", issuedAt: "2026-07-19T09:00:00.000Z", amount: 13.09 },
  { id: "document-invoice-002", code: "INV-2026-002", orderCode: "LOG-02", type: "invoice", status: "overdue", issuedAt: "2026-06-10T10:00:00.000Z", amount: 126.42 },
] as const satisfies readonly DealerDocument[];

export const consignmentStock = [
  { id: "consignment-belt", partNumber: "422280226", description: "BELT-V", quantity: 4, dealer: "Logos", status: "available" },
  { id: "consignment-filter", partNumber: "703501247", description: "AIR FILTER WITH PRE FILTER", quantity: 1, dealer: "Logos", status: "reserved" },
  { id: "consignment-oil", partNumber: "9779150", description: "COOLANT,EXT LIFE", quantity: 0, dealer: "Logos", status: "requested" },
] as const satisfies readonly ConsignmentRow[];

export const consignmentNetwork = [
  { id: "network-belt", partNumber: "422280226", description: "BELT-V", quantity: 8, dealer: "BRP Київ", status: "available" },
  { id: "network-brake", partNumber: "705602167", description: "LEFT_&_RIGHT_PADS_KIT", quantity: 3, dealer: "BRP Львів", status: "available" },
] as const satisfies readonly ConsignmentRow[];

export const consignmentRequests = [
  { id: "request-oil", partNumber: "9779150", description: "COOLANT,EXT LIFE", quantity: 2, dealer: "Logos", status: "requested" },
] as const satisfies readonly ConsignmentRow[];

export const settlementRows = [
  { id: "settlement-accrual-001", date: "2026-07-18T10:15:00.000Z", code: "INV-2026-001", kind: "accrual", amount: 13.09, status: "paid" },
  { id: "settlement-payment-001", date: "2026-07-19T09:00:00.000Z", code: "PAY-2026-001", kind: "payment", amount: -13.09, status: "paid" },
  { id: "settlement-accrual-002", date: "2026-06-10T10:00:00.000Z", code: "INV-2026-002", kind: "accrual", amount: 126.42, status: "overdue" },
] as const satisfies readonly SettlementRow[];

export const inventoryRows = [
  { id: "inventory-oil", partNumber: "9779150", description: "COOLANT,EXT LIFE", stock: 8, reorderPoint: 4, dealerPrice: 13.09 },
  { id: "inventory-filter", partNumber: "703501247", description: "AIR FILTER WITH PRE FILTER", stock: 2, reorderPoint: 4, dealerPrice: 53.38 },
  { id: "inventory-belt", partNumber: "422280226", description: "BELT-V", stock: 0, reorderPoint: 2, dealerPrice: 134.19 },
] as const satisfies readonly InventoryRow[];

export const networkParts = [
  { id: "network-part-belt", partNumber: "422280226", description: "BELT-V", dealer: "Logos", quantity: 4 },
  { id: "network-part-oil", partNumber: "9779150", description: "COOLANT,EXT LIFE", dealer: "BRP Київ", quantity: 12 },
] as const satisfies readonly NetworkPartRow[];

export const networkUnits = [
  { id: "network-unit-outlander", model: "Outlander MAX XT", vin: "3JBKKAX42MJ000101", dealer: "Logos", year: "2024" },
  { id: "network-unit-defender", model: "Defender HD10", vin: "3JBKAAA46NJ000202", dealer: "BRP Київ", year: "2025" },
] as const satisfies readonly NetworkUnitRow[];

function matchesQuery(query: string, values: readonly string[]) {
  const needle = normalizeDealerSearch(query);
  return !needle || values.some((value) => normalizeDealerSearch(value).includes(needle));
}

export function filterDocuments(filters: { query: string; type: "all" | DocumentType; status: "all" | DocumentStatus }) {
  return dealerDocuments.filter((document) => (
    (filters.type === "all" || document.type === filters.type)
    && (filters.status === "all" || document.status === filters.status)
    && matchesQuery(filters.query, [document.code, document.orderCode])
  ));
}

export function filterConsignmentRows(tab: "stock" | "network" | "requests", filters: { query: string; availability: "all" | "in-stock" | "requested" }) {
  const source = tab === "stock" ? consignmentStock : tab === "network" ? consignmentNetwork : consignmentRequests;
  return source.filter((row) => (
    (filters.availability === "all" || (filters.availability === "in-stock" ? row.quantity > 0 : row.status === "requested"))
    && matchesQuery(filters.query, [row.partNumber, row.description, row.dealer])
  ));
}

export function filterSettlementRows(filters: { period: number; query: string }) {
  const cutoff = Date.parse(referenceDate) - filters.period * 24 * 60 * 60 * 1000;
  return settlementRows.filter((row) => Date.parse(row.date) >= cutoff && matchesQuery(filters.query, [row.code]));
}

export function filterInventoryRows(filters: { query: string; stock: StockFilter }) {
  return inventoryRows.filter((row) => {
    const stockMatches = filters.stock === "all"
      || (filters.stock === "in-stock" && row.stock > 0)
      || (filters.stock === "low" && row.stock > 0 && row.stock <= row.reorderPoint)
      || (filters.stock === "out" && row.stock === 0);
    return stockMatches && matchesQuery(filters.query, [row.partNumber, row.description]);
  });
}

export function filterNetworkRows(tab: "parts" | "units", filters: { dealer: "all" | string; query: string }) {
  if (tab === "parts") {
    return networkParts.filter((row) => (
      (filters.dealer === "all" || row.dealer === filters.dealer)
      && matchesQuery(filters.query, [row.partNumber, row.description, row.dealer])
    ));
  }
  return networkUnits.filter((row) => (
    (filters.dealer === "all" || row.dealer === filters.dealer)
    && matchesQuery(filters.query, [row.model, row.vin, row.dealer])
  ));
}

export function filterPartsReportOrders<OrderType extends { readonly createdAt: string; readonly creator: string; readonly status: OrderStatus }>(
  orders: readonly OrderType[],
  filters: { period: ReportPeriod; manager: "all" | string; status: "all" | OrderStatus },
) {
  const latestOrderTime = Math.max(...orders.map((order) => Date.parse(order.createdAt)), Date.parse(referenceDate));
  const latestMonth = new Date(latestOrderTime).toISOString().slice(0, 7);
  const periodDays = filters.period === "30" ? 30 : filters.period === "90" ? 90 : null;
  return orders.filter((order) => {
    const periodMatches = filters.period === "all"
      || (filters.period === "month" && order.createdAt.slice(0, 7) === latestMonth)
      || (periodDays !== null && Date.parse(order.createdAt) >= latestOrderTime - periodDays * 24 * 60 * 60 * 1000);
    return periodMatches
      && (filters.manager === "all" || order.creator === filters.manager)
      && (filters.status === "all" || order.status === filters.status);
  });
}
