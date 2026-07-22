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

async function expectProcurementRenderer(page: Page, designSystem: DesignSystem) {
  const renderer = page.locator(`[data-brp-admin-procurement-renderer="${designSystem}"]`);
  await expect(renderer).toHaveCount(1);
  await expect(renderer).toBeVisible();
  await expect(page.locator('[data-brp-admin-procurement-renderer]')).toHaveCount(1);
}

async function expectNoDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
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

async function expectOnlyOneDialog(page: Page, name: string) {
  await expect(page.getByRole("dialog", {name})).toHaveCount(1);
  await expect(page.locator('[role="dialog"]:visible, dialog[open]')).toHaveCount(1);
}

function alternate(designSystem: DesignSystem): DesignSystem {
  return designSystem === "shadcn" ? "astryx" : "shadcn";
}

for (const mode of appearanceModes) {
  test.describe(`${mode.designSystem} ${mode.colorMode} procurement appearance`, () => {
    test.beforeEach(async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, mode.designSystem, mode.colorMode);
    });

    test("supplier orders keeps full search, right-side filters, statuses, and active state across renderer changes", async ({page}) => {
      await openAdminRoute(page, "/admin/supplier-orders", 1440);
      await expectProcurementRenderer(page, mode.designSystem);
      const search = page.getByRole("textbox", {name: "Пошук за номером SO або артикулом"});
      const period = page.getByRole("button", {name: "Період"});
      const sort = page.getByRole("combobox", {name: "Сортування замовлень постачальнику"});
      const tabs = page.getByRole("tablist", {name: "Стан замовлень постачальнику"});
      await expect(search).toBeVisible();
      await expect(sort).toBeVisible();
      const [searchBox, periodBox] = await Promise.all([search.boundingBox(), period.boundingBox()]);
      expect((searchBox?.x ?? 0) + (searchBox?.width ?? 0)).toBeLessThanOrEqual(periodBox?.x ?? 0);
      await page.getByRole("tab", {name: /Винятки/}).click();
      await page.getByRole("button", {name: /PDF не прив'язано/}).click();
      await search.fill("SO-2026");
      await sort.selectOption("newest");
      await period.click();
      await expectOnlyOneDialog(page, "Період замовлень постачальнику");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", {name: "Період замовлень постачальнику"})).toHaveCount(0);
      await expect(period).toBeFocused();

      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectProcurementRenderer(page, alternate(mode.designSystem));
      await expect(tabs.getByRole("tab", {name: /Винятки/})).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("button", {name: /PDF не прив'язано/})).toHaveAttribute("aria-pressed", "true");
      await expect(search).toHaveValue("SO-2026");
      await expect(sort).toHaveValue("newest");

      await switchRenderer(page, mode.designSystem, mode.colorMode);
      await expectProcurementRenderer(page, mode.designSystem);
      await expect(search).toHaveValue("SO-2026");
      await expectNoDocumentOverflow(page);
    });

    test("consignment keeps its labelled dense matrix contained and renders mobile cards without document overflow", async ({page}) => {
      await openAdminRoute(page, "/admin/consignment", 768);
      await expectProcurementRenderer(page, mode.designSystem);
      const matrix = page.getByRole("region", {name: "Залишки по 16 дилерах"});
      await expect(matrix).toBeVisible();
      await expect(matrix).toHaveAttribute("tabindex", "0");
      expect(await matrix.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      await expect(matrix.locator("th").first()).toHaveCSS("position", "sticky");
      const holder = page.getByRole("combobox", {name: "Тримач консигнації"});
      await holder.selectOption("vyshgorod");
      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectProcurementRenderer(page, alternate(mode.designSystem));
      await expect(holder).toHaveValue("vyshgorod");
      await switchRenderer(page, mode.designSystem, mode.colorMode);
      await expectNoDocumentOverflow(page);

      await openAdminRoute(page, "/admin/consignment", 390);
      await expectProcurementRenderer(page, mode.designSystem);
      await expect(page.getByRole("list", {name: "Картки залишків консигнації"})).toBeVisible();
      await expect(page.getByRole("region", {name: "Залишки по 16 дилерах"})).toHaveCount(0);
      await expectNoDocumentOverflow(page);
    });

    test("return creation is a single modal that returns focus on Escape and preserves locked command reasons", async ({page}) => {
      await openAdminRoute(page, "/admin/returns", 768);
      await expectProcurementRenderer(page, mode.designSystem);
      const refresh = page.getByRole("button", {name: "Оновити"});
      await expectLockedWithoutRequest(page, refresh, "Оновлення вимкнено: доступ лише для читання.");
      const returnStatuses = page.getByRole("group", {name: "Статус повернення"});
      await returnStatuses.getByRole("button", {name: "Затверджено"}).click();
      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectProcurementRenderer(page, alternate(mode.designSystem));
      await expect(returnStatuses.getByRole("button", {name: "Затверджено"})).toHaveAttribute("aria-pressed", "true");
      await switchRenderer(page, mode.designSystem, mode.colorMode);
      const create = page.getByRole("button", {name: "Оформити повернення"});
      await create.click();
      await expectOnlyOneDialog(page, "Оформити повернення від дилера");
      await expectLockedWithoutRequest(
        page,
        page.getByRole("button", {name: "Створити чернетку"}),
        "Створення чернетки заблоковано: доступ лише для читання.",
      );
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", {name: "Оформити повернення від дилера"})).toHaveCount(0);
      await expect(create).toBeFocused();
      await expectNoDocumentOverflow(page);
    });

    test("Air Freight exposes workflow and shipment statuses while keeping locked actions inert", async ({page}) => {
      await openAdminRoute(page, "/admin/air-freight", 768);
      await expectProcurementRenderer(page, mode.designSystem);
      const workflow = page.getByRole("region", {name: "Етапи Air Freight"});
      await expect(workflow).toBeVisible();
      await expect(workflow).toHaveAttribute("tabindex", "0");
      expect(await workflow.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      await expectLockedWithoutRequest(
        page,
        page.getByRole("button", {name: "Склад"}),
        "Складська операція недоступна: доступ лише для читання.",
      );
      await page.getByRole("tab", {name: "Постачання"}).click();
      const statuses = page.getByRole("group", {name: "Статус постачання"});
      await expect(statuses).toBeVisible();
      await page.getByRole("button", {name: "В дорозі"}).click();
      await expect(page.getByRole("button", {name: "В дорозі"})).toHaveAttribute("aria-pressed", "true");
      await switchRenderer(page, alternate(mode.designSystem), mode.colorMode);
      await expectProcurementRenderer(page, alternate(mode.designSystem));
      await expect(page.getByRole("tab", {name: "Постачання"})).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("button", {name: "В дорозі"})).toHaveAttribute("aria-pressed", "true");
      await switchRenderer(page, mode.designSystem, mode.colorMode);
      await page.getByRole("button", {name: "Нове постачання"}).click();
      await expectOnlyOneDialog(page, "Нове постачання");
      await expectLockedWithoutRequest(
        page,
        page.getByRole("button", {name: /Перетягніть PDF файли/}),
        "Завантаження файлів недоступне: доступ лише для читання.",
      );
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", {name: "Нове постачання"})).toHaveCount(0);
      await expectNoDocumentOverflow(page);
    });

    test("Astryx procurement surfaces do not expose prototype language", async ({page}) => {
      test.skip(mode.designSystem !== "astryx", "The wording rule applies to the Astryx renderer being introduced.");
      for (const path of ["/admin/supplier-orders", "/admin/consignment", "/admin/returns", "/admin/air-freight"]) {
        await openAdminRoute(page, path, 768);
        await expectProcurementRenderer(page, "astryx");
        await expect(page.getByText(/demo|mockup|clone/i)).toHaveCount(0);
      }
    });

    test("procurement pages fit 390px and 768px viewports outside their labelled dense regions", async ({page}) => {
      for (const width of [390, 768] as const) {
        for (const path of ["/admin/supplier-orders", "/admin/consignment", "/admin/returns", "/admin/air-freight"]) {
          await openAdminRoute(page, path, width);
          await expectProcurementRenderer(page, mode.designSystem);
          await expectNoDocumentOverflow(page);
        }
      }
    });
  });
}
