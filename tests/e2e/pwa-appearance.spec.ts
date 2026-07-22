import { expect, test } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState } from "@/lib/types";

const staleChunk = process.env.ASTRYX_STALE_CHUNK_URL;

test("fresh Pages export preserves Astryx offline and recovers from a rejected renderer chunk", async ({ page, context, browser }) => {
  expect(staleChunk).toBeTruthy();
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = {
    role: "dealer", email: "orders@logos.ua", displayName: "Олена Коваль", company: "Logos",
    remember: true, expiresAt: "2099-01-01T00:00:00.000Z",
  };
  await page.addInitScript((persistedState) => {
    window.localStorage.setItem("brp-clone-demo-state-v1", JSON.stringify(persistedState));
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "dark" }));
  }, state);

  await page.goto("dealer/orders/");
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)).toBe("activated");
  await context.setOffline(true);
  await page.goto("dealer/orders/");
  await expect(page.getByRole("heading", { name: "Немає з’єднання" })).toBeVisible();
  await expect(page.getByRole("link", { name: "На головну" })).toHaveAttribute("href", "/brp-demo/");
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
  await context.setOffline(false);
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible({ timeout: 8_000 });

  const pagesBaseUrl = new URL("/brp-demo/", page.url()).href;
  const recoveryContext = await browser.newContext({ baseURL: pagesBaseUrl, serviceWorkers: "block" });
  await recoveryContext.addInitScript(({ persistedState }) => {
    window.localStorage.setItem("brp-clone-demo-state-v1", JSON.stringify(persistedState));
    if (!window.localStorage.getItem("brp-appearance-v1")) {
      window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "shadcn", colorMode: "light" }));
    }
  }, { persistedState: state });
  await recoveryContext.route(`**${staleChunk}`, (route) => route.abort("failed"));
  const recoveryPage = await recoveryContext.newPage();
  try {
    await recoveryPage.goto("dealer/orders/");
    await expect(recoveryPage.locator("html")).toHaveAttribute("data-design-system", "shadcn");
    await recoveryPage.evaluate(() => {
      const key = "brp-appearance-v1";
      const newValue = JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "dark" });
      window.localStorage.setItem(key, newValue);
      window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }));
    });
    await expect(recoveryPage.locator("html")).not.toHaveAttribute("data-renderer-pending", "true", { timeout: 8_000 });
    await expect(recoveryPage.locator("html")).toHaveAttribute("data-design-system", "shadcn");

    await recoveryContext.unroute(`**${staleChunk}`);
    await recoveryPage.evaluate(() => {
      window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "dark" }));
    });
    await recoveryPage.reload({ waitUntil: "domcontentloaded" });
    await expect(recoveryPage.locator("html")).toHaveAttribute("data-design-system", "astryx", { timeout: 8_000 });
    await expect(recoveryPage.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
  } finally {
    await recoveryContext.close();
  }
});
