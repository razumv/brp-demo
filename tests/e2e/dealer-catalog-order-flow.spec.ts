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
  await expect(page).toHaveURL(/\/dealer\/order-detail\?id=dealer-order-/, { timeout: 15_000 });
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

test("catalog overview states use product copy without environment labels", async ({ page }) => {
  const forbiddenCopy = /demo|демо|демонстрац|тестов|environment/i;

  await page.goto("/catalog/CAN_ONR_EN_US");
  await expect(page.getByRole("heading", { name: "CAN-AM ON-ROAD" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(forbiddenCopy);

  await page.goto("/catalog/CAN_OFF_EN_US/7560bdc0-e7f3-4d84-9812-b8ecb55d948a");
  await expect(page.getByLabel("Категорії").locator('[aria-current="page"]')).toHaveText("Can-Am ATV");
  await expect(page.getByRole("button", { name: "Can-Am ATV", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Accessories", exact: true }).click();
  await expect(page).toHaveURL(/\/dealer\/accessories$/);
  await expect(page.getByRole("heading", { name: "Каталог аксесуарів" })).toBeVisible();

  await page.goto("/catalog/CAN_OFF_EN_US/7560bdc0-e7f3-4d84-9812-b8ecb55d948a");
  await page.getByRole("button", { name: "2025", exact: true }).click();
  await expect(page.locator("main")).not.toContainText(forbiddenCopy);

  await page.goto("/catalog/CAN_OFF_EN_US/sxs");
  await expect(page.getByRole("region", { name: "Навігація каталогу" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(forbiddenCopy);
});

test("SXS catalog preserves the source five-column selection in the URL", async ({ page }) => {
  await page.goto("/catalog/CAN_OFF_EN_US");
  await page.getByRole("link", { name: "Can-Am SXS" }).click();
  const cascade = page.getByRole("region", { name: "Навігація каталогу" });
  await cascade.getByRole("link", { name: "2021", exact: true }).click();
  await cascade.getByRole("link", { name: "005 - SSV - North America - Maverick Trail Series", exact: true }).click();
  await cascade.getByRole("link", { name: "002 - Maverick Trail 1000 - BASE_DPS - North America, 2021", exact: true }).click();

  await expect(cascade.locator("[data-catalog-column]")).toHaveCount(5);
  await expect(cascade.getByText("01- Rotax - Crankcase", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/catalog\/CAN_OFF_EN_US\/sxs\?year=2021&series=005&model=002$/);

  for (const selectedLabel of [
    "Can-Am SXS",
    "2021",
    "005 - SSV - North America - Maverick Trail Series",
    "002 - Maverick Trail 1000 - BASE_DPS - North America, 2021",
  ]) {
    await expect(cascade.getByRole("link", { name: selectedLabel, exact: true })).toHaveAttribute("aria-current", "page");
  }

  const breadcrumb = page.getByRole("navigation", { name: "Хлібні крихти" });
  await expect(breadcrumb).toContainText("Can-Am Off-Road");
  await expect(breadcrumb).toContainText("Can-Am SXS");
  await expect(breadcrumb).toContainText("2021");
  await expect(breadcrumb).toContainText("005 - SSV - North America - Maverick Trail Series");
  await expect(breadcrumb).toContainText("002 - Maverick Trail 1000 - BASE_DPS - North America, 2021");

  await page.reload();
  await expect(cascade.locator("[data-catalog-column]")).toHaveCount(5);
  await expect(cascade.getByRole("link", { name: "002 - Maverick Trail 1000 - BASE_DPS - North America, 2021", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(breadcrumb).toContainText("002 - Maverick Trail 1000 - BASE_DPS - North America, 2021");
});

test("catalog selection changes clear invalid downstream descendants", async ({ page }) => {
  await page.goto("/catalog/CAN_OFF_EN_US/sxs?year=2021&series=005&model=002");

  const cascade = page.getByRole("region", { name: "Навігація каталогу" });
  await page.getByRole("link", { name: "001 - Maverick Trail 800 - BASE_DPS - North America, 2021", exact: true }).click();
  await expect(page).toHaveURL(/series=005&model=001$/);
  await expect(cascade.getByText("01- Rotax - Crankcase", { exact: true })).toHaveCount(0);
  await expect(cascade.locator('[aria-current="page"]', { hasText: "001 - Maverick Trail 800" })).toHaveCount(1);

  await page.getByRole("link", { name: "011 - SSV - CE - Traxter Series", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\/CAN_OFF_EN_US\/sxs\?year=2021&series=011$/);
  await expect(cascade.getByText("001 - Maverick Trail 800 - BASE_DPS - North America, 2021", { exact: true })).toHaveCount(0);
  await expect(cascade.getByText("Моделі для цієї серії не підтверджені джерелом.", { exact: true })).toBeVisible();
});

test("legacy ATV 2026 series browsing still opens the supported model route", async ({ page }) => {
  await page.goto("/catalog/CAN_OFF_EN_US/7560bdc0-e7f3-4d84-9812-b8ecb55d948a");
  await page.getByRole("link", { name: "001 - North America - Outlander 500/700 Series", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\/CAN_OFF_EN_US\/152970b5-6fc4-427c-b0c4-0b44f69baa8e\?series=1$/);
  await expect(page.getByRole("heading", { name: "001 - North America - Outlander 500/700 Series" })).toBeVisible();
});

test("five-column catalog contains its horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog/CAN_OFF_EN_US/sxs");

  const cascade = page.getByRole("region", { name: "Навігація каталогу" });
  await expect(cascade.locator("[data-catalog-column]")).toHaveCount(5);
  await expect.poll(() => page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }))).toEqual({ scrollWidth: 390, viewportWidth: 390 });
  await expect.poll(() => cascade.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await expect.poll(() => cascade.locator('[data-catalog-column="diagrams"]').evaluate((element) => ({
    overflowY: window.getComputedStyle(element).overflowY,
    scrollsVertically: element.scrollHeight > element.clientHeight,
  }))).toEqual({ overflowY: "auto", scrollsVertically: true });

  await cascade.getByRole("link", { name: "001 - Maverick Trail 800 - BASE_DPS - North America, 2021", exact: true }).scrollIntoViewIfNeeded();
  await cascade.getByRole("link", { name: "001 - Maverick Trail 800 - BASE_DPS - North America, 2021", exact: true }).click();
  await expect(page).toHaveURL(/model=001$/);
});

test("five catalog columns fit the available dealer content at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalog/CAN_OFF_EN_US/sxs");

  const cascade = page.getByRole("region", { name: "Навігація каталогу" });
  await expect(cascade.locator("[data-catalog-column]")).toHaveCount(5);
  await expect.poll(() => cascade.evaluate((element) => element.scrollWidth === element.clientWidth)).toBe(true);
});
