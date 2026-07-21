# Dealer Portal Parity Certification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-certify and complete only the dealer-facing BRP portal against the current authenticated source, publish the result to GitHub Pages, and prove the dealer golden path on the deployed build.

**Architecture:** Preserve the static-exported Next.js 16 application and keep dealer workflows deterministic in the browser. Dealer-facing local operations go through typed dealer contracts that can later be replaced by a `brp-dev1` adapter. External effects (1C, synchronization, real upload/download/export, approvals, shipments, and permissions) remain unavailable until a backend contract exists and must never report false success.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4/CSS modules, Lucide, Playwright, Workbox PWA, GitHub Pages static export.

## Global Constraints

- Dealer-only implementation boundary. Do not edit `src/app/admin/**`, `src/components/admin/**`, `src/lib/admin*`, admin tests, or admin documentation.
- Shared files may change only with additive dealer-scoped behavior and explicit whole-repository regression verification.
- Do not put `demo`, `демо`, `демонстраційний`, `тестова позиція`, or equivalent environment disclaimers in user-visible UI.
- Do not fabricate source evidence. Current source claims require a dealer-authenticated session and dated desktop/mobile evidence.
- Do not execute unsafe source actions: submit, approve, cancel, delete, synchronize, receive, change access, upload/download, 1C, or external export.
- Every enabled dealer control must have a deterministic observable effect. Otherwise it is disabled with a neutral touch/keyboard-accessible reason.
- Team/access, approval, shipment, 1C, sync, and other external locks remain until confirmed by source and a backend contract.
- Follow failing-test-first TDD for each behavior change.
- Final completion requires merged PR, successful Pages deployment, and the deployed dealer golden path.

---

## Task 1: Create the dealer-only certification evidence and component contracts

**Files:**
- Create: `docs/research/DEALER_PARITY_CERTIFICATION_2026-07-21.md`
- Modify: `docs/research/components/dealer-secondary-pages.spec.md`
- Modify: `docs/research/components/dealer-orders.spec.md`
- Modify: `docs/research/components/dealer-order-detail.spec.md`
- Modify: `docs/research/components/customer-management.spec.md`
- Create: `docs/research/components/dealer-workflow-boundaries.spec.md`

- [x] Record historical evidence separately from the fresh 2026-07-21 source pass.
- [x] Add every dealer route from the user checklist to one parity matrix.
- [x] For each control classify: working, correctly locked, enabled/inert, wrong action, or backend contract required.
- [x] For each route identify frontend-now behavior versus future `brp-dev1` behavior.
- [x] Remove stale multi-tenant/demo-product assumptions; document the current single dealer identity without putting an environment label in the UI.
- [ ] Capture the source at 1440px and 390px after the user supplies a dealer-authenticated browser session; keep fields explicitly pending until then.
- [x] Validate document links and ensure no admin implementation work is included.

## Task 2: Add reusable dealer E2E session and Pages harnesses

**Files:**
- Create: `tests/e2e/support/dealer-session.ts`
- Create: `tests/e2e/support/dealer-pages-server.ts`
- Modify: `playwright.config.ts` only if the change is generic and does not alter admin projects
- Create: `tests/e2e/dealer-auth-navigation.spec.ts`
- Create: `tests/e2e/dealer-pwa-pages.spec.ts`

- [x] Extract the safe dealer-session fixture from the existing role test.
- [x] Test login, direct dealer routes, logout, desktop navigation, and 390px mobile navigation.
- [x] Add a Pages-base-path/standalone navigation harness for `out/` without relying on the dev server.
- [ ] Assert manifest scope/start URL and dealer-only shortcuts. Scope/start URL pass; the dealer-only shortcut assertion is an intentional expected failure until Task 10.
- [x] Run the new specs and record the expected initial failures before production changes.

## Task 3: Define dealer workflow and external-operation contracts

**Files:**
- Create: `src/lib/dealer/contracts.ts`
- Create: `src/lib/dealer/local-adapter.ts`
- Create: `src/components/dealer/dealer-workflow-provider.tsx`
- Create: `src/components/dealer/locked-operation.tsx`
- Create: `src/app/(dealer)/layout.tsx`
- Move dealer-only route source files under `src/app/(dealer)/**` while preserving their public URLs and static params
- Create: `tests/e2e/dealer-safe-actions.spec.ts`
- Modify dealer consumers only; do not change admin call sites

- [x] Mount the additive client workflow provider in the dealer-only route group; keep the root `DemoStoreProvider`, storage key, state version, login, and admin branch unchanged.
- [x] Define typed results for local mutation, local preview, generated artifact, unavailable backend operation, and validation error.
- [x] Derive current dealer identity inside the dealer adapter boundary, not from caller-supplied company/actor fields.
- [x] Add an accessible reusable lock/reason UI for backend-dependent actions.
- [x] Write failing tests that detect false success copy and enabled inert controls.
- [x] Replace dealer-facing fake sync/upload/export/1C success with deterministic local behavior or the lock component.
- [x] Keep the existing static export compatible; no server actions or same-origin backend assumptions.

## Task 4: Split the dealer secondary-page monolith without changing behavior

**Files:**
- Modify: `src/components/dealer/dealer-feature-page.tsx`
- Create: `src/components/dealer/features/accessories-page.tsx`
- Create: `src/components/dealer/features/units-page.tsx`
- Create: `src/components/dealer/features/schedule-page.tsx`
- Create: `src/components/dealer/features/workshop-page.tsx`
- Create: `src/components/dealer/features/bossweb-page.tsx`
- Create: `src/components/dealer/features/secondary-data-pages.tsx`
- Create: `src/components/dealer/features/feature-frame.tsx`

- [ ] Add route-render smoke assertions before refactoring.
- [ ] Move code in isolated commits while preserving route exports and visible behavior.
- [ ] Keep feature ownership separated so later tasks do not edit the same monolith concurrently.
- [ ] Run route smoke tests, typecheck, and lint.

## Task 5: Correct accessories and global parts search

**Files:**
- Modify: `src/components/dealer/features/accessories-page.tsx`
- Modify: `src/lib/mock-data.ts` only through dealer-safe/additive fixtures
- Create: `src/lib/dealer/accessories-data.ts`
- Create: `tests/e2e/dealer-accessories-search.spec.ts`
- Create: `tests/e2e/dealer-global-search.spec.ts`

- [ ] Write a failing test proving a selected accessory currently adds the wrong SKU.
- [ ] Put actual accessory SKUs into the dealer cart fixture index.
- [ ] Add the selected SKU, quantity, price/description, and compatibility metadata to cart.
- [ ] Make family, year, compatibility, purpose, query, stock, and sort controls operate on one typed collection.
- [ ] Test desktop and mobile accessory filters and selected-SKU cart state.
- [ ] Test desktop dropdown and mobile modal global search, availability filters, quantity, and cart add.

## Task 6: Complete cart, confirmation, drafts, and order detail local workflows

**Files:**
- Modify: `src/components/catalog/cart-page.tsx`
- Modify: `src/components/catalog/order-confirmation-page.tsx`
- Modify: `src/components/dealer/dealer-orders.tsx`
- Create: `src/components/dealer/features/order-drafts-page.tsx`
- Modify dealer-only state/adapter files from Task 3
- Create: `tests/e2e/dealer-catalog-order-flow.spec.ts`
- Create: `tests/e2e/dealer-order-detail.spec.ts`
- Create: `tests/e2e/dealer-order-drafts.spec.ts`

- [ ] Write the catalog → diagram → cart → customer → create → confirmation → list → detail golden path first.
- [ ] Support manual add for the typed part index instead of a single hard-coded number.
- [ ] Persist draft title and order-builder metadata; implement create, save, search, reopen, refresh, and delete locally.
- [ ] Change submit/confirmation wording so it never claims a remote send or backend confirmation.
- [ ] Remove user-visible environment/test copy and seeded test labels.
- [ ] Make private notes and text chat persist and create timeline events.
- [ ] Treat selected attachment name as local metadata only; do not claim upload or store file contents.
- [ ] Disable Excel import/export with a neutral backend-dependent explanation unless a real local artifact is generated and tested.

## Task 7: Complete customers and customer equipment

**Files:**
- Modify: `src/components/dealer/dealer-customers.tsx`
- Modify dealer-only adapter/state files
- Create: `tests/e2e/dealer-customers-equipment.spec.ts`

- [ ] Write failing tests for category filtering and deletion.
- [ ] Add deterministic customer categories and make all enabled category filters real.
- [ ] Implement source-confirmed create/edit/delete with confirmation and related-record safety.
- [ ] Add/edit/remove equipment according to source-confirmed fields and ownership rules.
- [ ] Verify search, counts, selection, empty state, persistence, and 390px layout.

## Task 8: Complete Units, Schedule, Workshop, BossWeb, and Parts Report

**Files:**
- Modify their separated feature files from Task 4
- Create typed data files under `src/lib/dealer/`
- Create: `tests/e2e/dealer-operational-features.spec.ts`

- [ ] Units: one collection must drive container/BL/model/VIN search, tabs, counts, rows, and honest empty states.
- [ ] Schedule: one dated collection must drive query, categories, visible timeframe, timeline markers/cards, selection, totals, and mobile list.
- [ ] Workshop: implement only the lifecycle confirmed by fresh source evidence; otherwise keep unsupported transitions unavailable with reason.
- [ ] BossWeb: support the source-confirmed representative query set and honest loading/unknown/no-result states.
- [ ] Parts Report: filter real local orders by date/manager/status and render actual order statuses/totals.
- [ ] Test every enabled filter plus persistence where applicable on desktop and mobile.

## Task 9: Complete Documents, Consignment, Settlements, Inventory, and Network

**Files:**
- Modify: `src/components/dealer/features/secondary-data-pages.tsx`
- Create typed route data under `src/lib/dealer/`
- Create: `tests/e2e/dealer-secondary-pages.spec.ts`

- [ ] Write failing tests for each currently enabled inert search, tab, period, selector, and disclosure.
- [ ] Documents: deterministic search/type/status views; external export remains locked.
- [ ] Consignment: deterministic stock/network/request tabs, search, filters, and request preview; final external request remains locked.
- [ ] Settlements: deterministic periods/search over a typed ledger; external refresh/export remains locked.
- [ ] Inventory: deterministic search/stock filters and counts from one collection.
- [ ] Network: deterministic equipment/parts selector and query from one collection.
- [ ] Remove collection totals that disagree with the visible fixture unless explicitly defined by the same collection.

## Task 10: Finish dealer shell, mobile behavior, locks, and PWA

**Files:**
- Modify dealer branches in `src/components/shell/app-shell.tsx`
- Modify: `src/components/shell/global-parts-search.tsx`
- Modify dealer CSS only
- Modify: `src/app/manifest.ts`
- Modify PWA tests/validation only if needed

- [ ] Test and implement client-view, language, and notification controls only where source confirms behavior; otherwise make them honestly unavailable rather than inert.
- [ ] Prove dealer mobile navigation, focus return, escape/backdrop handling, and no horizontal overflow at 390px.
- [ ] Replace admin PWA shortcuts with dealer-safe shortcuts without changing admin routes/components.
- [ ] Validate installability, base path, offline fallback, update behavior, and standalone Pages navigation.
- [ ] Verify all locks expose a visible/accessibility reason on mouse, touch, and keyboard.

## Task 11: Full validation and independent review

**Files:**
- Update certification document with implementation evidence and test commands
- No unrelated production changes

- [ ] Run targeted dealer E2E on desktop and 390px mobile.
- [ ] Run full E2E regression, lint, typecheck, build, `build:pages`, and PWA validation.
- [ ] Run independent code review for dealer workflow correctness, false-success risks, accessibility, data integrity, and static-export safety.
- [ ] Run browser dogfood against the production build and fix all P0/P1 plus justified P2 findings.
- [ ] Confirm `git diff` contains no admin implementation files.

## Task 12: PR, merge, Pages deployment, and final recertification

**Files:**
- Update: `docs/research/DEALER_PARITY_CERTIFICATION_2026-07-21.md`

- [ ] Create meaningful dealer-only commits and push the feature branch.
- [ ] Open a PR with the route matrix, deliberate locks, backend contracts, and full test evidence.
- [ ] Wait for required checks, address review feedback, and merge.
- [ ] Wait for successful GitHub Pages deployment of the merge commit.
- [ ] Run the deployed dealer golden path through the `/brp-demo/` base path on desktop and 390px mobile.
- [ ] Recompare authenticated source and deployed Pages, record matched workflows, deliberate locks, and remaining `brp-dev1` work.
- [ ] Provide PR, merge commit, deployment, Pages, and audit links only after the deployed checks pass.
