import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "brp-clone-demo-state-v1";

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
}

test("login exposes only supported account actions", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Зареєструватися" })).toHaveCount(0);
  await expect(page.getByText(/demo mode|демо-режим|brp-dev1|localStorage/i)).toHaveCount(0);
});

test("ordinary credentials create the shared Logos identity without storing the password", async ({ page }) => {
  const password = "storage-secret-7f4a";
  await submitLogin(page, "USER.ONE@EXAMPLE.INVALID", password);

  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:3000\/$/);
  await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();

  await page.waitForFunction(
    (storageKey) => window.localStorage.getItem(storageKey)?.includes("user.one@example.invalid"),
    STORAGE_KEY,
  );
  const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), STORAGE_KEY);
  expect(persisted).not.toBeNull();
  expect(persisted).not.toContain(password);
  const state = JSON.parse(persisted as string) as { session: { email: string; displayName: string; company: string } };
  expect(state.session).toMatchObject({
    email: "user.one@example.invalid",
    displayName: "Финансы",
    company: "Logos",
  });
});

test("different ordinary emails resolve to the same dealer profile", async ({ page }) => {
  await submitLogin(page, "another.dealer@example.invalid", "not-persisted");
  await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();
});

test("an explicit admin email keeps the manager portal", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.locator('input[type="password"]').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();

  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByText("Razumv Admin", { exact: true }).first()).toBeVisible();
});
