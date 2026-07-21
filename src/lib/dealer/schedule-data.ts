export type DealerScheduleCategory = "PWC" | "ATV" | "SSV";
export type DealerScheduleCategoryFilter = "all" | DealerScheduleCategory;
export type DealerScheduleStatus = "scheduled" | "in_transit";

export type DealerScheduleModel = Readonly<{
  sku: string;
  model: string;
  total: number;
  available: number;
}>;

export type DealerScheduleSlot = Readonly<{
  id: string;
  category: DealerScheduleCategory;
  title: string;
  arrivalDate: string;
  paymentDueDate: string;
  status: DealerScheduleStatus;
  models: readonly DealerScheduleModel[];
}>;

export type DealerScheduleMetrics = Readonly<{
  slots: number;
  totalUnits: number;
  availableUnits: number;
  overduePayments: number;
}>;

export type DealerScheduleMonth = Readonly<{
  key: string;
  label: string;
  slotCount: number;
}>;

export const dealerScheduleAsOfDate = "2026-07-21";

export const dealerScheduleCategoryLabels = {
  PWC: "Sea-Doo",
  ATV: "ATV",
  SSV: "SSV",
} as const satisfies Record<DealerScheduleCategory, string>;

export const dealerScheduleStatusLabels = {
  scheduled: "Заплановано",
  in_transit: "У дорозі",
} as const satisfies Record<DealerScheduleStatus, string>;

export const dealerScheduleSlots = [
  {
    id: "pwc-july-2026",
    category: "PWC",
    title: "Sea-Doo липень 2026 #1",
    arrivalDate: "2026-07-28",
    paymentDueDate: "2026-07-10",
    status: "in_transit",
    models: [
      { sku: "23TB", model: "RXP X 325 - Gulfstream Blue Premium", total: 5, available: 1 },
      { sku: "22TF", model: "RXT X 325 - Ice Metal / Manta Green", total: 2, available: 0 },
    ],
  },
  {
    id: "atv-august-2026",
    category: "ATV",
    title: "Can-Am ATV серпень 2026 #1",
    arrivalDate: "2026-08-12",
    paymentDueDate: "2026-07-30",
    status: "scheduled",
    models: [
      { sku: "25BT", model: "OUTLANDER MAX LTD 1000R", total: 6, available: 2 },
      { sku: "26BC", model: "RENEGADE X XC 110 EFI", total: 4, available: 1 },
    ],
  },
  {
    id: "ssv-september-2026",
    category: "SSV",
    title: "Can-Am SSV вересень 2026 #1",
    arrivalDate: "2026-09-05",
    paymentDueDate: "2026-08-20",
    status: "scheduled",
    models: [
      { sku: "27TC", model: "MAVERICK R X RS WITH SMART-SHOX", total: 4, available: 0 },
      { sku: "28TD", model: "DEFENDER MAX LIMITED HD11", total: 2, available: 1 },
    ],
  },
  {
    id: "pwc-october-2026",
    category: "PWC",
    title: "Sea-Doo жовтень 2026 #1",
    arrivalDate: "2026-10-02",
    paymentDueDate: "2026-09-10",
    status: "scheduled",
    models: [
      { sku: "25TB", model: "GTX PRO 130 (Rental) - White / Neo Mint", total: 3, available: 2 },
      { sku: "26TR", model: "GTX Limited 325 - Teal Metallic", total: 2, available: 1 },
    ],
  },
] as const satisfies readonly DealerScheduleSlot[];

const monthLabels = [
  "січень",
  "лютий",
  "березень",
  "квітень",
  "травень",
  "червень",
  "липень",
  "серпень",
  "вересень",
  "жовтень",
  "листопад",
  "грудень",
] as const;

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function getSlotTotals(slot: DealerScheduleSlot) {
  return slot.models.reduce(
    (totals, model) => ({
      totalUnits: totals.totalUnits + model.total,
      availableUnits: totals.availableUnits + model.available,
    }),
    { totalUnits: 0, availableUnits: 0 },
  );
}

export function getDealerScheduleSlotTotals(slot: DealerScheduleSlot) {
  return getSlotTotals(slot);
}

export function filterDealerScheduleSlots(
  slots: readonly DealerScheduleSlot[],
  category: DealerScheduleCategoryFilter,
  query: string,
) {
  const normalizedQuery = normalizeSearchValue(query);

  return slots.filter((slot) => {
    if (category !== "all" && slot.category !== category) return false;
    if (!normalizedQuery) return true;

    return [
      slot.title,
      slot.category,
      ...slot.models.flatMap((model) => [model.sku, model.model]),
    ].some((value) => normalizeSearchValue(value).includes(normalizedQuery));
  });
}

export function getDealerScheduleMetrics(
  slots: readonly DealerScheduleSlot[],
): DealerScheduleMetrics {
  return slots.reduce<DealerScheduleMetrics>((metrics, slot) => {
    const totals = getSlotTotals(slot);
    return {
      slots: metrics.slots + 1,
      totalUnits: metrics.totalUnits + totals.totalUnits,
      availableUnits: metrics.availableUnits + totals.availableUnits,
      overduePayments:
        metrics.overduePayments
        + (slot.paymentDueDate < dealerScheduleAsOfDate && slot.arrivalDate >= dealerScheduleAsOfDate ? 1 : 0),
    };
  }, { slots: 0, totalUnits: 0, availableUnits: 0, overduePayments: 0 });
}

export function getDealerScheduleTimeframe(
  slots: readonly DealerScheduleSlot[],
): DealerScheduleMonth[] {
  if (!slots.length) return [];

  const sortedKeys = slots.map((slot) => slot.arrivalDate.slice(0, 7)).sort();
  const firstKey = sortedKeys[0];
  const lastKey = sortedKeys[sortedKeys.length - 1];
  if (!firstKey || !lastKey) return [];

  const [firstYear, firstMonth] = firstKey.split("-").map(Number);
  const [lastYear, lastMonth] = lastKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(firstYear, firstMonth - 1, 1));
  const end = new Date(Date.UTC(lastYear, lastMonth - 1, 1));
  const months: DealerScheduleMonth[] = [];

  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const monthIndex = cursor.getUTCMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: monthLabels[monthIndex],
      slotCount: slots.filter((slot) => slot.arrivalDate.startsWith(key)).length,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

export function formatDealerScheduleTimeframe(slots: readonly DealerScheduleSlot[]) {
  const months = getDealerScheduleTimeframe(slots);
  const first = months[0];
  const last = months[months.length - 1];
  if (!first || !last) return "Період не визначено";

  const firstYear = first.key.slice(0, 4);
  const lastYear = last.key.slice(0, 4);
  return firstYear === lastYear
    ? `${first.label} — ${last.label} ${lastYear}`
    : `${first.label} ${firstYear} — ${last.label} ${lastYear}`;
}

export function formatDealerScheduleDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}
