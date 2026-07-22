import { expect, test, type Page } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

const dataRoutes = [
  { path: "/dealer/documents", feature: "documents", search: "Пошук документів" },
  { path: "/dealer/order-drafts", feature: "order-drafts", search: "Пошук чернеток" },
  { path: "/dealer/consignment", feature: "consignment", search: "Пошук консигнації" },
  { path: "/dealer/settlements", feature: "settlements", search: "Пошук взаєморозрахунків" },
  { path: "/dealer/parts-inventory", feature: "parts-inventory", search: "Пошук складу" },
] as const;

function searchControl(page: Page, name: string) {
  return page.getByRole("textbox", { name }).or(page.getByRole("searchbox", { name })).first();
}

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "light" }));
  });
});

test("dealer document and stock routes expose the Astryx renderer", async ({ page }) => {
  for (const route of dataRoutes) {
    await page.goto(route.path);
    await expect(page.locator(`[data-dealer-feature="${route.feature}"][data-dealer-feature-renderer="astryx"]`)).toHaveCount(1);
    await expect(searchControl(page, route.search)).toBeVisible();
    await expect(page.locator('[data-dealer-data-toolbar][data-renderer="astryx"]')).toHaveCount(1);
  }
});

test("document query and filter disclosure survive a theme switch", async ({ page }) => {
  await page.goto("/dealer/documents");
  await searchControl(page, "Пошук документів").fill("INV-2026");
  await page.getByRole("button", { name: "Фільтри", exact: true }).click();

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({ version: 1, designSystem: "shadcn", colorMode: "dark" });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }));
  });

  await expect(page.locator('[data-dealer-feature="documents"][data-dealer-feature-renderer="shadcn"]')).toHaveCount(1);
  await expect(searchControl(page, "Пошук документів")).toHaveValue("INV-2026");
  await expect(page.getByRole("button", { name: "Фільтри", exact: true })).toHaveAttribute("aria-expanded", "true");
});

test("dealer data pages have no mobile document overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of dataRoutes) {
    await page.goto(route.path);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
});
