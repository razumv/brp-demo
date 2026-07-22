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
    window.dispatchEvent(new StorageEvent("storage", {key, newValue: value, storageArea: window.localStorage}));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))).toBe(true);
}

async function selectInvoiceTab(page: Page, tab: "appendices" | "invoices" | "cost", label: string) {
  const mobileSelect = page.getByRole("combobox", {name: "Розділ документів"});
  if (await mobileSelect.count()) {
    await mobileSelect.selectOption(tab);
    return;
  }
  const tabControl = page.getByRole("tab", {name: label});
  if (await tabControl.count()) {
    await tabControl.click();
    return;
  }
  await page.getByRole("button", {name: label, exact: true}).click();
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
  test(`${appearance.designSystem} ${appearance.colorMode} renders invoice documents at 390, 768, and 1280px`, async ({page}) => {
    await seedAppearance(page, appearance.designSystem, appearance.colorMode);

    for (const width of [390, 768, 1280] as const) {
      await page.setViewportSize({width, height: width === 390 ? 844 : 1000});
      await page.goto("/admin/invoices");
      await expect(page.locator(`[data-admin-invoices-renderer="${appearance.designSystem === "astryx" ? "astryx" : "current"}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Інвойси та документи", level: 1})).toBeVisible();
      await expect(page.getByRole("textbox", {name: "Пошук контрактів"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Новий контракт"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Завантажити проформи"})).toHaveCount(0);

      if (width === 390) {
        await expect(page.locator('section[aria-label="Показники інвойсів"]')).toHaveCSS("display", "none");
      }

      await selectInvoiceTab(page, "appendices", "Додатки");
      await expect(page.getByRole("textbox", {name: "Пошук додатків"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Завантажити проформи"})).toBeDisabled();

      if (width === 390) {
        await expect(page.locator('section[aria-label="Показники додатків"]')).toHaveCSS("display", "none");
      }
      await expectNoDocumentOverflow(page);
    }
  });
}

test("invoice tab and search state survives current to Astryx to current renderer changes", async ({page}) => {
  await seedAppearance(page, "shadcn", "light");
  await page.goto("/admin/invoices");
  await selectInvoiceTab(page, "appendices", "Додатки");
  await page.getByRole("textbox", {name: "Пошук додатків"}).fill("07");

  await publishAppearance(page, "astryx", "dark");
  await expect(page.locator('[data-admin-invoices-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук додатків"})).toHaveValue("07");

  await publishAppearance(page, "shadcn", "light");
  await expect(page.locator('[data-admin-invoices-renderer="current"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук додатків"})).toHaveValue("07");
});

test("invoice renderers retain locked actions and omit implementation-only copy", async ({page}) => {
  for (const designSystem of ["shadcn", "astryx"] as const) {
    await seedAppearance(page, designSystem, "light");
    await page.goto("/admin/invoices");
    await expect(page.getByRole("button", {name: "Новий контракт"})).toBeVisible();
    await selectInvoiceTab(page, "appendices", "Додатки");
    await expect(page.getByRole("button", {name: "Завантажити проформи"})).toBeDisabled();
    await expect(page.locator("body")).not.toContainText(/демо|mockup|clone|local|source fixture|read-only|клон/i);
  }
});
