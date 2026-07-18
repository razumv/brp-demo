import path from "node:path";
import { access, readFile, stat } from "node:fs/promises";

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
];

await Promise.all(requiredFiles.map((file) => access(path.join(outputDirectory, file))));

const manifest = JSON.parse(await readFile(path.join(outputDirectory, "manifest.webmanifest"), "utf8"));
for (const field of ["id", "scope", "start_url"]) {
  if (manifest[field] !== expectedRoot) {
    throw new Error(`manifest ${field} must be ${expectedRoot}, received ${manifest[field]}`);
  }
}

const iconPurposes = new Set(manifest.icons?.map((icon) => icon.purpose));
if (!iconPurposes.has("any") || !iconPurposes.has("maskable")) {
  throw new Error("manifest must include both any and maskable install icons");
}

const serviceWorker = await readFile(path.join(outputDirectory, "sw.js"), "utf8");
if (!serviceWorker.includes("self.registration.scope")) {
  throw new Error("service worker navigation caching must stay inside its registered scope");
}

for (const cachedPath of [
  `${basePath}/admin/schedule/index.html`,
  `${basePath}/offline/index.html`,
  `${basePath}/manifest.webmanifest`,
]) {
  if (!serviceWorker.includes(cachedPath)) {
    throw new Error(`service worker precache is missing ${cachedPath}`);
  }
}

const workerSize = (await stat(path.join(outputDirectory, "sw.js"))).size;
console.log(`[pwa] validated manifest, install icons, offline route, and ${Math.round(workerSize / 1024)} KiB service worker`);
