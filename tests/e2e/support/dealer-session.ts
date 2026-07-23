import { expect, type Page } from "@playwright/test";

type DealerSessionOptions = {
  assertIdentity?: boolean;
  basePath?: string;
  origin?: string;
};

function dealerPathname(path: string, { basePath = "" }: DealerSessionOptions = {}) {
  const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBasePath}${normalizedPath}`;
}

function dealerUrl(path: string, options: DealerSessionOptions = {}) {
  const pathname = dealerPathname(path, options);
  const { origin } = options;
  return origin ? new URL(pathname, origin).toString() : pathname;
}

export async function loginAsDealer(page: Page, options: DealerSessionOptions = {}) {
  await page.goto(dealerUrl("/login", options));
  await page.locator('input[type="email"]:visible').fill("dealer@example.invalid");
  const password = page.locator('input[type="password"]:visible');
  await password.fill("not-persisted");
  await password.press("Enter");

  await expect.poll(() => new URL(page.url()).pathname).toBe(dealerPathname("/", options));
  if (options.assertIdentity !== false) {
    await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
    await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();
  }
  await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
}

export async function openDealerRoute(
  page: Page,
  path: string,
  heading: string,
  options: DealerSessionOptions = {},
) {
  await page.goto(dealerUrl(path, options));
  await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname).toBe(dealerPathname(path, options));
}
