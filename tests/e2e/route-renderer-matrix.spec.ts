import { expect, test, type Page } from "@playwright/test";
import { APPEARANCE_ROUTE_INVENTORY } from "@/lib/appearance/route-inventory";
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState, Role } from "@/lib/types";

const appearances = [
  { designSystem: "shadcn", colorMode: "light", renderer: "shadcn" },
  { designSystem: "shadcn", colorMode: "dark", renderer: "shadcn" },
  { designSystem: "astryx", colorMode: "light", renderer: "astryx" },
  { designSystem: "astryx", colorMode: "dark", renderer: "astryx" },
] as const;

async function seedRoute(page: Page, role: Role | "public", appearance: typeof appearances[number]) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = role === "public" ? null : {
    role,
    email: role === "admin" ? "admin.demo@local.invalid" : "orders@logos.ua",
    displayName: role === "admin" ? "Razumv Admin" : "Олена Коваль",
    company: "Logos",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };
  await page.evaluate(({ persistedState, nextAppearance }) => {
    window.localStorage.setItem("brp-clone-demo-state-v1", JSON.stringify(persistedState));
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, ...nextAppearance }));
    window.sessionStorage.clear();
  }, { persistedState: state, nextAppearance: { designSystem: appearance.designSystem, colorMode: appearance.colorMode } });
}

for (const appearance of appearances) {
  test(`${appearance.designSystem} ${appearance.colorMode} certifies every checked route`, async ({ page }) => {
    test.setTimeout(10 * 60_000);
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: appearance.colorMode });
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto("/login/");
    for (const row of APPEARANCE_ROUTE_INVENTORY) {
      runtimeErrors.length = 0;
      await seedRoute(page, row.role, appearance);
      const response = await page.goto(row.path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${row.path} HTTP status`).toBeLessThan(400);
      await expect(page.locator("html"), `${row.path} design system`).toHaveAttribute("data-design-system", appearance.designSystem);
      await expect(page.locator("html"), `${row.path} color mode`).toHaveAttribute("data-resolved-theme", appearance.colorMode);
      await expect(page.locator("html"), `${row.path} renderer readiness`).not.toHaveAttribute("data-renderer-pending", /.+/);
      await expect(page.getByRole("heading").first(), `${row.path} heading`).toBeVisible();
      if (!row.specialBehaviors.includes("dense-scroller")) {
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), {
          message: `${row.path} must not overflow the page viewport`,
        }).toBeLessThanOrEqual(1);
      }

      await page.keyboard.press("Tab");
      await expect.poll(() => page.evaluate(() => document.activeElement !== document.body)).toBe(true);
      expect(runtimeErrors.filter((message) => !/favicon|Failed to load resource.*404/i.test(message)), `${row.path} runtime errors`).toEqual([]);
    }
  });
}

test("overlay Escape closes and restores keyboard focus", async ({ page }) => {
  await page.goto("/login/");
  await seedRoute(page, "admin", appearances[2]);
  await page.goto("/admin/order-pipeline/");
  const trigger = page.getByRole("button", { name: "Період", exact: true });
  await trigger.focus();
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Період замовлень" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Період замовлень" })).toBeHidden();
  await expect(trigger).toBeFocused();
});
