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

async function expectSquareTouchTarget(control: Locator) {
  await expectTouchTarget(control);
  const box = await control.boundingBox();
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
  await page.getByRole("textbox", { name: "Пошук транспортних засобів" }).fill("4RTB");
  await expect(mobileCards.getByText("4RTB", { exact: true })).toBeVisible();
  const mobileProductIds = await recordIds(mobileCards, 'li[data-record-id]');
  expect(mobileProductIds).toHaveLength(1);

  await openAdminRoute(page, "/admin/catalog", 768);
  await expectInactiveSurface(mobileCards);
  await expect(desktopTable).toHaveCount(1);
  await expect(desktopTable).toBeVisible();
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toHaveCount(1);
  await page.getByRole("textbox", { name: "Пошук транспортних засобів" }).fill("4RTB");
  const desktopProductIds = await recordIds(desktopTable, 'tbody > tr[data-record-id]');
  expect(desktopProductIds).toHaveLength(mobileProductIds.length);
  expect(desktopProductIds).toEqual(mobileProductIds);
  expect(desktopProductIds).toEqual(["vehicle-4rtb"]);
});

test("settlements diagnostic is mobile-persisted and desktop-static", async ({ page }) => {
  const storageKey = "brp-clone-ui-v1:collapsible:admin.settlements.sync-diagnostic";
  await openAdminRoute(page, "/admin/settlements", 390);
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload();
  const trigger = page.getByRole("button", { name: "Оновлюється" });
  const diagnosticPanel = page.locator('[data-collapse-mode="mobile"] [role="region"]');
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expectTouchTarget(trigger);
  await expect(diagnosticPanel).toHaveCSS("display", "none");
  await expect(diagnosticPanel).toHaveAttribute("hidden", "");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBe("1");

  await page.setViewportSize({ width: 768, height: 1000 });
  await expect(page.getByText("Остання успішна синхронізація:")).toBeVisible();
  await expect(page.locator('[data-settlement-status] .status-badge.status-amber')).toHaveText("Оновлюється");
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBe("1");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Оновлюється" })).toHaveAttribute("aria-expanded", "true");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Оновлюється" }).click();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Оновлюється" }).click();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toHaveAttribute("aria-expanded", "true");
});

test("settlements keeps its baseline diagnostic composition while making the refresh action mobile-disclosed", async ({ page }) => {
  const storageKey = "brp-clone-ui-v1:collapsible:admin.settlements.sync-diagnostic";

  await openAdminRoute(page, "/admin/settlements", 390);
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload();
  const mobileDiagnostic = page.locator('[data-component="settlements-diagnostic"]');
  const trigger = page.getByRole("button", { name: "Оновлюється" });
  const refresh = page.getByRole("button", { name: "Оновити з 1С (30 днів)" });
  await expect(mobileDiagnostic).toHaveAttribute("data-effective-open", "false");
  await expect(mobileDiagnostic.locator("[data-settlement-status]")).toBeVisible();
  await expect(refresh).toBeHidden();
  await trigger.click();
  await expect(mobileDiagnostic).toHaveAttribute("data-effective-open", "true");
  await expect(refresh).toBeVisible();

  for (const width of [768, 1440] as const) {
    await page.setViewportSize({ width, height: 1000 });
    const diagnostic = page.locator('[data-component="settlements-diagnostic"]');
    const status = diagnostic.locator("[data-settlement-status]");
    const statusBadge = status.locator(".status-badge.status-amber");
    const action = diagnostic.getByRole("button", { name: "Оновити з 1С (30 днів)" });
    const details = diagnostic.locator("[data-settlement-diagnostic-grid]");
    await expect(diagnostic).toHaveAttribute("data-effective-open", "true");
    await expect(status).toBeVisible();
    await expect(status).toHaveCount(1);
    await expect(statusBadge).toHaveCount(1);
    await expect(statusBadge).toHaveText("Оновлюється");
    await expect(diagnostic.getByText("Стан синхронізації з 1С")).toHaveCount(0);
    await expect(diagnostic.getByRole("button", { name: "Оновлюється" })).toBeDisabled();
    await expect(action).toBeVisible();
    await expect(details).toBeVisible();
    const [statusBox, actionBox, detailsColumns] = await Promise.all([
      status.boundingBox(),
      action.boundingBox(),
      details.evaluate((element) => getComputedStyle(element).gridTemplateColumns),
    ]);
    expect(actionBox?.x ?? 0).toBeGreaterThan(statusBox?.x ?? 0);
    expect(Math.abs((actionBox?.y ?? 0) - (statusBox?.y ?? 0))).toBeLessThanOrEqual(12);
    expect(detailsColumns).not.toBe("none");
    if (width === 1440) expect(detailsColumns.split(" ")).toHaveLength(2);
  }
});

test("admin search, clear, icon, and Schedule pagination controls are touch-sized below 768px", async ({ page }) => {
  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/catalog", width);
    const search = page.getByRole("textbox", { name: "Пошук транспортних засобів" });
    await search.fill("4RTB");
    await expectTouchTarget(search);
    await expectSquareTouchTarget(page.getByRole("button", { name: "Очистити пошук" }));

    await openAdminRoute(page, "/admin/invoices", width);
    await expectSquareTouchTarget(page.getByRole("button", { name: /Переглянути контракт/ }).first());

    await openAdminRoute(page, "/admin/schedule", width);
    await expectSquareTouchTarget(page.getByRole("button", { name: "Попередня сторінка слотів" }));
    await expectSquareTouchTarget(page.getByRole("button", { name: "Наступна сторінка слотів" }));
  }
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

test("Unit Shipping only counts shipped-date filters on the shipped tab", async ({ page }) => {
  await openAdminRoute(page, "/admin/unit-shipping", 390);
  const filters = page.getByRole("button", { name: /^Фільтри/ });
  const tabs = page.getByRole("combobox", { name: "Стан відвантаження" });

  await filters.click();
  await tabs.selectOption("shipped");
  await page.getByLabel("Дата відвантаження з").fill("2026-05-01");
  await page.getByLabel("Дата відвантаження по").fill("2026-05-31");
  await expect(filters).toContainText("2");

  await tabs.selectOption("remaining");
  await expect(filters).not.toContainText("2");
});

test("Unit Shipping pagination is touch-sized below 768px and remains compact on desktop", async ({ page }) => {
  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/unit-shipping", width);
    await expectTouchTarget(page.getByRole("combobox", { name: "Записів на сторінці" }));
    await expectTouchTarget(page.getByRole("button", { name: "Попередня сторінка" }));
    await expectTouchTarget(page.getByRole("button", { name: "Наступна сторінка" }));
  }

  await openAdminRoute(page, "/admin/unit-shipping", 768);
  const desktopControls = [
    { control: page.getByRole("combobox", { name: "Записів на сторінці" }), width: 76 },
    { control: page.getByRole("button", { name: "Попередня сторінка" }), width: 32 },
    { control: page.getByRole("button", { name: "Наступна сторінка" }), width: 32 },
  ];
  for (const { control, width } of desktopControls) {
    expect(await control.boundingBox()).toMatchObject({ height: 32, width });
  }
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

test("users expose status selection on mobile without changing desktop tabs", async ({ page }) => {
  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/users", width);
    const status = page.getByRole("combobox", { name: "Стани користувачів" });
    await expect(status).toBeVisible();
    await expectTouchTarget(status);

    await status.selectOption("pending");
    const pendingPanel = page.locator("#admin-users-pending-panel");
    await expect(pendingPanel).toBeVisible();
    await expect(pendingPanel.getByRole("heading", { name: "Користувачів не знайдено" })).toBeVisible();

    await status.selectOption("deactivated");
    const deactivatedPanel = page.locator("#admin-users-deactivated-panel");
    await expect(deactivatedPanel).toBeVisible();
    await expect(deactivatedPanel.getByRole("heading", { name: "Користувачів не знайдено" })).toBeVisible();
  }

  await openAdminRoute(page, "/admin/users", 768);
  await expect(page.getByRole("combobox", { name: "Стани користувачів" })).toBeHidden();
  await expect(page.getByRole("tablist", { name: "Стани користувачів" })).toBeVisible();
});

test("mobile disclosures and company actions remain touch-sized", async ({ page }) => {
  await openAdminRoute(page, "/admin/order-pipeline", 390);
  await expectTouchTarget(page.getByRole("button", { name: /^Фільтри/ }));

  await openAdminRoute(page, "/admin/unit-shipping", 390);
  await expectTouchTarget(page.getByRole("combobox", { name: "Стан відвантаження" }));

  await openAdminRoute(page, "/admin/companies", 390);
  await expectTouchTarget(page.getByRole("button", { name: /^Працівники BRP Вышгород/ }));
  await expectTouchTarget(page.getByRole("link", { name: /^Політика доступу BRP Вышгород/ }));
});

test("target routes never create document-level horizontal overflow", async ({ page }) => {
  test.setTimeout(90_000);

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
  await page.getByRole("combobox", { name: "Розділ каталогу" }).selectOption("parts");
  await page.getByRole("button", { name: /Import History/ }).click();
  const importHistory = page.locator('[role="region"][aria-label="Історія імпорту"]');
  await expect(importHistory).toHaveCount(1);
  await expect(importHistory).toHaveAttribute("tabindex", "0");
  expect(await importHistory.evaluate((region) => region.scrollWidth > region.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
