import { expect, test } from "@playwright/test";

test("an ordinary dealer email opens the dealer portal", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("user01@example.invalid");
  await page.locator('input[type="password"]').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();

  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:3000\/$/);
  await expect(page.getByRole("heading", { name: "Головна" })).toBeVisible();
  await expect(page.getByText("Razumv Admin", { exact: true })).toHaveCount(0);

  await page.goto("/dealer/orders");
  await expect(page).toHaveURL(/\/dealer\/orders\/?$/);
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
});

test("an explicit admin email keeps the manager portal", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.locator('input[type="password"]').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();

  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByText("Razumv Admin", { exact: true }).first()).toBeVisible();
});
