import { expect, test, type Locator, type Page } from "@playwright/test";
import { openAdminRoute } from "./support/admin-session";

const mobileWidths = [390, 767] as const;

async function expectDisplayNone(surface: Locator) {
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveCSS("display", "none");
}

async function expectSurfaceAt(
  page: Page,
  path: string,
  width: 390 | 767 | 768,
  selector: string,
) {
  await openAdminRoute(page, path, width);
  const surface = page.locator(selector);
  if (width < 768) {
    await expectDisplayNone(surface);
    return;
  }
  await expect(surface).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-clone-demo-state-v1", JSON.stringify({
      version: 1,
      session: {
        role: "admin",
        email: "admin.demo@local.invalid",
        displayName: "Razumv Admin",
        company: "Logos",
        remember: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      customers: [],
      equipment: [],
      cart: [],
      orders: [],
      workshopOrders: [],
    }));
  });
});

test("operations summaries disappear only below the 768px boundary", async ({ page }) => {
  for (const width of mobileWidths) {
    await expectSurfaceAt(page, "/admin/order-pipeline", width, '[data-mobile-surface="pipeline-summary"]');
    await expectSurfaceAt(page, "/admin/supplier-orders", width, '[aria-label="Показники замовлень постачальнику"]');
    await expectSurfaceAt(page, "/admin/air-freight", width, '[data-mobile-surface="air-workflow"]');
    await expectSurfaceAt(page, "/admin/air-freight", width, '[aria-label="Показники Air Freight"]');
    await expectSurfaceAt(page, "/admin/ocean-freight", width, '[aria-label="Показники морських перевезень"]');
  }
  await expectSurfaceAt(page, "/admin/order-pipeline", 768, '[data-mobile-surface="pipeline-summary"]');
  await expectSurfaceAt(page, "/admin/supplier-orders", 768, '[aria-label="Показники замовлень постачальнику"]');
  await expectSurfaceAt(page, "/admin/air-freight", 768, '[data-mobile-surface="air-workflow"]');
  await expectSurfaceAt(page, "/admin/air-freight", 768, '[aria-label="Показники Air Freight"]');
  await expectSurfaceAt(page, "/admin/ocean-freight", 768, '[aria-label="Показники морських перевезень"]');
});

test("operations secondary controls stay in one mobile disclosure with state-derived counts", async ({ page }) => {
  await openAdminRoute(page, "/admin/order-pipeline", 390);
  const pipelineFilters = page.getByRole("button", { name: /^Фільтри/ });
  const pipelinePanel = page.locator("[data-mobile-disclosure-panel]");
  const pipelineNotifications = pipelinePanel.getByRole("button", { name: "Сповіщення", includeHidden: true });
  await expect(pipelinePanel).toHaveCount(1);
  await expect(pipelineNotifications).toHaveCount(1);
  await expect(pipelineNotifications).toBeHidden();
  await pipelineFilters.click();
  await pipelineNotifications.click();
  await expect(pipelineFilters).toContainText("1");

  await openAdminRoute(page, "/admin/supplier-orders", 390);
  const supplierFilters = page.getByRole("button", { name: /^Фільтри/ });
  const supplierPanel = page.locator("[data-mobile-disclosure-panel]");
  const supplierSort = supplierPanel.getByRole("combobox", { name: "Сортування замовлень постачальнику", includeHidden: true });
  await expect(supplierPanel).toHaveCount(1);
  await expect(supplierSort).toHaveCount(1);
  await expect(supplierSort).toBeHidden();
  await supplierFilters.click();
  await supplierSort.selectOption("newest");
  await expect(supplierFilters).toContainText("1");

  await openAdminRoute(page, "/admin/air-freight", 390);
  await page.getByRole("combobox", { name: "Розділ Air Freight" }).selectOption("shipments");
  const airFilters = page.getByRole("button", { name: /^Фільтри/ });
  const airPanel = page.locator("[data-mobile-disclosure-panel]");
  const airStatus = airPanel.getByRole("group", { name: "Статус постачання", includeHidden: true });
  await expect(airPanel).toHaveCount(1);
  await expect(airStatus).toHaveCount(1);
  await expect(airStatus).toBeHidden();
  await airFilters.click();
  await airStatus.getByRole("button", { name: "В дорозі" }).click();
  await expect(airFilters).toContainText("1");

  await openAdminRoute(page, "/admin/ocean-freight", 390);
  const oceanFilters = page.getByRole("button", { name: /^Фільтри/ });
  const oceanPanel = page.locator("[data-mobile-disclosure-panel]");
  const oceanStatus = oceanPanel.getByRole("combobox", { name: "Статус морського перевезення", includeHidden: true });
  const oceanGrouping = oceanPanel.getByRole("button", { name: "Групувати за BL", includeHidden: true });
  await expect(oceanPanel).toHaveCount(1);
  await expect(oceanStatus).toHaveCount(1);
  await expect(oceanGrouping).toHaveCount(1);
  await expect(oceanStatus).toBeHidden();
  await expect(oceanGrouping).toBeHidden();
  await oceanFilters.click();
  await oceanStatus.selectOption("arrived");
  await expect(oceanFilters).toContainText("1");
});

test("Unit Shipping exposes its existing filter controls only from the mobile disclosure", async ({ page }) => {
  await openAdminRoute(page, "/admin/unit-shipping", 390);
  const filters = page.getByRole("button", { name: /^Фільтри/ });
  const panel = page.locator("[data-mobile-disclosure-panel]");
  const type = panel.getByRole("combobox", { name: "Тип техніки", includeHidden: true });
  const reset = panel.getByRole("button", { name: "Скинути", includeHidden: true });
  await expect(panel).toHaveCount(1);
  await expect(type).toHaveCount(1);
  await expect(reset).toHaveCount(1);
  await expect(type).toBeHidden();
  await expect(reset).toBeHidden();

  await filters.click();
  await expect(type).toBeVisible();
  await expect(panel.getByRole("combobox", { name: "Період доставки" })).toBeVisible();
  await expect(panel.getByRole("combobox", { name: "Модель" })).toBeVisible();
  await expect(reset).toBeVisible();
  await type.selectOption("Гідроцикли");
  await expect(filters).toContainText("1");

  await page.getByRole("combobox", { name: "Стан відвантаження" }).selectOption("shipped");
  await expect(page.getByLabel("Дата відвантаження з")).toBeVisible();
  await expect(page.getByLabel("Дата відвантаження по")).toBeVisible();

  await page.setViewportSize({ width: 768, height: 1000 });
  await expect(filters).toHaveCount(0);
  await expect(type).toBeVisible();
});
