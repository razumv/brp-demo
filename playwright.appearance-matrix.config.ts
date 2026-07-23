import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3111";
const productionServer = [
  "const path = require('node:path');",
  "const fs = require('node:fs');",
  "const required = JSON.parse(fs.readFileSync('.next/required-server-files.json', 'utf8'));",
  "const relativeAppDirectory = required.relativeAppDir ?? '';",
  "if (relativeAppDirectory.startsWith('..') || path.isAbsolute(relativeAppDirectory)) throw new Error('Standalone app directory is outside its traced root.');",
  "const server = path.resolve('.next/standalone', relativeAppDirectory, 'server.js');",
  "if (!fs.existsSync(server)) throw new Error('Fresh standalone server output is missing at ' + server + '.');",
  "const serverDirectory = path.dirname(server);",
  "fs.cpSync('.next/static', path.join(serverDirectory, '.next/static'), { recursive: true });",
  "if (fs.existsSync('public')) fs.cpSync('public', path.join(serverDirectory, 'public'), { recursive: true });",
  "process.env.HOSTNAME = '127.0.0.1';",
  "process.env.PORT = '3111';",
  "process.chdir(serverDirectory);",
  "require(server);",
].join(" ");

export default defineConfig({
  outputDir: ".next/playwright-appearance-matrix-results",
  testDir: "./tests/e2e",
  testMatch: "**/route-renderer-matrix.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "chromium-430", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true } },
    { name: "chromium-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "chromium-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "chromium-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "chromium-1920", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "firefox-1280", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } } },
    { name: "webkit-1280", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: `npm run build && ${process.execPath} -e ${JSON.stringify(productionServer)}`,
    url: `${baseURL}/login/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
