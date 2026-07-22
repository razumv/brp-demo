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

const routes = [
  {path: "/admin/integrations", marker: "admin-integrations"},
  {path: "/admin/integrations/1c", marker: "admin-onec-integrations"},
  {path: "/admin/integrations/1c/unit-mapping", marker: "admin-unit-mapping"},
  {path: "/admin/settlements/mapping", marker: "admin-dealer-mapping"},
  {path: "/admin/integrations/bossweb", marker: "admin-bossweb-integrations"},
  {path: "/admin/settings", marker: "admin-settings"},
] as const;

async function seedAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.addInitScript((preference) => window.localStorage.setItem("brp-appearance-v1", JSON.stringify(preference)), {version: 1, designSystem, colorMode});
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

test.beforeEach(async ({page}) => seedAdminSession(page));

for (const appearance of appearances) {
  test(`${appearance.designSystem} ${appearance.colorMode} renders integrations and settings responsively`, async ({page}) => {
    test.setTimeout(120_000);
    await seedAppearance(page, appearance.designSystem, appearance.colorMode);
    for (const width of [390, 1280] as const) {
      await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
      for (const route of routes) {
        await page.goto(route.path);
        await expect(page.locator(`[data-${route.marker}-renderer="${appearance.designSystem}"]`)).toHaveCount(1);
        await expectNoDocumentOverflow(page);
      }
    }
  });
}

test("integration searches and selected records survive renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/integrations");
  await page.getByPlaceholder("Пошук інтеграцій, 1С, BossWeb...").fill("BossWeb");
  await switchRenderer(page, "astryx", "dark");
  await expect(page.getByRole("textbox", {name: "Пошук інтеграцій"})).toHaveValue("BossWeb");
  await expect(page.getByRole("heading", {name: "BossWeb"})).toBeVisible();

  await page.goto("/admin/settlements/mapping");
  await page.getByRole("textbox", {name: "Пошук дилера"}).fill("Logos");
  await switchRenderer(page, "shadcn", "light");
  await expect(page.getByPlaceholder("Пошук дилера...")).toHaveValue("Logos");
});

test("1C tab and history page survive renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/integrations/1c");
  await page.getByRole("tab", {name: "Історія експорту"}).click();
  await page.getByRole("button", {name: "Далі"}).click();
  await expect(page.getByText(/Показано 21–40/)).toBeVisible();
  await switchRenderer(page, "astryx", "dark");
  await expect(page.getByRole("tabpanel", {name: "Історія експорту"})).toBeVisible();
  await expect(page.getByText(/Показано 21–40/)).toBeVisible();
});

test("mapping filter and BossWeb expansion survive renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/integrations/1c/unit-mapping");
  await page.getByRole("button", {name: /Очікують/}).click();
  await page.getByRole("button", {name: "Розгорнути одиниці 4WTJ"}).click();
  await switchRenderer(page, "astryx", "dark");
  await expect(page.getByRole("button", {name: "Згорнути одиниці 4WTJ"})).toBeVisible();

  await page.goto("/admin/integrations/bossweb");
  await page.getByRole("tab", {name: /Замовлення/}).click();
  await page.getByRole("button", {name: "Розгорнути позиції"}).first().click();
  await switchRenderer(page, "shadcn", "light");
  await expect(page.getByRole("button", {name: "Згорнути позиції"})).toBeVisible();
});

test("settings search survives renderer changes and appearance remains operational", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/settings");
  await page.getByRole("textbox", {name: "Пошук за налаштуваннями"}).fill("оформлення");
  await page.getByRole("radio", {name: /Astryx Neutral/}).click();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator('[data-admin-settings-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук за налаштуваннями"})).toHaveValue("оформлення");
  await page.getByRole("radio", {name: /shadcn\/ui/}).click();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
});

test("integration and settings routes do not expose implementation copy", async ({page}) => {
  await seedAppearance(page, "astryx", "light");
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page.locator("body")).not.toContainText(/mockup|clone|клон|read-only|source fixture|режим демонстрац|демо-/i);
  }
});
