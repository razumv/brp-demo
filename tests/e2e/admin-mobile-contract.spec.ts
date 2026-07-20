import { expect, test } from "@playwright/test";
import {
  loginAsAdmin,
  openAdminRoute,
  type AdminViewportWidth,
} from "./support/admin-session";

const widths: AdminViewportWidth[] = [390, 767, 768, 1440];

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("catalog swaps its desktop table for mobile cards at the exact breakpoint", async ({ page }) => {
  await openAdminRoute(page, "/admin/catalog", 767);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toBeHidden();
  await page.getByRole("textbox", { name: "Пошук за SKU або назвою" }).fill("4RTB");
  await expect(page.getByRole("list", { name: "Товари каталогу" }).getByText("4RTB", { exact: true })).toBeVisible();

  await openAdminRoute(page, "/admin/catalog", 768);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toBeHidden();
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toBeVisible();
});

test("settlements diagnostic is mobile-persisted and desktop-static", async ({ page }) => {
  await openAdminRoute(page, "/admin/settlements", 390);
  const trigger = page.getByRole("button", { name: "Оновлюється" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toHaveAttribute("aria-expanded", "true");

  await openAdminRoute(page, "/admin/settlements", 768);
  await expect(page.getByText("Остання успішна синхронізація:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toBeDisabled();
});

test("mobile toolbar discloses filters without resetting them", async ({ page }) => {
  await openAdminRoute(page, "/admin/unit-shipping", 390);
  await expect(page.getByRole("textbox", { name: "Пошук замовлення або моделі" })).toBeVisible();
  const filters = page.getByRole("button", { name: /^Фільтри/ });
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await filters.click();
  await page.getByLabel("Тип техніки").selectOption({ label: "Гідроцикли" });
  await expect(filters).toContainText("1");
  await filters.click();
  await expect(page.getByLabel("Тип техніки")).toHaveValue("pwc");
});

test("users expose mobile cards and preserve desktop grid", async ({ page }) => {
  await openAdminRoute(page, "/admin/users", 390);
  await expect(page.getByRole("list", { name: "Активні користувачі" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "Активні користувачі" })).toBeHidden();
  await page.getByRole("textbox", { name: "Пошук користувачів" }).fill("demo-account-03");
  const card = page.getByRole("listitem").filter({ hasText: "demo-account-03" });
  await expect(card).toContainText("Демо-користувач 03");
  await expect(card.getByRole("button", { name: /Редагувати/ })).toBeVisible();
});

test("target routes never create document-level horizontal overflow", async ({ page }) => {
  const routes = [
    "/admin/order-pipeline",
    "/admin/supplier-orders",
    "/admin/air-freight",
    "/admin/ocean-freight",
    "/admin/unit-shipping",
    "/admin/warehouse",
    "/admin/settlements",
    "/admin/invoices",
    "/admin/catalog",
    "/admin/schedule",
    "/admin/companies",
    "/admin/users",
    "/admin/permissions",
  ];
  for (const width of widths) {
    for (const route of routes) {
      await openAdminRoute(page, route, width);
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(fits, `${route} must fit at ${width}px`).toBe(true);
    }
  }
});
