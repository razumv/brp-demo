export type OceanStatus = "transit" | "soon" | "arrived" | "delivered" | "mixed";

export type OceanCargoType = "units" | "parts";

export type OceanReceiptPreviewKind =
  | "existing-equipment"
  | "new-equipment"
  | "parts";

export type OceanReceiptState =
  | {
      state: "available";
      kind: "new-equipment";
      evidence: "summary" | "exact";
    }
  | {
      state: "created-unposted";
      kind: "existing-equipment" | "parts";
      evidence: "exact";
      documentNumber: string;
    }
  | {
      state: "posted";
      kind: "existing-equipment";
      evidence: "exact";
      documentNumber: string | null;
      documentCount: number;
      postedCount: number;
      postedAt: string;
    };

export type DealerEquipmentType = "ATV" | "SSV" | "PWC" | "3WV";

export type DealerEquipmentStatus =
  | "Assigned"
  | "Warehouse"
  | "Reserved"
  | "Demo"
  | "Service"
  | "Sold";

export interface OceanDocument {
  id: string;
  number: string;
  kind: "proforma" | "bill-of-lading" | "receipt";
  state: "uploaded" | "created-unposted" | "posted";
  createdAt: string;
}

export interface OceanEquipment {
  id: string;
  dealer: string;
  code: string;
  model: string;
  vin: string;
  engine: string;
  year: number;
  type: DealerEquipmentType;
  status: DealerEquipmentStatus;
  shipment: string;
  client: string;
  date: string;
  eur: number;
}

export interface OceanContainerUnit {
  id: string;
  number: number;
  code: string;
  model: string;
  vin: string;
  engine: string;
  eur: number;
  dealer: string | null;
  assignmentStatus: "unassigned" | "assigned";
  invoiceNumber: string | null;
}

export interface OceanContainerDetail {
  evidence: "exact";
  isoType: string;
  seal: string;
  loadingState: "loaded";
  weightKg: number;
  etaIso: string;
  units: OceanContainerUnit[];
}

export interface OceanBillDocumentItem {
  id: string;
  kind:
    | "bill-of-lading"
    | "packing-list"
    | "customs-declaration"
    | "cmr"
    | "insurance-certificate";
  label: string;
  state: "uploaded" | "awaiting" | "missing";
  action: "download" | "upload" | "none";
}

export interface OceanTrackingMilestone {
  id: string;
  label: string;
  date?: string;
  state: "complete" | "current" | "pending";
}

export interface OceanBillDetail {
  evidence: "exact";
  modalEtaLabel: string;
  vessel: string | null;
  etd: string | null;
  daysInTransit: number | null;
  freeWarehouseUnits: number;
  oneCReceipt: {
    documentCount: number;
    postedCount: number;
    postedAt: string;
  };
  documents: OceanBillDocumentItem[];
  milestones: OceanTrackingMilestone[];
}

export interface OceanContainer {
  id: string;
  name: string;
  number: string;
  cargoType: OceanCargoType;
  proforma: string;
  eur: number;
  assigned: number;
  total: number;
  arrivalLabel: string;
  eta?: string;
  status: Exclude<OceanStatus, "mixed">;
  detail?: OceanContainerDetail;
}

export interface OceanBillOfLading {
  id: string;
  status: OceanStatus;
  carrier?: string;
  route?: string;
  eta: string;
  receipt: OceanReceiptState;
  containers: OceanContainer[];
  detail?: OceanBillDetail;
}

export interface OceanManifest {
  id: string;
  billOfLadingId: string;
  proformas: string[];
  containerNumbers: string[];
  documentIds: string[];
  units: number;
  totalEur: number;
}

export interface EquipmentReceiptUnit {
  id: string;
  number: number;
  code: string;
  model: string;
  vin: string;
  engine: string;
  eur: number;
  usd?: number;
}

export interface EquipmentReceiptGroup {
  containerNumber: string;
  proforma: string;
  units: number;
  totalEur: number;
  rows: EquipmentReceiptUnit[];
}

export interface EquipmentReceiptPreview {
  id: string;
  billOfLadingId: string;
  commercialRate: number;
  unitCount: number;
  totalEur: number;
  existingDocument?: OceanDocument;
  groups: EquipmentReceiptGroup[];
}

export interface PartsReceiptLine {
  article: string;
  name: string;
  sourceCategory: string;
  oneCCard: string;
  folder: string;
  quantity: number;
  eur: number;
}

export interface PartsReceiptPreview {
  id: string;
  shipment: string;
  document: OceanDocument;
  linesReady: number;
  linesTotal: number;
  quantity: number;
  totalEur: number;
  mapped: number;
  mappedTotal: number;
  issueCounts: {
    blocked: number;
    link: number;
    create: number;
    transfer: number;
    check: number;
    price: number;
  };
  lines: PartsReceiptLine[];
}

export const OCEAN_KPIS = {
  billsOfLading: 32,
  inTransit: 36,
  containers: 71,
  arrived: 35,
} as const;

export const oceanDocuments: OceanDocument[] = [
  {
    id: "doc-pn-47",
    number: "PN-00000047",
    kind: "receipt",
    state: "created-unposted",
    createdAt: "2026-05-27 14:10",
  },
  {
    id: "doc-pn-37",
    number: "PN-00000037",
    kind: "receipt",
    state: "created-unposted",
    createdAt: "2026-06-16 16:04",
  },
  {
    id: "doc-bl-262102785",
    number: "262102785",
    kind: "bill-of-lading",
    state: "uploaded",
    createdAt: "2026-05-22 09:20",
  },
];

export const oceanBillsOfLading: OceanBillOfLading[] = [
  {
    id: "252108428",
    status: "arrived",
    eta: "Jan 29, 2026",
    receipt: {
      state: "posted",
      kind: "existing-equipment",
      evidence: "exact",
      documentNumber: null,
      documentCount: 1,
      postedCount: 1,
      postedAt: "22.05.2026 12:59:17",
    },
    containers: [
      {
        id: "c-252108428-1",
        name: "MEX 570",
        number: "UACU5875229",
        cargoType: "units",
        proforma: "1031954548",
        eur: 104240,
        assigned: 0,
        total: 8,
        arrivalLabel: "Jan 29 (Arrived)",
        status: "arrived",
        detail: {
          evidence: "exact",
          isoType: "40' HC",
          seal: "SL875229",
          loadingState: "loaded",
          weightKg: 4400.5,
          etaIso: "2026-01-29T00:00:00.000Z",
          units: [
            { id: "252108428-u-1", number: 1, code: "4VTP", model: "ATV OUTL MAX XTP 1000R GY SAS", vin: "3JB3PA773TJ000193", engine: "MR800841", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-2", number: 2, code: "4VTP", model: "ATV OUTL MAX XTP 1000R GY SAS", vin: "3JB3PA771TJ000175", engine: "MR799544", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-3", number: 3, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA771TJ000120", engine: "MR801750", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-4", number: 4, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA773TJ000121", engine: "MR802024", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-5", number: 5, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA777TJ000123", engine: "MR802319", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-6", number: 6, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA774TJ000130", engine: "MR803130", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-7", number: 7, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA776TJ000131", engine: "MR803136", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
            { id: "252108428-u-8", number: 8, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA771TJ000117", engine: "MR801529", eur: 13030, dealer: null, assignmentStatus: "unassigned", invoiceNumber: null },
          ],
        },
      },
    ],
    detail: {
      evidence: "exact",
      modalEtaLabel: "29 Jan 2026",
      vessel: null,
      etd: null,
      daysInTransit: null,
      freeWarehouseUnits: 0,
      oneCReceipt: {
        documentCount: 1,
        postedCount: 1,
        postedAt: "22.05.2026 12:59:17",
      },
      documents: [
        { id: "bl", kind: "bill-of-lading", label: "Коносамент", state: "uploaded", action: "download" },
        { id: "packing-list", kind: "packing-list", label: "Пакувальний лист", state: "uploaded", action: "download" },
        { id: "customs-declaration", kind: "customs-declaration", label: "Митна декларація", state: "awaiting", action: "none" },
        { id: "cmr", kind: "cmr", label: "CMR накладна", state: "missing", action: "upload" },
        { id: "insurance-certificate", kind: "insurance-certificate", label: "Страховий сертифікат", state: "uploaded", action: "download" },
      ],
      milestones: [
        { id: "booking-confirmed", label: "Бронювання підтверджено", state: "complete" },
        { id: "containers-loaded", label: "Контейнери завантажені", state: "complete" },
        { id: "shipped", label: "Відправлено з —", state: "complete" },
        { id: "in-transit", label: "В дорозі", state: "complete" },
        { id: "arrived", label: "Прибуття до —", state: "complete", date: "29 Jan 2026" },
        { id: "customs-clearance", label: "Митне оформлення", state: "current" },
        { id: "warehouse-delivery", label: "Доставлено на склад", state: "pending" },
      ],
    },
  },
  {
    id: "252108537",
    status: "arrived",
    eta: "Jan 29, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-252108537-1", name: "MEX 571", number: "CAIU8524393", cargoType: "units", proforma: "1031954547", eur: 104240, assigned: 0, total: 8, arrivalLabel: "Jan 29 (Arrived)", status: "arrived" },
    ],
  },
  {
    id: "252108627",
    status: "arrived",
    eta: "Jan 31, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-252108627-1", name: "PWC 01", number: "OOLU9513439", cargoType: "units", proforma: "1032012220", eur: 201570, assigned: 0, total: 12, arrivalLabel: "Jan 31 (Arrived)", status: "arrived" },
      { id: "c-252108627-2", name: "PWC 02", number: "OOCU6501741", cargoType: "units", proforma: "1032012221", eur: 183740, assigned: 0, total: 12, arrivalLabel: "Jan 31 (Arrived)", status: "arrived" },
      { id: "c-252108627-3", name: "PWC 03", number: "OOCU6536558", cargoType: "units", proforma: "1032012222", eur: 200920, assigned: 0, total: 12, arrivalLabel: "Jan 31 (Arrived)", status: "arrived" },
      { id: "c-252108627-4", name: "PWC 04", number: "CSNU6784424", cargoType: "units", proforma: "1032012223", eur: 196060, assigned: 0, total: 12, arrivalLabel: "Jan 31 (Arrived)", status: "arrived" },
    ],
  },
  {
    id: "252108918",
    status: "arrived",
    carrier: "Hapag-Lloyd",
    route: "HOU → GDY",
    eta: "Feb 15, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-252108918-1", name: "HOU 01", number: "TGBU6237610", cargoType: "units", proforma: "1032057881", eur: 102440, assigned: 8, total: 8, arrivalLabel: "Feb 15 (Arrived)", status: "arrived" },
      { id: "c-252108918-2", name: "HOU 02", number: "CAIU9639551", cargoType: "units", proforma: "1032057882", eur: 118880, assigned: 8, total: 8, arrivalLabel: "Feb 15 (Arrived)", status: "arrived" },
      { id: "c-252108918-3", name: "HOU 03", number: "FANU3342198", cargoType: "units", proforma: "1032057883", eur: 95760, assigned: 6, total: 6, arrivalLabel: "Feb 15 (Arrived)", status: "arrived" },
    ],
  },
  {
    id: "262101511",
    status: "transit",
    eta: "May 25, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-262101511-1", name: "MEX 593", number: "FANU1099065", cargoType: "units", proforma: "1032129680", eur: 106240, assigned: 10, total: 10, arrivalLabel: "May 25 (Arrived)", eta: "May 27", status: "transit" },
    ],
  },
  {
    id: "262102120",
    status: "transit",
    eta: "Jun 3, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-262102120-1", name: "BRP 598", number: "CAIU9832153", cargoType: "units", proforma: "1032176225", eur: 104740, assigned: 8, total: 8, arrivalLabel: "Jun 3 (Arrived)", status: "transit" },
      { id: "c-262102120-2", name: "BRP 599", number: "UETU5826527", cargoType: "units", proforma: "1032172607", eur: 81900, assigned: 8, total: 8, arrivalLabel: "Jun 3 (Arrived)", status: "transit" },
      { id: "c-262102120-3", name: "BRP 600", number: "FCIU7184050", cargoType: "units", proforma: "1032172618", eur: 126180, assigned: 10, total: 10, arrivalLabel: "Jun 3 (Arrived)", status: "transit" },
      { id: "c-262102120-4", name: "BRP 601", number: "FANU1042060", cargoType: "units", proforma: "1032172622", eur: 86830, assigned: 9, total: 9, arrivalLabel: "Jun 3 (Arrived)", status: "transit" },
    ],
  },
  {
    id: "262102199",
    status: "mixed",
    eta: "Jun 8, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-262102199-1", name: "PWC 15", number: "FFAU6115099", cargoType: "units", proforma: "1032172639", eur: 166460, assigned: 12, total: 12, arrivalLabel: "Jun 8 (Arrived)", eta: "Jun 3", status: "soon" },
      { id: "c-262102199-2", name: "PWC 16", number: "CSNU8545727", cargoType: "units", proforma: "1032172628", eur: 205920, assigned: 12, total: 12, arrivalLabel: "Jun 8 (Arrived)", eta: "Jun 3", status: "arrived" },
      { id: "c-262102199-3", name: "PWC 17", number: "FFAU3397337", cargoType: "units", proforma: "1032172634", eur: 166830, assigned: 12, total: 12, arrivalLabel: "Jun 8 (Arrived)", eta: "Jun 3", status: "arrived" },
    ],
  },
  {
    id: "262102753",
    status: "transit",
    eta: "Jun 8, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "summary" },
    containers: [
      { id: "c-262102753-1", name: "BRP 602", number: "TEMU6632453", cargoType: "units", proforma: "1032238971", eur: 77700, assigned: 8, total: 8, arrivalLabel: "Jun 8 (Arrived)", status: "transit" },
      { id: "c-262102753-2", name: "BRP 603", number: "TCNU6696967", cargoType: "units", proforma: "1032239019", eur: 82740, assigned: 8, total: 8, arrivalLabel: "Jun 8 (Arrived)", status: "transit" },
      { id: "c-262102753-3", name: "BRP 604", number: "FANU3204684", cargoType: "units", proforma: "1032238962", eur: 94400, assigned: 8, total: 8, arrivalLabel: "Jun 8 (Arrived)", status: "transit" },
      { id: "c-262102753-4", name: "BRP 605", number: "TGBU6045590", cargoType: "units", proforma: "1032238960", eur: 128420, assigned: 10, total: 10, arrivalLabel: "Jun 8 (Arrived)", status: "transit" },
      { id: "c-262102753-5", name: "BRP 606", number: "UETU5809031", cargoType: "units", proforma: "1032239004", eur: 196560, assigned: 6, total: 6, arrivalLabel: "Jun 8 (Arrived)", status: "transit" },
    ],
  },
  {
    id: "262102785",
    status: "transit",
    eta: "Jun 15, 2026",
    receipt: { state: "available", kind: "new-equipment", evidence: "exact" },
    containers: [
      { id: "c-262102785-1", name: "BRP 607", number: "CAIU8519648", cargoType: "units", proforma: "1032239011", eur: 104640, assigned: 8, total: 8, arrivalLabel: "Jun 15 (Arrived)", status: "transit" },
      { id: "c-262102785-2", name: "BRP 608", number: "TGBU6907925", cargoType: "units", proforma: "1032238977", eur: 99900, assigned: 8, total: 8, arrivalLabel: "Jun 15 (Arrived)", status: "transit" },
    ],
  },
  {
    id: "262102090",
    status: "transit",
    eta: "May 25, 2026",
    receipt: {
      state: "created-unposted",
      kind: "existing-equipment",
      evidence: "exact",
      documentNumber: "PN-00000047",
    },
    containers: [
      { id: "c-262102090-1", name: "CAAU", number: "CAAU9339653", cargoType: "units", proforma: "1032172615", eur: 93570, assigned: 10, total: 10, arrivalLabel: "May 25 (Arrived)", status: "transit" },
    ],
  },
  {
    id: "OCEAN-PAC-05",
    status: "arrived",
    carrier: "OCEAN",
    route: "PAC 05",
    eta: "Mar 30, 2026",
    receipt: {
      state: "created-unposted",
      kind: "parts",
      evidence: "exact",
      documentNumber: "PN-00000037",
    },
    containers: [
      { id: "c-ocean-pac-05", name: "PAC 05", number: "PARTS-PAC-05", cargoType: "parts", proforma: "PAC 05", eur: 66710.51, assigned: 191, total: 197, arrivalLabel: "Mar 30 (Arrived)", status: "arrived" },
    ],
  },
];

export const oceanManifests: OceanManifest[] = [
  {
    id: "manifest-262102090",
    billOfLadingId: "262102090",
    proformas: ["1032172615"],
    containerNumbers: ["CAAU9339653"],
    documentIds: ["doc-pn-47"],
    units: 16,
    totalEur: 236340,
  },
  {
    id: "manifest-262102785",
    billOfLadingId: "262102785",
    proformas: ["1032239011", "1032238977"],
    containerNumbers: ["CAIU8519648", "TGBU6907925"],
    documentIds: ["doc-bl-262102785"],
    units: 37,
    totalEur: 523920,
  },
];

export const existingEquipmentReceipt: EquipmentReceiptPreview = {
  id: "receipt-262102090",
  billOfLadingId: "262102090",
  commercialRate: 1.085,
  unitCount: 16,
  totalEur: 236340,
  existingDocument: oceanDocuments[0],
  groups: [
    {
      containerNumber: "CAAU9339653",
      proforma: "1032172615",
      units: 10,
      totalEur: 93570,
      rows: [
        { id: "eu-1", number: 1, code: "2VTA", model: "ATV OUTL MAX EV37 WH CE", vin: "3JBFBA179TJ000025", engine: "ME005872", eur: 11280 },
        { id: "eu-2", number: 2, code: "1YTD", model: "ATV OUTL MAX XT 700 GY CE", vin: "3JB3PA578TJ000046", engine: "MR791335", eur: 7990 },
        { id: "eu-3", number: 3, code: "1YTD", model: "ATV OUTL MAX XT 700 GY CE", vin: "3JB3PA578TJ000054", engine: "MR791982", eur: 7990 },
        { id: "eu-4", number: 4, code: "4LTC", model: "ATV OUTL XMR 1000R GN CE", vin: "3JB3WA773TJ000441", engine: "MR813463", eur: 11690 },
        { id: "eu-5", number: 5, code: "1YTD", model: "ATV OUTL MAX XT 700 GY CE", vin: "3JB3PA570TJ000039", engine: "MR788456", eur: 7990 },
        { id: "eu-6", number: 6, code: "4LTC", model: "ATV OUTL XMR 1000R GN CE", vin: "3JB3WA775TJ000442", engine: "MR813457", eur: 11690 },
        { id: "eu-7", number: 7, code: "1YTD", model: "ATV OUTL MAX XT 700 GY CE", vin: "3JB3PA573TJ000052", engine: "MR791528", eur: 7990 },
        { id: "eu-8", number: 8, code: "4RTB", model: "ATV OUTL MAX DPS 1000R GY CE", vin: "3JB3MA773TJ000073", engine: "MR812909", eur: 9480 },
        { id: "eu-9", number: 9, code: "4RTB", model: "ATV OUTL MAX DPS 1000R GY CE", vin: "3JB3MA775TJ000075", engine: "MR813053", eur: 9480 },
        { id: "eu-10", number: 10, code: "1YTD", model: "ATV OUTL MAX XT 700 GY CE", vin: "3JB3PA575TJ000036", engine: "MR786238", eur: 7990 },
      ],
    },
  ],
};

export const newEquipmentReceipt: EquipmentReceiptPreview = {
  id: "receipt-262102785",
  billOfLadingId: "262102785",
  commercialRate: 1.085,
  unitCount: 37,
  totalEur: 523920,
  groups: [
    {
      containerNumber: "CAIU8519648",
      proforma: "1032239011",
      units: 8,
      totalEur: 104640,
      rows: [
        { id: "nu-1", number: 1, code: "4VTP", model: "ATV OUTL MAX XTP 1000R GY SAS", vin: "3JB3PA771TJ000533", engine: "MR816629", eur: 13130 },
        { id: "nu-2", number: 2, code: "4VTP", model: "ATV OUTL MAX XTP 1000R GY SAS", vin: "3JB3PA771TJ000489", engine: "MR815780", eur: 13130 },
        { id: "nu-3", number: 3, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA771TJ000389", engine: "MR816644", eur: 13030 },
        { id: "nu-4", number: 4, code: "4WTJ", model: "ATV OUTL MAX LTD 1000R BE SAS", vin: "3JB3VA771TJ000384", engine: "MR816600", eur: 13030 },
      ],
    },
    {
      containerNumber: "TGBU6907925",
      proforma: "1032238977",
      units: 8,
      totalEur: 99900,
      rows: [
        { id: "nu-5", number: 1, code: "8YTE", model: "SSV DEF XMR 65 HD11 CA INT", vin: "3JBKWA48TK000785", engine: "MR897072", eur: 14880 },
        { id: "nu-6", number: 2, code: "8YTE", model: "SSV DEF XMR 65 HD11 CA INT", vin: "3JBKWA48TK000836", engine: "MR901011", eur: 14880 },
      ],
    },
  ],
};

export const partsReceipt: PartsReceiptPreview = {
  id: "parts-receipt-pac-05",
  shipment: "OCEAN · PAC 05",
  document: oceanDocuments[1],
  linesReady: 191,
  linesTotal: 197,
  quantity: 2551,
  totalEur: 66710.51,
  mapped: 197,
  mappedTotal: 197,
  issueCounts: { blocked: 0, link: 0, create: 0, transfer: 0, check: 0, price: 0 },
  lines: [
    { article: "219401317", name: "Кронштейн для смартфона", sourceCategory: "SSV · X · Accessories", oneCCard: "99999", folder: "ATV Accessories / SSV_accessory_price_category", quantity: 1, eur: 56.7 },
    { article: "267000372", name: "УПОР ПРУЖИНЫ", sourceCategory: "MAR · B · Comp Parts", oneCCard: "19686", folder: "Sea-Doo Parts / MAR_parts_price_category", quantity: 3, eur: 27.45 },
    { article: "267000906", name: "СОПЛО ПОВОРОТНОЕ", sourceCategory: "MAR · A · Captive Parts", oneCCard: "99999", folder: "Sea-Doo Parts / MAR_parts_price_category", quantity: 3, eur: 11.28 },
  ],
};

export interface OceanEvidenceCoverage {
  evidencedRows: number;
  sourceTotal: number;
}

export function getEquipmentReceiptEvidenceCoverage(
  receipt: EquipmentReceiptPreview,
): OceanEvidenceCoverage {
  return {
    evidencedRows: receipt.groups.reduce(
      (total, group) => total + group.rows.length,
      0,
    ),
    sourceTotal: receipt.unitCount,
  };
}

export function getPartsReceiptEvidenceCoverage(
  receipt: PartsReceiptPreview,
): OceanEvidenceCoverage {
  return {
    evidencedRows: receipt.lines.length,
    sourceTotal: receipt.linesReady,
  };
}

export const OCEAN_RESEARCH_COVERAGE = {
  billsOfLading: oceanBillsOfLading.length,
  containers: oceanBillsOfLading.reduce(
    (total, bill) => total + bill.containers.length,
    0,
  ),
  receiptEntries: oceanBillsOfLading.filter((bill) => bill.receipt).length,
  receiptBills: oceanBillsOfLading.filter((bill) => bill.receipt.evidence === "exact").length,
  existingEquipment: getEquipmentReceiptEvidenceCoverage(existingEquipmentReceipt),
  newEquipment: getEquipmentReceiptEvidenceCoverage(newEquipmentReceipt),
  parts: getPartsReceiptEvidenceCoverage(partsReceipt),
} as const;

export function oceanResearchCoverageIsConsistent(): boolean {
  return (
    OCEAN_RESEARCH_COVERAGE.billsOfLading === 11 &&
    OCEAN_RESEARCH_COVERAGE.containers === 26 &&
    OCEAN_RESEARCH_COVERAGE.receiptEntries === 11 &&
    OCEAN_RESEARCH_COVERAGE.receiptBills === 4 &&
    OCEAN_RESEARCH_COVERAGE.existingEquipment.evidencedRows === 10 &&
    OCEAN_RESEARCH_COVERAGE.existingEquipment.sourceTotal === 16 &&
    OCEAN_RESEARCH_COVERAGE.newEquipment.evidencedRows === 6 &&
    OCEAN_RESEARCH_COVERAGE.newEquipment.sourceTotal === 37 &&
    OCEAN_RESEARCH_COVERAGE.parts.evidencedRows === 3 &&
    OCEAN_RESEARCH_COVERAGE.parts.sourceTotal === 191
  );
}

const dealerEquipmentSeed = existingEquipmentReceipt.groups[0].rows;

export const dealerEquipment: OceanEquipment[] = [
  ...dealerEquipmentSeed.map((unit, index): OceanEquipment => ({
    id: `dealer-${unit.id}`,
    dealer: "BRP Вышгород",
    code: unit.code,
    model: unit.model,
    vin: unit.vin,
    engine: unit.engine,
    year: 2026,
    type: "ATV",
    status: "Assigned",
    shipment: "262102090",
    client: "—",
    date: `2026-05-${String(18 + index).padStart(2, "0")}`,
    eur: unit.eur,
  })),
  { id: "dealer-pwc-1", dealer: "BRP Вышгород", code: "PWC1", model: "SEA-DOO GTX 170", vin: "YDV48231T626", engine: "MEA06104", year: 2026, type: "PWC", status: "Assigned", shipment: "252108627", client: "—", date: "2026-05-28", eur: 18340 },
  { id: "dealer-pwc-2", dealer: "BRP Вышгород", code: "PWC2", model: "SEA-DOO RXT-X 325", vin: "YDV51802T626", engine: "MEB17082", year: 2026, type: "PWC", status: "Assigned", shipment: "252108627", client: "—", date: "2026-05-28", eur: 22490 },
  { id: "dealer-ssv-1", dealer: "BRP Вышгород", code: "8YTE", model: "SSV DEF XMR 65 HD11 CA INT", vin: "3JBKWA48TK000785", engine: "MR897072", year: 2026, type: "SSV", status: "Assigned", shipment: "262102785", client: "—", date: "2026-06-15", eur: 14880 },
  { id: "dealer-ssv-2", dealer: "BRP Вышгород", code: "8YTE", model: "SSV DEF XMR 65 HD11 CA INT", vin: "3JBKWA48TK000836", engine: "MR901011", year: 2026, type: "SSV", status: "Assigned", shipment: "262102785", client: "—", date: "2026-06-15", eur: 14880 },
  { id: "dealer-3wv-1", dealer: "BRP Вышгород", code: "3WV1", model: "CAN-AM SPYDER F3 LTD", vin: "2BXREDD27TV001182", engine: "M3W26014", year: 2026, type: "3WV", status: "Assigned", shipment: "262102753", client: "—", date: "2026-06-08", eur: 24160 },
];

export const dealerNames = ["BRP Вышгород", "BRP Киев", "Logos"] as const;
