# Admin Order Pipeline — source specification

## Source and evidence

- Source URL: `https://brp-dev1.k8s.artemahr.tech/admin/order-pipeline`.
- Search, view, notification filters, group expansion and pagination are client-side; the URL and query string remain `/admin/order-pipeline`.
- Evidence:
  - `docs/design-references/source-admin-order-pipeline-desktop.png`
  - `docs/design-references/source-admin-order-pipeline-kanban.png`
  - `docs/design-references/source-admin-order-pipeline-search-result.png`
  - `docs/design-references/source-admin-order-pipeline-no-result.png`
  - `docs/design-references/source-admin-order-pipeline-period.png`
  - `docs/design-references/source-admin-order-pipeline-unread-filter.png`
  - `docs/design-references/source-admin-order-pipeline-mobile.png`
  - `docs/design-references/source-admin-order-pipeline-dark.png`

## DOM structure and real source data

`Admin shell -> H1/count/banner -> toolbar -> view switch -> seven summary cards -> grouped list or seven-column Kanban -> supplier-order queue -> pagination`.

- H1: `Пайплайн замовлень`; baseline total: `124`.
- Banner: `Замовлення дилерів відкриті`; helper: `Дилери бачать складські індикатори та можуть надсилати замовлення.`
- Unsafe global control: `Призупинити`.
- Search placeholder: `Пошук замовлень, запчастин, замовлення постачальнику#, трекінг...`.
- Toolbar: `Період`, `Сповіщення`, unread-count button, `Список`, `Канбан`.
- Seven source summary cards:

| Card | Count | Kanban column copy |
|---|---:|---|
| Нові | 10 | Нові |
| Очікування | 28 | Очікує замовлення |
| Очікує | 0 | Очікує постачальника |
| Готово | 0 | Готово до відправки |
| Відправлено | 0 | В дорозі |
| Готово | 74 | Доставлено |
| Скасовано | 12 | Скасовано |

The two `Готово` labels are distinct source cards with counts `0` and `74`; local code must preserve their position/meaning rather than deduplicate them by label.

### List groups and representative rows

- Page 1: `Нові замовлення 10`, collapsed `Очікує консолідації 9`, collapsed `Завершено 31`.
- Page 3: collapsed `Очікує консолідації 7`, `Завершено 15`, `Скасовано 2`.
- Pagination copy: `124 замовлень · сторінка 1 з 3`; numbered pages `1–3` and disabled edge arrow.
- New examples: `LOG-01` / Logos / 1 part / `$13.09`; `LSM-10` / `$122.11`; `KHA-08` / `$383.78`; `KIE-ST-31` / `$117.30`; `CHK-2-02` / 4 parts / `$803.54`.
- Waiting examples after expansion: `KS-05`, `KIE-ST-28`, `KIE-ST-23`, `KS-06`, `KHA-05`, `CHK-03`, `LSM-07`, `ZHY-06`, `VYS-04`.
- Done examples after expansion: `KHA-07`, `ZAP-E-03`, `KIE-ST-20`, `KS-07`, `DNE-07`, `ZHY-07`, and the rest of the page-specific group.
- Cancelled page-3 examples: `KS-01`, `RVN-01`, both `$0.00` with zero active parts.
- A row click navigates to `/admin/orders/:uuid`; it does not open a drawer/modal.

## Interaction model and state table

| State | Source evidence | Required local behavior |
|---|---|---|
| List default | 124 total; page 1 groups | Render group counts and representative rows; rows open detail URLs |
| Group collapsed | `+N (натисніть, щоб розгорнути)` | Toggle only local expansion state |
| Group expanded | Waiting/Done/Cancelled representative rows | Preserve distinct order and line-status mixes |
| Kanban | Seven horizontal columns; cards show `ready/total` and line badges | Search and pagination still work; cards open detail |
| New Kanban action | `Підтвердити` on each New card | Must be hard-disabled locally; never mutate status |
| Search hit | `KIE-ST-23` -> one card in Waiting column | Match order number, part, supplier-order/tracking text fixtures |
| Search miss | all summary counts `0`, all columns empty, `Замовлень поки немає` | Deterministic no-result state; clear restores baseline |
| Period | two-month range calendar, July/August 2026 | Open/close UI only; date selection may filter locally |
| Notifications | toggle can yield all-zero columns | Local filter state only |
| Unread | `2 непрочитаних`; two delivered cards (`ZAP-E-03`, `KIE-ST-20`) | Local unread filtering only |
| Pagination | page 1/2/3, no URL change | Working client pagination and reset on search |
| Loading | transient source fetch state not separately captured | Stable skeleton or busy state without invented counts |
| Error | source network error not intentionally induced | Explicit retry-free read-only error surface |

The seven top cards behaved as source summary/navigation cards: clicking a card did not expose a selected style or alter the visible list in the captured state. Do not claim a source-backed filtering behavior for these cards unless a later capture proves it; local filtering is acceptable only when labelled as clone enhancement.

## Safe and unsafe actions

- Safe: list/Kanban, search/clear, period popover, notification/unread filter, pagination, group expansion, opening an order.
- Unsafe/blocked: `Призупинити`, `+ Новий замовлення постачальнику`, every Kanban `Підтвердити`, and any later workflow CTA.
- Last safe point: order card/detail navigation or an open local-only preview. No source final CTA was pressed.

## Responsive and themes

- Desktop content width: `1120px` inside `max-w-6xl`; main padding follows `p-4 md:p-6 lg:p-8`.
- At 390px the admin navigation is removed from the visual layout, toolbar/actions wrap, summary cards and dense content remain horizontally scrollable, and list rows stack/wrap.
- Tablet belongs to the same responsive family as Air/Ocean/Unit dense admin layouts; use the common 768px shell behavior.
- Dark mode preserves hierarchy and swaps semantic CSS variables; evidence is `source-admin-order-pipeline-dark.png`.

## Exact visual tokens

Captured computed CSS at 1440px/light:

- H1: `30px/36px`, weight `700`, `rgb(31,35,40)`.
- Main content: `1120px`.
- Search input: `11px/14.6667px`, minimum height `36px`, inner width `312px`.
- Summary card: white, `1px solid rgb(208,215,222)`, radius `8px`, padding `12px 16px`, approximately `151px` wide.
- List order card: white, same border/radius, padding `14px 20px`, gap `8px 16px`, no default shadow.

## Clone acceptance

- Preserve `124 / 10 / 28 / 0 / 0 / 0 / 74 / 12` as source fixture data.
- Every declared representative status must have an openable order, not only an aggregate number.
- Search, empty state, list/Kanban, unread filter, group expansion and pagination work without APIs.
- All operational CTAs are disabled and no reducer/callback changes order or line operational status.
