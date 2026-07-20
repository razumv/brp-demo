import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsAdmin, openAdminRoute } from "./support/admin-session";

type CatalogSection = "vehicles" | "distributor" | "parts";

async function recordIds(surface: Locator) {
  return surface.locator("li[data-record-id], tbody > tr[data-record-id]")
    .evaluateAll((records) => records.map((record) => record.getAttribute("data-record-id")));
}

async function selectCatalogSection(page: Page, section: CatalogSection, mobile: boolean) {
  if (mobile) {
    await page.getByRole("combobox", { name: "Розділ каталогу" }).selectOption(section);
    return;
  }

  await page.getByRole("tab", { name: section === "vehicles" ? "Каталог" : section === "distributor" ? "Ціни дистриб'ютора" : "Каталог запчастин" }).click();
}

async function expectInactiveSurface(surface: Locator) {
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveCSS("display", "none");
}

async function expectPageFits(page: Page) {
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true);
}

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("catalog hides global and vehicle KPI groups only below the desktop breakpoint", async ({ page }) => {
  const globalKpis = page.locator('[aria-label="Загальні показники каталогу"]');
  const vehicleKpis = page.locator('[aria-label="Показники транспортних засобів"]');

  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/catalog", width);
    await expect(globalKpis).toBeHidden();
    await expect(vehicleKpis).toBeHidden();
    await expectPageFits(page);
  }

  await openAdminRoute(page, "/admin/catalog", 768);
  await expect(globalKpis).toBeVisible();
  await expect(vehicleKpis).toBeVisible();
});

test("vehicle records keep one stateful detailed-filter disclosure and isolated mobile menus", async ({ page }) => {
  const mobileList = page.locator('ul[aria-label="Товари каталогу"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця товарів каталогу"]');

  await openAdminRoute(page, "/admin/catalog", 767);
  await expect(mobileList).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Розділ каталогу" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Розділи каталогу" })).toBeHidden();

  const detailedFilters = page.getByRole("button", { name: /^Детальні фільтри/ });
  await expect(detailedFilters).toHaveCount(1);
  await detailedFilters.click();
  const disclosure = page.locator("#catalog-vehicle-advanced-filters");
  await expect(disclosure).toHaveCount(1);
  await expect(disclosure.locator("#catalog-vehicle-advanced-filters")).toHaveCount(0);
  const tableCategory = page.getByRole("combobox", { name: "Категорія таблиці" });
  await tableCategory.selectOption("ATV");
  await detailedFilters.click();
  await expect(disclosure).toHaveCount(0);
  await detailedFilters.click();
  await expect(tableCategory).toHaveValue("ATV");

  const firstMenu = mobileList.getByRole("button", { name: "Меню продукту 1VSC" });
  const secondMenu = mobileList.getByRole("button", { name: "Меню продукту 4RTB" });
  await expect(firstMenu).toHaveCSS("min-height", "44px");
  await firstMenu.click();
  await expect(page.getByRole("group", { name: "Дії продукту 1VSC" })).toBeVisible();
  expect(await firstMenu.getAttribute("aria-controls")).not.toBe(await secondMenu.getAttribute("aria-controls"));
  await secondMenu.click();
  await expect(page.getByRole("group", { name: "Дії продукту 1VSC" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Дії продукту 4RTB" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Дії продукту 4RTB" })).toHaveCount(0);
  await expect(secondMenu).toBeFocused();
  await page.mouse.click(1, 1);
  await expect(page.getByRole("group", { name: "Дії продукту 1VSC" })).toHaveCount(0);
  await expectPageFits(page);

  await openAdminRoute(page, "/admin/catalog", 768);
  await expectInactiveSurface(mobileList);
  await expect(desktopTable).toBeVisible();
  const desktopMenu = desktopTable.getByRole("button", { name: "Меню продукту 4RTB" });
  await expect(desktopMenu).toHaveClass(/icon-button/);
  await expect(desktopMenu).toHaveClass(/icon-button-small/);
  await desktopMenu.click();
  await expect(page.getByRole("group", { name: "Дії продукту 4RTB" })).toHaveClass(/right-2/);
  await expect(page.getByRole("group", { name: "Дії продукту 4RTB" })).toHaveClass(/top-10/);
});

test("distributor prices switch to an accessible mobile list without actions or identity drift", async ({ page }) => {
  const mobileList = page.locator('ul[aria-label="Ціни дистриб’ютора"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця цін дистриб’ютора"]');

  await openAdminRoute(page, "/admin/catalog", 767);
  await selectCatalogSection(page, "distributor", true);
  await expect(mobileList).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Ціни дистриб’ютора" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Таблиця цін дистриб’ютора" })).toHaveCount(0);
  await expect(mobileList.getByRole("button")).toHaveCount(0);
  const mobileIds = await recordIds(mobileList);
  expect(mobileIds.length).toBeGreaterThan(0);
  await expectPageFits(page);

  await openAdminRoute(page, "/admin/catalog", 768);
  await selectCatalogSection(page, "distributor", false);
  await expectInactiveSurface(mobileList);
  await expect(desktopTable).toBeVisible();
  expect(await recordIds(desktopTable)).toEqual(mobileIds);
});

test("parts cards paginate on mobile and preserve page-two identities on desktop without actions", async ({ page }) => {
  const mobileList = page.locator('ul[aria-label="Каталог запчастин"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця каталогу запчастин"]');

  await openAdminRoute(page, "/admin/catalog", 390);
  await selectCatalogSection(page, "parts", true);
  await expect(mobileList).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Каталог запчастин" })).toHaveCount(1);
  await expect(mobileList.getByRole("button")).toHaveCount(0);
  const firstPageIds = await recordIds(mobileList);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 of 3525")).toBeVisible();
  const mobilePageTwoIds = await recordIds(mobileList);
  expect(mobilePageTwoIds).not.toEqual(firstPageIds);
  await expectPageFits(page);

  await openAdminRoute(page, "/admin/catalog", 768);
  await selectCatalogSection(page, "parts", false);
  await expectInactiveSurface(mobileList);
  await expect(desktopTable).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  expect(await recordIds(desktopTable)).toEqual(mobilePageTwoIds);
});
