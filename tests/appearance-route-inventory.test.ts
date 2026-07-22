import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";
import {
  ADMIN_FEATURES,
  APPEARANCE_ROUTE_INVENTORY,
  DEALER_FEATURES,
  inventoryRowsForSource,
} from "../src/lib/appearance/route-inventory";

async function pageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return entry.name === "page.tsx" ? [path] : [];
  }));
  return nested.flat();
}

test("every App Router page has checked appearance inventory coverage", async () => {
  const appRoot = join(process.cwd(), "src/app");
  const sources = (await pageFiles(appRoot)).map((file) => relative(process.cwd(), file));
  for (const source of sources) {
    assert.ok(inventoryRowsForSource(source).length > 0, `Missing route inventory rows for ${source}`);
  }
  const knownSources = new Set(sources);
  for (const row of APPEARANCE_ROUTE_INVENTORY) {
    assert.ok(knownSources.has(row.source), `Inventory references missing page ${row.source}`);
  }
});

test("inventory paths are unique and every row carries certification metadata", () => {
  const paths = APPEARANCE_ROUTE_INVENTORY.map((row) => row.path);
  assert.equal(new Set(paths).size, paths.length, "Each output URL must have exactly one inventory row");
  for (const row of APPEARANCE_ROUTE_INVENTORY) {
    assert.match(row.path, /^\//);
    assert.ok(row.viewports.includes("mobile") && row.viewports.includes("wide"), `${row.path} lacks target viewports`);
  }
});

test("generated feature routes stay synchronized with route modules", async () => {
  const adminModule = await readFile("src/app/admin/[feature]/page.tsx", "utf8");
  const dealerModule = await readFile("src/app/(dealer)/dealer/[feature]/page.tsx", "utf8");
  assert.match(adminModule, /ADMIN_FEATURES\.map/);
  assert.match(dealerModule, /DEALER_FEATURES\.map/);
  for (const feature of ADMIN_FEATURES) assert.ok(APPEARANCE_ROUTE_INVENTORY.some((row) => row.path === `/admin/${feature}/`));
  for (const feature of DEALER_FEATURES) assert.ok(APPEARANCE_ROUTE_INVENTORY.some((row) => row.path === `/dealer/${feature}/`));
  assert.equal(inventoryRowsForSource("src/app/admin/[feature]/page.tsx").length, ADMIN_FEATURES.length);
  assert.equal(inventoryRowsForSource("src/app/(dealer)/dealer/[feature]/page.tsx").length, DEALER_FEATURES.length);
});

test("generated catalogs, order aliases, and query compatibility outputs are present", () => {
  assert.ok(inventoryRowsForSource("src/app/(dealer)/catalog/[[...slug]]/page.tsx").length >= 10);
  assert.ok(inventoryRowsForSource("src/app/admin/orders/[id]/page.tsx").length >= 2);
  assert.ok(inventoryRowsForSource("src/app/(dealer)/dealer/orders/[id]/page.tsx").length >= 2);
  assert.ok(APPEARANCE_ROUTE_INVENTORY.some((row) => row.kind === "query-compatible" && row.role === "admin"));
  assert.ok(APPEARANCE_ROUTE_INVENTORY.some((row) => row.kind === "query-compatible" && row.role === "dealer"));
});
