export const UNIT_SHIPPING_CATEGORIES = [
  "Всі",
  "Снігоходи",
  "Гідроцикли",
  "Родстер",
  "Квадроцикли",
  "Side-by-Side",
] as const;

export type UnitShippingCategory = (typeof UNIT_SHIPPING_CATEGORIES)[number];
export type ConcreteUnitShippingCategory = Exclude<UnitShippingCategory, "Всі">;
export type UnitShippingTab = "remaining" | "shipped";

export type BossWebOrder = {
  number: string;
  segment: string;
  quantity: number;
  deliveryPeriod: string;
  salesProgram: string;
  destination: string;
};

export type BossWebModel = {
  number: string;
  description: string;
  color: string;
  category: ConcreteUnitShippingCategory;
};

export type BossWebVin = {
  serialNumber: string;
  shippedAt: string;
  index: number;
};

export type BossWebShipment = {
  id: string;
  state: UnitShippingTab;
  status: "Pending shipment" | "Load shipped";
  dateOrWeek: string;
  shippedAt: string | null;
  order: BossWebOrder;
  model: BossWebModel;
  vins: readonly BossWebVin[];
};

type ShipmentSeed = {
  state: UnitShippingTab;
  orderNumber: string;
  segment?: string;
  modelNumber: string;
  description: string;
  color: string;
  quantity: number;
  deliveryPeriod: string;
  category: ConcreteUnitShippingCategory;
  shippedAt?: string;
  dateOrWeek?: string;
  salesProgram?: string;
  destination?: string;
  vins?: readonly BossWebVin[];
};

function shipment(seed: ShipmentSeed): BossWebShipment {
  const segment = seed.segment ?? "000010";
  return {
    id: `${seed.state}-${seed.orderNumber}-${segment}`,
    state: seed.state,
    status: seed.state === "shipped" ? "Load shipped" : "Pending shipment",
    dateOrWeek: seed.dateOrWeek ?? "-",
    shippedAt: seed.shippedAt ?? null,
    order: {
      number: seed.orderNumber,
      segment,
      quantity: seed.quantity,
      deliveryPeriod: seed.deliveryPeriod,
      salesProgram: seed.salesProgram ?? "DISTR/ CURRENT SALES PROGRAM",
      destination: seed.destination ?? "ISPORT RP",
    },
    model: {
      number: seed.modelNumber,
      description: seed.description,
      color: seed.color,
      category: seed.category,
    },
    vins: seed.vins ?? [],
  };
}

export function bossWebOrderNumber(record: BossWebShipment) {
  return `${record.order.number}-${record.order.segment}`;
}

export const OBSERVED_UNIT_VINS: readonly BossWebVin[] = [
  { serialNumber: "3JB8TAU43TE001915", shippedAt: "2026/05/27", index: 1 },
  { serialNumber: "3JB8TAU43TE001994", shippedAt: "2026/05/27", index: 2 },
  { serialNumber: "3JB8TAU44TE001907", shippedAt: "2026/05/27", index: 3 },
  { serialNumber: "3JB8TAU44TE001910", shippedAt: "2026/05/27", index: 4 },
  { serialNumber: "3JB8TAU45TE001995", shippedAt: "2026/05/27", index: 5 },
  { serialNumber: "3JB8TAU4XTE001913", shippedAt: "2026/05/27", index: 6 },
];

const remainingObserved: BossWebShipment[] = [
  shipment({ state: "remaining", orderNumber: "1022615153", segment: "000030", modelNumber: "0004VTC00", description: "Outlander MAX XT-P 1000R CE", color: "Mineral Grey & Orange Crush", quantity: 1, deliveryPeriod: "MAY 2026", category: "Квадроцикли" }),
  shipment({ state: "remaining", orderNumber: "1022793561", modelNumber: "0001WTH00", description: "Outlander MAX DPS 700 CE", color: "Granite Gray", quantity: 2, deliveryPeriod: "MAY 2026", category: "Квадроцикли" }),
  shipment({ state: "remaining", orderNumber: "1022793562", modelNumber: "0006CTA00", description: "Commander MAX XT-P 1000R CE", color: "Mineral Gray · Desert Tan", quantity: 2, deliveryPeriod: "MAY 2026", category: "Side-by-Side" }),
  shipment({ state: "remaining", orderNumber: "1022793562", segment: "000020", modelNumber: "0006KTA00", description: "Commander MAX XT 1000R CE", color: "Triple Black", quantity: 2, deliveryPeriod: "MAY 2026", category: "Side-by-Side" }),
  shipment({ state: "remaining", orderNumber: "1022793563", modelNumber: "0001YTD00", description: "Outlander MAX XT 700 CE", color: "Platinum Satin", quantity: 1, deliveryPeriod: "MAY 2026", category: "Квадроцикли" }),
  shipment({ state: "remaining", orderNumber: "1022793563", segment: "000020", modelNumber: "0004LTC00", description: "Commander X mr 1000R CE", color: "Loft Green Satin", quantity: 1, deliveryPeriod: "MAY 2026", category: "Side-by-Side" }),
  shipment({ state: "remaining", orderNumber: "1022793563", segment: "000030", modelNumber: "0004STF00", description: "Outlander MAX XT 850 CE", color: "Fiery Red", quantity: 1, deliveryPeriod: "MAY 2026", category: "Квадроцикли" }),
  shipment({ state: "remaining", orderNumber: "1022793564", modelNumber: "0007GTG00", description: "Maverick R X rc 999T DCT SAS CE", color: "Loft Green Satin", quantity: 4, deliveryPeriod: "MAY 2026", category: "Side-by-Side" }),
];

const modelPool: readonly BossWebModel[] = [
  { number: "0004VTC00", description: "Outlander MAX XT-P 1000R CE", color: "Mineral Grey & Orange Crush", category: "Квадроцикли" },
  { number: "0001WTH00", description: "Outlander MAX DPS 700 CE", color: "Granite Gray", category: "Квадроцикли" },
  { number: "0006CTA00", description: "Commander MAX XT-P 1000R CE", color: "Desert Tan", category: "Side-by-Side" },
  { number: "0007GTC00", description: "Maverick R X rc 999T DCT SAS CE", color: "Loft Green Satin", category: "Side-by-Side" },
  { number: "0003SNA00", description: "Summit X 850 E-TEC", color: "Catalyst Grey", category: "Снігоходи" },
  { number: "0005EXP00", description: "Expedition LE 900 ACE", color: "Black", category: "Снігоходи" },
  { number: "0002GTX00", description: "Sea-Doo GTX Limited 325", color: "White Pearl", category: "Гідроцикли" },
  { number: "0001SPK00", description: "Sea-Doo Spark Trixx", color: "Dazzling Blue", category: "Гідроцикли" },
  { number: "0003SPD00", description: "Can-Am Spyder RT Sea-to-Sky", color: "Vegas White Satin", category: "Родстер" },
  { number: "0002RYK00", description: "Can-Am Ryker Rally 900 ACE", color: "Heritage White", category: "Родстер" },
];

const remainingGenerated = Array.from({ length: 26 }, (_, index) => {
  const model = modelPool[index % modelPool.length];
  return shipment({
    state: "remaining",
    orderNumber: String(1022793600 + index),
    segment: String((index % 4 + 1) * 10).padStart(6, "0"),
    modelNumber: model.number,
    description: model.description,
    color: model.color,
    quantity: index % 4 + 1,
    deliveryPeriod: index % 3 === 0 ? "JUN 2026" : "MAY 2026",
    category: model.category,
  });
});

export const REMAINING_UNIT_SHIPMENTS: readonly BossWebShipment[] = [
  ...remainingObserved,
  ...remainingGenerated,
];

const shippedObserved: BossWebShipment[] = [
  shipment({ state: "shipped", orderNumber: "1022793566", modelNumber: "0007GTD00", description: "Maverick R X rc 999T DCT SAS INT", color: "Loft Green Satin", quantity: 6, deliveryPeriod: "MAY 2026", category: "Side-by-Side", shippedAt: "2026-05-27", vins: OBSERVED_UNIT_VINS }),
  shipment({ state: "shipped", orderNumber: "1022793569", modelNumber: "0007GTD00", description: "Maverick R X rc 999T DCT SAS INT", color: "Dusty Navy", quantity: 3, deliveryPeriod: "MAY 2026", category: "Side-by-Side", shippedAt: "2026-05-27" }),
  shipment({ state: "shipped", orderNumber: "1022793569", segment: "000020", modelNumber: "0007GTD00", description: "Maverick R X rc 999T DCT SAS INT", color: "Loft Green Satin", quantity: 3, deliveryPeriod: "MAY 2026", category: "Side-by-Side", shippedAt: "2026-05-27" }),
  shipment({ state: "shipped", orderNumber: "1022758274", modelNumber: "0007GTD00", description: "Maverick R X rc 999T DCT SAS INT", color: "Loft Green Satin", quantity: 2, deliveryPeriod: "APR 2026", category: "Side-by-Side", shippedAt: "2026-05-06" }),
  shipment({ state: "shipped", orderNumber: "1022758276", modelNumber: "0007GTD00", description: "Maverick R X rc 999T DCT SAS INT", color: "Dusty Navy", quantity: 1, deliveryPeriod: "APR 2026", category: "Side-by-Side", shippedAt: "2026-05-06" }),
  shipment({ state: "shipped", orderNumber: "1022758281", modelNumber: "0004VTP00", description: "Outlander MAX XT-P 1000R CE", color: "Mineral Grey & Orange Crush", quantity: 8, deliveryPeriod: "APR 2026", category: "Квадроцикли", shippedAt: "2026-05-12" }),
  shipment({ state: "shipped", orderNumber: "1022758283", modelNumber: "0001WTH00", description: "Outlander MAX DPS 700 CE", color: "Granite Gray", quantity: 2, deliveryPeriod: "APR 2026", category: "Квадроцикли", shippedAt: "2026-05-07" }),
  shipment({ state: "shipped", orderNumber: "1022758283", segment: "000020", modelNumber: "0004STF00", description: "Outlander MAX XT 850 CE", color: "Fiery Red", quantity: 4, deliveryPeriod: "APR 2026", category: "Квадроцикли", shippedAt: "2026-05-07" }),
  shipment({ state: "shipped", orderNumber: "1022758283", segment: "000030", modelNumber: "0004VTC00", description: "Outlander MAX XT-P 1000R CE", color: "Mineral Grey & Orange Crush", quantity: 2, deliveryPeriod: "APR 2026", category: "Квадроцикли", shippedAt: "2026-05-07" }),
  shipment({ state: "shipped", orderNumber: "1022758274", segment: "000020", modelNumber: "0007JTC00", description: "Maverick R MAX X rc 999T DCT SAS CE", color: "Loft Green Satin", quantity: 2, deliveryPeriod: "APR 2026", category: "Side-by-Side", shippedAt: "2026-05-06" }),
];

const historicalShippedDates = [
  "2026-04-29",
  "2026-04-16",
  "2026-03-27",
  "2026-03-12",
  "2026-02-20",
  "2026-02-05",
  "2026-01-23",
  "2026-01-08",
  "2025-12-19",
  "2025-12-04",
  "2025-11-21",
  "2025-11-06",
  "2025-10-24",
] as const;

const shippedGenerated = Array.from({ length: 74 }, (_, index) => {
  const model = modelPool[index % modelPool.length];
  const deliveryPeriods = ["APR 2026", "MAR 2026", "FEB 2026", "JAN 2026", "DEC 2025"] as const;
  return shipment({
    state: "shipped",
    orderNumber: String(1022800000 + index),
    segment: String((index % 5 + 1) * 10).padStart(6, "0"),
    modelNumber: model.number,
    description: model.description,
    color: model.color,
    quantity: index % 6 + 1,
    deliveryPeriod: deliveryPeriods[index % deliveryPeriods.length],
    category: model.category,
    shippedAt: historicalShippedDates[index % historicalShippedDates.length],
  });
});

export const SHIPPED_UNIT_SHIPMENTS: readonly BossWebShipment[] = [
  ...shippedObserved,
  ...shippedGenerated,
];
