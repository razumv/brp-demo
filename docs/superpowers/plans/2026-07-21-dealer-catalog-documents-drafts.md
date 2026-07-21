# Dealer Catalog, Documents, and Drafts Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore source-backed dealer parts/accessories browsing, the document badge, and a compact functional drafts toolbar, then ship the verified result to GitHub Pages.

**Architecture:** Pure typed dealer modules own catalog hierarchy and filter semantics. Existing client components render URL-backed cascades and disclosures, while the dealer shell consumes a semantic document badge. Each workflow is protected first by a failing data or Playwright test.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript strict, CSS Modules, Lucide React, Playwright.

## Global Constraints

- Dealer routes only; do not modify admin files or behavior.
- Do not add user-facing demo/test mode labels.
- Do not fake successful backend, Excel, export, or VIN operations.
- Keep compatibility with static export, GitHub Pages base paths, and the future `brp-dev1` backend boundary.
- Preserve existing working dealer workflows and local persistence.
- Verify desktop and 390 px mobile without document-level horizontal overflow.

---

### Task 1: Documents badge and compact drafts toolbar

**Files:**
- Modify: `src/lib/dealer/secondary-data.ts`
- Modify: `src/components/shell/app-shell.tsx`
- Modify: `src/components/dealer/features/order-drafts-page.tsx`
- Modify: `src/components/dealer/features/order-drafts-page.module.css`
- Test: `tests/e2e/dealer-order-drafts.spec.ts`
- Test: `tests/e2e/dealer-secondary-pages.spec.ts`

**Interfaces:**
- Produces: `dealerNewDocumentCount: number`
- Produces: draft filters `DraftContentFilter = "all" | "with-items" | "empty"` and `DraftBuyerFilter = "all" | "assigned" | "unassigned"`

- [ ] **Step 1: Write failing navigation and toolbar tests**

```ts
test("dealer navigation restores the source new-document badge", async ({ page }) => {
  await seedDealerSession(page);
  await page.goto("/dealer/documents");
  await expect(page.locator('.role-nav a[href$="/dealer/documents"] .nav-badge')).toHaveText("5");
});

test("draft filters are collapsed and compose with search", async ({ page }) => {
  await seedDealerSession(page);
  await page.goto("/dealer/order-drafts");
  const trigger = page.getByRole("button", { name: "Фільтри чернеток" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.getByLabel("Вміст чернетки").selectOption("with-items");
  await page.getByLabel("Покупець чернетки").selectOption("assigned");
  await expect(trigger).toContainText("2");
});
```

- [ ] **Step 2: Run the focused tests and confirm they fail for missing behavior**

Run: `npx playwright test tests/e2e/dealer-order-drafts.spec.ts tests/e2e/dealer-secondary-pages.spec.ts`

Expected: badge and filter-trigger assertions fail while existing search/open/delete and document filtering assertions still pass.

- [ ] **Step 3: Add the semantic count and draft filter logic**

```ts
export const dealerNewDocumentCount = 5;

type DraftContentFilter = "all" | "with-items" | "empty";
type DraftBuyerFilter = "all" | "assigned" | "unassigned";

const contentMatches = content === "all"
  || (content === "with-items" ? draft.lines.length > 0 : draft.lines.length === 0);
const buyerMatches = buyer === "all"
  || (buyer === "assigned" ? Boolean(draft.customerId) : !draft.customerId);
```

Render a search field followed by the filter trigger, disabled Excel control, and its existing info trigger. The disclosure uses `aria-controls`, is closed initially, and includes reset.

- [ ] **Step 4: Implement one-row responsive geometry**

```css
.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
}

@media (max-width: 767px) {
  .toolbar { grid-template-columns: minmax(0, 1fr) 44px auto; }
  .filterTrigger { width: 44px; min-height: 44px; }
}
```

Keep the Excel reason control reachable and do not hide its explanation.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npx playwright test tests/e2e/dealer-order-drafts.spec.ts tests/e2e/dealer-secondary-pages.spec.ts && npm run typecheck`

Expected: all focused tests and typecheck pass.

- [ ] **Step 6: Commit the documents and drafts workflow**

Run: `git add src/lib/dealer/secondary-data.ts src/components/shell/app-shell.tsx src/components/dealer/features/order-drafts-page.tsx src/components/dealer/features/order-drafts-page.module.css tests/e2e/dealer-order-drafts.spec.ts tests/e2e/dealer-secondary-pages.spec.ts && git commit -m "fix(dealer): restore document and draft controls"`

### Task 2: Typed accessories vehicle and product facets

**Files:**
- Modify: `src/lib/dealer/accessories-data.ts`
- Test: `tests/e2e/dealer-accessory-data.spec.ts`

**Interfaces:**
- Produces: independent `AccessoryCategory`, `AccessoryModel`, `AccessoryTrim`, and `AccessoryEngine` fields
- Produces: `accessoryVehicleOptions(products, filters)` for dependent selector options
- Produces: extended `AccessoryFilters` consumed by `AccessoriesPage`

- [ ] **Step 1: Write failing pure-data tests**

```ts
expect(filterAccessories(ACCESSORY_PRODUCTS, {
  ...defaults,
  family: "Can-Am Off-Road",
  category: "Lighting",
}).every((item) => item.family === "Can-Am Off-Road" && item.category === "Lighting")).toBe(true);

expect(filterAccessories(ACCESSORY_PRODUCTS, {
  ...defaults,
  year: "2026",
  model: "Outlander",
  trim: "MAX XT",
  engine: "Rotax 1000R",
}).map((item) => item.sku)).toContain("929085");
```

Also assert category selection does not change `family`, and dependent option lists exclude invalid model/trim/engine values.

- [ ] **Step 2: Run the data test and confirm the new properties are missing**

Run: `npx playwright test tests/e2e/dealer-accessory-data.spec.ts`

Expected: TypeScript/test compilation fails for the new filter fields.

- [ ] **Step 3: Extend the typed products and pure filtering contract**

```ts
export type AccessoryVehicleFitment = Readonly<{
  year: string;
  model: AccessoryModel;
  trim: AccessoryTrim;
  engine: AccessoryEngine;
}>;

export type AccessoryProduct = Readonly<{
  // existing fields remain
  category: AccessoryCategory;
  fitments: readonly AccessoryVehicleFitment[];
}>;
```

Use AND across family/category/year/model/trim/engine/stock/query groups and OR inside checkbox arrays. Derive selector options from products matching the selected ancestors.

- [ ] **Step 4: Run the data tests**

Run: `npx playwright test tests/e2e/dealer-accessory-data.spec.ts`

Expected: all accessory data tests pass.

- [ ] **Step 5: Commit the accessory data contract**

Run: `git add src/lib/dealer/accessories-data.ts tests/e2e/dealer-accessory-data.spec.ts && git commit -m "fix(dealer): restore accessory filter data"`

### Task 3: Accessories source-style filter interface

**Files:**
- Modify: `src/components/dealer/features/accessories-page.tsx`
- Modify: `src/components/dealer/features/accessories-page.module.css`
- Test: `tests/e2e/dealer-accessories-search.spec.ts`

**Interfaces:**
- Consumes: extended `AccessoryFilters` and `accessoryVehicleOptions` from Task 2
- Produces: source-style vehicle cascade while preserving family cards

- [ ] **Step 1: Write failing browser tests for source hierarchy and mobile disclosure**

```ts
await expect(page.getByRole("button", { name: "Can-Am Off-Road" })).toBeVisible();
await expect(page.getByRole("tab", { name: "За моделлю" })).toHaveAttribute("aria-selected", "true");
await expect(page.getByRole("tab", { name: "За VIN" })).toBeDisabled();
await page.getByLabel("Рік техніки").selectOption("2026");
await page.getByLabel("Модель техніки").selectOption("Outlander");
await page.getByLabel("Категорія товару").selectOption("Lighting");
await expect(page.getByRole("button", { name: /Advex Helmet LED Utility Light/ })).toBeVisible();
```

At 390 px, assert the single `Фільтри аксесуарів` trigger is initially collapsed, all selectors become visible after click, and `scrollWidth - clientWidth <= 1`.

- [ ] **Step 2: Run the browser test and confirm the missing controls fail**

Run: `npx playwright test tests/e2e/dealer-accessories-search.spec.ts`

Expected: new vehicle/category controls are not found.

- [ ] **Step 3: Render the independent filter layers**

Keep `familyGrid` unchanged. Add `vehicleSelector` beneath it, use disabled VIN mode with explanatory text, rename the left select to `Категорія товару`, and bind it to `category` instead of `family`. Reset incompatible descendants when a vehicle parent changes.

- [ ] **Step 4: Unify mobile controls behind one icon trigger**

```tsx
<button
  type="button"
  className={styles.mobileFilterTrigger}
  aria-label="Фільтри аксесуарів"
  aria-expanded={filtersExpanded}
  aria-controls={filterPanelId}
  onClick={() => setFiltersExpanded((value) => !value)}
>
  <SlidersHorizontal size={18} />
</button>
```

Desktop keeps the vehicle selector and left rail visible. Mobile moves both into one disclosure while the search takes remaining width.

- [ ] **Step 5: Run accessory browser/data tests and typecheck**

Run: `npx playwright test tests/e2e/dealer-accessory-data.spec.ts tests/e2e/dealer-accessories-search.spec.ts && npm run typecheck`

Expected: all pass.

- [ ] **Step 6: Commit the accessory filter interface**

Run: `git add src/components/dealer/features/accessories-page.tsx src/components/dealer/features/accessories-page.module.css tests/e2e/dealer-accessories-search.spec.ts && git commit -m "fix(dealer): restore accessory filter workflow"`

### Task 4: Typed five-level parts catalog cascade

**Files:**
- Create: `src/lib/dealer/catalog-data.ts`
- Modify: `src/components/catalog/catalog-router.tsx`
- Modify: `src/components/catalog/catalog.module.css`
- Test: `tests/e2e/dealer-catalog-order-flow.spec.ts`
- Modify: `docs/research/components/catalog-browser.spec.md`

**Interfaces:**
- Produces: typed nodes for category, year, series, model, and diagram
- Produces: URL/query-backed selection resolver used by `CatalogRouter`

- [ ] **Step 1: Write failing browser tests for the exact source branch**

```ts
await page.goto("/catalog/CAN_OFF_EN_US");
await page.getByRole("link", { name: "Can-Am SXS" }).click();
await page.getByRole("link", { name: "2021" }).click();
await page.getByRole("link", { name: /005 - SSV - North America - Maverick Trail Series/ }).click();
await page.getByRole("link", { name: /002 - Maverick Trail 1000 - BASE_DPS/ }).click();
await expect(page.getByRole("region", { name: "Навігація каталогу" }).locator("[data-catalog-column]")).toHaveCount(5);
await expect(page.getByText("01- Rotax - Crankcase", { exact: true })).toBeVisible();
```

Reload and assert all selected row states and the complete breadcrumb remain. Click a different series/model and assert downstream content changes.

- [ ] **Step 2: Run the catalog test and confirm the current three-column/empty-state failure**

Run: `npx playwright test tests/e2e/dealer-catalog-order-flow.spec.ts`

Expected: the SXS branch ends at the overview and the five-column assertion fails.

- [ ] **Step 3: Add the typed source-backed hierarchy**

```ts
export type CatalogNode<TKind extends string> = Readonly<{
  id: string;
  kind: TKind;
  label: string;
  href?: string;
  children?: readonly CatalogNode<string>[];
}>;

export const dealerCatalogCascade = [
  {
    id: "sxs",
    kind: "category",
    label: "Can-Am SXS",
    children: [
      {
        id: "2021",
        kind: "year",
        label: "2021",
        children: [
          {
            id: "005",
            kind: "series",
            label: "005 - SSV - North America - Maverick Trail Series",
            children: [
              {
                id: "002",
                kind: "model",
                label: "002 - Maverick Trail 1000 - BASE_DPS - North America, 2021",
                children: [
                  { id: "model-numbers", kind: "diagram", label: "00- Model Numbers" },
                  { id: "air-intake", kind: "diagram", label: "01- Rotax - Air Intake Manifold And Throttle Body" },
                  { id: "crankcase", kind: "diagram", label: "01- Rotax - Crankcase" },
                  { id: "front-drive", kind: "diagram", label: "04- Drive - Front Section - Common Parts" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
] as const;
```

The implementation must include the exact visible diagram labels from the source screenshot and preserve supported legacy ATV content.

- [ ] **Step 4: Replace deep standalone lists with one reusable cascade**

Render two through five columns in one `CatalogCascade`. Every row consumes resolved URL/query state; selected rows use `aria-current` or `data-selected`; unsupported rows are disabled/non-links. Breadcrumbs derive from the same resolved path.

- [ ] **Step 5: Make the cascade full-width and internally adaptive**

```css
.cascadeViewport {
  overflow-x: auto;
  max-width: 100%;
  overscroll-behavior-inline: contain;
}

.cascadeGrid {
  display: grid;
  grid-template-columns: repeat(var(--catalog-columns), minmax(210px, 1fr));
  min-width: max-content;
}
```

At mobile width, avoid document overflow and keep current/next content usable.

- [ ] **Step 6: Update the catalog research contract and run tests**

Run: `npx playwright test tests/e2e/dealer-catalog-order-flow.spec.ts && npm run typecheck`

Expected: exact source path, URL persistence, distinct downstream selections, and mobile overflow checks pass.

- [ ] **Step 7: Commit the parts catalog cascade**

Run: `git add src/lib/dealer/catalog-data.ts src/components/catalog/catalog-router.tsx src/components/catalog/catalog.module.css tests/e2e/dealer-catalog-order-flow.spec.ts docs/research/components/catalog-browser.spec.md && git commit -m "fix(dealer): restore five-level parts catalog"`

### Task 5: Integrated review, verification, and Pages delivery

**Files:**
- Modify only files required by review findings within the dealer-only scope

**Interfaces:**
- Consumes: completed Tasks 1–4
- Produces: merge-ready branch and verified GitHub Pages deployment

- [ ] **Step 1: Run focused and full dealer verification**

Run:

```bash
npm run test:dealer-state
npx playwright test tests/e2e/dealer-accessory-data.spec.ts tests/e2e/dealer-accessories-search.spec.ts tests/e2e/dealer-catalog-order-flow.spec.ts tests/e2e/dealer-order-drafts.spec.ts tests/e2e/dealer-secondary-pages.spec.ts
npm run lint
npm run typecheck
npm run build
```

Expected: every command exits 0.

- [ ] **Step 2: Perform desktop and 390 px browser QA**

Verify `/catalog/CAN_OFF_EN_US`, `/dealer/accessories`, `/dealer/documents`, and `/dealer/order-drafts`. Confirm source hierarchy, keyboard labels, collapsed filter defaults, disabled-operation explanations, no mode wording, and no document-level overflow.

- [ ] **Step 3: Run whole-branch review and resolve all critical/important findings**

Generate a review package from the branch merge base to HEAD, run the required final reviewer, fix findings with covering tests, and re-review until both spec compliance and code quality are approved.

- [ ] **Step 4: Commit, push, create and merge the pull request**

Use a feature-focused commit history and a PR description that lists dealer-only scope, source parity restored, tests run, and known backend boundaries.

- [ ] **Step 5: Wait for GitHub Pages and verify published behavior**

Wait for the Pages workflow attached to the merge commit. Open the published routes under `https://razumv.github.io/brp-demo/`, verify desktop and mobile behavior, and report the deployed commit and URL.
