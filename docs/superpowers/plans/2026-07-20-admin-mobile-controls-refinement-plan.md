# Admin Mobile Controls Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the remaining admin mobile toolbars, permission matrices, and operational headers compact and consistent without changing desktop behavior or adding unverified backend workflows.

**Architecture:** Extend the opt-in `AdminToolbar` disclosure contract with an icon-only mobile trigger and an explicit full-width segmented-control mode. Keep page-specific filter state in each page and reuse one collapsible mobile permission-row implementation for both role and dealer policy screens. Operational header changes remain page-local so read-only safety cannot leak into a generic action primitive.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript strict, Tailwind CSS v4, CSS modules, Base UI tooltip primitives, Playwright 1.61, Node 24 test runner.

## Global Constraints

- Mobile behavior applies below `768px`; existing desktop behavior remains unchanged at `768px` and above.
- All mobile interactive targets are at least 44×44px and retain accessible names.
- Only existing fixture fields may drive filters; no source data, API requests, or counts may be invented.
- Excel, BossWeb sync, warehouse receipt, scanning, and 1C operations remain read-only and cannot mutate fixtures or call external services.
- Write a failing behavior test and observe the expected failure before each production change.
- Run relevant Playwright tests at 390, 767, and 768px, then the full check/build/PWA suite before PR creation.

---

### Task 1: Shared icon-only toolbar and full-width segmented controls

**Files:**
- Modify: `src/components/admin/admin-toolbar-disclosure.ts`
- Modify: `src/components/admin/admin-ui.tsx`
- Modify: `src/components/admin/admin-ui.module.css`
- Modify: `tests/admin-toolbar-disclosure.test.ts`
- Create: `tests/e2e/admin-mobile-control-toolbars.spec.ts`

**Interfaces:**
- Consumes: existing `AdminToolbarMobileDisclosure` and `AdminSegmentedControl` APIs.
- Produces: `AdminToolbarMobileDisclosure.iconOnly?: boolean`, correct omitted/empty disclosure semantics, and `AdminSegmentedControl` mobile full-width opt-in.

- [ ] **Step 1: Lock the existing disclosure semantics with unit coverage**

Add assertions showing `undefined => []`, `{}` defaults to `filters`, and `{ sections: [] } => []` in `tests/admin-toolbar-disclosure.test.ts`.

- [ ] **Step 2: Run the Node contract test and confirm the prerequisite contract**

Run: `node --test --experimental-strip-types tests/admin-toolbar-disclosure.test.ts`
Expected: PASS. This contract was fixed by the preceding density work and is a prerequisite, not the new RED signal for this task.

- [ ] **Step 3: Add failing Playwright coverage for icon geometry and full-width controls**

Create `tests/e2e/admin-mobile-control-toolbars.spec.ts` with helpers that assert:

```ts
const trigger = page.getByRole("button", { name: "Відкрити фільтри" });
const searchBox = await page.getByRole("textbox").first().boundingBox();
const triggerBox = await trigger.boundingBox();
expect(triggerBox?.width).toBeGreaterThanOrEqual(44);
expect(triggerBox?.width).toBeLessThanOrEqual(48);
expect((searchBox?.x ?? 0) + (searchBox?.width ?? 0)).toBeLessThanOrEqual(triggerBox?.x ?? 0);
await expect(trigger).not.toContainText("Фільтри");
```

Also assert a full-width segmented control's first and last button span the containing toolbar width at 390 and 767, while the trigger is absent and desktop layout is unchanged at 768.

- [ ] **Step 4: Build the baseline and observe the Playwright test fail for the missing mobile contract**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts --grep "shared toolbar"`
Expected: FAIL because the trigger still contains text/chevron and segmented controls do not distribute evenly.

- [ ] **Step 5: Implement the minimal shared contract**

Implement the explicit disclosure semantics, expose an icon-only mobile accessible label, hide decorative trigger text/chevron below 768, and add a class/prop that distributes opted-in segmented buttons with `flex: 1 1 0`.

- [ ] **Step 6: Run unit and focused browser tests to green**

Run:

```bash
node --test --experimental-strip-types tests/admin-toolbar-disclosure.test.ts
npm run build
npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts --grep "shared toolbar"
```

Expected: PASS.

- [ ] **Step 7: Commit the shared primitive**

```bash
git add src/components/admin/admin-toolbar-disclosure.ts src/components/admin/admin-ui.tsx src/components/admin/admin-ui.module.css tests/admin-toolbar-disclosure.test.ts tests/e2e/admin-mobile-control-toolbars.spec.ts
git commit -m "fix(admin): compact mobile toolbar controls"
```

### Task 2: Page toolbar mappings and real filter state

**Files:**
- Modify: `src/components/admin/admin-order-pipeline.tsx`
- Modify: `src/components/admin/admin-consignment-page.tsx`
- Modify: `src/components/admin/admin-returns-page.tsx`
- Modify: `src/components/admin/admin-ocean-freight-page.tsx`
- Modify: `src/components/admin/admin-settlements-page.tsx`
- Modify: `src/components/admin/admin-invoices-page.tsx`
- Modify: `src/components/admin/admin-catalog-page.tsx`
- Modify: `src/components/admin/admin-companies-page.tsx`
- Modify: `tests/e2e/admin-mobile-control-toolbars.spec.ts`

**Interfaces:**
- Consumes: Task 1 icon disclosure and full-width segmented opt-ins.
- Produces: page-local controls backed by existing fixture fields and removes requested duplicate mobile metadata.

- [ ] **Step 1: Add failing page behavior tests**

Extend `admin-mobile-control-toolbars.spec.ts` to cover:

- pipeline filter icon beside search and full-width List/Kanban;
- consignment full-width section selector and dealer/status disclosure;
- returns status disclosure;
- ocean status/view/grouping disclosure and absent BL/container count copy on mobile;
- settlements list sorting/recent filter and absent `19 з 19 дилерів` on mobile;
- absent contracts/appendices `2 з 2` copy on mobile;
- catalog full-width All/ATV/SSV/PWC and advanced filters;
- companies complete/incomplete and manager-state filtering.

Tests must exercise control changes and assert the resulting collection/card identities or empty copy rather than merely checking markup.

- [ ] **Step 2: Run the page tests and observe missing behavior failures**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts --grep "page toolbars"`
Expected: FAIL for absent icon disclosures/full-width controls and unremoved mobile count copy.

- [ ] **Step 3: Wire pipeline, consignment, returns, and ocean controls**

Use the shared disclosure without moving primary section selectors inside it. Remove the pipeline notification-only toggle until evidenced data exists. Filter consignment representative stock by holder and keep request status filtering on Requests. Preserve ocean grouping/view state.

- [ ] **Step 4: Run the first page subset to green**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts --grep "pipeline|consignment|returns|ocean"`
Expected: PASS.

- [ ] **Step 5: Wire settlements, invoices, catalog, and companies**

Use only existing dealer movement dates/counts, invoice collections, catalog filters, company `profileStatus`, and `managerSummary`. Hide duplicate metadata with breakpoint-specific markup/classes rather than deleting useful desktop evidence.

- [ ] **Step 6: Run the second page subset and the whole new spec to green**

Run:

```bash
npm run build
npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts --grep "settlements|invoices|catalog|companies"
npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts
```

Expected: PASS with no document-level overflow.

- [ ] **Step 7: Commit the page mappings**

```bash
git add src/components/admin/admin-order-pipeline.tsx src/components/admin/admin-consignment-page.tsx src/components/admin/admin-returns-page.tsx src/components/admin/admin-ocean-freight-page.tsx src/components/admin/admin-settlements-page.tsx src/components/admin/admin-invoices-page.tsx src/components/admin/admin-catalog-page.tsx src/components/admin/admin-companies-page.tsx tests/e2e/admin-mobile-control-toolbars.spec.ts
git commit -m "fix(admin): align mobile page filters"
```

### Task 3: Compact shared mobile permission disclosures

**Files:**
- Modify: `src/components/admin/admin-permission-matrix.tsx`
- Modify: `src/components/admin/admin-permission-matrix.module.css`
- Modify: `src/components/admin/admin-permissions-page.tsx`
- Modify: `src/components/admin/admin-dealer-access-page.tsx`
- Create: `tests/e2e/admin-mobile-permissions-compact.spec.ts`

**Interfaces:**
- Consumes: Task 1 toolbar disclosure contract.
- Produces: shared collapsed mobile permission summaries with a two-column expanded action grid.

- [ ] **Step 1: Add failing compact-permissions tests**

At 390 and 767 assert that each permission object exposes one button with `aria-expanded="false"`, summary copy such as `3/4 увімкнено`, and no visible action rows until opened. Open a row and assert labelled action switches appear in a two-column region. At 768 assert the desktop table remains visible and mobile summaries are `display: none`.

- [ ] **Step 2: Run the test and observe the expected tall-card failure**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-permissions-compact.spec.ts`
Expected: FAIL because current mobile cards render every action row immediately.

- [ ] **Step 3: Implement shared collapsed permission rows**

Track expansion by row id inside `AdminPermissionMatrix`. Render a semantic summary button and controlled action-grid region. Keep switches, applicability, labels, icons, and read-only state unchanged. Do not persist presentation state.

- [ ] **Step 4: Add real page filters**

Role Permissions disclosure contains role selection, enabled/disabled state filter, and bulk actions. Dealer Access disclosure contains team access/profile state and company-policy enabled/disabled filtering; the company selector remains outside the toolbar.

- [ ] **Step 5: Run the permission tests to green**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-permissions-compact.spec.ts`
Expected: PASS at 390, 767, 768, and 1440 with keyboard-operable disclosures and no overflow.

- [ ] **Step 6: Commit permissions work**

```bash
git add src/components/admin/admin-permission-matrix.tsx src/components/admin/admin-permission-matrix.module.css src/components/admin/admin-permissions-page.tsx src/components/admin/admin-dealer-access-page.tsx tests/e2e/admin-mobile-permissions-compact.spec.ts
git commit -m "fix(admin): compact mobile permission policies"
```

### Task 4: Compact operational headers while preserving read-only safety

**Files:**
- Modify: `src/components/admin/admin-unit-shipping-page.tsx`
- Modify: `src/components/admin/admin-warehouse-page.tsx`
- Modify: `src/components/admin/admin-schedule-page.tsx`
- Modify: `tests/e2e/admin-mobile-operations.spec.ts`
- Modify: `tests/e2e/admin-mobile-schedule.spec.ts`

**Interfaces:**
- Consumes: existing local date state, locked-button semantics, and admin icon styles.
- Produces: compact geometry only; no new operational handler.

- [ ] **Step 1: Add failing geometry and safety tests**

At 390 and 767 assert BossWeb dates share one row, Warehouse receipt actions form three equal 44px columns, and Schedule actions form two equal columns. Assert each operational control remains disabled or `aria-disabled`, has an accessible name and explanation, and produces no request/state change. At 768 assert current desktop arrangement.

- [ ] **Step 2: Run the focused tests and observe geometry failures**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-operations.spec.ts tests/e2e/admin-mobile-schedule.spec.ts --grep "compact operational"`
Expected: FAIL because the current controls stack into separate rows and warehouse actions depend on labels/title.

- [ ] **Step 3: Implement Unit Shipping and Schedule layouts**

Use a two-column mobile date grid plus full-width sync button. Use a two-column mobile Schedule action grid. Keep all callbacks absent and locked copy intact.

- [ ] **Step 4: Implement Warehouse icon actions and explanations**

Render three equal icon controls with explicit accessible labels and a touch/keyboard-accessible read-only explanation. Keep the full textual buttons on desktop and ensure mobile and desktop controls are mutually hidden.

- [ ] **Step 5: Run operation and schedule tests to green**

Run: `npm run build && npx playwright test tests/e2e/admin-mobile-operations.spec.ts tests/e2e/admin-mobile-schedule.spec.ts`
Expected: PASS with zero page requests caused by locked controls.

- [ ] **Step 6: Commit operational header work**

```bash
git add src/components/admin/admin-unit-shipping-page.tsx src/components/admin/admin-warehouse-page.tsx src/components/admin/admin-schedule-page.tsx tests/e2e/admin-mobile-operations.spec.ts tests/e2e/admin-mobile-schedule.spec.ts
git commit -m "fix(admin): compact mobile operational headers"
```

### Task 5: Integration, review, and release validation

**Files:**
- Review: all files changed by Tasks 1–4
- Update only if required by verified findings: affected source/tests above

**Interfaces:**
- Consumes: completed task commits.
- Produces: one reviewed, verified feature branch ready for PR and merge.

- [ ] **Step 1: Reconcile task branches and inspect scope**

Cherry-pick task commits in dependency order: shared toolbar/pages, permissions, operations. Run `git diff origin/main...HEAD --stat` and `git diff --check`.

- [ ] **Step 2: Run affected behavior suites**

```bash
node --test --experimental-strip-types tests/admin-toolbar-disclosure.test.ts
npm run build
npx playwright test tests/e2e/admin-mobile-control-toolbars.spec.ts tests/e2e/admin-mobile-permissions-compact.spec.ts tests/e2e/admin-mobile-operations.spec.ts tests/e2e/admin-mobile-schedule.spec.ts
```

Expected: PASS with zero failures.

- [ ] **Step 3: Run full quality and PWA checks**

```bash
npm run check
npm run build:pages
```

Expected: lint, typecheck, production build, GitHub Pages build, service-worker generation, and PWA validation all PASS.

- [ ] **Step 4: Request independent code review**

Dispatch a read-only reviewer against `origin/main..HEAD` with this plan and design spec. Fix every Critical/Important finding with a new failing regression test first, then rerun the affected suite.

- [ ] **Step 5: Push, open a ready PR, and merge after CI**

Stage only intended files, push `HEAD`, open a non-draft PR targeting `main`, watch required checks, merge with the repository-supported method, and verify the merge commit and GitHub Pages deployment status.
