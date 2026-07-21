import { expect, test } from "@playwright/test";
import {
  dealerUnitShipments,
  filterDealerUnitShipments,
  getDealerUnitCounts,
} from "@/lib/dealer/units-data";
import {
  dealerScheduleSlots,
  filterDealerScheduleSlots,
  getDealerScheduleMetrics,
  getDealerScheduleTimeframe,
} from "@/lib/dealer/schedule-data";
import {
  bossWebReferenceParts,
  findBossWebReferencePart,
  normalizeBossWebQuery,
} from "@/lib/dealer/bossweb-data";
import {
  filterWorkshopOrders,
  getWorkshopColumnCounts,
  groupWorkshopOrders,
  workshopStages,
} from "@/lib/dealer/workshop-data";
import type { DealerCustomer } from "@/lib/dealer/contracts";
import type { WorkshopOrder } from "@/lib/types";

test("unit shipment projection preserves the captured source totals and HAMU semantics", () => {
  expect(getDealerUnitCounts(dealerUnitShipments)).toEqual({
    shipments: 15,
    all: 13,
    incoming: 13,
    stock: 0,
    sold: 0,
    readyToReceive: 0,
    awaitingRegistration: 13,
    accepted: 0,
    owned: 13,
  });

  const hamu = dealerUnitShipments.find((shipment) => shipment.container === "HAMU4124410");
  expect(hamu).toEqual(expect.objectContaining({
    bl: "260101582",
    assignedUnits: 1,
    totalUnits: 4,
    eta: "May 11",
    route: "—",
    status: "in_transit",
    action: "free_stock",
  }));
  expect(hamu?.units).toHaveLength(4);
  expect(hamu?.units[0]).toEqual(expect.objectContaining({
    number: 1,
    model: "RD SPYDER F3 LTD 1330 SE6 RD S",
    sku: "H7TD",
    year: 2026,
    vin: null,
    status: "free_stock",
    action: "none",
  }));

  const ffau = dealerUnitShipments.find((shipment) => shipment.container === "FFAU6292730");
  expect(ffau).toEqual(expect.objectContaining({
    assignedUnits: 2,
    totalUnits: 12,
  }));
  expect(ffau?.units).toHaveLength(2);
});

test("unit shipment filters cover the real query fields and static source actions", () => {
  expect(filterDealerUnitShipments(dealerUnitShipments, {
    tab: "incoming",
    query: "HAMU4124410",
    action: "all",
  })).toHaveLength(1);
  expect(filterDealerUnitShipments(dealerUnitShipments, {
    tab: "incoming",
    query: "262101511",
    action: "all",
  })).toHaveLength(1);
  expect(filterDealerUnitShipments(dealerUnitShipments, {
    tab: "incoming",
    query: "CANYON REDR",
    action: "all",
  })).toHaveLength(1);
  expect(filterDealerUnitShipments(dealerUnitShipments, {
    tab: "incoming",
    query: "H7TD",
    action: "all",
  })).toHaveLength(1);
  expect(filterDealerUnitShipments(dealerUnitShipments, {
    tab: "summary",
    query: "YDV26TR000001",
    action: "all",
  })).toHaveLength(1);

  const awaiting = filterDealerUnitShipments(dealerUnitShipments, {
    tab: "incoming",
    query: "",
    action: "awaiting_registration",
  });
  expect(awaiting).not.toHaveLength(0);
  expect(awaiting.every((shipment) => shipment.action === "awaiting_registration")).toBe(true);
  expect(filterDealerUnitShipments(dealerUnitShipments, {
    tab: "sold",
    query: "",
    action: "all",
  })).toEqual([]);
});

test("schedule selectors derive filtering, dated timeframe, and model totals from slot records", () => {
  expect(filterDealerScheduleSlots(dealerScheduleSlots, "PWC", "")).toHaveLength(2);
  expect(filterDealerScheduleSlots(dealerScheduleSlots, "all", "Manta Green").map((slot) => slot.id)).toEqual([
    "pwc-july-2026",
  ]);
  expect(filterDealerScheduleSlots(dealerScheduleSlots, "all", "26TR").map((slot) => slot.id)).toEqual([
    "pwc-october-2026",
  ]);

  expect(getDealerScheduleMetrics(dealerScheduleSlots, new Date("2026-07-21T12:00:00.000Z"))).toEqual({
    slots: 4,
    totalUnits: 28,
    availableUnits: 8,
    overduePayments: 1,
  });
  expect(getDealerScheduleMetrics(dealerScheduleSlots, new Date("2026-11-01T00:00:00.000Z")).overduePayments).toBe(0);
  expect(getDealerScheduleTimeframe(dealerScheduleSlots).map((month) => month.key)).toEqual([
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
  ]);
});

test("BossWeb reference lookup normalizes known input and leaves unknown input unresolved", () => {
  expect(bossWebReferenceParts.length).toBeGreaterThan(1);
  expect(normalizeBossWebQuery(" 9779 150 ")).toBe("9779150");
  expect(findBossWebReferencePart("9779150")?.description).toBe("COOLANT,EXT LIFE");
  expect(findBossWebReferencePart("unknown")).toBeUndefined();
  expect(findBossWebReferencePart("   ")).toBeUndefined();
});

test("workshop selectors search customer and work fields and apply stage and type filters", () => {
  const orders: WorkshopOrder[] = workshopStages.map((stage, index) => ({
    id: `workshop-${index}`,
    type: index === 1 ? "repair" : "maintenance",
    customerId: "customer-1",
    description: index === 0 ? "Seasonal service" : stage.label,
    mechanic: index === 2 ? "Олексій" : "",
    scheduledAt: "",
    notes: index === 3 ? "Терміново" : "",
    status: stage.id,
  }));
  const customers: DealerCustomer[] = [{
    id: "customer-1",
    name: "Олена Коваль",
    phone: "",
    email: "",
    address: "",
    notes: "",
    createdAt: "2026-07-21T00:00:00.000Z",
    category: "retail",
  }];

  expect(getWorkshopColumnCounts(orders)).toEqual({
    new: 1,
    scheduled: 1,
    in_progress: 1,
    done: 1,
  });
  expect(groupWorkshopOrders(orders).every((group) => group.orders.length === 1)).toBe(true);
  expect(filterWorkshopOrders(orders, customers, { query: "Олена", stages: [], types: [] })).toHaveLength(4);
  expect(filterWorkshopOrders(orders, customers, { query: "Олексій", stages: [], types: [] })).toHaveLength(1);
  expect(filterWorkshopOrders(orders, customers, { query: "Терміново", stages: [], types: [] })).toHaveLength(1);
  expect(filterWorkshopOrders(orders, customers, { query: "Seasonal", stages: [], types: [] })).toHaveLength(1);
  expect(filterWorkshopOrders(orders, customers, { query: "", stages: ["scheduled"], types: ["repair"] }))
    .toEqual([orders[1]]);
});
