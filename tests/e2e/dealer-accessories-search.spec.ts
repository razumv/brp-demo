import { expect, test, type Page } from "@playwright/test";
import { dealerWorkflowStorageKey } from "@/lib/dealer/identity";
import { initialDemoState } from "@/lib/mock-data";
import type { DealerLocalState } from "@/lib/dealer/contracts";
import type { DemoState } from "@/lib/types";

const STORAGE_KEY = "brp-clone-demo-state-v1";
const DEALER_STORAGE_KEY = dealerWorkflowStorageKey({
  email: "dealer@example.invalid",
  displayName: "Финансы",
  company: "Logos",
});

async function seedDealerSession(page: Page) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.cart = [];
  state.session = {
    role: "dealer",
    email: "dealer@example.invalid",
    displayName: "Финансы",
    company: "Logos",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };

  await page.addInitScript(({ storageKey, persistedState }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(persistedState));
  }, { storageKey: STORAGE_KEY, persistedState: state });
}

test.beforeEach(async ({ page }) => {
  await seedDealerSession(page);
});

test("selected Advex accessory adds its display SKU and proven metadata", async ({ page }) => {
  await page.goto("/dealer/accessories");

  await page.getByRole("button", { name: /Advex Helmet LED Utility Light/ }).click();
  const dialog = page.getByRole("dialog", { name: "Advex Helmet LED Utility Light" });
  await expect(dialog.getByText("929085", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Актуальний артикул: 9290850090", { exact: true })).toBeVisible();
  await expect(dialog.getByText("$92.59", { exact: true })).toBeVisible();
  await expect(dialog.getByText("1 в наявності", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Додати в кошик" }).click();

  await expect.poll(async () => {
    const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), DEALER_STORAGE_KEY);
    const cart = persisted ? (JSON.parse(persisted) as DealerLocalState).cart : [];
    return cart[0];
  }).toEqual(expect.objectContaining({
    partNumber: "929085",
    quantity: 1,
  }));
  await expect(dialog.getByText(/демо|тестов|локальн/i)).toHaveCount(0);

  await dialog.getByRole("button", { name: "Закрити" }).click();
  await page.getByRole("button", { name: "Кошик (1)" }).click();
  await page.getByRole("dialog", { name: "Кошик" }).getByRole("button", { name: "Оформити замовлення" }).click();
  const cartLine = page.locator("article").filter({ hasText: "929085" });
  await expect(cartLine.getByText("Advex Helmet LED Utility Light", { exact: true })).toBeVisible();
  await expect(cartLine.getByText("$92.59", { exact: true }).first()).toBeVisible();
  await expect(cartLine.getByText("Сумісність: Outlander", { exact: true })).toBeVisible();
});

test("family, year, compatibility, purpose, query, stock, and sort filter the same collection", async ({ page }) => {
  await page.goto("/dealer/accessories");

  await page.getByLabel("Категорія").selectOption({ label: "Can-Am Off-Road" });
  await page.getByLabel("Рік").selectOption("2025");
  await page.getByLabel("Outlander").check();
  await page.getByLabel("Utility").check();
  await page.getByLabel("Наявність").selectOption("in-stock");
  await page.getByRole("searchbox", { name: "Пошук аксесуарів" }).fill("929085");
  await page.getByLabel("Сортування").selectOption("price-asc");

  await expect(page.getByRole("button", { name: /Advex Helmet LED Utility Light/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /XPS Extended Life Coolant/ })).toHaveCount(0);

  await page.getByRole("searchbox", { name: "Пошук аксесуарів" }).fill("невідомий артикул");
  await expect(page.getByText("Аксесуарів за цими фільтрами не знайдено.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Очистити фільтри" }).click();
  await expect(page.getByRole("button", { name: /LinQ Rear Cargo Rack/ })).toBeVisible();
});

test("accessory controls fit a 390px viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dealer/accessories");

  await expect(page.getByRole("heading", { name: "Каталог аксесуарів" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("searchbox", { name: "Пошук аксесуарів" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Advex Helmet LED Utility Light/ })).toBeVisible();
  const filterToggle = page.getByRole("button", { name: "Фільтри" });
  await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
  await filterToggle.click();
  await expect(page.getByLabel("Категорія")).toBeVisible();
});
