import { expect, test, type Page } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import { dealerWorkflowStorageKey } from "@/lib/dealer/identity";
import type { DemoState } from "@/lib/types";

const STORAGE_KEY = "brp-clone-demo-state-v1";
const DEALER_STORAGE_KEY = dealerWorkflowStorageKey({
  email: "dealer@example.invalid",
  displayName: "Финансы",
  company: "Logos",
});
const DIAGRAM_PATH = "/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25";

async function seedDealerSession(page: Page) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
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

test("diagram reports cart success only after the dealer command succeeds", async ({ page }) => {
  await page.goto(DIAGRAM_PATH);

  await page.getByRole("button", { name: "Додати 9779150 до кошика" }).click();

  await expect(page.getByText("9779150 додано", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Кошик (1)" })).toBeVisible();
  await expect.poll(async () => {
    const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), DEALER_STORAGE_KEY);
    return persisted ? (JSON.parse(persisted) as DemoState).cart : [];
  }).toContainEqual(expect.objectContaining({ partNumber: "9779150", quantity: 1 }));
});

test("diagram does not claim a clipboard success when copying fails", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("clipboard denied")) },
    });
  });
  await page.goto(DIAGRAM_PATH);

  await page.getByRole("button", { name: "Поділитися" }).click();

  await expect(page.getByRole("button", { name: "Скопійовано" })).toHaveCount(0);
  await expect(page.getByText("Не вдалося скопіювати посилання.", { exact: true })).toBeVisible();
});

test("diagram keeps the newest clipboard success visible for its full timeout", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.goto(DIAGRAM_PATH);
  await page.clock.install();

  const share = page.getByRole("button", { name: "Поділитися" });
  await share.click();
  await expect(page.getByRole("button", { name: "Скопійовано" })).toBeVisible();

  await page.clock.runFor(1_000);
  await page.getByRole("button", { name: "Скопійовано" }).click();
  await page.clock.runFor(900);
  await expect(page.getByRole("button", { name: "Скопійовано" })).toBeVisible();

  await page.clock.runFor(900);
  await expect(page.getByRole("button", { name: "Поділитися" })).toBeVisible();
});

test("cart spreadsheet actions are locked with a touch-accessible reason", async ({ page }) => {
  await page.goto("/cart");

  await expect(page.getByRole("button", { name: "Імпорт Excel", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Експорт", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "Чому недоступно: Імпорт Excel" }).click();
  await expect(page.getByText("Імпорт файлів поки недоступний.", { exact: true })).toBeVisible();
  await expect(page.getByText(/демо|демонстраційн/i)).toHaveCount(0);
});

test("team access locks are associated with the visible management reason", async ({ page }) => {
  await page.goto("/dealer/team-access");

  const reason = page.getByText(/Склад команди та профілі прав керуються адміністратором/);
  await expect(reason).toBeVisible();
  await expect(page.getByRole("button", { name: "Зберегти ім'я" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Зберегти ім'я" })).toHaveAttribute(
    "aria-describedby",
    await reason.getAttribute("id") as string,
  );
});
