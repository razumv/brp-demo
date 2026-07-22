import {expect, test, type Page} from "@playwright/test";
import {seedAdminSession} from "./support/admin-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

const appearances = [
  {designSystem: "shadcn", colorMode: "light"},
  {designSystem: "shadcn", colorMode: "dark"},
  {designSystem: "astryx", colorMode: "light"},
  {designSystem: "astryx", colorMode: "dark"},
] as const;

async function seedAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.addInitScript((preference) => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify(preference));
  }, {version: 1, designSystem, colorMode});
}

async function switchRenderer(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.evaluate((preference) => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify(preference);
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", {key, newValue, storageArea: window.localStorage}));
  }, {version: 1, designSystem, colorMode});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test.beforeEach(async ({page}) => {
  await seedAdminSession(page);
});

for (const appearance of appearances) {
  test(`${appearance.designSystem} ${appearance.colorMode} renders governance routes without overflow`, async ({page}) => {
    test.setTimeout(90_000);
    await seedAppearance(page, appearance.designSystem, appearance.colorMode);
    for (const width of [390, 768, 1280] as const) {
      await page.setViewportSize({width, height: width < 768 ? 844 : 1000});
      for (const route of ["dealer-access", "permissions", "tasks"] as const) {
        await page.goto(`/admin/${route}`);
        await expect(page.locator(`[data-admin-${route}-renderer="${appearance.designSystem}"]`)).toHaveCount(1);
        await expectNoDocumentOverflow(page);
      }
    }
  });
}

test("dealer company, search, and access filters survive renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/dealer-access");
  await page.getByRole("combobox", {name: "Дилерська компанія"}).selectOption("brp-dnipro-demo");
  await page.getByRole("textbox", {name: "Пошук за командою, профілем або правом"}).fill("Full Access");
  await page.getByRole("combobox", {name: "Стан доступу команди"}).selectOption("with-access");

  await switchRenderer(page, "astryx", "dark");
  await expect(page.locator('[data-admin-dealer-access-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("combobox", {name: "Дилерська компанія"})).toHaveValue("brp-dnipro-demo");
  await expect(page.getByRole("textbox", {name: "Пошук за командою, профілем або правом"})).toHaveValue("Full Access");
  await expect(page.getByRole("combobox", {name: "Стан доступу команди"})).toHaveValue("with-access");
});

test("role and permission filter survive renderer changes and applicability remains intact", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/permissions");
  await page.getByRole("tab", {name: /Дилер/}).click();
  await page.getByRole("combobox", {name: "Стан дозволів"}).selectOption("off");
  await switchRenderer(page, "astryx", "dark");
  await expect(page.locator('[data-admin-permissions-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("combobox", {name: "Стан дозволів"})).toHaveValue("off");
  await expect(page.getByRole("switch").first()).toBeDisabled();
  await expect(page.getByLabel("Не застосовується").first()).toBeVisible();
});

test("task search and catalog sync selection survive renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/tasks");
  await page.getByRole("textbox", {name: "Пошук за завданнями, чергою, синхронізаціями"}).fill("каталог");
  await page.getByRole("combobox", {name: "Бренд"}).selectOption({index: 1});
  const brand = await page.getByRole("combobox", {name: "Бренд"}).inputValue();
  await switchRenderer(page, "astryx", "dark");
  await expect(page.locator('[data-admin-tasks-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук за завданнями, чергою, синхронізаціями"})).toHaveValue("каталог");
  await expect(page.getByRole("combobox", {name: "Бренд"})).toHaveValue(brand);
  await expect(page.getByRole("button", {name: /Запустити/}).first()).toBeDisabled();
});

test("governance pages do not expose implementation-only copy", async ({page}) => {
  await seedAppearance(page, "astryx", "light");
  for (const path of ["/admin/dealer-access", "/admin/permissions", "/admin/tasks"] as const) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/demo|демо|mockup|clone|клон|read-only|source fixture/i);
  }
});
