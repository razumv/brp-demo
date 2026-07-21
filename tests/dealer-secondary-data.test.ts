import assert from "node:assert/strict";
import test from "node:test";
import {
  filterConsignmentRows,
  filterDocuments,
  filterInventoryRows,
  filterNetworkRows,
  filterPartsReportOrders,
  filterSettlementRows,
  isDateInCurrentMonth,
} from "@/lib/dealer/secondary-data";
import { initialDemoState } from "@/lib/mock-data";

test("secondary data filters are deterministic and preserve one source of truth", () => {
  assert.equal(filterDocuments({ query: "INV-2026-001", type: "all", status: "all" }).length, 1);
  assert.equal(filterDocuments({ query: "", type: "invoice", status: "paid" }).length, 1);
  assert.equal(filterConsignmentRows("stock", { query: "belt", availability: "all" }).length, 1);
  assert.ok(filterConsignmentRows("stock", { query: "", availability: "in-stock" }).every((row) => row.quantity > 0));
  assert.equal(filterSettlementRows({ period: 30, query: "INV-2026-001" }).length, 1);
  assert.ok(filterInventoryRows({ query: "oil", stock: "low" }).every((row) => row.stock > 0 && row.stock <= row.reorderPoint));
  assert.equal(filterNetworkRows("parts", { dealer: "Logos", query: "belt" }).length, 1);

  const report = filterPartsReportOrders(initialDemoState.orders, { period: "all", manager: "all", status: "new" });
  assert.equal(report.length, 1);
  assert.equal(report[0]?.status, initialDemoState.orders[0]?.status);
  assert.equal(filterPartsReportOrders(initialDemoState.orders, { period: "30", manager: "Финансы", status: "all" }).length, 1);
  assert.equal(filterPartsReportOrders(initialDemoState.orders, { period: "90", manager: "missing", status: "all" }).length, 0);
});

test("secondary period filters use the supplied current date instead of a fixed fixture date", () => {
  const julyTwentyFirst = new Date("2026-07-21T23:59:59.999Z");
  const augustTwentieth = new Date("2026-08-20T00:00:00.000Z");

  assert.equal(filterSettlementRows({ period: 30, query: "INV-2026-001" }, julyTwentyFirst).length, 1);
  assert.equal(filterSettlementRows({ period: 30, query: "INV-2026-001" }, augustTwentieth).length, 0);
  assert.equal(isDateInCurrentMonth("2026-07-18T10:15:00.000Z", julyTwentyFirst), true);
  assert.equal(isDateInCurrentMonth("2026-07-18T10:15:00.000Z", augustTwentieth), false);
  assert.equal(
    filterPartsReportOrders(
      initialDemoState.orders,
      { period: "month", manager: "all", status: "all" },
      augustTwentieth,
    ).length,
    0,
  );
});
