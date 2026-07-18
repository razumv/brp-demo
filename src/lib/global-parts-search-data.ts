export type GlobalPartsSearchStatus =
  | "in-stock"
  | "in-transit"
  | "ordered"
  | "under-order";

export type GlobalPartsSearchFixture = {
  readonly number: string;
  readonly description: string | null;
  readonly dealerPrice: number;
  readonly comparePrice: number | null;
  readonly status: GlobalPartsSearchStatus;
  readonly availabilityLabel?: string;
};

export type GlobalPartsSearchTab = "all" | GlobalPartsSearchStatus;

export const GLOBAL_PARTS_SEARCH_TABS: readonly {
  id: GlobalPartsSearchTab;
  label: string;
  sourceCount: number;
}[] = [
  { id: "all", label: "Усі", sourceCount: 10 },
  { id: "in-stock", label: "В наявності", sourceCount: 1 },
  { id: "in-transit", label: "В дорозі", sourceCount: 0 },
  { id: "ordered", label: "Замовлено", sourceCount: 0 },
  { id: "under-order", label: "Під замовлення", sourceCount: 9 },
];

// The source proves a ten-result set for `507`, but only these seven identities
// are visible. Keep only the observed identities instead of inventing the rest.
export const GLOBAL_PARTS_SEARCH_FIXTURES: readonly GlobalPartsSearchFixture[] = [
  {
    number: "507032473",
    description: "PAD_BRAKE KIT",
    dealerPrice: 51.29,
    comparePrice: 71.81,
    status: "in-stock",
    availabilityLabel: "3 в наявності",
  },
  {
    number: "507020200",
    description: "RELEASE SPRING",
    dealerPrice: 8.04,
    comparePrice: 11.26,
    status: "under-order",
  },
  {
    number: "507021300",
    description: "KEY",
    dealerPrice: 11.64,
    comparePrice: 16.3,
    status: "under-order",
  },
  {
    number: "507021500",
    description: "LEVER",
    dealerPrice: 8.53,
    comparePrice: 11.94,
    status: "under-order",
  },
  {
    number: "507022600",
    description: "WEAR INDICATOR",
    dealerPrice: 6.92,
    comparePrice: 9.69,
    status: "under-order",
  },
  {
    number: "507023600",
    description: "TAB LOCK",
    dealerPrice: 6.92,
    comparePrice: 9.69,
    status: "under-order",
  },
  {
    number: "507029000",
    description: null,
    dealerPrice: 76.4,
    comparePrice: null,
    status: "under-order",
  },
];
