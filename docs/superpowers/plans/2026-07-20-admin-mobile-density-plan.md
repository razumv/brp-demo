# Admin Mobile Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved admin routes feel native and information-dense on phones while preserving their existing desktop behavior and all business logic.

**Architecture:** Add opt-in responsive behavior to the shared admin primitives, then adapt route-local KPI groups, filters, cards, and wide content without duplicating stateful controls. Use one Chromium Playwright suite as the executable browser contract for the exact 767/768 breakpoint, localStorage persistence, touch targets, action parity, and document overflow.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, CSS Modules/Tailwind v4, Base UI, Playwright Chromium.

## Global Constraints

- Mobile behavior applies below `768px`; desktop/tablet behavior at `768px` and wider must remain unchanged.
- Do not change business logic, permissions, data, disabled/read-only behavior, or available actions.
- Hide approved mobile-only KPI/status sections with `display: none`, including from the accessibility tree and tab order.
- Keep one DOM instance of each stateful filter/control; responsive behavior may reposition or disclose it, but must not duplicate it.
- Mobile primary search uses all available row width; configured secondary controls live in a compact disclosure and keep their labels.
- Interactive phone targets are at least `44px` high and retain visible focus.
- Intentional table/rail scrolling must stay inside a labelled, keyboard-focusable region; the document itself must not overflow horizontally.
- Catalog and Users mobile cards consume the same already-filtered arrays and callbacks as the desktop representations.
- Settlements diagnostic state persists only for its mobile disclosure; desktop always renders the diagnostic open and never overwrites the mobile preference.
- Existing Schedule chronology persistence and delivery filtering remain intact.
- Run each browser contract at `390`, `767`, `768`, and `1440` pixel widths.

---

## File Map

- `playwright.config.ts` — Chromium-only E2E configuration and production web server.
- `tests/e2e/support/admin-session.ts` — reusable admin login helper and viewport utilities.
- `tests/e2e/admin-mobile-contract.spec.ts` — responsive visibility, filtering, persistence, touch-target, and overflow contract.
- `src/components/admin/admin-ui.tsx` — opt-in KPI hiding, slot-based toolbar disclosure, and 768px mobile tab control.
- `src/components/admin/admin-ui.module.css` — shared responsive layout and 44px control rules.
- `src/hooks/use-media-query.ts` — dependency-free `matchMedia` subscription for responsive interactive state.
- `src/components/shared/persisted-collapsible-section.tsx` — `collapseMode="mobile"` behavior.
- `src/components/shared/persisted-collapsible-section.module.css` — desktop-static/mobile-disclosure visual rules.
- Route files under `src/components/admin/` — page-local KPI suppression, toolbar configuration, cards, and responsive layout.
- `.github/workflows/ci.yml` — install Chromium and run the browser contract after the production build.

---

### Task 1: Establish the failing browser contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/support/admin-session.ts`
- Create: `tests/e2e/admin-mobile-contract.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `loginAsAdmin(page: Page): Promise<void>` and `openAdminRoute(page: Page, path: string, width: AdminViewportWidth): Promise<void>`.
- Produces: `npm run test:e2e` and `npm run test:e2e:mobile`.

- [ ] **Step 1: Install the single browser-test dependency**

Run:

```bash
npm install --save-dev @playwright/test@^1.51.1
npx playwright install chromium
```

Expected: `package.json` contains `@playwright/test`, and `package-lock.json` resolves it without adding a DOM unit-test stack.

- [ ] **Step 2: Add test scripts and production-server configuration**

Add these scripts to `package.json`:

```json
"test:e2e": "playwright test",
"test:e2e:mobile": "playwright test tests/e2e/admin-mobile-contract.spec.ts"
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Add the reusable authenticated route helper**

Create `tests/e2e/support/admin-session.ts`:

```ts
import { expect, type Page } from "@playwright/test";

export type AdminViewportWidth = 390 | 767 | 768 | 1440;

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill("admin@local.test");
  await page.getByLabel("Пароль").fill("demo");
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

export async function openAdminRoute(page: Page, path: string, width: AdminViewportWidth) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.goto(path);
  await expect(page.locator("h1")).toBeVisible();
}
```

- [ ] **Step 4: Write the first failing responsive tests**

Create `tests/e2e/admin-mobile-contract.spec.ts` with these concrete first contracts:

```ts
import { expect, test } from "@playwright/test";
import { loginAsAdmin, openAdminRoute, type AdminViewportWidth } from "./support/admin-session";

const widths: AdminViewportWidth[] = [390, 767, 768, 1440];

test.beforeEach(async ({ page }) => loginAsAdmin(page));

test("catalog swaps its desktop table for mobile cards at the exact breakpoint", async ({ page }) => {
  await openAdminRoute(page, "/admin/catalog", 767);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toBeHidden();
  await page.getByRole("textbox", { name: "Пошук за SKU або назвою" }).fill("4RTB");
  await expect(page.getByRole("list", { name: "Товари каталогу" }).getByText("4RTB", { exact: true })).toBeVisible();

  await openAdminRoute(page, "/admin/catalog", 768);
  await expect(page.getByRole("list", { name: "Товари каталогу" })).toBeHidden();
  await expect(page.getByRole("region", { name: "Таблиця товарів каталогу" })).toBeVisible();
});

test("settlements diagnostic is mobile-persisted and desktop-static", async ({ page }) => {
  await openAdminRoute(page, "/admin/settlements", 390);
  const trigger = page.getByRole("button", { name: "Оновлюється" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toHaveAttribute("aria-expanded", "true");

  await openAdminRoute(page, "/admin/settlements", 768);
  await expect(page.getByText("Остання успішна синхронізація:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Оновлюється" })).toBeDisabled();
});

test("mobile toolbar discloses filters without resetting them", async ({ page }) => {
  await openAdminRoute(page, "/admin/unit-shipping", 390);
  await expect(page.getByRole("textbox", { name: "Пошук замовлення або моделі" })).toBeVisible();
  const filters = page.getByRole("button", { name: /^Фільтри/ });
  await expect(filters).toHaveAttribute("aria-expanded", "false");
  await filters.click();
  await page.getByLabel("Тип техніки").selectOption({ label: "Гідроцикли" });
  await expect(filters).toContainText("1");
  await filters.click();
  await expect(page.getByLabel("Тип техніки")).toHaveValue("pwc");
});

test("users expose mobile cards and preserve desktop grid", async ({ page }) => {
  await openAdminRoute(page, "/admin/users", 390);
  await expect(page.getByRole("list", { name: "Активні користувачі" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "Активні користувачі" })).toBeHidden();
  await page.getByRole("textbox", { name: "Пошук користувачів" }).fill("demo-account-03");
  const card = page.getByRole("listitem").filter({ hasText: "demo-account-03" });
  await expect(card).toContainText("Демо-користувач 03");
  await expect(card.getByRole("button", { name: /Редагувати/ })).toBeVisible();
});

test("target routes never create document-level horizontal overflow", async ({ page }) => {
  const routes = [
    "/admin/order-pipeline", "/admin/supplier-orders", "/admin/air-freight",
    "/admin/ocean-freight", "/admin/unit-shipping", "/admin/warehouse",
    "/admin/settlements", "/admin/invoices", "/admin/catalog", "/admin/schedule",
    "/admin/companies", "/admin/users", "/admin/permissions",
  ];
  for (const width of widths) {
    for (const route of routes) {
      await openAdminRoute(page, route, width);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(fits, `${route} must fit at ${width}px`).toBe(true);
    }
  }
});
```

- [ ] **Step 5: Run the suite and capture the RED state**

Run:

```bash
npm run build
npm run test:e2e:mobile
```

Expected: tests fail because mobile Catalog/User lists, toolbar disclosures, and responsive Settlements behavior do not exist yet.

- [ ] **Step 6: Add CI execution**

After the existing `Build` step in `.github/workflows/ci.yml`, add:

```yaml
      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: Test admin responsive contract
        run: npm run test:e2e
```

- [ ] **Step 7: Commit the executable failing contract**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e .github/workflows/ci.yml
git commit -m "test: define admin mobile browser contract"
```

---

### Task 2: Build the shared mobile primitives

**Files:**
- Modify: `src/components/admin/admin-ui.tsx`
- Modify: `src/components/admin/admin-ui.module.css`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Produces: `AdminKpiGrid({ hideOnMobile?: boolean })`.
- Produces: `AdminToolbar({ mobileDisclosure?: { sections?: readonly ("filters" | "view" | "actions")[]; activeCount?: number; label?: string } })`.
- Existing `AdminTabs({ mobileSelectLabel })` switches at `<768px` and keeps one active control surface.

- [ ] **Step 1: Extend the failing tests for shared visibility and touch targets**

Add assertions that Pipeline’s status summary is absent at `767px` and present at `768px`, that a configured `Фільтри` trigger is absent at `768px`, and that mobile tab selects/segmented controls have bounding-box height `>= 44`.

```ts
for (const width of [390, 767] as const) {
  await openAdminRoute(page, "/admin/order-pipeline", width);
  await expect(page.getByRole("region", { name: "Зведення статусів" })).toBeHidden();
  const filters = page.getByRole("button", { name: /^Фільтри/ });
  expect((await filters.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
}
await openAdminRoute(page, "/admin/order-pipeline", 768);
await expect(page.getByRole("region", { name: "Зведення статусів" })).toBeVisible();
await expect(page.getByRole("button", { name: /^Фільтри/ })).toBeHidden();
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
npm run test:e2e:mobile -- --grep "shared|Pipeline|touch"
```

Expected: missing disclosure and incorrect breakpoint/touch sizes.

- [ ] **Step 3: Implement slot-based disclosure without duplicated controls**

In `admin-ui.tsx`, add `Filter`, `ChevronDown`, `useId`, and `useState`, define:

```ts
type AdminToolbarSection = "filters" | "view" | "actions";

export type AdminToolbarMobileDisclosure = {
  readonly sections?: readonly AdminToolbarSection[];
  readonly activeCount?: number;
  readonly label?: string;
};
```

Render one trigger and keep each configured existing wrapper as the sole DOM instance:

```tsx
const [mobileOpen, setMobileOpen] = useState(false);
const disclosureId = `admin-toolbar-${useId().replaceAll(":", "")}`;
const disclosed = new Set(mobileDisclosure?.sections ?? ["filters"]);

{mobileDisclosure ? (
  <button
    type="button"
    className={styles.mobileDisclosureTrigger}
    aria-expanded={mobileOpen}
    aria-controls={disclosureId}
    onClick={() => setMobileOpen((current) => !current)}
  >
    <Filter size={16} aria-hidden="true" />
    <span>{mobileDisclosure.label ?? "Фільтри"}</span>
    {mobileDisclosure.activeCount ? <span className={styles.mobileDisclosureCount}>{mobileDisclosure.activeCount}</span> : null}
    <ChevronDown size={14} aria-hidden="true" />
  </button>
) : null}
```

Each wrapper receives `data-mobile-disclosed`, `data-mobile-open`, and the common `id` only on the first disclosed wrapper; use a single `.mobileDisclosurePanel` wrapper around configured slots so `aria-controls` always targets exactly one container.

- [ ] **Step 4: Implement opt-in KPI hiding and the exact breakpoint**

Add `hideOnMobile?: boolean` to `AdminKpiGrid`, applying `styles.kpiGridHideOnMobile`. In the CSS module add:

```css
@media (max-width: 767px) {
  .kpiGridHideOnMobile { display: none; }
  .tabsWithMobileSelect .tabs { display: none; }
  .tabsWithMobileSelect .mobileTabSelect { display: grid; min-height: 44px; }
  .mobileDisclosureTrigger { display: inline-flex; min-height: 44px; }
  .mobileDisclosurePanel[data-mobile-open="false"] { display: none; }
}

@media (min-width: 768px) {
  .mobileDisclosureTrigger { display: none; }
  .mobileDisclosurePanel { display: contents; }
  .mobileTabSelect { display: none; }
}
```

Complete the surrounding flex/grid rules so the search is `flex: 1 1 18rem`, `min-width: 0`, and the trigger sits at the far right on mobile; disclosed controls wrap to full width below it.

- [ ] **Step 5: Run focused tests and static checks**

```bash
npm run typecheck
npm run lint
npm run test:e2e:mobile -- --grep "shared|Pipeline|touch"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/admin-ui.tsx src/components/admin/admin-ui.module.css tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: add shared admin mobile controls"
```

---

### Task 3: Add responsive persisted disclosures and Settlements

**Files:**
- Create: `src/hooks/use-media-query.ts`
- Modify: `src/components/shared/persisted-collapsible-section.tsx`
- Modify: `src/components/shared/persisted-collapsible-section.module.css`
- Modify: `src/components/admin/admin-settlements-page.tsx`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Produces: `useMediaQuery(query: string): boolean`.
- Produces: `PersistedCollapsibleSection({ collapseMode?: "always" | "mobile" })`; default remains `"always"`.

- [ ] **Step 1: Strengthen the failing persistence test**

Add checks that localStorage key `brp-clone-ui-v1:collapsible:admin.settlements.sync-diagnostic` stores `"1"`, a desktop resize never changes it, returning to mobile restores it, and reduced motion leaves the disclosure usable.

- [ ] **Step 2: Run the Settlements test and verify RED**

```bash
npm run test:e2e:mobile -- --grep "settlements diagnostic"
```

Expected: no disclosure trigger and no persisted state.

- [ ] **Step 3: Implement the media subscription**

Create `src/hooks/use-media-query.ts`:

```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  const subscribe = useCallback((listener: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 4: Add `collapseMode="mobile"`**

In `PersistedCollapsibleSection`, derive:

```ts
const isMobile = useMediaQuery("(max-width: 767px)");
const canCollapse = collapseMode === "always" || isMobile;
const effectiveOpen = canCollapse ? persistedOpen : true;
```

Pass `open={effectiveOpen}` and `disabled={disabled || !canCollapse}` to Base UI, and only call `setOpen(nextOpen)` when `canCollapse`. Add `data-collapse-mode` and `data-can-collapse` for styling; hide the desktop chevron and keep the trigger visually static while open.

- [ ] **Step 5: Convert `SyncDiagnostic`**

Use:

```tsx
<PersistedCollapsibleSection
  persistenceId="admin.settlements.sync-diagnostic"
  title="Оновлюється"
  defaultOpen={false}
  collapseMode="mobile"
  headingLevel="h2"
  summary="Стан синхронізації з 1С"
>
  <button
    type="button"
    className="button button-outline w-fit"
    disabled
    title="Синхронізація з 1С вимкнена у read-only демонстрації"
  >
    <LockKeyhole size={13} />
    <RefreshCw size={14} />
    Оновити з 1С (30 днів)
  </button>
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.74fr)]">
    <div className="grid content-start gap-2 text-[12px] text-[var(--muted-foreground)]">
      <p className="m-0">Остання успішна синхронізація: <strong className="text-[var(--foreground)]">{diagnostic.lastSuccessfulSync}</strong></p>
      <p className="m-0">Рухи синхронізовано: <strong className="text-[var(--foreground)]">{diagnostic.movementsSyncedAt}</strong></p>
      <p className="m-0">{diagnostic.daytimeSchedule} · {diagnostic.nighttimeSchedule}</p>
      <p className="m-0">{diagnostic.liveBalanceNote}</p>
    </div>
    <div className="grid content-start gap-2">
      <p className="m-0 w-fit rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px]">
        {diagnostic.synchronizedMovementCount} рухів / {diagnostic.mappingCount} маппінгів / {diagnostic.errorCount} помилок
      </p>
      <div className="flex min-w-0 items-start gap-2 rounded-md border border-[var(--red)] bg-[var(--red-soft)] px-3 py-2 text-[11px] text-[var(--red)]">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <p className="m-0 min-w-0"><span className="font-medium">Остання помилка: </span><code className="break-all font-mono">{diagnostic.lastError}</code></p>
      </div>
    </div>
  </div>
</PersistedCollapsibleSection>
```

Keep the current amber status treatment on the title. Pass `hideOnMobile` to the route’s main `AdminKpiGrid` and configure its search toolbar only if it has secondary controls.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run test:e2e:mobile -- --grep "settlements diagnostic"
git add src/hooks/use-media-query.ts src/components/shared src/components/admin/admin-settlements-page.tsx tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: persist mobile-only admin disclosures"
```

---

### Task 4: Adapt Operations and Logistics controls

**Files:**
- Modify: `src/components/admin/admin-order-pipeline.tsx`
- Modify: `src/components/admin/admin.module.css`
- Modify: `src/components/admin/admin-supplier-orders-page.tsx`
- Modify: `src/components/admin/admin-air-freight-page.tsx`
- Modify: `src/components/admin/admin-ocean-freight-page.tsx`
- Modify: `src/components/admin/admin-unit-shipping-page.tsx`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Consumes: `AdminToolbarMobileDisclosure`, `AdminKpiGrid.hideOnMobile`, and 768px `AdminTabs`.

- [ ] **Step 1: Add route-specific failing assertions**

At `390` and `767`, assert Pipeline summary, Supplier KPIs, Air workflow/KPIs, and Ocean KPIs are hidden. Assert Unit Shipping’s type/period/model/date/reset controls appear only after its disclosure opens. At `768`, assert each original desktop surface is visible.

- [ ] **Step 2: Verify RED**

```bash
npm run test:e2e:mobile -- --grep "operations|logistics"
```

- [ ] **Step 3: Configure each page with its existing state-derived count**

Use these exact disclosure sections:

```tsx
// Pipeline
mobileDisclosure={{ sections: ["filters"], activeCount: Number(period !== "all") + Number(alertsOnly) + Number(unreadOnly) }}

// Supplier orders
mobileDisclosure={{ sections: ["filters"], activeCount: Number(period !== "all") + Number(sort !== "status") }}

// Air shipments
mobileDisclosure={{ sections: ["filters"], activeCount: Number(status !== "all") }}

// Ocean
mobileDisclosure={{ sections: ["filters", "view", "actions"], activeCount: Number(status !== "all") }}

// Unit shipping
mobileDisclosure={{ sections: ["filters", "actions"], activeCount: [type, period, model].filter((value) => value !== "all").length + Number(Boolean(from)) + Number(Boolean(to)) }}
```

Use each page’s actual state identifiers when they differ, without changing their values or callbacks.

- [ ] **Step 4: Hide route-local KPI/status roots below 768px**

- Pipeline: add a CSS-module modifier to its `statusScroller` region.
- Supplier: add a mobile-hidden class to the local interactive KPI section.
- Air: hide `WorkflowStrip` and `OverviewKpis`; pass `hideOnMobile` to shipment metrics.
- Ocean: pass `hideOnMobile` only to the main `OceanKpis`, not modal detail KPIs.

- [ ] **Step 5: Replace Unit Shipping type chips with its existing native single-select on mobile**

Keep the desktop tabs at `>=768px`, label the mobile select `Тип техніки`, and keep values `all`, `snowmobile`, `pwc`, `roadster`, `atv`, and `ssv` mapped to the same existing state. Remove fixed mobile minimum widths; use the disclosed responsive grid with model spanning both columns.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run lint
npm run test:e2e:mobile -- --grep "operations|logistics"
git add src/components/admin/admin-order-pipeline.tsx src/components/admin/admin.module.css src/components/admin/admin-supplier-orders-page.tsx src/components/admin/admin-air-freight-page.tsx src/components/admin/admin-ocean-freight-page.tsx src/components/admin/admin-unit-shipping-page.tsx tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: compact mobile operations and logistics"
```

---

### Task 5: Adapt Warehouse and Invoices

**Files:**
- Modify: `src/components/admin/admin-warehouse-page.tsx`
- Modify: `src/components/admin/admin-invoices-page.tsx`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Consumes: shared responsive KPI, tabs, and toolbar contracts.

- [ ] **Step 1: Add failing tests**

Assert Warehouse process/supply selectors remain visible while every process KPI grid is absent below `768px`. Assert Invoice page, appendix, and cost KPIs are absent below `768px`, each document section remains selectable, and its search/action content remains visible.

- [ ] **Step 2: Verify RED**

```bash
npm run test:e2e:mobile -- --grep "warehouse|invoices"
```

- [ ] **Step 3: Apply mobile-only KPI suppression**

Add a `hideOnMobile` prop to Warehouse’s route-local `KpiGrid` and use it for all five process KPI placements. Pass `hideOnMobile` to Invoice `PageKpis`; add route-local CSS/module classes to `AppendixKpis` and `CostKpis` so they hide only below 768.

- [ ] **Step 4: Configure tab and filter controls**

Use `mobileSelectLabel` for Warehouse processes and Invoice sections. Apply `mobileDisclosure={{ sections: ["filters"] }}` to tab-specific toolbars that have secondary filters; keep primary create/upload actions visible.

- [ ] **Step 5: Verify and commit**

```bash
npm run typecheck
npm run test:e2e:mobile -- --grep "warehouse|invoices"
git add src/components/admin/admin-warehouse-page.tsx src/components/admin/admin-invoices-page.tsx tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: streamline warehouse and invoices on mobile"
```

---

### Task 6: Build Catalog mobile record cards

**Files:**
- Modify: `src/components/admin/admin-catalog-page.tsx`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Consumes the existing `visibleProducts`, distributor `visibleRows`, parts `visibleRows`, pagination state, and current callbacks.
- Produces: labelled lists `Товари каталогу`, `Ціни дистриб’ютора`, and `Каталог запчастин` below 768px.

- [ ] **Step 1: Expand the failing Catalog test across all three sections**

Assert page and vehicle KPI grids are hidden, known SKU searches return the same identity/count on mobile and desktop, vehicle cards expose the existing menu, and distributor/parts cards do not invent actions. Assert detailed filters remain one disclosure rather than being nested.

- [ ] **Step 2: Verify RED**

```bash
npm run test:e2e:mobile -- --grep "catalog"
```

- [ ] **Step 3: Extract a surface-safe vehicle action menu**

Import `type CatalogVehicleProduct` from `admin-catalog-data` and create this local component in the same file:

```tsx
function VehicleActions({ product, surface }: { product: CatalogVehicleProduct; surface: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = `catalog-product-actions-${surface}-${product.id}`;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative text-right">
      <button
        ref={triggerRef}
        type="button"
        className="icon-button icon-button-small"
        aria-label={`Меню продукту ${product.sku}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <EllipsisVertical size={16} />
      </button>
      {open ? (
        <div id={menuId} role="group" aria-label={`Дії продукту ${product.sku}`} className="absolute right-0 top-10 z-20 grid min-w-36 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 text-left shadow-[var(--shadow-menu)]">
          <button type="button" disabled className="button button-ghost justify-start text-[12px]" title="Редагування вимкнене у read-only клоні"><LockKeyhole size={13} /> Редагувати</button>
          <button type="button" disabled className="button button-ghost justify-start text-[12px] text-[var(--red)]" title="Видалення вимкнене у read-only клоні"><Trash2 size={13} /> Видалити</button>
        </div>
      ) : null}
    </div>
  );
}
```

Use unique `surface` IDs so the desktop table and mobile cards never share menu IDs or focus restoration. Do not lift or share transient open state between hidden surfaces.

- [ ] **Step 4: Render cards from the existing filtered arrays**

Render semantic `<ul aria-label="Товари каталогу">`, `<ul aria-label="Ціни дистриб’ютора">`, and `<ul aria-label="Каталог запчастин">`. Each `<li>` includes the same primary identity, category/status, prices/quantity, and metadata already shown in its desktop row. Hide lists at `min-width:768px`; hide the three primary desktop table shells at `max-width:767px` with `display:none`.

- [ ] **Step 5: Keep audit/import tables as bounded scroll regions**

Retain the import/debug history as labelled `role="region"`, `tabIndex={0}` horizontal scrollers. Remove any fixed width from the page container itself.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run lint
npm run test:e2e:mobile -- --grep "catalog"
git add src/components/admin/admin-catalog-page.tsx tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: add native mobile catalog cards"
```

---

### Task 7: Adapt Users, Companies, and Permissions

**Files:**
- Modify: `src/components/admin/admin-users-page.tsx`
- Modify: `src/components/admin/admin-companies-page.tsx`
- Modify: `src/components/admin/admin-companies.module.css`
- Modify: `src/components/admin/admin-permissions-page.tsx`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Users mobile cards consume the existing `visibleUsers` array and `onEdit` callback.
- Companies retain the existing `CompanyCards` actions.
- Permissions retains the existing mobile permission matrix.

- [ ] **Step 1: Add failing parity and density tests**

Assert User KPIs are hidden, cards show identity/contact/company/role/status/registration/result count, and edit/disabled actions match desktop. Assert each Company card action and employee trigger is at least `44px`, while cards use reduced padding/gaps. Assert Permissions search/role controls stay primary and bulk actions are available under a `Масові дії` disclosure.

- [ ] **Step 2: Verify RED**

```bash
npm run test:e2e:mobile -- --grep "users|companies|permissions"
```

- [ ] **Step 3: Add Users mobile cards from `visibleUsers`**

Render `<ul aria-label="Активні користувачі">` below 768, one `<li>` per user. Reuse the existing role/status badges, date formatter, edit callback, and disabled action controls. Keep `ActiveUsersGrid` as the only desktop surface and hide it below 768 with `display:none`.

- [ ] **Step 4: Tighten Companies cards without hiding data**

Reduce mobile card padding and vertical gaps, place metadata in a compact two-column grid, and preserve the four direct labelled actions. Extend existing action/employee-trigger `min-height:44px` rules through `767px`.

- [ ] **Step 5: Compact Permissions controls**

Keep search full width and role selector alongside it where space allows. Configure `mobileDisclosure={{ sections: ["actions"], label: "Масові дії" }}` so disabled bulk actions do not consume one full row each. Do not alter permission values, schemas, or disabled switches.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run test:e2e:mobile -- --grep "users|companies|permissions"
git add src/components/admin/admin-users-page.tsx src/components/admin/admin-companies-page.tsx src/components/admin/admin-companies.module.css src/components/admin/admin-permissions-page.tsx tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: adapt admin people pages for mobile"
```

---

### Task 8: Finish Schedule mobile layout

**Files:**
- Modify: `src/components/admin/admin-schedule-page.tsx`
- Modify: `src/components/admin/admin-schedule.module.css`
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Consumes existing persisted chronology, filtered delivery groups, selected slot, and pagination state.
- Keeps one `SlotRow` implementation with responsive CSS rather than duplicate desktop/mobile rows.

- [ ] **Step 1: Add failing Schedule tests**

Assert Schedule KPIs are hidden below 768; chronology stays visible and collapsible; changing its timeframe changes both the rail and delivery groups; slot rows fit without a fixed 510px page width; selecting a slot reveals details below the list; stock table is a labelled inner scroller.

- [ ] **Step 2: Verify RED**

```bash
npm run test:e2e:mobile -- --grep "schedule"
```

- [ ] **Step 3: Hide KPIs and compact the toolbar**

Pass `hideOnMobile` to `ScheduleKpis`. Keep category/search filtering in the existing toolbar, using `mobileDisclosure={{ sections: ["filters"], activeCount: Number(category !== "all") }}`. Keep the chronology outside this disclosure.

- [ ] **Step 4: Make `SlotRow` responsive in place**

Below 768, replace the fixed five-column/min-510 layout with a card-like grid: name/category across the first row, status and arrival on the second, availability aligned to the end. Preserve the existing button, selection state, accessible name, and callback.

- [ ] **Step 5: Bound intentional horizontal scrolling**

Keep the chronology rail and stock table horizontally scrollable inside their own labelled focusable regions; remove parent/page `min-width` leakage. Ensure list and detail stack naturally and the detail panel starts below the selected list on mobile.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck
npm run lint
npm run test:e2e:mobile -- --grep "schedule"
git add src/components/admin/admin-schedule-page.tsx src/components/admin/admin-schedule.module.css tests/e2e/admin-mobile-contract.spec.ts
git commit -m "feat: complete mobile delivery schedule"
```

---

### Task 9: Integration regression, desktop guard, and PWA build

**Files:**
- Modify only files required by failures found in this task.
- Test: `tests/e2e/admin-mobile-contract.spec.ts`

**Interfaces:**
- Consumes all previous tasks.

- [ ] **Step 1: Run the complete browser contract**

```bash
npm run build
npm run test:e2e
```

Expected: all responsive tests pass at 390, 767, 768, and 1440; inactive representations are `display:none`; every target route has no document overflow.

- [ ] **Step 2: Run keyboard, accessibility, and open-disclosure overflow checks**

For every target route, open each filter/collapsible surface, tab through all visible controls, and assert that hidden desktop/mobile surfaces are neither focusable nor exposed by role locators. Add a failing Playwright assertion before fixing any discovered issue.

- [ ] **Step 3: Compare desktop guard screenshots**

Capture 1440×1000 screenshots for all 13 routes and compare structure against the supplied desktop references. Only mobile-specific CSS may change below 768; correct any desktop regression with a failing assertion first.

- [ ] **Step 4: Run repository quality and export validation**

```bash
npm run lint
npm run typecheck
npm run build
npm run build:pages
```

Expected: all commands exit `0`; PWA generation and validation remain green.

- [ ] **Step 5: Commit integration fixes**

```bash
git add src tests/e2e package.json package-lock.json playwright.config.ts .github/workflows/ci.yml
git commit -m "fix: close admin mobile responsive regressions"
```

## Self-Review Result

- Spec coverage: all 13 routes, exact 767/768 boundary, KPI suppression, compact filters, Catalog/Users cards, Settlements persistence, Schedule, touch targets, action parity, desktop guard, and PWA validation are assigned to concrete tasks.
- Placeholder scan: no deferred implementation marker or undefined follow-up task remains; every code sample is executable once inserted at its named boundary.
- Type consistency: `hideOnMobile`, `mobileDisclosure`, `collapseMode`, `useMediaQuery`, viewport widths, list labels, and persistence IDs are identical across producer and consumer tasks.
- Merge order: Task 1 → Task 2 → Task 3, then Tasks 4–8 may proceed in exclusive page worktrees; Task 9 is root-owned integration.
