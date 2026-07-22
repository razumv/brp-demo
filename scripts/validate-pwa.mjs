import path from "node:path";
import { access, readFile, readdir, stat } from "node:fs/promises";

const outputDirectory = path.resolve("out");
const basePath = (process.env.PWA_BASE_PATH ?? "/brp-demo").replace(/\/$/, "");
const expectedRoot = `${basePath}/`;
const requiredFiles = [
  "manifest.webmanifest",
  "sw.js",
  "offline/index.html",
  "icons/pwa-icon-192.png",
  "icons/pwa-icon-512.png",
  "icons/pwa-icon-maskable-512.png",
  "icons/apple-touch-icon-180.png",
  "favicon.png",
  "fonts/inter-latin.woff2",
  "fonts/inter-cyrillic.woff2",
];
const requiredPrecacheUrls = requiredFiles
  .filter((file) => file !== "sw.js")
  .map((file) => `${basePath}/${file}`);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(file) : [file];
  }))).flat();
}

await Promise.all(requiredFiles.map((file) => access(path.join(outputDirectory, file))));

const manifest = JSON.parse(await readFile(path.join(outputDirectory, "manifest.webmanifest"), "utf8"));
for (const field of ["id", "scope", "start_url"]) {
  if (manifest[field] !== expectedRoot) {
    throw new Error(`manifest ${field} must be ${expectedRoot}, received ${manifest[field]}`);
  }
}

if (!Array.isArray(manifest.shortcuts) || manifest.shortcuts.length === 0) {
  throw new Error("manifest must include dealer shortcuts");
}

for (const shortcut of manifest.shortcuts) {
  if (typeof shortcut.url !== "string" || !shortcut.url.startsWith(`${basePath}/dealer/`)) {
    throw new Error(`manifest shortcut must stay in dealer navigation, received ${String(shortcut.url)}`);
  }
}

const iconPurposes = new Set(manifest.icons?.map((icon) => icon.purpose));
if (!iconPurposes.has("any") || !iconPurposes.has("maskable")) {
  throw new Error("manifest must include both any and maskable install icons");
}

const serviceWorker = await readFile(path.join(outputDirectory, "sw.js"), "utf8");
const precacheUrls = [...serviceWorker.matchAll(/\{url:"([^"]+)",revision:"[^"]+"\}/g)].map((match) => match[1]);
const scopedNavigationRoute = serviceWorker.match(
  /"navigate"===\w+\.mode&&\w+\.href\.startsWith\(self\.registration\.scope\),([\s\S]*?),"GET"\),self\.__WB_DISABLE_DEV_LOGS/,
);

if (precacheUrls.length === 0) {
  throw new Error("service worker precache manifest is empty");
}

for (const requiredUrl of requiredPrecacheUrls) {
  if (!precacheUrls.includes(requiredUrl)) {
    throw new Error(`service worker precache is missing ${requiredUrl}`);
  }
}

const staticAssetPrefix = `${basePath}/_next/static/`;
const approvedPrecacheUrl = (url) =>
  requiredPrecacheUrls.includes(url) || url.startsWith(staticAssetPrefix);
const unexpectedPrecacheUrl = precacheUrls.find((url) => !approvedPrecacheUrl(url));

if (unexpectedPrecacheUrl) {
  throw new Error(`service worker precache contains a disallowed URL: ${unexpectedPrecacheUrl}`);
}

if (!precacheUrls.some((url) => url.startsWith(staticAssetPrefix))) {
  throw new Error("service worker precache is missing immutable _next/static assets for offline fallback");
}

const staticDirectory = path.join(outputDirectory, "_next/static");
const emittedStaticFiles = await collectFiles(staticDirectory);
const emittedCss = emittedStaticFiles.filter((file) => file.endsWith(".css"));
const emittedJs = emittedStaticFiles.filter((file) => file.endsWith(".js"));
const cssSources = await Promise.all(emittedCss.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
const jsSources = await Promise.all(emittedJs.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
const neutralCss = cssSources.filter(({ source }) => source.includes("data-astryx-theme") && source.includes("neutral") && source.includes("--color-text-primary"));
if (neutralCss.length === 0) throw new Error("Pages output is missing emitted Astryx Neutral CSS.");
const figtreeCss = cssSources.filter(({ source }) => source.includes("Figtree Variable"));
if (figtreeCss.length === 0) throw new Error("Pages output is missing the Figtree font-face relationship.");
const figtreeFontReferences = new Set(figtreeCss.flatMap(({ source }) => [...source.matchAll(/url\(([^)]+\.woff2)\)/g)].map((match) => match[1].replace(/["']/g, ""))));
if (figtreeFontReferences.size < 2) throw new Error("Pages output must emit both Figtree Latin and Latin-Extended assets.");
const astryxRuntime = jsSources.filter(({ source }) => source.includes("data-astryx-theme") || source.includes("renderer-pending"));
if (astryxRuntime.length === 0) throw new Error("Pages output is missing the Astryx appearance runtime.");
const contentDiscoveredAssets = [...neutralCss, ...figtreeCss, ...astryxRuntime].map(({ file }) => `${basePath}/${path.relative(outputDirectory, file).split(path.sep).join("/")}`);
for (const url of new Set(contentDiscoveredAssets)) {
  if (!precacheUrls.includes(url)) throw new Error(`service worker precache is missing content-discovered appearance asset ${url}`);
}
const emittedFontUrls = emittedStaticFiles.filter((file) => file.endsWith(".woff2")).map((file) => `${basePath}/${path.relative(outputDirectory, file).split(path.sep).join("/")}`);
if (emittedFontUrls.length < 2 || emittedFontUrls.some((url) => !precacheUrls.includes(url))) {
  throw new Error("All emitted immutable Figtree font assets must be precached.");
}

if (precacheUrls.some((url) => /\/admin\/|\.txt$|__next\./.test(url))) {
  throw new Error("service worker must never precache admin HTML or RSC payloads");
}

if (precacheUrls.some((url) => url.endsWith(".html") && url !== `${basePath}/offline/index.html`)) {
  throw new Error("service worker may precache only the dedicated offline HTML page");
}

if (!scopedNavigationRoute) {
  throw new Error("emitted service worker is missing the scoped navigation route");
}

const emittedNavigationHandler = scopedNavigationRoute[1];
if (!emittedNavigationHandler.includes("fetch(") || emittedNavigationHandler.includes("cacheMatch(") || emittedNavigationHandler.includes("cachePut(")) {
  throw new Error("emitted scoped navigation route must use NetworkOnly without a response cache");
}

if (!emittedNavigationHandler.includes(`fallbackURL:"${basePath}/offline/index.html"`)) {
  throw new Error("emitted scoped navigation route must use the precached offline fallback");
}

const generator = await readFile(path.resolve("scripts/generate-pwa.mjs"), "utf8");
if (!generator.includes('handler: "NetworkOnly"') || !generator.includes("self.registration.scope")) {
  throw new Error("same-scope navigations must use scoped NetworkOnly handling");
}

if (!generator.includes("precacheFallback") || !generator.includes("offline/index.html")) {
  throw new Error("same-scope navigations must fall back to the precached offline page");
}

if (generator.includes("ignoreURLParametersMatching") || generator.includes("cacheName:")) {
  throw new Error("service worker must not ignore all query parameters or cache navigation responses");
}

if (!generator.includes('const legacyRuntimeCache = "brp-pages-runtime"') || !serviceWorker.includes('caches.delete("brp-pages-runtime")')) {
  throw new Error("service worker must clean up only the legacy brp-pages-runtime cache on activation");
}

const pwaRegistration = await readFile(path.resolve("src/components/providers/pwa-registration.tsx"), "utf8");
const updateFoundListenerIndex = pwaRegistration.indexOf('registration.addEventListener("updatefound", handleUpdateFound);');
const controllerChangeListenerIndex = pwaRegistration.indexOf('navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);');
const initialUpdateCheckIndex = pwaRegistration.indexOf("handleUpdateFound();", updateFoundListenerIndex + 1);
if (updateFoundListenerIndex < 0 || controllerChangeListenerIndex < updateFoundListenerIndex || initialUpdateCheckIndex < controllerChangeListenerIndex) {
  throw new Error("PWA registration must observe an already-installing worker after subscribing");
}

const stateChangeListenerIndex = pwaRegistration.indexOf('installingWorker.addEventListener("statechange", handleStateChange);');
const initialStateCheckIndex = pwaRegistration.indexOf("handleStateChange();", stateChangeListenerIndex + 1);
if (stateChangeListenerIndex < 0 || initialStateCheckIndex < stateChangeListenerIndex) {
  throw new Error("PWA registration must immediately evaluate an already-installing worker state");
}

const workerSize = (await stat(path.join(outputDirectory, "sw.js"))).size;
console.log(
  `[pwa] validated manifest, restricted precache, safe navigation fallback, and ${Math.round(workerSize / 1024)} KiB service worker`,
);
