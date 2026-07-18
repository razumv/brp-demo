# Admin Schedule — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. Excel open/export and synchronization actions were never invoked.

## Source and evidence

- URL: `https://brp-dev1.k8s.artemahr.tech/admin/schedule`; all tabs, pagination, selection and search retain the URL without query parameters.
- Evidence:
  - `docs/design-references/source-admin-schedule-desktop.png`
  - `docs/design-references/source-admin-schedule-slot-detail.png`
  - `docs/design-references/source-admin-schedule-page-2.png`
  - `docs/design-references/source-admin-schedule-slot-detail-page-2.png`
  - `docs/design-references/source-admin-schedule-search-result.png`
  - `docs/design-references/source-admin-schedule-no-result.png`
  - `docs/design-references/source-admin-schedule-stock.png`
  - `docs/design-references/source-admin-schedule-tablet.png`
  - `docs/design-references/source-admin-schedule-mobile.png`
  - `docs/design-references/source-admin-schedule-dark.png`

## Page structure and KPI

`Admin shell -> H1/actions -> four KPI -> delivery chronology -> Deliveries/Stock tabs -> footer freshness/counts`.

- H1: `Графік доставки`.
- Unsafe actions: `Відкрити Excel`, `Синхронізувати`.
- KPI:
  - `Прибуває цього місяця 0`;
  - `Прострочена оплата 20`;
  - `Усього одиниць у графіку 356 / 14 вільно`;
  - `На складі зараз 33 од.`.
- Footer: `Остання перевірка 07.06 20:45`, `Остання синхр. 07.06 20:45`, `23 слотів`, `92 позицій`, `33 на складі`.

## Chronology

`Хронологія доставок` shows legend `Прибуло`, `В дорозі`, `Майбутні`, a configurable month axis and `Сьогодні` marker. The source-observed dated groups are: Jun 3 ATV 33 and SSV 2; Jun 5 PWC 36 and ATV 16; Jun 8 SSV x2 / 9 and ATV 38; Jun 12 PWC 24; Jun 15 ATV 36, SSV 8 and PWC x3 / 38; Jun 21 ATV 10 and SSV x2 / 4; Jun 28 ATV 8.

### Chronology refinement lock (2026-07-18)

- Source captures remain the structural authority: chronology is a page-level overview after KPI and before tabs, so search, pagination, category filters, slot selection and the Stock tab do not replace or filter it.
- Primary visual direction: Refero Orderful `9c657624-4aa8-4688-a6be-4eb3d6f2ce57` — white operational canvas, thin borders and restrained orange emphasis.
- Secondary craft: shadcn `c14c0a94-1037-449e-bf5b-4cb972656ac7` for compact 8px rhythm; Operate `a0f473eb-0310-4df5-b5f6-5bc124ad5954` for a light ledger/grid treatment.
- Concrete schedule patterns: Understory `b3e53a84-9852-4257-9164-60dd97cf5ed0` for a calm date-first agenda, Sunsama `7a9afeca-9bb2-4b73-afcf-82a9c2b80e52` for compact grouped schedule rows, and Linear `ca93c49f-8e22-4510-bbce-dabce69e8140` for restrained metadata hierarchy.
- Default context is six months before and two months after the reference current month. A collapsed `Період` control immediately beside the title opens compact steppers for past context from 0–12 months and future context from 0–6 months.
- The chronology deliberately separates overview from detail. A full-width month rail shows equal temporal divisions, exact day ticks inside months that contain deliveries, monthly group/unit totals, and one current-day marker. Below it, a compact ledger groups the same visible deliveries by real arrival date.
- There are no card-to-axis connectors or alternating visual lanes. Changing the period updates the month rail, day ticks and dated ledger from the same filtered collection, so no delivery can remain visible outside the selected interval.
- Desktop fits dated groups into a calm responsive grid. Mobile retains the same date-grouped information model in one column while the month rail scrolls horizontally; it is not a separate or reduced data representation.
- Timeline events are a dedicated typed source fixture derived from all 23 source rows across both delivery pages. The six future rows without an arrival date are intentionally excluded from the dated chronology until the source supplies a date.

## Deliveries tab

- Category filters: `Усі`, `PWC`, `ATV`, `SSV`, `3WV`.
- Search: `Пошук SKU або моделі...`.
- Heading: `Слоти доставки (23)`.
- Columns: `Назва`, `Статус`, `Прибуття`, `Вільно`.
- Main pagination: four pages; page 1 contains seven rows and page 2 was verified.

Representative page-1 slots:

| Slot | Payment due | Status | Arrival | Free/total |
|---|---|---|---|---:|
| PWC March 2026 #1 | 20.02.2026 | Прибуло | 12.06.2026 | 0/24 |
| ATV February 2026 #1 | 20.02.2026 | Прибуло | 03.06.2026 | 1/33 |
| PWC March 2026 #2 | 20.02.2026 | Прибуло | 05.06.2026 | 0/36 |
| ATV February 2026 #2 | 20.02.2026 | Прибуло | 05.06.2026 | 0/16 |
| SSV March 2026 | 20.03.2026 | Прибуло | 03.06.2026 | 0/2 |
| SSV April 2026 #1 | 20.04.2026 | Прибуло | 08.06.2026 | 0/6 |
| ATV April 2026 #1 | 20.04.2026 | Прибуло | 21.06.2026 | 2/10 |

Rows are inline selectors, not links or modals. Selecting PWC March 2026 #1 opens a detail panel with arrival 12.06.2026, payment 20.02.2026 and a paginated `SKU / Модель / Усього / Вільно` table (two pages).

Observed first-page lines include:

- 23TB RXP X 325 - Gulfstream Blue Premium, 5 / 0;
- 22TF RXT X 325 - Ice Metal / Manta Green, 2 / 0;
- 25TB GTX PRO 130 (Rental) - White / Neo Mint, 1 / 0;
- 26TB GTX Limited 325 - Teal Metallic, 2 / 0;
- 67TC Spark Trixx 90 For 1, 2 / 0;
- 67TD Spark Trixx 90 For 1, 3 / 0;
- 66TC Spark Trixx 90 For 3, 3 / 0.

Detail page 2 contains 66TD Spark Trixx 90 For 3 - Gulfstream Blue / Orange Crush, 4 / 0. Totals sum to 24 and no free units.

### Search

Search is global across slot line items and settles after a debounce:

- `23TB` replaces the normal split view with `Результати: "23TB"` and one row: RXP X 325, slot PWC March 2026, arrival 12.06.2026, 5 / 0;
- `NO_SUCH_MODEL_9000` shows `Результати: "NO_SUCH_MODEL_9000"` and `Позиції не знайдено`.

## Warehouse stock tab

The populated table has columns `Модель`, `Категорія`, `Розташування`, `Усього`, `Зарезервовано`, `Вільно`.

Observed categories include 3WV, ATV, SSV, Ski-Doo and Spyder. Representative rows:

- CANYON REDROCK 1330 ACE SE6 EUR Moss Green Satin 25; 3WV; Dnipro BRP Centre; 1 / - / 1;
- Outlander MAX Electric White CE 26; ATV; Dnipro warehouse; 5 / - / 5;
- Defender X MR HD11 Loft Green Satin 26; SSV; Dnipro warehouse; 1 / - / 1;
- Expedition SE 900 ACE Turbo R; Ski-Doo; Kyiv BRP Centre 3 plus Mukachevo 2; 5 / - / 5;
- Rally 2026; Spyder; Lviv BRP Centre; 4 / - / 4.

## State and safety table

| State | Source result | Local requirement |
|---|---|---|
| Deliveries baseline | 23 slots, page 1/4 | exact KPI and representative rows |
| Slot selected | inline two-page detail | local selection and pagination |
| Main page 2 | distinct seven-slot page | working local pagination |
| Search hit | one global model result | debounce not required, result required |
| Search miss | `Позиції не знайдено` | stable no-result |
| Stock | populated multi-category table | accessible responsive table |
| Loading/error | no durable source copy forced | do not invent operational errors |

Safe: tabs, category filters, slot selection, both paginations, search, responsive and theme. Hard-blocked and never invoked: `Відкрити Excel`, `Синхронізувати`, and any external sync/export/request.

## Responsive, dark and tokens

- Desktop 1440: chronology and four KPI above a two-column list/detail layout.
- Mobile 390: compact header, actions become full-width, KPI become a 2x2 grid, chronology scales down, and stock remains horizontally scrollable.
- Tablet retains the same hierarchy with stacked controls where required.
- Dark mode preserves timeline legend, status badges and table hierarchy.
- Shared measured tokens: light `#f6f8fa/#1f2328/#d0d7de`; dark `#0d1117/#e6edf3/#30363d`; H1 30px/36px weight 700; selected tab orange accent with 6px radius.

## Clone acceptance

- Dedicated route component and typed slot, slot-line, chronology-event and stock models.
- Chronology remains visible and unchanged above both tabs, including search hit/miss and paginated states.
- Category filters, search hit/miss, slot selection, main/detail pagination and stock tab work locally.
- Exact KPI/footer counts and representative data are preserved.
- Excel/sync actions are hard-disabled and there is no network request or operational mutation path.
