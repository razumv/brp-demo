import { expect, test } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
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
