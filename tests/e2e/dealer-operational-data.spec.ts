import { expect, test } from "@playwright/test";
import {
  dealerUnitRecords,
  filterDealerUnitRecords,
  getDealerUnitCounts,
  groupDealerUnitRecords,
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
  getWorkshopColumnCounts,
  groupWorkshopOrders,
  workshopStages,
  workshopTransitionCapability,
} from "@/lib/dealer/workshop-data";
import type { WorkshopOrder } from "@/lib/types";

test("unit selectors derive tabs, counts, shipment rows, and every search field from one collection", () => {
  expect(getDealerUnitCounts(dealerUnitRecords)).toEqual({
    all: 13,
    incoming: 9,
    stock: 3,
    sold: 1,
    readyToReceive: 3,
    awaitingIdentifiers: 6,
    containers: 5,
  });

  expect(filterDealerUnitRecords(dealerUnitRecords, "incoming", "HAMU4124410")).toHaveLength(4);
  expect(filterDealerUnitRecords(dealerUnitRecords, "incoming", "262101511")).toHaveLength(3);
  expect(filterDealerUnitRecords(dealerUnitRecords, "incoming", "CANYON REDR")).toHaveLength(1);
  expect(filterDealerUnitRecords(dealerUnitRecords, "incoming", "27TC")).toHaveLength(1);
  expect(filterDealerUnitRecords(dealerUnitRecords, "summary", "YDV26TR000001")).toHaveLength(1);
  expect(filterDealerUnitRecords(dealerUnitRecords, "summary", "1630ACE-26002")).toHaveLength(1);
  expect(filterDealerUnitRecords(dealerUnitRecords, "sold", "not-present")).toEqual([]);

  const incomingGroups = groupDealerUnitRecords(
    filterDealerUnitRecords(dealerUnitRecords, "incoming", ""),
  );
  expect(incomingGroups).toHaveLength(3);
  expect(incomingGroups.reduce((total, group) => total + group.units.length, 0)).toBe(9);
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

test("workshop selectors group the local collection while every unverified transition remains locked", () => {
  const orders: WorkshopOrder[] = workshopStages.map((stage, index) => ({
    id: `workshop-${index}`,
    type: "maintenance",
    customerId: "customer-1",
    description: stage.label,
    mechanic: "",
    scheduledAt: "",
    notes: "",
    status: stage.id,
  }));

  expect(getWorkshopColumnCounts(orders)).toEqual({
    new: 1,
    scheduled: 1,
    in_progress: 1,
    done: 1,
  });
  expect(groupWorkshopOrders(orders).every((group) => group.orders.length === 1)).toBe(true);
  expect(workshopTransitionCapability.status).toBe("unavailable");
  expect(workshopTransitionCapability.reason).toMatch(/підтверджено лише створення/i);
});
