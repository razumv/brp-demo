import { expect, test, type Locator, type Page } from "@playwright/test";
import type { ColorMode, DesignSystem } from "@/lib/appearance";
import { seedDealerWorkflowSession } from "./support/dealer-workflow-session";

const catalogListPath = "/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603";
const catalogDiagramPath = "/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25";
const accessoriesPath = "/dealer/accessories";

const appearances = [
  { designSystem: "shadcn", colorMode: "light" },
  { designSystem: "shadcn", colorMode: "dark" },
  { designSystem: "astryx", colorMode: "light" },
  { designSystem: "astryx", colorMode: "dark" },
] as const satisfies ReadonlyArray<{ designSystem: DesignSystem; colorMode: ColorMode }>;

const viewportWidths = [390, 768, 1280, 1440] as const;

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

async function publishAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.evaluate(({ nextColorMode, nextDesignSystem }) => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      newValue,
      storageArea: window.localStorage,
    }));
  }, { nextColorMode: colorMode, nextDesignSystem: designSystem });

  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", colorMode);
}

async function expectAvailabilityContrast(
  locator: Locator,
  context: string,
) {
  await expect(locator, `${context} should render`).not.toHaveCount(0);
  const contrastResults = await locator.evaluateAll((elements) => {
    type Rgba = { red: number; green: number; blue: number; alpha: number };

    const clamp = (value: number, minimum = 0, maximum = 1) => (
      Math.min(maximum, Math.max(minimum, value))
    );

    const parseAlpha = (value: string | undefined) => {
      if (!value) return 1;
      return value.endsWith("%")
        ? clamp(Number.parseFloat(value) / 100)
        : clamp(Number.parseFloat(value));
    };

    const parseRgbChannel = (value: string) => (
      value.endsWith("%")
        ? clamp(Number.parseFloat(value) / 100)
        : clamp(Number.parseFloat(value) / 255)
    );

    const parseColor = (input: string): Rgba => {
      const value = input.trim().toLowerCase();
      if (value === "transparent") {
        return { red: 0, green: 0, blue: 0, alpha: 0 };
      }

      const srgbMatch = value.match(/^color\(srgb\s+([^)]*)\)$/);
      if (srgbMatch) {
        const [channels = "", alpha] = srgbMatch[1].split("/").map((part) => part.trim());
        const [red, green, blue] = channels.split(/\s+/).map(Number);
        if ([red, green, blue].every(Number.isFinite)) {
          return {
            red: clamp(red),
            green: clamp(green),
            blue: clamp(blue),
            alpha: parseAlpha(alpha),
          };
        }
      }

      const rgbMatch = value.match(/^rgba?\(([^)]*)\)$/);
      if (rgbMatch) {
        const [channels = "", slashAlpha] = rgbMatch[1].split("/").map((part) => part.trim());
        const parts = channels.replaceAll(",", " ").split(/\s+/).filter(Boolean);
        const [red, green, blue, legacyAlpha] = parts;
        if (red && green && blue) {
          return {
            red: parseRgbChannel(red),
            green: parseRgbChannel(green),
            blue: parseRgbChannel(blue),
            alpha: parseAlpha(slashAlpha ?? legacyAlpha),
          };
        }
      }

      throw new Error(`Unsupported computed color: ${input}`);
    };

    const composite = (foreground: Rgba, background: Rgba): Rgba => {
      const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
      if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 };
      return {
        red: (foreground.red * foreground.alpha
          + background.red * background.alpha * (1 - foreground.alpha)) / alpha,
        green: (foreground.green * foreground.alpha
          + background.green * background.alpha * (1 - foreground.alpha)) / alpha,
        blue: (foreground.blue * foreground.alpha
          + background.blue * background.alpha * (1 - foreground.alpha)) / alpha,
        alpha,
      };
    };

    const effectiveBackground = (element: Element) => {
      let background: Rgba = { red: 0, green: 0, blue: 0, alpha: 0 };
      let current: Element | null = element;
      while (current) {
        background = composite(background, parseColor(window.getComputedStyle(current).backgroundColor));
        if (background.alpha >= 0.999) return background;
        current = current.parentElement;
      }

      const rootColorScheme = window.getComputedStyle(document.documentElement).colorScheme;
      return composite(
        background,
        rootColorScheme.includes("dark")
          ? { red: 0, green: 0, blue: 0, alpha: 1 }
          : { red: 1, green: 1, blue: 1, alpha: 1 },
      );
    };

    const linearChannel = (channel: number) => (
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    );

    const luminance = (color: Rgba) => (
      0.2126 * linearChannel(color.red)
      + 0.7152 * linearChannel(color.green)
      + 0.0722 * linearChannel(color.blue)
    );

    return elements.map((element) => {
      const background = effectiveBackground(element);
      const foreground = composite(
        parseColor(window.getComputedStyle(element).color),
        background,
      );
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      return {
        text: element.textContent?.trim() ?? "",
        ratio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
          / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
      };
    });
  });

  for (const result of contrastResults) {
    expect(
      result.ratio,
      `${context} (${result.text}) contrast ratio`,
    ).toBeGreaterThanOrEqual(4.5);
  }
}

async function expectNoDocumentOverflow(page: Page, context: string) {
  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    { message: `${context} should not overflow horizontally` },
  ).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await seedDealerWorkflowSession(page);
  await page.addInitScript(() => {
    if (!window.localStorage.getItem("brp-appearance-v1")) {
      window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "light" }));
    }
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

  await publishAppearance(page, "shadcn", "dark");

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

test("catalog diagram search and accessory filters survive renderer and mode changes", async ({ page }) => {
  await page.goto(catalogListPath);
  await expect(page.locator('[data-dealer-catalog-renderer="astryx"]')).toHaveCount(1);
  const diagramQuery = searchControl(page, "Пошук схем");
  await diagramQuery.fill("maintenance parts");
  await expect(page.getByRole("region", { name: "Схеми моделі" }).getByRole("link")).toHaveCount(1);

  await publishAppearance(page, "shadcn", "dark");

  await expect(page.locator('[data-dealer-catalog-renderer="shadcn"]')).toHaveCount(1);
  await expect(diagramQuery).toHaveValue("maintenance parts");
  await expect(page.getByRole("img", { name: /Мініатюра схеми/ })).toBeVisible();

  await page.goto(accessoriesPath);
  await expect(page.getByRole("img", { name: "Can-Am Off-Road — логотип сімейства" })).toBeVisible();
  const families = page.getByLabel("Сімейства аксесуарів");
  const skiDoo = families.getByRole("button", { name: /^Ski-Doo/ });
  await skiDoo.click();
  await page.getByLabel("Наявність").selectOption("in-stock");
  const accessoryQuery = searchControl(page, "Пошук аксесуарів");
  await accessoryQuery.fill("860202447");
  await expect(page.getByRole("button", { name: /LinQ Adventure Tunnel Bag/ })).toBeVisible();
  await expect(page.getByText("Знайдено: 1", { exact: true })).toBeVisible();
  const filteredUrl = page.url();

  await publishAppearance(page, "astryx", "light");

  await expect(skiDoo).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Наявність")).toHaveValue("in-stock");
  await expect(accessoryQuery).toHaveValue("860202447");
  await expect(page.getByRole("button", { name: /LinQ Adventure Tunnel Bag/ })).toBeVisible();
  await expect(page.getByText("Знайдено: 1", { exact: true })).toBeVisible();
  expect(page.url()).toBe(filteredUrl);
});

for (const appearance of appearances) {
  test(`availability contrast and responsive layout pass for ${appearance.designSystem} ${appearance.colorMode}`, async ({ page }) => {
    test.setTimeout(120_000);
    const appearanceLabel = `${appearance.designSystem} ${appearance.colorMode}`;

    await page.goto(accessoriesPath);
    await publishAppearance(page, appearance.designSystem, appearance.colorMode);
    await expect(page.locator(
      `[data-dealer-feature="accessories"][data-dealer-feature-renderer="${appearance.designSystem}"]`,
    )).toHaveCount(1);
    await expectAvailabilityContrast(
      page.locator('[data-availability="in-stock"]'),
      `${appearanceLabel} accessory in-stock badge`,
    );
    await expectAvailabilityContrast(
      page.locator('[data-availability="under-order"]'),
      `${appearanceLabel} accessory under-order badge`,
    );

    await page.goto(catalogDiagramPath);
    await expect(page.locator("html")).toHaveAttribute("data-design-system", appearance.designSystem);
    await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", appearance.colorMode);
    await expectAvailabilityContrast(
      page.locator('[data-availability="in-stock"]'),
      `${appearanceLabel} catalog in-stock badge`,
    );
    await expectAvailabilityContrast(
      page.locator('[data-availability="out-of-stock"]'),
      `${appearanceLabel} catalog out-of-stock badge`,
    );

    for (const width of viewportWidths) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        { path: catalogListPath, renderer: "catalog" },
        { path: accessoriesPath, renderer: "accessories" },
      ] as const) {
        await page.goto(route.path);
        await expect(page.locator("html")).toHaveAttribute("data-design-system", appearance.designSystem);
        await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", appearance.colorMode);
        if (route.renderer === "catalog") {
          await expect(page.locator(`[data-dealer-catalog-renderer="${appearance.designSystem}"]`)).toHaveCount(1);
        } else {
          await expect(page.locator(
            `[data-dealer-feature="accessories"][data-dealer-feature-renderer="${appearance.designSystem}"]`,
          )).toHaveCount(1);
        }
        await expectNoDocumentOverflow(page, `${appearanceLabel} ${route.renderer} at ${width}px`);
      }
    }
  });
}
