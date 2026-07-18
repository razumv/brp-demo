export type WarehouseProcessId =
  | "receiving"
  | "receipt-summary"
  | "shortages"
  | "fulfillment"
  | "inventory-summary"
  | "placement";

export interface WarehouseProcessTab {
  readonly id: WarehouseProcessId;
  readonly label: string;
}

export const warehouseProcessTabs = [
  { id: "receiving", label: "Приймання" },
  { id: "receipt-summary", label: "Зведення приймання" },
  { id: "shortages", label: "Нестачі" },
  { id: "fulfillment", label: "Виконання" },
  { id: "inventory-summary", label: "Зведення" },
  { id: "placement", label: "Розміщення" },
] as const satisfies readonly WarehouseProcessTab[];

export type WarehouseShipmentStatus = "in_transit";

export interface WarehouseManifestLine {
  readonly id: string;
  readonly partNumber: string;
  readonly description: string;
  readonly quantity: number;
  readonly scannedQuantity: null;
}

export interface WarehouseManifest {
  readonly id: string;
  readonly shipmentNumber: string;
  readonly sourceLineCount: number;
  readonly representativeLines: readonly WarehouseManifestLine[];
}

export interface WarehouseReceivingMetrics {
  readonly expectedUnits: number;
  readonly scannedUnits: number;
  readonly fullyReceivedUnits: number;
  readonly discrepancyCount: number;
}

export interface WarehouseShipment {
  readonly id: string;
  readonly proforma: string;
  readonly shipmentNumber: string;
  readonly status: WarehouseShipmentStatus;
  readonly linkedSupplierOrderCount: 0;
  readonly metrics: WarehouseReceivingMetrics;
  readonly manifest: WarehouseManifest;
}

/**
 * Four source-observed shipments. Packing rows are deliberately representative:
 * exact full manifest sizes remain on `sourceLineCount` and are never inferred
 * from the local fixture length.
 */
export const warehouseShipments = [
  {
    id: "pac-05",
    proforma: "PAC 05",
    shipmentNumber: "SHP-2026-004",
    status: "in_transit",
    linkedSupplierOrderCount: 0,
    metrics: {
      expectedUnits: 2551,
      scannedUnits: 0,
      fullyReceivedUnits: 0,
      discrepancyCount: 191,
    },
    manifest: {
      id: "manifest-shp-2026-004",
      shipmentNumber: "SHP-2026-004",
      sourceLineCount: 191,
      representativeLines: [
        {
          id: "shp-2026-004-267000917",
          partNumber: "267000917",
          description: "WEAR RING",
          quantity: 70,
          scannedQuantity: null,
        },
        {
          id: "shp-2026-004-277001874",
          partNumber: "277001874",
          description: "WEAR RING",
          quantity: 51,
          scannedQuantity: null,
        },
      ],
    },
  },
  {
    id: "pac-04",
    proforma: "PAC 04",
    shipmentNumber: "SHP-2026-003",
    status: "in_transit",
    linkedSupplierOrderCount: 0,
    metrics: {
      expectedUnits: 4773,
      scannedUnits: 0,
      fullyReceivedUnits: 0,
      discrepancyCount: 407,
    },
    manifest: {
      id: "manifest-shp-2026-003",
      shipmentNumber: "SHP-2026-003",
      sourceLineCount: 407,
      representativeLines: [
        {
          id: "shp-2026-003-271002071",
          partNumber: "271002071",
          description: "SEAL",
          quantity: 149,
          scannedQuantity: null,
        },
      ],
    },
  },
  {
    id: "pac-03-spyders",
    proforma: "PAC 03 + Spyders",
    shipmentNumber: "SHP-2026-002",
    status: "in_transit",
    linkedSupplierOrderCount: 0,
    metrics: {
      expectedUnits: 4111,
      scannedUnits: 0,
      fullyReceivedUnits: 0,
      discrepancyCount: 434,
    },
    manifest: {
      id: "manifest-shp-2026-002",
      shipmentNumber: "SHP-2026-002",
      sourceLineCount: 434,
      representativeLines: [
        {
          id: "shp-2026-002-219700368",
          partNumber: "219700368",
          description: "FUEL FILTER, BOSCH",
          quantity: 10,
          scannedQuantity: null,
        },
      ],
    },
  },
  {
    id: "pac-02",
    proforma: "PAC 02",
    shipmentNumber: "SHP-2026-001",
    status: "in_transit",
    linkedSupplierOrderCount: 0,
    metrics: {
      expectedUnits: 326,
      scannedUnits: 0,
      fullyReceivedUnits: 0,
      discrepancyCount: 18,
    },
    manifest: {
      id: "manifest-shp-2026-001",
      shipmentNumber: "SHP-2026-001",
      sourceLineCount: 18,
      representativeLines: [
        {
          id: "shp-2026-001-295101148",
          partNumber: "295101148",
          description: "BOX_STORAGE F KIT",
          quantity: 35,
          scannedQuantity: null,
        },
      ],
    },
  },
] as const satisfies readonly WarehouseShipment[];

export type ReceiptSummaryView = "parts" | "shipments";
export type ReceiptSummaryFilter = "all" | "crm" | "legacy";

export interface ReceiptSummaryMetrics {
  readonly parts: number;
  readonly crm: number;
  readonly legacyOutsideCrm: number;
  readonly missing: number;
}

export interface ReceiptSummaryRow {
  readonly id: string;
  readonly partNumber: string;
  readonly shipmentNumber: string;
  readonly source: Exclude<ReceiptSummaryFilter, "all">;
  readonly received: number;
}

export const receiptSummaryMetrics: ReceiptSummaryMetrics = {
  parts: 0,
  crm: 0,
  legacyOutsideCrm: 0,
  missing: 0,
};

// The source state is empty because no receipt has been started.
export const receiptSummaryRows: readonly ReceiptSummaryRow[] = [];

export type WarehouseShortageKind = "waiting" | "damaged" | "wrong-part" | "surplus";
export type WarehouseShortageView = "active" | "history" | "surplus";

export interface WarehouseShortageMetrics {
  readonly waiting: number;
  readonly damaged: number;
  readonly wrongPart: number;
  readonly surplus: number;
}

export interface WarehouseShortageRecord {
  readonly id: string;
  readonly kind: WarehouseShortageKind;
  readonly partNumber: string;
  readonly shipmentNumber: string;
  readonly quantity: number;
}

export const warehouseShortageMetrics: WarehouseShortageMetrics = {
  waiting: 0,
  damaged: 0,
  wrongPart: 0,
  surplus: 0,
};

export const warehouseShortages: readonly WarehouseShortageRecord[] = [];

export type WarehouseFulfillmentStatus = "waiting" | "in-progress" | "completed" | "backorder";
export type WarehouseFulfillmentFilter = "all" | "in-progress" | "completed" | "backorder";
export type WarehouseFulfillmentView = "list" | "kanban";

export interface WarehouseFulfillmentMetrics {
  readonly totalOrders: number;
  readonly shipped: number;
  readonly received: number;
  readonly backorder: number;
}

export interface WarehouseFulfillmentOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly supplier: string;
  readonly status: WarehouseFulfillmentStatus;
  readonly lineCount: number;
}

export const warehouseFulfillmentMetrics: WarehouseFulfillmentMetrics = {
  totalOrders: 0,
  shipped: 0,
  received: 0,
  backorder: 0,
};

export const warehouseFulfillmentOrders: readonly WarehouseFulfillmentOrder[] = [];

export interface WarehouseInventoryTotals {
  readonly parts: number;
  readonly shipped: number;
  readonly received: number;
  readonly totalEur: number;
}

export interface WarehouseInventoryPartRow {
  readonly id: string;
  readonly partNumber: string;
  readonly description: string;
  readonly shipment: "PAC 02" | "PAC 05";
  readonly shipped: number;
  readonly received: 0;
  readonly unitEur: number;
  readonly totalEur: number;
  readonly status: "Відсутнє";
  readonly allocation: "Не розподілено";
}

export interface WarehouseInventoryShipmentRow {
  readonly id: string;
  readonly shipmentNumber: string;
  readonly proforma: string;
  readonly positions: number;
  readonly shipped: number;
  readonly totalEur: number;
}

export const warehouseInventoryTotals: WarehouseInventoryTotals = {
  parts: 1061,
  shipped: 11761,
  received: 0,
  totalEur: 279830.76,
};

/** Source-observed representative part rows, not the complete 1,061-part set. */
export const warehouseInventoryPartRows = [
  {
    id: "inventory-295100909",
    partNumber: "295100909",
    description: "SKI PYLON",
    shipment: "PAC 02",
    shipped: 20,
    received: 0,
    unitEur: 124.2,
    totalEur: 2484,
    status: "Відсутнє",
    allocation: "Не розподілено",
  },
  {
    id: "inventory-715009218",
    partNumber: "715009218",
    description: "BOX_DASHBOARD STORAGE KIT",
    shipment: "PAC 05",
    shipped: 20,
    received: 0,
    unitEur: 64.35,
    totalEur: 1287,
    status: "Відсутнє",
    allocation: "Не розподілено",
  },
  {
    id: "inventory-9779492",
    partNumber: "9779492",
    description: "OIL 4T 5W40 SYNTHETIC QT/0,946L",
    shipment: "PAC 05",
    shipped: 480,
    received: 0,
    unitEur: 6.56,
    totalEur: 3148.8,
    status: "Відсутнє",
    allocation: "Не розподілено",
  },
] as const satisfies readonly WarehouseInventoryPartRow[];

export const warehouseInventoryShipmentRows = [
  {
    id: "inventory-shp-2026-001",
    shipmentNumber: "SHP-2026-001",
    proforma: "PAC 02",
    positions: 18,
    shipped: 326,
    totalEur: 35471.73,
  },
  {
    id: "inventory-shp-2026-002",
    shipmentNumber: "SHP-2026-002",
    proforma: "PAC 03 + Spyders",
    positions: 437,
    shipped: 4111,
    totalEur: 73388.47,
  },
  {
    id: "inventory-shp-2026-003",
    shipmentNumber: "SHP-2026-003",
    proforma: "PAC 04",
    positions: 409,
    shipped: 4773,
    totalEur: 104260.05,
  },
  {
    id: "inventory-shp-2026-004",
    shipmentNumber: "SHP-2026-004",
    proforma: "PAC 05",
    positions: 197,
    shipped: 2551,
    totalEur: 66710.51,
  },
] as const satisfies readonly WarehouseInventoryShipmentRow[];

export const warehousePartsShipmentFilters = [
  "all",
  "PAC 02",
  "PAC 03 + Spyders",
  "PAC 04",
  "PAC 05",
] as const;

export type WarehousePartsShipmentFilter = (typeof warehousePartsShipmentFilters)[number];

export interface WarehousePlacementRow {
  readonly id: string;
  readonly partNumber: string;
  readonly description: string;
  readonly cell: string;
  readonly zone: null;
  readonly oneCStock: number;
  readonly source: "Excel";
  readonly updatedAt: "19.05.2026";
  readonly sourcePage: 1;
}

export interface WarehousePlacementSummary {
  readonly total: number;
  readonly pageSize: number;
}

export const warehousePlacementSummary: WarehousePlacementSummary = {
  total: 5211,
  pageSize: 100,
};

/** Source-observed representative rows from placement page one. */
export const warehousePlacementRows = [
  {
    id: "placement-293650138",
    partNumber: "293650138",
    description: "OETIKER CLAMP",
    cell: "1.2",
    zone: null,
    oneCStock: 0,
    source: "Excel",
    updatedAt: "19.05.2026",
    sourcePage: 1,
  },
  {
    id: "placement-509000442",
    partNumber: "509000442",
    description: "OETIKER CLAMP",
    cell: "1.2",
    zone: null,
    oneCStock: 3,
    source: "Excel",
    updatedAt: "19.05.2026",
    sourcePage: 1,
  },
  {
    id: "placement-250200102",
    partNumber: "250200102",
    description: "FLAT WASHER M12",
    cell: "1.3",
    zone: null,
    oneCStock: 8,
    source: "Excel",
    updatedAt: "19.05.2026",
    sourcePage: 1,
  },
  {
    id: "placement-570063600",
    partNumber: "570063600",
    description: "WHEEL CAP",
    cell: "1.4",
    zone: null,
    oneCStock: 123,
    source: "Excel",
    updatedAt: "19.05.2026",
    sourcePage: 1,
  },
] as const satisfies readonly WarehousePlacementRow[];
