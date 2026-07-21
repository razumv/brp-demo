import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

async function publishColorMode(page: Page, colorMode: "light" | "dark") {
  await page.evaluate((nextColorMode) => {
    const preference = JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: nextColorMode,
    });
    window.localStorage.setItem("brp-appearance-v1", preference);
    window.dispatchEvent(new StorageEvent("storage", {
      key: "brp-appearance-v1",
      newValue: preference,
      storageArea: window.localStorage,
    }));
  }, colorMode);
}

test("renders real Astryx foundation components through the official light and dark Theme modes", async ({ page }) => {
  test.skip(
    process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
    "The renderer foundation probe is enabled only for the focused production regression suite.",
  );
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
  const region = page.getByTestId("renderer-state-preservation-probe");
  await expect(region).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-astryx-theme", "neutral");
  await expect(page.locator('[data-astryx-theme="neutral"]')).toHaveCount(2);

  const assertFoundationGeometry = async () => {
    const controls = [
      region.getByRole("button", { name: "Foundation action" }),
      region.getByRole("textbox", { name: "Renderer query" }).locator(".."),
      region.getByTestId("astryx-foundation-card"),
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
  };
  const buttonColors = () => region
    .getByRole("button", { name: "Foundation action" })
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    });

  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "light");
  await expect(region).toHaveAttribute("data-color-mode", "light");
  await assertFoundationGeometry();
  const lightColors = await buttonColors();
  expect(lightColors.background).not.toBe("rgba(0, 0, 0, 0)");
  await expect(region.getByRole("textbox", { name: "Renderer query" })).toHaveCSS(
    "font-family",
    /Figtree Variable.*Inter/,
  );

  await publishColorMode(page, "dark");
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
  await expect(region).toHaveAttribute("data-color-mode", "dark");
  await assertFoundationGeometry();
  const darkColors = await buttonColors();
  expect(darkColors).not.toEqual(lightColors);
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
  const compatibilityStyles = await page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>(
      'body > [data-astryx-theme="brp-current-compatibility"]',
    );
    const appRoot = document.querySelector<HTMLElement>("#brp-app-root");
    if (!wrapper || !appRoot) throw new Error("Compatibility Theme wrapper is missing.");
    return {
      appColor: getComputedStyle(appRoot).color,
      foreground: getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim(),
      htmlDisplay: getComputedStyle(document.documentElement).display,
      wrapperColor: getComputedStyle(wrapper).color,
      wrapperDisplay: getComputedStyle(wrapper).display,
    };
  });
  expect(compatibilityStyles).toEqual({
    appColor: "rgb(31, 35, 40)",
    foreground: "#1f2328",
    htmlDisplay: "block",
    wrapperColor: "rgb(31, 35, 40)",
    wrapperDisplay: "contents",
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const currentScreenshot = await page.screenshot({ animations: "disabled", fullPage: false });
  const baselineScreenshot = await readFile(
    "docs/design-references/astryx-baseline/admin-catalog--light--1280.png",
  );
  const checksum = (image: Buffer) => createHash("sha256").update(image).digest("hex");
  expect(checksum(currentScreenshot)).toEqual(checksum(baselineScreenshot));
});
