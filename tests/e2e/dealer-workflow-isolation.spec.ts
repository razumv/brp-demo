import { expect, test, type Page } from "@playwright/test";
import { dealerWorkflowStorageKey } from "@/lib/dealer/identity";
import {
  DEALER_WORKFLOW_STORAGE_KEY,
  seedDealerWorkflowSession,
} from "./support/dealer-workflow-session";

const SHARED_STORAGE_KEY = "brp-clone-demo-state-v1";
const firstIdentity = {
  email: "orders@logos.ua",
  displayName: "Олена Коваль",
  company: "Logos",
} as const;
const secondIdentity = {
  email: "operator@other.ua",
  displayName: "Інший оператор",
  company: "Other Dealer",
} as const;

async function switchDealer(
  page: Page,
  identity: typeof firstIdentity | typeof secondIdentity,
) {
  await page.evaluate(({ key, nextIdentity }) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error("Shared session is missing");
    const state = JSON.parse(raw) as Record<string, unknown>;
    state.session = {
      role: "dealer",
      ...nextIdentity,
      remember: true,
      expiresAt: "2099-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(key, JSON.stringify(state));
  }, { key: SHARED_STORAGE_KEY, nextIdentity: identity });
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

test("switching dealer identities never exposes the previous dealer state", async ({ page }) => {
  await page.goto("/dealer/orders");
  await expect(page.getByText("LOG-01", { exact: true })).toBeVisible();

  await switchDealer(page, secondIdentity);
  await expect(page.getByRole("heading", { name: "Замовлень поки немає" })).toBeVisible();
  await expect(page.getByText("LOG-01", { exact: true })).toHaveCount(0);

  const secondKey = dealerWorkflowStorageKey(secondIdentity);
  const secondState = await page.evaluate((key) => window.localStorage.getItem(key), secondKey);
  expect(secondState).not.toContain("LOG-01");

  await switchDealer(page, firstIdentity);
  await expect(page.getByText("LOG-01", { exact: true })).toBeVisible();
});

test("corrupt persisted state is replaced safely and an unknown cart line remains removable", async ({ page }) => {
  const storageKey = dealerWorkflowStorageKey(firstIdentity);
  await page.goto("/dealer/orders");
  await expect(page.getByText("LOG-01", { exact: true })).toBeVisible();

  await page.evaluate((key) => window.localStorage.setItem(key, "{not-json"), storageKey);
  await page.reload();
  await expect(page.getByText("LOG-01", { exact: true })).toBeVisible();

  await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) throw new Error("Dealer state is missing");
    const state = JSON.parse(raw) as { cart: Array<{ partNumber: string; quantity: number }> };
    state.cart = [{ partNumber: "REMOVED-SKU", quantity: 1 }];
    window.localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.goto("/cart");
  await expect(page.getByText("Позиція більше не доступна в каталозі.")).toBeVisible();
  await page.getByRole("button", { name: "Видалити недоступну позицію REMOVED-SKU" }).click();
  await expect(page.getByRole("heading", { name: "Кошик порожній" })).toBeVisible();
});

test("blocked dealer storage hydration still reaches the working dealer page", async ({ page }) => {
  await page.addInitScript((dealerKey) => {
    const originalGetItem = Storage.prototype.getItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.getItem = function getItem(key) {
      if (key === dealerKey) throw new Error("storage blocked");
      return originalGetItem.call(this, key);
    };
    Storage.prototype.removeItem = function removeItem(key) {
      if (key === dealerKey) throw new Error("storage blocked");
      return originalRemoveItem.call(this, key);
    };
  }, DEALER_WORKFLOW_STORAGE_KEY);

  await page.goto("/dealer/orders");

  await expect(page.getByText("LOG-01", { exact: true })).toBeVisible();
  await expect(page.getByText("Завантажуємо робочі дані…")).toHaveCount(0);
});

test("blocked dealer persistence keeps the cart unchanged and reports a retryable failure", async ({ page }) => {
  await page.addInitScript((dealerKey) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === dealerKey) throw new Error("storage blocked");
      return originalSetItem.call(this, key, value);
    };
  }, DEALER_WORKFLOW_STORAGE_KEY);

  await page.goto("/");
  await page.getByRole("combobox", { name: "Глобальний пошук запчастин" }).fill("507032473");
  await page.getByRole("button", { name: "Додати 507032473 до кошика" }).click();

  await expect(page.getByText("Повторити", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Кошик (0)" })).toBeVisible();
});
