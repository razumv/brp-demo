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

test("vehicle records switch to an accessible mobile list without changing filtered identities", async ({ page }) => {
  const mobileList = page.locator('ul[aria-label="Товари каталогу"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця товарів каталогу"]');

  await openAdminRoute(page, "/admin/catalog", 767);
  await expect(mobileList).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Пошук транспортних засобів" }).fill("4RTB");
  await expect(mobileList.getByText("4RTB", { exact: true })).toBeVisible();
  await expect(mobileList.getByRole("button", { name: "Меню продукту 4RTB" })).toHaveCSS("min-height", "44px");
  await mobileList.getByRole("button", { name: "Меню продукту 4RTB" }).click();
  await expect(page.getByRole("group", { name: "Дії продукту 4RTB" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Дії продукту 4RTB" })).toHaveCount(0);
  const mobileIds = await recordIds(mobileList);
  expect(mobileIds).toEqual(["vehicle-4rtb"]);
  await expectPageFits(page);

  await openAdminRoute(page, "/admin/catalog", 768);
  await expectInactiveSurface(mobileList);
  await expect(desktopTable).toBeVisible();
  await page.getByRole("textbox", { name: "Пошук транспортних засобів" }).fill("4RTB");
  expect(await recordIds(desktopTable)).toEqual(mobileIds);
});

test("distributor prices switch to an accessible mobile list without changing filtered identities", async ({ page }) => {
  const mobileList = page.locator('ul[aria-label="Ціни дистриб’ютора"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця цін дистриб’ютора"]');

  await openAdminRoute(page, "/admin/catalog", 767);
  await selectCatalogSection(page, "distributor", true);
  await expect(mobileList).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Ціни дистриб’ютора" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Таблиця цін дистриб’ютора" })).toHaveCount(0);
  const mobileIds = await recordIds(mobileList);
  expect(mobileIds.length).toBeGreaterThan(0);
  await expectPageFits(page);

  await openAdminRoute(page, "/admin/catalog", 768);
  await selectCatalogSection(page, "distributor", false);
  await expectInactiveSurface(mobileList);
  await expect(desktopTable).toBeVisible();
  expect(await recordIds(desktopTable)).toEqual(mobileIds);
});

test("parts records switch to an accessible mobile list without changing search or pagination identities", async ({ page }) => {
  const mobileList = page.locator('ul[aria-label="Каталог запчастин"]');
  const desktopTable = page.locator('[role="region"][aria-label="Таблиця каталогу запчастин"]');

  await openAdminRoute(page, "/admin/catalog", 767);
  await selectCatalogSection(page, "parts", true);
  await expect(mobileList).toBeVisible();
  await expectInactiveSurface(desktopTable);
  await expect(page.getByRole("list", { name: "Каталог запчастин" })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Таблиця каталогу запчастин" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Пошук у каталозі запчастин" }).fill("415005700");
  await expect(mobileList.getByText("415005700", { exact: true })).toBeVisible();
  const mobileIds = await recordIds(mobileList);
  expect(mobileIds).toHaveLength(1);
  await expectPageFits(page);

  await openAdminRoute(page, "/admin/catalog", 768);
  await selectCatalogSection(page, "parts", false);
  await expectInactiveSurface(mobileList);
  await expect(desktopTable).toBeVisible();
  await page.getByRole("textbox", { name: "Пошук у каталозі запчастин" }).fill("415005700");
  expect(await recordIds(desktopTable)).toEqual(mobileIds);
});
