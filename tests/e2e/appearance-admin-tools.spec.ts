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
    const newValue = JSON.stringify({version: 1, designSystem: nextDesignSystem, colorMode: nextColorMode});
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", {key, newValue, storageArea: window.localStorage}));
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
  test(`${appearance.designSystem} ${appearance.colorMode} renders admin reporting tools at 390, 768, and 1280px`, async ({page}) => {
    test.setTimeout(90_000);
    await seedAppearance(page, appearance.designSystem, appearance.colorMode);
    const renderer = appearance.designSystem === "astryx" ? "astryx" : "current";

    for (const width of [390, 768, 1280] as const) {
      await page.setViewportSize({width, height: width === 390 ? 844 : 1000});

      await page.goto("/admin/parts-report");
      await expect(page.locator(`[data-admin-parts-report-renderer="${renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Звіт ЗЧ", level: 1})).toBeVisible();
      await expect(page.getByRole("button", {name: "Оновити"})).toBeDisabled();
      await expectNoDocumentOverflow(page);

      await page.goto("/admin/performance");
      await expect(page.locator(`[data-admin-performance-renderer="${renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "DB Performance", level: 1})).toBeVisible();
      await expect(page.getByRole("textbox", {name: "Search module or query"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Refresh"})).toBeDisabled();
      await expectNoDocumentOverflow(page);

      await page.goto("/admin/bossweb-lookup");
      await expect(page.locator(`[data-admin-bossweb-renderer="${renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Пошук запчастин", level: 1})).toBeVisible();
      await expect(page.getByRole("textbox", {name: "Номер запчастини"})).toBeVisible();
      await expectNoDocumentOverflow(page);
    }
  });
}

test("report filter state survives current to Astryx to current renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/parts-report");
  await page.getByLabel("З дати").fill("2026-06-01");
  await page.getByLabel("По дату").fill("2026-06-30");
  await page.getByRole("combobox", {name: "Менеджер"}).click();
  await page.getByRole("option").nth(1).click();
  await page.getByRole("button", {name: "Застосувати"}).click();

  await publishAppearance(page, "astryx", "dark");
  await expect(page.locator('[data-admin-parts-report-renderer="astryx"]')).toHaveAttribute("data-parts-report-filter-from", "2026-06-01");
  await expect(page.locator('[data-admin-parts-report-renderer="astryx"]')).toHaveAttribute("data-parts-report-filter-to", "2026-06-30");

  await publishAppearance(page, "shadcn", "light");
  await expect(page.getByLabel("З дати")).toHaveValue("2026-06-01");
  await expect(page.getByLabel("По дату")).toHaveValue("2026-06-30");
});

test("performance filters and BossWeb result survive renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/performance");
  await page.getByRole("textbox", {name: "Search module or query"}).fill("catalog");
  await publishAppearance(page, "astryx", "dark");
  await expect(page.getByRole("textbox", {name: "Search module or query"})).toHaveValue("catalog");
  await publishAppearance(page, "shadcn", "light");
  await expect(page.getByRole("textbox", {name: "Search module or query"})).toHaveValue("catalog");

  await page.goto("/admin/bossweb-lookup");
  await page.getByRole("textbox", {name: "Номер запчастини"}).fill("9779150");
  await page.getByRole("button", {name: "Пошук", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Наявність BossWeb"})).toBeVisible();
  await publishAppearance(page, "astryx", "dark");
  await expect(page.getByRole("textbox", {name: "Номер запчастини"})).toHaveValue("9779150");
  await expect(page.getByRole("heading", {name: "Наявність BossWeb"})).toBeVisible();
});

test("admin reporting tools never expose implementation-only copy", async ({page}) => {
  await seedAppearance(page, "astryx", "light");
  for (const path of ["/admin/parts-report", "/admin/performance", "/admin/bossweb-lookup"] as const) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/демо|mockup|read-only клон|локальн(ий|ій) клон|source fixture/i);
  }
});
