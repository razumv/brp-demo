import { expect, test } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

test("draft filters change visible records, compose with search, and reset", async ({ page }) => {
  await page.goto("/cart");
  await page.getByLabel("Номер запчастини").fill("9779150");
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  await page.getByLabel("Назва чернетки").fill("З позиціями і покупцем");
  await page.getByLabel("PO / номер замовлення").fill("PO-FILTER-LINES");
  await page.getByLabel("Оберіть покупця").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Зберегти чернетку" }).click();

  await page.goto("/dealer/order-drafts");
  await page.getByRole("button", { name: "Нова чернетка" }).click();
  await page.getByLabel("Назва чернетки").fill("Порожня без покупця");
  await page.getByRole("button", { name: "Зберегти чернетку" }).click();

  await page.goto("/dealer/order-drafts");
  await page.getByRole("button", { name: "Нова чернетка" }).click();
  await page.getByLabel("Назва чернетки").fill("Порожня з покупцем");
  await page.getByLabel("Оберіть покупця").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Зберегти чернетку" }).click();

  await page.goto("/dealer/order-drafts");
  const trigger = page.getByRole("button", { name: "Фільтри", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.getByLabel("Вміст чернетки").selectOption("with-items");
  await expect(page.getByText("З позиціями і покупцем", { exact: true })).toBeVisible();
  await expect(page.getByText("Порожня без покупця", { exact: true })).toBeHidden();
  await expect(page.getByText("Порожня з покупцем", { exact: true })).toBeHidden();

  await page.getByLabel("Вміст чернетки").selectOption("all");
  await page.getByLabel("Покупець чернетки").selectOption("unassigned");
  await expect(page.getByText("Порожня без покупця", { exact: true })).toBeVisible();
  await expect(page.getByText("З позиціями і покупцем", { exact: true })).toBeHidden();
  await expect(page.getByText("Порожня з покупцем", { exact: true })).toBeHidden();

  await page.getByLabel("Вміст чернетки").selectOption("empty");
  await page.getByLabel("Покупець чернетки").selectOption("assigned");
  const activeTrigger = page.getByRole("button", { name: "Фільтри", exact: true });
  await expect(activeTrigger).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await activeTrigger.click();
  await expect(activeTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(activeTrigger).toHaveText("2");
  await activeTrigger.click();
  await expect(page.getByText("Порожня з покупцем", { exact: true })).toBeVisible();
  await page.getByLabel("Пошук чернеток").fill("без покупця");
  await expect(page.getByText("Порожня з покупцем", { exact: true })).toBeHidden();
  await page.getByLabel("Пошук чернеток").fill("з покупцем");
  await expect(page.getByText("Порожня з покупцем", { exact: true })).toBeVisible();

  await page.getByLabel("Пошук чернеток").fill("");
  await page.getByRole("button", { name: "Скинути фільтри" }).click();
  await expect(page.getByLabel("Вміст чернетки")).toHaveValue("all");
  await expect(page.getByLabel("Покупець чернетки")).toHaveValue("all");
  await expect(page.getByText("Показано 3 з 3", { exact: true })).toBeVisible();
  await expect(page.getByText("З позиціями і покупцем", { exact: true })).toBeVisible();
  await expect(page.getByText("Порожня без покупця", { exact: true })).toBeVisible();
  await expect(page.getByText("Порожня з покупцем", { exact: true })).toBeVisible();
});

test("draft toolbar remains a visible one-row control set without Excel at 390 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dealer/order-drafts");

  const search = page.getByLabel("Пошук чернеток");
  const searchControl = search.locator("xpath=..");
  const filter = page.getByRole("button", { name: "Фільтри", exact: true });
  await expect(search).toBeVisible();
  await expect(searchControl).toBeVisible();
  await expect(filter).toBeVisible();
  await expect(page.getByRole("button", { name: "Excel", exact: true })).toHaveCount(0);

  const [searchBox, filterBox] = await Promise.all([
    searchControl.boundingBox(),
    filter.boundingBox(),
  ]);
  expect(searchBox).not.toBeNull();
  expect(filterBox).not.toBeNull();
  if (!searchBox || !filterBox) return;

  expect(Math.abs(searchBox.y - filterBox.y)).toBeLessThanOrEqual(1);
  expect(searchBox.x).toBeLessThan(filterBox.x);
  expect(filterBox.width).toBe(44);
  expect(filterBox.height).toBe(44);
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();
});

test("dealer can search, reopen, and delete a saved order draft", async ({ page }) => {
  await page.goto("/cart");
  await page.getByLabel("Номер запчастини").fill("9779150");
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  await page.getByLabel("Назва чернетки").fill("Охолоджувальна рідина");
  await page.getByLabel("PO / номер замовлення").fill("PO-DRAFT-17");
  await page.getByLabel("Оберіть покупця").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Зберегти чернетку" }).click();

  await page.goto("/dealer/order-drafts");
  await page.getByLabel("Пошук чернеток").fill("PO-DRAFT-17");
  await expect(page.getByText("Охолоджувальна рідина", { exact: true })).toBeVisible();
  await expect(page.getByText("Показано 1 з 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Відкрити", exact: true }).click();
  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.getByLabel("Назва чернетки")).toHaveValue("Охолоджувальна рідина");
  await expect(page.getByText("COOLANT,EXT LIFE", { exact: true })).toBeVisible();

  await page.goto("/dealer/order-drafts");
  await page.getByRole("button", { name: "Видалити чернетку Охолоджувальна рідина" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Видалити чернетку?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Чернеток поки немає" })).toBeVisible();
});
