import { expect, test, type Page } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import { dealerWorkflowStorageKey } from "@/lib/dealer/identity";
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

test("desktop global search keeps source counts and adds quantity three with metadata", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("combobox", { name: "Глобальний пошук запчастин" }).fill("507");
  const results = page.getByRole("dialog", { name: "Результати пошуку запчастин" });
  await expect(results).toBeVisible();
  await expect(results.getByRole("tab", { name: "Усі (10)" })).toHaveAttribute("aria-selected", "true");
  await expect(results.getByRole("tab", { name: "В наявності (1)" })).toBeVisible();
  await expect(results.getByRole("tab", { name: "В дорозі (0)" })).toBeVisible();
  await expect(results.getByRole("tab", { name: "Замовлено (0)" })).toBeVisible();
  await expect(results.getByRole("tab", { name: "Під замовлення (9)" })).toBeVisible();

  const part = results.locator("article").filter({ hasText: "507032473" });
  await expect(part.getByText("PAD_BRAKE KIT", { exact: true })).toBeVisible();
  await expect(part.getByText("3 в наявності", { exact: true })).toBeVisible();
  await part.getByRole("button", { name: "Збільшити кількість 507032473" }).click();
  await part.getByRole("button", { name: "Збільшити кількість 507032473" }).click();
  await part.getByRole("button", { name: "Додати 507032473 до кошика" }).click();

  await expect.poll(async () => {
    const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), DEALER_STORAGE_KEY);
    const cart = persisted ? (JSON.parse(persisted) as DealerLocalState).cart : [];
    return cart[0];
  }).toEqual(expect.objectContaining({
    partNumber: "507032473",
    quantity: 3,
  }));
  await expect(part.getByText("Додано", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Кошик (3)" }).click();
  await page.getByRole("dialog", { name: "Кошик" }).getByRole("button", { name: "Оформити замовлення" }).click();
  const cartLine = page.locator("article").filter({ hasText: "507032473" });
  await expect(cartLine.getByText("PAD_BRAKE KIT", { exact: true })).toBeVisible();
  await expect(cartLine.getByText("$51.29", { exact: true })).toBeVisible();
  await expect(cartLine.locator(".quantity-control").getByText("3", { exact: true })).toBeVisible();
});

test("availability tabs show neutral empty state and clear resets the search", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Глобальний пошук запчастин" });
  await search.fill("507");
  const results = page.getByRole("dialog", { name: "Результати пошуку запчастин" });

  await results.getByRole("tab", { name: "В дорозі (0)" }).click();
  await expect(results.getByText("Немає результатів для цього фільтра.", { exact: true })).toBeVisible();
  await expect(results.getByText(/демо|тестов|локальн/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Очистити пошук" }).click();
  await expect(search).toHaveValue("");
  await expect(results).toHaveCount(0);

  await search.fill("507");
  await expect(page.getByRole("dialog", { name: "Результати пошуку запчастин" }).getByRole("tab", { name: "Усі (10)" })).toHaveAttribute("aria-selected", "true");
});

test("mobile search traps focus, closes on Escape, and returns focus to its trigger", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Пошук", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Пошук запчастин" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("combobox", { name: "Глобальний пошук запчастин" });
  await expect(input).toBeFocused();
  await input.fill("507");
  await expect(dialog.getByText("507032473", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
