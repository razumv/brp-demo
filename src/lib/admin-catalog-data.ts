export type CatalogPrimaryTab = "vehicles" | "distributor" | "parts";

export type CatalogVehicleCategory = "3WV" | "ATV" | "SSV" | "PWC";

export interface CatalogGlobalMetric {
  readonly id: "total" | "active" | "substituted" | "obsolete";
  readonly label: string;
  readonly value: number;
  readonly tone: "blue" | "green" | "amber" | "red";
}

export interface CatalogVehicleSourceCounts {
  readonly total: number;
  readonly ATV: number;
  readonly SSV: number;
  readonly PWC: number;
  readonly "3WV": number;
}

export interface CatalogVehicleProduct {
  readonly id: string;
  readonly category: CatalogVehicleCategory;
  readonly sku: string;
  readonly name: string;
  readonly nameUa: string;
  readonly color: string;
  readonly colorUa: string;
  readonly engine: string;
  readonly modelYear: number;
  readonly productionYear: number;
  readonly priceUsd: number;
  readonly priceEur: number;
  readonly status: "active";
  readonly evidence: "source-observed";
}

export type DistributorPriceCategory = CatalogVehicleCategory;

export interface DistributorSourceCounts {
  readonly total: number;
  readonly "3WV": number;
  readonly ATV: number;
  readonly PWC: number;
  readonly SSV: number;
}

export interface DistributorPriceRow {
  readonly id: string;
  readonly category: DistributorPriceCategory;
  readonly sku: string;
  readonly family: string;
  readonly trim: string;
  readonly engine: string;
  readonly color: string;
  readonly colorUa: string;
  readonly display: boolean;
  readonly service: boolean;
  readonly homologation: "INT" | "T3b" | "T3b - 60km/h" | "T3a - 40km/h" | "T2b - 60km/h" | "INT - NRMM";
  readonly modelYear: number;
  readonly exWorksEur: number;
  readonly exDcEur: number;
  readonly evidence: "source-observed";
}

export type CatalogPartStatus = "active" | "substituted" | "obsolete";

export interface CatalogPartReplacement {
  readonly activeSku: string;
  readonly priceUsd: number | null;
}

export interface CatalogPartRow {
  readonly id: string;
  readonly fixturePage: 1 | 2;
  readonly sku: string;
  readonly description: string;
  readonly fullType: "SKI Parts" | "Sea-Doo Parts" | "SSV Parts" | "Spyder Parts";
  readonly distributorEur: number | null;
  readonly dealerUsd: number | null;
  readonly retailUsd: number | null;
  readonly moq: number | null;
  readonly quantity: number | null;
  readonly status: CatalogPartStatus;
  readonly replacement: CatalogPartReplacement | null;
  readonly evidence: "source-observed";
}

export interface CatalogHealthMetric {
  readonly id: "broken" | "dead" | "no-results" | "coverage" | "stock";
  readonly value: string;
  readonly label: string;
  readonly tone: "amber" | "neutral";
}

export interface CatalogSourceComposition {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly tone: "blue" | "neutral" | "amber";
}

export interface CatalogPricingDebugResult {
  readonly sku: "415005700";
  readonly description: "HOSE";
  readonly fullType: "SKI Parts";
  readonly source: "pricelist";
  readonly quantity: 0;
  readonly reserved: 0;
  readonly updatedAt: "12.07.2026, 03:09:28";
  readonly distributorEur: 3.5;
  readonly dealerUsd: 10.58;
  readonly retailUsd: 14.81;
  readonly priceCategory: "A - Captive Parts";
  readonly settings: {
    readonly eurUsd: 1.2;
    readonly expensePercent: 0.5;
  };
  readonly calculationSteps: readonly string[];
}

export interface CatalogImportHistoryRow {
  readonly id: string;
  readonly date: string;
  readonly mode: "BW Auto" | "1C";
  readonly skus: number | null;
  readonly newUpdated: string;
  readonly changes: string;
  readonly chains: string;
  readonly durationSeconds: number;
  readonly status: "OK" | "Error";
  readonly evidence: "source-observed";
}

export const catalogGlobalMetrics = [
  { id: "total", label: "Усього запчастин", value: 205_460, tone: "blue" },
  { id: "active", label: "Активні", value: 67_334, tone: "green" },
  { id: "substituted", label: "Замінені", value: 26_760, tone: "amber" },
  { id: "obsolete", label: "Застарілі", value: 54_261, tone: "red" },
] as const satisfies readonly CatalogGlobalMetric[];

export const catalogVehicleSourceCounts: CatalogVehicleSourceCounts = {
  total: 98,
  "3WV": 5,
  ATV: 27,
  SSV: 28,
  PWC: 38,
};

/**
 * A representative source-observed subset of the 98 vehicle products. The
 * complete source totals stay separate so the fixture length is never passed
 * off as the production dataset size.
 */
export const catalogVehicleProducts: readonly CatalogVehicleProduct[] = [
  {
    id: "vehicle-f3tb",
    category: "3WV",
    sku: "F3TB",
    name: "3WV RYKER Rally",
    nameUa: "Трицикл 3WV RYKER Rally",
    color: "Black",
    colorUa: "Чорний",
    engine: "899см3",
    modelYear: 2026,
    productionYear: 2026,
    priceUsd: 2_400,
    priceEur: 2_000,
    status: "active",
    evidence: "source-observed",
  },
  {
    id: "vehicle-1vsc",
    category: "ATV",
    sku: "1VSC",
    name: "ATV OUTLANDER MAX DPS 500",
    nameUa: "Квадроцикл ATV OUTLANDER MAX DPS 500",
    color: "Gray",
    colorUa: "Сірий",
    engine: "650см3",
    modelYear: 2025,
    productionYear: 2025,
    priceUsd: 2_585,
    priceEur: 2_154,
    status: "active",
    evidence: "source-observed",
  },
  {
    id: "vehicle-4rtb",
    category: "ATV",
    sku: "4RTB",
    name: "ATV OUTL MAX DPS 1000R GY",
    nameUa: "Квадроцикл ATV OUTL MAX DPS 1000R GY",
    color: "Gray",
    colorUa: "Сірий",
    engine: "999см3",
    modelYear: 2026,
    productionYear: 2025,
    priceUsd: 3_199,
    priceEur: 2_666,
    status: "active",
    evidence: "source-observed",
  },
  {
    id: "vehicle-9jta",
    category: "SSV",
    sku: "9JTA",
    name: "SSV Maverick Sport MAX DPS T ABS",
    nameUa: "Мотовсюдихід SSV Maverick Sport MAX DPS T ABS",
    color: "Triple Black",
    colorUa: "Чорний",
    engine: "976см3",
    modelYear: 2026,
    productionYear: 2026,
    priceUsd: 4_230,
    priceEur: 3_525,
    status: "active",
    evidence: "source-observed",
  },
];

export const distributorSourceCounts: DistributorSourceCounts = {
  total: 129,
  "3WV": 15,
  ATV: 53,
  PWC: 26,
  SSV: 35,
};

export const distributorPriceRows: readonly DistributorPriceRow[] = [
  {
    id: "distributor-3jtb",
    category: "ATV",
    sku: "3JTB",
    family: "DS",
    trim: "STD",
    engine: "250",
    color: "Can-Am Red & Black",
    colorUa: "Червоний та Чорний",
    display: true,
    service: true,
    homologation: "INT",
    modelYear: 2026,
    exWorksEur: 3_850,
    exDcEur: 4_158,
    evidence: "source-observed",
  },
  {
    id: "distributor-1btc",
    category: "ATV",
    sku: "1BTC",
    family: "Outlander",
    trim: "DPS T ABS",
    engine: "500",
    color: "Granite Grey",
    colorUa: "Сірий",
    display: true,
    service: true,
    homologation: "T3b",
    modelYear: 2026,
    exWorksEur: 6_750,
    exDcEur: 7_290,
    evidence: "source-observed",
  },
  {
    id: "distributor-1htd",
    category: "ATV",
    sku: "1HTD",
    family: "Outlander",
    trim: "PRO STD",
    engine: "HD5",
    color: "Desert Tan",
    colorUa: "Пісочний",
    display: true,
    service: true,
    homologation: "INT - NRMM",
    modelYear: 2026,
    exWorksEur: 6_030,
    exDcEur: 6_512,
    evidence: "source-observed",
  },
];

export const catalogParts: readonly CatalogPartRow[] = [
  {
    id: "part-0104-631",
    fixturePage: 1,
    sku: "0104-631",
    description: "PAD, SHOCK",
    fullType: "SKI Parts",
    distributorEur: 2.74,
    dealerUsd: 8.29,
    retailUsd: 11.61,
    moq: null,
    quantity: null,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-01140800",
    fixturePage: 1,
    sku: "01140800",
    description: "NUT M 10 V.",
    fullType: "SKI Parts",
    distributorEur: null,
    dealerUsd: null,
    retailUsd: null,
    moq: null,
    quantity: null,
    status: "substituted",
    replacement: { activeSku: "33017", priceUsd: 7.86 },
    evidence: "source-observed",
  },
  {
    id: "part-0122364",
    fixturePage: 1,
    sku: "0122364",
    description: "HOSE",
    fullType: "Sea-Doo Parts",
    distributorEur: 13.85,
    dealerUsd: 39.26,
    retailUsd: 54.96,
    moq: null,
    quantity: null,
    status: "obsolete",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-415005700",
    fixturePage: 1,
    sku: "415005700",
    description: "HOSE",
    fullType: "SKI Parts",
    distributorEur: 3.5,
    dealerUsd: 10.58,
    retailUsd: 14.81,
    moq: null,
    quantity: 0,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-0460010",
    fixturePage: 2,
    sku: "0460010",
    description: "SCREW-HEX 10-32 X",
    fullType: "Sea-Doo Parts",
    distributorEur: null,
    dealerUsd: null,
    retailUsd: null,
    moq: null,
    quantity: null,
    status: "substituted",
    replacement: { activeSku: "204100269", priceUsd: 1.25 },
    evidence: "source-observed",
  },
  {
    id: "part-0460011",
    fixturePage: 2,
    sku: "0460011",
    description: "SHIM-0.9 MM",
    fullType: "Sea-Doo Parts",
    distributorEur: 3.6,
    dealerUsd: 10.89,
    retailUsd: 15.25,
    moq: null,
    quantity: null,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-0460012",
    fixturePage: 2,
    sku: "0460012",
    description: "BALL JOINT",
    fullType: "Sea-Doo Parts",
    distributorEur: 13.76,
    dealerUsd: 39.01,
    retailUsd: 54.61,
    moq: null,
    quantity: null,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-0460014",
    fixturePage: 2,
    sku: "0460014",
    description: "NOZZLE/ROD-LINK",
    fullType: "Sea-Doo Parts",
    distributorEur: null,
    dealerUsd: null,
    retailUsd: null,
    moq: null,
    quantity: null,
    status: "substituted",
    replacement: { activeSku: "204120255", priceUsd: 36.77 },
    evidence: "source-observed",
  },
  {
    id: "part-0460018",
    fixturePage: 2,
    sku: "0460018",
    description: "GRATE-WEEDLESS/POR",
    fullType: "Sea-Doo Parts",
    distributorEur: 73,
    dealerUsd: 195.92,
    retailUsd: 254.7,
    moq: null,
    quantity: null,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-0460023",
    fixturePage: 2,
    sku: "0460023",
    description: "PLATE-RIDE ASSY",
    fullType: "Sea-Doo Parts",
    distributorEur: 162.5,
    dealerUsd: 429.98,
    retailUsd: 537.48,
    moq: null,
    quantity: null,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-0460034",
    fixturePage: 2,
    sku: "0460034",
    description: "PIN-SS",
    fullType: "Sea-Doo Parts",
    distributorEur: 15.33,
    dealerUsd: 43.46,
    retailUsd: 60.84,
    moq: null,
    quantity: null,
    status: "active",
    replacement: null,
    evidence: "source-observed",
  },
  {
    id: "part-0460038",
    fixturePage: 2,
    sku: "0460038",
    description: "SPRING",
    fullType: "Sea-Doo Parts",
    distributorEur: null,
    dealerUsd: 31.01,
    retailUsd: 43.41,
    moq: 3,
    quantity: null,
    status: "substituted",
    replacement: { activeSku: "204130208", priceUsd: 29.23 },
    evidence: "source-observed",
  },
];

export const catalogPartsSourceTotal = 176_221;
export const catalogPartsSourcePages = 3_525;

export const catalogHealthMetrics = [
  { id: "broken", value: "1 920", label: "Broken Chains", tone: "amber" },
  { id: "dead", value: "762", label: "Dead Ends", tone: "amber" },
  { id: "no-results", value: "0", label: "No Results (7d)", tone: "neutral" },
  { id: "coverage", value: "69%", label: "Dist Price Coverage", tone: "neutral" },
  { id: "stock", value: "5 554", label: "1C Stock (qty > 0)", tone: "neutral" },
] as const satisfies readonly CatalogHealthMetric[];

export const catalogSourceComposition = [
  { id: "pricelist", label: "pricelist", value: 170_507, tone: "blue" },
  { id: "catalog", label: "catalog", value: 28_971, tone: "neutral" },
  { id: "1c-only", label: "1C only", value: 5_541, tone: "amber" },
  { id: "unknown", label: "unknown", value: 307, tone: "neutral" },
  { id: "1c-legacy", label: "1c_legacy", value: 82, tone: "neutral" },
  { id: "1c-legacy-price", label: "1c_legacy_price", value: 50, tone: "neutral" },
  { id: "art472", label: "art472", value: 2, tone: "neutral" },
] as const satisfies readonly CatalogSourceComposition[];

export const catalogPricingDebugResult: CatalogPricingDebugResult = {
  sku: "415005700",
  description: "HOSE",
  fullType: "SKI Parts",
  source: "pricelist",
  quantity: 0,
  reserved: 0,
  updatedAt: "12.07.2026, 03:09:28",
  distributorEur: 3.5,
  dealerUsd: 10.58,
  retailUsd: 14.81,
  priceCategory: "A - Captive Parts",
  settings: { eurUsd: 1.2, expensePercent: 0.5 },
  calculationSteps: [
    "Step 1: €3.50 × 1.2 = $4.2000 (EUR → USD)",
    "Step 2: $4.2000 × 1.50 = $6.3000 (+ operational expense)",
    "Step 3: Tier [5.00, 10.00) → dealer × 1.6, retail × 1.4",
    "Step 4: $6.3000 × 1.6 × 1.05 = $10.58 ✓ matches DB",
    "Step 5: $10.58 × 1.4 = $14.81 ✓ matches DB",
  ],
};

export const catalogImportHistory: readonly CatalogImportHistoryRow[] = [
  {
    id: "import-2026-07-12",
    date: "12 Jul, 03:06",
    mode: "BW Auto",
    skus: 168_877,
    newUpdated: "+168 877 (142 422 prices)",
    changes: "20↑ · 7↓ · 44→0 · 119 act · 56 sub",
    chains: "24 562 (762 dead)",
    durationSeconds: 304.3,
    status: "OK",
    evidence: "source-observed",
  },
  {
    id: "import-2026-07-05-1323",
    date: "5 Jul, 13:23",
    mode: "BW Auto",
    skus: 168_747,
    newUpdated: "+168 747 (142 332 prices)",
    changes: "92↑ · 10↓ · 48 act · 64 sub",
    chains: "24 525 (762 dead)",
    durationSeconds: 516.6,
    status: "OK",
    evidence: "source-observed",
  },
  {
    id: "import-2026-07-05-0644",
    date: "5 Jul, 06:44",
    mode: "BW Auto",
    skus: null,
    newUpdated: "—",
    changes: "—",
    chains: "—",
    durationSeconds: 23_930.8,
    status: "Error",
    evidence: "source-observed",
  },
  {
    id: "import-2026-07-05-0633",
    date: "5 Jul, 06:33",
    mode: "BW Auto",
    skus: null,
    newUpdated: "—",
    changes: "—",
    chains: "—",
    durationSeconds: 24_572.5,
    status: "Error",
    evidence: "source-observed",
  },
];
