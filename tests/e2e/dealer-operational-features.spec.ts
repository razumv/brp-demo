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

    const unitSummary = page.getByRole("region", { name: "Зведення техніки" });
    await expect(unitSummary.locator(".stat-card").filter({ hasText: "Готово прийняти" }).getByText("0", { exact: true })).toBeVisible();
    await expect(unitSummary.locator(".stat-card").filter({ hasText: "Очікує РН" }).getByText("13", { exact: true })).toBeVisible();
    await expect(unitSummary.locator(".stat-card").filter({ hasText: "Прийнято" }).getByText("0", { exact: true })).toBeVisible();
    await expect(unitSummary.locator(".stat-card").filter({ hasText: "Мої одиниці" }).getByText("13", { exact: true })).toBeVisible();
    await expect(page.getByTestId("unit-result-count")).toHaveCount(0);
    await expect(page.getByText("15 відправок · 13 одиниць", { exact: true })).toHaveCount(0);

    const unitTable = page.getByTestId("unit-desktop-table");
    const shipmentHeader = unitTable.locator("table").first().locator("thead > tr").first();
    await expect(shipmentHeader.getByRole("columnheader").allTextContents()).resolves.toEqual([
      "Розгорнути",
      "Контейнер",
      "Номер BL",
      "Одиниці",
      "ETA",
      "Маршрут",
      "Статус",
      "Дія",
    ]);
    const hamuRow = unitTable.locator("tbody > tr").filter({ hasText: "HAMU4124410" }).first();
    await expect(hamuRow).toContainText("1/4");
    await expect(hamuRow).toContainText("May 11");
    await expect(hamuRow).toContainText("В дорозі");
    await expect(hamuRow).toContainText("Вільний склад");
    const ffauRow = unitTable.locator("tbody > tr").filter({ hasText: "FFAU6292730" }).first();
    await expect(ffauRow).toContainText("2/12");
    await expect(ffauRow).toContainText("2 чекає РН");
    await expect(unitTable.getByRole("columnheader", { name: "#" })).toBeVisible();
    await expect(unitTable.getByText("RD SPYDER F3 LTD 1330 SE6 RD S", { exact: true })).toBeVisible();

    const disclosure = page.getByRole("button", { name: "Згорнути контейнер HAMU4124410" });
    await disclosure.click();
    const closedDisclosure = page.getByRole("button", { name: "Розгорнути контейнер HAMU4124410" });
    await closedDisclosure.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Згорнути контейнер HAMU4124410" })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Розгорнути контейнер HAMU4124410" })).toBeFocused();

    await page.getByRole("searchbox", { name: /Пошук техніки/ }).fill("CANYON REDR");
    await expect(unitTable.getByText("RD CANYON REDR 1330 SE6 GN EU", { exact: true })).toBeVisible();
    await expect(unitTable.getByText("RD SPYDER F3 LTD 1330 SE6 RD S", { exact: true })).toHaveCount(0);
    await page.getByRole("searchbox", { name: /Пошук техніки/ }).fill("");

    await page.getByRole("button", { name: "Фільтри техніки" }).click();
    await page.getByLabel("Дія").selectOption("awaiting_registration");
    await expect(unitTable.getByText(/чекає РН/).first()).toBeVisible();
    await page.getByRole("button", { name: "Скинути фільтри" }).click();
    await expect(unitTable.getByText("RD SPYDER F3 LTD 1330 SE6 RD S", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /прийняти|змінити статус|продати|відправити|синхронізувати/i })).toHaveCount(0);

    await openDealerRoute(page, "/dealer/schedule", "Графік поставки", dealerSessionOptions);
    await expect(page.getByTestId("schedule-timeframe")).toHaveText("липень — жовтень 2026");
    await expect(page.getByTestId("schedule-result-count")).toHaveText("4 слоти · 28 одиниць · 8 вільно");
    await page.getByRole("searchbox", { name: "Пошук у графіку поставки" }).fill("Manta Green");
    await expect(page.getByTestId("schedule-result-count")).toHaveText("1 слот · 7 одиниць · 1 вільно");
    await expect(page.getByRole("button", { name: /Sea-Doo липень 2026/ })).toBeVisible();
  });

  test("schedule timeline can be collapsed and keeps its preference after refresh", async ({ page }) => {
    const storageKey = "brp-clone-ui-v1:collapsible:dealer.schedule.timeline";
    await loginAsDealer(page, dealerSessionOptions);
    await openDealerRoute(page, "/dealer/schedule", "Графік поставки", dealerSessionOptions);
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
    await page.reload();

    const trigger = page.getByRole("button", { name: "Хронологія прибуття" });
    const timeline = page.getByRole("region", { name: "Хронологія прибуття" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(timeline.getByText("липень", { exact: true })).toBeVisible();

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(timeline).toHaveAttribute("data-closed", "");
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBe("0");

    await page.reload();
    await expect(page.getByRole("button", { name: "Хронологія прибуття" })).toHaveAttribute("aria-expanded", "false");
  });

  test("workshop persists an accessible local status transition and BossWeb reports local lookup states", async ({ page }) => {
    await loginAsDealer(page, { ...dealerSessionOptions, assertIdentity: false });
    await openDealerRoute(page, "/dealer/workshop", "Майстерня", dealerSessionOptions);

    await expect(page.getByText(/підтверджено лише створення нового замовлення-наряду/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Зміна статусу недоступна" })).toHaveCount(0);
    await expect(page.locator('[data-workshop-dropzone]')).toHaveCount(4);
    await expect(page.getByText(/демонстрац|тестов|середовищ/i)).toHaveCount(0);
    await page.getByRole("button", { name: "Нове замовлення-наряд" }).click();
    await page.getByLabel("Опис *").fill("Сезонне технічне обслуговування");
    await page.getByLabel("Механік").fill("Олексій");
    await page.getByLabel("Нотатки").fill("Терміново до п’ятниці");
    await page.getByRole("button", { name: "Створити замовлення-наряд" }).click();
    await expect(page.getByRole("status")).toHaveText("Замовлення-наряд створено.");
    const workshopCard = page.getByRole("article").filter({ hasText: "Сезонне технічне обслуговування" });
    await expect(workshopCard).toBeVisible();
    await expect(workshopCard).toHaveAttribute("draggable", "true");

    const workshopSearch = page.getByRole("searchbox", { name: /Пошук у майстерні/ });
    for (const query of ["Сезонне", "Клієнт Logos", "Олексій", "Терміново"]) {
      await workshopSearch.fill(query);
      await expect(page.getByTestId("workshop-result-count")).toHaveCount(0);
      await expect(workshopCard).toBeVisible();
    }
    await workshopSearch.fill("");
    await page.getByRole("button", { name: "Фільтри майстерні" }).click();
    await page.getByLabel("Етап").selectOption("scheduled");
    await expect(workshopCard).toHaveCount(0);
    await page.getByLabel("Етап").selectOption("new");
    await page.getByLabel("Тип роботи").selectOption("maintenance");
    await expect(workshopCard).toBeVisible();
    await page.getByRole("button", { name: "Скинути фільтри" }).click();

    const newColumn = page.getByTestId("workshop-column").nth(0);
    const scheduledColumn = page.getByTestId("workshop-column").nth(1);
    await workshopCard.getByLabel("Перемістити Сезонне технічне обслуговування").selectOption("scheduled");
    await expect(newColumn).not.toContainText("Сезонне технічне обслуговування");
    await expect(scheduledColumn).toContainText("Сезонне технічне обслуговування");
    await expect.poll(async () => page.evaluate((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      return (JSON.parse(raw) as { workshopOrders?: Array<{ description: string; status: string }> }).workshopOrders ?? [];
    }, dealerStorageKey)).toContainEqual(expect.objectContaining({
      description: "Сезонне технічне обслуговування",
      status: "scheduled",
    }));

    await page.reload();
    await expect(page.getByRole("article").filter({ hasText: "Сезонне технічне обслуговування" })).toBeVisible();
    await page.goto("/");
    const dashboardSummary = page.getByRole("region", { name: "Додаткові показники" });
    await expect(dashboardSummary.getByText("Робіт у майстерні").locator("..")).toContainText("1");

    await openDealerRoute(page, "/dealer/bossweb", "Пошук запчастин", dealerSessionOptions);
    await expect(page.getByText("Перевіряйте номер запчастини у довіднику перед створенням замовлення.", { exact: true })).toBeVisible();
    await expect(page.getByText("Дані про онлайн-наявність BossWeb, заміни та ETA стануть доступні після підключення сервісу.", { exact: true })).toBeVisible();
    await expect(page.getByText("COOLANT,EXT LIFE", { exact: true })).toBeVisible();
    await expect(page.getByText(/локальн(ому|ий) довідник/i)).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Номер запчастини" }).fill("0000000");
    await expect(page.getByText("Запчастину не знайдено")).toBeVisible();
    expect(await page.getByRole("status").count()).toBe(0);
    await expect(page.getByRole("heading", { name: "Запчастину не знайдено" })).toBeVisible();
    await expect(page.getByText(/для демонстрації|онлайн-пошук виконується/i)).toHaveCount(0);
  });

  test("workshop keeps a failed durable create out of the board", async ({ page }) => {
    await page.addInitScript((storageKey) => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key, value) {
        if (key === storageKey && window.sessionStorage.getItem("block-workshop-write") === "1") {
          throw new Error("storage blocked");
        }
        return originalSetItem.call(this, key, value);
      };
    }, dealerStorageKey);
    await loginAsDealer(page, { ...dealerSessionOptions, assertIdentity: false });
    await openDealerRoute(page, "/dealer/workshop", "Майстерня", dealerSessionOptions);
    await page.evaluate(() => window.sessionStorage.setItem("block-workshop-write", "1"));

    await page.getByRole("button", { name: "Нове замовлення-наряд" }).click();
    await page.getByLabel("Опис *").fill("Робота без збереження");
    await page.getByRole("button", { name: "Створити замовлення-наряд" }).click();

    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Не вдалося зберегти зміни на пристрої.");
    await expect(page.getByText("Замовлення-наряд створено.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Робота без збереження" })).toHaveCount(0);
  });

  test("workshop rolls back a failed durable stage transition", async ({ page }) => {
    await page.addInitScript((storageKey) => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key, value) {
        if (key === storageKey && window.sessionStorage.getItem("block-workshop-write") === "1") {
          throw new Error("storage blocked");
        }
        return originalSetItem.call(this, key, value);
      };
    }, dealerStorageKey);
    await loginAsDealer(page, { ...dealerSessionOptions, assertIdentity: false });
    await openDealerRoute(page, "/dealer/workshop", "Майстерня", dealerSessionOptions);
    await page.getByRole("button", { name: "Нове замовлення-наряд" }).click();
    await page.getByLabel("Опис *").fill("Перевірка rollback");
    await page.getByRole("button", { name: "Створити замовлення-наряд" }).click();

    const card = page.getByRole("article").filter({ hasText: "Перевірка rollback" });
    await expect(card).toBeVisible();
    await page.evaluate(() => window.sessionStorage.setItem("block-workshop-write", "1"));
    await card.getByLabel("Перемістити Перевірка rollback").selectOption("scheduled");

    await expect(page.getByText("Не вдалося зберегти зміну етапу на пристрої.", {exact: true})).toBeVisible();
    await expect(page.getByTestId("workshop-column").nth(0)).toContainText("Перевірка rollback");
    await expect(page.getByTestId("workshop-column").nth(1)).not.toContainText("Перевірка rollback");
    await expect.poll(async () => page.evaluate((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      return (JSON.parse(raw) as {workshopOrders?: Array<{description: string; status: string}>})
        .workshopOrders?.find((order) => order.description === "Перевірка rollback")?.status ?? null;
    }, dealerStorageKey)).toBe("new");
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
