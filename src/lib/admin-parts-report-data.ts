export type PartsReportPeriodPresetId = "day" | "week" | "decade" | "month" | "three-months" | "year";

export type PartsReportPeriodPreset = {
  readonly id: PartsReportPeriodPresetId;
  readonly label: string;
  readonly from: string;
  readonly to: string;
};

export type SyntheticManagerId = "all" | "demo-manager-1" | "demo-manager-2" | "demo-manager-3" | "demo-manager-4" | "demo-manager-5";

export type SyntheticManagerOption = {
  readonly id: SyntheticManagerId;
  readonly label: string;
  readonly identity: "synthetic-display-only";
};

export type PartsReportFilter = {
  readonly from: string;
  readonly to: string;
  readonly managerId: SyntheticManagerId;
};

export type PartsReportKpiId = "orders" | "received" | "payments" | "linked-balance";

export type PartsReportKpi = {
  readonly id: PartsReportKpiId;
  readonly label: string;
  readonly amountUsd: number;
  readonly helper: string;
};

export type PartsReportOrderStatus = "new";

export type PartsReportOrderRow = {
  readonly id: string;
  readonly detailId: "LOG-01";
  readonly code: "LOG-01";
  readonly status: PartsReportOrderStatus;
  readonly date: string;
  readonly dealer: string;
  readonly placedBy: string;
  readonly placedByIdentity: "synthetic-display-only";
  readonly manager: string;
  readonly positions: number;
  readonly amountUsd: number;
};

export type PartsReportRnRow = {
  readonly id: string;
  readonly rn: string;
  readonly orderCode: string;
  readonly date: string;
  readonly status: string;
  readonly quantity: number;
  readonly amountUsd: number;
};

export type PartsReportPaymentRow = {
  readonly id: string;
  readonly document: string;
  readonly date: string;
  readonly relation: string;
  readonly comment: string;
  readonly amountUsd: number;
};

export const partsReportPeriodPresets = [
  { id: "day", label: "День", from: "2026-07-18", to: "2026-07-18" },
  { id: "week", label: "Тиждень", from: "2026-07-12", to: "2026-07-18" },
  { id: "decade", label: "Декада", from: "2026-07-09", to: "2026-07-18" },
  { id: "month", label: "Місяць", from: "2026-06-19", to: "2026-07-18" },
  { id: "three-months", label: "3 місяці", from: "2026-04-20", to: "2026-07-18" },
  { id: "year", label: "Рік", from: "2025-07-19", to: "2026-07-18" },
] as const satisfies readonly PartsReportPeriodPreset[];

export const syntheticManagerOptions = [
  { id: "all", label: "Усі менеджери", identity: "synthetic-display-only" },
  { id: "demo-manager-1", label: "Менеджер 1", identity: "synthetic-display-only" },
  { id: "demo-manager-2", label: "Менеджер 2", identity: "synthetic-display-only" },
  { id: "demo-manager-3", label: "Менеджер 3", identity: "synthetic-display-only" },
  { id: "demo-manager-4", label: "Менеджер 4", identity: "synthetic-display-only" },
  { id: "demo-manager-5", label: "Менеджер 5", identity: "synthetic-display-only" },
] as const satisfies readonly SyntheticManagerOption[];

export const initialPartsReportFilter: PartsReportFilter = {
  from: "2026-06-19",
  to: "2026-07-18",
  managerId: "all",
};

export const partsReportKpis = [
  { id: "orders", label: "Замовлення", amountUsd: 13.09, helper: "1 замовлень" },
  { id: "received", label: "Отримано за РН", amountUsd: 0, helper: "0 РН" },
  { id: "payments", label: "Оплати за точними зв'язками", amountUsd: 0, helper: "0 платежів" },
  { id: "linked-balance", label: "Пов'язаний залишок USD", amountUsd: 0, helper: "без припущень на рівні дилера" },
] as const satisfies readonly PartsReportKpi[];

export const partsReportOrders = [
  {
    id: "parts-report-log-01",
    detailId: "LOG-01",
    code: "LOG-01",
    status: "new",
    date: "18.07.2026, 01:40",
    dealer: "Logos",
    placedBy: "Оператор",
    placedByIdentity: "synthetic-display-only",
    manager: "Не указан",
    positions: 1,
    amountUsd: 13.09,
  },
] as const satisfies readonly PartsReportOrderRow[];

export const partsReportRnRows = [] as const satisfies readonly PartsReportRnRow[];
export const partsReportPaymentRows = [] as const satisfies readonly PartsReportPaymentRow[];

export const PARTS_REPORT_CONTROL_NOTICE = {
  title: "Контроль даних",
  copy: "Пов'язані оплати не знайдені. Звіт не підставляє оплати приблизно за взаєморозрахунками дилера.",
} as const;

export const PARTS_REPORT_RN_EMPTY = "Немає пов'язаних РН за вибраний період";
export const PARTS_REPORT_PAYMENTS_EMPTY = "Немає оплат з точним зв'язком по РН/замовленню";
