import assert from "node:assert/strict";
import test from "node:test";
import {
  filterConsignmentRows,
  filterDocuments,
  filterInventoryRows,
  filterNetworkRows,
  filterPartsReportOrders,
  filterSettlementRows,
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
