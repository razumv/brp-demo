import { expect, type Page } from "@playwright/test";

export type AdminViewportWidth = 390 | 767 | 768 | 1440;

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.locator('input[type="password"]').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

export async function openAdminRoute(
  page: Page,
  path: string,
  width: AdminViewportWidth,
) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.goto(path);
  await expect(page.locator("h1")).toBeVisible();
}
