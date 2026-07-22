import { defineConfig, devices } from "@playwright/test";

const provenance = process.env.APPEARANCE_PAGES_PROVENANCE;
if (!provenance) throw new Error("APPEARANCE_PAGES_PROVENANCE is required; use npm run test:e2e:appearance:pages.");

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/pwa-appearance.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4174/brp-demo/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/serve-appearance-pages.mjs",
    url: "http://127.0.0.1:4174/brp-demo/offline/",
    env: { APPEARANCE_PAGES_PROVENANCE: provenance, PORT: "4174" },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
