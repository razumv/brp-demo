# BRP dual design-system architecture: shadcn/ui and Astryx Neutral

**Date:** 2026-07-21

**Status:** Proposed; product direction approved in conversation, written specification awaiting approval

**Scope:** All admin and dealer routes, shared application chrome, light/dark/system color modes, static GitHub Pages delivery, and a future `brp-dev1` organization-settings adapter

## Goal

Add a global appearance setting that lets an administrator choose between two complete renderers for the same BRP product:

1. `shadcn/ui` — the current BRP visual implementation, preserved as the default renderer;
2. `Astryx Neutral` — a second renderer built from official Astryx components and the editable Neutral theme produced by the Astryx CLI.

Each renderer must support `system`, `light`, and `dark` color modes. The selected design system and color mode apply to both the admin and dealer portals without changing routes, data, permissions, or workflows. Switching renderers must not reset application state, duplicate interactive trees, or claim that unavailable backend operations work.

## Terminology

- **Design system** means the component renderer: `shadcn` or `astryx`.
- **Color mode** means `system`, `light`, or `dark`.
- **Current renderer** means the existing BRP component and CSS implementation. The settings label is `shadcn/ui` because that is the product-facing name requested by the owner, even though the current code also contains native controls, Base UI primitives, Tailwind utilities, CSS modules, and custom domain components.
- **Astryx renderer** means actual Astryx primitives and compositions. Merely recoloring or wrapping current controls does not satisfy this specification.
- **Shared behavior** means route state, domain state, commands, permissions, validation, and data. Shared behavior must remain renderer-independent.

## Product decisions

### Global ownership

Appearance is an organization-level setting controlled from the admin portal. Dealers inherit it and do not receive a separate design-system selector.

The admin settings page adds an `Оформлення` section before worker, queue, and database diagnostics. It contains:

- two equal selectable choices:
  - `shadcn/ui` with a `Поточна` marker when selected;
  - `Astryx Neutral`;
- a separate three-way color-mode control: `Системна`, `Світла`, `Темна`;
- concise preview/supporting copy, with no text describing the application as a demo, mockup, clone, or temporary frontend.

The appearance editor must always render in the active design system and must always retain a working path back to the other renderer.

### Persistence and future backend boundary

Use one versioned preference record:

```ts
type DesignSystem = "shadcn" | "astryx";
type ColorMode = "system" | "light" | "dark";

interface AppearancePreferenceV1 {
  version: 1;
  designSystem: DesignSystem;
  colorMode: ColorMode;
}

interface AppearancePreferencesRepository {
  read(): Promise<AppearancePreferenceV1 | null>;
  write(preference: AppearancePreferenceV1): Promise<void>;
  subscribe(
    listener: (preference: AppearancePreferenceV1) => void,
  ): () => void;
}

interface AppearanceBootstrapSnapshot {
  read(): AppearancePreferenceV1 | null;
  write(preference: AppearancePreferenceV1): void;
}
```

The frontend reads and writes through an asynchronous `AppearancePreferencesRepository` contract with `read`, acknowledged `write`, and `subscribe` operations. A separate synchronous bootstrap-snapshot interface exists only for the pre-hydration script. Its GitHub Pages implementation uses a versioned local-storage key such as `brp-appearance-v1` and synchronizes tabs with the browser `storage` event. It migrates the existing `brp-clone-theme` light/dark value once and never stores appearance in `DemoStore` or any dealer workflow collection.

For GitHub Pages, local storage is a browser-local shadow of the organization preference. “Global” means all admin/dealer routes and same-origin tabs in that browser; it cannot propagate to another device or independently logged-in browser. Cross-user/device organization propagation begins only when the authoritative `brp-dev1` adapter exists.

The bootstrap uses the last-known validated snapshot. After hydration, the repository resolves the authoritative value and replaces the snapshot when they differ. Admin writes expose pending/success/error state, update the last-known snapshot only after an acknowledged write, and retain the last-known-good preference on failure. `subscribe` publishes authoritative remote updates and browser-local storage updates through the same provider contract.

The future `brp-dev1` adapter becomes authoritative for the organization setting. The repository boundary must make that replacement possible without changing page components or renderer selection logic. This work does not invent an undocumented backend endpoint or pretend that local storage is the production authority.

### Defaults and invalid data

- Default design system: `shadcn`.
- Default color mode: preserve the current user-visible default (`light`) when no previous preference exists.
- Unknown versions, malformed JSON, or unsupported values fall back safely to defaults.
- The current theme remains visually unchanged until the user explicitly selects Astryx.

## Official Astryx baseline

The implementation is pinned to the versions verified on 2026-07-21:

- `@astryxdesign/core` `0.1.7`;
- `@astryxdesign/cli` `0.1.7`;
- `@astryxdesign/theme-neutral` `0.1.7` when required only as a reference or build dependency;
- `@stylexjs/stylex` `0.19.0`.

Authoritative sources:

- repository: <https://github.com/facebook/astryx>;
- MCP endpoint: <https://astryx.atmeta.com/mcp>;
- official MCP tools: `search` and `get`;
- CLI command requested by the owner: `npx astryx theme add neutral`;
- static theme build: `npx astryx theme build src/themes/neutral/neutralTheme.ts --out src/themes/neutral/neutral.css`.

The CLI-generated editable Neutral theme is authoritative for this project. Do not silently substitute the published prebuilt Neutral theme because it is not byte-for-byte equivalent to the CLI scaffold. Commit the generated TypeScript source, icon registry, CSS, JavaScript theme object, and declarations required by the build. Rebuild generated artifacts deterministically when the source changes.

The CLI theme uses Figtree typography. Bundle Figtree locally (for example through an exact-pinned `@fontsource-variable/figtree` package or locally committed licensed WOFF2 files), include Cyrillic coverage, and ensure it is available offline and under the GitHub Pages base path. Do not load a remote Google Fonts stylesheet.

Astryx is beta software. Exact subpath imports are required, and all APIs used in code must be checked against the installed version or the Astryx MCP instead of inferred from memory.

## Architecture

### Provider placement

`src/app/layout.tsx` remains the root server layout. Add an appearance bootstrap and client provider above both admin and dealer shells while keeping domain providers outside the design-system branch:

```text
RootLayout
├── early appearance bootstrap
└── AppearanceProvider
    ├── DemoStoreProvider and other domain/session/cart providers
    └── ActiveRenderer
        ├── CurrentRendererRoot
        └── AstryxRendererRoot
```

Only the selected renderer is mounted. Session, cart, drafts, orders, permissions, and workflow state are not remounted when the renderer changes.

Every behavior-bearing controller and every state value that must survive a renderer change—including unsaved controlled form values, filters, sorting, pagination, selections, collapse state, and workflow drafts—lives in a stable component/provider above the renderer-specific view branch. Renderer views may own only disposable presentation state such as hover and transient overlay visibility. Switching renderers may close an overlay and restore focus, but must not discard user-entered or workflow state.

The Astryx root contains exactly one `Theme`, one `LayerProvider`, one `LinkProvider` configured for Next.js navigation, and the appropriate internationalization provider if Astryx-owned strings require it. Never nest `LayerProvider` instances.

### Hydration and first paint on GitHub Pages

GitHub Pages uses static export, so the server cannot read local storage. Use the following deterministic contract:

1. the server prerenders the current `shadcn` renderer;
2. a small inline bootstrap in `<head>` validates the saved preference and applies root attributes before paint;
3. if the saved renderer is Astryx, the bootstrap seeds the required Astryx theme markers and sets a `data-renderer-pending` marker on the application root;
4. the first React client render matches the server-rendered shadcn tree;
5. the provider loads Astryx as a separately identifiable renderer chunk, commits its root providers, signals readiness, and removes the pending marker before a visible mismatched tree is painted;
6. the pending rule hides only the application root, never the whole document or offline fallback.

This avoids a hydration mismatch and an obvious shadcn-to-Astryx flash. A short empty application-root phase on a cold Astryx visit is acceptable for static hosting and disappears when a future backend/cookie lets the server know the organization renderer.

The bootstrap installs a bounded recovery watchdog. If hydration, Astryx import, or renderer readiness is not signaled in time, it atomically restores shadcn root attributes, removes the pending marker, reveals the server-rendered shadcn tree, and records a non-blocking diagnostic. An Astryx renderer error boundary performs the same recovery. JavaScript-disabled visits never execute the bootstrap and therefore remain visible in the server-rendered shadcn fallback.

Do not render both design systems simultaneously, make the whole application client-only, or use a CSS-only component-theme switch.

### Root attributes

Use stable semantic attributes:

```html
<html
  data-design-system="shadcn|astryx"
  data-color-mode="light|dark|system"
  data-resolved-theme="light|dark"
>
```

- `.dark` exists only when the current renderer is in a resolved dark mode and remains compatible with the current Tailwind custom variant.
- Astryx `Theme` receives the selected `mode` and its static Neutral theme object.
- `AppearanceProvider` exclusively owns `data-design-system`, `data-color-mode`, `data-resolved-theme`, `.dark`, and runtime `theme-color`.
- Astryx `Theme` exclusively owns `data-theme` and `data-astryx-theme="neutral"` while mounted. The bootstrap may seed them for a cold Astryx first paint but must match Astryx 0.1.7 semantics exactly, including omitting `data-theme` for `system` mode.
- `system` mode subscribes to `matchMedia('(prefers-color-scheme: dark)')` and updates `data-resolved-theme`, `.dark`, and the runtime `<meta name="theme-color">`.
- Keep `<html suppressHydrationWarning>`.

### Behavior/view split

Split shared chrome and page components at stable behavior boundaries:

```text
controller / hooks / domain commands
             │
      semantic BRP view model
        ┌────┴────┐
Current view    Astryx view
```

The current view preserves its existing DOM, classes, keyboard behavior, and visual baseline. The Astryx view uses actual Astryx components. Avoid duplicated route trees and avoid copying business logic into renderer-specific files.

The shell becomes:

- shared route/navigation/controller state;
- `CurrentAppShellView`, preserving the existing shell;
- `AstryxAppShellView`, built with official `AppShell`, `TopNav`, `SideNav`, and responsive mobile navigation.

Astryx `AppShell` is the outermost frame for Astryx pages. Use `contentPadding={4}` for forms/settings/text pages and `contentPadding={0}` for data-dense tables, dashboards, canvases, and matrices, with route sections owning local spacing.

## Semantic BRP component facade

Introduce a small typed facade whose public props express BRP intent rather than library-specific props. It selects one of two concrete renderers through appearance context.

Required families:

| BRP semantic control | Current renderer | Astryx renderer |
| --- | --- | --- |
| labeled command | existing button/CVA control | `Button` |
| icon command | existing icon button | `IconButton` |
| search/text field | current input | `TextInput` |
| multiline field | current textarea | `TextArea` |
| bounded single choice | native/current select | `Selector` |
| searchable choice | current combobox | `Typeahead` |
| multi choice | current checkbox/selector UI | `MultiSelector` or `CheckboxList` |
| boolean preference | current switch | `Switch` |
| page or content tabs | current tabs | `TabList`/`Tab` |
| compact exclusive view | current toggle group | `SegmentedControl` |
| action overflow | current menu/popover | `MoreMenu`/`DropdownMenu` |
| filter/search row | current toolbar | `Toolbar` + Astryx inputs/actions |
| content group | current panel/card | `Layout`/`Section`; `Card` only for independently actionable items |
| selectable visual option | current choice card | `SelectableCard` |
| data table | current table | Astryx `Table` family |
| selectable row | current custom row | `ListItem` |
| modal task | current dialog | `Dialog` |
| destructive confirmation | current alert/dialog | `AlertDialog` |
| persistent message | current callout | `Banner` |
| transient feedback | current toast | Astryx toast API |
| status/count | current chip/badge | `Badge`/`StatusDot` |
| loading/empty | current spinner/empty view | `Spinner`/`Skeleton`/`EmptyState` |
| layout/typography | current utilities | `Layout`, `Grid`, `Stack`, `Section`, `Text`, `Heading` |

Do not pass raw Astryx `xstyle` or current-renderer class contracts through the facade. Domain pages may use Astryx components directly only inside an Astryx-specific view and with a documented reason.

### Domain exceptions

The following are not replaced by nonexistent generic components:

- parts-diagram SVG/canvas and hit targets;
- cascading multi-column parts browser;
- delivery timeline and charts;
- order and warehouse kanban boards;
- wide permissions, inventory, consignment, and freight matrices;
- file-specific previews and image/product media.

Their domain visualization remains custom, but surrounding controls, layout, typography, panels, menus, dialogs, filters, and tables use the active renderer. Custom colors must consume semantic renderer tokens, including canvas/SVG colors obtained via `useTheme` where CSS variables cannot be used.

## CSS, tokens, and fonts

### Canonical layer order

The Astryx MCP specifies this Tailwind v4 order:

```css
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;

@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "../themes/neutral/neutral.css";
@import "@astryxdesign/core/tailwind-theme.css";
@import "tailwindcss/utilities.css" layer(utilities);
```

Because webpack/Next.js can hoist imports, put the canonical `@layer` declaration in its own CSS file and import that file first from the root entry. The local built Neutral CSS replaces the published Neutral CSS in the official example.

Before migrating routes, build a foundation smoke page/test with an Astryx primary button, text input, card, and table in both modes. Assert that computed component padding is non-zero. A failure blocks all further migration because it signals an unlayered reset or incorrect layer order.

### Legacy isolation

The current `globals.css` contains unscoped resets, root variables, `.dark` rules, and utility-like component classes. Inventory every top-level rule before moving imports. Explicitly layer or scope legacy reset/global styles under the current renderer root so they cannot override Astryx layers. Preserve current renderer output pixel-for-pixel.

Do not dynamically import global CSS and do not rely on source order alone. Inspect the production CSS output after the foundation phase and verify layer order in a real browser.

### Token ownership

- Current renderer retains current variables and Inter.
- Astryx renderer uses the generated Neutral tokens and Figtree.
- BRP orange may be introduced through the supported Astryx theme/accent-family API, never by changing one accent token while leaving derived contrast tokens stale.
- Status semantics remain consistent across renderers: success, warning, danger, info, neutral.
- No route migration may add arbitrary hardcoded color classes for Astryx state.

### Portals and overlays

All Astryx overlays use the single root `LayerProvider`. `LinkProvider` maps Astryx navigation to the base-path-safe Next.js link component. If a custom portal root remains unavoidable, it must inherit the active design-system and color-mode attributes and must be covered by light/dark overlay tests.

## Admin migration manifest

Every route below must render correctly in both design systems. The current renderer must remain unchanged; the Astryx column describes the required composition.

| Route/surface | Astryx composition and special requirements |
| --- | --- |
| shared admin shell and search | `AppShell`, `TopNav`, `SideNav`, mobile navigation, `CommandPalette`/search trigger, account and utility actions |
| `/admin` | `Layout`, `Grid`, KPI `Card`s, `ListItem`s, status surfaces |
| `/admin/order-pipeline` | `Toolbar`, search, `DateRangeInput`, `TabList`, `Collapsible`, `Pagination`; preserve custom list/kanban behavior |
| `/admin/orders/[id]` | `Breadcrumbs`, `Card`, `Table`, `Dialog`, `Collapsible`; preserve fixture/static order detail behavior |
| `/admin/order-detail` | query-based compatibility route for runtime-created order IDs; use the same order-detail composition and command contract |
| `/admin/supplier-orders` | KPI layout, `Toolbar`, `TabList`, `EmptyState` |
| `/admin/consignment` | full-width toolbar/tabs and Astryx table structure; preserve 2380 px matrix, internal horizontal scroll, sticky columns, mobile alternate view |
| `/admin/returns` | `Toolbar`, `SegmentedControl`, `Dialog`, `CheckboxInput`/list |
| `/admin/air-freight` | `TabList`, `Banner`, `Card`, `List`, `Dialog`; workflow strip uses `ProgressBar` + `StatusDot` without changing state logic |
| `/admin/ocean-freight` | grouped/expandable `Table`, `Dialog`, `Badge`, compact filters |
| `/admin/unit-shipping` | `DateRangeInput`, `Toolbar`, `Selector`, expandable `Table` |
| `/admin/warehouse` | `TabList`, `Selector`, `Table`, `Card`, `SegmentedControl`; preserve scanning and custom kanban behavior |
| `/admin/settlements` | `Collapsible`, `Toolbar`, `DateRangeInput`, `Table`; synchronization panel remains collapsible |
| `/admin/invoices` | `TabList`, `Toolbar`, `Dialog`, `Table`, `Popover`, `SegmentedControl`; preserve enabled/disabled contract actions |
| `/admin/catalog` | `TabList`, full-width toolbar, filter `Popover`, `Table`, `MoreMenu`; preserve sticky/resizable columns and pricing logic |
| `/admin/schedule` | `TabList`, `Toolbar`, `Collapsible`, `Card`, `Table`; preserve custom timeline, date filtering, and local collapse state |
| `/admin/companies` | `Toolbar`, desktop `Table`, compact mobile `ListItem`/cards, `Dialog`, filter `Popover` |
| `/admin/dealer-access` | `Selector`, `Toolbar`, compact responsive permission `Table`, `Switch`; preserve applicability rules |
| `/admin/users` | `Card`, `TabList`, `Toolbar`, desktop `Table`, compact mobile list, `Dialog` |
| `/admin/permissions` | `Toolbar`, responsive role selection, filter/actions `Popover`, permission matrix, `Switch`; preserve bulk-action semantics |
| `/admin/tasks` | `Card`, `CheckboxInput`, `Selector`, `Banner`, `AlertDialog` |
| `/admin/analytics` | `TabList`, `Toolbar`, `Card`, `Table`; chart/domain visualization stays custom and token-driven |
| `/admin/parts-report` | `FormLayout`, `DateRangeInput`, `CheckboxList`, `Table` |
| `/admin/performance` | `Toolbar`, `DateRangeInput`, `Card`, `Table` |
| `/admin/bossweb-lookup` | `FormLayout`, `Card`, `MetadataList`, `EmptyState` |
| `/admin/integrations` | `ClickableCard`, `Badge`, `StatusDot` |
| `/admin/settings` | Astryx settings layout plus appearance `SelectableCard`s and color `SegmentedControl`; existing diagnostics preserve behavior |
| `/admin/integrations/1c` | `TabList`, settings `FormLayout`, logs/status `Table`/`Banner` |
| `/admin/integrations/1c/unit-mapping` | `Toolbar`, `Selector`, mapping `Table`, dialogs |
| `/admin/integrations/bossweb` | `TabList`, settings forms, status/list surfaces |
| `/admin/settlements/mapping` | `Toolbar`, mapping `Table`, selector/dialog actions |

Locked or read-only admin controls remain disabled and retain their reason. Design-system migration must not falsely enable a backend-dependent operation.

## Dealer migration manifest

Dealer behavior, ownership keys, cart state, commands, and routes remain unchanged.

| Route/surface | Astryx composition and special requirements |
| --- | --- |
| shared dealer shell, nav, global search, cart overlay | Astryx `AppShell`, navigation, `CommandPalette`/search, and `Dialog` or a documented custom side-panel composition for the cart; Astryx has no generic Drawer component |
| `/login` | `FormLayout`, `TextInput`, password input, `Button`, validation/status; preserve identity contract and never persist password |
| `/offline` | `EmptyState`, retry `Button`, offline-safe assets |
| `/` | `Layout`, `Grid`, KPI/status summaries, `ClickableCard`/`ListItem` navigation |
| `/catalog` and catalog cascade paths | `Breadcrumbs`, `Grid`, `List`/`ListItem`, `Toolbar`; preserve independent persistent columns and URL/back state rather than collapsing into one generic tree |
| catalog diagram route | Astryx toolbar/actions/table around the existing SVG/canvas diagram and hit targets |
| `/dealer/accessories` | family `SelectableCard`s, vehicle `Selector` cascade, search/sort `Toolbar`, facets in `CheckboxList`/`MultiSelector`, product cards and mobile filter disclosure |
| `/cart` | Astryx item list/table, quantity controls, order summary, confirmation dialog; preserve command validation |
| `/order-confirmation` | query-based confirmation compatibility route for runtime-created IDs; preserve command/result behavior |
| `/order-confirmation/[id]` | static/fixture confirmation route with the same confirmation composition |
| `/dealer/orders/[id]` | static/fixture order detail using `StatusDot`, `Card`, `MetadataList`, `Table`, workflow commands |
| `/dealer/order-detail` | query-based compatibility route for runtime-created order IDs with identical workflow behavior |
| `/dealer/orders` | full-width search/filter toolbar, status tabs/selector, responsive table/cards |
| `/dealer/documents` | toolbar, filters, `Table`, badges, export/info actions; preserve new-document navigation count |
| `/dealer/order-drafts` | compact full-width search with icon filters, Excel/info actions, responsive list/table, empty state |
| `/dealer/consignment` | full-width search/filter toolbar, status views, request/transfer cards or table, dialogs |
| `/dealer/settlements` | search/filter toolbar, balance/status cards, responsive transactions table |
| `/dealer/parts-inventory` | search/filter toolbar, stock table/cards, status badges |
| `/dealer/units` | search/filter toolbar, selectors and complete source-backed unit detail/actions |
| `/dealer/network` | search/filter toolbar, dealer list/map/domain view, details |
| `/dealer/customers` | search/filter toolbar, responsive customer list/table, create/edit dialogs |
| `/dealer/workshop` | search/filter toolbar, status board/list, work-order dialog and real supported status transitions; theme migration itself does not invent drag-and-drop |
| `/dealer/team-access` | team list and responsive permissions matrix with `Switch`; disabled commands retain `disabledMessage` |
| `/dealer/parts-report` | source-parity filters, report table/summary/export state |
| `/dealer/bossweb` | search/form layout, results metadata and status states |
| `/dealer/schedule` | compact controls, custom timeline, date-grouped delivery list, collapsible state persisted as currently specified |

The high-leverage `DealerDataToolbar` behavior becomes a semantic facade seam: search grows to available width and icon-only filters sit at the right on mobile, while both renderers preserve the same query/filter state.

The checked route inventory is generated from `src/app/**/page.tsx`. Every exported route, query-based compatibility route, and fixture emitted by `generateStaticParams` must map to exactly one migration-manifest row and one verification entry.

## Workflow invariants

Changing renderer must not change:

- route URLs or GitHub Pages base-path behavior;
- login role resolution and dealer identity;
- permissions and access checks;
- document, order, draft, cart, consignment, settlement, catalog, unit, customer, or workshop data;
- local workflow storage keys such as `brp-dealer-workflow-v2:*`;
- command preconditions, validation, disabled reasons, or error handling;
- query-string, breadcrumb, back/forward, sorting, filtering, pagination, or collapse state;
- admin/dealer responsive information hierarchy;
- PWA offline fallback and update behavior.

No UI copy may say the product is a demo, mockup, clone, or temporary frontend. No locked action may become clickable solely because an Astryx equivalent exists.

## Browser and accessibility contract

Test at minimum:

- current Chrome/Edge/Firefox desktop;
- current Safari desktop;
- current iOS Safari and Android Chrome;
- installed PWA on desktop and mobile;
- 390 px mobile, 768 px tablet, 1280/1440 px desktop.

Astryx Tier 1 browsers receive complete overlay positioning. Safari 17-class Tier 2 browsers must remain functionally usable when CSS Anchor Positioning degrades. Feature-detect the Popover API, anchor positioning, and `light-dark()` where relevant; unsupported advanced positioning must fall back without blocking commands.

For both renderers and all modes verify:

- landmarks, headings, labels, names, descriptions, and table semantics;
- keyboard-only navigation, visible focus, escape/close behavior, and focus return;
- mobile drawer focus containment and close-on-route-change;
- dialogs, popovers, menus, tooltips, and toasts in jsdom and a real browser;
- switch, tabs, segmented controls, selectors, table selection/sorting, and disabled explanations;
- text/status contrast and non-color status cues;
- reduced-motion behavior;
- no duplicate IDs, duplicate landmarks, hidden duplicate controls, or document-level horizontal overflow.

## Automated verification

### Unit and contract tests

- preference parsing, validation, migration, defaulting, serialization, and storage-event synchronization;
- repository adapter behavior and a backend-shaped test double;
- resolved `system` mode and `matchMedia` changes;
- root attributes, `.dark`, runtime theme color, and provider selection;
- one mounted renderer only;
- state preservation while switching design system and mode;
- representative renderer-switch preservation for unsaved form values, filters, sorting, pagination, selections, collapse state, and workflow drafts;
- semantic facade parity for events, disabled states, labels, errors, and controlled values;
- current-route workflow tests continue unchanged.

### Foundation and component tests

- computed-style foundation assertion for Astryx Button/Input/Card/Table in light and dark;
- `LayerProvider` and Next `LinkProvider` integration;
- overlay focus/close/portal inheritance;
- successful cold Astryx chunk load plus blocked/rejected chunk, renderer error, stale service-worker asset, JavaScript-disabled fallback, and watchdog recovery;
- admin appearance editor in both renderers, including switching back;
- representative data-dense table, mobile list, dialog, form, toolbar, and custom visualization adapters.

### Route and visual matrix

For every route in both manifests, capture at least:

- `shadcn × light`;
- `shadcn × dark`;
- `Astryx × light`;
- `Astryx × dark`;

Capture desktop and mobile for every shared pattern and all data-dense/special routes. `system` gets dedicated preference-resolution tests plus representative browser screenshots. Current-renderer screenshots are regression baselines; Astryx screenshots are reviewed for component authenticity, density, overflow, tokens, and consistency.

### Required commands

Run from a clean worktree:

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
```

Add focused `test:appearance` and `test:e2e:appearance` suites, include them in `npm run check`/CI, and make the browser suite enumerate the checked route inventory rather than relying on manual screenshots. Existing `test:e2e:mobile` covers only the current admin mobile contract and is not evidence for the full renderer matrix.

## PWA and GitHub Pages

- Keep static export and `/brp-demo` base path intact.
- Astryx JavaScript and CSS under `_next/static` must be precached by the existing Workbox generation rules.
- Precache local Figtree WOFF2 assets and verify paths in the generated service worker.
- Keep navigation network-only with the existing offline fallback unless separately approved.
- Do not precache admin HTML/RSC simply to make the theme work.
- Extend `pwa:validate` to assert that Astryx chunks/theme CSS/font assets exist under the correct base path and are reachable from the exported shell.
- Verify a saved Astryx preference after reload, offline launch, service-worker update, and return to shadcn.
- Update runtime `theme-color`; keep a safe static manifest color because one manifest cannot represent an organization preference.

## Delivery sequence

1. Pin Astryx dependencies and run the exact Neutral-theme CLI scaffold.
2. Build/commit the static theme and local Figtree assets.
3. Establish CSS layers and pass the foundation smoke test in development and production build.
4. Implement preference types, repository, bootstrap, provider, root attributes, and tests.
5. Implement appearance settings in both renderers.
6. Split/migrate the shared shell first.
7. Implement the semantic facade and migrate shared patterns.
8. Migrate admin routes in coherent domain batches.
9. Migrate dealer routes in coherent domain batches.
10. Remove undocumented bypasses and audit hardcoded colors/native controls.
11. Run the complete automated, visual, accessibility, PWA, and Pages matrix.
12. Commit, push, open/merge the PR, wait for Pages, and verify the published application.

Each phase is test-first and leaves the branch buildable. Do not report global completion while any route still falls through to current controls in Astryx mode unless the exception is explicitly listed above.

## Acceptance criteria

The work is complete only when:

1. an admin can select either `shadcn/ui` or `Astryx Neutral` and `system`/`light`/`dark`;
2. the choice applies globally to admin and dealer portals, persists across reloads/tabs, and preserves all domain state;
3. the current renderer has no material visual or workflow regression;
4. Astryx mode uses actual official Astryx primitives across every applicable admin and dealer surface;
5. all listed routes render and operate in all four explicit renderer/mode combinations;
6. no route duplicates business logic or mounts both renderers;
7. custom domain visualizations are token-aware and their surrounding UI is migrated;
8. disabled/locked workflows remain truthful and no demo/mock copy is introduced;
9. CSS layers, first paint, portals, focus, responsive behavior, and contrast pass their tests;
10. production build, GitHub Pages export, PWA generation/validation, offline launch, and published Pages smoke tests pass;
11. the `brp-dev1` repository adapter boundary is documented and testable without guessing the backend API;
12. the final report includes commands, route/viewport evidence, known Astryx beta limitations, PR/merge, and deployed Pages URL.

## Non-goals

- Changing business workflows, permissions, or data semantics as part of visual migration.
- Inventing `brp-dev1` endpoints or authentication behavior.
- Rewriting custom diagrams, timelines, charts, or kanban algorithms without a separate requirement.
- Removing the current renderer.
- Making appearance user-specific or dealer-editable.
- Claiming support for browsers below Astryx's documented best-effort tier.

## Principal risks and controls

| Risk | Control |
| --- | --- |
| Tailwind/reset silently overrides Astryx | canonical layers file, legacy reset audit, foundation computed-style test, production CSS inspection |
| hydration mismatch or renderer flash | server shadcn baseline, head bootstrap, first-render parity, layout-effect switch, app-root pending marker |
| state lost on switch | providers/domain store above renderer branch, persistence tests |
| current UI regresses | current renderer preserved and screenshot-regressed before route migration |
| partial “Astryx skin” | semantic facade inventory, native-control audit, route acceptance matrix |
| overlays ignore theme/focus | one `LayerProvider`, portal inheritance, real-browser focus tests |
| CLI/published Neutral divergence | commit the exact CLI-generated editable theme and built artifacts |
| static/PWA asset failure | local fonts, base-path validators, exported/offline smoke tests |
| beta API drift | exact versions, lockfile, MCP/installed-doc verification, subpath imports |
| false workflow enablement | preserve command guards and disabled reasons; functional changes require separate evidence |
