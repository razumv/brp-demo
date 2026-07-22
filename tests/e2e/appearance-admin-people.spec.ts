import {expect, test, type Page} from "@playwright/test";
import {seedAdminSession} from "./support/admin-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

const appearances: ReadonlyArray<{designSystem: DesignSystem; colorMode: ColorMode}> = [
  {designSystem: "shadcn", colorMode: "light"},
  {designSystem: "shadcn", colorMode: "dark"},
  {designSystem: "astryx", colorMode: "light"},
  {designSystem: "astryx", colorMode: "dark"},
];

async function seedAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.addInitScript((preference) => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify(preference));
  }, {version: 1, designSystem, colorMode});
}

async function switchRenderer(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.evaluate((preference) => {
    const key = "brp-appearance-v1";
    const value = JSON.stringify(preference);
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", {key, newValue: value, storageArea: window.localStorage}));
  }, {version: 1, designSystem, colorMode});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true);
}

async function openAdminRoute(page: Page, path: string, width: number) {
  await page.setViewportSize({width, height: width < 768 ? 844 : 1000});
  await page.goto(path);
  await expect(page.locator("h1").first()).toBeVisible();
}

for (const appearance of appearances) {
  test(`${appearance.designSystem} ${appearance.colorMode} keeps companies and users compact at all target widths`, async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, appearance.designSystem, appearance.colorMode);

    for (const width of [390, 768, 1280, 1440] as const) {
      await openAdminRoute(page, "/admin/companies", width);
      await expect(page.locator(`[data-admin-companies-renderer="${appearance.designSystem}"]`)).toHaveCount(1);
      await expect(page.getByRole("textbox", {name: "Пошук компаній"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Нова компанія"})).toBeVisible();
      await expectNoDocumentOverflow(page);

      await openAdminRoute(page, "/admin/users", width);
      await expect(page.locator(`[data-admin-users-renderer="${appearance.designSystem}"]`)).toHaveCount(1);
      await expect(page.getByRole("textbox", {name: "Пошук користувачів"})).toBeVisible();
      await expectNoDocumentOverflow(page);
    }
  });
}

for (const route of [
  {
    path: "/admin/companies",
    renderer: "data-admin-companies-renderer",
    view: "data-admin-companies-view",
    searchLabel: "Пошук компаній",
    searchValue: "Запорожье",
    expectedRecord: "BRP Запорожье (Парк-С)",
    expectedDetails: ["Профіль неповний", "Створена Apr 30, 2026"],
    listLabel: "Список компаній",
    expectedCount: 2,
    action: /Редагувати BRP Запорожье/,
  },
  {
    path: "/admin/users",
    renderer: "data-admin-users-renderer",
    view: "data-admin-users-view",
    searchLabel: "Пошук користувачів",
    searchValue: "user02@example.invalid",
    expectedRecord: "user02@example.invalid",
    expectedDetails: ["Logos", "5 months ago"],
    listLabel: "Список користувачів",
    expectedCount: 1,
    action: /Редагувати Користувач 02/,
  },
] as const) {
  test(`Astryx ${route.path} persists its view without changing filtered records or actions`, async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "astryx", "light");
    await openAdminRoute(page, route.path, 1280);

    const root = page.locator(`[${route.renderer}="astryx"]`);
    const search = page.getByRole("textbox", {name: route.searchLabel});
    await search.fill(route.searchValue);
    await expect(page.getByText(route.expectedRecord).first()).toBeVisible();

    const visibleCards = root.locator('[data-record-id]:visible');
    await expect(visibleCards).toHaveCount(route.expectedCount);
    await expect(visibleCards.first()).toContainText(route.expectedRecord);
    for (const detail of route.expectedDetails) await expect(visibleCards.first()).toContainText(detail);
    await expect(page.getByRole("button", {name: route.action}).first()).toBeVisible();

    await page.getByText("Список", {exact: true}).click();
    await expect(root).toHaveAttribute(route.view, "list");
    await expect(search).toHaveValue(route.searchValue);
    const table = root.getByRole("table", {name: route.listLabel});
    await expect(table).toBeVisible();
    const row = table.getByRole("row").filter({hasText: route.expectedRecord}).first();
    await expect(row).toBeVisible();
    for (const detail of route.expectedDetails) await expect(row).toContainText(detail);
    await expect(row.getByRole("button", {name: route.action})).toBeVisible();
    await expect(root.getByRole("region", {name: route.listLabel})).toHaveCount(0);

    await page.reload();
    await expect(root).toHaveAttribute(route.view, "list");
    await expectNoDocumentOverflow(page);

    await page.setViewportSize({width: 390, height: 844});
    await expectNoDocumentOverflow(page);
    await page.getByText("Картки", {exact: true}).click();
    await expect(root).toHaveAttribute(route.view, "cards");
    await expect(page.getByRole("button", {name: route.action}).first()).toBeVisible();
  });
}

test("company search, filters, and create dialog survive renderer switching", async ({page}) => {
  await seedAdminSession(page);
  await seedAppearance(page, "shadcn", "light");
  await openAdminRoute(page, "/admin/companies", 768);

  const search = page.getByRole("textbox", {name: "Пошук компаній"});
  await search.fill("Запорожье");
  await page.getByRole("combobox", {name: "Стан профілю компанії"}).selectOption("incomplete");
  await expect(page.getByText("BRP Запорожье (Парк-С)").first()).toBeVisible();
  await page.getByRole("button", {name: "Нова компанія"}).click();
  await expect(page.getByRole("dialog", {name: "Створити нову компанію"})).toBeVisible();

  await switchRenderer(page, "astryx", "dark");
  await expect(page.locator('[data-admin-companies-renderer="astryx"]')).toHaveCount(1);
  await expect(search).toHaveValue("Запорожье");
  await expect(page.getByText("BRP Запорожье (Парк-С)").first()).toBeVisible();
  await expect(page.getByRole("dialog", {name: "Створити нову компанію"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Створити компанію"})).toBeDisabled();
  await expectNoDocumentOverflow(page);
});

test("user search, tab, edit dialog, and locked action survive renderer switching", async ({page}) => {
  await seedAdminSession(page);
  await seedAppearance(page, "astryx", "light");
  await openAdminRoute(page, "/admin/users", 768);

  const search = page.getByRole("textbox", {name: "Пошук користувачів"});
  await search.fill("user02@example.invalid");
  await expect(page.getByText("user02@example.invalid").first()).toBeVisible();
  await page.getByRole("button", {name: /Редагувати .*02/}).first().click();
  await expect(page.getByRole("dialog", {name: "Редагувати користувача"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Зберегти зміни"})).toBeDisabled();

  await switchRenderer(page, "shadcn", "dark");
  await expect(page.locator('[data-admin-users-renderer="shadcn"]')).toHaveCount(1);
  await expect(search).toHaveValue("user02@example.invalid");
  await expect(page.getByRole("dialog", {name: "Редагувати користувача"})).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("companies and users do not expose implementation-only copy", async ({page}) => {
  await seedAdminSession(page);
  await seedAppearance(page, "astryx", "light");

  for (const path of ["/admin/companies", "/admin/users"] as const) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/demo|демо|mockup|clone|клон|source fixture/i);
  }
});
