# Admin Consignment — source specification

Status: source-observed on 2026-07-18 under the strict read-only rule.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/consignment`.
- Tabs, searches and status filters retain the route and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-consignment-desktop.png`
  - `docs/design-references/source-admin-consignment-network.png`
  - `docs/design-references/source-admin-consignment-requests.png`
  - `docs/design-references/source-admin-consignment-search-result.png`
  - `docs/design-references/source-admin-consignment-no-result.png`
  - `docs/design-references/source-admin-consignment-tablet.png`
  - `docs/design-references/source-admin-consignment-mobile.png`
  - `docs/design-references/source-admin-consignment-dark.png`

## DOM structure

`Admin shell -> heading/helper -> tab-specific search -> three view buttons -> view summary/actions -> dense stock matrix, network table, or request filters/result`.

- H1: `Консигнація`.
- Helper: `Складські залишки по мережі, заявки дилерів, переміщення 1С`.
- Views: `Весь склад`, `Мережа`, `Заявки`.
- Stock/network search placeholder: `Фільтр за артикулом або описом…`.
- Requests search placeholder: `Пошук за заявками, дилером, посиланням 1С…`.

## Real source data

### Entire warehouse

- Summary: `1246 запчастин · 16 дилерів`.
- Action: `Експорт CSV`.
- The dense matrix columns are `Артикул`, `Опис`, `Разом`, followed by all 16 holders:
  - `ЧП Сингл Салон NEW`;
  - `BRP Вышгород`;
  - `BRP Днепр`;
  - `BRP Житомир`;
  - `BRP Запорожье (Парк-С)`;
  - `BRP Запорожье (Элитспорт)`;
  - `BRP Киев`;
  - `BRP Киев (Логос)`;
  - `BRP Львов`;
  - `BRP Мукачево`;
  - `BRP Одесса`;
  - `BRP Полтава`;
  - `BRP Харьков`;
  - `BRP Херсон`;
  - `BRP Черкассы`;
  - `BRP Чернигов`.
- Representative source rows:

| Part | Description | Total | Non-zero holders |
|---|---|---:|---|
| `219400168` | `REAR RT TOPCASE BAG KIT` | 1 | BRP Киев 1 |
| `219400764` | `LUGGAGE RACK R KIT` | 4 | Вышгород 1, Днепр 1, Запорожье (Парк-С) 1, Харьков 1 |
| `219400841` | `SMARTPHONE SUPPORT KIT` | 3 | Киев 1, Киев (Логос) 1, Полтава 1 |
| `219400869` | `SPOILER TRIM BLACK` | 3 | Днепр 1, Запорожье (Парк-С) 1, Киев 1 |
| `2859420684` | `FREEDOM PFD (US/CA) MEN M` | 1 | Одесса 1 |

The source renders the matrix as a horizontally scrollable dense region. The observed DOM exposes stock cells as read-only generics; a row does not expose a button, link, drawer or detail URL.

### Network

- Summary: `200 позицій · 270 од.` and `Показано 200 з 1246`.
- Semantic table columns: `Артикул`, `Опис`, `Разом`, `Тримачі`.
- Holder chips combine dealer and quantity, e.g. part `219400764` has four holder chips and part `219400841` has three.
- The 200-row cap is a source presentation limit, not numbered pagination; no pagination control is exposed.

### Requests

- Status chips: `Очікування`, `Схвалено`, `Виконано`, `Відхилено`, `Скасовано`, `Всі`.
- `Оновити` is present.
- Every one of the six status filters produced `Немає заявок з цим статусом.`; no request card, 1C transfer link, detail, timeline or confirmation form exists in the current source data.

## Interaction and state matrix

| State | Observed source result | Required local behavior |
|---|---|---|
| Entire warehouse | 1246-part/16-dealer matrix | Horizontal scroll, fixed identifiers, read-only quantities |
| Network | first 200 positions, 270 units | Holder-chip table and source cap copy |
| Requests / six statuses | empty in every status | Working local status chips and exact empty copy |
| Search hit `219400764` | one part, total 4 with four holders | Match number or description |
| Search miss | `0 запчастин · 16 дилерів`; headers remain, no separate empty illustration | Preserve table headers and count |
| Clear search | exact baseline restored | Local state only |
| Loading | not deliberately induced | Optional read-only skeleton |
| Error | not deliberately induced | Optional non-operational error surface |
| Request detail/confirmation | absent | Do not invent as source evidence |

No search/tab/filter state changes the URL.

## Safe and unsafe boundaries

Safe and observed:

- all three views;
- part-number/description search and clear;
- all six request status filters;
- responsive and theme controls.

Not triggered or unsafe:

- `Експорт CSV`, because the first click immediately starts a download rather than a preview;
- `Оновити`, because a refresh was not needed to establish UI semantics;
- any request approval/rejection/cancellation or 1C transfer;
- editing any stock quantity, holder or status;
- direct operational POST/PUT/PATCH/DELETE.

The local clone may render `Експорт CSV` and `Оновити` as hard-disabled controls. It must not create a download or external request.

## Responsive and theme behavior

- Desktop 1440: persistent sidebar; the dense matrix consumes the main 1184px content region and scrolls horizontally within it.
- Tablet 768 and mobile 390: shared compact admin banner replaces the sidebar; the matrix remains a wide scrollable surface rather than collapsing dealer quantities into invented cards.
- Tabs and summary/action controls wrap above the matrix at narrow widths.
- Dark mode preserves the dense matrix hierarchy and swaps semantic surfaces/text/borders without changing counts.

## Exact visual tokens

Captured at 1440px/light:

- H1: `30px / 36px`, weight `700`, `rgb(31,35,40)`.
- Main content region: `1184px` wide; background `rgb(246,248,250)`.
- Tab control height: `36px`; horizontal padding `8px` on the observed Requests button.
- Search content box in the compact toolbar: `154px × 36px`, right padding `28px` for the clear affordance.
- Shared light border token: `rgb(208,215,222)`; page text: `rgb(31,35,40)`.
- Dense grid uses tabular, compact cells and a horizontal overflow container; no card shadow is present in the observed table family.

## Clone acceptance

- Use a route-specific consignment component and typed read-only stock/holder/request models.
- Implement all three tabs, number/description search, hit/miss/clear states, six request status filters and horizontal responsive matrix behavior.
- Preserve source counts and representative rows; do not pretend the local representative fixture contains all 1246 records.
- Label a representative subset in the clone while retaining source totals.
- Export/refresh and all transfer/approval/rejection/cancellation actions are hard-disabled and have no effect, request, reducer or callback that mutates operational state.

## User refinement lock — 2026-07-18

- Replace the route-local underline tab strip and detached search with the shared Ocean Freight control grammar.
- On desktop, search and `Весь склад / Мережа / Заявки` occupy one contained `AdminToolbar`; narrow layouts may wrap without changing order.
- Use `AdminSearchField`, compact `AdminTabs` and `AdminSegmentedControl` for request statuses.
- Preserve all existing counts, filters, horizontal matrix behavior and safety boundaries. This is a presentation migration, not a change to consignment logic.
