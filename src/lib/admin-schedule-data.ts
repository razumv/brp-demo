export type ScheduleTab = "deliveries" | "stock";
export type ScheduleCategory = "PWC" | "ATV" | "SSV" | "3WV";
export type ScheduleSlotStatus = "arrived" | "in-transit" | "future";

export interface ScheduleKpi {
  readonly id: "arriving" | "overdue" | "units" | "stock";
  readonly label: string;
  readonly value: number;
  readonly helper: string | null;
  readonly tone: "blue" | "red" | "green" | "orange";
}

export interface ScheduleSlotLine {
  readonly id: string;
  readonly sku: string;
  readonly model: string;
  readonly total: number;
  readonly free: number;
  readonly evidence: "source-observed";
}

export interface ScheduleSlot {
  readonly id: string;
  readonly sourcePage: 1 | 2;
  readonly category: ScheduleCategory;
  readonly name: string;
  readonly detailTitle: string;
  readonly paymentDue: string;
  readonly status: ScheduleSlotStatus;
  readonly arrivalDate: `${number}-${number}-${number}`;
  readonly arrival: string;
  readonly free: number;
  readonly total: number;
  readonly lines: readonly ScheduleSlotLine[];
  readonly evidence: "source-observed";
}

export interface ScheduleSearchResult {
  readonly id: string;
  readonly sku: string;
  readonly model: string;
  readonly slotName: string;
  readonly slotId: string;
  readonly arrival: string;
  readonly total: number;
  readonly free: number;
}

export interface ScheduleStockRow {
  readonly id: string;
  readonly model: string;
  readonly category: "3WV" | "ATV" | "SSV" | "Ski-Doo" | "Spyder";
  readonly location: string;
  readonly total: number;
  readonly reserved: number;
  readonly free: number;
  readonly evidence: "source-observed";
}

export const scheduleKpis = [
  { id: "arriving", label: "Прибуває цього місяця", value: 0, helper: null, tone: "blue" },
  { id: "overdue", label: "Прострочена оплата", value: 20, helper: null, tone: "red" },
  { id: "units", label: "Усього одиниць у графіку", value: 356, helper: "14 вільно", tone: "green" },
  { id: "stock", label: "На складі зараз", value: 33, helper: "од.", tone: "orange" },
] as const satisfies readonly ScheduleKpi[];

const pwcMarchLines = [
  { id: "pwc-mar-23tb", sku: "23TB", model: "RXP X 325 - Gulfstream Blue Premium", total: 5, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-22tf", sku: "22TF", model: "RXT X 325 - Ice Metal / Manta Green", total: 2, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-25tb", sku: "25TB", model: "GTX PRO 130 (Rental) - White / Neo Mint", total: 1, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-26tb", sku: "26TB", model: "GTX Limited 325 - Teal Metallic", total: 2, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-26ta", sku: "26TA", model: "GTX Limited 325 - White Pearl Premium", total: 1, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-13tb", sku: "13TB", model: "Wake PRO 230 - Sand / Dazzling Blue", total: 1, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-67tc", sku: "67TC", model: "Spark Trixx 90 For 1 - Dragon Red / Bright White", total: 2, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-67td", sku: "67TD", model: "Spark Trixx 90 For 1 - Gulfstream Blue / Orange Crush", total: 3, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-66tc", sku: "66TC", model: "Spark Trixx 90 For 3 - Dragon Red / Bright White", total: 3, free: 0, evidence: "source-observed" },
  { id: "pwc-mar-66td", sku: "66TD", model: "Spark Trixx 90 For 3 - Gulfstream Blue / Orange Crush", total: 4, free: 0, evidence: "source-observed" },
] as const satisfies readonly ScheduleSlotLine[];

export const scheduleSlots = [
  {
    id: "pwc-march-2026-1",
    sourcePage: 1,
    category: "PWC",
    name: "PWC март 2026 #1",
    detailTitle: "PWC март 2026",
    paymentDue: "20.02.2026",
    status: "arrived",
    arrivalDate: "2026-06-12",
    arrival: "12.06.2026",
    free: 0,
    total: 24,
    lines: pwcMarchLines,
    evidence: "source-observed",
  },
  { id: "atv-february-2026-1", sourcePage: 1, category: "ATV", name: "ATV февраль 2026 #1", detailTitle: "ATV февраль 2026 #1", paymentDue: "20.02.2026", status: "arrived", arrivalDate: "2026-06-03", arrival: "03.06.2026", free: 1, total: 33, lines: [], evidence: "source-observed" },
  { id: "pwc-march-2026-2", sourcePage: 1, category: "PWC", name: "PWC март 2026 #2", detailTitle: "PWC март 2026 #2", paymentDue: "20.02.2026", status: "arrived", arrivalDate: "2026-06-05", arrival: "05.06.2026", free: 0, total: 36, lines: [], evidence: "source-observed" },
  { id: "atv-february-2026-2", sourcePage: 1, category: "ATV", name: "ATV февраль 2026 #2", detailTitle: "ATV февраль 2026 #2", paymentDue: "20.02.2026", status: "arrived", arrivalDate: "2026-06-05", arrival: "05.06.2026", free: 0, total: 16, lines: [], evidence: "source-observed" },
  { id: "ssv-march-2026", sourcePage: 1, category: "SSV", name: "SSV март 2026", detailTitle: "SSV март 2026", paymentDue: "20.03.2026", status: "arrived", arrivalDate: "2026-06-03", arrival: "03.06.2026", free: 0, total: 2, lines: [], evidence: "source-observed" },
  { id: "ssv-april-2026-1", sourcePage: 1, category: "SSV", name: "SSV апрель 2026 #1", detailTitle: "SSV апрель 2026 #1", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-08", arrival: "08.06.2026", free: 0, total: 6, lines: [], evidence: "source-observed" },
  { id: "atv-april-2026-1", sourcePage: 1, category: "ATV", name: "ATV апрель 2026 #1", detailTitle: "ATV апрель 2026 #1", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-21", arrival: "21.06.2026", free: 2, total: 10, lines: [], evidence: "source-observed" },
  { id: "atv-april-2026-2", sourcePage: 2, category: "ATV", name: "ATV апрель 2026 #2", detailTitle: "ATV апрель 2026 #2", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-15", arrival: "15.06.2026", free: 0, total: 36, lines: [], evidence: "source-observed" },
  { id: "ssv-april-2026-2", sourcePage: 2, category: "SSV", name: "SSV апрель 2026 #2", detailTitle: "SSV апрель 2026 #2", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-21", arrival: "21.06.2026", free: 0, total: 2, lines: [], evidence: "source-observed" },
  { id: "atv-april-2026-3", sourcePage: 2, category: "ATV", name: "ATV апрель 2026 #3", detailTitle: "ATV апрель 2026 #3", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-28", arrival: "28.06.2026", free: 0, total: 8, lines: [], evidence: "source-observed" },
  { id: "ssv-april-2026-3", sourcePage: 2, category: "SSV", name: "SSV апрель 2026 #3", detailTitle: "SSV апрель 2026 #3", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-08", arrival: "08.06.2026", free: 1, total: 3, lines: [], evidence: "source-observed" },
  { id: "ssv-april-2026-4", sourcePage: 2, category: "SSV", name: "SSV апрель 2026 #4", detailTitle: "SSV апрель 2026 #4", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-15", arrival: "15.06.2026", free: 0, total: 8, lines: [], evidence: "source-observed" },
  { id: "ssv-april-2026-5", sourcePage: 2, category: "SSV", name: "SSV апрель 2026 #5", detailTitle: "SSV апрель 2026 #5", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-21", arrival: "21.06.2026", free: 0, total: 2, lines: [], evidence: "source-observed" },
  { id: "atv-april-2026-4", sourcePage: 2, category: "ATV", name: "ATV апрель 2026 #4", detailTitle: "ATV апрель 2026 #4", paymentDue: "20.04.2026", status: "arrived", arrivalDate: "2026-06-08", arrival: "08.06.2026", free: 0, total: 38, lines: [], evidence: "source-observed" },
] as const satisfies readonly ScheduleSlot[];

export const scheduleSourceTotals = {
  slots: 23,
  positions: 92,
  stock: 33,
  pages: 4,
  lastChecked: "07.06 20:45",
  lastSynced: "07.06 20:45",
} as const;

export const scheduleSearchResults: readonly ScheduleSearchResult[] = pwcMarchLines.map((line) => ({
  id: `search-${line.id}`,
  sku: line.sku,
  model: line.model,
  slotName: "PWC март 2026",
  slotId: "pwc-march-2026-1",
  arrival: "12.06.2026",
  total: line.total,
  free: line.free,
}));

export const scheduleStockRows = [
  { id: "stock-canyon", model: "CANYON REDROCK 1330 ACE SE6 EUR Moss Green Satin 25", category: "3WV", location: "Днепр (BRP Centre)", total: 1, reserved: 0, free: 1, evidence: "source-observed" },
  { id: "stock-outlander-electric", model: "Outlander MAX Electric White CE 26", category: "ATV", location: "Склад Днепр", total: 5, reserved: 0, free: 5, evidence: "source-observed" },
  { id: "stock-defender", model: "Defender X MR HD11 Loft Green Satin 26", category: "SSV", location: "Склад Днепр", total: 1, reserved: 0, free: 1, evidence: "source-observed" },
  { id: "stock-expedition", model: "Expedition SE 900 ACE Turbo R", category: "Ski-Doo", location: "Київ BRP Centre 3 + Мукачево 2", total: 5, reserved: 0, free: 5, evidence: "source-observed" },
  { id: "stock-rally", model: "Rally 2026", category: "Spyder", location: "Львів BRP Centre", total: 4, reserved: 0, free: 4, evidence: "source-observed" },
] as const satisfies readonly ScheduleStockRow[];
