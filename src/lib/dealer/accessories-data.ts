import type { Part } from "@/lib/types";

export type AccessoryFamily =
  | "Can-Am Off-Road"
  | "Can-Am On-Road"
  | "Sea-Doo"
  | "Ski-Doo";

export type AccessoryCompatibility =
  | "Outlander"
  | "Defender"
  | "Maverick"
  | "Sea-Doo"
  | "Ski-Doo";

export type AccessoryCategory = "Lighting" | "Luggage & Storage" | "Maintenance";
export type AccessoryModel = "Outlander" | "Defender" | "Maverick" | "GTX" | "Summit";
export type AccessoryTrim = "MAX XT" | "DPS" | "XT" | "GTX Limited" | "X";
export type AccessoryEngine =
  | "Rotax 1000R"
  | "Rotax 700"
  | "Rotax HD10"
  | "Rotax 1630 ACE"
  | "Rotax 850 E-TEC";
export type AccessoryPurpose = "Utility" | "Touring" | "Storage" | "Maintenance";
export type AccessoryStockFilter = "all" | "in-stock" | "under-order";
export type AccessorySort = "featured" | "price-asc" | "price-desc";

export type AccessoryVehicleFitment = Readonly<{
  year: string;
  model: AccessoryModel;
  trim: AccessoryTrim;
  engine: AccessoryEngine;
}>;

export type AccessoryProduct = Readonly<{
  id: string;
  title: string;
  sku: string;
  activeReplacementNumber: string;
  price: number;
  stock: number;
  family: AccessoryFamily;
  category: AccessoryCategory;
  fitments: readonly AccessoryVehicleFitment[];
  years: readonly string[];
  compatibility: readonly AccessoryCompatibility[];
  purposes: readonly AccessoryPurpose[];
  featuredRank: number;
}>;

export type AccessoryFilters = Readonly<{
  family: AccessoryFamily | "all";
  category: AccessoryCategory | "all";
  year: string | "all";
  model: AccessoryModel | "all";
  trim: AccessoryTrim | "all";
  engine: AccessoryEngine | "all";
  compatibility: readonly AccessoryCompatibility[];
  purposes: readonly AccessoryPurpose[];
  query: string;
  stock: AccessoryStockFilter;
  sort: AccessorySort;
}>;

export const ACCESSORY_FAMILY_CARDS = [
  { label: "Can-Am Off-Road", count: 1556, photos: 1431, tone: "orange" },
  { label: "Can-Am On-Road", count: 385, photos: 354, tone: "blue" },
  { label: "Sea-Doo", count: 393, photos: 385, tone: "green" },
] as const;

export const ACCESSORY_FAMILY_OPTIONS: readonly AccessoryFamily[] = [
  "Can-Am Off-Road",
  "Can-Am On-Road",
  "Sea-Doo",
  "Ski-Doo",
];

export const ACCESSORY_CATEGORY_OPTIONS: readonly AccessoryCategory[] = [
  "Lighting",
  "Luggage & Storage",
  "Maintenance",
];

export const ACCESSORY_YEAR_OPTIONS = ["2026", "2025", "2024"] as const;
export const ACCESSORY_COMPATIBILITY_OPTIONS: readonly AccessoryCompatibility[] = [
  "Outlander",
  "Defender",
  "Maverick",
  "Sea-Doo",
  "Ski-Doo",
];
export const ACCESSORY_PURPOSE_OPTIONS: readonly AccessoryPurpose[] = [
  "Utility",
  "Touring",
  "Storage",
  "Maintenance",
];

export const ACCESSORY_PRODUCTS: readonly AccessoryProduct[] = [
  {
    id: "advex",
    title: "Advex Helmet LED Utility Light",
    sku: "929085",
    activeReplacementNumber: "9290850090",
    price: 92.59,
    stock: 1,
    family: "Can-Am Off-Road",
    category: "Lighting",
    fitments: [
      { year: "2026", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
      { year: "2025", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
    ],
    years: ["2026", "2025"],
    compatibility: ["Outlander"],
    purposes: ["Utility", "Touring"],
    featuredRank: 1,
  },
  {
    id: "linq",
    title: "LinQ Adventure Tunnel Bag",
    sku: "860202447",
    activeReplacementNumber: "860202447",
    price: 179.99,
    stock: 8,
    family: "Ski-Doo",
    category: "Luggage & Storage",
    fitments: [
      { year: "2026", model: "Summit", trim: "X", engine: "Rotax 850 E-TEC" },
      { year: "2025", model: "Summit", trim: "X", engine: "Rotax 850 E-TEC" },
      { year: "2024", model: "Summit", trim: "X", engine: "Rotax 850 E-TEC" },
    ],
    years: ["2026", "2025", "2024"],
    compatibility: ["Ski-Doo"],
    purposes: ["Touring", "Storage"],
    featuredRank: 2,
  },
  {
    id: "coolant",
    title: "XPS Extended Life Coolant",
    sku: "9779150",
    activeReplacementNumber: "9779150",
    price: 13.09,
    stock: 240,
    family: "Can-Am Off-Road",
    category: "Maintenance",
    fitments: [
      { year: "2026", model: "Outlander", trim: "DPS", engine: "Rotax 700" },
      { year: "2026", model: "Defender", trim: "XT", engine: "Rotax HD10" },
      { year: "2026", model: "Maverick", trim: "X", engine: "Rotax 1000R" },
      { year: "2025", model: "Outlander", trim: "DPS", engine: "Rotax 700" },
      { year: "2025", model: "Defender", trim: "XT", engine: "Rotax HD10" },
      { year: "2025", model: "Maverick", trim: "X", engine: "Rotax 1000R" },
      { year: "2024", model: "Outlander", trim: "DPS", engine: "Rotax 700" },
      { year: "2024", model: "Defender", trim: "XT", engine: "Rotax HD10" },
      { year: "2024", model: "Maverick", trim: "X", engine: "Rotax 1000R" },
    ],
    years: ["2026", "2025", "2024"],
    compatibility: ["Outlander", "Defender", "Maverick"],
    purposes: ["Maintenance"],
    featuredRank: 3,
  },
  {
    id: "holder",
    title: "LinQ Tool Holder",
    sku: "715007358",
    activeReplacementNumber: "715007358",
    price: 45.65,
    stock: 4,
    family: "Can-Am Off-Road",
    category: "Luggage & Storage",
    fitments: [
      { year: "2026", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
      { year: "2026", model: "Defender", trim: "XT", engine: "Rotax HD10" },
      { year: "2025", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
      { year: "2025", model: "Defender", trim: "XT", engine: "Rotax HD10" },
    ],
    years: ["2026", "2025"],
    compatibility: ["Outlander", "Defender"],
    purposes: ["Utility", "Storage"],
    featuredRank: 4,
  },
  {
    id: "cover",
    title: "Sea-Doo Storage Bin Organizer",
    sku: "295100835",
    activeReplacementNumber: "295100835",
    price: 79.99,
    stock: 2,
    family: "Sea-Doo",
    category: "Luggage & Storage",
    fitments: [
      { year: "2026", model: "GTX", trim: "GTX Limited", engine: "Rotax 1630 ACE" },
      { year: "2025", model: "GTX", trim: "GTX Limited", engine: "Rotax 1630 ACE" },
    ],
    years: ["2026", "2025"],
    compatibility: ["Sea-Doo"],
    purposes: ["Storage"],
    featuredRank: 5,
  },
  {
    id: "rack",
    title: "LinQ Rear Cargo Rack",
    sku: "715001734",
    activeReplacementNumber: "715001734",
    price: 218.5,
    stock: 0,
    family: "Can-Am Off-Road",
    category: "Luggage & Storage",
    fitments: [
      { year: "2026", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
      { year: "2026", model: "Defender", trim: "DPS", engine: "Rotax HD10" },
      { year: "2025", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
      { year: "2025", model: "Defender", trim: "DPS", engine: "Rotax HD10" },
      { year: "2024", model: "Outlander", trim: "MAX XT", engine: "Rotax 1000R" },
      { year: "2024", model: "Defender", trim: "DPS", engine: "Rotax HD10" },
    ],
    years: ["2026", "2025", "2024"],
    compatibility: ["Outlander", "Defender"],
    purposes: ["Utility", "Storage"],
    featuredRank: 6,
  },
];

function includesAny<T>(values: readonly T[], selected: readonly T[]) {
  return selected.length === 0 || selected.some((value) => values.includes(value));
}

function matchesVehicleFilter(
  fitment: AccessoryVehicleFitment,
  filters: AccessoryFilters,
) {
  return (filters.year === "all" || fitment.year === filters.year)
    && (filters.model === "all" || fitment.model === filters.model)
    && (filters.trim === "all" || fitment.trim === filters.trim)
    && (filters.engine === "all" || fitment.engine === filters.engine);
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

export type AccessoryVehicleOptions = Readonly<{
  years: readonly string[];
  models: readonly AccessoryModel[];
  trims: readonly AccessoryTrim[];
  engines: readonly AccessoryEngine[];
}>;

/**
 * Builds the vehicle cascade from the supplied catalog records. Product facets
 * deliberately do not constrain this sequence: category and family are
 * independent filter groups that compose only when products are filtered.
 */
export function accessoryVehicleOptions(
  products: readonly AccessoryProduct[],
  filters: AccessoryFilters,
): AccessoryVehicleOptions {
  const fitments = products.flatMap((product) => product.fitments);
  const withYear = fitments.filter((fitment) => (
    filters.year === "all" || fitment.year === filters.year
  ));
  const withModel = filters.model === "all"
    ? []
    : withYear.filter((fitment) => fitment.model === filters.model);
  const withTrim = filters.trim === "all"
    ? []
    : withModel.filter((fitment) => fitment.trim === filters.trim);

  return {
    years: unique(fitments.map((fitment) => fitment.year)),
    models: unique(withYear.map((fitment) => fitment.model)),
    trims: unique(withModel.map((fitment) => fitment.trim)),
    engines: unique(withTrim.map((fitment) => fitment.engine)),
  };
}

export type AccessoryVehicleFilterUpdate = Readonly<Partial<Pick<
  AccessoryFilters,
  "year" | "model" | "trim" | "engine"
>>>;

/** Clears descendants whenever a vehicle ancestor changes. */
export function updateAccessoryVehicleFilter(
  filters: AccessoryFilters,
  update: AccessoryVehicleFilterUpdate,
): AccessoryFilters {
  const next = { ...filters, ...update };
  if ("year" in update) return { ...next, model: "all", trim: "all", engine: "all" };
  if ("model" in update) return { ...next, trim: "all", engine: "all" };
  if ("trim" in update) return { ...next, engine: "all" };
  return next;
}

export function filterAccessories(
  products: readonly AccessoryProduct[],
  filters: AccessoryFilters,
) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("uk-UA");
  const filtered = products.filter((product) => {
    const searchable = `${product.title} ${product.sku} ${product.activeReplacementNumber} ${product.family}`
      .toLocaleLowerCase("uk-UA");
    const matchesFamily = filters.family === "all" || product.family === filters.family;
    const matchesCategory = filters.category === "all" || product.category === filters.category;
    const matchesVehicle = product.fitments.some((fitment) => matchesVehicleFilter(fitment, filters));
    const matchesCompatibility = includesAny(product.compatibility, filters.compatibility);
    const matchesPurpose = includesAny(product.purposes, filters.purposes);
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesStock = filters.stock === "all"
      || (filters.stock === "in-stock" ? product.stock > 0 : product.stock === 0);
    return matchesFamily
      && matchesCategory
      && matchesVehicle
      && matchesCompatibility
      && matchesPurpose
      && matchesQuery
      && matchesStock;
  });

  return [...filtered].sort((left, right) => {
    if (filters.sort === "price-asc") return left.price - right.price;
    if (filters.sort === "price-desc") return right.price - left.price;
    return left.featuredRank - right.featuredRank;
  });
}

export function getAccessoryProduct(partNumber: string) {
  return ACCESSORY_PRODUCTS.find((product) => product.sku === partNumber);
}

// This source-backed accessory is intentionally cart-only. It must stay out of
// the exported diagram inventory (`parts`) and therefore out of admin tables.
export function getDealerAccessoryCartPart(partNumber: string): Part | undefined {
  const product = partNumber === "929085" ? getAccessoryProduct(partNumber) : undefined;
  if (!product) return undefined;
  return {
    number: product.sku,
    reference: "accessory",
    description: product.title,
    stock: product.stock,
    dealerPrice: product.price,
    retailPrice: product.price,
    supersededBy: product.activeReplacementNumber,
  };
}
