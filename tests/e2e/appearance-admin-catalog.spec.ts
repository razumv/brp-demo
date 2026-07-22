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
    const value = JSON.stringify({version: 1, designSystem: nextDesignSystem, colorMode: nextColorMode});
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", {key, newValue: value, storageArea: window.localStorage}));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", colorMode);
}

const appearances: readonly {designSystem: DesignSystem; colorMode: ColorMode; renderer: "current" | "astryx"}[] = [
  {designSystem: "shadcn", colorMode: "light", renderer: "current"},
  {designSystem: "shadcn", colorMode: "dark", renderer: "current"},
  {designSystem: "astryx", colorMode: "light", renderer: "astryx"},
  {designSystem: "astryx", colorMode: "dark", renderer: "astryx"},
];

test.describe("admin catalog appearance matrix", () => {
  for (const appearance of appearances) {
    for (const width of [390, 768, 1280] as const) {
      test(`${appearance.designSystem} ${appearance.colorMode} catalog is usable at ${width}px`, async ({page}) => {
        await page.setViewportSize({width, height: 1000});
        await seedAdminSession(page);
        await seedAppearance(page, appearance.designSystem, appearance.colorMode);
        await page.goto("/admin/catalog");

        await expect(page.locator(`[data-admin-catalog-renderer="${appearance.renderer}"]`)).toHaveCount(1);
        await expect(page.getByRole("heading", {name: "Керування каталогом"})).toBeVisible();
        await expect(page.getByRole("textbox", {name: "Пошук транспортних засобів"})).toBeVisible();
        await expect(page.locator("body")).not.toContainText(/демо|mockup|clone|клон|read-only|source fixture|source-observed/i);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      });
    }
  }
});

test("catalog keeps active section, filters, table width, pagination, and debug state across renderers", async ({page}) => {
  await page.setViewportSize({width: 1280, height: 1000});
  await seedAdminSession(page);
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/catalog");

  await page.getByRole("tab", {name: "Ціни дистриб'ютора"}).click();
  await page.getByRole("textbox", {name: "Пошук цін дистриб'ютора"}).fill("3JTB");
  await page.getByRole("tab", {name: "Каталог запчастин"}).click();
  await page.getByRole("button", {name: "Debug Pricing"}).click();
  await page.getByRole("textbox", {name: "SKU для Debug Pricing"}).fill("415005700");
  await page.getByRole("button", {name: "Debug", exact: true}).click();
  await page.getByRole("button", {name: "Next", exact: true}).click();
  await publishAppearance(page, "astryx", "dark");

  await expect(page.locator('[data-admin-catalog-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByText("415005700", {exact: true})).toBeVisible();
  await expect(page.getByText("Page 2 of 3525")).toBeVisible();
  await publishAppearance(page, "shadcn", "light");

  await expect(page.locator('[data-admin-catalog-renderer="current"]')).toHaveCount(1);
  await expect(page.getByRole("button", {name: "Debug Pricing"})).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("415005700", {exact: true})).toBeVisible();
  await expect(page.getByText("Page 2 of 3525")).toBeVisible();
});

test("Astryx catalog keeps its selected category and resized column after a renderer round trip", async ({page}) => {
  await page.setViewportSize({width: 1280, height: 1000});
  await seedAdminSession(page);
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/catalog");
  await publishAppearance(page, "astryx", "light");

  const skuHeader = page.getByRole("columnheader", {name: /SKU/});
  const handle = page.getByRole("separator", {name: "Змінити ширину колонки sku"});
  const initialWidth = (await skuHeader.boundingBox())?.width ?? 0;
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox!.x + 2, handleBox!.y + 8);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 82, handleBox!.y + 8);
  await page.mouse.up();
  const resizedWidth = (await skuHeader.boundingBox())?.width ?? 0;
  expect(resizedWidth).toBeGreaterThan(initialWidth + 40);

  await page.getByRole("radio", {name: "ATV", exact: true}).click();
  await publishAppearance(page, "shadcn", "dark");
  await expect(page.getByRole("group", {name: "Категорії транспортних засобів"}).getByRole("button", {name: "ATV", exact: true})).toHaveAttribute("aria-pressed", "true");
  await publishAppearance(page, "astryx", "light");
  await expect(page.getByRole("radio", {name: "ATV", exact: true})).toBeChecked();
  expect((await skuHeader.boundingBox())?.width ?? 0).toBeGreaterThan(initialWidth + 40);
});
