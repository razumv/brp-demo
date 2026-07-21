# Goal prompt: implement BRP shadcn/ui + Astryx Neutral dual design system

Use this prompt as the complete implementation goal after the companion design has been approved.

## Goal

Set and pursue this goal until it is genuinely complete:

> Implement a production-ready global dual design-system architecture for the BRP application. Preserve the current renderer as the default `shadcn/ui` option and add a complete official Astryx Neutral renderer. Support `system`, `light`, and `dark` color modes; expose the organization-level choice in admin settings; apply it to every admin and dealer route; preserve all business behavior and state; validate accessibility, responsive behavior, static GitHub Pages export, PWA/offline behavior, and the deployed Pages application. Do not stop at a CSS skin, a proof of concept, or a partial route migration.

## Authoritative inputs

1. Read and follow:
   - `AGENTS.md`;
   - `docs/superpowers/specs/2026-07-21-astryx-dual-design-system-design.md`;
   - relevant existing dealer/admin specs;
   - relevant Next.js 16.2.10 guides from `node_modules/next/dist/docs/` before editing provider/layout/CSS/build code.
2. Work from branch `codex/astryx-dual-design-system`, based on dealer parity commit `e557383`, in its isolated worktree.
3. Use the official Astryx MCP (`https://astryx.atmeta.com/mcp`) whenever component props, imports, CSS layers, theming, or templates are uncertain. Use `search`, then `get`; do not invent APIs.
4. Use current official versions verified on 2026-07-21 and exact subpath imports:
   - `@astryxdesign/core@0.1.7`;
   - `@astryxdesign/cli@0.1.7`;
   - `@stylexjs/stylex@0.19.0`;
   - only add `@astryxdesign/theme-neutral@0.1.7` when required by the verified build path.
5. Use the owner-requested scaffold exactly: `npx astryx theme add neutral`. Commit the resulting editable theme as the project source of truth. Build it statically with `npx astryx theme build ...` for SSR/first-paint performance.
6. If Astryx agent setup changes `AGENTS.md`, run `bash scripts/sync-agent-rules.sh` and review the generated instruction diffs.

## Hard constraints

- Do not change or remove business workflows, permissions, routes, data contracts, query behavior, command guards, local workflow keys, or backend boundaries.
- Do not display text that calls the product a demo, mockup, clone, temporary frontend, or local implementation.
- Do not enable a locked/backend-dependent operation merely because Astryx has an enabled-looking component.
- Do not render both design systems at once.
- Do not duplicate route trees or copy domain logic into renderer files.
- Do not implement a CSS-only Astryx theme over current components.
- Do not make the application client-only to avoid hydration work.
- Do not load remote fonts.
- Do not break `/brp-demo`, static export, Workbox generation, offline fallback, installed PWA, or existing mobile layouts.
- Preserve unrelated user changes and keep commits coherent and reviewable.

## Required product contract

Implement independent values:

```ts
type DesignSystem = "shadcn" | "astryx";
type ColorMode = "system" | "light" | "dark";

interface AppearancePreferenceV1 {
  version: 1;
  designSystem: DesignSystem;
  colorMode: ColorMode;
}
```

- Organization-level setting controlled by admin; dealer reads it. On GitHub Pages this is explicitly a browser-local shadow shared by all routes and same-origin tabs, not cross-device organization synchronization.
- Default renderer `shadcn`; preserve current default mode when no preference exists.
- Asynchronous `AppearancePreferencesRepository` (`read`, acknowledged `write`, `subscribe`) plus a separate synchronous bootstrap snapshot; versioned GitHub Pages local-storage adapter with validation, legacy `brp-clone-theme` migration, corrupt-data fallback, cross-tab `storage` synchronization, last-known-good/error behavior, and a backend-shaped `brp-dev1` contract test.
- Keep appearance out of `DemoStore` and dealer workflow state.
- Add `Оформлення` at the top of admin settings with two equal selectable renderer cards and a separate `Системна / Світла / Темна` control.
- The settings editor must work in both renderers and allow switching back.

## Test-first execution protocol

Use red-green-refactor for every behavior-bearing phase:

1. write the smallest failing unit/component/browser test;
2. run it and record the expected failure;
3. implement the minimum correct behavior;
4. rerun the focused test;
5. run the surrounding suite;
6. refactor only while green.

Do not bulk-edit all routes before proving the foundation and provider architecture. Keep the branch buildable after each phase.

## Phase 0: baseline and inventory

1. Confirm clean worktree and baseline commit.
2. Run and record:
   - `npm run lint -- --quiet`;
   - `npm run typecheck`;
   - `npm run test:dealer-state`;
   - `npm run build`.
3. Generate a checked migration inventory for:
   - native interactive elements;
   - current shared UI primitives;
   - `DealerDataToolbar` and admin toolbar patterns;
   - tables, dialogs, popovers, selectors, tabs, switches, cards, badges, empty/loading states;
   - global/reset/hardcoded color rules;
   - all admin and dealer route renderers.
   Generate route rows from `src/app/**/page.tsx` and include query-based compatibility routes plus every `generateStaticParams` fixture; each route must map to exactly one migration and browser-verification entry.
4. Capture current renderer screenshots at 390, 768, 1280, and 1440 widths for representative and special routes before migration.

## Phase 1: dependencies, Neutral source, fonts, and CSS foundation

1. Pin the verified Astryx/StyleX versions and update the lockfile.
2. Run `npx astryx theme add neutral` and inspect every generated file.
3. Bundle Figtree variable font locally with Cyrillic coverage; verify license and offline path.
4. Build the local theme to static CSS/JS/declarations. Add a deterministic script/check so generated artifacts cannot drift from source.
5. Implement the official Tailwind v4 layer sequence. The `@layer` declaration must live in a file imported before any other CSS because Next/webpack hoists imports:

```css
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;
```

Then load Tailwind theme/preflight, Astryx reset/base, local built Neutral theme, Astryx Tailwind token bridge, and Tailwind utilities in the exact MCP-documented order.
6. Audit every legacy reset/global import. Move resets into the lowest layer and scope current renderer variables/styles so they cannot bleed into Astryx.
7. Add a foundation page/harness containing Astryx `Button`, `TextInput`, `Card`, and `Table`. Test light/dark rendered styles and assert non-zero computed padding. Inspect the production CSS output. Do not continue until this passes.

## Phase 2: preference repository, bootstrap, and root providers

1. Write pure tests for parsing, validation, serialization, defaults, legacy migration, malformed values, and future-version fallback.
2. Implement asynchronous `AppearancePreferencesRepository` (`read`, acknowledged `write`, `subscribe`), the separate synchronous bootstrap snapshot, Pages/local-storage implementation, last-known-good/error behavior, and a backend-shaped test double.
3. Add cross-tab synchronization and `matchMedia` system-mode resolution tests.
4. Add a minimal head bootstrap that applies:
   - `data-design-system`;
   - `data-color-mode`;
   - `data-resolved-theme`;
   - `.dark` only for resolved dark;
   - `data-renderer-pending` only for saved Astryx cold start.
5. Server-prerender shadcn and hydrate the same tree. Load Astryx as a separately identifiable renderer chunk, commit its providers, signal readiness, and only then remove the app-root pending marker.
6. Add a bounded bootstrap watchdog and renderer error boundary that recover to the visible server-rendered shadcn tree on blocked/rejected chunk, renderer failure, or stale PWA assets. Test successful cold load, blocked import, rejected import, renderer error, JavaScript-disabled fallback, and recovery.
7. Place domain/session/cart/workflow providers and every stateful controller that must survive a switch outside the renderer branch. Unsaved form values, filters, sorting, pagination, selections, collapse state, and workflow drafts must not reset; only transient presentation state may be renderer-local.
8. Place exactly one Astryx `Theme`, `LayerProvider`, and base-path-safe Next `LinkProvider` inside Astryx root. Let AppearanceProvider own application attributes; let Astryx `Theme` own `data-theme` and required `data-astryx-theme="neutral"` semantics, including omitting `data-theme` in `system` mode.
9. Update runtime `theme-color`; retain a safe static manifest value.

## Phase 3: admin appearance settings and shared facade

1. Add failing tests for the admin editor in shadcn and Astryx renderers.
2. Implement `Оформлення` before diagnostic settings.
3. Build typed semantic facade families described in the design document. The facade must preserve controlled values, events, labels, errors, disabled semantics, refs where required, and accessibility names across both renderers.
4. Do not leak raw `xstyle` or current CSS class contracts through shared facade props.
5. Add component parity tests for Button/IconButton, TextInput, Selector, Switch, Tabs/SegmentedControl, Toolbar, Card/Section, Badge/StatusDot, Table, Dialog/AlertDialog, MoreMenu/Popover, and EmptyState/loading.

## Phase 4: shared shell first

1. Separate shared shell behavior/controller from views.
2. Preserve the current view byte-for-byte where practical.
3. Build the Astryx view with `AppShell`, `TopNav`, `SideNav`, and responsive mobile navigation.
4. Preserve router-driven selection, grouped admin/dealer navigation, global search, account actions, notification/cart badges, mobile drawer behavior, and Pages base path.
5. Test keyboard navigation, drawer focus/close, route changes, global search, account actions, and switch-state preservation.

## Phase 5: migrate admin routes

Migrate every listed surface, using actual Astryx controls for applicable primitives and preserving domain exceptions:

- shared admin shell/search;
- overview;
- order pipeline and order detail;
- supplier orders, consignment, returns;
- air freight, ocean freight, unit shipping, warehouse;
- settlements and invoices;
- catalog and schedule/timeline;
- companies, dealer access, users, permissions;
- tasks, analytics, parts report, performance, BossWeb lookup;
- integrations hub, settings, 1C, unit mapping, BossWeb, settlement mapping.

Follow the route-by-route component and special-behavior mapping in the design. Migrate in coherent domain batches, add focused tests/screenshots after each batch, and keep wide matrices internally scrollable with sticky behavior intact. Preserve every disabled reason and applicability rule.

## Phase 6: migrate dealer routes

Migrate every listed surface:

- shared shell, mobile nav, global search, cart overlay (`Dialog` or a documented custom side-panel composition; do not invent an Astryx `Drawer` API);
- login and offline;
- overview;
- parts catalog cascade, deep paths, and diagram;
- accessories vehicle/facet workflow;
- `/cart`, `/order-confirmation`, `/order-confirmation/[id]`, `/dealer/orders`, `/dealer/orders/[id]`, and `/dealer/order-detail`;
- `/dealer/documents` and `/dealer/order-drafts`;
- `/dealer/consignment`, `/dealer/settlements`, `/dealer/parts-inventory`, and `/dealer/units`;
- `/dealer/network`, `/dealer/customers`, `/dealer/workshop`, and `/dealer/team-access`;
- `/dealer/parts-report`, `/dealer/bossweb`, and `/dealer/schedule`.

Preserve the persistent independent columns of the parts cascade, the custom diagram canvas, all dealer workflow storage keys, owner isolation, cart/order commands, source-backed badges, and locked operations. Use `DealerDataToolbar` as a semantic migration seam: search consumes available width and icon filters remain at the right, including mobile.

Do not claim workshop drag-and-drop or another functional workflow was added unless it is separately evidenced, tested, and in scope.

## Phase 7: close migration gaps

1. Use `rg`/AST inventory to find remaining native buttons, inputs, selects, checkboxes, tables, dialogs, and hardcoded Astryx-state colors.
2. Classify each remaining item as:
   - migrated through facade;
   - Astryx-specific direct composition;
   - approved custom domain exception;
   - bug to fix.
3. Fix every unapproved fallthrough.
4. Verify only one renderer exists in the DOM and no duplicate IDs/landmarks/effects occur.
5. Run a workflow-diff audit: same route, filters, commands, disabled reasons, data, storage, and navigation before/after renderer switch.

## Phase 8: accessibility, responsive, browser, visual, PWA, and Pages proof

1. Automated matrix for every route:
   - shadcn light;
   - shadcn dark;
   - Astryx light;
   - Astryx dark.
2. Cover system resolution independently and with representative screenshots.
3. Cover desktop/mobile special routes at 390, 768, 1280, and 1440 widths.
4. Verify landmarks, labels, focus, escape/return focus, dialogs/popovers/menus/toasts, table semantics, switches/tabs/selectors, contrast, reduced motion, and no document overflow.
5. Real-browser test current Chrome/Edge/Firefox/Safari plus iOS Safari and Android Chrome. Verify Tier 2 overlay fallbacks.
6. Extend PWA validation for Astryx chunks, local theme CSS, Figtree WOFF2, `/brp-demo` paths, offline load, saved Astryx preference, update, and switch back.
7. Run:

```bash
npm run lint
npm run typecheck
npm run test:dealer-state
npm run test:appearance
npm run test:e2e:dealer
npm run test:e2e:mobile
npm run test:e2e:appearance
npm run build
npm run build:pages
git diff --check
```

8. Start the exported/local application and inspect every special route in both renderers. Attach screenshots and exact route/viewport evidence.

## Review gates

Before committing implementation:

1. run a structured code review for correctness, regression, a11y, and architecture;
2. fix all justified findings;
3. run an independent browser/dogfood pass scoped to changed routes;
4. simplify duplicated renderer glue without changing behavior;
5. rerun the complete verification matrix;
6. inspect `git diff` and confirm no unrelated changes.

## Delivery

Create coherent conventional commits, push the feature branch, open a ready pull request with the design, architecture, route inventory, screenshots, and verification evidence, merge only when checks pass, then wait for GitHub Pages deployment and verify the published URL in both renderers on desktop and mobile.

Do not mark the goal complete until Pages is deployed and the final acceptance criteria in the design document are proven. The final report must include:

- exact package/theme versions;
- files and architectural seams added;
- every migrated route and documented exception;
- test/build commands and results;
- browser/viewport/visual evidence;
- PWA/Pages evidence;
- PR, merge commit, and deployed URL;
- any genuine Astryx beta limitation that remains.
