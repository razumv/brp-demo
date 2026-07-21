# Dealer Workflow Boundaries Specification

## Purpose and evidence status

This is the shared dealer-only interaction contract for the [2026-07-21 parity certification](../DEALER_PARITY_CERTIFICATION_2026-07-21.md). It applies to the single Logos / Финансы profile, with no multi-tenant simulation requirement. It uses the safety boundary in [SOURCE_QA_POLICY.md](../SOURCE_QA_POLICY.md) and the dated historical record in [SOURCE_TEST_RECORDS.md](../SOURCE_TEST_RECORDS.md).

Fresh dealer-authenticated evidence at desktop 1440px and mobile 390px is **PENDING** for every surface below. The current-control observations are local implementation findings, not claims about current source behavior. Legacy baseline findings remain historical even where a row below records a corrected current-local control.

## Classification vocabulary

Use these labels exactly:

| Classification | Meaning |
|---|---|
| **working local** | The currently exposed control has an observable deterministic browser-local effect: state, collection, validation, disclosure, clipboard/print, or navigation changes as labeled. |
| **correctly locked/absent** | A prohibited or unproven effect is disabled or not rendered. A rendered lock is correct only when its reason is persistently available to pointer, touch, and keyboard users. |
| **enabled inert** | The control accepts input/selection but does not perform its labeled filter, view, record, or refresh behavior. |
| **wrong action** | The control or projection performs/describes something different from its label, selected entity, or actual local/remote effect. |
| **backend contract required** | The effect must remain non-remote until a typed adapter plus authentication, authorization, validation, failure, and persistence semantics are approved. |

No user-facing explanation may use demo/test/environment labels. A native `title`, visual dimming, or hover-only tooltip is not a sufficient lock explanation.

## Current per-route control inventory

<a id="controls-dashboard"></a>
### Dashboard `/`

| Control family | Classification and observable effect / lock reason |
|---|---|
| New order, recent order, View all, empty-state CTA, and section shortcuts | **working local** — each navigates to its declared local route/detail. |
| KPI, attention, and summary cards | **working local** — values re-render from local orders, customers, workshop records, and cart. |
| Remote dashboard feed | **backend contract required** — no network read exists; future data must be scoped to Logos. |

<a id="controls-dealer-shell"></a>
### Dealer shell

| Control family | Classification and observable effect / lock reason |
|---|---|
| Desktop navigation and brand link | **working local** — links change route, active state follows the URL, and the order badge follows local order count. |
| Mobile menu button, close button, backdrop close, nav-link close | **working local** — the modal drawer handles initial focus, containment, Escape, background inertness and return focus in addition to visible open/close/navigation. |
| Theme | **working local** — toggles the document class and persists light/dark choice in local storage. |
| Profile popover and Logout | **working local** — popover visibility changes; Logout clears the local session and routes to login. |
| Cart button/drawer, line quantity/remove/clear, catalog/checkout navigation | **working local** — drawer/local cart/route changes as labeled, including Escape, focus containment and return focus. |
| Identity | **working local** read projection — renders the current session identity with Logos / Финансы fallback. A future remote identity read is **backend contract required**. |
| Client-view, language, notifications and related help affordances | **correctly locked/absent** — unsupported dealer-only controls are not rendered. Admin language and notifications remain unchanged. |

<a id="controls-global-search"></a>
### Global parts search

| Control family | Classification and observable effect / lock reason |
|---|---|
| Type-ahead query, availability tabs, clear, Escape/outside close | **working local** — fixture results/filter/open state change synchronously. |
| Quantity stepper and Add to cart | **working local** — quantity clamps to 1–99 and the selected fixture SKU updates the local cart. |
| Mobile open/close and focus loop | **working local** — modal opens, traps focus, closes, and restores focus. |
| Live parts lookup/cart persistence | **backend contract required** — remain local until search and cart-write ports are authorized. |

<a id="controls-catalog-home"></a>
### Catalog home `/catalog`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Model/part exact searches | **working local** — supported fixture values navigate to results and other non-empty values show a local miss. |
| Manufacturer cards and recent orders | **working local** — navigate to a local catalog root or orders. Overview-only destinations must remain honest about depth. |
| Live catalog search | **backend contract required** — no remote catalog is queried. |

<a id="controls-nested-catalogs"></a>
### Nested catalogs `/catalog/:slug*`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Breadcrumbs, linked category/series/model/configuration/diagram rows | **working local** — URL and rendered hierarchy change. |
| Year rows and “Show 2026” | **working local** — selection changes; unsupported years render an honest local state. |
| Active category and Accessories rows implemented as buttons without handlers | **enabled inert** — they accept focus/click but do not change route or state; make them static or functional. |
| Full remote hierarchy | **backend contract required** — stable IDs, locale, visibility, and pagination must be defined first. |

<a id="controls-diagram"></a>
### Diagram and parts

| Control family | Classification and observable effect / lock reason |
|---|---|
| Previous/next/select diagram, callouts, zoom/reset, mobile schema/parts tabs | **working local** — selected diagram/viewer state changes with bounded values. |
| Row Add to cart and cart link | **working local** — the clicked row SKU enters local cart and visible feedback/cart count changes. |
| Print | **working local** — invokes the browser print surface. |
| Share | **wrong action** — clipboard failure is swallowed and the UI still reports success. Report success only after the write resolves; expose failure/fallback otherwise. |
| Remote diagram/price/availability/cart persistence | **backend contract required** — current assets and rows remain local fixtures. |

<a id="controls-cart"></a>
### Cart `/cart`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Customer selection/quick create, PO/note, manual known-SKU add, quantity/remove/clear, delivery, validation | **working local** — local form/store/totals or validation change deterministically. |
| Draft title | **enabled inert** — text changes, but it is not persisted or used by created order/drafts. |
| Import Excel and Export | **wrong action** — enabled controls only show notices instead of importing/exporting; real file transfer is **backend contract required** and should be locked with a persistent reason. |
| “Check and send” submit | **wrong action** plus **working local** — it creates and routes to a local order but its label implies remote send. Change the label/copy to the actual local effect. |
| Remote cart/order creation | **backend contract required** — requires ownership, validation, idempotency, and failure semantics. |

<a id="controls-confirmation"></a>
### Confirmation `/order-confirmation/:id`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Copy order number and navigation links | **working local** — clipboard or route changes. |
| Sent/manager-check/allocation/shipment projection | **wrong action** — it describes remote progression not caused by local creation. Show only established local receipt state. |
| Server receipt/status | **backend contract required** — may display only after contracted remote create/read succeeds. |

<a id="controls-orders-detail"></a>
### Orders/detail `/dealer/orders`, `/dealer/orders/:id`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Search, status cards/select, List/Kanban, row/card links | **working local** — one local collection is filtered or presented differently and detail opens. |
| Private note, message composer, timeline disclosures | **working local** — local order data or disclosure state changes. |
| File metadata chooser | **working local** — it records only the disclosed name, type, and size with a persistent statement that the file itself is not transferred. Remote upload remains a **backend contract required**. |
| Chat identity projection | **working local** — persisted local messages render without a product-facing demo/test label. |
| Approval, fulfillment, shipment, delivery mutation | **correctly locked/absent** — dealer detail exposes none of these controls. |
| Remote note/chat/attachment persistence | **backend contract required** — authorization, audit, retries/idempotency, and file storage must be specified. |

<a id="controls-customers-equipment"></a>
### Customers/equipment `/dealer/customers`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Search, compact category filter/reset, customer selection, create/edit, add equipment, order links | **working local** — the typed collection, selected/local records, validation, metrics and navigation update. |
| Retail/Fleet/VIP/Wholesale category selection | **working local** — every exposed category compares the typed customer category and updates results. |
| Remote customer/equipment CRUD | **backend contract required** — ownership, validation, conflict/audit, and deletion semantics are not contracted. |

<a id="controls-team-access"></a>
### Team access `/dealer/team-access`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Profile selection, name save, quick access, permission switches, Save | Operational effects are absent and **backend contract required**. The controls are disabled, but the page notice/footer is not programmatically/focus/touch-associated with each lock, so the rendered locks are not yet classified as correctly locked. |
| Add employee | **correctly locked/absent** — no dealer-side control is rendered, matching the intentional dealer boundary. Do not introduce one without fresh source and authorization evidence. |
| Remote access read/write | A scoped read is **backend contract required**; no write port is authorized. Frontend now must complete lock explanation association without enabling writes. |

<a id="controls-accessories"></a>
### Accessories `/dealer/accessories`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Family select, query, product card/detail modal | **working local** — product collection or selected detail changes. |
| Year, compatibility, purpose, and sort controls | **enabled inert** — selection does not affect the rendered product collection/order. Wire typed fixtures or lock them. |
| Product Add to cart | **wrong action** — every selected product adds coolant SKU `9779150`; add the selected typed product instead. |
| Remote product/compatibility/availability | **backend contract required** — catalog read and cart-write ports must be authorized first. |

<a id="controls-units"></a>
### Units `/dealer/units`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Tabs, captured KPI projection and row disclosure | **working local** — the selected tab/empty state, 15-shipment / 13-unit counts and expanded source-shaped rows derive from one typed shipment collection. |
| Query and compact action filter/reset | **working local** — query covers container, BL, model, SKU and VIN; action selection filters source-backed read-only action states. |
| Receipt/shipment/status mutation | **correctly locked/absent** — no operational mutation control is exposed. |
| Remote unit/shipment read | **backend contract required** — dealer visibility and pagination/schema contracts are required. |

<a id="controls-workshop"></a>
### Workshop `/dealer/workshop`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Search, stage/work-type filters and reset | **working local** — one typed order collection is filtered by description, customer, mechanic, notes, stage and type. |
| New work order modal, validation, cancel/create | **working local** — a valid record persists, appears in the New column and survives reload; storage failure produces a retryable error without success UI. |
| Stage transition, drag/drop, assignment, edit, delete | **correctly locked/absent** — cards are static and non-draggable because the source lifecycle is unverified. No decorative lock notice or fake transition button is rendered. |
| Remote list/create | **backend contract required** — even these methods wait for fresh source field evidence plus ownership/validation/audit contracts. |

<a id="controls-bossweb"></a>
### BossWeb `/dealer/bossweb`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Query and submit | **working local** — the known fixture shows a comparison; another query shows a miss. |
| Live BossWeb lookup | **backend contract required** — authentication, rate limit, timeout/cache, and error semantics must exist first; no sync is permitted. |

<a id="controls-schedule"></a>
### Schedule `/dealer/schedule`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Category buttons and slot selection/modal | **working local** — the local list/selection/detail changes. |
| Text query and compact category filter/reset | **working local** — both filter the typed slot collection; selected slot, timeline, counts, detail and empty state derive from the same result. |
| Alternate schedule views | **correctly locked/absent** — no unobserved view control is rendered. |
| Reservation/shipment mutation | **correctly locked/absent** — no such controls are exposed. |
| Remote schedule/availability read | **backend contract required** — timezone, visibility, pagination, and freshness must be defined. |

<a id="controls-documents"></a>
### Documents `/dealer/documents`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Query and compact type/status filters/reset | **working local** — the typed document collection and result metadata change together. |
| Export/download | **correctly locked/absent** and **backend contract required** — no decorative export control is rendered; signed-artifact authorization is still required for a future remote effect. |

<a id="controls-drafts"></a>
### Drafts `/dealer/order-drafts`

| Control family | Classification and observable effect / lock reason |
|---|---|
| New Draft, query, content/buyer filters/reset, open and delete | **working local** — persisted draft state changes, filters compose with search, and opening continues in the cart. |
| Refresh and Excel | **correctly locked/absent** and **backend contract required** — no inert refresh or decorative file-transfer control is rendered. |

<a id="controls-consignment"></a>
### Consignment `/dealer/consignment`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Stock/network/request tabs, query and explicit state filter/reset | **working local** — tabs select a typed collection; query and available/reserved/requested status change its rows. |
| Request creation and final submit | **correctly locked/absent** and **backend contract required** — no partial form or disabled submit is exposed while operational eligibility, authorization, idempotency and workflow status remain uncontracted. |

<a id="controls-settlements"></a>
### Settlements `/dealer/settlements`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Query, compact period filter/reset, rows and totals | **working local** — the typed ledger is filtered against the certification reference clock and every total derives from visible rows. |
| Refresh balance and Excel | **correctly locked/absent** — no inert synchronization or export control is rendered. Remote effects remain a **backend contract required**. |

<a id="controls-inventory"></a>
### Inventory `/dealer/parts-inventory`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Query and compact stock-state filter/reset | **working local** — query filters part number/description; in-stock, low and out states filter the typed inventory collection and update derived values. |
| Stock mutation/sync | **correctly locked/absent** — no operational controls are exposed. |
| Remote inventory read | **backend contract required** — location, freshness, price visibility, and pagination must be defined. |

<a id="controls-network"></a>
### Network `/dealer/network`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Parts/units tabs | **working local** — the active typed collection, query fields, dealer options, rows and empty state change together. |
| Query and compact dealer filter/reset | **working local** — parts search covers part/description; units search covers model/VIN; dealer options derive only from the active tab. |
| Allocation/reservation | **correctly locked/absent** — no cross-dealer write control is exposed. |
| Remote network read | **backend contract required** — cross-dealer privacy/scope/freshness contracts are required. |

<a id="controls-parts-report"></a>
### Parts report `/dealer/parts-report`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Order-code query, date range, rows, item counts, totals and order links | **working local** — all values derive from the same local orders and links open detail. |
| Manager/status/admin KPI dimensions and Excel | **correctly locked/absent** — the dealer view does not invent a manager alias, hard-coded status or non-working export. Remote reporting/export remains a **backend contract required**. |

## Proposed typed `brp-dev1` ports

These are future compile-time adapter boundaries, not source-behavior claims. `DealerScope` is fixed to the authenticated Logos dealer context; adapters must not make network calls until their row-specific contract in the certification matrix is approved.

```ts
type DealerScope = Readonly<{ companyKey: "logos"; actorId: string }>;
type PageRequest = Readonly<{ cursor?: string; limit: number }>;
type PageResult<T> = Readonly<{ items: readonly T[]; nextCursor?: string }>;
type MutationResult<T> = Readonly<{ value: T; revision: string }>;
type SignedArtifactGrant = Readonly<{ url: string; expiresAt: string }>;
```

Read ports return typed snapshots/pages and do not imply write permission. Mutation ports require dealer ownership, authorization, validation, conflict/idempotency, audit, and failure semantics. Artifact ports additionally require content, size, retention, malware-screening, and signed-download contracts. Workshop transition methods, permission writes, approval, fulfillment, shipment, inventory writes, and cross-dealer allocation are deliberately not proposed.

## Fresh evidence packet

For each route, save the dealer-authenticated URL, Logos / Финансы identity confirmation, 1440px and 390px artifacts, safe interaction sequence, rendered result, visible lock explanation, date, and confidence. Record drift separately from 2026-07-18. Never use an admin-session redirect as evidence of dealer behavior.
