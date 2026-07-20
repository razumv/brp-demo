import { expect, test, type Locator } from "@playwright/test";
import { loginAsAdmin, openAdminRoute } from "./support/admin-session";

async function recordIds(surface: Locator, selector: string) {
  return surface.locator(selector).evaluateAll((records) => records.map((record) => record.getAttribute("data-record-id")));
}

async function expectTouchTarget(control: Locator) {
  await expect(control).toHaveCount(1);
  const box = await control.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
}

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("users swap the active-user grid for matching labelled cards at the exact breakpoint", async ({ page }) => {
  const cards = page.locator('ul[aria-label="Активні користувачі"]');
  const grid = page.locator('[role="grid"][aria-label="Активні користувачі"]');
  const kpis = page.locator('section[aria-label="Показники користувачів"]');

  await openAdminRoute(page, "/admin/users", 390);
  await expect(kpis).toHaveCSS("display", "none");
  await expect(cards).toBeVisible();
  await expect(grid).toHaveCSS("display", "none");
  await expect(page.getByRole("list", { name: "Активні користувачі" })).toHaveCount(1);
  await expect(page.getByRole("grid", { name: "Активні користувачі" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Пошук користувачів" }).fill("demo-account");
  const mobileIds = await recordIds(cards, 'li[data-record-id]');
  expect(mobileIds).toContain("demo-user-03");
  const mobileCard = cards.locator('li[data-record-id="demo-user-03"]');
  await expect(mobileCard).toHaveAttribute("aria-labelledby", "admin-user-demo-user-03-title");
  await expect(page.locator("#admin-user-demo-user-03-title")).toHaveText("Демо-користувач 03");
  await expect(mobileCard).toContainText("Демо-користувач 03");
  await expect(mobileCard).toContainText("user03@example.invalid");
  await expect(mobileCard).toContainText("Logos");
  await expect(mobileCard).toContainText("Адмін");
  await expect(mobileCard).toContainText("Активний");
  await expect(mobileCard).toContainText("5 months ago");
  const actionNames = [
    "Деактивувати Демо-користувач 03 — заблоковано",
    "Редагувати Демо-користувач 03",
    "Видалити Демо-користувач 03 — заблоковано",
  ] as const;
  const mobileActionStates = await Promise.all(actionNames.map((name) => mobileCard.getByRole("button", { name }).isDisabled()));
  await expect(cards.locator("..").getByText(/Показано \d+ користувачів/)).toBeVisible();

  await openAdminRoute(page, "/admin/users", 767);
  await expect(cards).toBeVisible();
  await expect(grid).toHaveCSS("display", "none");

  await openAdminRoute(page, "/admin/users", 768);
  await expect(kpis).toBeVisible();
  await expect(cards.locator("..")).toHaveCSS("display", "none");
  await expect(grid).toBeVisible();
  await expect(page.getByRole("list", { name: "Активні користувачі" })).toHaveCount(0);
  await expect(page.getByRole("grid", { name: "Активні користувачі" })).toHaveCount(1);
  await page.getByRole("textbox", { name: "Пошук користувачів" }).fill("demo-account");
  expect(await recordIds(grid, '[role="row"][data-record-id]')).toEqual(mobileIds);
  const desktopRow = grid.locator('[role="row"][data-record-id="demo-user-03"]');
  await expect(desktopRow).toContainText("Демо-користувач 03");
  await expect(desktopRow).toContainText("user03@example.invalid");
  await expect(desktopRow).toContainText("Logos");
  await expect(desktopRow).toContainText("Адмін");
  await expect(desktopRow).toContainText("Активний");
  await expect(desktopRow).toContainText("5 months ago");
  const desktopActionStates = await Promise.all(actionNames.map((name) => desktopRow.getByRole("button", { name }).isDisabled()));
  expect(desktopActionStates).toEqual(mobileActionStates);
});

test("company mobile cards keep their employee and direct actions touch-sized", async ({ page }) => {
  for (const width of [390, 767] as const) {
    await openAdminRoute(page, "/admin/companies", width);
    await expectTouchTarget(page.getByRole("button", { name: "Працівники BRP Вышгород" }));
    await expectTouchTarget(page.getByRole("link", { name: "Політика доступу BRP Вышгород" }));
    await expectTouchTarget(page.getByRole("button", { name: "Редагувати BRP Вышгород" }));
    await expectTouchTarget(page.getByRole("button", { name: "Призначити працівника в BRP Вышгород" }));
    const deleteAction = page.getByRole("button", { name: "Видалити BRP Вышгород — заблоковано" });
    await expectTouchTarget(deleteAction);
    await expect(deleteAction).toHaveAttribute("data-trigger-disabled", "");
    const card = page.locator(`article:has-text("BRP Вышгород")`).first();
    await expect(card).toHaveAttribute("aria-labelledby", "admin-company-vyshhorod-title");
    await expect(page.locator("#admin-company-vyshhorod-title")).toHaveText("BRP Вышгород");
    await expect(card).toHaveCSS("padding-top", "12px");
    await expect(card.getByText("Створена Apr 30, 2026")).toBeVisible();
  }
});

test("permissions keeps primary search and role selection visible while disclosing bulk actions once", async ({ page }) => {
  await openAdminRoute(page, "/admin/permissions", 390);
  await expect(page.getByRole("textbox", { name: "Пошук за правами, об'єктом або дією" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Роль доступу" })).toBeVisible();
  const trigger = page.getByRole("button", { name: "Масові дії" });
  const panel = page.locator("[data-mobile-disclosure-panel]");
  await expectTouchTarget(trigger);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "Дати читання" })).toHaveCount(0);
  await trigger.click();
  await expect(panel.getByRole("button", { name: "Дати читання" })).toBeDisabled();
  await expect(panel.getByRole("button", { name: "Дати все" })).toBeDisabled();
  await expect(panel.getByRole("button", { name: "Відкликати все" })).toBeDisabled();
  await trigger.click();
  await expect(panel).toHaveCSS("display", "none");
  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noHorizontalOverflow).toBe(true);

  await openAdminRoute(page, "/admin/permissions", 768);
  await expect(trigger).toHaveCount(0);
  await expect(page.getByRole("tablist", { name: "Ролі доступу" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Дати читання" })).toBeVisible();
});
