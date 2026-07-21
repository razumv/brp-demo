import {expect, test, type Page} from "@playwright/test";

const ASTRYX_LIGHT = {version: 1, designSystem: "astryx", colorMode: "light"} as const;

async function publishAstryx(page: Page) {
  await page.evaluate((preference) => {
    const value = JSON.stringify(preference);
    window.localStorage.setItem("brp-appearance-v1", value);
    window.dispatchEvent(new StorageEvent("storage", {
      key: "brp-appearance-v1",
      newValue: value,
      storageArea: window.localStorage,
    }));
  }, ASTRYX_LIGHT);
}

test("saved Astryx hydrates the current view first, then commits one stable provider root", async ({page}) => {
  test.skip(
    process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
    "The renderer foundation probe is enabled only for the focused production regression suite.",
  );
  const pageErrors: string[] = [];
  const hydrationConsole: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (!["warning", "error"].includes(message.type())) return;
    if (/hydrat|server rendered|did not match/i.test(message.text())) {
      hydrationConsole.push(message.text());
    }
  });
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "light",
    }));
    type TraceWindow = Window & {
      __BRP_RENDERER_TRACE__?: Array<{
        designSystem: string | null;
        pending: string | null;
        theme: string | null;
      }>;
    };
    const traceWindow = window as TraceWindow;
    traceWindow.__BRP_RENDERER_TRACE__ = [];
    const sample = () => {
      const root = document.documentElement;
      traceWindow.__BRP_RENDERER_TRACE__?.push({
        designSystem: root?.dataset.designSystem ?? null,
        pending: root?.dataset.rendererPending ?? null,
        theme: document.querySelector("body > [data-astryx-theme]")?.getAttribute("data-astryx-theme") ?? null,
      });
    };
    let observingRoot = false;
    const observer = new MutationObserver(() => {
      if (!observingRoot && document.documentElement) {
        observingRoot = true;
        observer.disconnect();
        observer.observe(document.documentElement, {attributes: true, childList: true, subtree: true});
      }
      sample();
    });
    const observeRoot = () => {
      if (!document.documentElement) return false;
      observingRoot = true;
      observer.observe(document.documentElement, {attributes: true, childList: true, subtree: true});
      sample();
      return true;
    };
    if (!observeRoot()) {
      observer.observe(document, {childList: true, subtree: true});
    }
  });

  await page.goto("/login?astryx-foundation-probe=1&renderer-gate=manual", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await expect(page.locator("html")).toHaveAttribute("data-renderer-pending", "true");
  await expect(page.locator("#brp-app-root")).toHaveCSS("visibility", "visible");
  await expect(page.getByLabel("Електронна пошта")).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("visibility", "hidden");
  await expect(page.getByTestId("renderer-current-foundation-view")).toBeAttached();
  await expect(page.getByTestId("renderer-state-preservation-probe")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (
    window as Window & {__BRP_RENDERER_GATE_WAITING__?: boolean}
  ).__BRP_RENDERER_GATE_WAITING__ ?? false)).toBe(true);

  await page.evaluate(() => {
    window.dispatchEvent(new Event("brp:renderer-gate-release"));
  });

  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).toHaveAttribute("data-astryx-theme", "neutral");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
  await expect(page.locator("#brp-app-root")).toHaveCSS("visibility", "visible");
  await expect(page.getByTestId("renderer-state-preservation-probe")).toBeVisible();
  await expect(page.locator('[data-astryx-theme="neutral"]')).toHaveCount(2);

  const trace = await page.evaluate(() => (
    window as Window & {
      __BRP_RENDERER_TRACE__?: Array<{
        designSystem: string | null;
        pending: string | null;
        theme: string | null;
      }>;
    }
  ).__BRP_RENDERER_TRACE__ ?? []);
  const currentIndex = trace.findIndex((sample) => (
    sample.designSystem === "shadcn" &&
    sample.pending === "true" &&
    sample.theme === "brp-current-compatibility"
  ));
  const astryxIndex = trace.findIndex((sample, index) => (
    index > currentIndex &&
    sample.designSystem === "astryx" &&
    sample.pending === null &&
    sample.theme === "neutral"
  ));
  expect(currentIndex).toBeGreaterThanOrEqual(0);
  expect(astryxIndex).toBeGreaterThan(currentIndex);
  expect(pageErrors).toEqual([]);
  expect(hydrationConsole).toEqual([]);
});

test("a normal route cannot use the test probe to fake production Astryx readiness", async ({page}) => {
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
  await page.goto("/login", {waitUntil: "domcontentloaded"});
  await expect(page.getByTestId("astryx-foundation-probe")).toHaveCount(0);
  await expect(page.getByLabel("Електронна пошта")).toBeVisible({timeout: 1_000});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn", {timeout: 7_000});
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true", {timeout: 7_000});
  await expect(page.getByLabel("Електронна пошта")).toBeVisible();
});

for (const failure of ["import", "render"] as const) {
  test(`a rejected lazy ${failure} view can retry in the same document`, async ({page}) => {
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
    await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn", {timeout: 7_000});
    await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
    await expect(page.getByTestId("renderer-current-foundation-view")).toBeVisible();
    await expect.poll(() => page.evaluate(() => (
      window.localStorage.getItem("brp-appearance-v1")
    ))).toBe(JSON.stringify({version: 1, designSystem: "shadcn", colorMode: "light"}));

    await page.evaluate(() => {
      history.replaceState(null, "", "/login?astryx-foundation-probe=1");
    });
    await publishAstryx(page);
    await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
    await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
    await expect(page.getByTestId("renderer-state-preservation-probe")).toBeVisible();
  });
}
