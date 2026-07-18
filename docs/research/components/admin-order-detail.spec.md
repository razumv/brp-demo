# Admin Order Detail — source specification

## Source URLs and evidence

- New: `/admin/orders/a20b2bdd-2a1f-4322-a50a-fe68a17f4963` (`LOG-01`).
- Waiting: `/admin/orders/847a33b6-c168-46bf-9d5e-f4c0dabb2c7b` (`KS-05`).
- Mixed/partially shipped: `/admin/orders/386960e7-2e28-4bb0-8fa9-83e45f84df7a` (`KIE-ST-23`).
- Done: `/admin/orders/659fb637-d5c6-4d10-8739-baf0e30d4449` (`KHA-07`).
- Cancelled: `/admin/orders/aa12301e-0294-4cb2-8bcb-3ec8f13f0ba6` (`KS-01`).
- Evidence:
  - `docs/design-references/source-admin-order-new-desktop.png`
  - `docs/design-references/source-admin-order-new-chat.png`
  - `docs/design-references/source-admin-order-waiting-desktop.png`
  - `docs/design-references/source-admin-order-mixed-line-timeline.png`
  - `docs/design-references/source-admin-order-done-timeline.png`
  - `docs/design-references/source-admin-order-cancelled-timeline.png`
  - `docs/design-references/source-admin-order-log01-confirm-preview-error.png`

## DOM structure

`Back link -> order header/status/age/company/date/PO/delivery -> progress and line-status chips -> left line table/totals/chat/documents -> right actions/info/timeline/dealer shipments`.

Desktop uses a `708px 340px` grid with `24px` gap at the captured 1440px viewport. The line table minimum is wider than the left column and lives in a horizontal overflow card. Mobile collapses the right rail below the main content.

### Shared table fields

- `Артикул`, `Опис`, `CRM статус`, `BossWeb / замовлення постачальнику`, `Склад / джерело`, `К-сть`, `Ціна`, `Сума`.
- Selection checkboxes exist for actionable active lines; cancelled rows are disabled.
- Footer: `РАЗОМ`, unit count, supplier-order reference when present, formatted total.

## Real order fixtures

| Order | Order status / stage | Real line evidence | Additional panels |
|---|---|---|---|
| LOG-01 | `Новий`; `Очікує постачання` | `9779150 COOLANT,EXT LIFE`, qty 1, `$13.09`, `Очікування · Склад` | PO `CODEX-QA-20260718`, one dealer message, timeline 2 |
| KS-05 | `В процесі`; `Очікує постачання` | `507032601 MICROSWITCH`, qty 1, `$70.83`, `Очікує замовлення` | confirmed Jun 4, timeline 2 |
| KIE-ST-23 | `Частково відправлено`; `4/21 Готово` | 9 active parts/29 units; waiting, shipped and two cancelled lines | 1C `РН-00001955` conducted; Nova Poshta shipment; timeline 5 |
| KHA-07 | `Доставлено`; `Все готово` | `2859420684` `$99.30`; `295101161` `$353.24` | two 1C docs; Nova Poshta shipment; timeline 6 |
| KS-01 | `Скасовано`; `Все готово` | `703501249 AIR FILTER WITH PRE FILTER`, cancelled reason, displayed order total `$0.00` | one dealer message; timeline 3 |

### KIE-ST-23 mixed lines

- Waiting: `276000415`, `278002203`, `291002838`, `295100833`, `707602002`, `709402094`, `710002183`, `710004408`.
- Shipped: `293730010 BLACK DART`, qty 4.
- Cancelled: `710004964`, qty 5; `710005232`, qty 3; both copy `Резерв Океан РАС 4`.
- Header badges: `17 Очікує замовлення`, `4 Відправлено`, `8 Скасовано`.
- Totals: `Склад (4): $5.44`, `Замовлено (17): $790.92`, `Скасовано: $511.36`, active total `$796.36`.

## Timeline and chat states

- Timeline is a right-rail accordion; opening it never changes order state.
- KIE-ST-23 timeline: order created `$1307.72`; two item-cancel events; manager confirmation summary; shipped event.
- KHA-07 timeline: created, two dealer chat entries, confirmed `1 in stock, 1 from consignment`, shipped, delivered.
- KS-01 timeline: created, dealer note, item-cancel event with full reason.
- Inline chat shows recent history and composer; `Розгорнути чат` opens the full chat dialog. Attachment and send are unsafe and must be disabled locally.

## Confirmation/preflight evidence

Static source-bundle inspection confirms the exact boundary:

- `Перевірити перед підтвердженням` calls `GET /api/v2/allocation/confirm-preview/:id` and opens an inline preview.
- Final preview confirmation calls `POST /api/v2/allocation/confirm/:id`.
- `Перевірити старий склад` calls `POST /api/v2/allocation/check-legacy/:id`.

Therefore only the first preflight click is source-safe. The captured source result for both LOG-01 and KHA-08 was the inline error `Failed to build confirm preview`; status remained `Новий`. The local clone may render an evidence-backed successful representative layout, but must also expose this captured error state and must hard-disable the final confirm.

Expected successful preview structure from the source DOM bundle:

- title `Перевірка перед підтвердженням` and explicit copy that the order is not confirmed;
- refresh calculation;
- columns for requested, stock now/from stock/after confirm, turnover, open Logos, to order, channel, Logos decision;
- delivery mode `air/ocean` and nonnegative replenishment quantity;
- footer Cancel and final Confirm.

Local fields may change preview-only state, but final Confirm is disabled and no status/allocation state changes.

## Safe and unsafe action table

| Action | Source boundary | Local requirement |
|---|---|---|
| Back/order navigation | GET navigation | Enabled |
| Status chips | table filtering only | Enabled, local-only |
| Timeline/chat expand | view state | Enabled |
| Preflight first click | proven GET | Enabled preview/error state |
| Final preflight confirm | POST | Hard-disabled |
| Check old warehouse | POST | Hard-disabled; label why |
| Cancel line/order | PATCH | Hard-disabled; optional preview only |
| Ship/send to dealer | POST | Hard-disabled |
| Edit/mark shipment delivered | PATCH/POST | Hard-disabled |
| Download/attach/retry/sync 1C | operational or download path | Hard-disabled |
| Chat send/upload | external side effect | Hard-disabled |

No source final CTA was clicked. Source status and order data were re-read after the safe preview and remained unchanged.

## State matrix

| Dimension | Captured state |
|---|---|
| Loading | order UUID placeholder; preflight calculation copy |
| Empty | no chat; no dealer shipments |
| Populated | five distinct order/status families, chat, 1C docs, shipment and timelines |
| Error | `Failed to build confirm preview` |
| Mobile | right rail stacks below horizontally scrollable line table |
| Dark | inherits the same semantic variable family as pipeline/logistics; no hardcoded light-only surfaces |

## Visual tokens

- Page background: `rgb(246,248,250)` light.
- Desktop content grid: `708px 340px`, gap `24px`.
- Base type: `15px/21.75px`; code/status uses compact 11–13px typography.
- Card border: `rgb(208,215,222)`, radius `8px`; dense table rows use `border-border/30` and `hover:bg-accent/30`.
- Table horizontally overflows its 708px column; do not compress away columns.

## Clone acceptance

- Order detail resolves by order id/code to distinct typed fixtures; never reuse one line for every order.
- New, Waiting, Partially shipped, Done and Cancelled representative orders are reachable from pipeline.
- Line-status filtering, full chat, timeline, documents and shipment panels work as view-only UI.
- Preflight opens a preview/error surface; all final operational controls are hard-disabled.
- No component callback, reducer or shared store action can mutate order/line operational status.
