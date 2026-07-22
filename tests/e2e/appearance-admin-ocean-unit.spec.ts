import {expect, test, type Locator, type Page} from "@playwright/test";
import {openAdminRoute, seedAdminSession} from "./support/admin-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

const appearances: readonly {
  designSystem: DesignSystem;
  colorMode: ColorMode;
  renderer: "current" | "astryx";
}[] = [
  {designSystem: "shadcn", colorMode: "light", renderer: "current"},
  {designSystem: "shadcn", colorMode: "dark", renderer: "current"},
  {designSystem: "astryx", colorMode: "light", renderer: "astryx"},
  {designSystem: "astryx", colorMode: "dark", renderer: "astryx"},
];

async function seedAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.addInitScript(({nextDesignSystem, nextColorMode}) => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    }));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
}

async function publishAppearance(page: Page, designSystem: DesignSystem, colorMode: ColorMode) {
  await page.evaluate(({nextDesignSystem, nextColorMode}) => {
    const key = "brp-appearance-v1";
    const value = JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    });
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      newValue: value,
      storageArea: window.localStorage,
    }));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
  await expect(page.locator("html")).toHaveAttribute("data-design-system", designSystem);
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", colorMode);
}

function oceanViewControl(page: Page, name: "Таблиця" | "Картки", renderer: "current" | "astryx") {
  return renderer === "astryx"
    ? page.getByRole("radio", {name, exact: true})
    : page.getByRole("button", {name, exact: true});
}

function unitTabControl(page: Page, name: RegExp, renderer: "current" | "astryx") {
  return renderer === "astryx"
    ? page.getByRole("radio", {name})
    : page.getByRole("tab", {name});
}

async function selectControlOption(
  page: Page,
  name: string,
  option: {label: string; value: string},
) {
  const control = page.getByRole("combobox", {name});
  const tagName = await control.evaluate((element) => element.tagName);

  if (tagName === "SELECT") {
    await control.selectOption(option.value);
    return;
  }

  await control.click();
  await page.getByRole("option", {name: option.label, exact: true}).click();
}

async function expectNoDocumentOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBeLessThanOrEqual(1);
}

async function expectPairwiseDistinctBackgrounds(elements: readonly Locator[]) {
  const backgrounds = await Promise.all(elements.map((element) => element.evaluate((node) => getComputedStyle(node).backgroundColor)));
  expect(backgrounds).not.toContain("rgba(0, 0, 0, 0)");
  expect(new Set(backgrounds).size).toBe(backgrounds.length);
}

async function expectVisibleFocusOutline(element: Locator) {
  const outline = await element.evaluate((node) => {
    const styles = getComputedStyle(node);
    return {color: styles.outlineColor, style: styles.outlineStyle, width: Number.parseFloat(styles.outlineWidth)};
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(1);
  expect(outline.color).not.toBe("rgba(0, 0, 0, 0)");
}

test.describe("admin ocean freight appearance matrix", () => {
  for (const appearance of appearances) {
    test(`${appearance.designSystem} ${appearance.colorMode} preserves freight filters and BL workflows`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, appearance.designSystem, appearance.colorMode);
      await page.goto("/admin/ocean-freight");

      await expect(page.locator(`[data-admin-ocean-renderer="${appearance.renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Морські перевезення"})).toBeVisible();

      const search = page.getByRole("textbox", {name: "Пошук контейнера, BL, проформи"});
      await search.fill("UACU5875229");
      await expect(page.getByText("UACU5875229", {exact: true}).first()).toBeVisible();
      await selectControlOption(page, "Статус морського перевезення", {
        label: "Прибув",
        value: "arrived",
      });
      await expect(page.getByText("UACU5875229", {exact: true}).first()).toBeVisible();

      await oceanViewControl(page, "Картки", appearance.renderer).click();
      await expect(page.getByRole("button", {name: /Деталі BL 252108428/}).first()).toBeVisible();
      await page.getByRole("button", {name: /Деталі BL 252108428/}).first().click();
      const detail = page.getByRole("dialog", {name: "BL 252108428"});
      await expect(detail).toBeVisible();
      await expect(detail.getByRole("button", {name: "Оновити ETA для цього коносамента"})).toBeDisabled();
      await expect(detail.getByRole("button", {name: "Завантажити документи цього коносамента"})).toBeDisabled();
      await page.keyboard.press("Escape");

      await page.getByRole("button", {name: /Jan 29 \(Arrived\)/}).first().click();
      await expect(page.getByRole("dialog", {name: "ETA — лише перегляд"})).toBeVisible();
      await page.keyboard.press("Escape");

      if (appearance.renderer === "astryx") {
        await expect(page.locator('[data-admin-ocean-renderer="astryx"]')).not.toContainText(/демо|mockup|clone|клон|демонстрац/i);
      }
    });
  }

  test("freight search, grouping, view and open detail survive both renderer directions", async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "shadcn", "light");
    await page.goto("/admin/ocean-freight");

    const search = page.getByRole("textbox", {name: "Пошук контейнера, BL, проформи"});
    await search.fill("252108428");
    await oceanViewControl(page, "Картки", "current").click();
    const grouped = page.getByRole("button", {name: "Групувати за BL"});
    await grouped.click();
    await page.getByRole("button", {name: /Деталі BL 252108428/}).first().click();

    await publishAppearance(page, "astryx", "dark");
    await expect(page.locator('[data-admin-ocean-renderer="astryx"]')).toHaveCount(1);
    await expect(page.getByRole("textbox", {name: "Пошук контейнера, BL, проформи"})).toHaveValue("252108428");
    await expect(page.getByRole("button", {name: "Групувати за BL"})).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("dialog", {name: "BL 252108428"})).toHaveCount(1);

    await page.keyboard.press("Escape");
    await publishAppearance(page, "shadcn", "light");
    await expect(page.locator('[data-admin-ocean-renderer="current"]')).toHaveCount(1);
    await expect(page.getByRole("textbox", {name: "Пошук контейнера, BL, проформи"})).toHaveValue("252108428");
    await expect(page.getByRole("button", {name: "Групувати за BL"})).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", {name: "Картки", exact: true})).toHaveAttribute("aria-pressed", "true");
  });

  for (const colorMode of ["light", "dark"] as const) {
    test(`Astryx ${colorMode} gives ocean operations distinct table surface roles`, async ({page}) => {
      await page.setViewportSize({width: 1280, height: 900});
      await seedAdminSession(page);
      await seedAppearance(page, "astryx", colorMode);
      await page.goto("/admin/ocean-freight");

      const ocean = page.locator('[data-admin-ocean-renderer="astryx"]');
      const tableRegion = page.getByRole("region", {name: "Контейнери морських перевезень"}).first();
      await expect(ocean).toHaveCount(1);
      await expect(ocean).toHaveAttribute("data-operational-surface", "ocean-canvas");
      await expect(ocean.locator('[data-operational-surface="ocean-card"]')).toHaveCount(1);
      await expect(ocean.locator('[data-operational-surface="ocean-table-header"]')).toHaveCount(1);
      expect(await ocean.locator('[data-operational-surface="ocean-bl-group"]').count()).toBeGreaterThan(0);
      await expect(ocean.locator('[data-operational-surface="ocean-table-body"]')).toHaveCount(1);
      expect(await ocean.locator('[data-operational-surface="ocean-table-hover"]').count()).toBeGreaterThan(0);
      await expectPairwiseDistinctBackgrounds([
        ocean,
        ocean.locator('[data-operational-surface="ocean-card"]'),
        ocean.locator('[data-operational-surface="ocean-table-header"]'),
        ocean.locator('[data-operational-surface="ocean-bl-group"]').first(),
        ocean.locator('[data-operational-surface="ocean-table-body"]'),
      ]);

      const firstContainerRow = ocean.locator('[data-operational-surface="ocean-table-hover"]').first();
      const rowBackground = await firstContainerRow.evaluate((element) => getComputedStyle(element).backgroundColor);
      await firstContainerRow.hover();
      await expect.poll(() => firstContainerRow.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(rowBackground);

      await tableRegion.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(tableRegion).toBeFocused();
      await expectVisibleFocusOutline(tableRegion);

      await oceanViewControl(page, "Картки", "astryx").click();
      await expect(ocean.locator('[data-operational-surface="ocean-card"]')).toHaveCount(1);
      await expectNoDocumentOverflow(page);
    });
  }
});

test.describe("admin unit shipping appearance matrix", () => {
  for (const appearance of appearances) {
    test(`${appearance.designSystem} ${appearance.colorMode} preserves filters, pagination and VIN disclosure`, async ({page}) => {
      await seedAdminSession(page);
      await seedAppearance(page, appearance.designSystem, appearance.colorMode);
      await page.goto("/admin/unit-shipping");

      await expect(page.locator(`[data-admin-unit-shipping-renderer="${appearance.renderer}"]`)).toHaveCount(1);
      await expect(page.getByRole("heading", {name: "Відвантаження техніки"})).toBeVisible();
      await expect(page.getByRole("button", {name: "Синхр. з BossWeb"})).toBeDisabled();
      await expect(page.getByText(/зовнішня синхронізація заблокована/i)).toBeVisible();

      const search = page.getByRole("textbox", {name: "Пошук замовлення або моделі"});
      await search.fill("1022615153");
      await expect(page.getByText(/1022615153-000030/).first()).toBeVisible();
      await search.fill("");

      await unitTabControl(page, /Відвантажені замовлення/, appearance.renderer).click();
      await page.getByRole("textbox", {name: "Пошук замовлення або моделі"}).fill("1022793566");
      const vins = page.getByRole("button", {name: /Показати або приховати VIN за замовленням 1022793566-000010/});
      await vins.click();
      await expect(page.getByRole("region", {name: /Серійні номери замовлення 1022793566-000010/})).toBeVisible();
      await expect(page.getByText("3JB8TAU43TE001915", {exact: true})).toBeVisible();

      if (appearance.renderer === "astryx") {
        await expect(page.locator('[data-admin-unit-shipping-renderer="astryx"]')).not.toContainText(/демо|mockup|clone|клон|демонстрац/i);
      }
    });
  }

  test("unit tab, query, category and expanded VIN survive both renderer directions", async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "shadcn", "light");
    await page.goto("/admin/unit-shipping");

    await page.getByRole("tab", {name: /Відвантажені замовлення/}).click();
    await page.getByRole("textbox", {name: "Пошук замовлення або моделі"}).fill("1022793566");
    await selectControlOption(page, "Тип техніки", {
      label: "Side-by-Side",
      value: "Side-by-Side",
    });
    await page.getByRole("button", {name: /Показати або приховати VIN за замовленням 1022793566-000010/}).click();

    await publishAppearance(page, "astryx", "dark");
    await expect(page.locator('[data-admin-unit-shipping-renderer="astryx"]')).toHaveCount(1);
    await expect(page.getByRole("textbox", {name: "Пошук замовлення або моделі"})).toHaveValue("1022793566");
    await expect(page.getByRole("combobox", {name: "Тип техніки"})).toContainText("Side-by-Side");
    await expect(page.getByRole("region", {name: /Серійні номери замовлення 1022793566-000010/})).toBeVisible();

    await publishAppearance(page, "shadcn", "light");
    await expect(page.locator('[data-admin-unit-shipping-renderer="current"]')).toHaveCount(1);
    await expect(page.getByRole("textbox", {name: "Пошук замовлення або моделі"})).toHaveValue("1022793566");
    await expect(page.getByRole("combobox", {name: "Тип техніки"})).toHaveValue("Side-by-Side");
    await expect(page.getByRole("region", {name: /Серійні номери замовлення 1022793566-000010/})).toBeVisible();
  });
});

for (const width of [390, 768] as const) {
  test(`Astryx ocean and unit dense regions fit ${width}px without document overflow`, async ({page}) => {
    await seedAdminSession(page);
    await seedAppearance(page, "astryx", "light");

    await openAdminRoute(page, "/admin/ocean-freight", width);
    await expect(page.locator('[data-admin-ocean-renderer="astryx"]')).toHaveCount(1);
    await expectNoDocumentOverflow(page);
    await expect(page.getByRole("region", {name: "Контейнери морських перевезень"}).first()).toBeVisible();

    await openAdminRoute(page, "/admin/unit-shipping", width);
    await expect(page.locator('[data-admin-unit-shipping-renderer="astryx"]')).toHaveCount(1);
    await expectNoDocumentOverflow(page);
    await expect(page.getByRole("region", {name: "Таблиця відвантажень"})).toBeVisible();
  });
}
