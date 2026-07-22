import {expect, test} from "@playwright/test";
import {loginAsAdmin} from "./support/admin-session";

test("admin can persist design system and color mode from appearance settings", async ({page}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/settings");

  const appearanceHeading = page.getByRole("heading", {name: "Оформлення"});
  await expect(appearanceHeading).toBeVisible();
  await expect(page.getByRole("heading", {name: "Налаштування воркерів"})).toBeVisible();
  const sectionHeadings = await page.locator("h2").allTextContents();
  expect(sectionHeadings.indexOf("Оформлення")).toBeLessThan(sectionHeadings.indexOf("Налаштування воркерів"));

  await expect(page.getByRole("radio", {name: /shadcn\/ui/})).toBeChecked();
  await page.getByRole("radio", {name: /Astryx Neutral/}).check();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");

  await page.getByRole("radio", {name: "Темна", exact: true}).click();
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
  await page.reload();
  await expect(page.getByRole("radio", {name: /Astryx Neutral/})).toBeChecked();
  await expect(page.getByRole("radio", {name: "Темна", exact: true})).toBeChecked();

  await page.getByRole("radio", {name: /shadcn\/ui/}).check();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
});

test("a failed appearance write keeps the prior choice and reports an accessible error", async ({page}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/settings");
  await expect(page.getByRole("radio", {name: /shadcn\/ui/})).toBeChecked();

  await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value(this: Storage, key: string, value: string) {
        if (key === "brp-appearance-v1") {
          throw new DOMException("Appearance storage is unavailable.", "QuotaExceededError");
        }
        return originalSetItem.call(this, key, value);
      },
    });
  });

  await page.getByRole("radio", {name: /Astryx Neutral/}).click();
  await expect(page.getByRole("radio", {name: /shadcn\/ui/})).toBeChecked();
  await expect(page.getByRole("radio", {name: /Astryx Neutral/})).not.toBeChecked();
  await expect(page.getByRole("alert").filter({hasText: "Appearance storage is unavailable"})).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
});
