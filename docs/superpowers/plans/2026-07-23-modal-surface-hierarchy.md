# Modal Surface Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every dealer/admin dialog in Astryx and shadcn a clear, responsive, theme-safe hierarchy of semantic tile surfaces, then ship and verify it on GitHub Pages.

**Architecture:** Preserve existing dialog behavior owners and introduce a small presentation contract rather than a new modal framework. Shared current/shadcn frames receive semantic classes and reusable dialog section styles; Astryx route views compose the same hierarchy using Astryx primitives plus stable route-level surface classes.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript strict, Tailwind CSS v4, CSS Modules, Astryx Design System, Base UI, Playwright, Node test runner.

## Global Constraints

- Read relevant Next.js 16 documentation in `node_modules/next/dist/docs/` before production edits.
- Preserve TypeScript strict and do not use `any`.
- Do not change confirmed admin or dealer business rules.
- Do not claim backend success without a confirmed backend response.
- Do not add demo, mock, clone, or local-version wording.
- Use mobile-first layout and theme tokens.
- Preserve Escape, outside click, focus trap, focus return, and dialog labels.
- No GitHub push before local gates pass.

---

### Task 1: Inventory and shared dialog surface contract

**Files:**
- Create: `tests/modal-surface-contract.test.ts`
- Create: `src/components/shared/dialog-surfaces.tsx`
- Modify: `src/components/shared/ui.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `DialogSection({title, description, action, tone, inset, children, className})`
- Produces stable classes: `modal-surface-frame`, `modal-surface-header`, `modal-surface-body`, `modal-surface-footer`, `dialog-section`, `dialog-section-row`.

- [ ] **Step 1: Write the failing contract test**

Assert that shared modal frame/body/footer classes exist, `DialogSection` exposes a labelled section, and every direct shared `Modal` consumer is included in a checked inventory.

- [ ] **Step 2: Run the contract test and observe the missing-contract failure**

Run: `node --import tsx --test tests/modal-surface-contract.test.ts`

Expected: FAIL because `dialog-surfaces.tsx` and semantic classes do not exist.

- [ ] **Step 3: Implement the shared presentation contract**

Create the typed `DialogSection` component, add semantic classes to `Modal`,
and define token-based default/inset/muted/info/warning/danger surfaces and
responsive row/footer behavior in `globals.css`.

- [ ] **Step 4: Run focused verification**

Run:

```bash
node --import tsx --test tests/modal-surface-contract.test.ts
npx eslint src/components/shared/dialog-surfaces.tsx src/components/shared/ui.tsx tests/modal-surface-contract.test.ts
npm run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/dialog-surfaces.tsx src/components/shared/ui.tsx src/app/globals.css tests/modal-surface-contract.test.ts
git commit -m "feat(ui): add semantic dialog surfaces"
```

### Task 2: Align the current-renderer adapter

**Files:**
- Modify: `src/components/brp-ui/current-adapter.tsx`
- Test: `tests/modal-surface-contract.test.ts`
- Test: `tests/e2e/appearance-shell-overlays.spec.ts`

**Interfaces:**
- Consumes shared semantic frame class names from Task 1.
- Preserves `BrpDialogProps` and `BrpAlertDialogProps`.

- [ ] **Step 1: Extend the failing contract**

Require `CurrentDialog` and `CurrentAlertDialog` to expose the semantic
frame/header/body/footer classes and a 44 px mobile close target.

- [ ] **Step 2: Run and observe failure**

Run: `node --import tsx --test tests/modal-surface-contract.test.ts`

Expected: FAIL on missing adapter classes.

- [ ] **Step 3: Apply the shared geometry**

Add the shared semantic classes without changing Base UI dismissal, focus, or
required-dialog behavior.

- [ ] **Step 4: Verify adapter overlays**

Run:

```bash
npx eslint src/components/brp-ui/current-adapter.tsx
npm run typecheck
npx playwright test tests/e2e/appearance-shell-overlays.spec.ts --project=chromium --workers=1
```

Expected: overlay tests pass with no focus regressions.

- [ ] **Step 5: Commit**

```bash
git add src/components/brp-ui/current-adapter.tsx tests/modal-surface-contract.test.ts
git commit -m "fix(ui): align current dialog surfaces"
```

### Task 3: Fix the Ocean Freight BL reference dialog

**Files:**
- Modify: `src/components/admin/astryx-admin-ocean-freight-view.tsx`
- Modify: `src/components/admin/astryx-admin-ocean-unit.module.css`
- Modify: `tests/e2e/appearance-admin-ocean-unit.spec.ts`
- Test: `tests/modal-surface-contract.test.ts`

**Interfaces:**
- Uses stable attributes `data-dialog-section="containers|proformas|bill-info|documents|timeline"`.
- Retains `AdminOceanFreightModel.toggleDetailContainer` and `closePreview`.

- [ ] **Step 1: Write the failing Ocean Freight assertions**

Open BL `252108627`; assert five named section surfaces, three KPI cards,
contained disclosure rows, no horizontal overflow, and stacked mobile rail.

- [ ] **Step 2: Run Chromium at desktop and mobile and observe failure**

Run:

```bash
npx playwright test tests/e2e/appearance-admin-ocean-unit.spec.ts --project=chromium --workers=1 --grep "BL detail surfaces"
```

Expected: FAIL because the rail sections and main groups are unframed.

- [ ] **Step 3: Implement hierarchical section tiles**

Add explicit section classes/attributes, token-based backgrounds, borders,
radii, padding, nested disclosure styling, empty document/timeline treatment,
and one-column mobile reflow.

- [ ] **Step 4: Verify the reference dialog**

Run:

```bash
npx playwright test tests/e2e/appearance-admin-ocean-unit.spec.ts --project=chromium --workers=1
node --import tsx --test tests/modal-surface-contract.test.ts
npm run typecheck
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/astryx-admin-ocean-freight-view.tsx src/components/admin/astryx-admin-ocean-unit.module.css tests/e2e/appearance-admin-ocean-unit.spec.ts tests/modal-surface-contract.test.ts
git commit -m "fix(admin): separate ocean detail surfaces"
```

### Task 4: Convert remaining shared Modal consumers

**Files:**
- Modify: `src/components/dealer/dealer-customers.tsx`
- Modify: `src/components/dealer/features/schedule-page.tsx`
- Modify: `src/components/dealer/features/workshop-page.tsx`
- Modify: `src/components/dealer/features/accessories-page.tsx`
- Modify: `src/components/dealer/features/order-drafts-page.tsx`
- Modify: `src/components/catalog/cart-page.tsx`
- Modify: current admin `Modal` consumers reported by the inventory
- Test: `tests/modal-surface-contract.test.ts`

**Interfaces:**
- Consumes `DialogSection` and shared row classes.
- Does not change each route controller or mutation boundary.

- [ ] **Step 1: Add inventory failures for ungrouped multi-section dialogs**

Classify form, confirmation, detail, table, and workflow dialogs. Require
`DialogSection` for every dialog with two or more semantic groups.

- [ ] **Step 2: Run the contract and record the exact failing owners**

Run: `node --import tsx --test tests/modal-surface-contract.test.ts`

Expected: FAIL listing unconverted multi-section consumers.

- [ ] **Step 3: Convert one dialog category at a time**

Use form sections for customer/equipment forms, detail sections for cart and
order data, muted sections for supporting context, and semantic sections for
warnings. Keep simple destructive confirmations intentionally compact.

- [ ] **Step 4: Verify dealer/current route contracts**

Run:

```bash
npm run test:dealer-state
npx playwright test tests/e2e/dealer-workflow-isolation.spec.ts --project=chromium --workers=1
npx playwright test tests/e2e/appearance-shell-overlays.spec.ts --project=chromium --workers=1
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/dealer src/components/catalog src/components/admin tests/modal-surface-contract.test.ts
git commit -m "fix(ui): tile shared modal content"
```

### Task 5: Convert remaining Astryx and native admin dialogs

**Files:**
- Modify: Astryx dialog owners returned by `rg '<Dialog' src/components/admin`
- Modify: route CSS modules adjacent to those owners
- Modify: native dialog owners returned by `rg 'role="dialog"' src/components/admin`
- Test: `tests/modal-surface-contract.test.ts`
- Test: `tests/e2e/route-renderer-matrix.spec.ts`

**Interfaces:**
- Uses route-local stable section attributes where Astryx composition owns the
  primitive.
- Preserves existing model/controller interfaces.

- [ ] **Step 1: Extend inventory coverage to Astryx and native dialogs**

Require every multi-section owner to expose labelled section surfaces and every
simple confirmation to expose a single intentional content surface.

- [ ] **Step 2: Run and observe the remaining failures**

Run: `node --import tsx --test tests/modal-surface-contract.test.ts`

Expected: FAIL with the remaining Astryx/native owners.

- [ ] **Step 3: Apply the hierarchy without changing workflows**

Convert companies, users, air freight, returns, invoices, order detail,
supplier/ocean previews, and native admin dialogs. Use route tokens and shared
geometry; keep Astryx primitives in control of behavior.

- [ ] **Step 4: Verify renderer behavior**

Run:

```bash
npx playwright test -c playwright.appearance-matrix.config.ts --project=chromium-1280 --project=webkit-desktop --grep "overlay|dialog"
npm run typecheck
```

Expected: all selected matrix tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin tests/modal-surface-contract.test.ts tests/e2e/route-renderer-matrix.spec.ts
git commit -m "fix(admin): unify Astryx dialog hierarchy"
```

### Task 6: Cross-renderer modal matrix and release

**Files:**
- Create: `tests/e2e/modal-surface-matrix.spec.ts`
- Modify: `playwright.appearance-matrix.config.ts`
- Modify: `docs/research/STATE_MATRIX.md`
- Modify: `docs/research/DECISION_LEDGER.md`

**Interfaces:**
- Matrix samples dealer/admin, Astryx/shadcn, light/dark, desktop/mobile.
- Production smoke uses the same stable section attributes.

- [ ] **Step 1: Write the matrix and observe any remaining failures**

Check overflow, section visibility, header/footer collision, close target,
Escape, focus return, console errors, and theme contrast markers.

- [ ] **Step 2: Fix only defects demonstrated by the matrix**

Apply the smallest route or shared contract correction and rerun the failing
case before the complete matrix.

- [ ] **Step 3: Run full local gates**

Run:

```bash
npm run check
npm run test:appearance
npm run test:e2e
npm run test:e2e:appearance:matrix
npm run test:e2e:dealer-pages
npm run test:e2e:appearance:pages -- --project=chromium
git diff --check
```

Expected: all required suites exit 0; configured skips are documented.

- [ ] **Step 4: Publish and verify**

Create a PR, wait for green required CI, merge, wait for GitHub Pages, and run
production desktop/mobile smoke against the Ocean Freight reference plus
representative dealer/current and admin/Astryx dialogs.

- [ ] **Step 5: Record evidence**

Update state and decision ledgers with confirmed behavior, backend-dependent
boundaries, test commands, deployment run, and production smoke.

