import { expect, test, type Locator, type Page } from "@playwright/test";
import { openAdminRoute, seedAdminSession } from "./support/admin-session";

const mobileWidths = [390, 767] as const;

async function expectTouchTargets(controls: Locator) {
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box?.height ?? 0, `control ${index} must be at least 44px high`).toBeGreaterThanOrEqual(44);
  }
}

async function expectScroller(region: Locator) {
  await expect(region).toHaveCount(1);
  await expect(region).toHaveAttribute("tabindex", "0");
  expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
}

async function expectNoDocumentOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function expectNoOperationRequests(page: Page, action: Locator) {
  const requests: string[] = [];
  const recordRequest = (request: { url: () => string }) => requests.push(request.url());
  page.on("request", recordRequest);
  await action.dispatchEvent("click");
  await page.waitForTimeout(50);
  page.off("request", recordRequest);
  expect(requests).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await seedAdminSession(page);
});

test("Schedule KPI section disappears only below the 768px boundary", async ({ page }) => {
  for (const width of mobileWidths) {
    await openAdminRoute(page, "/admin/schedule", width);
    await expect(page.locator('[aria-label="Показники графіка доставки"]')).toHaveCSS("display", "none");
  }

  await openAdminRoute(page, "/admin/schedule", 768);
  await expect(page.locator('[aria-label="Показники графіка доставки"]')).toBeVisible();
});

test("Schedule keeps one full-width search and disclosed category control surface on mobile", async ({ page }) => {
  for (const width of mobileWidths) {
    await openAdminRoute(page, "/admin/schedule", width);
    const search = page.getByRole("textbox", { name: "Пошук SKU або моделі" });
    const filters = page.getByRole("button", { name: /^Фільтри/ });
    const panel = page.locator("[data-mobile-disclosure-panel]");
    const categories = panel.getByRole("group", { name: "Категорії слотів доставки", includeHidden: true });
    const toolbar = panel.locator("xpath=..");

    await expect(search).toBeVisible();
    const [searchBox, toolbarBox] = await Promise.all([search.boundingBox(), toolbar.boundingBox()]);
    expect(searchBox?.width ?? 0).toBeGreaterThanOrEqual((toolbarBox?.width ?? 0) - 28);
    await expect(panel).toHaveCount(1);
    await expect(categories).toHaveCount(1);
    await expect(categories).toBeHidden();

    await filters.click();
    await expect(categories).toBeVisible();
    await expectTouchTargets(panel.locator("button, select, input"));
    await categories.getByRole("button", { name: "PWC" }).click();
    await expect(filters).toContainText("1");
    await expect(page.getByRole("group", { name: "Категорії слотів доставки" })).toHaveCount(1);
    await expectNoDocumentOverflow(page);
  }

  await openAdminRoute(page, "/admin/schedule", 768);
  await expect(page.getByRole("button", { name: /^Фільтри/ })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Категорії слотів доставки" })).toBeVisible();
});

test("Schedule chronology remains persisted, collapsible, and updates its visible rail range", async ({ page }) => {
  await openAdminRoute(page, "/admin/schedule", 390);
  const chronology = page.getByRole("button", { name: "Хронологія доставок" });
  const rail = page.getByRole("region", { name: /Хронологія доставок:/ });

  await expect(chronology).toHaveAttribute("aria-expanded", "true");
  await chronology.click();
  await expect(chronology).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await expect(page.getByRole("button", { name: "Хронологія доставок" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Хронологія доставок" }).click();

  const initialRange = await rail.getAttribute("aria-label");
  const initialMonths = await rail.locator("li").count();
  const deliveryGroups = page.getByRole("list", { name: "Доставки, згруповані за датами" });
  const initialDeliveryGroups = await deliveryGroups.locator(":scope > li").count();
  expect(initialDeliveryGroups).toBeGreaterThan(0);
  await page.locator('summary[aria-label="Налаштувати видимий період"]').click();
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole("button", { name: "Зменшити кількість минулих місяців" }).click();
  }
  await expect(rail).not.toHaveAttribute("aria-label", initialRange ?? "");
  await expect.poll(async () => rail.locator("li").count()).toBe(initialMonths - 6);
  await expect(deliveryGroups).toHaveCount(0);
  await expect(page.getByText("У цьому періоді немає доставок")).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("Schedule chronology exposes 44px mobile controls", async ({ page }) => {
  for (const width of mobileWidths) {
    await openAdminRoute(page, "/admin/schedule", width);
    const chronology = page.getByRole("button", { name: "Хронологія доставок" });
    const period = page.locator('summary[aria-label="Налаштувати видимий період"]');

    await expectTouchTargets(chronology);
    await expectTouchTargets(period);
    await period.click();
    await expectTouchTargets(page.getByRole("button", { name: /кількість (минулих|майбутніх) місяців/ }));
  }
});

test("Schedule delivery rows fit mobile width and reveal the selected detail beneath the list", async ({ page }) => {
  await openAdminRoute(page, "/admin/schedule", 390);
  const slot = page.getByRole("button", { name: /PWC март 2026 #1/ });
  const slotBox = await slot.boundingBox();
  expect(slotBox?.width ?? 0).toBeLessThanOrEqual(390);

  await slot.click();
  const slotListPanel = page.getByRole("heading", { name: /Слоти доставки/ }).locator("xpath=../..");
  const detailHeading = page.getByRole("heading", { name: "PWC март 2026" });
  await expect(detailHeading).toBeVisible();
  const slotListBox = await slotListPanel.boundingBox();
  const detailBox = await detailHeading.boundingBox();
  expect(detailBox?.y ?? 0).toBeGreaterThan((slotListBox?.y ?? 0) + (slotListBox?.height ?? 0));
  await expectNoDocumentOverflow(page);

  await openAdminRoute(page, "/admin/schedule", 1440);
  await expect(page.getByRole("button", { name: /PWC март 2026 #1/ })).toBeVisible();
});

test("Schedule chronology rail and stock table are bounded labelled scrollers", async ({ page }) => {
  await openAdminRoute(page, "/admin/schedule", 390);
  await expectScroller(page.getByRole("region", { name: /Хронологія доставок:/ }));
  await expectNoDocumentOverflow(page);

  await page.getByRole("tab", { name: "Складські запаси" }).click();
  await expectScroller(page.getByRole("region", { name: "Складські запаси" }));
  await expectNoDocumentOverflow(page);
});

test("compact operational Schedule actions remain explained and hard-disabled", async ({ page }) => {
  for (const width of mobileWidths) {
    await openAdminRoute(page, "/admin/schedule", width);
    const actions = page.locator('[data-schedule-actions] button');
    await expect(actions).toHaveCount(2);
    const [openExcel, sync] = await Promise.all([actions.nth(0).boundingBox(), actions.nth(1).boundingBox()]);
    expect(openExcel?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(sync?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(Math.abs((openExcel?.y ?? 0) - (sync?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((openExcel?.width ?? 0) - (sync?.width ?? 0))).toBeLessThanOrEqual(1);
    for (const action of [
      page.getByRole("button", { name: "Відкрити Excel" }),
      page.getByRole("button", { name: "Синхронізувати" }),
    ]) {
      await expect(action).toBeDisabled();
      await expect(action).toHaveAttribute("aria-describedby", "schedule-actions-safety");
      await expectNoOperationRequests(page, action);
    }
    await expect(page.locator("#schedule-actions-safety")).toBeVisible();
    await expectNoDocumentOverflow(page);
  }

  await openAdminRoute(page, "/admin/schedule", 768);
  const [openExcel, sync] = await Promise.all([
    page.getByRole("button", { name: "Відкрити Excel" }).boundingBox(),
    page.getByRole("button", { name: "Синхронізувати" }).boundingBox(),
  ]);
  expect(Math.abs((openExcel?.y ?? 0) - (sync?.y ?? 0))).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-schedule-actions]')).toBeVisible();
});
