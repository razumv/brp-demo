import { expect, test, type Locator } from "@playwright/test";
import {
  loginAsAdmin,
  openAdminRoute,
  type AdminViewportWidth,
} from "./support/admin-session";

const widths: AdminViewportWidth[] = [390, 767, 768, 1440];

async function recordIds(surface: Locator, itemSelector: string) {
  return surface.locator(itemSelector).evaluateAll((records) => records.map((record) => record.getAttribute("data-record-id")));
}

async function expectInactiveSurface(surface: Locator) {
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveCSS("display", "none");
}

async function expectTouchTarget(control: Locator) {
  await expect(control).toHaveCount(1);
  const box = await control.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
}

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("catalog swaps its desktop table for mobile cards at the exact breakpoint", async ({ page }) => {
  const mobileCards = page.locator('ul[aria-label="Товари каталогу"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця товарів каталогу"]');

  await openAdminRoute(page, "/admin/catalog", 767);
  await expect(mobileCards).toHaveCount(1);
  await expect(mobileCards).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Пошук за SKU або назвою" }).fill("4RTB");
  await expect(mobileCards.getByText("4RTB", { exact: true })).toBeVisible();
  const mobileProductIds = await recordIds(mobileCards, 'li[data-record-id]');
  expect(mobileProductIds).toHaveLength(1);

  await openAdminRoute(page, "/admin/catalog", 768);
  await expectInactiveSurface(mobileCards);
  await expect(desktopTable).toHaveCount(1);
  await expect(desktopTable).toBeVisible();
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toHaveCount(1);
  await page.getByRole("textbox", { name: "Пошук за SKU або назвою" }).fill("4RTB");
  const desktopProductIds = await recordIds(desktopTable, 'tbody > tr[data-record-id]');
  expect(desktopProductIds).toHaveLength(mobileProductIds.length);
  expect(desktopProductIds).toEqual(mobileProductIds);
  expect(desktopProductIds).toEqual(["vehicle-4rtb"]);
});

test("settlements diagnostic is mobile-persisted and desktop-static", async ({ page }) => {
  await openAdminRoute(page, "/admin/settlements", 390);
  const trigger = page.getByRole("button", { name: "Оновлюється" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toHaveAttribute("aria-expanded", "true");

  await openAdminRoute(page, "/admin/settlements", 768);
  await expect(page.getByText("Остання успішна синхронізація:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toBeDisabled();
});

test("mobile toolbar discloses filters without resetting them", async ({ page }) => {
  await openAdminRoute(page, "/admin/unit-shipping", 390);
  await expect(page.getByRole("textbox", { name: "Пошук замовлення або моделі" })).toBeVisible();
  const filters = page.getByRole("button", { name: /^Фільтри/ });
  const typeControl = page.locator('select[aria-label="Тип техніки"]');
  const disclosurePanel = page.locator("[data-mobile-disclosure-panel]");
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await expectTouchTarget(filters);
  await filters.click();
  await expect(disclosurePanel).toHaveCount(1);
  await expect(typeControl).toHaveCount(1);
  await expect(disclosurePanel.locator('select[aria-label="Тип техніки"]')).toHaveCount(1);
  await typeControl.selectOption({ label: "Гідроцикли" });
  await expect(filters).toContainText("1");
  await filters.click();
  await expect(typeControl).toHaveCount(1);
  await expect(disclosurePanel).toHaveCount(1);
  await expect(disclosurePanel).toHaveCSS("display", "none");
  await expect(disclosurePanel.locator('select[aria-label="Тип техніки"]')).toHaveCount(1);
  await expect(page.getByRole("combobox", { name: "Тип техніки" })).toHaveCount(0);
  await expect(page.getByLabel("Тип техніки")).toBeHidden();

  await filters.click();
  await expect(disclosurePanel).toBeVisible();
  await expect(typeControl).toHaveCount(1);
  await expect(typeControl).toBeVisible();
  await expect(typeControl).toHaveValue("Гідроцикли");
  await filters.click();

  await page.setViewportSize({ width: 768, height: 1000 });
  await expect(filters).toHaveCount(0);
  await expect(typeControl).toHaveCount(1);
  await expect(typeControl).toHaveValue("Гідроцикли");
});

test("mobile tab select takes over at the 767px breakpoint", async ({ page }) => {
  await openAdminRoute(page, "/admin/unit-shipping", 767);
  const mobileTabs = page.getByRole("combobox", { name: "Стан відвантаження" });
  await expect(mobileTabs).toBeVisible();
  expect((await mobileTabs.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("tablist", { name: "Стан відвантаження" })).toBeHidden();

  await openAdminRoute(page, "/admin/unit-shipping", 768);
  await expect(mobileTabs).toBeHidden();
  await expect(page.getByRole("tablist", { name: "Стан відвантаження" })).toBeVisible();
});

test("users expose mobile cards and preserve desktop grid", async ({ page }) => {
  const mobileCards = page.locator('ul[aria-label="Активні користувачі"]');
  const desktopGrid = page.locator('[role="grid"][aria-label="Активні користувачі"]');

  await openAdminRoute(page, "/admin/users", 390);
  await expect(mobileCards).toHaveCount(1);
  await expect(mobileCards).toBeVisible();
  await expectInactiveSurface(desktopGrid);
  await expect(page.getByRole("list", { name: "Активні користувачі" })).toHaveCount(1);
  await expect(page.getByRole("grid", { name: "Активні користувачі" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Пошук користувачів" }).fill("demo-account");
  const card = mobileCards.getByRole("listitem").filter({ hasText: "demo-account-03" });
  await expect(card).toContainText("Демо-користувач 03");
  await expect(card.getByRole("button", { name: /Редагувати/ })).toBeVisible();
  const mobileUserIds = await recordIds(mobileCards, 'li[data-record-id]');
  expect(mobileUserIds.length).toBeGreaterThan(1);

  await openAdminRoute(page, "/admin/users", 768);
  await expectInactiveSurface(mobileCards);
  await expect(desktopGrid).toHaveCount(1);
  await expect(desktopGrid).toBeVisible();
  await expect(page.getByRole("list", { name: "Активні користувачі" })).toHaveCount(0);
  await expect(page.getByRole("grid", { name: "Активні користувачі" })).toHaveCount(1);
  await page.getByRole("textbox", { name: "Пошук користувачів" }).fill("demo-account");
  const desktopUserIds = await recordIds(desktopGrid, '[role="row"][data-record-id]');
  expect(desktopUserIds).toHaveLength(mobileUserIds.length);
  expect(desktopUserIds).toEqual(mobileUserIds);
  expect(desktopUserIds).toContain("demo-user-03");
});

test("mobile disclosures and company actions remain touch-sized", async ({ page }) => {
  await openAdminRoute(page, "/admin/order-pipeline", 390);
  await expectTouchTarget(page.getByRole("button", { name: /^Фільтри/ }));

  await openAdminRoute(page, "/admin/unit-shipping", 390);
  await expectTouchTarget(page.locator('select[aria-label="Стан відвантаження"]'));

  await openAdminRoute(page, "/admin/companies", 390);
  await expectTouchTarget(page.getByRole("button", { name: /^Працівники BRP Вышгород/ }));
  await expectTouchTarget(page.getByRole("link", { name: /^Політика доступу BRP Вышгород/ }));
});

test("target routes never create document-level horizontal overflow", async ({ page }) => {
  const routes = [
    "/admin/order-pipeline",
    "/admin/supplier-orders",
    "/admin/air-freight",
    "/admin/ocean-freight",
    "/admin/unit-shipping",
    "/admin/warehouse",
    "/admin/settlements",
    "/admin/invoices",
    "/admin/catalog",
    "/admin/schedule",
    "/admin/companies",
    "/admin/users",
    "/admin/permissions",
  ];
  for (const width of widths) {
    for (const route of routes) {
      await openAdminRoute(page, route, width);
      const scrollRegions = await page.locator('[role="region"]').evaluateAll((regions) => regions
        .filter((region) => region.scrollWidth > region.clientWidth)
        .map((region) => ({ label: region.getAttribute("aria-label"), tabIndex: region.getAttribute("tabindex") })));
      for (const region of scrollRegions) {
        expect(region.label, `${route} horizontal region needs an accessible label`).toBeTruthy();
        expect(region.tabIndex, `${route} horizontal region needs keyboard focus`).toBe("0");
      }
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(fits, `${route} must fit at ${width}px`).toBe(true);
    }
  }

  await openAdminRoute(page, "/admin/catalog", 390);
  await page.getByRole("button", { name: /Import History/ }).click();
  const importHistory = page.locator('[role="region"][aria-label="Історія імпорту"]');
  await expect(importHistory).toHaveCount(1);
  await expect(importHistory).toHaveAttribute("tabindex", "0");
  expect(await importHistory.evaluate((region) => region.scrollWidth > region.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
