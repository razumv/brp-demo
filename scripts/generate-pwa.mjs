import path from "node:path";
import { access } from "node:fs/promises";
import { generateSW } from "workbox-build";

const outputDirectory = path.resolve("out");
const configuredBasePath = process.env.PWA_BASE_PATH ?? "/brp-demo";
const basePath = configuredBasePath === "/" ? "" : configuredBasePath.replace(/\/$/, "");
const offlineFallback = `${basePath}/offline/index.html`;

await access(outputDirectory);

const result = await generateSW({
  globDirectory: outputDirectory,
  swDest: path.join(outputDirectory, "sw.js"),
  globPatterns: ["**/*.{html,txt,js,css,json,webmanifest,png,jpg,jpeg,svg,ico,woff,woff2}"],
  globIgnores: ["sw.js", "**/*.map", "**/.DS_Store"],
  modifyURLPrefix: { "": `${basePath}/` },
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  cacheId: "brp-parts-catalog",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  directoryIndex: "index.html",
  disableDevLogs: true,
  ignoreURLParametersMatching: [/.*/],
  inlineWorkboxRuntime: true,
  mode: "production",
  skipWaiting: false,
  sourcemap: false,
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) => request.mode === "navigate" && url.href.startsWith(self.registration.scope),
      handler: "NetworkFirst",
      options: {
        cacheName: "brp-pages-runtime",
        networkTimeoutSeconds: 4,
        cacheableResponse: { statuses: [0, 200] },
        expiration: {
          maxEntries: 160,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
        precacheFallback: { fallbackURL: offlineFallback },
      },
    },
  ],
});

for (const warning of result.warnings) console.warn(`[pwa] ${warning}`);
if (result.count === 0) throw new Error("PWA generation produced an empty precache manifest.");

console.log(`[pwa] generated out/sw.js with ${result.count} files (${Math.round(result.size / 1024)} KiB)`);
