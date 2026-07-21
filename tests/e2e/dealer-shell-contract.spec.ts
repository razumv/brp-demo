import { expect, test } from "@playwright/test";
import { loginAsDealer } from "./support/dealer-session";
import { loginAsAdmin } from "./support/admin-session";

test("dealer shell keeps cart state in the dealer workflow", async ({ page }) => {
  await loginAsDealer(page);

  await page.getByRole("combobox", { name: "Глобальний пошук запчастин" }).fill("507032473");
  const results = page.getByRole("dialog", { name: "Результати пошуку запчастин" });
  await results.getByRole("button", { name: "Додати 507032473 до кошика" }).click();

  await expect(page.getByRole("button", { name: "Кошик (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Кошик (1)" }).click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toContainText("507032473");
  await cart.getByRole("button", { name: "Збільшити" }).click();
  await expect(cart.locator(".quantity-control")).toContainText("2");
  await cart.getByRole("button", { name: "Зменшити" }).click();
  await expect(cart.locator(".quantity-control")).toContainText("1");
  await cart.getByRole("button", { name: "Видалити 507032473" }).click();
  await expect(cart.getByText("Кошик порожній", { exact: true })).toBeVisible();
  await cart.getByRole("button", { name: "Закрити кошик" }).click();
  await expect(page.getByRole("button", { name: "Кошик (0)" })).toBeFocused();
});

test("dealer header omits unsupported controls and clone-state copy", async ({ page }) => {
  await loginAsDealer(page);

  for (const label of ["Режим клієнта", "Мова", "Сповіщення"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Чому недоступно: ${label}` })).toHaveCount(0);
  }

  await expect(page.locator(".app-header")).not.toContainText(/demo|демо|mock|мок|local|локальн|clone|клон/i);
});

test("admin header retains its language and notification controls", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByRole("button", { name: "language_switcher" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Сповіщення", exact: true })).toBeVisible();
});

test.describe("dealer shell at 390px", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("mobile navigation closes through Escape and backdrop, restores focus, and does not overflow", async ({ page }) => {
    await loginAsDealer(page, { assertIdentity: false });

    const trigger = page.getByRole("button", { name: "Меню" });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Навігація" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.locator(".mobile-nav-overlay").click({ position: { x: 380, y: 420 } });
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();
  });
});
