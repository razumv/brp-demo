export type BossWebAvailabilityFixture = {
  readonly currencyLabel: string;
  readonly cacheAge: string;
  readonly status: "Бекордер";
  readonly family: "ATV";
  readonly partNumber: string;
  readonly description: string;
  readonly warning: string;
  readonly inStock: number;
  readonly backorder: number;
  readonly netUsd: number;
};

export type LocalCatalogFixture = {
  readonly currencyLabel: string;
  readonly inStock: number;
  readonly status: number;
  readonly dealerPriceUsd: number;
  readonly retailPriceUsd: number;
  readonly distributorPriceEur: number;
};

export type AdminBossWebLookupFixture = {
  readonly query: string;
  readonly bossWeb: BossWebAvailabilityFixture;
  readonly localCatalog: LocalCatalogFixture;
};

export type AdminBossWebLookupResolution =
  | { readonly state: "empty"; readonly query: ""; readonly fixture: null }
  | { readonly state: "found"; readonly query: string; readonly fixture: AdminBossWebLookupFixture }
  | { readonly state: "not-found"; readonly query: string; readonly fixture: null };

export const adminBossWebLookupFixtures = {
  "9779150": {
    query: "9779150",
    bossWeb: {
      currencyLabel: "BossWeb USD",
      cacheAge: "кеш 14h ago",
      status: "Бекордер",
      family: "ATV",
      partNumber: "9779150",
      description: "COOLANT,EXT LIFE",
      warning: "Contact PAA Support Quantity : 12",
      inStock: 0,
      backorder: 12,
      netUsd: 4.33,
    },
    localCatalog: {
      currencyLabel: "Локально EUR → USD",
      inStock: 240,
      status: 1,
      dealerPriceUsd: 13.09,
      retailPriceUsd: 18.33,
      distributorPriceEur: 4.33,
    },
  },
} as const satisfies Readonly<Record<string, AdminBossWebLookupFixture>>;

export function normalizeBossWebPartQuery(value: string | null | undefined) {
  return value?.trim().toLocaleUpperCase("en-US") ?? "";
}

export function resolveAdminBossWebLookup(value: string | null | undefined): AdminBossWebLookupResolution {
  const query = normalizeBossWebPartQuery(value);
  if (!query) return { state: "empty", query: "", fixture: null };

  const fixture = (adminBossWebLookupFixtures as Readonly<Record<string, AdminBossWebLookupFixture>>)[query];
  return fixture
    ? { state: "found", query, fixture }
    : { state: "not-found", query, fixture: null };
}
