# Admin Unit Shipping — source specification

Status: source-observed on 2026-07-18. The BossWeb synchronization action was never invoked.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/unit-shipping`.
- Tabs, category/search/filter/expansion state did not add query parameters or change the URL.
- Desktop remaining tab: `docs/design-references/source-admin-unit-shipping-desktop.png`.
- Shipped tab: `docs/design-references/source-admin-unit-shipping-shipped.png`.
- VIN expansion: `docs/design-references/source-admin-unit-shipping-vin-expanded.png`.
- Search result and no-result: `source-admin-unit-shipping-search-result.png`, `source-admin-unit-shipping-no-result.png`.
- Mobile, tablet, dark: `source-admin-unit-shipping-mobile.png`, `source-admin-unit-shipping-tablet.png`, `source-admin-unit-shipping-dark.png`.

## DOM and page structure

1. Heading `Відвантаження техніки`.
2. Helper `Інформація про відвантаження з BossWeb`.
3. Last-sync text and aggregate counts.
4. BossWeb shipped-date range and sync action.
5. Six category buttons.
6. Two count-bearing tabs.
7. Tab-specific filter toolbar.
8. Dense ten-column data table.
9. Shipped rows can expand inline to a nested VIN/serial-number table.
10. Pagination and page-size control.

## Real source data and copy

- Last synchronization: `28 May 2026, 15:36`.
- Aggregate: `До відвантаження: 34 / Відвантажено: 84`.
- BossWeb date window: `Shipped: 2025-10-18 – 2026-07-18`.
- Unsafe action: `Синхр. з BossWeb`.
- Categories: `Всі`, `Снігоходи`, `Гідроцикли`, `Родстер`, `Квадроцикли`, `Side-by-Side`.
- Tabs: `Залишок до відвантаження (34)`, `Відвантажені замовлення (84)`.

### Remaining tab

- Search: `Пошук замовлення, моделі...`.
- Filters: all periods, all models, reset.
- Columns: status; date/week; BRP order no.; model no.; description; color; quantity; delivery period; sales program; destination.
- 34 records total, page size 50, one page.
- Representative rows:
  - `1022615153-000030`, `0004VTC00`, `Outlander MAX XT-P 1000R CE`, `Mineral Grey & Orange Crush`, qty 1, `MAY 2026`, `DISTR/ CURRENT SALES PROGRAM`, `ISPORT RP`;
  - `1022793561-000010`, `0001WTH00`, `Outlander MAX DPS 700 CE`, `Granite Gray`, qty 2;
  - `1022793564-000010`, `0007GTG00`, `Maverick R X rc 999T DCT SAS CE`, qty 4;
  - rows span May and June 2026.

### Shipped tab

- Adds `З` and `По` shipped-date filters.
- Columns replace date/week with `Дата відвантаження`.
- 84 records, page size 50, two pages.
- Row status observed: `Load shipped`.
- Representative row: `1022793566-000010`, shipped `2026-05-27`, model `0007GTD00`, `Maverick R X rc 999T DCT SAS INT`, `Loft Green Satin`, qty 6, `MAY 2026`, `ISPORT RP`.
- Clicking the order-number control is an inline accordion (`Показати або приховати VIN за замовленням ...`), not navigation, drawer, or modal.
- Expanded VIN table for `1022793566-000010` has six rows:
  - `3JB8TAU43TE001915`
  - `3JB8TAU43TE001994`
  - `3JB8TAU44TE001907`
  - `3JB8TAU44TE001910`
  - `3JB8TAU45TE001995`
  - `3JB8TAU4XTE001913`
- Each serial is dated `2026/05/27`, indexed 1–6; footer `6 серійних номерів`.

## Search, filters and source quirks

- Search `0007GTD00` on the Shipped tab returned five rows.
- Search `NO-SUCH-BRP-ORDER` changed both tab badges to 0 and rendered `Записи відвантаження не знайдено`, `0 записів загалом`, page `1 / 1`.
- After the no-result test, each category button rendered 0/0, including returning to `Всі`, until the route was reloaded. This is an observed source state-retention defect; the aggregate header still displayed 34/84.
- A clean route load restored 34/84. The local implementation should make `Всі` deterministically restore all records, while documentation retains the source quirk.
- Period/model combobox values exist; exhaustive option lists were not opened because the representative behavior can be implemented from the observed rows without touching the server.

## Interaction model

- Tabs, filters, search, page size, pagination, and VIN expansion are client-side; URL stays `/admin/unit-shipping`.
- Order-number buttons toggle inline VIN tables.
- The remaining table uses one page; shipped table uses two pages at page size 50.
- The date inputs at the top define the next BossWeb synchronization window. Changing them without syncing is local UI state, but no sync was attempted.

## State table

| State | Source result | Evidence |
|---|---|---|
| Remaining/populated | 34 rows, 1/1 at 50/page | desktop |
| Shipped/populated | 84 rows, 1/2 at 50/page | shipped |
| VIN collapsed | Order number appears as toggle | shipped DOM |
| VIN expanded | Six serial numbers inline | VIN expanded |
| Search/result | Five `0007GTD00` rows | search result |
| Search/no result | Explicit no-result row, 0/0 badges | no-result |
| Category filter | Six controls; observed sticky 0/0 defect after no-result | DOM audit |
| Pagination | Previous disabled on page 1; Next enabled for shipped | DOM audit |
| Loading | Not deliberately induced | unverified |
| Error | Not induced because sync/network calls are forbidden | blocked |
| Sync preview | No proven confirmation step | unsafe/blocked |

## Safe and unsafe boundaries

Safe and observed:

- both tabs;
- search, category, period/model controls, page size and pagination;
- VIN inline expansion;
- responsive and theme controls.

Unsafe:

- `Синхр. з BossWeb` because no proof exists that the first click is preview-only;
- changing the date window followed by sync;
- any external BossWeb or operational API request;
- Save, Apply, Send, Approve, Change status, Delete, Cancel, upload, or warehouse action.

In the local clone the sync action must either be hard-disabled or open a read-only explanation with its final action disabled. It must have no reducer/callback capable of changing counts or shipment status.

## Responsive and theme behavior

- Desktop 1440: main width 1184px beside persistent sidebar.
- Tablet 768: `Меню` replaces the sidebar; global search becomes a button. The dense table remains horizontally scrollable.
- Mobile 390: compact header/wordmark and no persistent sidebar; toolbar wraps, while the ten-column shipped table remains a horizontal-scroll surface rather than silently dropping fields.
- Dark: `html.dark`, body/main `#0d1117`, text `#e6edf3`.

## Exact visual tokens

- Inter; heading 30px/36px, 700; body 15px/21.75px.
- Main light surface `#f6f8fa`; primary text `#1f2328`; border `#d0d7de`.
- Search: 300px × 32px, 13px, 1px border, 6px radius, `#eaedf2`, padding 4px 12px 4px 32px.
- Table: 13px / 18.57px; observed width 1070px within the 1184px main region.
- Tablist: 475px × 37px in the desktop shipped state.
- Main region expands vertically with rows and uses `overflow: auto`.

## Clone acceptance

- Implement a dedicated `AdminUnitShippingPage` with typed BossWeb order, model, shipment and VIN fixtures.
- Working tabs, search, category, period/model/date filters, reset, page size, pagination, and inline VIN expansion.
- Preserve the observed fields and representative records. `Всі` should reliably restore 34/84 after a no-result state.
- `Синхр. з BossWeb` cannot send a request and cannot mutate state.

## User refinement lock — 2026-07-18

- Replace the detached category buttons, underline state tabs and free-form filter grid with the shared Ocean Freight control grammar.
- Use `AdminPageHeader`, `AdminTabs`, `AdminToolbar` and `AdminSearchField`; replace the six category buttons with one native single-select labelled `Тип техніки`, whose all-state copy is `Усі типи`. Keep period/model/shipped-date selects in the same bounded toolbar.
- Changing the type select resets pagination and closes any expanded VIN row, but does not clear the independent search, period, model or shipped-date filters. The explicit `Скинути` action remains the only full-filter reset.
- Date-window metadata and the disabled BossWeb sync stay in the header action region. Table columns, pagination and VIN disclosure behavior do not change.
