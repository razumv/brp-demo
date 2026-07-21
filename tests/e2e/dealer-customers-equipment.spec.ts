import { expect, test } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

test("dealer creates, filters, and deletes an unrelated customer", async ({ page }) => {
  await page.goto("/dealer/customers");
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("brp-clone-demo-state-v1") ?? "{}").session?.role)).toBe("dealer");
  await expect(page.getByRole("heading", { name: "Клієнти", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Додати клієнта" }).click();
  await page.getByLabel("Ім’я *").fill("ПП Озерний");
  await page.getByLabel("Телефон").fill("+380441112233");
  await page.getByLabel("Категорія").selectOption("service");
  await page.getByRole("dialog", { name: "Додати клієнта" }).getByRole("button", { name: "Додати клієнта", exact: true }).click();

  await expect(page.getByRole("button", { name: "ПП Озерний", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Сервіс" }).click();
  await expect(page.getByRole("button", { name: "ПП Озерний", exact: true })).toBeVisible();
  await page.getByLabel("Пошук клієнтів").fill("Неіснуючий клієнт");
  await expect(page.getByText("Клієнтів не знайдено", { exact: true })).toBeVisible();

  await page.getByLabel("Пошук клієнтів").fill("");
  await page.getByRole("button", { name: "Всі" }).click();
  await page.getByRole("button", { name: "ПП Озерний" }).click();
  await page.getByRole("button", { name: "Видалити клієнта" }).click();
  await expect(page.getByRole("dialog", { name: "Видалити клієнта" })).toBeVisible();
  await page.getByRole("button", { name: "Видалити", exact: true }).click();
  await expect(page.getByRole("button", { name: "ПП Озерний", exact: true })).toHaveCount(0);
});

test("dealer adds, edits, removes, and persists customer equipment", async ({ page }) => {
  await page.goto("/dealer/customers");
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  await page.getByLabel("Модель *").fill("Outlander 700");
  await page.getByLabel("VIN").fill("2BXABC12345678901");
  await page.getByRole("button", { name: "Додати техніку" }).click();
  await expect(page.getByText("Outlander 700", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Редагувати техніку Outlander 700" }).click();
  await page.getByLabel("Модель *").fill("Outlander 700 XT");
  await page.getByRole("button", { name: "Зберегти техніку" }).click();
  await page.reload();
  await expect(page.getByText("Outlander 700 XT", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Видалити техніку Outlander 700 XT" }).click();
  await page.getByRole("button", { name: "Видалити", exact: true }).click();
  await expect(page.getByText("Немає зареєстрованої техніки", { exact: true })).toBeVisible();
});

test("customer management remains usable at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dealer/customers");
  await expect(page.getByRole("heading", { name: "Клієнти", exact: true })).toBeVisible();
  await expect(page.locator("main.page")).toHaveCSS("overflow-x", "visible");
  await expect(page.getByRole("button", { name: "Додати клієнта" })).toBeVisible();
});
