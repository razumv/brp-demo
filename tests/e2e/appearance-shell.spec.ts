import {expect, test, type Page} from "@playwright/test";
import {loginAsAdmin} from "./support/admin-session";
import {seedDealerWorkflowSession} from "./support/dealer-workflow-session";

type DesignSystem = "shadcn" | "astryx";
type ColorMode = "light" | "dark";

async function publishAppearance(
  page: Page,
  designSystem: DesignSystem,
  colorMode: ColorMode = "light",
) {
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
}

async function seedAppearance(
  page: Page,
  designSystem: DesignSystem,
  colorMode: ColorMode = "light",
) {
  await page.addInitScript(({nextDesignSystem, nextColorMode}) => {
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({
      version: 1,
      designSystem: nextDesignSystem,
      colorMode: nextColorMode,
    }));
  }, {nextDesignSystem: designSystem, nextColorMode: colorMode});
}

test("admin login opens one complete Astryx shell with grouped selected navigation", async ({page}) => {
  await seedAppearance(page, "astryx");
  await loginAsAdmin(page);

  const shell = page.locator('[data-brp-shell-renderer="astryx"]');
  const sideNavigation = page.getByRole("navigation", {name: "Side navigation"});
  await expect(shell).toHaveCount(1);
  await expect(page.locator("[data-brp-shell-renderer]")).toHaveCount(1);
  await expect(sideNavigation.getByText("ОПЕРАЦІЇ", {exact: true})).toBeVisible();
  await expect(sideNavigation.getByText("ЛОГІСТИКА", {exact: true})).toBeVisible();
  await expect(sideNavigation.getByRole("link", {name: "Огляд", exact: true})).toHaveAttribute("aria-current", "page");

  const query = page.getByRole("textbox", {name: "Глобальний пошук"});
  await query.fill("507032417");
  await query.press("Enter");
  await expect(page).toHaveURL(/\/admin\/bossweb-lookup\?part=507032417$/);
  await expect(sideNavigation.getByRole("link", {name: "Пошук запчастини", exact: true})).toHaveAttribute("aria-current", "page");

  const themeAction = page.getByRole("button", {name: "switch_to_dark"});
  await themeAction.click();
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
});

test("Astryx desktop rail persists after reload and keeps compact navigation focusable", async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await seedAppearance(page, "astryx");
  await loginAsAdmin(page);

  const sideNavigation = page.getByRole("navigation", {name: "Side navigation"});
  const collapseRail = page.getByRole("button", {name: "Згорнути бічну навігацію"});
  const shell = page.locator('[data-brp-shell-renderer="astryx"]');
  await expect(shell).toHaveAttribute("data-sidebar-collapsed", "false");
  await collapseRail.focus();
  await page.keyboard.press("Enter");
  await expect(shell).toHaveAttribute("data-sidebar-collapsed", "true");
  await expect(page.getByRole("button", {name: "Розгорнути бічну навігацію"})).toBeFocused();
  await expect(sideNavigation.getByRole("link", {name: "Огляд", exact: true})).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();

  await page.reload();
  await expect(shell).toHaveAttribute("data-sidebar-collapsed", "true");
  await expect(page.getByRole("button", {name: "Розгорнути бічну навігацію"})).toBeVisible();
  await expect(sideNavigation.getByRole("link", {name: "Огляд", exact: true})).toHaveAttribute("aria-label", "Огляд");
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();

  await page.setViewportSize({width: 768, height: 900});
  await expect(page.getByRole("button", {name: "Меню"})).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();

  await page.setViewportSize({width: 1440, height: 900});
  await expect(sideNavigation).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();
});

test("dealer shell preserves search, availability tab, and cart across both renderer directions", async ({page}) => {
  await seedAppearance(page, "shadcn");
  await seedDealerWorkflowSession(page);
  await page.goto("/");

  const search = page.getByRole("combobox", {name: "Глобальний пошук запчастин"});
  await search.fill("507");
  let results = page.getByRole("dialog", {name: "Результати пошуку запчастин"});
  await results.getByRole("tab", {name: "Під замовлення (9)"}).click();
  await results.getByRole("button", {name: "Додати 507020200 до кошика"}).click();
  await expect(page.getByRole("button", {name: "Кошик (1)"})).toBeVisible();

  await publishAppearance(page, "astryx");
  await expect(page.locator('[data-brp-shell-renderer="astryx"]')).toHaveCount(1);
  await expect(page.locator("[data-brp-shell-renderer]")).toHaveCount(1);
  await expect(search).toHaveValue("507");
  results = page.getByRole("dialog", {name: "Результати пошуку запчастин"});
  await expect(results).toBeVisible();
  await expect(results.getByRole("tab", {name: "Під замовлення (9)"})).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", {name: "Кошик (1)"})).toBeVisible();

  await publishAppearance(page, "shadcn");
  await expect(page.locator('[data-brp-shell-renderer="current"]')).toHaveCount(1);
  await expect(page.locator("[data-brp-shell-renderer]")).toHaveCount(1);
  await expect(search).toHaveValue("507");
  await expect(page.getByRole("dialog", {name: "Результати пошуку запчастин"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Кошик (1)"})).toBeVisible();
});

test("current shell popovers expose menu semantics and restore focus after Escape", async ({page}) => {
  await seedAppearance(page, "shadcn");
  await loginAsAdmin(page);

  const languageTrigger = page.getByRole("button", {name: "language_switcher"});
  await languageTrigger.click();
  await expect(languageTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menu", {name: "Мова інтерфейсу"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", {name: "Мова інтерфейсу"})).toHaveCount(0);
  await expect(languageTrigger).toBeFocused();

  const profileTrigger = page.getByRole("button", {name: "Профіль"});
  await profileTrigger.click();
  await expect(profileTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menu", {name: "Меню профілю"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", {name: "Меню профілю"})).toHaveCount(0);
  await expect(profileTrigger).toBeFocused();
});

test.describe("Astryx shell at 390px", () => {
  test.use({hasTouch: true, isMobile: true, viewport: {width: 390, height: 844}});

  test("mobile navigation contains focus, closes on Escape, returns focus, and closes after navigation", async ({page}) => {
    await seedAppearance(page, "astryx");
    await seedDealerWorkflowSession(page);
    await page.goto("/");

    const trigger = page.getByRole("button", {name: "Меню"});
    await trigger.click();
    let navigation = page.getByRole("dialog", {name: "Навігація"});
    await expect(navigation).toBeVisible();
    await expect.poll(() => navigation.locator(":scope > div").first().evaluate((element) => (
      getComputedStyle(element).backgroundColor
    ))).not.toBe("rgba(0, 0, 0, 0)");

    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      await expect.poll(() => navigation.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(navigation).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    navigation = page.getByRole("dialog", {name: "Навігація"});
    await navigation.getByRole("link", {name: "Каталог", exact: true}).click();
    await expect(page).toHaveURL(/\/catalog\/?$/);
    await expect(navigation).toHaveCount(0);
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBeTruthy();
  });
});

test("login and offline screens render once in Astryx without changing their workflows", async ({page}) => {
  await seedAppearance(page, "astryx", "dark");
  await page.goto("/login");
  await expect(page.locator('[data-brp-login-renderer="astryx"]')).toHaveCount(1);
  await expect(page.locator("[data-brp-login-renderer]")).toHaveCount(1);
  await expect(page.locator('[data-brp-login-layout="form-first"]')).toHaveCount(1);
  await expect(page.locator('[data-brp-login-form-zone]')).toHaveCount(1);
  await expect(page.locator('[data-brp-login-brand-zone]')).toHaveCount(1);
  await expect.poll(() => page.locator('[data-brp-login-form-zone]').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  await page.getByLabel("Електронна пошта").fill("dealer@example.invalid");
  await page.locator('input[type="password"]:visible').fill("not-persisted");
  await page.getByRole("button", {name: "Увійти"}).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-brp-shell-renderer="astryx"]')).toHaveCount(1);

  await page.goto("/offline");
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
  await expect(page.locator('[data-brp-offline-renderer="astryx"]')).toHaveCount(1);
  await expect(page.locator("[data-brp-offline-renderer]")).toHaveCount(1);
  await expect(page.getByRole("heading", {name: "Немає з’єднання"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Спробувати знову"})).toBeVisible();
  await expect(page.getByRole("link", {name: "На головну"})).toHaveAttribute("href", /\/$/);
});
