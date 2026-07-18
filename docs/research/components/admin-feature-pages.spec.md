# Admin Feature Pages — evidence index

This document is a routing index and shared safety contract. Route-specific specifications are the source of truth for screenshots, DOM structure, exact copy/data, visual tokens and interaction states. A local fixture or clone behavior is never source evidence unless its route-specific spec explicitly records it as source-observed.

## Shared grammar and safety

Admin pages use the observed compact shell family: approximately 30px desktop headings, 15px helper text, compact KPI cards, 32–40px controls, dense bordered tables and semantic chips. Responsive and dark-mode differences are defined per route rather than inferred globally.

Every tab, subtab, view switch, role switch and ranking option is a separate state. Tabs with identical empty copy still require independent selection and verification; tabs with different schemas must not share a generic rendering contract.

Search, filters, sort, pagination, disclosures and read-only previews may update local rendered state only. Upload, download, refresh, sync, create, save, approve, confirm, send, cancel, archive, restore, delete, permission, queue, warehouse, receipt and status-changing controls are hard-disabled in the clone and have no mutating callback, reducer or external request.

## Operations and logistics

| Route | Independent source state families | Source specification |
|---|---|---|
| Order pipeline | List/Kanban, seven distinct columns, grouped list, search, period, notification/unread, pagination | `admin-order-pipeline.spec.md` |
| Order detail | New, Waiting, Partially shipped, Done, Cancelled; line views, chat, timeline, documents, shipment and preflight error | `admin-order-detail.spec.md` |
| Supplier orders | All, Backorders, Exceptions; exception filters/navigation | `admin-supplier-orders.spec.md` |
| Consignment | Entire warehouse, Network, Requests; six request-status states | `admin-consignment.spec.md` |
| Returns | Six list-status states and multi-step create preview | `admin-returns.spec.md` |
| Air Freight | Overview and Shipments; shipment status filters and upload preview | `admin-air-freight.spec.md` |
| Ocean Freight | Ocean, Ground Delivery, Dealer Equipment; table/cards/grouping and receipt/document previews | `admin-ocean-freight.spec.md` |
| Unit Shipping | Remaining and Shipped; VIN expansion, search/filter/pagination | `admin-unit-shipping.spec.md` |
| Warehouse | Receiving, Receipt Summary, Shortages, Fulfillment, Summary, Placement plus their route-specific subviews | `admin-warehouse.spec.md` |

Air Freight's populated shipment workflow is absent in the source and must not be fabricated as captured evidence. Ocean Freight's receipt/posting action belongs beside the BL/коносамент heading, not on each container. Unit Shipping locally fixes the evidenced sticky-zero reset defect. These are explicit evidence boundaries, not generic assumptions.

## Finance, documents and catalog

| Route | Independent source state families | Source specification |
|---|---|---|
| Settlements | Search, dealer accordion, date presets, loading diagnostic and source database error | `admin-settlements.spec.md` |
| Invoices | Contracts, Appendices, Invoices, Cost; tab-specific previews and filters | `admin-invoices.spec.md` |
| Catalog | Vehicle Catalog, Distributor Prices, Parts Catalog; category/filter/debug/history/page states | `admin-catalog.spec.md` |
| Schedule | Deliveries and Warehouse Stock; slot/detail pagination and search | `admin-schedule.spec.md` |
| Parts report | Six periods, manager filter, Apply, Orders/RN/Payments tables | `admin-parts-report.spec.md` |

Invoices and Analytics are not generic empty pages: Invoices has four populated workflow families, while Analytics has seven evidenced unsynchronized tabs and one separately populated Units tab.

## People and access

| Route | Independent source state families | Source specification |
|---|---|---|
| Companies | Search, employee popover, create/edit/assignment previews and policy navigation | `admin-companies.spec.md` |
| Users | Pending, Active and Deactivated tabs; role-specific edit previews | `admin-users.spec.md` |
| Dealer Access | Company selector, dual-domain search and fixed 47-right matrix | `admin-dealer-access.spec.md` |
| Permissions | Manager and Dealer tabs with different schemas and role-local searches | `admin-permissions.spec.md` |

Source account identifiers, login-capable contact data and sensitive prefilled values are excluded. Local fixtures use synthetic identities. All permission switches, user/company mutations, assignments and saves remain disabled.

## Tools, analytics and integrations

| Route | Independent source state families | Source specification |
|---|---|---|
| Tasks | Four form-only presets; evidence-faithful non-filtering search | `admin-tasks.spec.md` |
| Analytics | Eight independent tabs; shared filters on three empty tabs; populated Units filters/sort/search/six pages | `admin-analytics.spec.md` |
| DB Performance | Four independent ranking datasets plus immediate search/no-result | `admin-performance.spec.md` |
| BossWeb Lookup | Initial/loading/populated source states and explicit local `?part=` handoff/no-result correction | `admin-bossweb-lookup.spec.md` |
| Integrations | Overview search; four 1C tabs; mapping states; four BossWeb tabs | `admin-integrations.spec.md` |
| Settings | Worker, queue and database panel searches plus no-result; no tabs | `admin-settings.spec.md` |

The BossWeb settings preset incident proves that a form-looking control can synchronize immediately. Therefore all BossWeb settings inputs/presets and every integration sync/link/download action are disabled locally. The local BossWeb lookup's `?part=` consumption and unknown-value no-result are deliberate deterministic product requirements, not claims about source behavior.

## Overview

`admin-overview.spec.md` remains the overview-page clone specification. Unlike the later route files above, it is not explicitly labelled with the strict `source-observed` evidence contract, so its content must not be promoted to newly source-confirmed evidence without a fresh screenshot/DOM pass.

## Evidence-gap rule

Loading, error, populated-detail or confirmation states that a route-specific spec marks absent, unverified or blocked remain gaps. Optional local skeletons, neutral error boundaries, representative fixtures or safer responsive corrections must be labelled local-only and cannot be used to claim deeper source coverage.
