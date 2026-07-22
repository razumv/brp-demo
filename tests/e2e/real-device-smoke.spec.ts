import { expect, test } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState } from "@/lib/types";

const candidateSha = process.env.APPEARANCE_CANDIDATE_SHA;

test("candidate provenance and dual-renderer critical flows work on the real browser", async ({ page, request }) => {
  expect(candidateSha).toBeTruthy();
  const provenance = await request.get("/__appearance-candidate.json");
  expect(provenance.ok()).toBe(true);
  expect((await provenance.json()).sha).toBe(candidateSha);

  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = {
    role: "dealer",
    email: "orders@logos.ua",
    displayName: "Олена Коваль",
    company: "Logos",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };
  await page.addInitScript((persistedState) => {
    window.localStorage.setItem("brp-clone-demo-state-v1", JSON.stringify(persistedState));
    window.localStorage.setItem("brp-appearance-v1", JSON.stringify({ version: 1, designSystem: "astryx", colorMode: "dark" }));
  }, state);

  await page.goto("/dealer/orders/");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");

  await page.goto("/catalog/");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await page.goto("/dealer/orders/LOG-01/");
  await expect(page.getByRole("heading").first()).toBeVisible();

  await page.evaluate(() => {
    const key = "brp-appearance-v1";
    const newValue = JSON.stringify({ version: 1, designSystem: "shadcn", colorMode: "light" });
    window.localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }));
  });
  await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
  await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "light");
});
