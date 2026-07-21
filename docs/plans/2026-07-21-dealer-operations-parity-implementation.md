# Dealer Operations Parity — Implementation Plan

> **Execution mode:** Test-driven dealer-only implementation. Do not edit admin routes, admin components, or admin styles.

**Goal:** Normalize dealer operational search/filter UI, restore source-backed Units semantics, remove invented header/report controls, and preserve only evidenced workflows.

**Architecture:** Add a small dealer-owned client toolbar primitive and keep all page predicates in typed dealer data modules. Secondary pages continue to share their feature frame, while Units and Workshop retain dedicated modules. The shell removes unsupported controls instead of manufacturing backend behavior. All interactive components remain Client Components; component-specific styles remain CSS Modules, with global shell cleanup only where the existing header already uses global CSS.

**Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript strict, CSS Modules, Lucide icons, Node test runner through `tsx`, Playwright.

---

## Task 1: Establish the shared dealer toolbar contract

**Files:**

- Create: `src/components/dealer/dealer-data-toolbar.tsx`
- Create: `src/components/dealer/dealer-data-toolbar.module.css`
- Create: `tests/e2e/dealer-data-toolbar.spec.ts`

**Step 1: Write failing geometry and disclosure tests**

- At 1440px and 390px, mount/navigate to one representative dealer page.
- Assert search and the filter trigger share one row.
- Assert search expands to the trigger with no unrelated control between them.
- Assert trigger is 44px, icon-only visually, has an accessible name, `aria-expanded`, `aria-controls`, and active-count badge.
- Assert the panel opens by click and keyboard and Reset restores default filters.

**Step 2: Run the focused test and confirm RED**

Run: `npx playwright test tests/e2e/dealer-data-toolbar.spec.ts`

Expected: failure because the shared component/contract does not exist.

**Step 3: Implement the minimum reusable component**

- Keep `"use client"` at the component boundary.
- Render search, optional result meta, compact filter trigger, and controlled disclosure.
- Keep props typed and page predicates outside the component.
- Use a CSS Module; do not import admin styles.

**Step 4: Run focused tests and confirm GREEN**

Run: `npx playwright test tests/e2e/dealer-data-toolbar.spec.ts`

**Step 5: Commit**

`test/dealer toolbar contract` and implementation may be committed together once GREEN.

## Task 2: Correct secondary data semantics and report projection

**Files:**

- Modify: `src/lib/dealer/secondary-data.ts`
- Modify: `tests/dealer-secondary-data.test.ts`
- Modify as required: `src/lib/types.ts`

**Step 1: Write failing selector tests**

- Consignment available excludes reserved rows even when quantity is positive.
- Settlement periods use an injected reference date and keep deterministic July 2026 coverage.
- Inventory states distinguish in-stock, low, and out.
- Network dealer values and rows derive from the active tab; unit query never promises an absent SKU.
- Report filtering uses order code and date range.
- A manager filter can only compare a distinct manager ID; creator must not satisfy it accidentally.
- Report totals derive from the filtered rows.

**Step 2: Run unit tests and confirm RED**

Run: `npm run test:dealer-state -- --test-name-pattern="secondary"`

**Step 3: Implement typed predicates and report projection**

- Replace availability with explicit consignment status.
- Export page-specific option builders where UI needs them.
- Add a narrow dealer report query/projection; remove status as an unsupported report dimension.
- Keep reference date injectable.

**Step 4: Run unit tests and confirm GREEN**

Run: `npm run test:dealer-state`

## Task 3: Apply the shared toolbar to secondary data pages and Customers

**Files:**

- Modify: `src/components/dealer/features/secondary-data-pages.tsx`
- Modify: `src/components/dealer/features/secondary-data-pages.module.css`
- Modify: `src/components/dealer/dealer-customers.tsx`
- Modify: `src/components/dealer/dealer.module.css`
- Modify: `tests/e2e/dealer-secondary-pages.spec.ts`
- Modify: `tests/e2e/dealer-customers-equipment.spec.ts`
- Modify: `tests/e2e/dealer-data-toolbar.spec.ts`

**Step 1: Extend tests and confirm RED**

Cover Consignment, Settlements, Parts Inventory, Network, Customers, and Parts Report:

- full-width search plus compact filter trigger;
- active count and Reset;
- one visible result transition for every exposed filter;
- tabs remain separately visible and keyboard-selectable;
- removed refresh/export/status/manager-as-creator controls are absent;
- no horizontal overflow at 390px.

**Step 2: Implement page composition**

- Replace inline selects/segmented filters with `DealerDataToolbar` disclosures.
- Keep page tabs outside the filter panel.
- Give each page only filters backed by Task 2 selectors.
- Add Parts Report search and narrow date filter; omit unsupported manager control until distinct manager data exists.
- Remove disabled refresh/export actions from these dealer pages.

**Step 3: Run focused unit and browser tests**

Run:

- `npm run test:dealer-state`
- `npx playwright test tests/e2e/dealer-data-toolbar.spec.ts tests/e2e/dealer-secondary-pages.spec.ts tests/e2e/dealer-customers-equipment.spec.ts`

## Task 4: Restore the source-backed Units model and interface

**Files:**

- Modify: `src/lib/dealer/units-data.ts`
- Modify: `src/components/dealer/features/units-page.tsx`
- Modify: `src/components/dealer/features/operational-features.module.css`
- Modify: `tests/e2e/dealer-operational-data.spec.ts`
- Modify: `tests/e2e/dealer-operational-features.spec.ts`

**Step 1: Write failing source-semantic tests**

- Captured totals: 15 shipments, 13 units, KPI `0 / 13 / 0 / 13`.
- HAMU shipment displays `1/4` and the captured BL/ETA/route/status/action semantics.
- Expanded rows include number, model, SKU, year, VIN, status, and action.
- Search works for container, BL, model, SKU, and VIN.
- Disclosure works by click, Enter, and Space.
- No receive, status-change, sale, ship, or sync control exists.

**Step 2: Run focused tests and confirm RED**

Run: `npx playwright test tests/e2e/dealer-operational-data.spec.ts tests/e2e/dealer-operational-features.spec.ts --grep "unit"`

**Step 3: Rebuild the typed source projection**

- Separate shipment-level assigned/total/status/action fields from unit rows.
- Restore captured Incoming data without invented engine/route/readiness semantics.
- Preserve tab/read-only structure, but label uncaptured data conservatively.
- Apply `DealerDataToolbar` where a real filter is exposed.

**Step 4: Implement the desktop table and existing mobile card projection**

- Match source column hierarchy and expanded row structure.
- Keep status/action chips visually static and semantically non-interactive.
- Maintain current no-overflow mobile behavior.

**Step 5: Run focused tests and confirm GREEN**

Run: `npx playwright test tests/e2e/dealer-operational-data.spec.ts tests/e2e/dealer-operational-features.spec.ts`

## Task 5: Normalize Workshop without inventing transitions

**Files:**

- Modify: `src/components/dealer/features/workshop-page.tsx`
- Modify: `src/lib/dealer/workshop-data.ts`
- Modify: `src/components/dealer/features/operational-features.module.css`
- Modify: `tests/e2e/dealer-operational-data.spec.ts`
- Modify: `tests/e2e/dealer-operational-features.spec.ts`

**Step 1: Write failing behavior tests**

- Search filters description, customer, mechanic, and notes.
- Filter disclosure changes stage and work-type results and can Reset.
- Lock sentence/button is absent.
- Cards have `draggable === false`; no dropzone or transition control exists.
- Pointer drag attempt leaves DOM and local storage status unchanged.
- Valid create appears in New, updates dashboard data, persists, and survives reload.
- Blocked storage shows the retryable error and does not render success/card.

**Step 2: Run focused tests and confirm RED**

Run: `npx playwright test tests/e2e/dealer-operational-data.spec.ts tests/e2e/dealer-operational-features.spec.ts --grep "workshop"`

**Step 3: Implement selectors and UI**

- Add pure Workshop filter helpers.
- Add `DealerDataToolbar` with stage/work-type disclosure.
- Delete lock markup, capability constant, orphan styles, and copy-dependent assertions.
- Keep cards static articles.
- Preserve adapter error details when they are safe and retryable.

**Step 4: Run focused tests and confirm GREEN**

Run: `npx playwright test tests/e2e/dealer-operational-data.spec.ts tests/e2e/dealer-operational-features.spec.ts`

## Task 6: Remove invented dealer header controls

**Files:**

- Modify: `src/components/shell/app-shell.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/dealer-shell-contract.spec.ts`

**Step 1: Replace the old lock assertions with failing absence assertions**

- Assert client mode, language, notifications, their help buttons, and future-service notes are absent.
- Assert brand, global search, theme, profile/logout, cart, and navigation still work.
- Assert the header contains no user-visible mockup/local/clone wording.

**Step 2: Run focused shell tests and confirm RED**

Run: `npx playwright test tests/e2e/dealer-shell-contract.spec.ts`

**Step 3: Remove unsupported control families and orphan CSS**

- Do not replace them with decorative icons.
- Do not alter the admin header contract.

**Step 4: Run focused shell tests and confirm GREEN**

Run: `npx playwright test tests/e2e/dealer-shell-contract.spec.ts`

## Task 7: Update the parity ledger

**Files:**

- Modify: `docs/research/DEALER_PARITY_CERTIFICATION_2026-07-21.md`
- Modify: `docs/research/components/dealer-secondary-pages.spec.md`
- Modify: `docs/research/components/dealer-workflow-boundaries.spec.md`
- Modify: `docs/research/components/app-shell.spec.md`

**Step 1: Record the post-audit behavior**

- Mark stale pre-shipping findings as historical.
- Record real local filter behavior, source-backed Units bounds, static Workshop transition contract, narrow Parts Report projection, and removed header controls.
- Preserve fresh dealer-source evidence as pending where it is still pending.

**Step 2: Check links and terminology**

Run: `rg -n "enabled inert|wrong action|Зміна статусу недоступна|Режим клієнта" docs/research`

Expected: any remaining occurrences are clearly historical or intentional policy text.

## Task 8: Integration, visual QA, and regression gate

**Files:**

- Modify only when a regression requires a dealer-scoped fix.
- Create screenshots under a temporary test artifact directory; do not commit generated screenshots unless explicitly selected as new evidence.

**Step 1: Run the dealer test suites**

- `npm run test:dealer-state`
- `npm run test:e2e:dealer-pages`
- focused Playwright specs from Tasks 1–6.

**Step 2: Run repository checks**

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run build:pages`

**Step 3: Browser QA at 1440px and 390px**

Inspect:

- `/dealer/consignment`
- `/dealer/settlements`
- `/dealer/parts-inventory`
- `/dealer/units`
- `/dealer/network`
- `/dealer/customers`
- `/dealer/workshop`
- `/dealer/parts-report`

Verify search expansion, disclosure placement, active filters, tabs, source-backed Units table, static Workshop cards, report density, and shell controls.

**Step 4: Prove the admin boundary**

Run: `git diff --name-only origin/main...HEAD`

Expected: no paths under `src/app/admin`, `src/components/admin`, or admin-only test/spec files.

**Step 5: Review and commit logical groups**

Create focused commits for toolbar/data pages, Units/Workshop, shell cleanup, documentation, and any final regression fix. Re-run the primary signal after every consequential fix.

