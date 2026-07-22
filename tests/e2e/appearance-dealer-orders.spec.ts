import {expect, test, type Page} from "@playwright/test";
import {seedDealerWorkflowSession} from "./support/dealer-workflow-session";

async function seedAstryx(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "light",
    }));
  });
}

test.beforeEach(async ({page}) => {
  await seedDealerWorkflowSession(page);
  await seedAstryx(page);
});

test("dealer order lifecycle inherits Astryx controls", async ({page}) => {
  await page.goto("/cart");
  await expect(page.locator('[data-dealer-cart-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Назва чернетки"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Зберегти чернетку"})).toBeVisible();

  await page.goto("/dealer/orders");
  await expect(page.locator('[data-dealer-orders-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук замовлень"})).toBeVisible();

  await page.goto("/dealer/orders/LOG-01");
  await expect(page.locator('[data-dealer-order-detail-renderer="astryx"]')).toHaveCount(1);
});

test("cart builder state survives a live appearance switch", async ({page}) => {
  await page.goto("/cart");
  await page.getByRole("textbox", {name: "Назва чернетки"}).fill("Поточний сервісний кошик");
  await page.getByRole("textbox", {name: "Номер запчастини"}).fill("422280226");

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({version: 1, designSystem: "shadcn", colorMode: "dark"});
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", {key, newValue, storageArea: window.localStorage}));
  });

  await expect(page.locator('[data-dealer-cart-renderer="shadcn"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Назва чернетки"})).toHaveValue("Поточний сервісний кошик");
  await expect(page.getByRole("textbox", {name: "Номер запчастини"})).toHaveValue("422280226");
});
