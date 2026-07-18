export type PerformanceRanking =
  | "slowest-average"
  | "slowest-peak"
  | "highest-total"
  | "most-frequent";

export type PerformanceModule =
  | "Parts catalog"
  | "Accessories"
  | "Other"
  | "Settlements"
  | "Logistics"
  | "Notifications"
  | "People & access"
  | "Orders"
  | "Consignment"
  | "Invoices";

export type PerformanceQueryRecord = {
  readonly id: string;
  readonly module: PerformanceModule;
  readonly calls: number;
  readonly meanMs: number;
  readonly maxMs: number;
  readonly totalMs: number;
  readonly rows: number;
  readonly query: string;
};

export type PerformanceSummary = {
  readonly calls: number;
  readonly totalMs: number;
  readonly slowestAverageMs: number;
  readonly moduleCount: number;
};

type QueryMetrics = readonly [
  module: PerformanceModule,
  calls: number,
  meanMs: number,
  maxMs: number,
  totalMs: number,
  rows: number,
];

export const PERFORMANCE_EMPTY_COPY = "No query statistics yet.";

export const performanceRankingOptions: ReadonlyArray<{
  id: PerformanceRanking;
  label: string;
}> = [
  { id: "slowest-average", label: "Slowest average" },
  { id: "slowest-peak", label: "Slowest peak" },
  { id: "highest-total", label: "Highest total time" },
  { id: "most-frequent", label: "Most frequent" },
];

function repeatModule(module: PerformanceModule, count: number) {
  return Array.from({ length: count }, () => module);
}

function queryForModule(module: PerformanceModule, index: number) {
  if (module === "Parts catalog" && index === 0) {
    return "WITH total_unmapped AS (SELECT COUNT(*)::int AS count FROM part_catalog pc WHERE NOT EXISTS (SELECT 1 FROM catalog_nodes cn WHERE cn.catalog_id = pc.catalog_id)) SELECT count FROM total_unmapped";
  }
  if (module === "Parts catalog" && index === 1) {
    return "SELECT cn.id, cn.parent_id, cn.name FROM catalog_nodes cn WHERE cn.catalog_id = $1 AND cn.active = true ORDER BY cn.position, cn.name";
  }

  const offset = index % 7;
  const queries: Record<PerformanceModule, string> = {
    "Parts catalog": `SELECT pc.id, pc.part_number, pc.description, pc.retail_price FROM part_catalog pc WHERE pc.catalog_id = $1 AND pc.active = true ORDER BY pc.part_number LIMIT $2 OFFSET ${offset}`,
    Accessories: `SELECT ap.id, ap.sku, ap.name, ap.availability FROM accessory_products ap WHERE ap.source = $1 AND ap.active = true ORDER BY ap.updated_at DESC LIMIT $2 OFFSET ${offset}`,
    Other: `SELECT setting_key, setting_value FROM application_settings WHERE namespace = $1 ORDER BY setting_key LIMIT $2 OFFSET ${offset}`,
    Settlements: `SELECT s.id, s.company_id, s.status, s.total FROM settlements s WHERE s.created_at >= $1 ORDER BY s.created_at DESC LIMIT $2 OFFSET ${offset}`,
    Logistics: `SELECT sh.id, sh.reference, sh.eta, sh.status FROM shipments sh WHERE sh.status = $1 ORDER BY sh.eta LIMIT $2 OFFSET ${offset}`,
    Notifications: `SELECT n.id, n.kind, n.created_at FROM notifications n WHERE n.recipient_id = $1 ORDER BY n.created_at DESC LIMIT $2 OFFSET ${offset}`,
    "People & access": `SELECT u.id, u.display_name, r.code FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.active = true LIMIT $1 OFFSET ${offset}`,
    Orders: `SELECT o.id, o.number, o.status, o.created_at FROM orders o WHERE o.company_id = $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET ${offset}`,
    Consignment: `SELECT c.id, c.reference, c.status FROM consignments c WHERE c.dealer_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET ${offset}`,
    Invoices: `SELECT i.id, i.invoice_number, i.total, i.currency FROM invoices i WHERE i.company_id = $1 ORDER BY i.issued_at DESC LIMIT $2 OFFSET ${offset}`,
  };
  return queries[module];
}

function recordsFromMetrics(prefix: string, metrics: readonly QueryMetrics[]) {
  return metrics.map<PerformanceQueryRecord>((metric, index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    module: metric[0],
    calls: metric[1],
    meanMs: metric[2],
    maxMs: metric[3],
    totalMs: metric[4],
    rows: metric[5],
    query: queryForModule(metric[0], index),
  }));
}

const slowestAverageMetrics: readonly QueryMetrics[] = [
  ["Parts catalog", 3, 94_800, 119_250, 284_390, 3],
  ["Parts catalog", 3, 84_810, 95_130, 254_440, 3],
  ["Parts catalog", 3, 79_670, 88_210, 239_000, 75],
  ["Parts catalog", 3, 75_140, 87_880, 225_420, 3],
  ["Parts catalog", 2, 71_900, 85_290, 143_800, 2],
  ["Parts catalog", 3, 62_450, 81_350, 187_360, 75],
  ["Parts catalog", 2, 58_750, 62_490, 117_510, 50],
  ["Parts catalog", 3, 52_630, 76_330, 157_880, 3],
  ["Parts catalog", 3, 45_430, 55_700, 136_300, 3],
  ["Parts catalog", 3, 12_780, 14_670, 38_350, 3],
  ["Parts catalog", 1, 12_310, 12_310, 12_310, 1],
  ["Parts catalog", 2, 11_820, 15_570, 23_650, 2],
  ["Parts catalog", 2, 10_940, 14_320, 21_890, 2],
  ["Parts catalog", 1, 9_610, 9_610, 9_610, 1],
  ["Parts catalog", 1, 6_790, 6_790, 6_790, 1],
  ["Parts catalog", 3, 2_240, 2_930, 6_730, 75],
  ["Parts catalog", 1, 1_680, 1_680, 1_680, 7],
  ["Parts catalog", 2, 910.7, 1_520, 1_820, 2],
  ["Parts catalog", 7, 678.9, 1_580, 4_750, 7],
  ["Parts catalog", 3, 409.1, 517.5, 1_230, 75],
  ["Parts catalog", 2, 342.3, 450.4, 684.5, 50],
  ["Parts catalog", 5, 287.4, 383.2, 1_440, 21],
  ["Parts catalog", 17, 274.3, 1_080, 4_660, 904],
  ["Parts catalog", 5, 221.5, 1_040, 1_110, 5_305],
  ["Parts catalog", 1, 202.7, 202.7, 202.7, 10],
  ["Accessories", 4, 175.2, 487.4, 701, 8],
  ["Parts catalog", 6, 170.1, 950.3, 1_020, 9_738],
  ["Accessories", 4, 169.9, 323.5, 679.5, 382],
  ["Parts catalog", 3, 161.5, 300.7, 484.6, 3],
  ["Parts catalog", 2, 129.7, 249.5, 259.5, 394],
  ["Parts catalog", 2, 123.2, 178.2, 246.5, 2],
  ["Parts catalog", 2, 119.5, 223.5, 239, 10],
  ["Accessories", 4, 107.3, 233.9, 429.4, 1_156],
  ["Accessories", 4, 70.2, 144.2, 280.9, 219],
  ["Parts catalog", 3, 62.3, 168.1, 186.9, 30],
  ["Other", 3, 47.2, 89.7, 141.6, 3],
  ["Accessories", 4, 32.5, 55.8, 130, 12],
  ["Settlements", 1, 27.2, 27.2, 27.2, 1],
  ["Other", 1, 24.8, 24.8, 24.8, 1],
  ["Parts catalog", 2, 17.4, 26.7, 34.8, 2],
];

const sharedTimeLeaders: readonly QueryMetrics[] = slowestAverageMetrics.slice(0, 3);

function makeSlowestPeakMetrics(): readonly QueryMetrics[] {
  const modules = [
    ...repeatModule("Parts catalog", 30),
    ...repeatModule("Accessories", 5),
    "Other" as const,
    "Settlements" as const,
  ];
  return [
    ...sharedTimeLeaders,
    ...modules.map<QueryMetrics>((module, index) => {
      const calls = index < 19 ? 27 : 26;
      const totalMs = index === 0 ? 31_050 : 30_000;
      return [module, calls, totalMs / calls, 30_500 - index * 500, totalMs, calls * (index % 5 + 1)];
    }),
  ];
}

function makeHighestTotalMetrics(): readonly QueryMetrics[] {
  const modules = [
    ...repeatModule("Parts catalog", 27),
    ...repeatModule("Accessories", 4),
    ...repeatModule("Other", 2),
    "Logistics" as const,
    "Notifications" as const,
    "People & access" as const,
    "Settlements" as const,
  ];
  return [
    ...sharedTimeLeaders,
    ...modules.map<QueryMetrics>((module, index) => {
      const totalMs = index === 0 ? 32_410 : 30_000;
      return [module, 1_979, totalMs / 1_979, Math.min(totalMs, 4_900 - index * 50), totalMs, 1_979 * (index % 4 + 1)];
    }),
  ];
}

function makeMostFrequentMetrics(): readonly QueryMetrics[] {
  const modules = [
    ...repeatModule("Other", 10),
    ...repeatModule("People & access", 12),
    ...repeatModule("Orders", 6),
    ...repeatModule("Consignment", 3),
    "Parts catalog" as const,
    "Accessories" as const,
    "Logistics" as const,
    "Notifications" as const,
    "Invoices" as const,
  ];
  const middle = modules.map<QueryMetrics>((module, index) => {
    const calls = index < 23 ? 982 : 981;
    const totalMs = index === 0 ? 94.62 : 92.5;
    return [module, calls, totalMs / calls, 1.95 - index * 0.025, totalMs, calls * (index % 6 + 1)];
  });

  return [
    ["Other", 32_428, 0.01, 2.35, 293.3, 32_428],
    ["Other", 20_764, 0.02, 14.1, 371.6, 20_764],
    ["People & access", 9_982, 0.05, 12.4, 469.7, 9_982],
    ...middle,
    ["Other", 22, 4.24, 8.72, 93.28, 22],
  ];
}

export const performanceDatasets: Readonly<Record<PerformanceRanking, readonly PerformanceQueryRecord[]>> = {
  "slowest-average": recordsFromMetrics("slowest-average", slowestAverageMetrics),
  "slowest-peak": recordsFromMetrics("slowest-peak", makeSlowestPeakMetrics()),
  "highest-total": recordsFromMetrics("highest-total", makeHighestTotalMetrics()),
  "most-frequent": recordsFromMetrics("most-frequent", makeMostFrequentMetrics()),
};

export const performanceSourceKpis: Readonly<Record<PerformanceRanking, PerformanceSummary>> = {
  "slowest-average": { calls: 126, totalMs: 1_887_892.9, slowestAverageMs: 94_800, moduleCount: 4 },
  "slowest-peak": { calls: 990, totalMs: 1_888_880, slowestAverageMs: 94_800, moduleCount: 4 },
  "highest-total": { calls: 73_232, totalMs: 1_890_240, slowestAverageMs: 94_800, moduleCount: 7 },
  "most-frequent": { calls: 98_535, totalMs: 4_560, slowestAverageMs: 4.24, moduleCount: 9 },
};

export const performanceModuleDistributions: Readonly<Record<
  PerformanceRanking,
  Readonly<Partial<Record<PerformanceModule, number>>>
>> = {
  "slowest-average": { "Parts catalog": 32, Accessories: 5, Other: 2, Settlements: 1 },
  "slowest-peak": { "Parts catalog": 33, Accessories: 5, Other: 1, Settlements: 1 },
  "highest-total": {
    "Parts catalog": 30,
    Accessories: 4,
    Other: 2,
    Logistics: 1,
    Notifications: 1,
    "People & access": 1,
    Settlements: 1,
  },
  "most-frequent": {
    Other: 13,
    "People & access": 13,
    Orders: 6,
    Consignment: 3,
    "Parts catalog": 1,
    Accessories: 1,
    Logistics: 1,
    Notifications: 1,
    Invoices: 1,
  },
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function filterPerformanceQueries(rows: readonly PerformanceQueryRecord[], query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return rows;
  return rows.filter((row) => normalizeSearch(row.module).includes(normalized)
    || normalizeSearch(row.query).includes(normalized));
}

export function summarizePerformanceQueries(rows: readonly PerformanceQueryRecord[]): PerformanceSummary {
  return {
    calls: rows.reduce((sum, row) => sum + row.calls, 0),
    totalMs: rows.reduce((sum, row) => sum + row.totalMs, 0),
    slowestAverageMs: rows.reduce((slowest, row) => Math.max(slowest, row.meanMs), 0),
    moduleCount: new Set(rows.map((row) => row.module)).size,
  };
}

function countModules(rows: readonly PerformanceQueryRecord[]) {
  return rows.reduce<Partial<Record<PerformanceModule, number>>>((counts, row) => {
    counts[row.module] = (counts[row.module] ?? 0) + 1;
    return counts;
  }, {});
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Admin performance fixture invariant failed: ${message}`);
}

function approximatelyEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.01;
}

export function assertPerformanceDataInvariants() {
  for (const option of performanceRankingOptions) {
    const rows = performanceDatasets[option.id];
    const summary = summarizePerformanceQueries(rows);
    const expected = performanceSourceKpis[option.id];
    const actualModules = countModules(rows);
    const expectedModules = performanceModuleDistributions[option.id];

    assert(rows.length === 40, `${option.label} contains 40 rows`);
    assert(new Set(rows.map((row) => row.id)).size === 40, `${option.label} row ids are unique`);
    assert(summary.calls === expected.calls, `${option.label} calls`);
    assert(approximatelyEqual(summary.totalMs, expected.totalMs), `${option.label} total SQL time`);
    assert(approximatelyEqual(summary.slowestAverageMs, expected.slowestAverageMs), `${option.label} slowest average`);
    assert(summary.moduleCount === expected.moduleCount, `${option.label} module count`);
    for (const [module, count] of Object.entries(expectedModules)) {
      assert(actualModules[module as PerformanceModule] === count, `${option.label} ${module} distribution`);
    }
  }

  const baseline = performanceDatasets["slowest-average"];
  assert(filterPerformanceQueries(baseline, "").length === 40, "empty search");
  assert(filterPerformanceQueries(baseline, "Accessories").length === 5, "Accessories search");
  assert(filterPerformanceQueries(baseline, "catalog_nodes").length === 2, "catalog_nodes search");
  assert(filterPerformanceQueries(baseline, "zzzz-no-result").length === 0, "no-result search");
  assert(PERFORMANCE_EMPTY_COPY === "No query statistics yet.", "no-result copy");
}
