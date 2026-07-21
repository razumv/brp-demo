import {expect, test, type Page} from "@playwright/test";
import {seedDealerWorkflowSession} from "./support/dealer-workflow-session";

const ASTRYX = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
const SHADCN = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;

async function switchRenderer(page: Page, preference: typeof ASTRYX | typeof SHADCN) {
  await page.evaluate((nextPreference) => {
    const key = "brp-appearance-v1";
    const value = JSON.stringify(nextPreference);
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      newValue: value,
      storageArea: window.localStorage,
    }));
  }, preference);
}

test("renderer foundation probe preserves the current login form while Astryx becomes ready", async ({page}) => {
  test.skip(
    process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
    "The renderer foundation probe is enabled only for the focused production regression suite.",
  );
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "dark",
    }));
  });
  await page.goto("/login?astryx-foundation-probe=1", {waitUntil: "domcontentloaded"});
  const email = page.getByLabel("Електронна пошта");
  await email.fill("dealer@local.test");
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(email).toHaveValue("dealer@local.test");
});

test("shell query, overlay, dealer cart, draft builder, and page filter survive both renderer directions", async ({page}) => {
  test.skip(
    process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
    "The renderer foundation probe is enabled only for the focused production regression suite.",
  );
  await seedDealerWorkflowSession(page);
  await page.goto("/cart", {waitUntil: "domcontentloaded"});

  await page.getByLabel("Номер запчастини").fill("9779150");
  await page.getByRole("button", {name: "Додати", exact: true}).click();
  await page.getByLabel("Назва чернетки").fill("Renderer-preserved draft");
  await page.getByLabel("PO / номер замовлення").fill("RENDERER-42");
  await page.getByRole("combobox", {name: "Глобальний пошук запчастин"}).fill("507");
  const results = page.getByRole("dialog", {name: "Результати пошуку запчастин"});
  await expect(results).toBeVisible();

  await switchRenderer(page, ASTRYX);
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.getByLabel("Назва чернетки")).toHaveValue("Renderer-preserved draft");
  await expect(page.getByLabel("PO / номер замовлення")).toHaveValue("RENDERER-42");
  await expect(page.getByRole("combobox", {name: "Глобальний пошук запчастин"})).toHaveValue("507");
  await expect(results).toBeVisible();
  await expect(page.getByText("COOLANT,EXT LIFE", {exact: true})).toBeVisible();

  await switchRenderer(page, SHADCN);
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await expect(page.locator("html")).not.toHaveCSS("display", "contents");
  await expect(page.locator('body > [data-astryx-theme="brp-current-compatibility"]')).toHaveCSS("display", "contents");
  await expect(page.getByLabel("Назва чернетки")).toHaveValue("Renderer-preserved draft");
  await expect(page.getByText("COOLANT,EXT LIFE", {exact: true})).toBeVisible();

  await page.goto("/dealer/customers", {waitUntil: "domcontentloaded"});
  await page.getByRole("button", {name: "Фільтри", exact: true}).click();
  await page.getByLabel("Категорія клієнтів").selectOption("retail");
  await switchRenderer(page, ASTRYX);
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.getByLabel("Категорія клієнтів")).toHaveValue("retail");
  await switchRenderer(page, SHADCN);
  await expect(page.getByLabel("Категорія клієнтів")).toHaveValue("retail");
});
