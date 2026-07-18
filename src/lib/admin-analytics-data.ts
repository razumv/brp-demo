export type AnalyticsTab =
  | "overview"
  | "finance"
  | "dealers"
  | "warehouse"
  | "purchases"
  | "parts"
  | "units"
  | "attention";

export type AnalyticsPeriod = "current-month" | "previous-month" | "quarter" | "year" | "twelve-months";
export type AnalyticsProduct = "all" | "units" | "parts";
export type AnalyticsUnitStatus = "available" | "in-transit";
export type AnalyticsUnitStatusFilter = "all" | AnalyticsUnitStatus;
export type AnalyticsUnitAssignmentFilter = "all" | "assigned" | "free";
export type AnalyticsUnitSort = "cost" | "model" | "status";

export type AnalyticsUnit = {
  readonly id: string;
  readonly sourceRank: number;
  readonly vin: string | null;
  readonly model: string;
  readonly status: AnalyticsUnitStatus;
  readonly dealer: string | null;
  readonly purchaseCost: number;
};

export type AnalyticsUnitFilters = {
  readonly query: string;
  readonly status: AnalyticsUnitStatusFilter;
  readonly assignment: AnalyticsUnitAssignmentFilter;
};

export type AnalyticsMetric = {
  readonly count: number;
  readonly purchaseCost: number;
};

export type AnalyticsUnitSummary = {
  readonly total: AnalyticsMetric;
  readonly available: AnalyticsMetric;
  readonly inTransit: AnalyticsMetric;
  readonly free: AnalyticsMetric;
  readonly assigned: AnalyticsMetric;
};

export const ANALYTICS_PAGE_SIZE = 100;

export const analyticsTabs: ReadonlyArray<{ id: AnalyticsTab; label: string }> = [
  { id: "overview", label: "Обзор" },
  { id: "finance", label: "Финансы" },
  { id: "dealers", label: "Дилеры" },
  { id: "warehouse", label: "Склад" },
  { id: "purchases", label: "Закупки" },
  { id: "parts", label: "Запчасти" },
  { id: "units", label: "Техника" },
  { id: "attention", label: "Внимание" },
];

export const analyticsPeriodOptions: ReadonlyArray<{
  id: AnalyticsPeriod;
  label: string;
  range: string;
}> = [
  { id: "current-month", label: "Текущий месяц", range: "2026-07-01 … 2026-07-18" },
  { id: "previous-month", label: "Прошлый месяц", range: "2026-06-01 … 2026-06-30" },
  { id: "quarter", label: "Квартал", range: "2026-07-01 … 2026-07-18" },
  { id: "year", label: "Год", range: "2026-01-01 … 2026-07-18" },
  { id: "twelve-months", label: "12 месяцев", range: "2025-08-01 … 2026-07-18" },
];

export const analyticsProductOptions: ReadonlyArray<{ id: AnalyticsProduct; label: string }> = [
  { id: "all", label: "Все товары" },
  { id: "units", label: "Техника" },
  { id: "parts", label: "Запчасти" },
];

export const analyticsUnitStatusOptions: ReadonlyArray<{ id: AnalyticsUnitStatusFilter; label: string }> = [
  { id: "all", label: "Все статусы" },
  { id: "available", label: "В наличии" },
  { id: "in-transit", label: "В пути" },
];

export const analyticsUnitAssignmentOptions: ReadonlyArray<{ id: AnalyticsUnitAssignmentFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "assigned", label: "За дилером" },
  { id: "free", label: "Свободные" },
];

export const analyticsUnitSortOptions: ReadonlyArray<{ id: AnalyticsUnitSort; label: string }> = [
  { id: "cost", label: "По стоимости" },
  { id: "model", label: "По модели" },
  { id: "status", label: "По статусу" },
];

export const analyticsSourceUnitTotals = {
  total: { count: 600, purchaseCost: 7_787_770 },
  available: { count: 316, purchaseCost: 4_050_750 },
  inTransit: { count: 284, purchaseCost: 3_737_020 },
  freeCount: 314,
  assignedCount: 286,
} as const;

export const analyticsPageBoundaryVins = [
  "3JB8UAU46TE000447",
  "YDV20490J526",
  "3JB3PA776TJ000480",
  "3JB3PA778TJ000335",
  "3JB3PA674TJ000091",
  "YDV05335G526",
] as const;

const dealerLabels = [
  "BRP Вышгород",
  "BRP Житомир",
  "BRP Ровно",
  "BRP Харьков",
  "BRP Днепр",
  "BRP Львов",
  "BRP Киев",
  "BRP Херсон",
  "BRP Полтава",
  "Logos",
  "BRP центр Черкассы 2",
  "BRP Мукачево",
] as const;

const syntheticModels = [
  "SSV MAV R XRC 999T GN HB SAS I",
  "SSV MAV R XRC 999T GN HB SAS C",
  "SSV COM MAX XTP 64 1000R GY IN",
  "PWC GTX LTD 325 AUD WH IBR IDF",
  "PWC RXP X 325 AUD BE IBR INT",
  "RD SPYDER F3 LTD 1330 SE6 BK D",
] as const;

const pageBoundaryVinByRank = new Map<number, string>(
  analyticsPageBoundaryVins.map((vin, pageIndex) => [pageIndex * ANALYTICS_PAGE_SIZE, vin]),
);

function statusAndCostForRank(rank: number): Pick<AnalyticsUnit, "status" | "purchaseCost"> {
  if (rank === 0) return { status: "available", purchaseCost: 34_180 };
  if (rank === 1) return { status: "in-transit", purchaseCost: 19_055 };
  if (rank <= 140) return { status: "in-transit", purchaseCost: 14_500 };
  if (rank <= 290) return { status: "available", purchaseCost: 14_000 };
  if (rank <= 433) return { status: "in-transit", purchaseCost: 11_850 };
  if (rank === 434) return { status: "available", purchaseCost: 11_710 };
  if (rank <= 598) return { status: "available", purchaseCost: 11_615 };
  return { status: "in-transit", purchaseCost: 7_915 };
}

function vinForRank(rank: number) {
  const boundaryVin = pageBoundaryVinByRank.get(rank);
  if (boundaryVin) return boundaryVin;
  if (rank === 1) return "2BXBMDD17TV000019";
  if (rank % 47 === 0) return null;
  const serial = String(rank + 1).padStart(6, "0");
  return rank % 3 === 0 ? `3JBSYN26${serial}` : `YDV${serial.slice(1)}D526`;
}

function modelForRank(rank: number) {
  if (rank === 0) return "SSV MAV R MAX XRC 999T GN HB S";
  if (rank === 1) return "RD CANYON REDR 1330 SE6 GN EU";
  if (rank === 141) return "ATV OUTL MAX 6X6 BAC 1000R BK";
  if (rank === 142) return "ATV OUTL MAX BAC 1000R CA CE";
  return syntheticModels[rank % syntheticModels.length];
}

function buildAssignedRanks() {
  const candidates = Array.from({ length: 600 }, (_, rank) => rank)
    .filter((rank) => rank !== 0 && rank !== 1)
    .sort((left, right) => {
      const leftHash = (left * 137 + 47) % 601;
      const rightHash = (right * 137 + 47) % 601;
      return leftHash - rightHash || left - right;
    });
  return new Set(candidates.slice(0, analyticsSourceUnitTotals.assignedCount));
}

const assignedRanks = buildAssignedRanks();

export const analyticsUnits: readonly AnalyticsUnit[] = Array.from({ length: 600 }, (_, sourceRank) => {
  const assigned = assignedRanks.has(sourceRank);
  return {
    id: `analytics-unit-${sourceRank + 1}`,
    sourceRank,
    vin: vinForRank(sourceRank),
    model: modelForRank(sourceRank),
    ...statusAndCostForRank(sourceRank),
    dealer: assigned ? dealerLabels[sourceRank % dealerLabels.length] : null,
  };
});

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

export function filterAnalyticsUnits(
  rows: readonly AnalyticsUnit[],
  filters: AnalyticsUnitFilters,
) {
  const normalizedQuery = normalize(filters.query);
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.assignment === "assigned" && row.dealer === null) return false;
    if (filters.assignment === "free" && row.dealer !== null) return false;
    if (!normalizedQuery) return true;
    return normalize(row.vin ?? "").includes(normalizedQuery) || normalize(row.model).includes(normalizedQuery);
  });
}

export function sortAnalyticsUnits(rows: readonly AnalyticsUnit[], sort: AnalyticsUnitSort) {
  return [...rows].sort((left, right) => {
    if (sort === "model") {
      return left.model.localeCompare(right.model, "ru-RU", { sensitivity: "base" }) || left.sourceRank - right.sourceRank;
    }
    if (sort === "status") {
      const statusOrder = Number(left.status === "in-transit") - Number(right.status === "in-transit");
      return statusOrder || right.purchaseCost - left.purchaseCost || left.sourceRank - right.sourceRank;
    }
    return right.purchaseCost - left.purchaseCost || left.sourceRank - right.sourceRank;
  });
}

export function summarizeAnalyticsUnits(rows: readonly AnalyticsUnit[]): AnalyticsUnitSummary {
  const metric = (predicate: (row: AnalyticsUnit) => boolean): AnalyticsMetric => rows.reduce(
    (summary, row) => predicate(row)
      ? { count: summary.count + 1, purchaseCost: summary.purchaseCost + row.purchaseCost }
      : summary,
    { count: 0, purchaseCost: 0 },
  );

  return {
    total: metric(() => true),
    available: metric((row) => row.status === "available"),
    inTransit: metric((row) => row.status === "in-transit"),
    free: metric((row) => row.dealer === null),
    assigned: metric((row) => row.dealer !== null),
  };
}

export function paginateAnalyticsUnits(rows: readonly AnalyticsUnit[], page: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / ANALYTICS_PAGE_SIZE));
  const safePage = Math.min(pageCount, Math.max(1, page));
  const startIndex = (safePage - 1) * ANALYTICS_PAGE_SIZE;
  return {
    page: safePage,
    pageCount,
    rows: rows.slice(startIndex, startIndex + ANALYTICS_PAGE_SIZE),
    start: rows.length ? startIndex + 1 : 0,
    end: Math.min(startIndex + ANALYTICS_PAGE_SIZE, rows.length),
    total: rows.length,
  };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Admin analytics fixture invariant failed: ${message}`);
}

export function assertAnalyticsDataInvariants() {
  const baseline = summarizeAnalyticsUnits(analyticsUnits);
  assert(baseline.total.count === 600, "total count");
  assert(baseline.total.purchaseCost === 7_787_770, "total purchase cost");
  assert(baseline.available.count === 316, "available count");
  assert(baseline.available.purchaseCost === 4_050_750, "available purchase cost");
  assert(baseline.inTransit.count === 284, "in-transit count");
  assert(baseline.inTransit.purchaseCost === 3_737_020, "in-transit purchase cost");
  assert(baseline.free.count === 314, "free count");
  assert(baseline.assigned.count === 286, "assigned count");

  const byCost = sortAnalyticsUnits(analyticsUnits, "cost");
  analyticsPageBoundaryVins.forEach((vin, pageIndex) => {
    assert(byCost[pageIndex * ANALYTICS_PAGE_SIZE]?.vin === vin, `page ${pageIndex + 1} first VIN`);
    const page = paginateAnalyticsUnits(byCost, pageIndex + 1);
    assert(page.start === pageIndex * ANALYTICS_PAGE_SIZE + 1, `page ${pageIndex + 1} start`);
    assert(page.end === (pageIndex + 1) * ANALYTICS_PAGE_SIZE, `page ${pageIndex + 1} end`);
    assert(page.total === 600 && page.pageCount === 6 && page.rows.length === 100, `page ${pageIndex + 1} range`);
  });
  assert(byCost[0]?.model === "SSV MAV R MAX XRC 999T GN HB S", "baseline first model");
  assert(byCost[0]?.status === "available" && byCost[0]?.dealer === null && byCost[0]?.purchaseCost === 34_180, "baseline first row");

  const byModel = sortAnalyticsUnits(analyticsUnits, "model");
  assert(byModel[0]?.model === "ATV OUTL MAX 6X6 BAC 1000R BK", "model sort first row");
  assert(byModel[1]?.model === "ATV OUTL MAX BAC 1000R CA CE", "model sort second row");

  const byStatus = sortAnalyticsUnits(analyticsUnits, "status");
  assert(byStatus.slice(0, 3).every((row) => row.status === "available"), "status sort starts available");

  const exactVin = filterAnalyticsUnits(analyticsUnits, { query: "3JB8UAU46TE000447", status: "all", assignment: "all" });
  const canyon = filterAnalyticsUnits(analyticsUnits, { query: "CANYON REDR", status: "all", assignment: "all" });
  const missing = filterAnalyticsUnits(analyticsUnits, { query: "NO_SUCH_VIN_9000", status: "all", assignment: "all" });
  assert(exactVin.length === 1 && exactVin[0]?.vin === "3JB8UAU46TE000447", "exact VIN search");
  assert(canyon.length === 1
    && canyon[0]?.vin === "2BXBMDD17TV000019"
    && canyon[0]?.model === "RD CANYON REDR 1330 SE6 GN EU"
    && canyon[0]?.status === "in-transit"
    && canyon[0]?.dealer === null
    && canyon[0]?.purchaseCost === 19_055, "model search");
  assert(missing.length === 0, "no-result search");
  assert(Object.values(summarizeAnalyticsUnits(missing)).every((metric) => metric.count === 0 && metric.purchaseCost === 0), "zero-result KPI");

  const available = filterAnalyticsUnits(analyticsUnits, { query: "", status: "available", assignment: "all" });
  const inTransit = filterAnalyticsUnits(analyticsUnits, { query: "", status: "in-transit", assignment: "all" });
  const free = filterAnalyticsUnits(analyticsUnits, { query: "", status: "all", assignment: "free" });
  const assigned = filterAnalyticsUnits(analyticsUnits, { query: "", status: "all", assignment: "assigned" });
  assert(available.length === 316 && available.every((row) => row.status === "available"), "available filter");
  assert(inTransit.length === 284 && inTransit.every((row) => row.status === "in-transit"), "in-transit filter");
  assert(free.length === 314 && free.every((row) => row.dealer === null), "free filter");
  assert(assigned.length === 286 && assigned.every((row) => row.dealer !== null), "assigned filter");
}
