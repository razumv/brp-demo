# Dealer Orders Specification

## Certification contract

Source list behavior has historical 2026-07-18 support only through the order confirmation/detail captures; a fresh dealer-authenticated list capture is **PENDING** at desktop 1440px and mobile 390px. The 2026-07-20 admin-session probe is not dealer evidence.

This specification covers the single dealer-facing Logos / Финансы profile. It does not require, simulate, or imply multiple dealer tenants.

## List

Header, status total cards, search/filter controls and List/Kanban toggle. The historical captured status is New for a freshly created local order.

Each card/row shows code, dealer/company, creator, date, parts count, amount and status/stage chips. Search covers code, customer, PO and part number.

## Local order lifecycle

Catalog/quick check -> Cart -> customer/PO/note/delivery -> local create -> confirmation -> order detail. Dashboard and dealer order surfaces update from the same local dealer store.

Creating an order is a deterministic local state transition. It must not claim a remote send, approval, shipment, or status transition. Confirmation copy and action labels must describe a created local record and local navigation only; no user-facing demo/test/environment badge is permitted.

## Control contract

| Control | Required behavior |
|---|---|
| Search | Filters the same local order collection by code, customer, PO, and part number while typing. |
| Status filter | Deterministically filters that collection and updates the visible count/state. |
| List/Kanban | Changes only the presentation of that same collection; cards/rows retain the detail target. |
| New order | Navigates to the catalog/local builder. It does not create an order by itself. |
| Empty/no-result state | Distinguishes an empty local collection from a query with no matches without inventing source wording. |

No order-list control may appear enabled without one of those effects. Controls that would contact a backend remain locked according to [dealer-workflow-boundaries.spec.md](./dealer-workflow-boundaries.spec.md).

## Empty and responsive

Before local creation, render the observed empty illustration/title/helper. Mobile cards stack metadata and keep the amount/status visible without horizontal scroll.

## Future source capture

Record the dealer-authenticated URL, list/empty state, query, status filter, List/Kanban states, and direct detail navigation at 1440px and 390px. Do not perform source approval, confirmation, shipment, or cancellation actions.
