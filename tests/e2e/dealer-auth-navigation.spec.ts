import { expect, test } from "@playwright/test";
import { loginAsDealer, openDealerRoute } from "./support/dealer-session";

const dealerOrderId = "a20b2bdd-2a1f-4322-a50a-fe68a17f4963";

test("dealer signs in through the visible form and reaches the dealer home", async ({ page }) => {
  await loginAsDealer(page);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
});

test("authenticated dealer direct routes stay out of the manager portal", async ({ page }) => {
  await loginAsDealer(page);

  await openDealerRoute(page, "/dealer/orders", "Мої замовлення");
  await openDealerRoute(page, `/dealer/orders/${dealerOrderId}`, "LOG-01");
  await openDealerRoute(page, `/order-confirmation/${dealerOrderId}`, "Замовлення оформлено");
});

test("dealer route certification rejects an authentication redirect", async ({ page }) => {
  await expect(openDealerRoute(page, "/dealer/orders", "З поверненням")).rejects.toThrow();
});

test("dealer can navigate on desktop and sign out", async ({ page }) => {
  await loginAsDealer(page);

  await page.getByRole("link", { name: "Каталог", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\/?$/);
  await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);

  await page.getByRole("link", { name: /^Мої замовлення/ }).click();
  await expect(page).toHaveURL(/\/dealer\/orders\/?$/);

  await page.getByRole("button", { name: "Профіль" }).click();
  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByRole("button", { name: "Увійти" })).toBeVisible();
});

test.describe("390px touch navigation", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("dealer can navigate from the mobile drawer", async ({ page }) => {
    await loginAsDealer(page, { assertIdentity: false });

    await page.getByRole("button", { name: "Меню" }).click();
    const drawer = page.getByRole("dialog", { name: "Навігація" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: /^Мої замовлення/ }).click();

    await expect(page).toHaveURL(/\/dealer\/orders\/?$/);
    await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
    await expect(drawer).toHaveCount(0);
  });
});
