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

## Locked behavior

- App Router owns `manifest.webmanifest` through `src/app/manifest.ts`.
- Registration occurs only in production, uses the exact deployment scope, and sets `updateViaCache: "none"` because GitHub Pages cannot provide custom no-cache headers for `sw.js`.
- The Pages build precaches exported HTML, RSC payloads, bundles, styles, fonts, local images and install metadata.
- URL parameters are ignored only during precache matching because route content is statically exported and the app applies supported query state on the client.
- Non-GET requests, API routes, cross-origin traffic and same-origin navigations outside the registered `/brp-demo/` scope are not runtime-cached.
- A new service worker waits instead of replacing an active operator session. It activates after existing tabs close; an explicit update prompt can be added later.
- Unknown uncached navigations fall back to the dedicated Ukrainian offline page.
- Native browser installation UI is the first release behavior. A custom install button is intentionally deferred because it is inconsistent across desktop Chrome, Android and iOS.

## Mobile follow-up boundary

PWA enablement does not change application navigation. The next mobile pass may add a role-aware bottom navigation, keep the full hierarchy behind `Ще`, compact the standalone top bar, and apply safe-area spacing, without removing or changing any route or action.
