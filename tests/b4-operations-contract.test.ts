import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import test from "node:test";
import {MODAL_CERTIFICATION_INVENTORY} from "../src/lib/appearance/modal-certification-inventory";

const read = (path: string) => readFileSync(path, "utf8");

test("Ocean receipt/posting commands are not rendered in Astryx container rows", () => {
  const source = read("src/components/admin/astryx-admin-ocean-freight-view.tsx");

  assert.doesNotMatch(
    source,
    /<td><ReceiptAction bill=\{bill\} model=\{model\} \/><\/td>/,
    "A receipt/posting command belongs to a BL group, never a container row.",
  );
});

test("Ocean toolbar does not duplicate BL and container counts", () => {
  for (const path of [
    "src/components/admin/admin-ocean-freight-page.tsx",
    "src/components/admin/astryx-admin-ocean-freight-view.tsx",
  ]) {
    assert.doesNotMatch(
      read(path),
      /(?:visibleBillCount|model\.visibleBillCount)[\s\S]{0,120}(?:visibleCount|model\.visibleCount)[\s\S]{0,80}контейнерів/,
      `${path} must not duplicate BL/container totals in its toolbar.`,
    );
  }
});

test("admin UI never exposes clone or local implementation wording", () => {
  const sharedUi = read("src/components/shared/ui.tsx");
  const currentPipeline = read("src/components/admin/current-admin-order-pipeline-view.tsx");
  const astryxPipeline = read("src/components/admin/astryx-admin-order-pipeline-view.tsx");

  assert.doesNotMatch(sharedUi, /Демо:\s*лише перегляд/i);
  for (const source of [currentPipeline, astryxPipeline]) {
    assert.doesNotMatch(source, /локальне замовлення|обмежені source-докази/i);
  }
});

test("Ocean dialogs describe unavailable business data without implementation evidence copy", () => {
  const oceanSources = [
    "src/components/admin/admin-ocean-detail.tsx",
    "src/components/admin/admin-ocean-freight-page.tsx",
    "src/components/admin/astryx-admin-ocean-freight-view.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(
    oceanSources,
    /source evidence|доказов(?:е|і)\s+(?:покриття|рядки)|домодельован|preview не/i,
  );
});

test("priority workflows do not expose implementation labels or redundant BossWeb submit", () => {
  const prioritySources = [
    "src/components/dealer/features/bossweb-page.tsx",
    "src/components/dealer/features/feature-frame.tsx",
    "src/components/admin/astryx-admin-overview-view.tsx",
    "src/components/admin/admin-consignment-page.tsx",
    "src/components/admin/admin-order-detail.tsx",
    "src/components/admin/astryx-admin-order-detail-view.tsx",
    "src/components/admin/astryx-admin-unit-shipping-view.tsx",
    "src/components/admin/admin-ocean-freight-page.tsx",
    "src/components/admin/astryx-admin-ocean-freight-view.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(prioritySources, /демо|демонстраційн|клон|локальн(?:а|е|ий|і|ому)\s+(?:верс|перегляд|вибірк|замовлен|фільтр|діапазон|довідник)/i);
  assert.doesNotMatch(read("src/components/dealer/features/bossweb-page.tsx"), /BrpButton label="Пошук"/);
});

test("route-specific admin surfaces use theme tokens for neutral switch fills", () => {
  assert.doesNotMatch(read("src/components/admin/admin-users-page.tsx"), /bg-white|dark:bg-\[#f0f6fc\]/);
  assert.doesNotMatch(read("src/components/admin/admin-permission-matrix.module.css"), /background:\s*#fff(?:fff)?/i);
});

test("appearance matrix contains every B4 certification viewport exactly", () => {
  const config = read("playwright.appearance-matrix.config.ts");

  for (const viewport of [
    "width: 390, height: 844",
    "width: 430, height: 932",
    "width: 768, height: 1024",
    "width: 1280, height: 800",
    "width: 1440, height: 900",
    "width: 1920, height: 1080",
  ]) {
    assert.match(config, new RegExp(viewport));
  }
});

test("modal certification inventory records the admin modal families and both renderers", () => {
  const inventoryPath = "src/lib/appearance/modal-certification-inventory.ts";
  assert.equal(existsSync(inventoryPath), true, "A reviewable modal registry is required for B4 certification.");
  const inventory = read(inventoryPath);

  for (const family of ["ocean-bl-detail", "ocean-receipt", "returns-create", "order-preflight", "company-form", "user-edit", "invoice-preview"]) {
    assert.match(inventory, new RegExp(`id: "${family}"`));
  }
  assert.match(inventory, /renderers: \["current", "astryx"\]/);
  assert.equal(MODAL_CERTIFICATION_INVENTORY.length, 7);
  assert.equal(MODAL_CERTIFICATION_INVENTORY.every((entry) => entry.renderers.length === 2), true);
});
