import { expect, test, type Page } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

const serviceRoutes = [
  { path: "/dealer/accessories", feature: "accessories", search: "Пошук аксесуарів" },
  { path: "/dealer/units", feature: "units", search: "Пошук техніки" },
  { path: "/dealer/schedule", feature: "schedule", search: "Пошук у графіку поставки" },
  { path: "/dealer/bossweb", feature: "bossweb", search: "Номер запчастини" },
  { path: "/dealer/workshop", feature: "workshop", search: "Пошук у майстерні" },
] as const;

async function seedAstryx(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "light",
    }));
  });
}

function searchControl(page: Page, name: string) {
  return page.getByRole("textbox", { name }).or(page.getByRole("searchbox", { name })).first();
}

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
  await seedAstryx(page);
});

test("dealer service routes render through Astryx controls", async ({ page }) => {
  for (const route of serviceRoutes) {
    await page.goto(route.path);
    await expect(page.locator(`[data-dealer-feature="${route.feature}"][data-dealer-feature-renderer="astryx"]`)).toHaveCount(1);
    await expect(searchControl(page, route.search)).toBeVisible();
  }
});

test("accessory query and expanded filters survive a live appearance switch", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dealer/accessories");
  await searchControl(page, "Пошук аксесуарів").fill("Advex");
  await page.getByRole("button", { name: "Фільтри аксесуарів" }).click();
  await expect(page.getByLabel("Рік техніки")).toBeVisible();

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({ version: 1, designSystem: "shadcn", colorMode: "dark" });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }));
  });

  await expect(page.locator('[data-dealer-feature="accessories"][data-dealer-feature-renderer="shadcn"]')).toHaveCount(1);
  await expect(searchControl(page, "Пошук аксесуарів")).toHaveValue("Advex");
  await expect(page.getByLabel("Рік техніки")).toBeVisible();
});

test("service pages fit the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of serviceRoutes) {
    await page.goto(route.path);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
});
