import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsAdmin, openAdminRoute } from "./support/admin-session";

async function expectToolbarTrigger(page: Page) {
  const trigger = page.getByRole("button", { name: "Відкрити фільтри" });
  await expect(trigger).toHaveCount(1);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const [searchBox, triggerBox] = await Promise.all([
    page.getByRole("textbox").first().boundingBox(),
    trigger.boundingBox(),
  ]);
  expect(triggerBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(triggerBox?.width ?? 0).toBeLessThanOrEqual(48);
  expect((searchBox?.x ?? 0) + (searchBox?.width ?? 0)).toBeLessThanOrEqual(triggerBox?.x ?? 0);
  await expect(trigger).not.toContainText("Фільтри");
  return trigger;
}

async function expectFullWidthSegment(control: Locator) {
  const group = control.locator("..");
  const [groupBox, firstBox, lastBox] = await Promise.all([
    group.boundingBox(),
    control.first().boundingBox(),
    control.last().boundingBox(),
  ]);
  expect(firstBox?.x ?? Infinity).toBeLessThanOrEqual((groupBox?.x ?? 0) + 5);
  expect((lastBox?.x ?? 0) + (lastBox?.width ?? 0)).toBeGreaterThanOrEqual((groupBox?.x ?? 0) + (groupBox?.width ?? 0) - 5);
}

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("shared toolbar uses an icon-only mobile trigger and full-width segments", async ({ page }) => {
  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/order-pipeline", width);
    const trigger = await expectToolbarTrigger(page);
    await trigger.click();
    await expect(page.getByRole("button", { name: "Закрити фільтри" })).toHaveCount(1);
    await expect(page.locator("[data-mobile-disclosure-panel]")).toBeVisible();
    await expectFullWidthSegment(page.getByRole("group", { name: "Вигляд замовлень" }).getByRole("button"));
  }

  await openAdminRoute(page, "/admin/order-pipeline", 768);
  await expect(page.getByRole("button", { name: "Відкрити фільтри" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Вигляд замовлень" })).toBeVisible();
});

test("page toolbars disclose only real mobile controls", async ({ page }) => {
  await openAdminRoute(page, "/admin/consignment", 390);
  await expectFullWidthSegment(page.getByRole("tablist", { name: "Розділи консигнації" }).getByRole("tab"));
  await (await expectToolbarTrigger(page)).click();
  await expect(page.getByRole("combobox", { name: "Тримач консигнації" })).toBeVisible();
  await page.getByRole("combobox", { name: "Тримач консигнації" }).selectOption("vyshgorod");
  await expect(page.locator('tbody tr')).not.toHaveCount(0);

  await openAdminRoute(page, "/admin/returns", 390);
  await (await expectToolbarTrigger(page)).click();
  await expect(page.getByRole("group", { name: "Статус повернення" })).toBeVisible();

  await openAdminRoute(page, "/admin/ocean-freight", 390);
  await (await expectToolbarTrigger(page)).click();
  await expect(page.getByRole("combobox", { name: "Статус морського перевезення" })).toBeVisible();
  await expect(page.getByText(/11\/11 BL · 26\/26 контейнерів/)).toBeHidden();

  await openAdminRoute(page, "/admin/settlements", 390);
  await (await expectToolbarTrigger(page)).click();
  await page.getByRole("combobox", { name: "Сортування дилерів" }).selectOption("movements");
  await expect(page.locator('section[aria-label="Дилери"] article').first()).toContainText(/рухів/);
  await expect(page.getByText("19 з 19 дилерів")).toBeHidden();

  await openAdminRoute(page, "/admin/invoices", 390);
  await expect(page.getByText("2 з 2")).toBeHidden();

  await openAdminRoute(page, "/admin/catalog", 390);
  await expectFullWidthSegment(page.getByRole("group", { name: "Категорії транспортних засобів" }).getByRole("button"));
  await (await expectToolbarTrigger(page)).click();
  await page.getByRole("button", { name: /Детальні фільтри/ }).click();
  await page.getByRole("combobox", { name: "Категорія таблиці" }).selectOption("ATV");
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toContainText("ATV");

  await openAdminRoute(page, "/admin/companies", 390);
  await (await expectToolbarTrigger(page)).click();
  await page.getByRole("combobox", { name: "Стан профілю компанії" }).selectOption("incomplete");
  await expect(page.locator("article").filter({ hasText: "Не заповнений" })).not.toHaveCount(0);
});
