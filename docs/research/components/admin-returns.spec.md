# Admin Returns — source specification

Status: source-observed on 2026-07-18. The list and create form were inspected read-only; no draft was created.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/returns`.
- Status/search/form state adds no query parameters.
- Evidence:
  - `docs/design-references/source-admin-returns-desktop.png`
  - `docs/design-references/source-admin-returns-create-preview.png`
  - `docs/design-references/source-admin-returns-create-populated.png`
  - `docs/design-references/source-admin-returns-mobile.png`
  - `docs/design-references/source-admin-returns-create-mobile.png`
  - `docs/design-references/source-admin-returns-dark.png`

## DOM structure and baseline data

`Admin shell -> H1/helper/create CTA -> list search -> six status chips/refresh -> list or empty result -> create dialog when opened`.

- H1: `Повернення`.
- Helper: `Товар, який дилери фізично повернули — оформлення, затвердження, синхронізація з 1С.`
- Primary CTA: `Оформити повернення`.
- Search: `Пошук за поверненням, дилером, замовленням, нотаткою...`.
- Status filters: `Чернетка`, `Затверджено`, `Закрито`, `Відхилено`, `Скасовано`, `Усі`.
- Secondary action: `Оновити`.
- Every status and search miss shows `Повернень не знайдено.` No return card, identifier, detail, approval dialog, timeline or 1C-sync result is present in the current source list.

## Create-return form

Title: `Оформити повернення від дилера`.

Helper: `Оберіть дилера, відмітьте позиції до повернення, вкажіть стан та кількість.`

The first safe state contains:

- dealer select, initially `— оберіть дилера —`;
- optional note `Примітка (опційно)` with placeholder `Що менеджеру варто знати про це повернення.`;
- selection total `0 позицій · 0 шт`;
- `Скасувати`;
- disabled `Створити чернетку`.

There are 20 dealer choices. Selecting a dealer only loads eligible read-only line data into the unsaved form. Observed availability:

| Dealer | Available lines |
|---|---:|
| BRP Вышгород (VYS) | 8 |
| BRP Днепр (DNE) | 10 |
| BRP Житомир (ZHY) | 6 |
| BRP Запорожье (Парк-С) (ZAP-P) | 0 |
| BRP Запорожье (Элитспорт) (ZAP-E) | 3 |
| BRP Киев (KIE-ST) | 24 |
| BRP Киев (Логос) (KIE-L) | 1 |
| BRP Львов (LVV) | 12 |
| BRP Мукачево (MUK) | 8 |
| BRP Одесса (ODE) | 7 |
| BRP Полтава (POL) | 5 |
| BRP Ровно (RVN) | 9 |
| BRP Харьков (KHA) | 10 |
| BRP Херсон (KS) | 5 |
| BRP Черкассы (CHK) | 6 |
| BRP Чернигов (CHN) | 0 |
| BRP центр Черкассы 2 (CHK-2) | 1 |
| Logos (LOG) | 0 |
| Сервис Логос-спорт М (LSM) | 3 |
| ЧП Сингл Салон NEW (SSN) | 3 |

Zero-availability copy: `Немає складських позицій, доступних для повернення цим дилером.`

### Populated dealer state

For `BRP Киев (KIE-ST)`, the table exposes 24 eligible lines with columns: checkbox, `Замовлення`, `Запчастина`, `Доступ.`, `Ціна ($)`, `К-сть`, `Стан`.

Representative rows:

| Order | Part | Description | Available | Price USD |
|---|---|---|---:|---:|
| `KIE-ST-27` | `417223767` | `ROLLER` | 6 | 11.73 |
| `KIE-ST-25` | `860202246` | `TANK_FUEL KIT` | 1 | 261.67 |
| `KIE-ST-24` | `277001874` | `WEAR RING` | 14 | 12.91 |
| `KIE-ST-20` | `710006910` | `HEADLIGHT_HIGH BEAM LED` | 1 | 158.34 |
| `KIE-ST-16` | `715007312` | `BAR_INTRUSION B-160` | 1 | 468.34 |
| `KIE-ST-01` | `715005813` | `CANVAS COVER_TOWAGE KIT SSP` | 1 | 422.04 |

Selecting `KIE-ST-27` exposes a quantity stepper/spinbutton defaulted to all 6 available units and the condition options `Пошкоджена`, `Не та деталь`, `Не використана` (default), `Інше`. The footer becomes `1 позицій · 6 шт` and enables `Створити чернетку`.

This enabled button was the last unsafe boundary and was never pressed. The dialog was closed with `Скасувати`; all six source lists were rechecked and remained empty.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Six list statuses | Empty in every status | Working local filters, exact empty copy |
| Search miss | Same empty list | Local search/clear only |
| Create / no dealer | Dealer select, note, disabled final CTA | Faithful safe preview |
| Create / empty dealer | Search, `0 доступно`, empty table | Preserve empty dealer message |
| Create / populated dealer | 24-line eligible table for KIE-ST | Typed representative fixtures and read-only browsing |
| Line selected | Quantity/condition controls, enabled source final CTA | In clone the final CTA remains hard-disabled despite selection |
| Loading | Dealer selection briefly loads data, no stable skeleton captured | Optional non-mutating skeleton |
| Error | Not deliberately induced | Optional read-only error surface |
| Saved return/detail/timeline | No source record exists | Do not invent as source evidence |

## Safe and unsafe boundaries

Safe and observed:

- list status filters and search;
- opening the create dialog;
- selecting all dealer options to inspect eligible counts;
- selecting a representative line and viewing quantity/condition controls;
- closing with `Скасувати`;
- responsive and theme controls.

Unsafe or not invoked:

- `Створити чернетку`, even when source-enabled;
- any later approve, reject, close, cancel, 1C sync or stock mutation;
- `Оновити` was not needed and remains an unverified refresh control;
- any POST/PUT/PATCH/DELETE.

## Responsive and themes

- Desktop 1440: persistent admin sidebar; empty list toolbar is a single route content column; the create form is a large centered dialog containing a scrollable table.
- Mobile 390: shared compact banner; list controls wrap; create dialog becomes a narrow, vertically scrollable overlay.
- Dark mode preserves empty-list hierarchy and changes the primary heading to `rgb(230,237,243)` over the dark semantic surface.

## Exact visual tokens

Captured at 1440px/dark:

- H1: `28px / 33.6px`, weight `700`, `rgb(230,237,243)`.
- Primary create CTA: `rgb(249,115,22)` background, white text, 12px/500, 32px high, 16px horizontal padding, 6px radius.
- Shared light page is `#f6f8fa`, with `#1f2328` primary text and `#d0d7de` borders; dark page follows `#0d1117` / `#e6edf3`.
- Form/table controls use the shared 6px radius and 32–36px control-height family.

## Clone acceptance

- Implement a dedicated returns component and typed return/dealer/eligible-line models.
- Keep the source list honestly empty in all six statuses.
- Support safe form preview, dealer selection, line search/selection, quantity and condition UI locally, while keeping `Створити чернетку` hard-disabled at all times.
- No callback, reducer, store action or request may create a return, alter inventory, synchronize 1C or change any operational status.

## User refinement lock — 2026-07-18

- Treat the Ocean Freight control composition as the admin benchmark.
- Render list search, six status filters, result count and disabled refresh in one contained desktop toolbar; responsive wrapping remains allowed below the shared breakpoint.
- Use the shared admin page/header/search/segmented primitives without changing the six honest empty states or the safe create-return preview.
