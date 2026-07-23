import {expect, test, type Locator, type Page} from "@playwright/test";
import {openAdminRoute, seedAdminSession} from "./support/admin-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

const appearanceModes: ReadonlyArray<{designSystem: DesignSystem; colorMode: ColorMode}> = [
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

async function expectRenderer(page: Page, designSystem: DesignSystem) {
  const renderer = page.locator(`[data-brp-admin-fulfillment-renderer="${designSystem}"]`);
  await expect(renderer).toHaveCount(1);
  await expect(renderer).toBeVisible();
  await expect(page.locator("[data-brp-admin-fulfillment-renderer]")).toHaveCount(1);
}

async function expectNoDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function chooseOption(page: Page, control: Locator, value: string, label: string) {
  const tagName = await control.evaluate((element) => element.tagName);
  if (tagName === "SELECT") {
    await control.selectOption(value);
    return;
  }

  await control.click();
  await page.getByRole("option", {name: label, exact: true}).click();
}

async function expectOption(control: Locator, value: string, label: string) {
  const tagName = await control.evaluate((element) => element.tagName);
  if (tagName === "SELECT") {
    await expect(control).toHaveValue(value);
    return;
  }

  await expect(control).toContainText(label);
}

function warehouseProcess(page: Page, label: string) {
  return page
    .getByRole("tab", {name: label, exact: true})
    .or(page.getByRole("button", {name: label, exact: true}));
}

async function expectWarehouseProcessSelected(control: Locator) {
  if ((await control.getAttribute("role")) === "tab") {
    await expect(control).toHaveAttribute("aria-selected", "true");
    return;
  }

  await expect(control).toHaveAttribute("aria-current", "page");
}

async function expectLockedWithoutRequest(page: Page, action: Locator, reason: string) {
  await expect(action).toBeDisabled();
  await expect(action).toHaveAccessibleDescription(reason);
  const requests: string[] = [];
  const record = (request: {url: () => string}) => requests.push(request.url());
  page.on("request", record);
  await action.dispatchEvent("click");
  await page.waitForTimeout(50);
  page.off("request", record);
  expect(requests).toEqual([]);
}

function alternate(designSystem: DesignSystem): DesignSystem {
  return designSystem === "shadcn" ? "astryx" : "shadcn";
}

for (const mode of appearanceModes) {
  test.describe(`${mode.designSystem} ${mode.colorMode} warehouse and settlements appearance`, () => {
    test.beforeEach(async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, mode.designSystem, mode.colorMode);
    });

    test("warehouse preserves process, shipment, search, and filters across renderer changes", async ({page}) => {
      await openAdminRoute(page, "/admin/warehouse", 768);
      await expectRenderer(page, mode.designSystem);

      const shipment = page.getByRole("combobox", {name: "Постачання"});
      await chooseOption(page, shipment, "pac-04", "PAC 04 · SHP-2026-003 · in_transit");
      await expect(page.getByRole("heading", {name: /PAC 04 · SHP-2026-003/})).toBeVisible();
      await expectLockedWithoutRequest(
        page,
        page.getByRole("button", {name: "Почати приймання"}),
        "Запуск приймання недоступний: доступ лише для читання.",
      );

      await warehouseProcess(page, "Зведення").click();
      const search = page.getByRole("textbox", {name: "Пошук артикулу"});
      const shipmentFilter = page.getByRole("combobox", {name: "Постачання"});
      await search.fill("295100909");
      await chooseOption(page, shipmentFilter, "PAC 02", "PAC 02");

      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectRenderer(page, alternate(mode.designSystem));
      await expectWarehouseProcessSelected(warehouseProcess(page, "Зведення"));
      await expect(search).toHaveValue("295100909");
      await expectOption(shipmentFilter, "PAC 02", "PAC 02");
      await expect(page.getByText("SKI PYLON")).toBeVisible();

      await switchRenderer(page, mode.designSystem, mode.colorMode);
      await expectRenderer(page, mode.designSystem);
      await expect(search).toHaveValue("295100909");
      await expectNoDocumentOverflow(page);
    });

    test("settlements preserves query, sort, expanded dealer, and period across renderer changes", async ({page}) => {
      await openAdminRoute(page, "/admin/settlements", 768);
      await expectRenderer(page, mode.designSystem);

      const search = page.getByRole("textbox", {name: "Фільтр за дилером або 1С контрагентом"});
      const sort = page.getByRole("combobox", {name: "Сортування дилерів"});
      await search.fill("Днепр");
      await chooseOption(page, sort, "movements", "За кількістю рухів");
      await page.getByRole("button", {name: "Відкрити баланси BRP Днепр"}).click();
      const startDate = page.getByLabel("Дата початку періоду");
      await startDate.fill("2026-05-01");
      await expectLockedWithoutRequest(
        page,
        page.getByRole("button", {name: "Оновити", exact: true}),
        "Оновлення балансу недоступне: доступ лише для читання.",
      );

      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectRenderer(page, alternate(mode.designSystem));
      await expect(search).toHaveValue("Днепр");
      await expectOption(sort, "movements", "За кількістю рухів");
      await expect(page.getByRole("button", {name: "Закрити баланси BRP Днепр"})).toHaveAttribute("aria-expanded", "true");
      await expect(startDate).toHaveValue("2026-05-01");

      await switchRenderer(page, mode.designSystem, mode.colorMode);
      await expectRenderer(page, mode.designSystem);
      await expect(startDate).toHaveValue("2026-05-01");
      await expectNoDocumentOverflow(page);
    });

    test("mobile diagnostic and responsive layouts stay usable without prototype wording", async ({page}) => {
      for (const path of ["/admin/warehouse", "/admin/settlements"]) {
        await openAdminRoute(page, path, 390);
        await expectRenderer(page, mode.designSystem);
        await expectNoDocumentOverflow(page);
      }

      await openAdminRoute(page, "/admin/settlements", 390);
      const diagnostic = page.getByRole("button", {name: "Стан синхронізації", exact: true});
      await expect(diagnostic).toHaveAttribute("aria-expanded", "false");
      await diagnostic.click();
      await expect(diagnostic).toHaveAttribute("aria-expanded", "true");
      await expectLockedWithoutRequest(
        page,
        page.getByRole("button", {name: "Оновити з 1С (30 днів)"}),
        "Синхронізація з 1С недоступна: доступ лише для читання.",
      );
      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectRenderer(page, alternate(mode.designSystem));
      await expect(page.getByRole("button", {name: "Стан синхронізації", exact: true})).toHaveAttribute("aria-expanded", "true");

      if (mode.designSystem === "astryx") {
        await expect(page.getByText(/demo|mockup|clone/i)).toHaveCount(0);
      }
      await expectNoDocumentOverflow(page);
    });
  });
}
