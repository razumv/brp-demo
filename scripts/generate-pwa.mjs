import path from "node:path";
import { access, appendFile } from "node:fs/promises";
import { generateSW } from "workbox-build";

const outputDirectory = path.resolve("out");
const configuredBasePath = process.env.PWA_BASE_PATH ?? "/brp-demo";
const basePath = configuredBasePath === "/" ? "" : configuredBasePath.replace(/\/$/, "");
const offlineFallback = `${basePath}/offline/index.html`;
const legacyRuntimeCache = "brp-pages-runtime";

await access(outputDirectory);

const result = await generateSW({
  globDirectory: outputDirectory,
  swDest: path.join(outputDirectory, "sw.js"),
  globPatterns: [
    "offline/index.html",
    "manifest.webmanifest",
    "favicon.png",
    "icons/pwa-icon-192.png",
    "icons/pwa-icon-512.png",
    "icons/pwa-icon-maskable-512.png",
    "icons/apple-touch-icon-180.png",
    "fonts/*.woff2",
    "_next/static/**/*.{js,css,woff2,ico}",
  ],
  globIgnores: ["sw.js", "**/*.map", "**/.DS_Store"],
  modifyURLPrefix: { "": `${basePath}/` },
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  cacheId: "brp-parts-catalog",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  directoryIndex: "index.html",
  disableDevLogs: true,
  inlineWorkboxRuntime: true,
  mode: "production",
  skipWaiting: false,
  sourcemap: false,
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) => request.mode === "navigate" && url.href.startsWith(self.registration.scope),
      handler: "NetworkOnly",
      options: {
        precacheFallback: { fallbackURL: offlineFallback },
      },
    },
  ],
});

await appendFile(
  path.join(outputDirectory, "sw.js"),
  `\nself.addEventListener("activate", (event) => {\n  event.waitUntil(caches.delete(${JSON.stringify(legacyRuntimeCache)}));\n});\n`,
);

for (const warning of result.warnings) console.warn(`[pwa] ${warning}`);
if (result.count === 0) throw new Error("PWA generation produced an empty precache manifest.");

console.log(`[pwa] generated out/sw.js with ${result.count} files (${Math.round(result.size / 1024)} KiB)`);
