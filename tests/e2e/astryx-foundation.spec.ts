import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const regions = ["light", "dark"] as const;

test("renders real Astryx foundation components in light and dark Theme regions", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "light",
    }));
  });
  await page.goto("/login?astryx-foundation-probe=1");
  await expect(page.getByTestId("astryx-foundation-probe")).toHaveAttribute(
    "data-design-system",
    "astryx",
  );

  for (const mode of regions) {
    const region = page.getByTestId(`astryx-foundation-${mode}`);
    await expect(region).toBeVisible();

    const controls = [
      region.getByRole("button", { name: "Foundation action" }),
      region.getByRole("textbox", { name: "Foundation input" }).locator(".."),
      region.getByTestId(`astryx-foundation-card-${mode}`),
      region.locator("th").first(),
      region.locator("td").first(),
    ];

    for (const control of controls) {
      await expect(control).toBeVisible();
      const padding = await control.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
      });
      expect(padding.some((value) => value !== "0px")).toBe(true);
    }

    const buttonColors = await region
      .getByRole("button", { name: "Foundation action" })
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, color: style.color };
      });
    expect(buttonColors.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(buttonColors.color).not.toBe("rgb(31, 35, 40)");

    await expect(region.getByRole("textbox", { name: "Foundation input" })).toHaveCSS(
      "font-family",
      /Figtree Variable.*Inter/,
    );
  }
});

test("preserves the Task 0 current-renderer catalog baseline and control geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-clone-theme", "light");
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
    document.documentElement.appendChild(style);
  });
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.locator('input[type="password"]').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.goto("/admin/catalog", { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const currentControls = [
    page.locator(".button").first(),
    page.locator("input").first(),
    page.locator(".panel").first(),
    page.locator(".data-table th").first(),
    page.locator(".data-table td").first(),
  ];
  for (const control of currentControls) {
    await expect(control).toBeVisible();
    await expect(control).toHaveCSS("font-family", /Inter/);
  }

  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const currentScreenshot = await page.screenshot({ animations: "disabled", fullPage: false });
  const baselineScreenshot = await readFile(
    "docs/design-references/astryx-baseline/admin-catalog--light--1280.png",
  );
  const checksum = (image: Buffer) => createHash("sha256").update(image).digest("hex");
  expect(checksum(currentScreenshot)).toEqual(checksum(baselineScreenshot));
});
