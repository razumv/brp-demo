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

test("seeded operational data does not expose demo or agent QA labels", () => {
  const operationalData = [
    "src/lib/admin-dealer-access-data.ts",
    "src/lib/admin-order-data.ts",
    "src/lib/admin-air-freight-data.ts",
    "src/lib/mock-data.ts",
  ].map(read).join("\n");

  assert.doesNotMatch(
    operationalData,
    /Демо[-\s]|демонстраційн|CODEX QA|демонстрационного|тестов(?:ий|ый)\s+заказ/i,
  );
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

test("document and order dialogs use product language instead of implementation evidence labels", () => {
  const dialogSources = [
    "src/components/admin/admin-invoices-page.tsx",
    "src/components/admin/astryx-admin-invoices-view.tsx",
    "src/components/admin/admin-order-detail.tsx",
    "src/components/admin/astryx-admin-order-detail-view.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(
    dialogSources,
    /source[- ](?:summary|preflight|карт)|Failed to build confirm preview|Структура preview|Параметри preview|Репрезентативна source-вибірка/i,
  );
});

test("supplier queue exposes business state rather than source-count copy", () => {
  const queueSources = [
    "src/components/admin/current-admin-order-pipeline-view.tsx",
    "src/components/admin/astryx-admin-order-pipeline-view.tsx",
  ].map(read).join("\n");

  assert.match(queueSources, /Черга замовлень постачальнику/);
  assert.doesNotMatch(queueSources, /Source count|source-доказ|локальне замовлення/i);
});

test("warehouse does not expose secondary shown-of-total notices", () => {
  for (const path of [
    "src/components/admin/admin-warehouse-page.tsx",
    "src/components/admin/astryx-admin-warehouse-view.tsx",
  ]) {
    assert.doesNotMatch(read(path), /Показано\s*\{?[\s\S]{0,80}\sз\s\{?/i);
  }
});

test("approved dealer and admin routes omit decorative result counters", () => {
  const sources = [
    "src/components/dealer/dealer-orders.tsx",
    "src/components/dealer/dealer-customers.tsx",
    "src/components/dealer/features/order-drafts-page.tsx",
    "src/components/dealer/features/units-page.tsx",
    "src/components/dealer/features/workshop-page.tsx",
    "src/components/admin/admin-dealer-access-page.tsx",
    "src/components/admin/astryx-admin-dealer-access-view.tsx",
    "src/components/admin/admin-unit-shipping-page.tsx",
    "src/components/admin/astryx-admin-unit-shipping-view.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(
    sources,
    /resultMeta=|Показано\s*\{?[\s\S]{0,80}\sз\s\{?|Показано\s*\{?[\s\S]{0,40}(?:користувач|прав)/i,
  );
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
