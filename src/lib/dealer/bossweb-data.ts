export type BossWebReferencePart = Readonly<{
  number: string;
  reference: string;
  category: string;
  description: string;
  localStock: number;
  dealerPrice: number;
  retailPrice: number;
}>;

export const bossWebReferenceParts = [
  {
    number: "9779150",
    reference: "330",
    category: "ATV",
    description: "COOLANT,EXT LIFE",
    localStock: 240,
    dealerPrice: 13.09,
    retailPrice: 18.33,
  },
  {
    number: "715900785",
    reference: "10b",
    category: "PWC",
    description: "SPARK PLUG NGK LMAR8AI-8",
    localStock: 31,
    dealerPrice: 21.77,
    retailPrice: 30.05,
  },
] as const satisfies readonly BossWebReferencePart[];

export function normalizeBossWebQuery(query: string) {
  return query.trim().replace(/[\s-]+/g, "").toUpperCase();
}

export function findBossWebReferencePart(query: string) {
  const normalizedQuery = normalizeBossWebQuery(query);
  if (!normalizedQuery) return undefined;
  return bossWebReferenceParts.find((part) => part.number === normalizedQuery);
}
