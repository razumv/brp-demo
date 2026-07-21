import { expect, test, type Page } from "@playwright/test";
import { dealerWorkflowStorageKey } from "@/lib/dealer/identity";
import { loginAsDealer, openDealerRoute } from "./support/dealer-session";

const dealerSessionOptions = process.env.DEALER_E2E_ORIGIN
  ? { origin: process.env.DEALER_E2E_ORIGIN }
  : {};
const dealerStorageKey = dealerWorkflowStorageKey({
  email: "dealer@example.invalid",
  displayName: "Финансы",
  company: "Logos",
});

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    viewport: window.innerWidth,
    width: document.documentElement.scrollWidth,
  }))).toEqual(expect.objectContaining({ viewport: 390, width: 390 }));
}

test.describe("dealer operational features on desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("units and schedule derive their visible results from local records", async ({ page }) => {
    await loginAsDealer(page, dealerSessionOptions);
    await openDealerRoute(page, "/dealer/units", "Техніка", dealerSessionOptions);

    await expect(page.getByTestId("unit-result-count")).toHaveText("9 одиниць · 3 контейнери");
    await page.getByRole("searchbox", { name: "Пошук техніки" }).fill("CANYON REDR");
    await expect(page.getByTestId("unit-result-count")).toHaveText("1 одиниця · 1 контейнер");
    await expect(page.getByTestId("unit-desktop-table").getByText("RD CANYON REDR 1330 SE6 GN EU", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: /Мій склад 3/ }).click();
    await expect(page.getByTestId("unit-result-count")).toHaveText("0 одиниць · 0 контейнерів");
    await expect(page.getByRole("heading", { name: "За цим запитом техніки немає" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Пошук техніки" }).fill("");
    await expect(page.getByTestId("unit-result-count")).toHaveText("3 одиниці · 2 контейнери");

    await openDealerRoute(page, "/dealer/schedule", "Графік поставки", dealerSessionOptions);
    await expect(page.getByTestId("schedule-timeframe")).toHaveText("липень — жовтень 2026");
    await expect(page.getByTestId("schedule-result-count")).toHaveText("4 слоти · 28 одиниць · 8 вільно");
    await page.getByRole("searchbox", { name: "Пошук у графіку поставки" }).fill("Manta Green");
    await expect(page.getByTestId("schedule-result-count")).toHaveText("1 слот · 7 одиниць · 1 вільно");
    await expect(page.getByRole("button", { name: /Sea-Doo липень 2026/ })).toBeVisible();
  });

  test("workshop exposes local creation only and BossWeb reports local lookup states", async ({ page }) => {
    await loginAsDealer(page, { ...dealerSessionOptions, assertIdentity: false });
    await openDealerRoute(page, "/dealer/workshop", "Майстерня", dealerSessionOptions);

    await expect(page.getByText(/підтверджено лише створення нового замовлення-наряду/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Зміна статусу недоступна" }).first()).toBeDisabled();
    await expect(page.getByText(/демонстрац|тестов|середовищ/i)).toHaveCount(0);
    await page.getByRole("button", { name: "Нове замовлення-наряд" }).click();
    await page.getByLabel("Опис *").fill("Сезонне технічне обслуговування");
    await page.getByRole("button", { name: "Створити замовлення-наряд" }).click();
    await expect(page.getByRole("status")).toHaveText("Замовлення-наряд створено.");
    await expect(page.getByRole("heading", { name: "Сезонне технічне обслуговування" })).toBeVisible();
    await expect.poll(async () => page.evaluate((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      return (JSON.parse(raw) as { workshopOrders?: Array<{ description: string }> }).workshopOrders ?? [];
    }, dealerStorageKey)).toContainEqual(expect.objectContaining({
      description: "Сезонне технічне обслуговування",
    }));

    await openDealerRoute(page, "/dealer/bossweb", "Пошук запчастин", dealerSessionOptions);
    await expect(page.getByText("Перевіряйте номер запчастини у локальному довіднику перед створенням замовлення.", { exact: true })).toBeVisible();
    await expect(page.getByText("Пошук виконується лише в локальному довіднику. Онлайн-наявність BossWeb, заміни та ETA не завантажуються.", { exact: true })).toBeVisible();
    await expect(page.getByText("COOLANT,EXT LIFE", { exact: true })).toBeVisible();
    await expect(page.getByText(/лише в локальному довіднику/i)).toBeVisible();
    await page.getByRole("searchbox", { name: "Номер запчастини" }).fill("0000000");
    await page.getByRole("button", { name: "Пошук" }).click();
    expect(await page.getByRole("button", { name: "Пошук" }).isEnabled()).toBe(true);
    expect(await page.getByRole("status").count()).toBe(0);
    await expect(page.getByRole("heading", { name: "Запчастину не знайдено" })).toBeVisible();
    await expect(page.getByText(/для демонстрації|онлайн-пошук виконується/i)).toHaveCount(0);
  });

  test("dashboard reads the same dealer cart as accessories and order creation", async ({ page }) => {
    await loginAsDealer(page, { ...dealerSessionOptions, assertIdentity: false });
    await openDealerRoute(page, "/dealer/accessories", "Каталог аксесуарів", dealerSessionOptions);

    await page.getByRole("button", { name: /Advex Helmet LED Utility Light/ }).click();
    await page.getByRole("dialog", { name: "Advex Helmet LED Utility Light" })
      .getByRole("button", { name: "Додати в кошик" })
      .click();

    await page.goto("/");
    const summary = page.getByRole("region", { name: "Додаткові показники" });
    await expect(summary).toContainText("Позицій у кошику");
    await expect(summary).toContainText("1");
  });
});

test.describe("dealer operational features at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile views stay within the viewport and retain operational detail", async ({ page }) => {
    await loginAsDealer(page, { ...dealerSessionOptions, assertIdentity: false });

    await openDealerRoute(page, "/dealer/units", "Техніка", dealerSessionOptions);
    await expect(page.getByTestId("unit-mobile-list")).toBeVisible();
    await expect(page.getByTestId("unit-mobile-list")).toContainText("Номер BL");
    await expectNoDocumentOverflow(page);

    await openDealerRoute(page, "/dealer/schedule", "Графік поставки", dealerSessionOptions);
    const slot = page.getByRole("button", { name: /Sea-Doo липень 2026/ });
    await expect(slot).toContainText("Прибуття");
    await expect(slot).toContainText("Вільно 1 з 7");
    await slot.click();
    await expect(page.getByRole("dialog")).toContainText("RXT X 325 - Ice Metal / Manta Green");
    await page.getByRole("button", { name: "Закрити" }).click();
    await expectNoDocumentOverflow(page);

    await openDealerRoute(page, "/dealer/workshop", "Майстерня", dealerSessionOptions);
    const columns = page.getByTestId("workshop-column");
    await expect(columns).toHaveCount(4);
    const firstBox = await columns.nth(0).boundingBox();
    const secondBox = await columns.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(secondBox?.y).toBeGreaterThan((firstBox?.y ?? 0) + (firstBox?.height ?? 0) - 1);
    await expectNoDocumentOverflow(page);

    await openDealerRoute(page, "/dealer/bossweb", "Пошук запчастин", dealerSessionOptions);
    await expect(page.getByRole("searchbox", { name: "Номер запчастини" })).toBeVisible();
    await expectNoDocumentOverflow(page);
  });
});
