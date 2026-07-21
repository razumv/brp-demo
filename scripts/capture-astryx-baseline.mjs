import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASELINE_BASE_URL ?? "http://127.0.0.1:3107";
const outputDirectory = path.resolve("docs/design-references/astryx-baseline");
const manifestPath = path.resolve("docs/research/astryx-baseline-manifest.json");
const viewports = [390, 768, 1280, 1440];
const themes = ["light", "dark"];

const routes = [
  { name: "login", path: "/login", role: "public", themeParticipant: false },
  { name: "offline", path: "/offline", role: "public", themeParticipant: false },
  { name: "dealer-dashboard", path: "/", role: "dealer" },
  { name: "admin-order-pipeline", path: "/admin/order-pipeline", role: "admin" },
  { name: "admin-consignment", path: "/admin/consignment", role: "admin" },
  { name: "admin-warehouse", path: "/admin/warehouse", role: "admin" },
  { name: "admin-catalog", path: "/admin/catalog", role: "admin" },
  { name: "admin-schedule", path: "/admin/schedule", role: "admin" },
  { name: "admin-permissions", path: "/admin/permissions", role: "admin" },
  { name: "dealer-catalog-diagram", path: "/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25", role: "dealer", themeParticipant: false },
  { name: "dealer-cart", path: "/cart", role: "dealer" },
  { name: "dealer-orders", path: "/dealer/orders", role: "dealer" },
  { name: "dealer-accessories", path: "/dealer/accessories", role: "dealer" },
  { name: "dealer-workshop", path: "/dealer/workshop", role: "dealer" },
  { name: "dealer-team-access", path: "/dealer/team-access", role: "dealer" },
];

const captureTargets = routes.flatMap((route) => themes.flatMap((theme) => viewports.map((width) => ({
  ...route,
  theme,
  width,
  filename: `${route.name}--${theme}--${width}.png`,
}))));

function parseFlag(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function pngDimensions(buffer) {
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Expected PNG signature");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function expectedTarget(filename) {
  return captureTargets.find((target) => target.filename === filename);
}

async function authenticatedPage(browser, role, theme, width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 1000 },
    colorScheme: theme,
  });
  const page = await context.newPage();
  await page.addInitScript(({ nextTheme }) => {
    window.localStorage.setItem("brp-clone-theme", nextTheme);
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
    document.documentElement.appendChild(style);
  }, { nextTheme: theme });
  if (role !== "public") {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("Електронна пошта").fill(role === "admin" ? "admin@local.test" : "dealer@example.invalid");
    await page.locator('input[type="password"]').fill(role === "admin" ? "demo" : "not-persisted");
    await page.getByRole("button", { name: "Увійти" }).click();
    await page.waitForURL(role === "admin" ? /\/admin\/?$/ : /\/$/);
  }
  return { context, page };
}

async function capture(target) {
  const browser = await chromium.launch({ headless: true });
  try {
    const { context, page } = await authenticatedPage(browser, target.role, target.theme, target.width);
    await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const finalUrl = page.url();
    const finalPathname = new URL(finalUrl).pathname;
    if (finalPathname !== target.path) throw new Error(`Unexpected final path for ${target.filename}: ${finalPathname}`);
    const stylesheetHref = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
    if (!stylesheetHref) throw new Error(`No stylesheet was linked for ${target.filename}`);
    const stylesheetUrl = new URL(stylesheetHref, finalUrl ?? `${baseUrl}${target.path}`).toString();
    const stylesheetResponse = await page.request.get(stylesheetUrl);
    if (!stylesheetResponse.ok()) throw new Error(`Stylesheet did not load for ${target.filename}: ${stylesheetResponse.status()}`);
    const rootTheme = await page.locator("html").evaluate((element) => ({
      className: element.className,
      dark: element.classList.contains("dark"),
      designSystem: element.getAttribute("data-design-system"),
      colorMode: element.getAttribute("data-color-mode"),
      resolvedTheme: element.getAttribute("data-resolved-theme"),
    }));
    const bodyFontFamily = await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily);
    if (/Times New Roman/i.test(bodyFontFamily)) throw new Error(`Expected application CSS for ${target.filename}`);
    const expectedDark = target.themeParticipant === false ? false : target.theme === "dark";
    if (rootTheme.dark !== expectedDark) throw new Error(`Unexpected root dark marker for ${target.filename}`);
    await page.screenshot({ path: path.join(outputDirectory, target.filename), fullPage: false, animations: "disabled" });
    await context.close();
    return { filename: target.filename, finalUrl, rootTheme: { ...rootTheme, expectedDark }, stylesheet: { href: stylesheetHref, status: stylesheetResponse.status(), bodyFontFamily } };
  } finally {
    await browser.close();
  }
}

async function writeManifest(observations = new Map()) {
  const files = await Promise.all(captureTargets.map(async (target) => {
    const fullPath = path.join(outputDirectory, target.filename);
    const png = await fs.readFile(fullPath);
    const { width, height } = pngDimensions(png);
    return {
      filename: target.filename,
      route: target.path,
      role: target.role,
      theme: target.theme,
      viewport: { width: target.width, height: target.width < 768 ? 844 : 1000 },
      finalUrl: observations.get(target.filename)?.finalUrl ?? `${baseUrl}${target.path}`,
      rootTheme: observations.get(target.filename)?.rootTheme ?? {
        asserted: false,
        reason: "Preserved baseline image; run --all --manifest to recapture and assert live root markers.",
      },
      stylesheet: observations.get(target.filename)?.stylesheet ?? {
        asserted: false,
        reason: "Preserved baseline image; run --all --manifest to recapture and assert a linked stylesheet.",
      },
      png: { width, height, bytes: png.length, sha256: createHash("sha256").update(png).digest("hex") },
    };
  }));
  await fs.writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    sourceSha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    captureBaseUrl: baseUrl,
    captureTargets: routes,
    screenshots: files,
  }, null, 2) + "\n");
}

async function verifyManifest() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (manifest.screenshots.length !== captureTargets.length) throw new Error(`Expected ${captureTargets.length} manifest screenshots`);
  const actualFiles = (await fs.readdir(outputDirectory)).filter((file) => file.endsWith(".png")).sort();
  if (actualFiles.length !== captureTargets.length) throw new Error(`Expected ${captureTargets.length} PNGs, found ${actualFiles.length}`);
  for (const entry of manifest.screenshots) {
    const target = expectedTarget(entry.filename);
    if (!target) throw new Error(`Unexpected manifest entry ${entry.filename}`);
    const png = await fs.readFile(path.join(outputDirectory, entry.filename));
    const dimensions = pngDimensions(png);
    const sha256 = createHash("sha256").update(png).digest("hex");
    if (entry.png.bytes !== png.length || entry.png.sha256 !== sha256 || entry.png.width !== dimensions.width || entry.png.height !== dimensions.height) {
      throw new Error(`Checksum or dimensions differ for ${entry.filename}`);
    }
    if (new URL(entry.finalUrl).pathname !== target.path) throw new Error(`Unexpected final URL in manifest for ${entry.filename}`);
    const expectedDark = target.themeParticipant === false ? false : target.theme === "dark";
    if (entry.rootTheme?.dark !== expectedDark || entry.rootTheme?.expectedDark !== expectedDark) throw new Error(`Missing or incorrect root-theme assertion for ${entry.filename}`);
    if (entry.stylesheet?.status !== 200 || /Times New Roman/i.test(entry.stylesheet?.bodyFontFamily ?? "")) throw new Error(`Missing application stylesheet assertion for ${entry.filename}`);
  }
  for (const target of captureTargets) {
    if (!actualFiles.includes(target.filename)) throw new Error(`Missing ${target.filename}`);
  }
  console.log(JSON.stringify({ verifiedScreenshots: captureTargets.length, manifestPath }, null, 2));
}

await fs.mkdir(outputDirectory, { recursive: true });
const surface = parseFlag("--surface");
const all = process.argv.includes("--all");
const observations = new Map();
if (surface) {
  const targets = captureTargets.filter((target) => target.name === surface);
  if (!targets.length) throw new Error(`Unknown baseline surface: ${surface}`);
  for (const target of targets) {
    const observation = await capture(target);
    observations.set(observation.filename, observation);
  }
}
if (all) {
  for (const target of captureTargets) {
    const observation = await capture(target);
    observations.set(observation.filename, observation);
  }
}
if (process.argv.includes("--manifest")) await writeManifest(observations);
if (process.argv.includes("--verify")) await verifyManifest();
