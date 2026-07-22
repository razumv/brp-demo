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

test("catalog diagram search and accessory family media survive renderer and mode changes", async ({ page }) => {
  await page.goto("/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603");
  const diagramQuery = page.getByRole("searchbox", { name: "Пошук схем" });
  await diagramQuery.fill("maintenance parts");
  await expect(page.getByRole("region", { name: "Схеми моделі" }).getByRole("link")).toHaveCount(1);

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({ version: 1, designSystem: "shadcn", colorMode: "dark" });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }));
  });

  await expect(page.locator('[data-dealer-catalog-renderer="shadcn"]')).toHaveCount(1);
  await expect(diagramQuery).toHaveValue("maintenance parts");
  await expect(page.getByRole("img", { name: /Мініатюра схеми/ })).toBeVisible();

  await page.goto("/dealer/accessories");
  await expect(page.getByRole("img", { name: "Can-Am Off-Road — логотип сімейства" })).toBeVisible();
  const availabilityContrast = await page.locator('[data-availability="in-stock"]').first().evaluate((element) => {
    const channel = (value: number) => {
      const normalized = value / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (value: string) => {
      const [red = 0, green = 0, blue = 0] = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
    };
    const styles = window.getComputedStyle(element);
    const foreground = luminance(styles.color);
    const background = luminance(styles.backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(availabilityContrast).toBeGreaterThanOrEqual(4.5);

  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603",
      "/dealer/accessories",
    ]) {
      await page.goto(path);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    }
  }
});
