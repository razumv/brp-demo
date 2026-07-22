import {expect, test, type Locator, type Page} from "@playwright/test";
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

async function assertFocusRemainsInside(page: Page, dialog: Locator, steps = 10) {
  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press("Tab");
    await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
}

test.beforeEach(async ({page}) => {
  await seedAstryx(page);
  await seedDealerWorkflowSession(page);
  await page.goto("/");
  await expect(page.locator('[data-brp-shell-renderer="astryx"]')).toHaveCount(1);
});

test("dealer cart is one Astryx dialog with Escape dismissal and focus return", async ({page}) => {
  const search = page.getByRole("combobox", {name: "Глобальний пошук запчастин"});
  await search.fill("507032473");
  await page.getByRole("dialog", {name: "Результати пошуку запчастин"})
    .getByRole("button", {name: "Додати 507032473 до кошика"})
    .click();
  await page.keyboard.press("Escape");

  const trigger = page.getByRole("button", {name: "Кошик (1)"});
  await trigger.click();
  const cart = page.getByRole("dialog", {name: "Кошик"});
  await expect(cart).toHaveCount(1);
  await expect(cart).toBeVisible();
  await expect(page.locator('dialog[open][aria-label="Кошик"]')).toHaveCount(1);
  await assertFocusRemainsInside(page, cart);

  await page.keyboard.press("Escape");
  await expect(cart).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test.describe("Astryx mobile search", () => {
  test.use({hasTouch: true, isMobile: true, viewport: {width: 390, height: 844}});

  test("uses one focus-contained dialog and restores the search trigger", async ({page}) => {
    const trigger = page.getByRole("button", {name: "Пошук", exact: true});
    await trigger.click();
    const dialog = page.getByRole("dialog", {name: "Пошук запчастин"});
    await expect(dialog).toHaveCount(1);
    await expect(dialog.getByRole("combobox", {name: "Глобальний пошук запчастин"})).toBeFocused();
    await dialog.getByRole("combobox", {name: "Глобальний пошук запчастин"}).fill("507");
    await expect(dialog.getByText("507032473", {exact: true})).toBeVisible();
    const tabScroller = dialog.locator("[data-search-tabs-scroller]");
    await expect.poll(() => tabScroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    const lastTab = dialog.getByRole("tab").last();
    await lastTab.evaluate((element) => element.scrollIntoView({block: "nearest", inline: "end"}));
    await expect(lastTab).toBeInViewport();
    await assertFocusRemainsInside(page, dialog);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test("profile menu logs out and renderer overlays do not survive route changes", async ({page}) => {
  await page.getByRole("button", {name: "Профіль"}).click();
  const logout = page.getByRole("button", {name: "Вийти"});
  await expect(logout).toBeVisible();
  await logout.click();
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.locator("[role='dialog']")).toHaveCount(0);
  await expect(page.locator('[data-brp-login-renderer="astryx"]')).toHaveCount(1);
});
