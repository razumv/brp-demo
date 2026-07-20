import { expect, test } from "@playwright/test";
import { loginAsAdmin, openAdminRoute } from "./support/admin-session";

async function expectMobileHidden(page: Parameters<typeof openAdminRoute>[0], label: string) {
  const kpis = page.locator(`section[aria-label="${label}"]`);
  await expect(kpis).toHaveCount(1);
  await expect(kpis).toHaveCSS("display", "none");
  await expect(page.getByRole("region", { name: label })).toHaveCount(0);
}

async function expectDesktopVisible(page: Parameters<typeof openAdminRoute>[0], label: string) {
  const kpis = page.locator(`section[aria-label="${label}"]`);
  await expect(kpis).toHaveCount(1);
  await expect(kpis).toBeVisible();
  await expect(page.getByRole("region", { name: label })).toBeVisible();
}

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("warehouse keeps its process and supply controls while hiding every process KPI grid on phones", async ({ page }) => {
  await openAdminRoute(page, "/admin/warehouse", 390);
  const processes = page.getByRole("combobox", { name: "Процес складу" });
  await expect(processes).toBeVisible();
  await expect(processes).toHaveCSS("min-height", "44px");
  await expect(page.getByRole("combobox", { name: "Постачання" })).toBeVisible();

  for (const process of ["receipt-summary", "shortages", "fulfillment", "inventory-summary"] as const) {
    await processes.selectOption(process);
    await expectMobileHidden(page, "Показники складу");
  }

  await processes.selectOption("receiving");
  const supply = page.getByRole("combobox", { name: "Постачання" });
  const action = page.getByRole("button", { name: "Прийняти все" });
  const [supplyBox, actionBox] = await Promise.all([supply.boundingBox(), action.boundingBox()]);
  expect(supplyBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await openAdminRoute(page, "/admin/warehouse", 767);
  const [tabletSupplyBox, tabletActionBox] = await Promise.all([
    page.getByRole("combobox", { name: "Постачання" }).boundingBox(),
    page.getByRole("button", { name: "Прийняти все" }).boundingBox(),
  ]);
  expect(tabletSupplyBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(tabletActionBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await openAdminRoute(page, "/admin/warehouse", 768);
  await expect(page.getByRole("combobox", { name: "Постачання" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Прийняти все" })).toBeVisible();
  const desktopProcesses = page.getByRole("tablist", { name: "Процеси складу" });
  await desktopProcesses.getByRole("tab", { name: "Зведення приймання" }).click();
  await expectDesktopVisible(page, "Показники складу");
});

test("warehouse filters use one reachable mobile disclosure without losing its selected value", async ({ page }) => {
  await openAdminRoute(page, "/admin/warehouse", 767);
  await page.getByRole("combobox", { name: "Процес складу" }).selectOption("inventory-summary");
  await expect(page.getByRole("textbox", { name: "Пошук артикулу" })).toBeVisible();
  const trigger = page.getByRole("button", { name: /^Фільтри/ });
  const panel = page.locator("[data-mobile-disclosure-panel]");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const supply = panel.locator("select").first();
  await expect(supply).toHaveCount(1);
  await supply.selectOption({ index: 1 });
  const selectedSupply = await supply.inputValue();
  await expect(trigger).toContainText("1");
  await trigger.click();
  await expect(panel).toHaveCSS("display", "none");
  await expect(supply).toHaveCount(1);
  await trigger.click();
  await expect(supply).toHaveValue(selectedSupply);
});

test("invoices hide each KPI group on phones while preserving labelled section selection and direct actions", async ({ page }) => {
  await openAdminRoute(page, "/admin/invoices", 390);
  await expectMobileHidden(page, "Показники інвойсів");
  const sections = page.getByRole("combobox", { name: "Розділ документів" });
  await expect(sections).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Пошук контрактів" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Новий контракт" })).toBeVisible();

  await sections.selectOption("appendices");
  await expectMobileHidden(page, "Показники додатків");
  await expect(page.getByRole("textbox", { name: "Пошук додатків" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Завантажити проформи" })).toBeVisible();

  await sections.selectOption("cost");
  await expectMobileHidden(page, "Підсумки собівартості");
  await expect(page.getByRole("textbox", { name: "Пошук собівартості" })).toBeVisible();

  await openAdminRoute(page, "/admin/invoices", 768);
  await expectDesktopVisible(page, "Показники інвойсів");
  await page.getByRole("tablist", { name: "Інвойси та документи" }).getByRole("tab", { name: "Додатки" }).click();
  await expectDesktopVisible(page, "Показники додатків");
  await page.getByRole("tablist", { name: "Інвойси та документи" }).getByRole("tab", { name: "Собівартість" }).click();
  await expectDesktopVisible(page, "Підсумки собівартості");
});

test("invoice secondary filters disclose once and keep horizontal tables labelled and focusable", async ({ page }) => {
  await openAdminRoute(page, "/admin/invoices", 767);
  const sections = page.getByRole("combobox", { name: "Розділ документів" });
  await sections.selectOption("invoices");
  await expect(page.getByRole("textbox", { name: "Пошук інвойсів" })).toBeVisible();
  const trigger = page.getByRole("button", { name: /^Фільтри/ });
  const panel = page.locator("[data-mobile-disclosure-panel]");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const statuses = panel.locator('[role="group"][aria-label="Статус відвантажень"]');
  await expect(statuses).toHaveCount(1);
  await statuses.getByRole("button", { name: /В дорозі/ }).click();
  await expect(trigger).toContainText("1");
  await trigger.click();
  await expect(panel).toHaveCSS("display", "none");
  await expect(statuses).toHaveCount(1);

  const shipments = page.getByRole("region", { name: "Відвантаження для інвойсів" });
  await expect(shipments).toHaveAttribute("tabindex", "0");
  expect(await shipments.evaluate((region) => region.scrollWidth > region.clientWidth)).toBe(true);

  await sections.selectOption("cost");
  const costScroller = page.locator('[role="region"][aria-label^="Картка собівартості BL"]').first();
  await expect(costScroller).toHaveAttribute("tabindex", "0");
  expect(await costScroller.evaluate((region) => region.scrollWidth > region.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
