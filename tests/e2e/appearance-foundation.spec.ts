import {expect, test} from "@playwright/test";

test("saved Astryx hydrates shadcn first then commits one stable provider root", async ({page}) => {
  test.skip(
    process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
    "The renderer foundation probe is enabled only for the focused production regression suite.",
  );
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "light",
    }));
  });

  await page.goto("/login?astryx-foundation-probe=1", {waitUntil: "domcontentloaded"});
  await expect(page.getByLabel("Електронна пошта")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).toHaveAttribute("data-astryx-theme", "neutral");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
  await expect(page.locator('[data-astryx-theme="neutral"]')).toHaveCount(2);
  expect(pageErrors).toEqual([]);
});

for (const failure of ["import", "render"] as const) {
  test(`a rejected lazy ${failure} view restores shadcn and a fresh Astryx retry remains available`, async ({page}) => {
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

    await page.goto(`/login?astryx-foundation-probe=1&renderer-failure=${failure}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByLabel("Електронна пошта")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn", {timeout: 7_000});
    await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");

    await page.goto("/login?astryx-foundation-probe=1", {waitUntil: "domcontentloaded"});
    await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
    await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
  });
}

test("a render failure resets its boundary for a same-page Astryx retry", async ({page}) => {
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
  await page.goto("/login?astryx-foundation-probe=1&renderer-failure=render", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn", {timeout: 7_000});

  await page.evaluate(() => {
    history.replaceState(null, "", "/login?astryx-foundation-probe=1");
    const value = JSON.stringify({version: 1, designSystem: "astryx", colorMode: "light"});
    window.localStorage.setItem("brp-appearance-v1", value);
    window.dispatchEvent(new StorageEvent("storage", {
      key: "brp-appearance-v1",
      newValue: value,
      storageArea: window.localStorage,
    }));
  });
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
});
