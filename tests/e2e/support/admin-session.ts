import { expect, type Page } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState, Session } from "@/lib/types";

export type AdminViewportWidth = 390 | 767 | 768 | 1440;

const STORAGE_KEY = "brp-clone-demo-state-v1";

function cloneInitialDemoState(): DemoState {
  return JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
}

export async function seedAdminSession(page: Page) {
  const state = cloneInitialDemoState();
  const session: Session = {
    role: "admin",
    email: "admin.demo@local.invalid",
    displayName: "Razumv Admin",
    company: "Logos",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };
  state.session = session;

  await page.addInitScript(({ storageKey, persistedState }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(persistedState));
  }, { storageKey: STORAGE_KEY, persistedState: state });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.locator('input[type="password"]').fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

export async function openAdminRoute(
  page: Page,
  path: string,
  width: AdminViewportWidth,
) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.goto(path);
  await expect(page.locator("h1")).toBeVisible();
}
