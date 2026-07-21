import { expect, test, type Page } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState } from "@/lib/types";

const STORAGE_KEY = "brp-clone-demo-state-v1";

async function seedDealer(page: Page) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = {
    role: "dealer",
    email: "dealer@example.invalid",
    displayName: "Финансы",
    company: "Logos",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };
  await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: state });
}

async function openDealerPage(page: Page, path: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();
}

test.beforeEach(async ({ page }) => seedDealer(page));

test("dealer navigation restores the source new-document badge", async ({ page }) => {
  await page.goto("/dealer/documents");
  await expect(page.locator('.role-nav a[href$="/dealer/documents"] .nav-badge')).toHaveText("5");
});

test("secondary data pages render their deterministic records on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of ["/dealer/documents", "/dealer/consignment", "/dealer/settlements", "/dealer/parts-inventory", "/dealer/network", "/dealer/parts-report"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("region").first()).toBeVisible();
  }
});

test("documents filter typed rows with the shared toolbar and omit export", async ({ page }) => {
  await openDealerPage(page, "/dealer/documents");
  const trigger = page.getByRole("button", { name: "Фільтри", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Пошук документів").fill("INV-2026-001");
  await expect(page.getByText("INV-2026-001", { exact: true })).toBeVisible();
  await expect(page.getByText("1 документ", { exact: true })).toBeVisible();
  await trigger.click();
  await page.getByLabel("Тип документа").selectOption("invoice");
  await page.getByLabel("Статус документа").selectOption("paid");
  await expect(trigger).toHaveText("2");
  await expect(page.getByRole("button", { name: "Експорт", exact: true })).toHaveCount(0);
});

test("consignment, inventory, and network retain local filters without unsupported mutations", async ({ page }) => {
  await openDealerPage(page, "/dealer/consignment");
  await expect(page.getByText("Локальний перегляд форми без відправлення")).toHaveCount(0);
  await page.getByRole("tab", { name: "Мережа" }).click();
  await page.getByLabel("Пошук консигнації").fill("Belt");
  await expect(page.getByText("BELT-V", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Фільтри", exact: true }).click();
  await page.getByLabel("Фільтр консигнації").selectOption("available");
  await expect(page.getByText("BELT-V", { exact: true })).toBeVisible();
  await expect(page.getByText("1 позиція", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Створити запит" })).toHaveCount(0);
  await expect(page.getByText("Відправлення запиту недоступне.", { exact: true })).toHaveCount(0);

  await openDealerPage(page, "/dealer/parts-inventory");
  await page.getByRole("button", { name: "Фільтри", exact: true }).click();
  await page.getByLabel("Фільтр запасу").selectOption("low");
  await expect(page.getByText("AIR FILTER WITH PRE FILTER", { exact: true })).toBeVisible();

  await openDealerPage(page, "/dealer/network");
  await page.getByRole("tab", { name: "Техніка" }).click();
  await page.getByLabel("Пошук мережі").fill("Outlander");
  await expect(page.getByText("Outlander MAX XT", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Фільтри", exact: true }).click();
  await page.getByLabel("Дилер мережі").selectOption("Logos");
  await expect(page.getByText("Outlander MAX XT", { exact: true })).toBeVisible();
});

test("settlements and Parts Report derive visible rows from deterministic ledgers and order state", async ({ page }) => {
  await openDealerPage(page, "/dealer/settlements");
  await page.getByRole("button", { name: "Фільтри", exact: true }).click();
  await page.getByLabel("Період взаєморозрахунків").selectOption("90");
  await page.getByLabel("Пошук взаєморозрахунків").fill("INV-2026-001");
  await expect(page.getByText("INV-2026-001", { exact: true })).toBeVisible();
  await expect(page.getByText("1 рух", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Оновити баланс", exact: true })).toHaveCount(0);

  await openDealerPage(page, "/dealer/parts-report");
  await page.getByLabel("Пошук звіту запчастин").fill("LOG-01");
  await expect(page.getByText("LOG-01", { exact: true })).toBeVisible();
  await expect(page.getByText("1 замовлення", { exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Статус" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Експорт", exact: true })).toHaveCount(0);
});
