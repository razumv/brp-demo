import { defineConfig } from "@playwright/test";

const port = 3101;
const baseURL = `http://127.0.0.1:${port}`;
const expectedProvenance = process.env.APPEARANCE_BUILD_PROVENANCE;

if (!expectedProvenance) {
  throw new Error("APPEARANCE_BUILD_PROVENANCE is required for production appearance tests.");
}

const serverValidation = [
  "const path = require('node:path');",
  "const fs = require('node:fs');",
  "const expected = process.env.APPEARANCE_BUILD_PROVENANCE;",
  "const actual = fs.readFileSync('.next/.appearance-build-provenance', 'utf8').trim();",
  "if (actual !== expected) throw new Error('Appearance build provenance mismatch.');",
  "const required = JSON.parse(fs.readFileSync('.next/required-server-files.json', 'utf8'));",
  "const relativeAppDirectory = required.relativeAppDir ?? '';",
  "if (relativeAppDirectory.startsWith('..') || path.isAbsolute(relativeAppDirectory)) throw new Error('Standalone app directory is outside its traced root.');",
  "const server = path.resolve('.next/standalone', relativeAppDirectory, 'server.js');",
  "if (!fs.existsSync(server)) throw new Error('Fresh standalone server output is missing at ' + server + '.');",
  "const serverDirectory = path.dirname(server);",
  "fs.cpSync('.next/static', path.join(serverDirectory, '.next/static'), { recursive: true });",
  "if (fs.existsSync('public')) fs.cpSync('public', path.join(serverDirectory, 'public'), { recursive: true });",
  "console.log('appearance provenance ' + actual + '; serving ' + server);",
  "process.env.HOSTNAME = '127.0.0.1';",
  "process.env.PORT = '3101';",
  "process.chdir(serverDirectory);",
  "require(server);",
].join(" ");

export default defineConfig({
  outputDir: ".next/playwright-appearance-results",
  testDir: "./tests/e2e",
  testMatch: "**/{astryx,appearance}-*.spec.ts",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    colorScheme: "light",
    viewport: { width: 1280, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: `exec ${process.execPath} -e ${JSON.stringify(serverValidation)}`,
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
