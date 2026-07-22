import { expect, test, type Page } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState, Session } from "@/lib/types";

const STORAGE_KEY = "brp-clone-demo-state-v1";

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill(email);
  await page.locator('input[type="password"]:visible').fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
}

async function seedDealerSession(page: Page, session: Session) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = session;
  await page.addInitScript(({ storageKey, persistedState }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(persistedState));
  }, { storageKey: STORAGE_KEY, persistedState: state });
}

test("login exposes only supported account actions", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Зареєструватися" })).toHaveCount(0);
  await expect(page.getByText(/demo mode|демо-режим|brp-dev1|localStorage/i)).toHaveCount(0);
});

test("ordinary credentials create the shared Logos identity without storing the password", async ({ page }) => {
  const password = "storage-secret-7f4a";
  await submitLogin(page, "USER.ONE@EXAMPLE.INVALID", password);

  await expect(page).toHaveURL(/\/$/);
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

  await page.goto("/dealer/orders");
  await expect(page).toHaveURL(/\/dealer\/orders\/?$/);
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
});

test("different ordinary emails resolve to the same dealer profile", async ({ page }) => {
  await submitLogin(page, "another.dealer@example.invalid", "not-persisted");
  await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();
});

test("dealer shell renders identity supplied by the stored session", async ({ page }) => {
  await seedDealerSession(page, {
    role: "dealer",
    email: "operator@backend.invalid",
    displayName: "Backend Operator",
    company: "Backend Dealer",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  });

  await page.goto("/");
  await expect(page.locator(".profile-summary").getByText("Backend Operator", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Backend Dealer", { exact: true })).toBeVisible();
});

test("dealer profile has no local demo-data reset action", async ({ page }) => {
  await submitLogin(page, "dealer@example.invalid", "not-persisted");
  await page.getByRole("button", { name: "Профіль" }).click();
  await expect(page.getByRole("button", { name: /Скинути демо-дані/i })).toHaveCount(0);
});

test("an explicit admin email keeps the manager portal", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.locator('input[type="password"]:visible').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();

  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByText("Razumv Admin", { exact: true }).first()).toBeVisible();
});
