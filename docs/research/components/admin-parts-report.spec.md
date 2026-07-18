# Admin Parts Report — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. Every period preset, the manager list, Apply behavior and the representative order-detail link were inspected. No report synchronization, export, order action or source data mutation was performed. Source account/contact identifiers are redacted from evidence and excluded from clone fixtures.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/parts-report`.
- Filter, period and Apply state keep the base URL and add no query parameters.
- A report order code is a safe GET link to `/admin/orders/<opaque-order-id>`; the source identifier is intentionally not retained in documentation or fixtures.
- Evidence:
  - `docs/design-references/source-admin-parts-report-desktop.png`
  - `docs/design-references/source-admin-parts-report-manager-menu.png`
  - `docs/design-references/source-admin-parts-report-tablet.png`
  - `docs/design-references/source-admin-parts-report-mobile.png`
  - `docs/design-references/source-admin-parts-report-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper + Refresh -> date/manager filter panel -> six period presets -> data-control notice -> four KPI cards -> Orders table -> RN table -> exact-linked Payments table`.

- H1: `Звіт ЗЧ`.
- Helper: `Замовлення, РН та оплати за менеджером і періодом`.
- Enabled source header action: `Оновити`.
- The route has no tabs, search, sort or pagination in the observed one-order state.
- There is no Excel action in the source evidence.

## Filter controls

- `З дати` date input.
- `По дату` date input.
- `Менеджер` custom combobox with trigger `Усі менеджери`.
- `Застосувати`.
- Six quick period buttons: `День`, `Тиждень`, `Декада`, `Місяць`, `3 місяці`, `Рік`.

The manager list contains six options: `Усі менеджери` plus five source manager/account entries. Those account labels are product data requiring no login-capable identity fidelity; they are redacted in evidence and must be replaced by synthetic display-only managers locally.

Apply is a read-only report query. It was safely tested with the Day preset: URL remained unchanged and the one order/$13.09 result remained. Month was then selected/applied to restore the initial state.

`Оновити` was not clicked because its exact refresh/synchronization boundary is not evidenced. Locally it must be disabled and perform no request.

## Every period preset

Every preset was clicked separately. It changes the two date inputs while retaining the current report result.

| Preset | From | To |
|---|---|---|
| `День` | 2026-07-18 | 2026-07-18 |
| `Тиждень` | 2026-07-12 | 2026-07-18 |
| `Декада` | 2026-07-09 | 2026-07-18 |
| `Місяць` | 2026-06-19 | 2026-07-18 |
| `3 місяці` | 2026-04-20 | 2026-07-18 |
| `Рік` | 2025-07-19 | 2026-07-18 |

Baseline/return state is Month: 2026-06-19 through 2026-07-18.

## Data-control notice and KPI

Notice title: `Контроль даних`.

Copy: `Пов'язані оплати не знайдені. Звіт не підставляє оплати приблизно за взаєморозрахунками дилера.`

| KPI | Value | Helper |
|---|---:|---|
| `Замовлення` | `$13.09` | `1 замовлень` |
| `Отримано за РН` | `$0.00` | `0 РН` |
| `Оплати за точними зв'язками` | `$0.00` | `0 платежів` |
| `Пов'язаний залишок USD` | `$0.00` | `без припущень на рівні дилера` |

The currency is source-rendered USD, not EUR.

## Three tables

### Orders

Section: `Замовлення менеджера`.

Columns: `ЗАМОВЛЕННЯ`, `ДАТА`, `ДИЛЕР`, `ХТО РОЗМІСТИВ`, `МЕНЕДЖЕР`, `ПОЗИЦІЙ`, `СУМА`.

One representative row:

- order `LOG-01`, source status `new`;
- date `18.07.2026, 01:40`;
- dealer `Logos`;
- manager `Не указан`;
- one position;
- `$13.09`.

The source placer identity/contact is redacted and must be synthetic locally. `LOG-01` is a normal order-detail link; safe navigation confirmed that it opens the matching `/admin/orders/:id` detail and changes no source state.

### RN/invoices

Section: `РН / накладні за цими замовленнями`.

Columns: `РН`, `ЗАМОВЛЕННЯ`, `ДАТА`, `СТАТУС`, `К-СТЬ`, `СУМА`.

Durable empty row: `Немає пов'язаних РН за вибраний період`.

### Exact-linked payments

Section: `Оплати з точним зв'язком`.

Columns: `ДОКУМЕНТ`, `ДАТА`, `ЗВ'ЯЗОК`, `КОМЕНТАР`, `СУМА`.

Durable empty row: `Немає оплат з точним зв'язком по РН/замовленню`.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Month baseline | one order, 0 RN, 0 payments | exact KPI/tables and synthetic placer |
| Six period presets | exact date pairs | every button works locally |
| Manager menu | All + five source accounts | All + five synthetic non-login identities |
| Day + Apply | same one-order result | local read-only filter application |
| Order link | GET order detail | safe local representative order route |
| RN empty | source empty row inside table | exact copy |
| Payments empty | source empty row inside table | exact copy |
| Refresh | source enabled, boundary ambiguous | hard-disabled locally |
| Loading/error | no durable state forced | do not invent sync/error results |

## Safety boundary

Safe and inspected: all six periods, manager menu open/close, Day Apply, representative order GET navigation, responsive layouts and theme.

Unsafe/not invoked:

- `Оновити`, because it may cross into refresh/synchronization behavior;
- choosing a source manager identity beyond the All option;
- any order action after following the detail link;
- any direct mutation/export/sync request.

Locally dates, synthetic manager choice and Apply may affect only the rendered report preview. Refresh is disabled with no handler; report state never changes an order or payment.

## Responsive, dark and exact tokens

- Desktop 1440: persistent 255px sidebar; 1141px full page; filter controls share a compact row; six presets wrap below; KPI form a four-column row; three wide tables stack.
- Tablet 768: compact top header; filters and period buttons wrap; KPI/tables retain hierarchy.
- Mobile 390: page height 1886px; date/manager controls and presets stack/wrap; KPI stack; all three tables remain horizontal-scroll surfaces (980px, 880px and 980px) inside a 356px viewport rather than transforming into cards.
- Dark mode preserves blue/green/orange KPI accents, dark form controls and dense table borders.
- Measured light: body `rgb(246,248,250)`, text `rgb(31,35,40)`, border `rgb(208,215,222)`; H1 24px/32px weight 700; date and manager controls 32px, 13px/18.57px weight 500, `rgb(234,238,242)`, 6px radius; Apply 32px, 13px, 6px radius; period button 28px, 11px/14.67px; table header 13px family.
- Measured dark: body `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`; H1 remains 24px/32px; date/manager background `rgb(1,4,9)`, 12px; Apply 12px; period background `rgb(22,27,34)`; table header 12px/17.14px.
- Shared font: `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

## Clone acceptance

- Dedicated route component and typed period, synthetic manager, KPI, order, RN and payment models.
- All six periods, manager menu and Apply work locally without external requests.
- Exact one-order/$13.09, zero-RN and zero-payment source state is represented without storing source account identifiers.
- Order link opens a safe local detail route; Refresh is hard-disabled.
- No Excel action, guessed dealer-level payment or generic order-store aggregation is substituted for this evidence-backed report.
- Desktop/tablet/mobile and light/dark preserve the observed filter/KPI/table hierarchy.
