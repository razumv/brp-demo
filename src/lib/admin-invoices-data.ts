export type InvoiceTabId = "contracts" | "appendices" | "invoices" | "cost";

export type InvoicePageKpi = {
  readonly id: "shipments" | "ready" | "missing" | "formed";
  readonly label: string;
  readonly value: number;
  readonly tone: "neutral" | "amber" | "red" | "green";
};

export type InvoiceContract = {
  readonly id: string;
  readonly shortNumber: string;
  readonly supplier: string;
  readonly buyer: string;
  readonly status: "active";
};

export type AppendixDocumentLine = {
  readonly id: string;
  readonly primaryDescription: string;
  readonly secondaryDescription: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
};

export type AppendixPreview = {
  readonly kind: "units" | "parts";
  readonly appendixNumber: string;
  readonly appendixDate: string;
  readonly contractNumber: string;
  readonly contractDate: string;
  readonly consignee: string;
  readonly consigneeAddress: string;
  readonly deliveryTerms: string;
  readonly currency: "EUR" | "USD";
  readonly totalSourceRows: number;
  readonly totalQuantity: number;
  readonly totalAmount: number;
  readonly representativeLines: readonly AppendixDocumentLine[];
};

export type InvoiceAppendix = {
  readonly id: string;
  readonly name: string;
  readonly date: string;
  readonly composition: string;
  readonly shipment: string;
  readonly eta: string;
  readonly contractNumber: "DA/W-1" | "CR/DMS-01";
  readonly amount: string;
  readonly preview?: AppendixPreview;
};

export type InvoiceShipmentFilter = "all" | "in-transit" | "arrived";

export type InvoiceShipmentGroup = {
  readonly id: string;
  readonly billOfLading: string;
  readonly containerCount: number;
  readonly unitCount: number;
  readonly readiness: string;
  readonly eta: string;
  readonly filterState: Exclude<InvoiceShipmentFilter, "all">;
  /** Source visibly renders this label even in the in-transit filter. */
  readonly visibleStatusLabel: "Прибув";
};

export type FormedInvoice = {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly containerNumber: string;
  readonly unitCount: number;
  readonly total: string;
  readonly date: string;
};

export type InvoiceCostView = "active" | "archive" | "incomplete";

export type InvoiceCostMonthId =
  | "jan-2026"
  | "feb-2026"
  | "mar-2026"
  | "apr-2026"
  | "may-2026"
  | "jun-2026"
  | "jul-2026";

export type InvoiceCostMonth = {
  readonly id: InvoiceCostMonthId;
  readonly label: string;
  readonly sourceCount: number;
};

export type InvoiceCostCard = {
  readonly id: string;
  readonly billOfLading: string;
  readonly shipmentLabel: string;
  readonly eta: string | null;
  /** Null means the inspected evidence did not establish a month for this representative row. */
  readonly month: InvoiceCostMonthId | null;
  readonly archived: boolean;
  readonly incomplete: boolean;
  readonly goodsEur: string;
  readonly goodsUsd: string;
  readonly freight: string;
  readonly customs: string;
  readonly broker: string;
  readonly cash: string;
  readonly total: string;
  readonly costPercent: string;
};

export const invoicePageKpis = [
  { id: "shipments", label: "Всього відвантажень", value: 71, tone: "neutral" },
  { id: "ready", label: "Готові до інвойсу", value: 11, tone: "amber" },
  { id: "missing", label: "Немає даних", value: 0, tone: "red" },
  { id: "formed", label: "Сформовано", value: 60, tone: "green" },
] as const satisfies readonly InvoicePageKpi[];

export const invoiceContracts = [
  {
    id: "cr-dms-01",
    shortNumber: "CR/DMS-01",
    supplier: "CREATIVE TRADE GROUP",
    buyer: "ПП «ДНЕПРМАРИН СПОРТ»",
    status: "active",
  },
  {
    id: "da-w-1",
    shortNumber: "DA/W-1",
    supplier: "DIGITAL ADAMS LTD",
    buyer: "ТОВ ВАТЕРВЕЙЗ",
    status: "active",
  },
] as const satisfies readonly InvoiceContract[];

const unitPreview: AppendixPreview = {
  kind: "units",
  appendixNumber: "01",
  appendixDate: "18.02.2026",
  contractNumber: "DA/W-1",
  contractDate: "07.01.2026",
  consignee: "ТОВ ВАТЕРВЕЙЗ",
  consigneeAddress: "вул. Котенка Дениса буд. 3",
  deliveryTerms: "FOB Houston, USA",
  currency: "EUR",
  totalSourceRows: 9,
  totalQuantity: 24,
  totalAmount: 70_175,
  representativeLines: [
    { id: "4rtb-gray-1", primaryDescription: "#4RTB ATV OUTL MAX DPS 1000R GY Gray", secondaryDescription: "#4RTB Квадроцикл ATV OUTL MAX DPS 1000R GY Сірий", quantity: 1, unitPrice: 2_666, amount: 2_666 },
    { id: "4vtc-gray", primaryDescription: "#4VTC ATV OUTL MAX XTP 1000R GY Gray", secondaryDescription: "#4VTC Квадроцикл ATV OUTL MAX XTP 1000R GY Сірий", quantity: 4, unitPrice: 3_344, amount: 13_376 },
    { id: "4vtp-gray", primaryDescription: "#4VTP ATV OUTL MAX XTP 1000R SAS Gray", secondaryDescription: "#4VTP Квадроцикл ATV OUTL MAX XTP 1000R SAS Сірий", quantity: 1, unitPrice: 3_344, amount: 3_344 },
    { id: "6cta-gray", primaryDescription: "#6CTA SSV COM MAX XTP 64 1000R Gray", secondaryDescription: "#6CTA Мотовсюдихід SSV COM MAX XTP 64 1000R Сірий", quantity: 1, unitPrice: 3_534, amount: 3_534 },
    { id: "6kta-black", primaryDescription: "#6KTA SSV COM MAX XT 64 1000R Black", secondaryDescription: "#6KTA Мотовсюдихід SSV COM MAX XT 64 1000R Чорний", quantity: 1, unitPrice: 3_534, amount: 3_534 },
    { id: "4stf-red", primaryDescription: "#4STF ATV OUTL MAX XT 850 RD Red", secondaryDescription: "#4STF Квадроцикл ATV OUTL MAX XT 850 RD Червоний", quantity: 8, unitPrice: 2_575, amount: 20_600 },
    { id: "4rtb-gray-6", primaryDescription: "#4RTB ATV OUTL MAX DPS 1000R GY Gray", secondaryDescription: "#4RTB Квадроцикл ATV OUTL MAX DPS 1000R GY Сірий", quantity: 6, unitPrice: 2_666, amount: 15_996 },
  ],
};

const partsPreview: AppendixPreview = {
  kind: "parts",
  appendixNumber: "12",
  appendixDate: "09.02.2026",
  contractNumber: "CR/DMS-01",
  contractDate: "23.07.2025",
  consignee: "ПП «ДНЕПРМАРИН СПОРТ»",
  consigneeAddress: "вул. 152-ї Дивізії, буд. 3",
  deliveryTerms: "FOB Montreal, Canada",
  currency: "USD",
  totalSourceRows: 45,
  totalQuantity: 863,
  totalAmount: 31_544.2,
  representativeLines: [
    { id: "715010786", primaryDescription: "#715010786 SUPPORT_RACK_PIVOT KIT SSP", secondaryDescription: "#715010786 Комплект для кріплення кофра квадроцикла", quantity: 1, unitPrice: 120.97, amount: 120.97 },
    { id: "275500986", primaryDescription: "#275500986 FILLER NECK", secondaryDescription: "#275500986 заливна горловина до паливного баку квадроцикла", quantity: 1, unitPrice: 3.45, amount: 3.45 },
    { id: "275501094", primaryDescription: "#275501094 FUEL CAP ASS'Y", secondaryDescription: "#275501094 Пробка паливного баку для квадроцикла", quantity: 1, unitPrice: 1.54, amount: 1.54 },
    { id: "2880080610", primaryDescription: "#2880080610 M SIGNATURE ZIP-UP M", secondaryDescription: "#2880080610 Чоловіча толстовка Ski-Doo Signature на блискавці, M", quantity: 1, unitPrice: 15.96, amount: 15.96 },
    { id: "2881550690", primaryDescription: "#2881550690 M COBRA DESERT PULLOVER HOODIE M", secondaryDescription: "#2881550690 ПУЛОВЕР З КАПЮШОНОМ COBRA DESERT чоловічий M", quantity: 1, unitPrice: 19.65, amount: 19.65 },
    { id: "2881550990", primaryDescription: "#2881550990 M COBRA DESERT PULLOVER HOODIE L", secondaryDescription: "#2881550990 ПУЛОВЕР З КАПЮШОНОМ COBRA DESERT чоловічий L", quantity: 1, unitPrice: 19.65, amount: 19.65 },
    { id: "2881551290", primaryDescription: "#2881551290 M COBRA DESERT PULLOVER HOODIE XL", secondaryDescription: "#2881551290 ПУЛОВЕР З КАПЮШОНОМ COBRA DESERT чоловічий XL", quantity: 1, unitPrice: 19.65, amount: 19.65 },
    { id: "2882420990", primaryDescription: "#2882420990 M CAN-AM EMBLEM PULLOVER L", secondaryDescription: "#2882420990 ПУЛОВЕР CAN-AM EMBLEM чоловічий L", quantity: 2, unitPrice: 12.84, amount: 25.68 },
  ],
};

export const invoiceAppendixSourceTotals = {
  appendices: 23,
  proformas: 67,
  amount: "$2,790,479",
  containers: 59,
  nearestEta: "12.07",
} as const;

export const invoiceAppendices: readonly InvoiceAppendix[] = [
  { id: "da-wat-01", name: "Appendix DA-WAT 01", date: "18.02.2026", composition: "3 проформи", shipment: "MEX 578, MEX 577, MEX 579", eta: "10.03", contractNumber: "DA/W-1", amount: "EUR 70,175", preview: unitPreview },
  { id: "da-wat-02", name: "Appendix DA-WAT 02", date: "02.03.2026", composition: "1 проформа + 441 запчастина", shipment: "PAC 03 + Spyders", eta: "11.05", contractNumber: "DA/W-1", amount: "EUR 24,553" },
  { id: "da-wat-07", name: "Appendix DA-WAT 07", date: "03.04.2026", composition: "8 проформ", shipment: "—", eta: "—", contractNumber: "DA/W-1", amount: "EUR 246,930" },
  { id: "cr-dms-10", name: "Appendix CR-DMS 10", date: "12.01.2026", composition: "6 проформ", shipment: "PWC 05-10", eta: "09.03 / 03.04", contractNumber: "CR/DMS-01", amount: "$393,600" },
  { id: "cr-dms-12", name: "Appendix CR-DMS 12", date: "09.02.2026", composition: "45 запчастин", shipment: "PAC 01", eta: "31.03", contractNumber: "CR/DMS-01", amount: "$31,544", preview: partsPreview },
  { id: "cr-dms-16", name: "Appendix CR-DMS 16", date: "27.02.2026", composition: "18 запчастин", shipment: "PAC 02", eta: "03.07", contractNumber: "CR/DMS-01", amount: "$12,311" },
  { id: "cr-dms-18", name: "Appendix CR-DMS 18", date: "04.03.2026", composition: "409 запчастин", shipment: "PAC 04", eta: "23.05", contractNumber: "CR/DMS-01", amount: "$40,132" },
  { id: "cr-dms-19", name: "Appendix CR-DMS 19", date: "04.03.2026", composition: "197 запчастин", shipment: "PAC 05", eta: "18.05", contractNumber: "CR/DMS-01", amount: "$34,994" },
  { id: "cr-dms-24", name: "Appendix CR-DMS 24", date: "15.03.2026", composition: "5 проформ", shipment: "BRP 609-613", eta: "15.06", contractNumber: "CR/DMS-01", amount: "$156,665" },
] as const;

export const invoiceShipmentSourceCounts = {
  all: 71,
  "in-transit": 36,
  arrived: 35,
  groupedAll: 32,
  groupedInTransit: 16,
  groupedArrived: 17,
} as const;

export const invoiceShipmentGroups = [
  { id: "bl-252108428", billOfLading: "252108428", containerCount: 1, unitCount: 8, readiness: "Готово", eta: "Jan 29", filterState: "arrived", visibleStatusLabel: "Прибув" },
  { id: "bl-252108918", billOfLading: "252108918", containerCount: 3, unitCount: 19, readiness: "2/3", eta: "Feb 15", filterState: "in-transit", visibleStatusLabel: "Прибув" },
  { id: "bl-260101069", billOfLading: "260101069", containerCount: 1, unitCount: 0, readiness: "Готово", eta: "Mar 31", filterState: "arrived", visibleStatusLabel: "Прибув" },
  { id: "bl-262100130", billOfLading: "262100130", containerCount: 7, unitCount: 56, readiness: "Готово", eta: "Mar 24", filterState: "in-transit", visibleStatusLabel: "Прибув" },
  { id: "bl-262102753", billOfLading: "262102753", containerCount: 6, unitCount: 47, readiness: "Готово", eta: "Jun 8", filterState: "in-transit", visibleStatusLabel: "Прибув" },
] as const satisfies readonly InvoiceShipmentGroup[];

export const formedInvoices = [
  { id: "formed-1032239014", invoiceNumber: "1032239014", containerNumber: "OOCU9832002", unitCount: 8, total: "$26,752.00", date: "22.05.2026" },
  { id: "formed-1032012219", invoiceNumber: "1032012219", containerNumber: "OOCU9460775", unitCount: 12, total: "$70,400.00", date: "18.05.2026" },
  { id: "formed-1032050000", invoiceNumber: "1032050000", containerNumber: "FFAU6355567", unitCount: 12, total: "$75,200.00", date: "18.05.2026" },
  { id: "formed-1032238995", invoiceNumber: "1032238995", containerNumber: "FANU1913021", unitCount: 6, total: "$33,536.00", date: "17.05.2026" },
] as const satisfies readonly FormedInvoice[];

export const invoiceCostMonths = [
  { id: "jan-2026", label: "Jan 2026", sourceCount: 6 },
  { id: "feb-2026", label: "Feb 2026", sourceCount: 5 },
  { id: "mar-2026", label: "Mar 2026", sourceCount: 13 },
  { id: "apr-2026", label: "Apr 2026", sourceCount: 10 },
  { id: "may-2026", label: "May 2026", sourceCount: 10 },
  { id: "jun-2026", label: "Jun 2026", sourceCount: 25 },
  { id: "jul-2026", label: "Jul 2026", sourceCount: 2 },
] as const satisfies readonly InvoiceCostMonth[];

export const invoiceCostKpis = {
  active: { freight: "$84,934.84", customs: "$140,013.39", broker: "$1,224.82", cash: "$241,000.00", total: "$467,173.05" },
  archive: { freight: "$239,711.54", customs: "$382,632.91", broker: "$3,680.09", cash: "$115,000.00", total: "$741,024.54" },
} as const;

export const invoiceCostSourceCounts = {
  active: 24,
  archive: 8,
  incomplete: 19,
} as const;

export const invoiceCostCards = [
  { id: "cost-260101069", billOfLading: "260101069", shipmentLabel: "PAC 01", eta: "Mar 31 (прибув)", month: "mar-2026", archived: false, incomplete: true, goodsEur: "€65,815", goodsUsd: "$71,080", freight: "—", customs: "—", broker: "—", cash: "$5,500.00", total: "$5,500.00", costPercent: "7.7%" },
  { id: "cost-262100299", billOfLading: "262100299", shipmentLabel: "PWC 09-10", eta: null, month: null, archived: false, incomplete: false, goodsEur: "€273,970", goodsUsd: "$295,888", freight: "$22,690.81", customs: "$44,790.88", broker: "$270.42", cash: "$10,000.00", total: "$77,752.11", costPercent: "26.3%" },
  { id: "cost-262100398", billOfLading: "262100398", shipmentLabel: "PWC 07-08", eta: null, month: null, archived: false, incomplete: false, goodsEur: "€284,980", goodsUsd: "$307,778", freight: "$20,754.06", customs: "$46,071.28", broker: "$271.26", cash: "$10,000.00", total: "$77,096.60", costPercent: "25.0%" },
  { id: "cost-archive-252108428", billOfLading: "252108428", shipmentLabel: "MEX 570", eta: "Jan 29 (прибув)", month: "jan-2026", archived: true, incomplete: false, goodsEur: "€104,240", goodsUsd: "$112,579", freight: "—", customs: "—", broker: "$208.62", cash: "$5,000.00", total: "$28,674.71", costPercent: "25.5%" },
  { id: "cost-archive-252108918", billOfLading: "252108918", shipmentLabel: "MEX 574-576", eta: "Feb 15 (прибув)", month: "feb-2026", archived: true, incomplete: false, goodsEur: "€265,490", goodsUsd: "$286,729", freight: "$31,446.22", customs: "$33,666.54", broker: "$477.09", cash: "$15,000.00", total: "$80,589.85", costPercent: "28.1%" },
] as const satisfies readonly InvoiceCostCard[];
