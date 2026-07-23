import { expect, test, type Page } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

async function expectCompactToolbar(
  page: Page,
  searchLabel: string,
  filterLabel: string,
) {
  const search = page.getByRole("searchbox", { name: searchLabel });
  const trigger = page.getByRole("button", { name: filterLabel, exact: true });
  await expect(search).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-controls", /.+/);

  const [searchBox, triggerBox] = await Promise.all([
    search.locator("xpath=..").boundingBox(),
    trigger.boundingBox(),
  ]);
  expect(searchBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  if (!searchBox || !triggerBox) return;

  expect(Math.abs(searchBox.y - triggerBox.y)).toBeLessThanOrEqual(1);
  expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(triggerBox.x);
  expect(triggerBox.width).toBe(44);
  expect(triggerBox.height).toBe(44);
}

async function expectViewChoice(page: Page, name: "Список" | "Канбан") {
  const radio = page.getByRole("radio", {name, exact: true});
  if (await radio.count()) {
    await expect(radio).toBeVisible();
    return;
  }
  await expect(page.getByRole("button", {name, exact: true})).toBeVisible();
}

async function selectStatus(page: Page, value: string, label: string) {
  const control = page.getByRole("combobox", {name: "Статус замовлень"});
  if (await control.evaluate((element) => element.tagName === "SELECT")) {
    await control.selectOption(value);
    return;
  }
  await control.click();
  await page.getByRole("option", {name: label, exact: true}).click();
}

test("orders disclose the status filter without moving the view switcher", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/dealer/orders");

    await expectCompactToolbar(page, "Пошук замовлень", "Фільтри замовлень");
    await expectViewChoice(page, "Список");
    await expectViewChoice(page, "Канбан");

    const trigger = page.getByRole("button", { name: "Фільтри замовлень", exact: true });
    await trigger.click();
    await selectStatus(page, "done", "Виконані (0)");
    await expect(page.getByText("0 замовлень", { exact: true })).toBeVisible();
    await expect(trigger).toHaveText("1");
    await page.getByRole("button", { name: "Скинути фільтри" }).click();
    await expect(page.getByText("1 замовлення", { exact: true })).toBeVisible();
    await expect(trigger).not.toHaveText("1");
  }
});

test("dealer toolbar waits briefly before applying a typed search query", async ({ page }) => {
  await page.goto("/dealer/orders");
  const search = page.getByRole("searchbox", { name: "Пошук замовлень" });
  await expect(page.getByRole("link", { name: "LOG-01" })).toBeVisible();

  await search.fill("немає такого замовлення");
  expect(await page.getByRole("link", { name: "LOG-01" }).count()).toBe(1);
  await page.waitForTimeout(150);
  expect(await page.getByRole("link", { name: "LOG-01" }).count()).toBe(1);

  await expect(page.getByRole("heading", { name: "Нічого не знайдено" })).toBeVisible();
});

test("schedule discloses category filtering while keeping slot selection separate", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/dealer/schedule");

    await expectCompactToolbar(page, "Пошук у графіку поставки", "Фільтри графіка поставки");
    const slot = page.getByRole("button", { name: /Sea-Doo липень 2026/ });
    await expect(slot).toBeVisible();

    const trigger = page.getByRole("button", { name: "Фільтри графіка поставки", exact: true });
    await trigger.click();
    await page.getByLabel("Категорія техніки").selectOption("PWC");
    await expect(page.getByTestId("schedule-result-count")).toHaveText("2 слоти · 12 одиниць · 4 вільно");
    await expect(trigger).toHaveText("1");
    await page.getByRole("button", { name: "Скинути фільтри" }).click();
    await expect(page.getByTestId("schedule-result-count")).toHaveText("4 слоти · 28 одиниць · 8 вільно");
    await expect(trigger).not.toHaveText("1");
    await expect(slot).toBeVisible();
  }
});
