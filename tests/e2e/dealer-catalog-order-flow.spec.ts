import { expect, test } from "@playwright/test";
import {
  DEALER_WORKFLOW_STORAGE_KEY,
  seedDealerWorkflowSession,
} from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

test("dealer order builder persists and reaches confirmation, list, and detail", async ({ page }) => {
  await page.goto("/cart");

  await page.getByLabel("Номер запчастини").fill("422280226");
  await page.getByRole("button", { name: "Додати", exact: true }).click();
  await expect(page.getByText(/422280226 .* додано до замовлення/)).toBeVisible();

  await page.getByLabel("Назва чернетки").fill("Ремені для сервісу");
  await page.getByLabel("PO / номер замовлення").fill("PO-ORD-42");
  await page.getByLabel("Оберіть покупця").selectOption({ index: 1 });
  await page.getByLabel("Примітка до замовлення").fill("Передзвонити перед комплектацією");
  await page.getByLabel("Самовивіз").check();
  await page.getByRole("button", { name: "Зберегти чернетку" }).click();
  await expect(page.getByText("Чернетку «Ремені для сервісу» збережено.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Назва чернетки")).toHaveValue("Ремені для сервісу");
  await expect(page.getByLabel("PO / номер замовлення")).toHaveValue("PO-ORD-42");
  await expect(page.getByText("BELT-V", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Самовивіз")).toBeChecked();

  await page.getByRole("button", { name: "Створити замовлення" }).click();
  await expect(page).toHaveURL(/\/order-confirmation\?id=dealer-order-/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Замовлення створено" })).toBeVisible();
  await expect(page.getByText("PO: PO-ORD-42", { exact: true })).toBeVisible();
  const code = (await page.locator("strong").filter({ hasText: /^LOG-\d+$/ }).first().textContent())?.trim();
  expect(code).toMatch(/^LOG-\d+$/);
  await expect(page.locator("main, .page").first()).not.toContainText(/демо|демонстрац|test|тест|environment/i);

  await page.getByRole("link", { name: "Мої замовлення", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(`^${code}`) }).first().click();
  await expect(page.getByRole("heading", { name: code as string, exact: true })).toBeVisible();
  await expect(page.getByText("PO: PO-ORD-42", { exact: true })).toBeVisible();
  await expect(page.getByText("Передзвонити перед комплектацією", { exact: true })).toBeVisible();

  const stored = await page.evaluate((key) => window.localStorage.getItem(key), DEALER_WORKFLOW_STORAGE_KEY);
  expect(stored).not.toBeNull();
  const persisted = JSON.parse(stored as string) as {
    orders: Array<{ code: string; creator: string; company: string; po: string }>;
    cart: unknown[];
    builder: { customerId: string };
  };
  expect(persisted.orders[0]).toMatchObject({
    code,
    creator: "Олена Коваль",
    company: "Logos",
    po: "PO-ORD-42",
  });
  expect(persisted.cart).toEqual([]);
  expect(persisted.builder.customerId).toBe("");
});

test("dealer order surfaces fit a 390px viewport without document overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/cart", "/dealer/order-drafts", "/dealer/orders/LOG-01"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    await expect.poll(() => page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }))).toEqual({ scrollWidth: 390, viewportWidth: 390 });
  }
});
