import { expect, test } from "@playwright/test";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
});

test("dealer data toolbar keeps search and the compact filter trigger on one row", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/dealer/parts-inventory");
    await expect(page.getByRole("heading").first()).toBeVisible();

    const search = page.getByRole("searchbox", { name: "Пошук складу" });
    const trigger = page.getByRole("button", { name: "Фільтри", exact: true });
    await expect(trigger).toHaveCount(1);
    await expect(search).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-controls", /.+/);

    const [searchBox, triggerBox] = await Promise.all([search.locator("xpath=..").boundingBox(), trigger.boundingBox()]);
    expect(searchBox?.y).toBe(triggerBox?.y);
    expect((searchBox?.x ?? 0) + (searchBox?.width ?? 0)).toBeLessThanOrEqual(triggerBox?.x ?? 0);
    expect(triggerBox?.width).toBe(44);
    expect(triggerBox?.height).toBe(44);

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("combobox", { name: "Фільтр запасу" }).focus();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("heading").first().click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await page.getByRole("combobox", { name: "Фільтр запасу" }).selectOption("low");
    await expect(trigger).toHaveText("1");
    await page.getByRole("button", { name: "Скинути фільтри" }).click();
    await expect(trigger).not.toHaveText("1");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
