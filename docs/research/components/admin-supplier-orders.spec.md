# Admin Supplier Orders — source specification

Status: source-observed on 2026-07-18. The source was inspected strictly read-only.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/supplier-orders`.
- Tabs, search, period, sort and exception filters are client-side; no query parameter was added.
- Both exception `Відкрити` buttons navigate by GET to `https://brp-dev1.k8s.artemahr.tech/admin/air-freight` with its `Постачання` tab selected. They do not open an order detail, drawer or modal.
- Evidence:
  - `docs/design-references/source-admin-supplier-orders-desktop.png`
  - `docs/design-references/source-admin-supplier-orders-exceptions.png`
  - `docs/design-references/source-admin-supplier-orders-backorders.png`
  - `docs/design-references/source-admin-supplier-orders-sort.png`
  - `docs/design-references/source-admin-supplier-orders-period.png`
  - `docs/design-references/source-admin-supplier-orders-mobile.png`
  - `docs/design-references/source-admin-supplier-orders-dark.png`

## DOM structure and real source data

`Admin shell -> H1 -> four KPI controls -> search/period/sort toolbar -> three tabs -> tab-specific content`.

- H1: `Замовлення постачальнику`.
- KPI controls: `Всього 0`, `Активні 0`, `Бекордер 0`, `Завершені 0`.
- Search placeholder: `Пошук за номером SO, артикулом...`.
- Period control: `Період`; it opens the shared two-month range picker starting at July 2026 and initially says `Click start date`.
- The combobox default copy is `За статусом`, but the observed options are sorting choices, not statuses:
  - `За статусом`;
  - `Спочатку нові`;
  - `Спочатку старі`;
  - `За сумою`.
- Tabs: `Всі замовлення`, `Бекордери`, `Винятки 2`.

### All orders

The source dataset is empty in this tab. Copy:

- `Немає замовлень за фільтром`;
- `Змініть пошук, період або фільтр карток`.

No supplier-order row, pagination, monetary total, supplier, date, editable form or status badge can be evidenced from this source state.

### Backorders

The source shows no rows and the positive empty-state copy `Немає бекордерів — всі позиції виконані!`.

### Exceptions

The tab count is `2`. Its local filters are:

- `Всі · 2`;
- `PDF не прив'язано · 2`;
- `Показати закриті`.

Observed cards:

| Shipment | Exception | Lines | Safe destination |
|---|---|---:|---|
| `SHP-2026-004` | `PDF не прив'язано` | 197 | `/admin/air-freight`, Shipments tab |
| `SHP-2026-003` | `PDF не прив'язано` | 3 | `/admin/air-freight`, Shipments tab |

Each card has a separate `Відкрити` button. Opening both proved the same navigation-only behavior; no data changed.

## Interaction model and state table

| State | Source result | Local requirement |
|---|---|---|
| All / baseline | Four zero KPI cards and filter-empty copy | Preserve the honest empty dataset |
| Search / miss | Same filter-empty state | Search must be local and clearable |
| Backorders | Positive no-backorders message | Dedicated tab state |
| Exceptions / all | Two missing-PDF cards | Render exact identifiers, counts and exception copy |
| Exceptions / missing PDF | Same two cards | Client-side chip filter only |
| Exceptions / closed toggle | Toggle is visible; closed records were not proven | Do not invent closed source records |
| Exception open | GET navigation to Air Freight Shipments | Use a normal local route link, not an operational action |
| Period | Shared July/August 2026 range calendar | Open/close and local filtering only |
| Sort | Four observed options | Working local sort; preserve empty result |
| Loading | Not deliberately induced | Optional non-mutating skeleton only |
| Error | Not deliberately induced | Optional read-only error surface only |
| Populated supplier order/detail | Not present in source data | Any demo fixture must be explicitly labelled local-demo, never source evidence |

## Safe and unsafe actions

Safe and observed:

- all three tabs;
- search entry/clear;
- period popover without date application;
- opening and closing the sort list;
- exception chips;
- both `Відкрити` links, which navigate to Air Freight only;
- responsive and dark-mode controls.

Unsafe or unverified:

- creating, editing or saving a supplier order;
- linking or uploading a PDF;
- closing an exception if `Показати закриті` exposes any operational control;
- supplier confirmation, send, receive, consolidate, cancel or status changes;
- any POST/PUT/PATCH/DELETE request.

The last safe point for an exception is the Air Freight Shipments screen. No upload or create CTA was used.

## Responsive and theme behavior

- Desktop 1440: persistent admin sidebar and a four-column KPI row; search, period and sort share a toolbar.
- Mobile 390: compact banner/menu, KPI controls and toolbar wrap into the narrow main region; tabs remain available and the empty message stays readable.
- Tablet uses the shared admin shell breakpoint family already evidenced on Air/Ocean/Unit. A route-specific tablet difference was not observed and must not be asserted.
- Dark mode uses the expanded desktop sidebar at 1440, `switch_to_light` in the banner, dark page surfaces and orange selected tabs.

## Exact visual tokens

Captured computed values at 1440px/dark:

- H1: `28px / 33.6px`, weight `700`, `rgb(230,237,243)`.
- KPI interactive outer control: approximately `271px × 82.66px`, radius `6px`; its visible card surface is supplied by the nested component.
- Search input content box: `272px × 36px`.
- Selected `Всі замовлення` tab: orange text `rgb(249,115,22)`, orange 15%-alpha background, radius `6px`, horizontal padding `12px`, height `36px`.
- Shared dark body/background tokens follow `#0d1117` / `#e6edf3`; shared light border is `#d0d7de`.

## Clone acceptance

- Implement the route as its own workflow component, not a generic logistics table.
- Preserve the source-zero KPI values, three distinct empty/exception states, exact exception cards, working tabs/search/sort/period/filter controls and exception navigation.
- Do not fabricate a populated supplier-order source view. Typed local-demo supplier-order models are allowed only with an explicit demo label and must remain read-only.
- No reducer, store action or callback may mutate supplier-order, shipment, PDF-link or operational status. Upload/create/save/send/receive actions are hard-disabled.
