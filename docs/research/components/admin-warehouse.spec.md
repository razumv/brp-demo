# Admin Warehouse — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. No receipt, scan, remap, import, export or inventory change was executed.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/warehouse`.
- All process tabs, shipment selection, view/filter/search/pagination and inline-edit preview retain this URL without query parameters.
- Evidence:
  - `docs/design-references/source-admin-warehouse-desktop.png`
  - `docs/design-references/source-admin-warehouse-receiving-selector.png`
  - `docs/design-references/source-admin-warehouse-receipt-summary.png`
  - `docs/design-references/source-admin-warehouse-shortages.png`
  - `docs/design-references/source-admin-warehouse-fulfillment.png`
  - `docs/design-references/source-admin-warehouse-summary.png`
  - `docs/design-references/source-admin-warehouse-summary-shipments.png`
  - `docs/design-references/source-admin-warehouse-placement.png`
  - `docs/design-references/source-admin-warehouse-placement-search-result.png`
  - `docs/design-references/source-admin-warehouse-placement-no-result.png`
  - `docs/design-references/source-admin-warehouse-location-edit-preview.png`
  - `docs/design-references/source-admin-warehouse-tablet.png`
  - `docs/design-references/source-admin-warehouse-mobile.png`
  - `docs/design-references/source-admin-warehouse-dark.png`

## Page structure

`Admin shell -> H1/helper -> mobile process combobox + six desktop tabs -> process-specific toolbar/KPIs -> dense workflow content`.

- H1: `Склад`.
- Helper: `Приймайте постачання, розбирайте нестачі, керуйте виконанням і контролюйте готовність складу в одному процесі.`
- Six process tabs/options:
  - `Приймання`;
  - `Зведення приймання`;
  - `Нестачі`;
  - `Виконання`;
  - `Зведення`;
  - `Розміщення`.

## 1. Receiving (`Приймання`)

The shipment selector exposes four source shipments, all labelled `in_transit`:

| Proforma | Shipment | Expected units | Scanned | Fully | Missing/discrepancy | Packing-list lines |
|---|---|---:|---:|---:|---:|---:|
| `PAC 05` | `SHP-2026-004` | 2551 | 0 | 0 | 191 | 191 |
| `PAC 04` | `SHP-2026-003` | 4773 | 0 | 0 | 407 | 407 |
| `PAC 03 + Spyders` | `SHP-2026-002` | 4111 | 0 | 0 | 434 | 434 |
| `PAC 02` | `SHP-2026-001` | 326 | 0 | 0 | 18 | 18 |

For every shipment:

- linked supplier-order count is `0`;
- copy is `Немає зв'язаних замовлень`;
- the packing-list table columns are `Артикул`, `Опис`, `К-ть`, `Скан`;
- scan cells are `—` because receipt has not started.

Representative packing-list lines:

| Shipment | Part | Description | Quantity |
|---|---|---|---:|
| PAC 05 | `267000917` | `WEAR RING` | 70 |
| PAC 05 | `277001874` | `WEAR RING` | 51 |
| PAC 04 | `271002071` | `SEAL` | 149 |
| PAC 03 + Spyders | `219700368` | `FUEL FILTER, BOSCH` | 10 |
| PAC 02 | `295101148` | `BOX_STORAGE F KIT` | 35 |

The scan strip contains a disabled input `Спочатку почніть приймання...`, state buttons `OK`, `Пошкоджено`, `Не той`, and copy `Натисніть "Почати приймання" для початку` / `Немає сканів`.

Unsafe operational controls, never clicked:

- `Прийняти все`;
- `Почати приймання`;
- `Прийняти (вже в 1С)`;
- all scan-state controls after starting receipt.

The last safe point is a selected `in_transit` shipment with its packing list visible.

## 2. Receipt summary (`Зведення приймання`)

- Views: `За артикулами`, `До відвантаження`.
- Shipment select defaults to `Усі відвантаження`.
- KPI: `Артикулів 0`, `CRM 0`, `Legacy поза CRM 0`, `Недоотримано 0`.
- Search: `Пошук за артикулом…`.
- Filters: `Усі`, `CRM`, `Legacy`.
- Actions: `Оновити`, `Експорт`.
- Empty copy: `Поки немає прийнятого товару`.

No receipt was created to populate this tab. Refresh/export were not invoked.

## 3. Shortages (`Нестачі`)

KPI are all zero: `Очікують`, `Пошкоджені`, `Не та деталь`, `Надлишок`.

Substates:

| View | Count | Section heading | Empty copy |
|---|---:|---|---|
| `Активні` | 0 | `Очікують перевірки` | `Немає активних нестач` |
| `Історія` | 0 | `Додано до консолідації` | `Поки немає позицій в історії` |
| `Надлишок` | 0 | `Надлишки при прийманні` | `Немає невирішених надлишків` |

Search is `Пошук за артикулом або постачанням...`; `Оновити` was not invoked.

## 4. Fulfillment (`Виконання`)

- KPI: `Всього замовлень 0`, `Відправлено 0`, `Отримано 0`, `Бекордер 0`.
- Search: `Пошук замовлень...`.
- Filters: `Всі`, `В роботі`, `Завершені`, `Бекордер`.
- List empty copy: `Немає замовлень постачальнику`.
- Kanban columns: `Очікують 0`, `В роботі 0`, `Завершені 0`, each with `Немає замовлень`.
- `Перезіставити` is an unsafe operational action and was not clicked.

## 5. Inventory summary (`Зведення`)

Exact source KPI:

| Metric | Value |
|---|---:|
| `Всього деталей` | 1061 |
| `Відправлено` | 11761 |
| `Отримано` | 0 |
| `Всього EUR` | €279,830.76 |

Controls:

- search `Пошук артикулу...`;
- shipment filter with 34 ocean identifiers plus `PAC 02`–`PAC 05` and `Всі постачання`;
- dealer filter with 20 dealers plus `Всі дилери`;
- `За деталями` and `За постачаннями`;
- `Експорт Excel`, not invoked.

### By parts

Table columns: `Артикул`, `Опис`, `Постачання`, `Відправлено`, `Отримано`, `€ шт.`, `€ всього`, `Стан`, `Розподіл`.

Observed common status is `Відсутнє`; allocation is `Не розподілено`. The total footer repeats `1061 деталей`, `11761`, `0`, `€279,830.76`.

Representative rows:

| Part | Description | Shipment | Sent | Received | Unit | Total |
|---|---|---|---:|---:|---:|---:|
| `295100909` | `SKI PYLON` | PAC 02 | 20 | 0 | €124.20 | €2,484.00 |
| `715009218` | `BOX_DASHBOARD STORAGE KIT` | PAC 05 | 20 | 0 | €64.35 | €1,287.00 |
| `9779492` | `OIL 4T 5W40 SYNTHETIC QT/0,946L` | PAC 05 | 480 | 0 | €6.56 | €3,148.80 |

### By shipments

| Shipment | Proforma | Positions | Sent | EUR |
|---|---|---:|---:|---:|
| `SHP-2026-001` | PAC 02 | 18 | 326 | €35,471.73 |
| `SHP-2026-002` | PAC 03 + Spyders | 437 | 4111 | €73,388.47 |
| `SHP-2026-003` | PAC 04 | 409 | 4773 | €104,260.05 |
| `SHP-2026-004` | PAC 05 | 197 | 2551 | €66,710.51 |

These are summary cards/generics, not links or detail drawers in the observed DOM.

## 6. Placement (`Розміщення`)

- Heading: `Розміщення на складі`.
- Source total: `5211` positions.
- Page size: 100; pagination changes `1–100 з 5211` to `101–200 з 5211` using `Назад`/`Вперед`.
- Search: `Пошук: артикул, комірка, зона…`.
- Columns: `Артикул`, `Опис`, `Комірка`, `Зона`, `Залишок 1С`, `Джерело`, `Оновлено`.
- Source/data date on the observed rows: `Excel`, `19.05.2026`.
- `Оновити` and `Експорт` can be disabled during loading/filtering; they were not invoked.
- `Завантажити Excel` is an upload/import action and was not clicked.

Representative rows:

| Part | Description | Cell | Zone | 1C stock | Source/date |
|---|---|---|---|---:|---|
| `293650138` | `OETIKER CLAMP` | `1.2` | — | 0 | Excel / 19.05.2026 |
| `509000442` | `OETIKER CLAMP` | `1.2` | — | 3 | Excel / 19.05.2026 |
| `250200102` | `FLAT WASHER M12` | `1.3` | — | 8 | Excel / 19.05.2026 |
| `570063600` | `WHEEL CAP` | `1.4` | — | 123 | Excel / 19.05.2026 |

Search is debounced. `293650138` produces `1–1 з 1`. A no-result query temporarily produces `Немає розміщених позицій`; the source then asynchronously resets the search to its baseline. The clone should implement a stable local no-result state rather than reproduce this race.

### Inline location editor

Clicking cell `1.2` for part `293650138` replaces the button with a textbox containing `1.2` and two icon buttons (commit/cancel). The commit control is unsafe. The preview was closed with Escape; a repeat DOM snapshot confirmed that the cell remained `1.2`, stock `0`, source `Excel`, date `19.05.2026`.

The clone may reproduce this local edit preview, but commit must be hard-disabled and Escape/Cancel must restore the original value.

## State matrix and unsafe boundary

| State family | Populated | Empty | Search/filter | Unsafe final actions |
|---|---|---|---|---|
| Receiving | Four shipments and packing lists | linked SO/scan feed empty | shipment selector | all receipt/start/scan controls |
| Receipt summary | — | all KPI/list zero | view/search/filter | refresh/export |
| Shortages | — | all three subtabs zero | subtab/search | resolve/consolidate if later exposed |
| Fulfillment | — | list/Kanban zero | search/status/view | remap |
| Summary | 1061 parts/four shipments | received=0 | part/shipment/dealer/view | Excel export |
| Placement | 5211 rows | search miss | search/pagination/inline preview | location commit, upload/import |

No source operational count, status, scan, receipt, inventory or location changed during research.

## Responsive and dark behavior

- Desktop 1440: persistent sidebar and 1184px main region; six horizontal tabs and dense tables.
- Tablet 768/mobile 390: compact admin banner; process combobox remains available, tabs wrap/scroll, and tables retain horizontal overflow rather than dropping columns.
- Receiving packing lists and action rows stack/wrap on mobile while dangerous controls remain visually distinct.
- Dark mode preserves all KPI/table/status hierarchy and swaps semantic surfaces/borders/text.

## Exact visual tokens

Captured at 1440px/light:

- Main: 1184px wide, `rgb(246,248,250)` background, 15px/21.75px body.
- H1: 30px/36px, weight 700, `rgb(31,35,40)`.
- Selected process tab: orange text `rgb(234,88,12)`, orange 15%-alpha background, 11px/14.67px weight 500, 36px high, 8px 12px padding, 6px radius.
- Source `Почати приймання` CTA: green text `rgb(26,127,55)`, 10%-alpha green background, 1px 25%-alpha border, 13px/500, 40px high, 16px horizontal padding, 6px radius. This token is visual evidence only; the clone CTA must be disabled.
- Shared borders: `#d0d7de`; dark surfaces/text follow `#0d1117` / `#e6edf3`.

## Clone acceptance

- Implement a dedicated warehouse component and typed shipment, manifest-line, shortage, fulfillment, inventory-summary, placement and milestone/receipt models.
- Tabs, shipment selection, summary view, search/filter, list/Kanban, pagination and inline preview work entirely locally.
- Preserve source totals and representative rows while explicitly labelling local representative subsets.
- `Прийняти все`, `Почати приймання`, legacy receipt, scan mutation, remap, export/download, upload/import and location commit are hard-disabled and have no handler/request/reducer capable of changing operational state.

## User refinement lock — 2026-07-18

- Preserve the source-proven process logic, density and tables, but render the six-process navigation with shared `AdminTabs` and its mobile select fallback.
- Replace route-local search and segmented controls incrementally with `AdminSearchField`, `AdminToolbar` and `AdminSegmentedControl` so Warehouse matches Ocean Freight without flattening process-specific content.
- No receipt, scan, inventory, pagination or placement behavior changes are authorized by this visual migration.
