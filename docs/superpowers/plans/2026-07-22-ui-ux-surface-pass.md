# BRP UI/UX Surface Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a tested dual-renderer UI pass covering shell elevation, shared search/filter composition, priority admin surfaces, dense people/governance views, dealer catalog media/search, and a BRP-specific responsive login.

**Architecture:** Route controllers keep all domain state and handlers. Renderer-neutral facade components provide shared behavior; Astryx views compose real `@astryxdesign/core` components while CSS modules/vanilla-extract provide responsive geometry and semantic surface separation. Small local preferences are stored through one SSR-safe hook.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, shadcn/ui, `@astryxdesign/core`, Tailwind CSS v4, CSS Modules, vanilla-extract, Node test runner, Playwright.

## Global Constraints

- Do not change business logic, API contracts, route data shapes, or supported workflows.
- Do not add “demo”, “mock”, “clone”, unsupported registration, or non-functional filter controls to user-facing UI.
- Astryx renderer uses real `@astryxdesign/core` primitives and semantic tokens; no hard-coded white surfaces.
- Preserve GitHub Pages `basePath`, the shadcn renderer, light/dark modes, keyboard access, and mobile drawer behavior.
- Test widths 390, 768, 1280, and 1440 without document-level horizontal overflow.

---

### Task 1: Shared preferences and shell

**Files:**
- Create: `src/components/shell/use-shell-preferences.ts`
- Modify: `src/components/shell/astryx-app-shell-view.tsx`
- Modify: `src/components/shell/astryx-shell.css.ts`
- Modify: `src/app/globals.css`
- Test: `tests/astryx-shell-preferences.test.ts`
- Test: `tests/e2e/appearance-shell.spec.ts`

**Interfaces:**
- Produces: `usePersistedBooleanPreference(key: string, fallback: boolean): readonly [boolean, (value: boolean) => void, boolean]`.
- Produces: `data-sidebar-collapsed` on the Astryx shell root and a labelled collapse control.

- [ ] Write a failing contract test that requires the SSR-safe preference hook, storage key, labelled collapse button, compact rail state, and tooltip-capable navigation labels.
- [ ] Run `npx tsx --test tests/astryx-shell-preferences.test.ts`; expect failure because the hook and collapsed shell contract do not exist.
- [ ] Implement the hook with a post-mount storage read, guarded storage writes, and a hydration-ready signal; compose Astryx `IconButton`, `SideNav`, and existing navigation data without moving route children.
- [ ] Add elevated side-navigation geometry, compact rail width, active-state visibility, and content-width recomputation using semantic Astryx variables.
- [ ] Extend Playwright coverage for reload persistence, keyboard focus, desktop rail, unchanged mobile drawer, and no overflow.
- [ ] Run the focused Node and Playwright tests, then commit `feat(shell): add persistent Astryx navigation rail`.

### Task 2: Shared data toolbar and surfaces

**Files:**
- Modify: `src/components/dealer/dealer-data-toolbar.tsx`
- Modify: `src/components/dealer/dealer-data-toolbar.module.css`
- Modify: `src/components/admin/admin-ui.tsx`
- Modify: `src/components/admin/admin-ui.module.css`
- Create: `src/components/brp-ui/data-toolbar-contract.ts`
- Test: `tests/dealer-toolbar-contract.test.ts`
- Test: `tests/e2e/dealer-data-toolbar.spec.ts`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Produces: `DataToolbarFilterContract` with `label`, `activeCount`, `open`, `onOpenChange`, `panelId`, `content`, and optional `onClear`.
- Preserves: `DealerDataToolbarProps` and `AdminToolbar` route call sites.

- [ ] Strengthen the existing toolbar tests to require a flex-growing search field, one icon-only filter trigger, active count, `aria-expanded`, `aria-controls`, Escape/light dismissal, reset, and mobile layout.
- [ ] Run focused tests and observe the expected missing-contract/dismissal failure.
- [ ] Implement the shared contract and adapt both toolbars without moving filter semantics out of route controllers.
- [ ] Add semantic elevated toolbar/filter-panel surfaces and responsive geometry; never hide a filter that currently affects data.
- [ ] Inventory all search-bearing admin/dealer routes and migrate only structural drift to the shared contract.
- [ ] Run toolbar tests and appearance route inventory, then commit `feat(ui): unify search and filter toolbars`.

### Task 3: Ocean and pipeline hierarchy

**Files:**
- Modify: `src/components/admin/astryx-admin-ocean-freight-view.tsx`
- Modify: `src/components/admin/astryx-admin-ocean-unit.module.css`
- Modify: `src/components/admin/astryx-admin-order-pipeline-view.tsx`
- Modify: `src/components/admin/astryx-admin-order-pipeline.module.css`
- Test: `tests/e2e/appearance-admin-ocean-unit.spec.ts`
- Test: `tests/e2e/appearance-admin-orders.spec.ts`

**Interfaces:**
- Consumes: the shared toolbar from Task 2.
- Preserves: existing ocean and pipeline controller models, route links, counts, list/Kanban state, grouping, and actions.

- [ ] Add failing appearance assertions for distinct canvas/card/header/group/body/hover roles and focusable table regions.
- [ ] Run the two focused Playwright specs and confirm they fail on the missing hierarchy markers.
- [ ] Recompose the Astryx ocean table and pipeline groups using `Card`, `Toolbar`, existing badges, and semantic surface classes; use settlements as the density reference.
- [ ] Verify list and Kanban use the same filtered model and that summary values remain summaries rather than tabs.
- [ ] Run focused specs at mobile and desktop widths, then commit `fix(admin): restore operational surface hierarchy`.

### Task 4: Companies and users views

**Files:**
- Create: `src/components/admin/use-admin-view-preference.ts`
- Modify: `src/components/admin/astryx-admin-companies-view.tsx`
- Modify: `src/components/admin/astryx-admin-companies-view.module.css`
- Modify: `src/components/admin/astryx-admin-users-view.tsx`
- Modify: `src/components/admin/astryx-admin-users-view.module.css`
- Test: `tests/admin-view-preferences.test.ts`
- Test: `tests/e2e/appearance-admin-people.spec.ts`

**Interfaces:**
- Produces: `useAdminViewPreference(routeKey: "companies" | "users"): readonly ["cards" | "list", (mode: "cards" | "list") => void]`.
- Preserves: page controller filtering and every existing row/card action handler.

- [ ] Write failing tests for per-route persistence and equal record/action identity in cards and list modes.
- [ ] Run focused tests and observe failure because the view preference and list rendering are absent.
- [ ] Add an Astryx segmented view control, dense desktop table, adaptive compact mobile rows, and tighter card spacing, all fed by the existing filtered arrays.
- [ ] Add empty states and accessible selected state without duplicating domain logic.
- [ ] Run preference and people appearance tests, then commit `feat(admin): add dense people view modes`.

### Task 5: Compact governance controls

**Files:**
- Modify: `src/components/admin/astryx-admin-permissions-view.tsx`
- Modify: `src/components/admin/astryx-admin-dealer-access-view.tsx`
- Modify: `src/components/admin/admin-permission-matrix.tsx`
- Modify: `src/components/admin/admin-permission-matrix.module.css`
- Test: `tests/e2e/admin-mobile-permissions-compact.spec.ts`
- Test: `tests/e2e/appearance-admin-governance.spec.ts`

**Interfaces:**
- Preserves: permission keys, applicability rules, role/company selection, bulk actions, and switch handlers.
- Produces: desktop matrix and mobile object accordion from the same permission records.

- [ ] Add failing scenarios for compact desktop headers, mobile object accordions, omission of non-applicable rows, one-line switches, and filters/role controls inside the compact disclosure.
- [ ] Run the two focused specs and confirm the expected layout/interaction failures.
- [ ] Implement the responsive matrix/accordion split using real Astryx controls and existing applicability data.
- [ ] Verify keyboard traversal, labels, toggles, role changes, and bulk actions.
- [ ] Run focused governance tests, then commit `fix(admin): compact permission governance views`.

### Task 6: Dealer catalog and accessories

**Files:**
- Modify: `src/components/catalog/catalog-router.tsx`
- Modify: `src/components/catalog/catalog.module.css`
- Modify: `src/components/catalog/diagram-viewer.tsx`
- Modify: `src/components/dealer/features/accessories-page.tsx`
- Modify: `src/components/dealer/features/accessories-page.module.css`
- Modify: `src/lib/dealer/catalog-data.ts`
- Test: `tests/dealer-catalog-search.test.ts`
- Test: `tests/e2e/dealer-accessories-search.spec.ts`
- Test: `tests/e2e/appearance-dealer-data.spec.ts`

**Interfaces:**
- Produces: `filterDiagramNames(diagrams: readonly string[], query: string): readonly string[]`.
- Preserves: catalog query parameters, selected brand/year/series/model, diagram links, accessory filter state, and cart actions.

- [ ] Write failing unit tests for case-insensitive diagram name/number search, empty query, no match, and upstream-selection preservation.
- [ ] Run the unit test and observe failure because diagram filtering is absent.
- [ ] Implement diagram search at the final catalog stage, repository-owned thumbnail mapping, lazy images, fixed aspect ratio, alternative text, and fallback media.
- [ ] Improve availability badge contrast with semantic status roles and text labels.
- [ ] Add repository-owned family artwork mappings for Can-Am Off-Road, Can-Am On-Road, Sea-Doo, and Ski-Doo without removing model/category/availability filters.
- [ ] Run catalog/accessory unit and Playwright tests, then commit `feat(dealer): enrich catalog discovery`.

### Task 7: Dealer surfaces and BRP login

**Files:**
- Modify: `src/components/dealer/dealer.module.css`
- Modify: dealer feature CSS modules that currently render work areas directly on the canvas
- Modify: `src/components/shell/astryx-login-screen-view.tsx`
- Modify: `src/components/shell/astryx-login-screen.module.css`
- Modify: `src/components/shell/current-login-screen-view.tsx` only when a renderer-neutral structure fix is required
- Test: `tests/e2e/appearance-dealer-shared.spec.ts`
- Test: `tests/e2e/appearance-shell.spec.ts`
- Test: `tests/e2e/appearance-state-preservation.spec.ts`

**Interfaces:**
- Preserves: `LoginScreenViewProps`, submit/role routing, theme/language controls, dealer feature controllers, and all route actions.
- Produces: semantic dealer page/panel/table/control surface roles shared across Astryx feature views.

- [ ] Add failing visual/contract assertions for dealer surface separation and the form-first mobile/two-zone desktop BRP login.
- [ ] Run focused shell/dealer tests and observe missing surface/composition failures.
- [ ] Apply the reference lock: neutral canvas, raised navigation/work panels, solid tables, distinct controls, restrained orange actions, and dark equivalents.
- [ ] Recompose login around the existing controller only; do not add registration or recovery links.
- [ ] Verify admin/dealer role redirects, keyboard form operation, mobile keyboard-safe layout, and no CFMOTO copy/assets.
- [ ] Run focused tests, then commit `fix(appearance): separate dealer surfaces and login`.

### Task 8: Certification and release

**Files:**
- Modify: tests and snapshots only when they reflect intentional accepted output.
- Create: `docs/research/ui-ux-surface-pass-verification.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: reproducible verification evidence and a release-ready branch.

- [ ] Install or link the exact lockfile dependencies in the isolated worktree and read the relevant Next.js 16 client-component, CSS, and static-export documentation.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test:dealer-state`, `npm run test:appearance`, `npm run test:e2e`, `npm run test:e2e:appearance:matrix`, `npm run build`, `npm run build:pages`, and `git diff --check`.
- [ ] Capture light/dark screenshots at 390, 768, 1280, and 1440 for the required routes and compare them against the reference lock.
- [ ] Run a simplification pass, full code review, apply eligible findings, and rerun affected checks.
- [ ] Record commands, results, browser evidence, and any genuine backend-only limitations in the verification document.
- [ ] Commit the final verified fixes, push `codex/ui-ux-surface-pass`, create a ready PR, watch CI, merge, and verify the GitHub Pages deployment URL.
