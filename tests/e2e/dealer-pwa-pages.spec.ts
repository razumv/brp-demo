import { expect, test } from "@playwright/test";
import { startDealerPagesServer, type DealerPagesServer } from "./support/dealer-pages-server";
import { loginAsDealer, openDealerRoute } from "./support/dealer-session";

let pagesServer: DealerPagesServer | undefined;

test.beforeAll(async () => {
  const provenance = process.env.DEALER_PAGES_BUILD_PROVENANCE;
  if (!provenance) {
    throw new Error("Run the Pages suite through npm run test:e2e:dealer-pages to create a fresh export.");
  }
  pagesServer = await startDealerPagesServer({ provenance });
});

test.afterAll(async () => {
  await pagesServer?.close();
});

function server() {
  if (!pagesServer) throw new Error("Pages server did not start");
  return pagesServer;
}

test("Pages export serves every required dealer route from its generated file", async ({ request }) => {
  for (const path of [
    "/brp-demo/",
    "/brp-demo/catalog/",
    "/brp-demo/dealer/orders/",
    "/brp-demo/dealer/orders/LOG-01/",
    "/brp-demo/order-confirmation/LOG-01/",
  ]) {
    const response = await request.get(server().url(path), { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
  }
});

test("Pages export redirects directory routes to their trailing-slash static paths", async ({ request }) => {
  const response = await request.get(server().url("/brp-demo/dealer/orders"), { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/brp-demo/dealer/orders/");
});

test("Pages export certifies every required route after visible dealer sign-in", async ({ page }) => {
  const options = { basePath: "/brp-demo", origin: server().url("/") };
  await loginAsDealer(page, options);

  for (const route of [
    { path: "/", heading: "Головна", content: "Короткий робочий огляд для Logos." },
    { path: "/catalog/", heading: "Каталог запчастин", content: "Оберіть виробника для перегляду або пошуку запчастин." },
    { path: "/dealer/orders/", heading: "Мої замовлення", content: "Історія, поточні статуси та повідомлення по замовленнях." },
    { path: "/dealer/orders/a20b2bdd-2a1f-4322-a50a-fe68a17f4963/", heading: "LOG-01", content: "Інформація про замовлення" },
    { path: "/order-confirmation/a20b2bdd-2a1f-4322-a50a-fe68a17f4963/", heading: "Замовлення створено", content: "Номер замовлення" },
  ]) {
    await openDealerRoute(page, route.path, route.heading, options);
    await expect(page.getByText(route.content, { exact: true })).toBeVisible();
  }
});

test.describe("Pages export at 390px touch", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("supports visible dealer login and mobile drawer navigation", async ({ page }) => {
    const options = { basePath: "/brp-demo", origin: server().url("/") };
    await loginAsDealer(page, { ...options, assertIdentity: false });
    await page.getByRole("button", { name: "Меню" }).click();
    const drawer = page.getByRole("dialog", { name: "Навігація" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: /^Мої замовлення/ }).click();

    await expect(page).toHaveURL(/\/brp-demo\/dealer\/orders\/?$/);
    await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
  });
});

test("Pages export does not use an SPA fallback for an unexported route", async ({ request }) => {
  const response = await request.get(server().url("/brp-demo/dealer/not-exported/"));

  expect(response.status()).toBe(404);
});

test("Pages manifest has the deployment root and a dealer-only shortcut contract", async ({ request }) => {
  const response = await request.get(server().url("/brp-demo/manifest.webmanifest"));
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json() as {
    id: string;
    scope: string;
    start_url: string;
    shortcuts: Array<{ url: string }>;
  };

  expect(manifest).toMatchObject({
    id: "/brp-demo/",
    scope: "/brp-demo/",
    start_url: "/brp-demo/",
  });

  expect(manifest.shortcuts).not.toHaveLength(0);
  for (const shortcut of manifest.shortcuts) {
    expect(shortcut.url).toMatch(/^\/brp-demo\/dealer\//);
  }
});
