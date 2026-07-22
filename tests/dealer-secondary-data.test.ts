import assert from "node:assert/strict";
import test from "node:test";
import {
  dealerSettlementReferenceDate,
  filterConsignmentRows,
  filterDocuments,
  filterInventoryRows,
  filterNetworkRows,
  getNetworkDealers,
  filterSettlementRows,
  isDateInCurrentMonth,
  projectDealerPartsReport,
} from "@/lib/dealer/secondary-data";
import { initialDemoState } from "@/lib/mock-data";

test("secondary data filters are deterministic and preserve one source of truth", () => {
  assert.equal(filterDocuments({ query: "INV-2026-001", type: "all", status: "all" }).length, 1);
  assert.equal(filterDocuments({ query: "", type: "invoice", status: "paid" }).length, 1);
  assert.equal(filterConsignmentRows("stock", { query: "belt", status: "all" }).length, 1);
  assert.deepEqual(
    filterConsignmentRows("stock", { query: "", status: "available" }).map((row) => row.status),
    ["available"],
  );
  assert.deepEqual(
    filterConsignmentRows("stock", { query: "", status: "reserved" }).map((row) => row.status),
    ["reserved"],
  );
  assert.equal(filterSettlementRows({ period: 30, query: "INV-2026-001" }, dealerSettlementReferenceDate).length, 1);
  assert.ok(filterInventoryRows({ query: "oil", stock: "low" }).every((row) => row.stock > 0 && row.stock <= row.reorderPoint));
  assert.equal(filterNetworkRows("parts", { dealer: "Logos", query: "belt" }).length, 1);
  assert.deepEqual(getNetworkDealers("units"), ["BRP Київ", "Logos"]);

  const report = projectDealerPartsReport(initialDemoState.orders, { query: "LOG-01", from: "2026-07-01", to: "2026-07-31" });
  assert.equal(report.length, 1);
  assert.equal(report[0]?.orderCode, "LOG-01");
  assert.equal(report[0]?.total.currency, "USD");
  assert.equal("manager" in (report[0] ?? {}), false);
  assert.equal(projectDealerPartsReport(initialDemoState.orders, { query: "", from: "2026-08-01", to: "" }).length, 0);
});

test("secondary period filters use the supplied current date instead of a fixed fixture date", () => {
  const julyTwentyFirst = new Date("2026-07-21T23:59:59.999Z");
  const augustTwentieth = new Date("2026-08-20T00:00:00.000Z");

  assert.equal(filterSettlementRows({ period: 30, query: "INV-2026-001" }, julyTwentyFirst).length, 1);
  assert.equal(filterSettlementRows({ period: 30, query: "INV-2026-001" }, augustTwentieth).length, 0);
  assert.equal(isDateInCurrentMonth("2026-07-18T10:15:00.000Z", julyTwentyFirst), true);
  assert.equal(isDateInCurrentMonth("2026-07-18T10:15:00.000Z", augustTwentieth), false);
  assert.equal(projectDealerPartsReport(initialDemoState.orders, { query: "", from: "2026-08-01", to: "" }).length, 0);
});
