# Admin Invoices — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. No upload, document generation/download, archive/restore, contract mutation, assignment change, export or delete action was executed.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/invoices`.
- Tabs, status/search filters, previews, cost filters and the new-contract preview retain the same URL and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-invoices-contracts-desktop.png`
  - `docs/design-references/source-admin-invoices-contract-create-preview.png`
  - `docs/design-references/source-admin-invoices-appendices-desktop.png`
  - `docs/design-references/source-admin-invoices-appendix-unit-preview.png`
  - `docs/design-references/source-admin-invoices-appendix-parts-preview.png`
  - `docs/design-references/source-admin-invoices-list-desktop.png`
  - `docs/design-references/source-admin-invoices-in-transit.png`
  - `docs/design-references/source-admin-invoices-arrived.png`
  - `docs/design-references/source-admin-invoices-search-result.png`
  - `docs/design-references/source-admin-invoices-no-result.png`
  - `docs/design-references/source-admin-invoices-cost-desktop.png`
  - `docs/design-references/source-admin-invoices-cost-unfilled.png`
  - `docs/design-references/source-admin-invoices-cost-archive.png`
  - `docs/design-references/source-admin-invoices-cost-month-filter.png`
  - `docs/design-references/source-admin-invoices-tablet.png`
  - `docs/design-references/source-admin-invoices-mobile.png`
  - `docs/design-references/source-admin-invoices-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper -> context-dependent unsafe upload CTA -> four KPI -> four tabs -> tab-specific content/modal`.

- H1: `Інвойси та документи`.
- Helper: `Керування інвойсами, контрактами та митними документами`.
- KPI: `Всього відвантажень 71`, `Готові до інвойсу 11`, `Немає даних 0`, `Сформовано 60`.
- Tabs: `Контракти`, `Додатки`, `Інвойси`, `Собівартість`.
- Context upload CTA:
  - Appendices: `Завантажити проформи`;
  - Invoices: `Завантажити VIN`;
  - Cost: `Завантажити документи`.
  All are unsafe and remained untouched.

## Contracts

Two source contracts are present and active:

| Contract | Parties | Status |
|---|---|---|
| `CR/DMS-01` | `CREATIVE TRADE GROUP -> ПП «ДНЕПРМАРИН СПОРТ»` | `Активний` |
| `DA/W-1` | `DIGITAL ADAMS LTD -> ТОВ ВАТЕРВЕЙЗ` | `Активний` |

Each card exposes `Деактивувати`, an unlabeled edit icon, `Дублювати`, and an unlabeled delete icon. Their immediate side effects were not proven safe, so none was clicked.

`Новий контракт` safely opens an inline create form without changing the two cards. Observed groups and fields:

- `Основні дані`: short contract number, full bilingual number/date;
- supplier name, representative and address;
- shipper name, tax identifier and address fields;
- buyer Ukrainian/English names, address, director and company identifier;
- `Умови`: delivery terms, currency, country of origin EN/UA.

Source defaults include `CR/DMS-01`, `№ CR/DMS-01 of/від 23.07.2025`, `FOB Houston, USA`, `US FUNDS / Долари США`, `Mexico` and `Мексика`. `Створити контракт` was disabled in the untouched preview. It was closed with `Скасувати`; a repeat DOM snapshot confirmed the form closed and both active contract cards remained.

## Appendices

Exact summary:

| Metric | Value |
|---|---:|
| `Додатки` | 23 |
| `Проформи` | 67 |
| `Загальна сума` | $2,790,479 |
| `Контейнери` | 59 |
| `Найближчий ETA` | 12.07 |

There are seven `DA-WAT` cards (`01`-`07`) and sixteen `CR-DMS` cards (`9`-`24`). Each card contains name, date, proforma/parts composition, shipment identifiers where available, ETA, a contract combobox, amount and actions `Просмотр`, `Таможня`, `Банк`, `Видалити`.

Representative observed cards:

| Appendix | Date | Composition | Shipment/ETA | Contract | Amount |
|---|---|---|---|---|---:|
| DA-WAT 01 | 18.02.2026 | 3 proformas | MEX 578/577/579; 10.03 | DA/W-1 | EUR 70,175 |
| DA-WAT 02 | 02.03.2026 | 1 proforma + 441 parts | PAC 03 + Spyders; 11.05 | DA/W-1 | EUR 24,553 |
| DA-WAT 07 | 03.04.2026 | 8 proformas | ETA `-` | DA/W-1 | EUR 246,930 |
| CR-DMS 10 | 12.01.2026 | 6 proformas | PWC 05-10; 09.03 / 03.04 | CR/DMS-01 | $393,600 |
| CR-DMS 12 | 09.02.2026 | 45 parts | PAC 01; 31.03 | CR/DMS-01 | $31,544 |
| CR-DMS 16 | 27.02.2026 | 18 parts | PAC 02; 03.07 | CR/DMS-01 | $12,311 |
| CR-DMS 18 | 04.03.2026 | 409 parts | PAC 04; 23.05 | CR/DMS-01 | $40,132 |
| CR-DMS 19 | 04.03.2026 | 197 parts | PAC 05; 18.05 | CR/DMS-01 | $34,994 |
| CR-DMS 24 | 15.03.2026 | 5 proformas | BRP 609-613; 15.06 | CR/DMS-01 | $156,665 |

Changing the contract combobox may persist an assignment; it was not changed. Customs/bank document buttons and delete were not clicked.

### Safe preview modal

`Просмотр` opens `Попередній перегляд документа` with helper `Перегляньте документ додатка перед генерацією`, bilingual appendix/contract metadata, consignee, address, delivery terms, a line-item table, buyer/supplier signatures, `Скасувати`, unsafe `Таможня DOCX` / `Банк DOCX`, and `Close`.

Two distinct source types were inspected:

| Type | Source | Rows and total |
|---|---|---|
| Units | DA-WAT 01 / DA-W-1, FOB Houston | 9 line items, quantity 24, EUR 70,175.00 |
| Parts | CR-DMS 12 / CR/DMS-01, FOB Montreal | 45 line items, quantity 863, $31,544.20 |

The parts preview uses columns `Description / Опис`, `Qty`, `Price, USD`, `Amount, USD`; the unit preview uses EUR. Both previews were closed only through `Скасувати`. After each close the DOM again contained 23 preview actions and no modal; no card, total or contract assignment changed.

## Invoices tab

Controls:

- search `Пошук інвойсів...` plus `Очистити` only while populated;
- filters `Всі (71)`, `В дорозі (36)`, `Прибув (35)`;
- grouped BL table with headers `Контейнер`, `Назва`, `Проформа`, `Одиниці`, `EUR`, `Готовність`, `Контракт`, `Додаток`, `Інвойс`, `Сума`, `Дії`;
- a second section `Сформовані інвойси 60`.

Source groups 71 shipments into 32 BL rows in `Всі`, 16 BL rows for the `В дорозі (36)` filter and 17 BL rows for `Прибув (35)`. The row action is `Сформувати BL`; it was not clicked because generation may execute immediately.

Representative grouped rows:

| BL | Containers/units | Readiness | ETA |
|---|---|---|---|
| 252108428 | 1 / 8 | `Готово` | Jan 29 |
| 252108918 | 3 / 19 | `2/3` | Feb 15 |
| 260101069 | 1 / 0 | `Готово` | Mar 31 |
| 262100130 | 7 / 56 | `Готово` | Mar 24 |
| 262102753 | 6 / 47 | `Готово` | Jun 8 |

Observed source inconsistency: rows under the active `В дорозі (36)` filter still render the textual chip `(Прибув)`. The clone should preserve the visible source copy while keeping filter state explicit; it must not silently reinterpret this as a status mutation.

Search `252108918` returns one BL group. Search `NO_SUCH_INVOICE_9000` removes the table and shows `Відвантажень не знайдено`; the 60 formed invoice cards remain visible, proving that search only filters the upper shipment/BL table.

Representative formed documents:

| Invoice | Container / units / total | Date |
|---|---|---|
| 1032239014 | OOCU9832002 / 8 / $26,752.00 | 22.05.2026 |
| 1032012219 | OOCU9460775 / 12 / $70,400.00 | 18.05.2026 |
| 1032050000 | FFAU6355567 / 12 / $75,200.00 | 18.05.2026 |
| 1032238995 | FANU1913021 / 6 / $33,536.00 | 17.05.2026 |

Every formed card exposes `Завантажити DOCX`; these download controls were not invoked.

## Cost (`Собівартість`)

The default active view contains 24 BL cards and KPI:

| KPI | Active value |
|---|---:|
| `Всього фрахт` | $84,934.84 |
| `Всього митниця` | $140,013.39 |
| `Всього брокер` | $1,224.82 |
| `Всього готівка` | $241,000.00 |
| `Всього витрати` | $467,173.05 |

Toolbar: unsafe `Експорт Excel`, month multi-filter `Всі місяці`, and views `Активні`, `Архів`, `Незаповнені`.

The month menu exposes `Обрати всі`, `Скинути`, and exact counts: Jan 2026 6, Feb 5, Mar 13, Apr 10, May 10, Jun 25, Jul 2.

- `Незаповнені`: 19 cards, all with `Є незаповнені витрати`.
- `Архів`: 8 cards, KPI $239,711.54 / $382,632.91 / $3,680.09 / $115,000.00 / $741,024.54, and `Відновити цей BL` on every card.
- Active cards expose `Архівувати цей BL`.

Each cost card shows BL, internal shipment label, ETA/arrival copy, goods EUR and converted USD at `@1.08`, freight, customs, broker, cash, total, cost percentage and completeness badge. Examples:

| BL / label | Goods | Freight / customs / broker / cash | Total / cost |
|---|---:|---|---:|
| 260101069 / PAC 01 | EUR 65,815 ($71,080) | - / - / - / $5,500 | $5,500 / 7.7% |
| 262100299 / PWC 09-10 | EUR 273,970 ($295,888) | $22,690.81 / $44,790.88 / $270.42 / $10,000 | $77,752.11 / 26.3% |
| 262100398 / PWC 07-08 | EUR 284,980 ($307,778) | $20,754.06 / $46,071.28 / $271.26 / $10,000 | $77,096.60 / 25.0% |

Archive/restore/export actions were never clicked. Their last safe point is the filtered card list with the unsafe CTA visible.

## State table

| Family | Populated | Search/filter/preview | Empty/error | Local requirement |
|---|---|---|---|---|
| Contracts | 2 active cards | new-contract preview | untouched create disabled | preview-only local form; final disabled |
| Appendices | 23 cards | unit and parts document previews | ETA may be `-` | exact types and close-only previews |
| Invoices | 32 grouped BL + 60 formed | 71/36/35, hit/miss search | `Відвантажень не знайдено` | working local filters/search |
| Cost | 24 active, 8 archive, 19 incomplete | month and three views | missing cost fields are `-` | working local filters; no mutation |
| Loading | no durable loading skeleton observed | filters settle client-side | none forced | do not invent source loading copy |
| Error | no route-level error observed | none forced | none | optional neutral local error boundary only |

## Safety boundary

Safe and inspected: tab switches, status filters, search/clear, month menu, active/archive/incomplete views, new-contract form preview through Cancel, Appendix preview through Cancel, responsive and theme.

Hard-blocked locally and never invoked in source:

- all three upload CTAs;
- contract create, deactivate, duplicate, edit and delete;
- changing an Appendix contract assignment;
- customs/bank document generation and all DOCX downloads;
- Appendix delete;
- `Сформувати BL`;
- Excel export;
- BL archive/restore;
- any save, external request or operational-state reducer.

## Responsive, dark and exact visual tokens

- Desktop 1440: persistent 256px admin sidebar and dense full-width tables/cards in the main region.
- Tablet 768: Appendix rows retain their dense column layout and horizontal clipping/overflow; fields are not transformed into cards.
- Mobile 390: the observed source currently renders the compact header while main invoice content is effectively outside the visible canvas/blank. This is a confirmed source responsive defect, not an assumption. The clone should keep content accessible rather than reproduce an unusable blank screen.
- Dark mode preserves orange selected-tab emphasis, green monetary totals and dark GitHub-like surfaces.
- Computed dark tokens: body/main background `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`, Inter stack, body 14px/20.3px; selected tab uses `rgb(249,115,22)`, orange 15% background, 8px 12px padding and 6px radius.
- Computed light tokens: body background `rgb(246,248,250)`, text `rgb(31,35,40)`, shared border `rgb(208,215,222)`.

## Clone acceptance

- Dedicated route component and typed models for contracts, appendices, document lines, BL shipment groups, formed invoices and cost cards.
- Tabs, status/search filters, month/status cost filters and both preview types work entirely locally.
- Preserve exact KPI, representative source rows, the 60-document count and source-visible status inconsistency.
- New-contract and document previews close without mutation.
- Every upload/generate/download/delete/save/archive/restore/export/assignment control is hard-disabled and has no operational callback, reducer or external request.

## User refinement lock — 2026-07-18

- Replace the route-local primary tabs and filter strips with `AdminTabs`, `AdminToolbar`, `AdminSearchField` and `AdminSegmentedControl` matching Ocean Freight.
- Every primary tab gets a local search surface appropriate to its evidenced fields: contracts, appendices, invoice/BL rows and cost/BL cards.
- Contract cards, appendices with observed preview data, grouped invoice rows, formed invoices and cost cards may open read-only detail previews. Preview entry points must be visually distinct from disabled mutation/download controls.
- Preview close must leave contracts, assignments, counts, totals, status, archive state and external data unchanged. Create/edit/copy/delete/download/generate/archive/restore/upload remain hard-disabled.
