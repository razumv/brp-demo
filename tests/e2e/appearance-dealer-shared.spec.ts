import {expect, test, type Page} from "@playwright/test";
import {seedDealerWorkflowSession} from "./support/dealer-workflow-session";

async function seedAstryx(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "light",
    }));
  });
}

test.beforeEach(async ({page}) => {
  await seedDealerWorkflowSession(page);
  await seedAstryx(page);
});

test("dealer routes provide Astryx controls through the stable workflow subtree", async ({page}) => {
  await page.goto("/dealer/parts-inventory");

  await expect(page.locator('[data-dealer-ui-renderer="astryx"]')).toHaveCount(1);
  await expect(page.locator('[data-dealer-data-toolbar][data-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("textbox", {name: "Пошук складу"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Фільтри", exact: true})).toHaveAttribute("aria-expanded", "false");
});

test("dealer dashboard and parts catalog inherit Astryx without replacing workflow state", async ({page}) => {
  await page.goto("/");
  await expect(page.locator('[data-dealer-dashboard-renderer="astryx"]')).toHaveCount(1);
  await expect(page.getByRole("heading", {name: "Головна"})).toBeVisible();

  await page.goto("/catalog");
  await expect(page.locator('[data-dealer-catalog-renderer="astryx"]')).toHaveCount(1);
  const modelSearch = page.getByRole("textbox", {name: "Модель"});
  await modelSearch.fill("0001KTB00");
  await page.getByRole("button", {name: "Знайти модель"}).click();
  await expect(page.getByRole("link", {name: /OUTLANDER - 2X4/})).toBeVisible();
});

test("dealer filter state survives appearance changes", async ({page}) => {
  await page.goto("/dealer/parts-inventory");
  const search = page.getByRole("textbox", {name: "Пошук складу"});
  await search.fill("wear");
  await page.getByRole("button", {name: "Фільтри", exact: true}).click();

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({version: 1, designSystem: "shadcn", colorMode: "dark"});
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", {key, newValue, storageArea: window.localStorage}));
  });

  await expect(page.locator('[data-dealer-ui-renderer="shadcn"]')).toHaveCount(1);
  await expect(page.getByRole("searchbox", {name: "Пошук складу"})).toHaveValue("wear");
  await expect(page.getByRole("button", {name: "Фільтри", exact: true})).toHaveAttribute("aria-expanded", "true");
});
