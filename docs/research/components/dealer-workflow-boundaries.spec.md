# Dealer Workflow Boundaries Specification

## Purpose and evidence status

This is the shared dealer-only interaction contract for the 2026-07-21 parity certification. It applies to the single Logos / Финансы profile, with no multi-tenant simulation requirement. It is grounded in the source safety policy at [SOURCE_QA_POLICY.md](../SOURCE_QA_POLICY.md), the dated historical record at [SOURCE_TEST_RECORDS.md](../SOURCE_TEST_RECORDS.md), and the route matrix at [DEALER_PARITY_CERTIFICATION_2026-07-21.md](../DEALER_PARITY_CERTIFICATION_2026-07-21.md).

Fresh dealer-authenticated source evidence at desktop 1440px and mobile 390px is **PENDING** for all control families below. Historical 2026-07-18 captures preserve their date and confidence; the 2026-07-20 admin-session probe is not dealer certification.

## Control classes

| Class | Contract | Examples |
|---|---|---|
| Local deterministic | Enabled. A user action changes browser-local/in-memory state, visible collection, route, disclosure, or validation immediately and predictably. | Catalog selection, cart quantity, local order create, search/filter/tab, customer/equipment, private note, local chat. |
| Local preview | Enabled only when opening/closing or changing a non-operational local preview has a visible deterministic effect. It must not claim a server operation occurred. | Consignment request form preview after source semantics are known. |
| Locked external effect | Disabled until a backend contract exists. It never performs network-side work. | 1C, synchronization, real upload/download/export, operational submit, approval, shipment, permissions. |
| Absent | Do not render a control when the source/role contract does not establish dealer access. | Dealer approval/fulfillment/shipment controls on order detail; dealer employee administration unless source evidence changes. |

## Accessibility contract for a lock

Every locked control has a visible adjacent explanation or a focusable disclosure that states why it is unavailable. The same explanation must be reachable by pointer, touch, and keyboard focus, announced through an appropriate accessible name/description, and remain available without hover. A native `title` is supplementary only. The explanation must not use a demo/test/environment label in the user-facing interface.

If an action can be local, prefer a real deterministic local effect over a visually enabled no-op. If no local effect is specified, lock or remove the control.

## Route-family boundary table

| Surface | Local deterministic now | Locked or absent until backend/source contract |
|---|---|---|
| Global search, catalog, diagram | Query/filter, hierarchy selection, zoom/disclosure, local cart add. | Remote parts lookup, uncontracted print/share/download. |
| Cart and confirmation | Quantity/customer/PO/note/delivery validation, local order create, local receipt navigation/copy. | Real import/export, remote submission, approval, dispatch. |
| Orders and order detail | List/Kanban/query/status presentation, local note, local message metadata, timeline disclosure. | Approval, confirm, fulfillment, shipment, delivery, real attachment upload. |
| Customers and equipment | Search/filter, local create/edit/confirmed delete, local equipment lifecycle when specified. | External customer/vehicle registration or synchronization. |
| Team access | Read-only view of the single dealer profile. | Permission changes, profile changes, employee/team assignment. |
| Accessories, BossWeb, Units, Schedule | Typed local browse/filter/select/add-to-cart where defined. | Remote availability lookup, reservation, receiving, shipment, synchronization. |
| Workshop | Local work-order creation only after source-confirmed fields; local state transitions only after their source contract is captured. | Real service scheduling/assignment or external operational changes. |
| Documents, Drafts, Consignment, Settlements, Inventory, Network, Parts report | Typed local browse/filter/preview only after each has a defined dataset and deterministic result. | Real file transfer/export, refresh/sync, operational request submit, allocation, stock changes. |

## Reconciliation requirements

- Chat messages never receive a `Demo` badge or another demo/test/environment label.
- A confirmation page never claims an order was sent remotely when it was only created locally.
- No enabled control may be inert. Its changed state, filtered collection, local record, dialog, navigation, or validation must be observable.
- An empty historical source state does not authorize invented active semantics. It supports an honest empty/read-only local state until a dealer-authenticated source pass supplies more evidence.
- No lock may rely only on visual dimming or a hover-only tooltip.

## Future dealer-authenticated evidence packet

For each route, save the URL, dealer identity confirmation, viewport, artifact path, safe interaction sequence, rendered result, visible lock explanation, date, and confidence. Record drift separately from the 2026-07-18 historical evidence. Never use an admin-session redirect as evidence of dealer behavior.
