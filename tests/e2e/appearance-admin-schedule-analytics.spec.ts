import {expect, test, type Page} from "@playwright/test";
import {seedAdminSession} from "./support/admin-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

async function seedAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.addInitScript(({nextDesignSystem, nextColorMode}) => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    }));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
}

async function publishAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.evaluate(({nextDesignSystem, nextColorMode}) => {
    const key = "brp-appearance-v1";
    const value = JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    });
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      newValue: value,
      storageArea: window.localStorage,
    }));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true);
}

test.beforeEach(async ({page}) => {
  await seedAdminSession(page);
});

for (const appearance of [
  {designSystem: "shadcn", colorMode: "light"},
  {designSystem: "shadcn", colorMode: "dark"},
  {designSystem: "astryx", colorMode: "light"},
  {designSystem: "astryx", colorMode: "dark"},
] as const) {
  test(`${appearance.designSystem} ${appearance.colorMode} renders Schedule and Analytics at 390, 768, and 1280px`, async ({page}) => {
    await seedAppearance(page, appearance.designSystem, appearance.colorMode);

    for (const width of [390, 768, 1280] as const) {
      await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
      await page.goto("/admin/schedule");
      await expect(page.locator(`[data-admin-schedule-renderer="${appearance.designSystem === "astryx" ? "astryx" : "current"}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Графік доставки", level: 1})).toBeVisible();
      await expect(page.getByRole("textbox", {name: "Пошук SKU або моделі"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Хронологія доставок"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Відкрити Excel"})).toBeDisabled();
      await expect(page.getByRole("button", {name: "Синхронізувати"})).toBeDisabled();
      await expectNoDocumentOverflow(page);

      await page.goto("/admin/analytics");
      await expect(page.locator(`[data-admin-analytics-renderer="${appearance.designSystem === "astryx" ? "astryx" : "current"}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Аналитика", level: 1})).toBeVisible();
      await expect(page.getByText("Техника", {exact: true}).first()).toBeVisible();
      await expectNoDocumentOverflow(page);
    }
  });
}

test("Schedule state survives current to Astryx to current renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/schedule");

  await page.getByRole("textbox", {name: "Пошук SKU або моделі"}).fill("23TB");
  await page.getByRole("button", {name: "Хронологія доставок"}).click();
  await expect(page.getByRole("button", {name: "Хронологія доставок"})).toHaveAttribute("aria-expanded", "false");

  await publishAppearance(page, "astryx", "dark");
  await expect(page.locator('[data-admin-schedule-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук SKU або моделі"})).toHaveValue("23TB");
  await expect(page.getByRole("button", {name: "Хронологія доставок"})).toHaveAttribute("aria-expanded", "false");

  await publishAppearance(page, "shadcn", "light");
  await expect(page.locator('[data-admin-schedule-renderer="current"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук SKU або моделі"})).toHaveValue("23TB");
  await expect(page.getByRole("button", {name: "Хронологія доставок"})).toHaveAttribute("aria-expanded", "false");
});

test("Analytics unit controls survive current to Astryx to current renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/analytics");
  await page.getByRole("button", {name: "Техника", exact: true}).click();
  await page.getByRole("textbox", {name: "Поиск по VIN или модели"}).fill("Maverick");

  await publishAppearance(page, "astryx", "dark");
  await expect(page.locator('[data-admin-analytics-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Поиск по VIN или модели"})).toHaveValue("Maverick");

  await publishAppearance(page, "shadcn", "light");
  await expect(page.locator('[data-admin-analytics-renderer="current"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Поиск по VIN или модели"})).toHaveValue("Maverick");
});

test("Schedule and Analytics do not expose implementation-only copy", async ({page}) => {
  await seedAppearance(page, "astryx", "light");
  for (const path of ["/admin/schedule", "/admin/analytics"] as const) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/демо|mockup|read-only клон|локальн(ий|ій) клон|source fixture/i);
  }
});
