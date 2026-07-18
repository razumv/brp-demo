# Admin Catalog — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. No product edit/delete, price recalculation, import, synchronization or other mutation was executed.

## Source and evidence

- URL: `https://brp-dev1.k8s.artemahr.tech/admin/catalog`.
- Tab, filter, search, inline debug, import-history and pagination state adds no query parameters.
- Evidence:
  - `docs/design-references/source-admin-catalog-desktop.png`
  - `docs/design-references/source-admin-catalog-row-menu.png`
  - `docs/design-references/source-admin-catalog-search-result.png`
  - `docs/design-references/source-admin-catalog-no-result.png`
  - `docs/design-references/source-admin-catalog-atv.png`
  - `docs/design-references/source-admin-catalog-vehicle-ssv.png`
  - `docs/design-references/source-admin-catalog-vehicle-pwc.png`
  - `docs/design-references/source-admin-catalog-distributor-prices.png`
  - `docs/design-references/source-admin-catalog-distributor-ssv.png`
  - `docs/design-references/source-admin-catalog-distributor-3wv.png`
  - `docs/design-references/source-admin-catalog-distributor-pwc.png`
  - `docs/design-references/source-admin-catalog-parts.png`
  - `docs/design-references/source-admin-catalog-debug-pricing.png`
  - `docs/design-references/source-admin-catalog-debug-pricing-result.png`
  - `docs/design-references/source-admin-catalog-import-history.png`
  - `docs/design-references/source-admin-catalog-parts-search-result.png`
  - `docs/design-references/source-admin-catalog-parts-no-result.png`
  - `docs/design-references/source-admin-catalog-parts-page-2.png`
  - `docs/design-references/source-admin-catalog-tablet.png`
  - `docs/design-references/source-admin-catalog-mobile.png`
  - `docs/design-references/source-admin-catalog-dark.png`

## Shared page structure

`Admin shell -> H1/helper -> four global part KPI -> three primary tabs -> tab-specific KPI/filter/table tooling`.

- H1: `Керування каталогом`.
- Helper: `Товари, ціни дистриб'ютора та каталог запчастин`.
- Global KPI: `Усього запчастин 205 460`, `Активні 67 334`, `Замінені 26 760`, `Застарілі 54 261`.
- Primary tabs: `Каталог`, `Ціни дистриб'ютора`, `Каталог запчастин`.

## Vehicle Catalog

- Helper: `Управління каталогом транспортних засобів для інвойсів та ціноутворення`.
- KPI: `Усього продуктів 98`, `ATV 27`, `SSV 28`, `PWC 38`.
- Search: `Пошук за SKU або назвою...`.
- Category tabs: `All`, `ATV`, `SSV`, `PWC`.
- Table headers: `Категорія`, `SKU`, `Назва`, `Колір`, `Двигун`, `Модельний рік`, `Рік вир.`, `Ціна USD`, `Ціна EUR`, `Статус`, action.
- Second header row provides category, SKU, name, colour, engine, model-year and production-year column filters.
- The source renders all 98 products without pagination (100 accessible rows including the two headers).

Representative rows:

| Category / SKU | Name | Colour | Engine | MY / year | USD / EUR | Status |
|---|---|---|---|---|---|---|
| 3WV / F3TB | 3WV RYKER Rally | Black / Чорний | 899см3 | 2026 / 2026 | $2 400 / EUR 2 000 | Активний |
| ATV / 1VSC | ATV OUTLANDER MAX DPS 500 | Gray / Сірий | 650см3 | 2025 / 2025 | $2 585 / EUR 2 154 | Активний |
| ATV / 4RTB | ATV OUTL MAX DPS 1000R GY | Gray / Сірий | 999см3 | 2026 / 2025 | $3 199 / EUR 2 666 | Активний |
| SSV / 9JTA | SSV Maverick Sport MAX DPS T ABS | Triple Black / Чорний | 976см3 | 2026 / 2026 | $4 230 / EUR 3 525 | Активний |

Search `4RTB` returns its matching source product. Search `NO_SUCH_SKU_9000` recomputes all product KPI to zero and shows `Продуктів ще немає` / `Товари з'являться тут, коли дані каталогу будуть доступні.` Category `ATV` produces 27/27/0/0 in the four local KPI.

The later completeness pass selected every category independently: SSV rendered 28 rows with first row `6BTA / SSV TRAXTER MAX XU`; PWC rendered 38 rows with first row `11SA / PWC GTX 170`. Every row has an unlabeled vertical-ellipsis button. Opening the first menu is safe and exposes only `Редагувати` and `Видалити`; neither was clicked. They are hard-blocked in the clone.

## Distributor prices

Exact KPI: `Total 129`, `3WV 15`, `ATV 53`, `PWC 26`, `SSV 35`.

- Search: `Пошук SKU, модель, колір...`.
- Category tabs: `ATV` (default), `SSV`, `3WV`, `PWC`.
- Columns: `SKU`, `Сімейство`, `Комплектація`, `Двигун`, `Колір`, `Колір UA`, display/service icon columns, `Омологація`, `MY`, `Ex-Works EUR`, `Ex-DC EUR`.
- Representative ATV row: `3JTB`, DS, STD, 250, Can-Am Red & Black / Червоний та Чорний, INT, 2026, 3850.00, 4158.00.
- Other observed homology values include `T3b`, `T3b - 60km/h`, `T3a - 40km/h`, `T2b - 60km/h`, and `INT - NRMM`.
- Every category was selected independently. SSV rendered 35 rows (first `6CTA Commander MAX XT-P 1000R`), 3WV rendered 15 rows (first `J1TB CANYON STD 1330 ACE SE6`), and PWC rendered 26 rows (first `16TB Explorer Pro 230`).

## Parts catalog

After the read-only load settles:

- pricing controls show `EUR/USD 1.20`, `Expense % 0.50`, `148 671 parts with prices`;
- `Перерахувати ціни` is an unsafe mutating control and was never clicked;
- health: `1 920 Broken Chains`, `762 Dead Ends`, `0 No Results (7d)`, `69% Dist Price Coverage`, `5 554 1C Stock (qty > 0)`;
- source composition: `pricelist 170 507`, `catalog 28 971`, `1C only 5 541`, `unknown 307`, `1c_legacy 82`, `1c_legacy_price 50`, `art472 2`;
- `Last import: 12 июл., 03:06`; `Last 1C sync: 10 мая, 15:00`;
- `Assembly parts 117 842`, `Priced 72%`, `In stock 2%`, `Orphans 2 921`.

List controls:

- `SKU або опис...` search;
- filters `Усі статуси`, `Усі лінійки`, `Усі типи`;
- total `176221 результатів`;
- columns `SKU`, `Опис`, `Повний тип`, `Дист. EUR`, `Дилер $`, `Розд. $`, `МОЗ`, `К-ть`, `Статус`, `-> Активна запчастина`;
- pagination `Page 1 of 3525`, disabled `Prev`, enabled `Next`; page 2 was verified.

Observed row/status families:

| SKU | Description/type | Prices | Status / replacement |
|---|---|---|---|
| 0104-631 | PAD, SHOCK / SKI Parts | EUR 2.74 / $8.29 / $11.61 | Active |
| 01140800 | NUT M 10 V. / SKI Parts | - | Substituted -> 33017 / $7.86 |
| 0122364 | HOSE / Sea-Doo Parts | EUR 13.85 / $39.26 / $54.96 | Obsolete |
| 415005700 | HOSE / SKI Parts | EUR 3.50 / $10.58 / $14.81 | Active |

Search `415005700` returns one exact row. Search `NO_SUCH_PART_9000` settles to `0 результатів` and a single `Нічого не знайдено.` table row.

### Safe Debug Pricing

The collapsible `Debug Pricing` shell is read-only. Searching `415005700` produced:

- HOSE, SKI Parts, source `pricelist`, quantity `0 (reserved: 0)`, updated `12.07.2026, 03:09:28`;
- DB: dist EUR 3.50, dealer $10.58, retail $14.81, category `A - Captive Parts`;
- calculation settings 1.2 / 0.5 and exact steps: EUR-to-USD $4.2000; +expense $6.3000; tier `[5.00, 10.00)`; dealer `$10.58`; retail `$14.81`;
- collapsed informational BossWeb and substitution-chain sections.

### Import history

`Import History (20)` expands a read-only table: `Date`, `Mode`, `SKUs`, `New/Upd`, `Changes`, `Chains`, `Duration`, `Статус`.

Representative records:

- 12 Jul 03:06, BW Auto, 168 877, +168 877 (142 422 prices), 24 562 chains (762 dead), 304.3s, OK;
- 5 Jul 13:23, BW Auto, 168 747, +168 747 (142 332 prices), 24 525 chains, 516.6s, OK;
- 5 Jul 06:44 and 06:33, BW Auto, empty metrics, 23930.8s / 24572.5s, Error.

## State and safety matrix

| Family | Populated | Filter/search | Empty/error | Unsafe boundary |
|---|---|---|---|---|
| Vehicles | 98 rows | category, global and column filters | explicit product-empty copy | edit/delete |
| Distributor | 129 prices | category/search | no durable error forced | any future price mutation |
| Parts | 176,221, 3,525 pages | search/status/line/type/page | `Нічого не знайдено.` | recalculate/import/sync |
| Debug | exact 415005700 result | SKU query | disabled Debug before SKU | no mutation exposed |
| Imports | 20 history rows | expand/collapse | two observed Error records | import trigger absent here |

Safe: tabs, search, filters, row menu preview, debug query, history expansion and pagination. Unsafe and never invoked: product edit/delete, changing pricing settings, `Перерахувати ціни`, any import/sync or persistence action.

## Responsive, dark and visual tokens

- Desktop 1440: persistent 256px sidebar; vehicle table can extend to approximately 7,064px page height; parts table paginates 50 rows.
- Tablet/mobile preserve dense horizontal tables with overflow; controls stack vertically and health/import panels remain readable.
- Dark mode preserves semantic status badges and orange selected-tab accents.
- Shared measured admin tokens: light background/text/border `#f6f8fa` / `#1f2328` / `#d0d7de`; dark `#0d1117` / `#e6edf3` / `#30363d`; H1 30px/36px weight 700; selected primary tab orange `#f97316`, 6px radius.

## Clone acceptance

- Dedicated route component and typed vehicle, distributor-price, part, substitution, health, debug and import-history models.
- All three primary tabs, category/search/filter states, row-menu preview, debug query, history and pagination work locally.
- Exact global KPI and representative source rows are preserved; large datasets are explicitly marked representative.
- Edit/delete/recalculate/import/sync controls are hard-disabled and have no operational callback, reducer or external request.

## User refinement lock — 2026-07-18

- Keep the current shared primary tabs, search fields, category segmented controls and end-of-row ellipsis menu.
- Move the vehicle category/SKU/name/colour/engine/model-year/production-year fine filters out of the table `<thead>` into a compact, collapsible advanced-filter surface adjacent to the shared toolbar.
- The table header becomes one clean semantic row. Advanced-filter logic, zero-result behavior and KPI recomputation remain unchanged.
- Preserve the source-observed pricing multipliers (`EUR/USD 1.20`, `Expense 0.50`) and the exact read-only debug calculation. Recalculate/import/sync and edit/delete remain hard-disabled.
