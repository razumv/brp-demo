# PWA implementation lock

## Objective

Make the existing BRP demo installable on desktop and mobile, support reliable offline navigation for the static GitHub Pages export, and preserve all current routes and business behavior.

## References

- Current Next.js 16 bundled guide: `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`.
- Current Next.js manifest contract: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`.
- Source BRP production PWA: `/manifest.webmanifest` and `/sw.js` on `brp-dev1.k8s.artemahr.tech`.
- `shadowwalker/next-pwa`: Workbox precaching, scoped service-worker registration, runtime route discipline, offline fallback and controlled update lifecycle.
- Current maintained alternative: Serwist (`@serwist/next` / `@serwist/turbopack`). It is the better general-purpose successor when a project needs a framework-integrated custom worker.
- Installed Codex skill for future maintenance: `pwa-expert` from `erichowens/some_claude_skills`.

## Decision

Do not add the legacy `next-pwa` webpack wrapper. Next.js 16 builds with Turbopack by default, while the clone also needs `output: "export"` and a `/brp-demo` base path. Generate the Workbox service worker after the static export instead; this keeps the normal build untouched and avoids a bundler switch. Serwist remains the preferred migration path if the app later needs a hand-authored worker or server-integrated caching, but its additional framework integration does not improve this fully static export today.

The installed `pwa-expert` guidance was used for the static-export Workbox shape, safe offline fallback, waiting-worker lifecycle, and native install choice. Its generic cache-first/network-first examples are intentionally not used for operational route HTML or API data: this demo must never persist an operator’s route response in a runtime cache.

## Locked behavior

- App Router owns `manifest.webmanifest` through `src/app/manifest.ts`.
- The registration component can remain bundled in both targets, but `NEXT_PUBLIC_PWA_ENABLED` compile-time/runtime-gates its effect: ordinary production standalone builds never register or request `/sw.js`. The registered URL and scope are derived from `NEXT_PUBLIC_BASE_PATH`, so Pages uses `/brp-demo/sw.js` with `/brp-demo/` scope. `updateViaCache: "none"` avoids a stale worker on GitHub Pages.
- The manifest keeps its exact base-path `id`, `scope`, and `start_url`, plus the existing icons and shortcuts.
- The Pages worker precaches only the dedicated offline HTML page, manifest/install icons, public fonts, and immutable `_next/static` JS/CSS/font assets required to render the fallback. It must never precache admin or other route HTML, RSC payloads, API responses, or a blanket export.
- Same-scope navigations use `NetworkOnly`; a network failure receives the precached Ukrainian offline page. There is no navigation response cache and no broad query-parameter ignore rule.
- On activation, the worker deletes only the former `brp-pages-runtime` cache. Workbox’s own outdated-precache cleanup remains scoped to its cache namespace.
- A new service worker waits rather than replacing an active operator session. When an update is waiting behind a controlled page, the compact accessible notice lets the operator opt in. The user action posts `SKIP_WAITING`; the page reloads once after `controllerchange`. Registration, update, and activation errors are nonfatal.
- Native browser installation UI is the first release behavior. No custom install prompt is registered, preserving desktop/mobile platform compatibility.

## Mobile follow-up boundary

PWA enablement does not change application navigation. The next mobile pass may add a role-aware bottom navigation, keep the full hierarchy behind `Ще`, compact the standalone top bar, and apply safe-area spacing, without removing or changing any route or action.
