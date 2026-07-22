import {expect, test, type Page} from "@playwright/test";
import {seedAdminSession} from "./support/admin-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

const appearances: readonly {
  designSystem: DesignSystem;
  colorMode: ColorMode;
  renderer: "current" | "astryx";
}[] = [
  {designSystem: "shadcn", colorMode: "light", renderer: "current"},
  {designSystem: "shadcn", colorMode: "dark", renderer: "current"},
  {designSystem: "astryx", colorMode: "light", renderer: "astryx"},
  {designSystem: "astryx", colorMode: "dark", renderer: "astryx"},
];

async function seedAppearance(
  page: Page,
  designSystem: DesignSystem,
  colorMode: ColorMode,
) {
  await page.addInitScript(({nextDesignSystem, nextColorMode}) => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    }));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
}

async function publishAppearance(
  page: Page,
  designSystem: DesignSystem,
  colorMode: ColorMode,
) {
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
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", colorMode);
}

function pipelineViewControl(
  page: Page,
  name: "Список" | "Канбан",
  renderer: "current" | "astryx",
) {
  return renderer === "astryx"
    ? page.getByRole("radio", {name, exact: true})
    : page.getByRole("button", {name, exact: true});
}

test.describe("admin overview appearance matrix", () => {
  for (const appearance of appearances) {
    test(`${appearance.designSystem} ${appearance.colorMode} keeps dashboard navigation and evidence`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, appearance.designSystem, appearance.colorMode);
      await page.goto("/admin");

      await expect(page.locator(`[data-admin-overview-renderer="${appearance.renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Огляд панелі"})).toBeVisible();
      await expect(page.getByRole("heading", {name: "Стан черги"})).toBeVisible();
      await expect(page.getByRole("heading", {name: "Розподіл залишків"})).toBeVisible();
      await expect(page.getByRole("link", {name: "Відкрити пайплайн"})).toHaveAttribute("href", /\/admin\/order-pipeline$/);
      await expect(page.getByRole("link", {name: /LOG-01/}).first()).toHaveAttribute("href", /\/admin\/orders\//);
    });
  }
});

test.describe("admin pipeline appearance matrix", () => {
  for (const appearance of appearances) {
    test(`${appearance.designSystem} ${appearance.colorMode} preserves pipeline controls`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, appearance.designSystem, appearance.colorMode);
      await page.goto("/admin/order-pipeline");

      await expect(page.locator(`[data-admin-pipeline-renderer="${appearance.renderer}"]`)).toHaveCount(1);
      const search = page.getByRole("textbox", {name: "Пошук замовлень"});
      await search.fill("KHA-08");
      await expect(search).toHaveValue("KHA-08");
      await expect(page.getByRole("link", {name: /KHA-08/})).toBeVisible();

      const period = page.getByRole("button", {name: "Період", exact: true});
      await period.click();
      await expect(page.getByRole("dialog", {name: "Період замовлень"})).toBeVisible();
      await page.getByRole("button", {name: "Закрити", exact: true}).click();

      await pipelineViewControl(page, "Канбан", appearance.renderer).click();
      await expect(page.getByRole("region", {name: "Канбан замовлень"})).toBeVisible();
      await pipelineViewControl(page, "Список", appearance.renderer).click();
      await expect(page.getByRole("button", {name: /Нові замовлення/i})).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("navigation", {name: "Пагінація замовлень"})).toBeVisible();
    });
  }

  test("search, selected view, and expanded groups survive both renderer directions", async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "shadcn", "light");
    await page.goto("/admin/order-pipeline");

    const search = page.getByRole("textbox", {name: "Пошук замовлень"});
    await search.fill("KHA-08");
    const newOrders = page.getByRole("button", {name: /Нові замовлення/i});
    await expect(newOrders).toHaveAttribute("aria-expanded", "true");
    await newOrders.click();
    await expect(newOrders).toHaveAttribute("aria-expanded", "false");

    await publishAppearance(page, "astryx", "dark");
    await expect(page.locator('[data-admin-pipeline-renderer="astryx"]')).toHaveCount(1);
    await expect(search).toHaveValue("KHA-08");
    await expect(page.getByRole("button", {name: /Нові замовлення/i})).toHaveAttribute("aria-expanded", "false");

    await pipelineViewControl(page, "Канбан", "astryx").click();
    await publishAppearance(page, "shadcn", "light");
    await expect(page.locator('[data-admin-pipeline-renderer="current"]')).toHaveCount(1);
    await expect(search).toHaveValue("KHA-08");
    await expect(page.getByRole("button", {name: "Канбан", exact: true})).toHaveAttribute("aria-pressed", "true");
    await pipelineViewControl(page, "Список", "current").click();
    await expect(page.getByRole("button", {name: /Нові замовлення/i})).toHaveAttribute("aria-expanded", "false");
  });

  test("period and unread filters survive both renderer directions", async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "shadcn", "light");
    await page.goto("/admin/order-pipeline");

    await page.getByRole("button", {name: "Період", exact: true}).click();
    await page.getByRole("button", {name: "July 2026 1", exact: true}).click();
    await page.getByRole("button", {name: "July 2026 2", exact: true}).click();
    await page.getByRole("button", {name: "Закрити", exact: true}).click();
    await page.getByRole("button", {name: "2 непрочитаних", exact: true}).click();

    await publishAppearance(page, "astryx", "dark");
    await expect(page.getByRole("button", {name: "2 непрочитаних", exact: true})).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", {name: "Період", exact: true}).click();
    await expect(page.getByRole("button", {name: "July 2026 1", exact: true})).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", {name: "July 2026 2", exact: true})).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", {name: "Закрити", exact: true}).click();

    await publishAppearance(page, "shadcn", "light");
    await expect(page.getByRole("button", {name: "2 непрочитаних", exact: true})).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", {name: "Період", exact: true}).click();
    await expect(page.getByRole("button", {name: "July 2026 1", exact: true})).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", {name: "July 2026 2", exact: true})).toHaveAttribute("aria-pressed", "true");
  });

  test("Astryx period popover remains inside a 390px viewport", async ({page}) => {
    await page.setViewportSize({width: 390, height: 844});
    await seedAdminSession(page);
    await seedAppearance(page, "astryx", "light");
    await page.goto("/admin/order-pipeline");

    await page.getByRole("button", {name: "Період", exact: true}).click();
    const dialog = page.getByRole("dialog", {name: "Період замовлень"});
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});

test.describe("admin order detail appearance matrix", () => {
  for (const appearance of appearances) {
    test(`${appearance.designSystem} ${appearance.colorMode} preserves generated order workflow`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, appearance.designSystem, appearance.colorMode);
      await page.goto("/admin/orders/a20b2bdd-2a1f-4322-a50a-fe68a17f4963");

      await expect(page.locator(`[data-admin-order-detail-renderer="${appearance.renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "LOG-01"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Перевірити перед підтвердженням"})).toBeEnabled();
      await page.getByRole("button", {name: "Перевірити перед підтвердженням"}).click();
      await expect(page.getByRole("dialog", {name: "Перевірка перед підтвердженням"})).toBeVisible();
      await page.keyboard.press("Escape");

      const timeline = page.getByRole("button", {name: /Хронологія \d+/});
      await expect(timeline).toHaveAttribute("aria-expanded", "true");
      await timeline.click();
      await expect(timeline).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("button", {name: /Відправити дилеру/})).toBeDisabled();
    });

    test(`${appearance.designSystem} ${appearance.colorMode} keeps query route compatibility`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, appearance.designSystem, appearance.colorMode);
      await page.goto("/admin/order-detail?id=LOG-01");

      await expect(page.locator(`[data-admin-order-detail-renderer="${appearance.renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "LOG-01"})).toBeVisible();
      await expect(page.getByRole("link", {name: "Пайплайн замовлень"})).toHaveAttribute("href", "/admin/order-pipeline");
    });
  }

  test("open preflight and line filter survive both renderer directions", async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "shadcn", "light");
    await page.goto("/admin/orders/a20b2bdd-2a1f-4322-a50a-fe68a17f4963");

    const waitingFilter = page.getByRole("button", {name: /Очікування 1/});
    await waitingFilter.click();
    await expect(waitingFilter).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", {name: "Перевірити перед підтвердженням"}).click();
    await page.getByRole("button", {name: "Структура preview"}).click();
    await page.getByRole("combobox", {name: "Канал доставки"}).selectOption("ocean");
    await page.getByRole("spinbutton", {name: "Поповнення, к-сть"}).fill("3");
    await expect(page.getByRole("button", {name: "Оновити розрахунок"})).toBeDisabled();
    for (const heading of ["Після підтвердження", "Оборот", "Відкрито Logos", "Рішення Logos"]) {
      await expect(page.getByRole("columnheader", {name: heading, exact: true})).toBeVisible();
    }

    await publishAppearance(page, "astryx", "dark");
    await expect(page.locator('[data-admin-order-detail-renderer="astryx"]')).toHaveCount(1);
    await expect(page.getByRole("button", {name: /Очікування 1/})).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("dialog", {name: "Перевірка перед підтвердженням"})).toBeVisible();
    await expect(page.getByRole("radio", {name: "Структура preview"})).toBeChecked();
    await expect(page.getByRole("combobox", {name: "Канал доставки"})).toContainText("ocean");
    await expect(page.getByRole("spinbutton", {name: "Поповнення, к-сть"})).toHaveValue("3");
    await expect(page.getByRole("button", {name: "Оновити розрахунок"})).toBeDisabled();
    for (const heading of ["Після підтвердження", "Оборот", "Відкрито Logos", "Рішення Logos"]) {
      await expect(page.getByRole("columnheader", {name: heading, exact: true})).toBeVisible();
    }

    await publishAppearance(page, "shadcn", "light");
    await expect(page.locator('[data-admin-order-detail-renderer="current"]')).toHaveCount(1);
    await expect(page.getByRole("button", {name: /Очікування 1/})).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("dialog", {name: "Перевірка перед підтвердженням"})).toBeVisible();
    await expect(page.getByRole("combobox", {name: "Канал доставки"})).toHaveValue("ocean");
    await expect(page.getByRole("spinbutton", {name: "Поповнення, к-сть"})).toHaveValue("3");
  });

  test("partial and missing order evidence remains explicit in both renderers", async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "shadcn", "light");

    await page.goto("/admin/orders/LSM-10");
    await expect(page.getByRole("heading", {name: "LSM-10"})).toBeVisible();
    await expect(page.getByRole("heading", {name: "Склад позицій не зафіксовано"})).toBeVisible();

    await publishAppearance(page, "astryx", "dark");
    await expect(page.locator('[data-admin-order-detail-renderer="astryx"]')).toHaveCount(1);
    await expect(page.getByRole("heading", {name: "Склад позицій не зафіксовано"})).toBeVisible();

    await page.goto("/admin/order-detail?id=missing");
    await publishAppearance(page, "astryx", "dark");
    await expect(page.locator('[data-admin-order-detail-renderer="astryx"]')).toHaveCount(1);
    await expect(page.getByRole("heading", {name: "Замовлення не знайдено"})).toBeVisible();
    await expect(page.getByRole("link", {name: "До пайплайна"})).toHaveAttribute("href", "/admin/order-pipeline");
    await expect(page.getByRole("heading", {name: "Замовлення не знайдено", level: 1})).toBeVisible();
  });

  for (const designSystem of ["shadcn", "astryx"] as const) {
    test(`${designSystem} preserves cancelled financial evidence and locked provenance`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, designSystem, "light");
      await page.goto("/admin/orders/386960e7-2e28-4bb0-8fa9-83e45f84df7a");

      await expect(page.getByRole("heading", {name: "KIE-ST-23"})).toBeVisible();
      await expect(page.getByText("РН-00001955", {exact: false})).toBeVisible();
      await expect(page.getByText("Nova Poshta", {exact: true})).toBeVisible();

      const preflight = page.getByRole("button", {name: "Preflight не зафіксовано"});
      await expect(preflight).toBeDisabled();
      await expect.poll(() => preflight.evaluate((element) => element.getAttribute("title") ?? element.getAttribute("aria-description"))).toBe("Source preflight зафіксовано лише для LOG-01 і KHA-08");

      const legacy = page.getByRole("button", {name: "Перевірити старий склад"});
      await expect(legacy).toBeDisabled();
      await expect.poll(() => legacy.evaluate((element) => element.getAttribute("title") ?? element.getAttribute("aria-description"))).toBe("POST check-legacy вимкнено: кнопка не виконує запит.");

      const cancelledRow = page.getByRole("row").filter({hasText: "710004964"});
      await expect(cancelledRow).toBeVisible();
      for (const value of ["5", "$63.92", "$319.60"]) {
        const evidence = cancelledRow.getByText(value, {exact: true});
        await expect(evidence).toBeVisible();
        await expect.poll(() => evidence.evaluate((element) => getComputedStyle(element).textDecorationLine)).toContain("line-through");
      }
    });
  }
});
