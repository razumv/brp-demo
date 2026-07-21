import { expect, test } from "@playwright/test";
import {
  DEALER_WORKFLOW_STORAGE_KEY,
  seedDealerWorkflowSession,
} from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

test("order note, message, attachment metadata, and timeline persist", async ({ page }) => {
  await page.goto("/dealer/orders/LOG-01");
  await expect(page.getByRole("heading", { name: "LOG-01", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Моя нотатка|Уточнити сумісність/ }).first().click();
  const lineNote = page.getByLabel(/Приватна нотатка/).first();
  await lineNote.fill("Перевірити сумісність перед комплектацією");
  await page.getByRole("button", { name: "Зберегти" }).first().click();

  await page.locator('input[type="file"]').setInputFiles({
    name: "request.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("metadata-only-check"),
  });
  await page
    .getByRole("textbox", { name: "Повідомлення", exact: true })
    .fill("Уточніть строк поставки");
  await page.getByRole("button", { name: "Додати повідомлення" }).click();
  await expect(page.getByText("Уточніть строк поставки", { exact: true })).toBeVisible();
  await expect(page.getByText("request.pdf", { exact: true })).toBeVisible();

  const timeline = page.getByRole("button", { name: /Хронологія \d+/ }).first();
  if ((await timeline.getAttribute("aria-expanded")) !== "true") await timeline.click();
  await expect(page.getByText("Нотатку оновлено", { exact: true })).toBeVisible();
  await expect(page.getByText("Повідомлення додано", { exact: true })).toBeVisible();

  const stored = await page.evaluate((key) => window.localStorage.getItem(key), DEALER_WORKFLOW_STORAGE_KEY);
  expect(stored).toContain("request.pdf");
  expect(stored).not.toContain("metadata-only-check");
  expect(stored).not.toContain("data:application/pdf");

  await page.reload();
  await expect(page.getByText("Перевірити сумісність перед комплектацією", { exact: true })).toBeVisible();
  await expect(page.getByText("Уточніть строк поставки", { exact: true })).toBeVisible();
  await expect(page.getByText("request.pdf", { exact: true })).toBeVisible();
});
