# Admin Ocean Freight — source specification

Status: source-observed on 2026-07-18. The page was researched with strict no-final-action rules. One ambiguous date chip produced a source-side status change; that incident is recorded below and in `SOURCE_TEST_RECORDS.md`.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/ocean-freight`.
- Tabs, grouping, view toggles, filters, and dialogs do not change the URL and add no query parameters.
- Desktop: `docs/design-references/source-admin-ocean-freight-desktop.png`.
- Card view: `docs/design-references/source-admin-ocean-cards.png`.
- Document upload preview: `docs/design-references/source-admin-ocean-upload-preview.png`.
- Ground-delivery create preview: `docs/design-references/source-admin-ocean-ground-preview.png`.
- Existing equipment receipt: `docs/design-references/source-admin-ocean-income-preview.png`.
- New equipment receipt: `docs/design-references/source-admin-ocean-create-income-preview.png`.
- Parts receipt: `docs/design-references/source-admin-ocean-parts-income-preview.png`.
- Parts-receipt tabs:
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-composition.png`
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-blockers.png`
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-link.png`
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-create-1c.png`
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-transfer.png`
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-check.png`
  - `docs/design-references/source-admin-ocean-parts-receipt-tab-price.png`
- User clarification for BL-level receipt placement: `docs/design-references/user-source-ocean-bl-receipt-action.jpg`.
- Ambiguous ETA/date-chip region: `docs/design-references/source-admin-ocean-eta-control.png`.
- Mobile, tablet, dark: `source-admin-ocean-freight-mobile.png`, `source-admin-ocean-freight-tablet.png`, `source-admin-ocean-freight-dark.png`.

## Source integrity incident

The first desktop capture showed `Total BLs 32`, `In Transit 37`, `Containers 71`, `Arrived 34`. A first click on a chip labelled `Jun 8 (Arrived)` was expected to open a preview but executed directly. After reload the page showed `32 / 36 / 71 / 35`. No order was approved or moved; `LOG-01` remained `New`. No self-directed rollback was attempted. During the later tab-completeness pass, the page already rendered `32 / 35 / 71 / 36` before any new ETA/status control was touched. Only BL disclosures, the table-view switch, the previously verified PAC 05 receipt preview and its inert tabs were used in that pass, so the later drift is recorded as concurrent/live demo state rather than attributed to those read-only interactions.

Consequences for this specification:

- the implementation evidence lock remains `32 / 36 / 71 / 35`; the final live read-only check showed `32 / 35 / 71 / 36`;
- the before/after values are retained as evidence of the unsafe control;
- all ETA/date chips and `Оновити ETA` are now classified as direct-mutation/unsafe;
- the local clone must never reproduce that side effect.

## DOM and page structure

1. Heading `Морські перевезення` and helper `Відстеження контейнерів та розподіл техніки`.
2. Header actions `Завантажити документи`, `Оновити ETA`.
3. Tabs: `Морські перевезення`, `Наземна доставка`, `Техніка дилерів`.
4. Ocean tab:
   - four KPI cards;
   - search and status select;
   - `Прихід техніки`, `Групувати за BL`;
   - table/card view switch;
   - grouped BL/container collection.
5. Ground tab: empty state and create dialog.
6. Dealer equipment tab: dealer selector, search, year/type/status filters, and a 15-row equipment table.
7. Read-only document and receipt dialogs.

## Ocean tab data

Current KPI values are `Total BLs 32`, `In Transit 36`, `Containers 71`, `Arrived 35`. The initial evidence was `32 / 37 / 71 / 34` before the unsafe chip incident.

Toolbar:

- search: `Пошук контейнера, BL, проформи...`;
- status options: `Всі статуси`, `В дорозі`, `Скоро прибуття`, `Прибув`, `Доставлено`;
- controls: `Прихід техніки`, `Групувати за BL`, `Таблиця`, `Картки`;
- result count: `71 / 71` containers in the unfiltered state.

Observed BL groups include `252108428`, `252108537`, `252108627`, `262102753`, `262102785`, `260101267`, `262102090` and others. Group badges include `Прибув`, `В дорозі`, and `Змішаний`. Container rows expose container number, `Units` or `Parts`, proforma, EUR value, assigned/total count, a read-only receipt/posting status, arrival/ETA, and status. The actionable receipt/posting preview belongs to the BL/коносамент group header, not to each container. This placement is an explicit user requirement backed by the supplied full-table capture.

Card view presents the same data as BL cards with status, container count, carrier/route information, and ETA.

## Dialog and detail fields

### Document upload preview

- Title: `Завантаження документів відправки`.
- Copy: `BL + Проформи (1-10 файлів). Автовизначення типу документа.`
- PDF drag/drop region.
- No file was selected and no upload was performed.

### Ground delivery

- Empty copy: `Поки немає наземних постачань. Додайте за проформою.`
- Action: `Додати наземну`.
- Dialog title: `Додати наземне постачання`.
- Fields: proforma PDF, proforma number, optional shipment name, optional ETA.
- Repeating equipment fields: model code, model, quantity, EUR price, `Додати модель`.
- Final `Створити постачання` was not clicked.

### Existing equipment receipt

- Dialog: `Створити прибуткову` for BL `262102090`.
- Commercial EUR/USD rate.
- 16 units, total EUR 236,340.
- Existing document `PN-00000047`, status `ПН создана, не проведена`.
- Grouped containers and tables for model, VIN, engine, EUR and USD.
- Repeated creation/check/post actions are disabled or blocked.

### New equipment receipt

- Dialog for BL `262102785`.
- 37 units, total EUR 523,920.
- Editable display names, grouped containers and proformas.
- Final `Підтвердити та створити` remained disabled and was not invoked.

### Parts receipt

- Dialog `Подготовка ПН запчастей`, `OCEAN · PAC 05`.
- Existing `PN-00000037`, created but unposted.
- Metrics: 191/197 lines, 2,551 quantity, EUR 66,710.51, 197/197 mapped; zero blocked/link/create/transfer/price issues.
- Tabs: composition, blockers, link, create in 1C, transfer, check, price. Each tab was selected independently in the later completeness pass.
- Table fields: article, name, 1C card, folder, quantity, EUR.
- Composition shows the 191-line table. Each of Blockers, Link, Create in 1C, Transfer, Check and Price independently selects its own state and shows `ПОЗИЦИИ ПОДГОТОВКИ / Нет позиций в выбранной группе` because every count is zero.
- Final operational actions were not invoked; the dialog was closed.

## Dealer equipment tab

- Default dealer: `BRP Вышгород`.
- Search: `Пошук: VIN, № двигуна, модель, код`.
- Year options include all years and 2026.
- Type filters: `ATV`, `SSV`, `PWC`, `3WV`.
- Status counts: `Assigned 15`; Warehouse, Reserved, Demo, Service and Sold are 0.
- Fifteen rows expose dealer, code, model, VIN/engine, year, status, shipment, client, and date.

## State table

| State | Source result | Evidence |
|---|---|---|
| Ocean/table | 32 BLs, 71 containers, grouped rows | desktop, mobile, tablet |
| Ocean/cards | BL cards with route/status/ETA | cards |
| Grouped by BL | Group headers plus nested containers | desktop DOM |
| Status filter | Five values available | DOM inventory |
| Document preview | PDF dropzone, no upload | upload preview |
| Ground/empty | No ground shipments | ground preview |
| Ground/create | Proforma and equipment form | ground preview |
| Dealer equipment/populated | 15 Assigned rows | DOM inventory |
| Existing equipment receipt | PN-00000047, unposted | income preview |
| New equipment receipt | 37-unit preflight | create-income preview |
| Parts receipt | PN-00000037, 191/197 lines | parts-income preview |
| Parts receipt / Composition | 191-line table | parts-receipt-tab-composition |
| Parts receipt / Blockers | 0; independent empty group | parts-receipt-tab-blockers |
| Parts receipt / Link | 0; independent empty group | parts-receipt-tab-link |
| Parts receipt / Create in 1C | 0; independent empty group | parts-receipt-tab-create-1c |
| Parts receipt / Transfer | 0; independent empty group | parts-receipt-tab-transfer |
| Parts receipt / Check | 0; independent empty group | parts-receipt-tab-check |
| Parts receipt / Price | 0; independent empty group | parts-receipt-tab-price |
| Loading | `Завантаження відправок...` appears transiently before data | DOM capture |
| No-result | Search/filter can reduce the collection; exact copy not captured | partially verified |
| Network error | Not induced | blocked |

## Safe and unsafe boundaries

Safe and observed:

- the three tabs;
- status/search/grouping/table/card state;
- dealer/year/type/status filters;
- opening document, ground-delivery, equipment-receipt, and parts-receipt previews;
- closing with Cancel/X/Close without final submission;
- responsive and theme controls.

Unsafe:

- every ETA/date/status chip, including `Jun 8 (Arrived)`, because the first click can execute directly;
- `Оновити ETA`;
- selecting/uploading a file;
- `Підтвердити та створити`, `Створити постачання`, post/check/create/transfer in 1C;
- any Save, Apply, Sync, Send, Approve, Cancel, Delete, Change status, receipt, warehouse, or shipment operation.

The local clone may open all previews, but final CTAs are hard-disabled and no handler may alter operational status, counts, ETA, documents, or 1C state.

## Responsive and theme behavior

- Desktop 1440: 1184px main region with persistent sidebar.
- Tablet 768: sidebar collapses to `Меню`; global search is a button; main content uses the full viewport.
- Mobile 390: compact BRP wordmark, no persistent sidebar, stacked actions/tabs/KPIs. The grouped container collection renders as BL cards rather than an unreadable desktop table.
- Dark mode uses `html.dark`, surface `#0d1117`, primary text `#e6edf3`.

## Exact visual tokens

- Inter; heading 30/36px, 700.
- Main body 15/21.75px.
- Light main `#f6f8fa`; primary `#1f2328`; secondary `#656d76`; border `#d0d7de`.
- Main width at 1440: 1184px.
- Ocean tablist: 445px × 49px, 1px border, 6px radius, 4px padding and gap, translucent `#f6f8fa` background.
- Ocean search: 269px × 40px, 13px, 1px border, 6px radius, 36px left icon inset.
- Table/card rows use 13px compact text and 6px radii.

## Clone acceptance

- Implement a dedicated `AdminOceanFreightPage` with typed BL, container, equipment, document, manifest and receipt-preview models.
- Working tabs, search, status filter, group toggle, table/card switch, dealer filters, and modal previews.
- Render one receipt/posting preview action beside the relevant BL/коносамент heading. Container rows may display status only and must not duplicate the action.
- Keep the implementation evidence lock `32 / 36 / 71 / 35`; retain both the original incident and the later live `32 / 35 / 71 / 36` drift in documentation rather than silently rewriting historical captures.
- No ETA/date/status button may mutate state. A local click can at most open a disabled informational preview.
- Receipt and upload dialogs must expose the observed data and keep every final operational control disabled.
