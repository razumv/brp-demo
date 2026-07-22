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

test("selected-model diagrams support count, search, fallback media, and original navigation", async ({ page }) => {
  await page.goto("/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603");

  const gallery = page.getByRole("region", { name: "Схеми моделі" });
  const query = page.getByRole("searchbox", { name: "Пошук схем" });
  await expect(gallery.getByRole("link")).toHaveCount(41);
  await expect(page.getByText("Знайдено 41 із 41 схем", { exact: true })).toBeVisible();

  const thumbnail = gallery.getByRole("img", {
    name: "Мініатюра схеми 00- Service - Maintenance Parts & Fluids",
  });
  await expect(thumbnail).toHaveAttribute("loading", "lazy");
  await expect(gallery.locator('[data-diagram-thumbnail="fallback"]')).toHaveCount(40);
  await expect(gallery.locator('[data-diagram-media]').first()).toHaveCSS("aspect-ratio", "16 / 10");

  await query.fill("ENGINE cooling");
  await expect(gallery.getByRole("link")).toHaveCount(1);
  await expect(gallery.getByRole("link", { name: /02- Engine Cooling/ })).toBeVisible();

  await query.fill("not a diagram");
  await expect(page.getByText("Схем за цим запитом не знайдено.", { exact: true })).toBeVisible();

  await query.fill("09- brakes");
  await gallery.getByRole("link", { name: /09- Brakes/ }).click();
  await expect(page).toHaveURL(/062bdf9d-05c3-470a-a043-8d10bd287a25\?diagram=10$/);
  await expect(page.getByRole("heading", { name: "09- Brakes" })).toBeVisible();
});

test("all accessory families use lazy repository-owned brand artwork", async ({ page }) => {
  await page.goto("/dealer/accessories");

  const families = page.getByLabel("Сімейства аксесуарів");
  for (const family of ["Can-Am Off-Road", "Can-Am On-Road", "Sea-Doo", "Ski-Doo"]) {
    const image = families.getByRole("img", { name: `${family} — логотип сімейства` });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("loading", "lazy");
    const imageSource = await image.getAttribute("src");
    expect(decodeURIComponent(imageSource ?? "")).toContain("/images/catalog/");
  }

  await families.getByRole("button", { name: /^Ski-Doo/ }).click();
  await expect(page.getByRole("button", { name: /LinQ Adventure Tunnel Bag/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Advex Helmet LED Utility Light/ })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Пошук аксесуарів" }).fill("860202447");
  await expect(page.getByRole("button", { name: /LinQ Adventure Tunnel Bag/ })).toBeVisible();
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

test("source-style vehicle and product facets filter the same collection", async ({ page }) => {
  await page.goto("/dealer/accessories");

  await expect(page.getByLabel("Сімейства аксесуарів").getByRole("button", { name: /^Can-Am Off-Road/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "За моделлю" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "За VIN" })).toBeDisabled();
  await expect(page.getByText("Підбір за VIN поки недоступний. Використовуйте модель, комплектацію та двигун.", { exact: true })).toBeVisible();

  const year = page.getByLabel("Рік техніки");
  const model = page.getByLabel("Модель техніки");
  const trim = page.getByLabel("Комплектація техніки");
  const engine = page.getByLabel("Двигун техніки");

  await expect(model).toBeDisabled();
  await expect(trim).toBeDisabled();
  await expect(engine).toBeDisabled();

  await year.selectOption("2026");
  await expect(model).toBeEnabled();
  await model.selectOption("Outlander");
  await expect(trim).toBeEnabled();
  await trim.selectOption("MAX XT");
  await expect(engine).toBeEnabled();
  await engine.selectOption("Rotax 1000R");
  await page.getByLabel("Категорія товару").selectOption("Lighting");

  await expect(page.getByRole("button", { name: /Advex Helmet LED Utility Light/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /XPS Extended Life Coolant/ })).toHaveCount(0);

  await year.selectOption("2025");
  await expect(model).toHaveValue("all");
  await expect(trim).toBeDisabled();
  await expect(trim).toHaveValue("all");
  await expect(engine).toBeDisabled();

  await page.getByLabel("Outlander").check();
  await page.getByLabel("Utility").check();
  await page.getByLabel("Наявність").selectOption("in-stock");
  await page.getByRole("searchbox", { name: "Пошук аксесуарів" }).fill("929085");
  await page.getByLabel("Сортування", { exact: true }).selectOption("price-asc");

  await expect(page.getByRole("button", { name: /Advex Helmet LED Utility Light/ })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "В наявності · 1" })).toBeVisible();
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
  const filterToggle = page.getByRole("button", { name: "Фільтри аксесуарів" });
  await expect(filterToggle).toHaveCount(1);
  await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Рік техніки")).toBeHidden();
  await expect(page.getByLabel("Категорія товару")).toBeHidden();
  await filterToggle.click();
  await expect(page.getByLabel("Рік техніки")).toBeVisible();
  await expect(page.getByLabel("Рік техніки")).toBeFocused();
  await expect(page.getByLabel("Модель техніки")).toBeVisible();
  await expect(page.getByLabel("Категорія товару")).toBeVisible();
  await expect(page.getByLabel("Сортування фільтрів")).toBeVisible();
  const expandedOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(expandedOverflow).toBeLessThanOrEqual(1);
});
