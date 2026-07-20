import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, openAdminRoute } from "./support/admin-session";

async function expectNoDocumentOverflow(page: Page) {
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true);
}

async function expectCompactPermissionRow(
  page: Page,
  name: string,
  summary: string,
  actionNames: readonly string[],
) {
  const disclosure = page.getByRole("button", { name: `${name} — ${summary}` });
  await expect(disclosure).toHaveCount(1);
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");

  for (const actionName of actionNames) {
    await expect(page.getByRole("switch", { name: new RegExp(`^${name}: ${actionName}`) })).toHaveCount(0);
  }

  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");

  const region = page.getByRole("region", { name: `${name} — ${summary}` });
  await expect(region).toBeVisible();
  const switches = region.getByRole("switch");
  await expect(switches).toHaveCount(actionNames.length);
  await expect(switches.first()).toBeDisabled();
  await expect(switches.first()).toHaveAttribute("aria-checked", "true");

  const firstBox = await switches.nth(0).boundingBox();
  const secondBox = await switches.nth(1).boundingBox();
  expect(secondBox?.x ?? 0).toBeGreaterThan(firstBox?.x ?? 0);
}

async function expectDesktopPermissionTable(page: Page, label: string) {
  const table = page.getByRole("table", { name: label });
  await expect(table).toBeVisible();
  await expect(page.getByRole("button", { name: /3\/4 увімкнено/ })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("compact role permission disclosures keep actions hidden until keyboard expansion", async ({ page }) => {
  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/permissions", width);
    await expectCompactPermissionRow(page, "Замовлення", "3/4 увімкнено", ["Читання", "Створення", "Зміна", "Видалення"]);
    await expectNoDocumentOverflow(page);
  }
});

test("role filters inside the mobile disclosure narrow permission objects", async ({ page }) => {
  await openAdminRoute(page, "/admin/permissions", 390);
  const trigger = page.getByRole("button", { name: "Фільтри дозволів" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();

  await page.getByRole("combobox", { name: "Роль доступу" }).selectOption("manager");
  await page.getByRole("combobox", { name: "Стан дозволів" }).selectOption("off");
  await expect(trigger).toContainText("1");
  await expect(page.getByRole("button", { name: "Інвойси — 0/4 увімкнено" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Взаєморозрахунки — 1\/1 увімкнено/ })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Роль доступу" }).selectOption("dealer");
  await expect(trigger).toContainText("2");
  await expect(page.getByRole("button", { name: "Команда і доступи — 2/2 увімкнено" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Консигнація — 3/4 увімкнено" })).toBeVisible();
});

test("dealer filters narrow team and company policy without changing read-only switches", async ({ page }) => {
  await openAdminRoute(page, "/admin/dealer-access", 390);
  const trigger = page.getByRole("button", { name: "Фільтри доступу" });
  await trigger.click();

  await page.getByRole("combobox", { name: "Стан доступу команди" }).selectOption("without-access");
  await expect(page.getByText("Демо-керівник", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Демо-співробітник 2", { exact: true }).last()).toBeVisible();

  await page.getByRole("combobox", { name: "Стан політики компанії" }).selectOption("off");
  await expect(page.getByRole("button", { name: "Каталог — 1/4 увімкнено" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Клієнти — 4/4 увімкнено" })).toHaveCount(0);

  const catalog = page.getByRole("button", { name: "Каталог — 1/4 увімкнено" });
  await catalog.click();
  const readSwitch = page.getByRole("switch", { name: /^Каталог: Читання/ });
  await expect(readSwitch).toBeDisabled();
  await expect(readSwitch).toHaveAttribute("aria-checked", "true");
  await expectNoDocumentOverflow(page);
});

test("active permission filters remain visible and resettable after crossing the desktop breakpoint", async ({ page }) => {
  await openAdminRoute(page, "/admin/permissions", 767);
  await page.getByRole("button", { name: "Фільтри дозволів" }).click();
  const permissionState = page.getByRole("combobox", { name: "Стан дозволів" });
  await permissionState.selectOption("off");
  await page.setViewportSize({ width: 768, height: 1000 });
  await expect(permissionState).toBeVisible();
  await permissionState.selectOption("all");
  await expect(page.getByRole("table", { name: "Дозволи ролі Менеджер" })).toContainText("Взаєморозрахунки");

  await openAdminRoute(page, "/admin/dealer-access", 767);
  await page.getByRole("button", { name: "Фільтри доступу" }).click();
  const teamAccess = page.getByRole("combobox", { name: "Стан доступу команди" });
  await teamAccess.selectOption("without-access");
  await page.setViewportSize({ width: 768, height: 1000 });
  await expect(teamAccess).toBeVisible();
  await teamAccess.selectOption("all");
  await expect(page.getByRole("region", { name: "Команда дилера" })).toContainText("Демо-керівник");
});

test("permission tables stay desktop-only at the exact breakpoint and wider", async ({ page }) => {
  for (const width of [768, 1440] as const) {
    await openAdminRoute(page, "/admin/permissions", width);
    await expectDesktopPermissionTable(page, "Дозволи ролі Менеджер");
    await expect(page.locator('div[aria-label="Дозволи ролі Менеджер"]:not([role])')).toHaveCSS("display", "none");

    await openAdminRoute(page, "/admin/dealer-access", width);
    await expectDesktopPermissionTable(page, "Політика компанії");
    await expect(page.locator('div[aria-label="Політика компанії"]:not([role])')).toHaveCSS("display", "none");
  }
});
