import {expect, test} from "@playwright/test";

type RootAppearanceSnapshot = {
  colorMode: string | null;
  designSystem: string | null;
  resolvedTheme: string | null;
};

const cases = [
  {
    colorMode: "dark",
    expectedTheme: "dark",
    expectedThemeColor: "#0d1117",
    systemColorScheme: "light",
  },
  {
    colorMode: "light",
    expectedTheme: "light",
    expectedThemeColor: "#f6f8fa",
    systemColorScheme: "dark",
  },
  {
    colorMode: "system",
    expectedTheme: "dark",
    expectedThemeColor: "#0d1117",
    systemColorScheme: "dark",
  },
] as const;

for (const testCase of cases) {
  test(`preserves bootstrapped shadcn ${testCase.colorMode} through hydration`, async ({page}) => {
    await page.emulateMedia({colorScheme: testCase.systemColorScheme});
    await page.addInitScript((colorMode) => {
      window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
        version: 1,
        designSystem: "shadcn",
        colorMode,
      }));
      const observedWindow = window as typeof window & {
        __brpRootAppearanceSnapshots?: RootAppearanceSnapshot[];
      };
      observedWindow.__brpRootAppearanceSnapshots = [];
      const record = () => observedWindow.__brpRootAppearanceSnapshots?.push({
        colorMode: document.documentElement.getAttribute("data-color-mode"),
        designSystem: document.documentElement.getAttribute("data-design-system"),
        resolvedTheme: document.documentElement.getAttribute("data-resolved-theme"),
      });
      const markerObserver = new MutationObserver(record);
      const attach = () => {
        if (!document.documentElement) return false;
        markerObserver.observe(document.documentElement, {
          attributeFilter: [
            "data-color-mode",
            "data-design-system",
            "data-resolved-theme",
          ],
          attributes: true,
        });
        record();
        return true;
      };
      if (!attach()) {
        const documentObserver = new MutationObserver(() => {
          if (!attach()) return;
          documentObserver.disconnect();
        });
        documentObserver.observe(document, {childList: true});
      }
    }, testCase.colorMode);

    await page.goto("/login", {waitUntil: "domcontentloaded"});
    await expect(page.getByLabel("Електронна пошта")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", testCase.colorMode);
    await expect(page.locator("html")).toHaveAttribute(
      "data-resolved-theme",
      testCase.expectedTheme,
    );
    await page.waitForTimeout(150);

    const themeColors = await page.locator('meta[name="theme-color"]').evaluateAll((elements) => (
      elements.map((element) => ({
        content: element.getAttribute("content"),
        media: element.getAttribute("media"),
        runtime: element.getAttribute("data-brp-runtime-theme-color"),
      }))
    ));
    expect(themeColors[0]).toEqual({
      content: testCase.expectedThemeColor,
      media: null,
      runtime: "true",
    });

    const snapshots = await page.evaluate(() => (
      (window as typeof window & {
        __brpRootAppearanceSnapshots?: RootAppearanceSnapshot[];
      }).__brpRootAppearanceSnapshots ?? []
    ));
    const bootstrappedThemeIndex = snapshots.findIndex((snapshot) =>
      snapshot.designSystem === "shadcn" &&
      snapshot.colorMode === testCase.colorMode &&
      snapshot.resolvedTheme === testCase.expectedTheme
    );
    expect(bootstrappedThemeIndex).toBeGreaterThanOrEqual(0);
    expect(
      snapshots.slice(bootstrappedThemeIndex).filter((snapshot) =>
        snapshot.designSystem === "shadcn" &&
        snapshot.resolvedTheme !== testCase.expectedTheme
      ),
    ).toEqual([]);
  });
}

test("authoritative shadcn clears bootstrap-only Astryx theme markers", async ({page}) => {
  await page.addInitScript(() => {
    const astryx = {version: 1, designSystem: "astryx", colorMode: "dark"};
    const shadcn = {version: 1, designSystem: "shadcn", colorMode: "dark"};
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify(astryx));
    const replaceWithAuthoritativeShadcn = () => {
      if (document.documentElement.getAttribute("data-astryx-theme") !== "neutral") return false;
      window.localStorage.setItem("brp-appearance-v1", JSON.stringify(shadcn));
      return true;
    };
    const markerObserver = new MutationObserver(() => {
      if (!replaceWithAuthoritativeShadcn()) return;
      markerObserver.disconnect();
    });
    const attach = () => {
      if (!document.documentElement) return false;
      markerObserver.observe(document.documentElement, {
        attributeFilter: ["data-astryx-theme"],
        attributes: true,
      });
      replaceWithAuthoritativeShadcn();
      return true;
    };
    if (!attach()) {
      const documentObserver = new MutationObserver(() => {
        if (!attach()) return;
        documentObserver.disconnect();
      });
      documentObserver.observe(document, {childList: true});
    }
  });

  await page.goto("/login", {waitUntil: "domcontentloaded"});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
  await expect(page.locator("html")).not.toHaveAttribute("data-astryx-theme", "neutral");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
});

test("cold Astryx bootstrap recovers to a visible shadcn fallback when no renderer slots mount", async ({page}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: "astryx",
      colorMode: "dark",
    }));
  });

  await page.goto("/login", {waitUntil: "domcontentloaded"});
  await expect(page.locator("html")).toHaveAttribute("data-renderer-pending", "true");
  await expect(page.locator("html")).toHaveAttribute("data-astryx-theme", "neutral");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true", {
    timeout: 7_000,
  });
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "light");
  await expect(page.locator("html")).not.toHaveAttribute("data-astryx-theme", "neutral");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#f6f8fa");
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("blocked storage keeps the visible shadcn light fallback without an effect crash", async ({page}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is blocked", "SecurityError");
      },
    });
  });

  await page.goto("/login", {waitUntil: "domcontentloaded"});
  await expect(page.getByLabel("Електронна пошта")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "light");
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "light");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");
  expect(pageErrors).toEqual([]);
});

test("a provider read failure keeps a validated Astryx bootstrap and reports the error", async ({page}) => {
  test.skip(
    process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
    "The provider state probe is compiled only for the focused production regression suite.",
  );
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const key = "brp-appearance-v1";
    const preference = {version: 1, designSystem: "astryx", colorMode: "dark"};
    window.localStorage.setItem(key, JSON.stringify(preference));

    const observedWindow = window as typeof window & {
      __brpAppearanceWrites?: string[];
    };
    observedWindow.__brpAppearanceWrites = [];
    const storagePrototype = Storage.prototype;
    const originalGetItem = storagePrototype.getItem;
    const originalSetItem = storagePrototype.setItem;
    let preferenceReads = 0;
    storagePrototype.getItem = function getItem(storageKey) {
      if (storageKey === key) {
        preferenceReads++;
        if (preferenceReads === 2) {
          throw new DOMException("repository read failed", "UnknownError");
        }
      }
      return originalGetItem.call(this, storageKey);
    };
    storagePrototype.setItem = function setItem(storageKey, value) {
      if (storageKey === key) observedWindow.__brpAppearanceWrites?.push(value);
      return originalSetItem.call(this, storageKey, value);
    };
  });

  await page.goto("/login?astryx-foundation-probe=1", {waitUntil: "domcontentloaded"});
  const probe = page.getByTestId("astryx-foundation-probe");
  await expect(probe).toHaveAttribute("data-provider-design-system", "astryx");
  await expect(probe).toHaveAttribute("data-provider-color-mode", "dark");
  await expect(probe).toHaveAttribute("data-provider-status", "error");
  await expect(probe).toHaveAttribute("data-provider-error", "repository read failed");
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(page.locator("html")).not.toHaveAttribute("data-renderer-pending", "true");

  const storageState = await page.evaluate(() => ({
    preference: JSON.parse(window.localStorage.getItem("brp-appearance-v1") ?? "null"),
    writes: (window as typeof window & {__brpAppearanceWrites?: string[]})
      .__brpAppearanceWrites ?? [],
  }));
  expect(storageState.preference).toEqual({
    version: 1,
    designSystem: "astryx",
    colorMode: "dark",
  });
  expect(storageState.writes).toEqual([]);
  expect(pageErrors).toEqual([]);
});
