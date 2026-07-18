# Admin Analytics — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. All eight tabs, all shared period/product filters and all populated Unit-tab filters, searches, sort orders and six pagination pages were inspected. This route exposes no operational mutation CTA; no source data was changed.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/analytics`.
- Tab, filter, search, sort and pagination state keep the base URL and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-analytics-desktop.png`
  - `docs/design-references/source-admin-analytics-tab-overview.png`
  - `docs/design-references/source-admin-analytics-tab-finance.png`
  - `docs/design-references/source-admin-analytics-tab-dealers.png`
  - `docs/design-references/source-admin-analytics-tab-warehouse.png`
  - `docs/design-references/source-admin-analytics-tab-purchases.png`
  - `docs/design-references/source-admin-analytics-tab-parts.png`
  - `docs/design-references/source-admin-analytics-tab-units.png`
  - `docs/design-references/source-admin-analytics-tab-attention.png`
  - `docs/design-references/source-admin-analytics-period-menu.png`
  - `docs/design-references/source-admin-analytics-product-menu.png`
  - `docs/design-references/source-admin-analytics-tech-desktop.png`
  - `docs/design-references/source-admin-analytics-tech-status-menu.png`
  - `docs/design-references/source-admin-analytics-tech-dealer-menu.png`
  - `docs/design-references/source-admin-analytics-tech-sort-menu.png`
  - `docs/design-references/source-admin-analytics-tech-available.png`
  - `docs/design-references/source-admin-analytics-tech-free.png`
  - `docs/design-references/source-admin-analytics-tech-vin-search.png`
  - `docs/design-references/source-admin-analytics-tech-no-result.png`
  - `docs/design-references/source-admin-analytics-tech-page-2.png`
  - `docs/design-references/source-admin-analytics-tablet.png`
  - `docs/design-references/source-admin-analytics-tech-mobile.png`
  - `docs/design-references/source-admin-analytics-tech-mobile-table.png`
  - `docs/design-references/source-admin-analytics-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper + stale-sync badge -> eight tab buttons -> tab-specific controls/content`.

- H1: `Аналитика`.
- Helper: `Управленческий дашборд (данные из 1С)`.
- Status badge: `1С · обновлено нет данных · устарело`.
- The analytics feature is Russian-language inside the Ukrainian administrative shell; preserve the source strings instead of silently translating them.
- Tabs are ordinary buttons rather than ARIA tabs: `Обзор`, `Финансы`, `Дилеры`, `Склад`, `Закупки`, `Запчасти`, `Техника`, `Внимание`.

## Every-tab state inventory

All eight buttons were selected separately. They do not share one generic rendering contract.

| Tab | Shared period/product controls | Source content |
|---|---|---|
| `Обзор` | yes | unsynchronized empty state |
| `Финансы` | yes | unsynchronized empty state |
| `Дилеры` | yes | unsynchronized empty state |
| `Склад` | no | unsynchronized empty state |
| `Закупки` | no | unsynchronized empty state |
| `Запчасти` | no | unsynchronized empty state |
| `Техника` | no shared filters; has its own four controls | populated 600-row dataset |
| `Внимание` | no | unsynchronized empty state |

The seven empty tabs render the exact durable copy:

- `Аналитика ещё не синхронизирована из 1С`;
- `Включите воркер (ANALYTICS_V2_ENABLED) или запустите backfill.`

The sync badge still says no data/stale on the populated `Техника` tab. This apparent source inconsistency is evidence-backed and must not be “corrected” by hiding the Unit data.

## Shared filters on Overview, Finance and Dealers

The three tabs share two custom comboboxes and a date-range label.

Period options and exact observed date ranges:

| Period | Range |
|---|---|
| `Текущий месяц` | `2026-07-01 … 2026-07-18` |
| `Прошлый месяц` | `2026-06-01 … 2026-06-30` |
| `Квартал` | `2026-07-01 … 2026-07-18` |
| `Год` | `2026-01-01 … 2026-07-18` |
| `12 месяцев` | `2025-08-01 … 2026-07-18` |

Product options: `Все товары`, `Техника`, `Запчасти`.

Every option was selected. The controls update their labels/range locally while the unsynchronized empty copy remains. Baseline was restored to `Год`, `Все товары`, `2026-01-01 … 2026-07-18`.

## Populated Unit tab

### KPI

| KPI | Count | Purchase cost/helper |
|---|---:|---|
| `Всего юнитов` | 600 | `€7 787 770` |
| `В наличии` | 316 | `€4 050 750` |
| `В пути` | 284 | `€3 737 020` |
| `Свободно (не за дилером)` | 314 | `286 за дилером` |

Filtering/search recalculates these KPI against the visible result set. A no-result search produces four zero counts, `€0` costs and `0 за дилером`.

### Controls

- Debounced textbox `VIN или модель…`.
- Status combobox: `Все статусы`, `В наличии`, `В пути`.
- Assignment combobox: `Все`, `За дилером`, `Свободные`.
- Sort combobox: `По стоимости`, `По модели`, `По статусу`.
- Range/pagination: `1–100 из 600`, disabled `←`, enabled `→`.
- Note: `Стоимость — по закупке (€); продажи и маржа техники — отдельным шагом позже.`

### Table

Five columns: `VIN`, `Модель`, `Статус`, `Дилер`, `Стоимость €`.

The baseline has 600 rows split into six exact 100-row pages. Every page was opened:

| Page | Range | Representative first VIN |
|---:|---|---|
| 1 | `1–100 из 600` | `3JB8UAU46TE000447` |
| 2 | `101–200 из 600` | `YDV20490J526` |
| 3 | `201–300 из 600` | `3JB3PA776TJ000480` |
| 4 | `301–400 из 600` | `3JB3PA778TJ000335` |
| 5 | `401–500 из 600` | `3JB3PA674TJ000091` |
| 6 | `501–600 из 600` | `YDV05335G526` |

Next is disabled on page 6; Previous is disabled on page 1. Returning through all five previous steps restored page 1.

Representative baseline row:

`3JB8UAU46TE000447 | SSV MAV R MAX XRC 999T GN HB S | В наличии | — | €34 180`.

Rows also cover missing VIN (`—`), in-stock units with and without a dealer, in-transit units with and without a dealer, multiple BRP dealer companies and Logos.

### Search states

Search settles after approximately one second.

- Exact VIN `3JB8UAU46TE000447` -> `1–1 из 1`, one exact row.
- Model text `CANYON REDR` -> one row: `2BXBMDD17TV000019 | RD CANYON REDR 1330 SE6 GN EU | В пути | — | €19 055`.
- `NO_SUCH_VIN_9000` -> no table, recalculated zero KPI and `Ничего не найдено`.
- Clearing restores 600, the original four KPI and page 1.

### Filter states

- Status `В наличии` -> 316 rows, page label `1–100 из 316`; all rendered statuses are in stock.
- Status `В пути` -> 284 rows, page label `1–100 из 284`; all rendered statuses are in transit.
- Assignment `Свободные` -> 314 rows, page label `1–100 из 314`; every rendered dealer cell is `—`.
- Assignment `За дилером` -> 286 rows, page label `1–100 из 286`; rendered dealer cells contain dealer labels.
- Every filter was restored to All.

### Sort states

- `По стоимости` baseline starts at €34 180.
- `По модели` starts with `ATV OUTL MAX 6X6 BAC 1000R BK` followed by `ATV OUTL MAX BAC 1000R CA CE`.
- `По статусу` groups `В наличии` first; the first three observed rows are in stock.
- Sort was restored to purchase cost.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Seven non-Unit tabs | explicit unsynced empty copy | independent tab selection; preserve filter presence differences |
| Shared period/product filters | five periods, three products | all options work locally; exact ranges |
| Unit baseline | 600 rows, 4 KPI, 100-row pages | typed representative dataset plus exact global aggregates |
| Unit status filters | 316 / 284 | exact counts and consistent statuses |
| Unit assignment filters | 314 / 286 | exact counts and dealer presence |
| Unit sort | cost/model/status | deterministic working sort |
| VIN/model search | one-row hits after debounce | filter/recalculate locally |
| No result | zero KPI + `Ничего не найдено` | no table, exact copy |
| Pagination | six 100-row pages | all ranges and disabled edge buttons |
| Loading/error | initial `статус синка…` was transient; no durable error UI forced | do not invent an operational error or sync action |

## Safety boundary

Safe and inspected: all eight tabs, shared period/product filters, Unit search/status/assignment/sort, all six pages, responsive layouts and theme.

There is no source Approve/Sync/Save/Export/mutation action on this route. The local clone must remain entirely client-side and read-only: no backfill trigger, sync request, filter network request or operational reducer.

## Responsive, dark and exact tokens

- Desktop 1440: persistent 255px sidebar; eight compact tabs in one row; Unit KPI in a four-column row; compact control/pagination row; 1118px-wide five-column table; full Unit page height 4151px for 100 visible rows.
- Tablet 768: compact top header; Unit table fits a 718px content width; KPI/control grid wraps before the table.
- Mobile 390: tabs wrap into multiple rows; four KPI cards stack vertically; controls wrap; the table remains a 662px horizontal-scroll surface inside a 356px viewport rather than transforming into cards. The populated mobile page is 5653px tall.
- Dark mode keeps blue active-tab treatment, colored KPI icons and the dense table on GitHub-like surfaces.
- Measured light: body `rgb(246,248,250)`, text `rgb(31,35,40)`, border `rgb(208,215,222)`; H1 30px/36px weight 700; active tab blue `rgb(9,105,218)` on 10% blue, 13px, padding 6px 14px, 6px radius; search 224x32, 13px, white, 4px radius; combobox 32px, 13px, `rgb(234,238,242)`, 6px radius; table header 13px/18.57px.
- Measured dark: body `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`; H1 28px/33.6px; active tab `rgb(88,166,255)` on 12% blue, 12px; search `rgb(22,27,34)`; combobox `rgb(1,4,9)`; table header 12px/17.14px.
- Shared font: `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

## Clone acceptance

- Dedicated route component and typed analytics tab, period, product, Unit KPI, filter, sort and representative row models.
- All eight tabs work independently; Overview/Finance/Dealers keep filters while Warehouse/Purchases/Parts/Attention do not.
- The Unit tab is populated despite the stale sync badge and is not replaced by the generic empty state.
- Search, status, assignment, sort and six-page navigation work locally and recalculate the displayed KPI/result count.
- No external request, sync/backfill action or operational-state mutation exists.
- Desktop/tablet/mobile and light/dark preserve the observed hierarchy and horizontal mobile table behavior.
