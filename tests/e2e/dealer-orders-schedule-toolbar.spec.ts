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

test("orders disclose the status filter without moving the view switcher", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/dealer/orders");

    await expectCompactToolbar(page, "Пошук замовлень", "Фільтри замовлень");
    await expect(page.getByRole("button", { name: "Список" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Канбан" })).toBeVisible();

    const trigger = page.getByRole("button", { name: "Фільтри замовлень", exact: true });
    await trigger.click();
    await page.getByLabel("Статус замовлень").selectOption("done");
    await expect(page.getByText("0 замовлень", { exact: true })).toBeVisible();
    await expect(trigger).toHaveText("1");
    await page.getByRole("button", { name: "Скинути фільтри" }).click();
    await expect(page.getByText("1 замовлення", { exact: true })).toBeVisible();
    await expect(trigger).not.toHaveText("1");
  }
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
