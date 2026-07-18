# Admin UI Foundation — reference lock and component contract

Status: approved for direct implementation on 2026-07-18. This specification standardizes visual composition only. Route data, interaction semantics, URL behavior and the strict read-only safety boundary remain owned by each route-specific specification.

## Design brief

Designing a consistent, data-dense administrative workspace for BRP operations staff on the web.

- Goal: make route changes feel like one product by standardizing page geometry, tabs, search, filters, KPI cards, table boundaries and icon actions without flattening route-specific behavior.
- Tone: precise, operational and calm; compact enough for large datasets, but never visually cramped.
- Main risk: a cosmetic abstraction that hides different route states, couples business logic, or creates one inflexible mega-component.
- Must remember: Warehouse is the user-selected visual benchmark; orange is navigation/action emphasis, not decoration.
- Constraints: preserve Inter, existing BRP/GitHub-like tokens, Ukrainian source copy, desktop/tablet/mobile, light/dark, local-only interactions and hard-disabled final operational actions.
- Research: styles + product screens + user/source screenshots. No new journey logic is introduced.
- Path: direct build against the locked existing product direction.

## Source truth and reference lock

### Build target

- Primary product reference: `docs/design-references/source-admin-warehouse-desktop.png` and the implemented Warehouse process navigation.
- Route truth: the ten route-specific specs for Settings, Permissions, Users, Dealer Access, Companies, Schedule, Catalog, Settlements, Ocean Freight and Warehouse.
- Current-problem evidence: the eleven user-provided CleanShot captures from 2026-07-18.
- Ocean placement evidence: `docs/design-references/user-source-ocean-bl-receipt-action.jpg`.

### Primary direction

Warehouse owns page density, selected-tab treatment, compact control height, horizontal overflow behavior and the relationship between page heading, process navigation, toolbar and bordered data panels.

Preserve:

1. `#f6f8fa` canvas with white bounded panels and `#d0d7de` hairline borders in light mode.
2. Inter with 30/36px desktop admin H1 and compact 10–13px operational labels.
3. 6–8px radii, restrained one-pixel elevation and no decorative gradients.
4. Selected tabs as orange text on `--orange-soft`, not disconnected underlines or inconsistent white/gray strips.
5. Controls aligned in deliberate rows, with search icons inside the input shell.

### Bounded secondary references

| Reference | Bounded role | Adapted decision |
|---|---|---|
| Refero Orderful style `9c657624-4aa8-4688-a6be-4eb3d6f2ce57` | surface hierarchy and accent discipline | neutral canvas -> white content surfaces -> orange only for primary/selected emphasis; 8px shapes and minimal elevation |
| Refero shadcn style `c14c0a94-1037-449e-bf5b-4cb972656ac7` | compact control composition | 8px control gaps, 16px panel padding, clear focus rings and contained segmented controls |
| Refero Rows style `984071b0-dd6d-4d43-a7b7-e71af93052df` | dense worksheet rhythm | compact filters/tags, thin dividers and direct interaction without decorative chrome |
| Refero Resend screen `1879b4bd-f716-4305-a694-be47edc013de` | data toolbar | search/filter/actions share one bounded row above a table; right actions do not detach from the working context |
| Refero Tango screen `737a1b76-03c7-48b9-92c8-d638660b12d3` | permission comparison | permission names remain left aligned; action states form scan-friendly, centered columns with subtle row separation |
| Refero Wrike screen `3003f1bf-b086-416f-994c-5260412f3377` | timeline readability | render only a meaningful event window, use consistent spacing and a distinct current-time marker |

Role rules:

- Orange remains active navigation / primary preview-entry emphasis. It is not used as a general panel fill.
- Green, amber, red, blue and purple remain semantic status colors only.
- White is a bounded content surface. The page canvas remains `--background`; arbitrary white islands are rejected.
- Lucide outline icons remain the only icon language. Icons inherit `currentColor`.
- Existing route-specific data, copy and status meanings are not changed by the shared visual system.

Reject:

- one giant `AdminPage` that owns route state or business data;
- CSS class inheritance or deep selector overrides between routes;
- tabs implemented with route-specific arbitrary borders/underlines when the shared pill strip is applicable;
- search icons positioned outside their input boundary;
- toolbars assembled from unbounded fragments with mixed white and gray backgrounds;
- full-width sparse panels on ultra-wide displays;
- duplicating a BL-level operational preview on every Ocean container row;
- hiding route-specific filters merely to make all pages look identical.

### Token commitments

The existing semantic tokens stay authoritative:

| Role | Light | Dark |
|---|---|---|
| canvas | `#f6f8fa` | `#0d1117` |
| surface | `#ffffff` | `#161b22` |
| subtle surface | `#f6f8fa` | `#21262d` |
| primary text | `#1f2328` | `#e6edf3` |
| muted text | `#656d76` | `#8b949e` |
| border | `#d0d7de` | `#30363d` |
| active/primary | `#ea580c` | existing orange token |
| active soft | `#fff1e8` | `#3b1d0c` |

Shared admin metrics:

- page: `width: 100%`, `max-width: 1360px`, centered, desktop padding 32px;
- vertical page stack: 20px; major section gap: 16px; control gap: 8px;
- tab strip: minimum 40px, 1px border, 8px outer radius, 4px padding;
- tab: minimum 32px, 6px radius, 8px 12px padding, 11–12px medium label;
- search/select/button: 40px default height; compact variant 36px where source requires it;
- table/panel shell: 1px border, 8px radius, clipped header/footer, horizontal overflow inside the boundary;
- icon action: 32px desktop hit target, 44px coarse-pointer/mobile hit target, 16px visible Lucide glyph;
- focus: `:focus-visible` 2px orange ring with 2px offset; compound inputs use `:focus-within`.

## Architecture

The foundation is a set of composable visual primitives. It never imports route fixtures, owns query state, changes URLs, performs requests or mutates operational data.

Target files:

- `src/components/admin/admin-ui.tsx` — typed React primitives;
- `src/components/admin/admin-ui.module.css` — scoped layout/variant rules;
- route-specific components continue to own all state and data.

### `AdminPage`

```ts
type AdminPageProps = {
  children: ReactNode;
  width?: "standard" | "wide";
  className?: string;
};
```

Renders the centered page shell and a predictable vertical stack. `standard` uses the Warehouse-derived maximum; `wide` exists only for evidence-backed extremely dense tables. It does not render headings or state.

### `AdminPageHeader`

```ts
type AdminPageHeaderProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};
```

Title/helper remain a single semantic header group. Metadata and actions occupy defined slots and stack below on narrow screens. It replaces per-route detached heading/action layouts.

### `AdminTabs`

```ts
type AdminTabItem<T extends string> = {
  id: T;
  label: ReactNode;
  mobileLabel?: string;
  count?: number | string;
  icon?: ReactNode;
  disabled?: boolean;
};

type AdminTabsProps<T extends string> = {
  items: readonly AdminTabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  mobileSelectLabel?: string;
  size?: "compact" | "default";
  className?: string;
};
```

Implements Warehouse-style selected pills, `role=tablist`, `role=tab`, `aria-selected`, keyboard-safe native buttons and horizontal overflow. A route may use its existing mobile select only when its source spec requires one. Each tab continues to own an independent route state and must be tested separately.

### `AdminToolbar`

```ts
type AdminToolbarProps = {
  search?: ReactNode;
  filters?: ReactNode;
  view?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  contained?: boolean;
  className?: string;
};
```

Desktop order is search -> filters -> flexible spacer -> view/actions. Narrow layouts wrap in semantic groups. The toolbar is one bounded surface when `contained=true`; route-specific filters remain intact.

### `AdminSearchField`

```ts
type AdminSearchFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder: string;
  clearLabel?: string;
  size?: "compact" | "default";
  maxWidth?: number | string;
  className?: string;
};
```

The icon and optional clear button live inside one input boundary. Search remains immediate unless a route spec explicitly preserves debounce. No Enter dependency is introduced.

### `AdminKpiGrid` and `AdminKpiCard`

```ts
type AdminKpi = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "orange" | "green" | "blue" | "amber" | "red";
};
```

The grid uses 4/2/1 responsive columns. Cards share minimum height, icon box, label typography and numeric alignment while preserving route-specific content.

### `AdminTableShell`

```ts
type AdminTableShellProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
  footer?: ReactNode;
  className?: string;
};
```

Creates a visible boundary, clips the header/footer and owns the horizontal scroll region. It does not render columns or rows and therefore cannot erase route-specific table behavior.

### `AdminIconAction`

```ts
type AdminIconActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "primary" | "danger";
  tooltip?: string;
};
```

Used for dense row actions. Every action has an accessible label and a portalled Base UI tooltip. Safe preview-entry actions may have handlers. Operational actions are real disabled buttons without handlers and retain a native title as a disabled-state fallback.

### `AdminModalSection` and form grids

Modal framing remains in the shared `Modal`, while sections use a consistent heading/divider/field grid. On desktop, related short fields may form two columns; mobile always uses one. Footer remains visible while the body scrolls. No modal primitive receives a submit callback.

## Route migration decisions

| Route | Shared foundation | Route-specific behavior that must remain |
|---|---|---|
| Settings | page/header/search, bounded panels, KPI grid | three independent searchable panel families; all operational controls disabled |
| Permissions | page/header, search, tabs, toolbar, table shell | Manager and Dealer have different schemas; every switch and bulk action disabled |
| Users | page/header, KPI, search, tabs, table shell, icon actions | three independent tab states and three edit-preview variants |
| Dealer Access | page/header, search, table shell, compact permission matrix | team and rights filter independently; selector changes only harmless local context; switches disabled |
| Companies | page/header, toolbar/search, table shell, icon actions, modal sections | employee popover, policy GET navigation and safe create/edit/assign previews; finals disabled |
| Schedule | page/header, KPI, tabs, toolbar/search/filter, table shell | slot/detail pagination, stock state and a data-bounded chronology window |
| Catalog | page/header, KPI, primary/nested tabs, toolbar/search/filter, table shell | all primary and category tabs, column filters, debug/history, pagination and row menu |
| Settlements | page/header, KPI, toolbar/search, bounded diagnostics, accordion shells | KPI recompute, exact source error, date presets and no invented live balances |
| Ocean Freight | page/header, KPI, tabs, toolbar/search/filter/view, table shell | BL grouping/cards, all three route tabs, all seven parts-receipt tabs, receipt preview only beside BL heading |
| Warehouse | adopt shared primitives without changing appearance | six independent process tabs and all existing process-specific local behavior |

## Required route fixes

1. Settings must use the standard centered width and three clearly bounded panels; database key/value rows cannot visually run into the viewport edge.
2. Permissions search belongs in the same working region as role tabs/quick controls. All surfaces use semantic tokens rather than arbitrary white/gray patches.
3. Users search aligns with the list controls; row action text is replaced with Lucide icon buttons with labels/tooltips.
4. Dealer Access renders the company policy as a compact matrix: one command per row, applicable action columns, `—` for N/A, disabled preserved-state switches. This changes presentation only, not the 47-right model.
5. Companies safe preview actions must open; policy remains a link. Delete/final save/create/assign stay disabled. The modal uses bounded sections and a stable responsive two-column grid.
6. Schedule primary tabs and filters use shared controls. The chronology derives its visible interval from actual events plus a small buffer, includes today only when relevant, and omits months with no data far outside that interval.
7. Catalog primary and nested category tabs use the same visual component while retaining separate tab datasets and filters.
8. Settlements search and KPI align to the standard working width; diagnostic and dealer rows have explicit panel boundaries.
9. Ocean creates one visible receipt-preview entry beside each eligible BL/коносамент heading. Container rows display status only.
10. Every migrated route is exercised tab-by-tab; visual standardization is not proof that states are equivalent.

## State and interaction requirements

- Search hit, miss and clear are tested independently per route and per selected tab where schemas differ.
- Every tab remains clickable and preserves its own data, empty copy, filters and controls.
- Filters, sorting, pagination, expansion, list/card toggles and modal previews stay functional locally.
- Safe previews close via Cancel, X, Escape and backdrop where currently supported.
- Final Confirm/Approve/Send/Save/Apply/Cancel order/Change status/Sync/Delete/post/receipt controls remain hard-disabled.
- Shared primitives contain no fetch, storage, reducer or operational callbacks.

## Responsive and dark behavior

- Desktop: 1360px maximum page shell; toolbars prefer one row but may wrap before controls collide.
- Tablet 768px: two-column KPI, bounded horizontally scrolling tab/table regions, header actions wrap beneath title as needed.
- Mobile 390px: one-column KPI, full-width search, horizontal tab scrolling or source-evidenced select, 44px touch actions, form grids collapse to one column.
- Tables retain the route-specific source behavior: some scroll horizontally, Companies/Dealer Access may transform to cards only where their source specs require it.
- Dark mode uses only semantic tokens; no hard-coded white toolbar/table/modal surface remains.

## Accessibility and visual QA

- All icon actions have `aria-label`; decorative icons have `aria-hidden` where appropriate.
- Search fields have visible or screen-reader labels, `autocomplete=off`, clear buttons and `:focus-within` treatment.
- Tabs expose correct roles/state and remain keyboard-focusable.
- Horizontal table regions use `role=region`, an accessible label and `tabIndex=0` where overflow is possible.
- Disabled unsafe controls are actual disabled buttons/inputs and expose why through title/helper copy.
- QA evidence is required at desktop 1440, tablet 768, mobile 390 and dark mode for each unique page family, with every tab and relevant open state tested.

## Decision ledger

| Decision | Source | Source rule / role | Why |
|---|---|---|---|
| Warehouse-style pill tabs everywhere applicable | user instruction + Warehouse source capture | selected navigation only | makes route changes feel coherent without changing datasets |
| React composition, not component inheritance | maintainability constraint | visual primitives own layout only | prevents shared UI from owning business logic or creating brittle override chains |
| Search inside a common toolbar/input boundary | user captures + Resend screen | working-context control | fixes displaced icons/inputs and stabilizes responsive wrapping |
| Permission matrices for both access routes | source Permissions + user request + Tango screen | comparison/readability | one object per row is faster to scan than a long repeated policy list |
| One BL-level Ocean receipt action | source spec + user evidence | group-level operation | matches the domain object and prevents per-container duplication |
| Data-bounded Schedule timeline | user request + Wrike screen | temporal focus | eliminates meaningless empty months while preserving chronology |
| Lucide icon-only dense row actions | user request + existing icon system | compact row actions | reduces table noise while keeping names available to assistive tech/tooltips |
| Existing safety boundary survives all visual work | every route spec | operational actions | deployment must remain a non-mutating demo |
