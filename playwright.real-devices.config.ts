import { defineConfig } from "@playwright/test";

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const localIdentifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER;
const candidateSha = process.env.APPEARANCE_CANDIDATE_SHA;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3112";

if (!username || !accessKey || !localIdentifier || !candidateSha) {
  throw new Error("BrowserStack credentials, local identifier, and candidate SHA are required.");
}
const checkedUsername = username;
const checkedAccessKey = accessKey;
const checkedLocalIdentifier = localIdentifier;
const checkedCandidateSha = candidateSha;

function project(name: string, capabilities: Record<string, string | boolean>) {
  const caps = {
    ...capabilities,
    "browserstack.username": checkedUsername,
    "browserstack.accessKey": checkedAccessKey,
    "browserstack.local": true,
    "browserstack.localIdentifier": checkedLocalIdentifier,
    "browserstack.buildName": `BRP Astryx ${checkedCandidateSha.slice(0, 12)}`,
    "browserstack.sessionName": name,
    "browserstack.playwrightVersion": "1.latest",
  };
  return {
    name,
    use: {
      connectOptions: {
        wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`,
      },
    },
  };
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/real-device-smoke.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    project("Chrome Windows", { browser: "chrome", browser_version: "latest", os: "Windows", os_version: "11" }),
    project("Edge Windows", { browser: "edge", browser_version: "latest", os: "Windows", os_version: "11" }),
    project("Firefox Windows", { browser: "playwright-firefox", browser_version: "latest", os: "Windows", os_version: "11" }),
    project("Safari macOS", { browser: "playwright-webkit", browser_version: "latest", os: "OS X", os_version: "Sequoia" }),
    project("iOS Safari", { browser: "playwright-webkit", device: "iPhone 16 Pro", os: "ios", os_version: "18" }),
    project("Android Chrome", { browser: "playwright-chromium", device: "Google Pixel 9", os: "android", os_version: "15.0" }),
  ],
});
