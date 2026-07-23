import { expect, test, type Page } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

function searchControl(page: Page, name: string) {
  return page.getByRole("textbox", { name }).or(page.getByRole("searchbox", { name })).first();
}

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "light" }));
  });
});

test("customers, network, team access and parts report expose Astryx renderers", async ({ page }) => {
  await page.goto("/dealer/customers");
  await expect(page.locator('[data-dealer-customers-renderer="astryx"]')).toHaveCount(1);
  await expect(searchControl(page, "Пошук клієнтів")).toBeVisible();

  await page.goto("/dealer/network");
  await expect(page.locator('[data-dealer-feature="network"][data-dealer-feature-renderer="astryx"]')).toHaveCount(1);
  await expect(searchControl(page, "Пошук мережі")).toBeVisible();

  await page.goto("/dealer/parts-report");
  await expect(page.locator('[data-dealer-feature="parts-report"][data-dealer-feature-renderer="astryx"]')).toHaveCount(1);
  await expect(searchControl(page, "Пошук звіту запчастин")).toBeVisible();

  await page.goto("/dealer/team-access");
  await expect(page.locator('[data-dealer-team-access-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByText("Склад команди та профілі прав керуються адміністратором. У дилерській частині доступний лише перегляд поточного облікового запису.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Зберегти", exact: true })).toBeDisabled();
});

test("customer query and filter panel survive renderer changes", async ({ page }) => {
  await page.goto("/dealer/customers");
  await searchControl(page, "Пошук клієнтів").fill("Logos");
  await page.getByRole("button", { name: "Фільтри", exact: true }).click();

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({ version: 1, designSystem: "shadcn", colorMode: "dark" });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }));
  });

  await expect(page.locator('[data-dealer-customers-renderer="shadcn"]')).toHaveCount(1);
  await expect(searchControl(page, "Пошук клієнтів")).toHaveValue("Logos");
  await expect(page.getByRole("button", { name: "Фільтри", exact: true })).toHaveAttribute("aria-expanded", "true");
});

test("network-facing dealer pages fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/dealer/customers", "/dealer/network", "/dealer/parts-report", "/dealer/team-access"]) {
    await page.goto(path);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
});
