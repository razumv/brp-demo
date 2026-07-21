# Dealer Workflow Boundaries Specification

## Purpose and evidence status

This is the shared dealer-only interaction contract for the [2026-07-21 parity certification](../DEALER_PARITY_CERTIFICATION_2026-07-21.md). It applies to the single Logos / Финансы profile, with no multi-tenant simulation requirement. It uses the safety boundary in [SOURCE_QA_POLICY.md](../SOURCE_QA_POLICY.md) and the dated historical record in [SOURCE_TEST_RECORDS.md](../SOURCE_TEST_RECORDS.md).

Fresh dealer-authenticated evidence at desktop 1440px and mobile 390px is **PENDING** for every surface below. The current-control observations are clone-code findings, not claims about current source behavior.

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
| Mobile menu button, close button, backdrop close, nav-link close | **working local** for visible open/close/navigation. The drawer declares modal semantics but lacks initial focus, focus containment, Escape close, background inertness, and return focus, so that modal behavior is a **wrong action** until completed. |
| Theme | **working local** — toggles the document class and persists light/dark choice in local storage. |
| Profile popover and Logout | **working local** — popover visibility changes; Logout clears the local session and routes to login. |
| Cart button/drawer, line quantity/remove/clear, catalog/checkout navigation | **working local** — drawer/local cart/route changes as labeled. Its dialog also lacks a complete Escape/focus/return contract and must receive the same frontend drawer correction. |
| Identity | **working local** read projection — renders the current session identity with Logos / Финансы fallback. A future remote identity read is **backend contract required**. |
| Client-view button | **enabled inert** — it has no handler or visible effect. Implement only after source/authorization semantics are known, or lock/remove it. |
| Language menu | Menu open/close is **working local**; each language choice is **wrong action** and **enabled inert** for its label because it only closes the menu and leaves UA/content unchanged. Preference persistence is **backend contract required** if it becomes remote. |
| Notifications | **enabled inert** — button has no handler or panel. Remote notification read/state is **backend contract required**. |

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
| File picker labeled Add file | **wrong action** — it stores filename metadata only and does not upload. Present metadata-only selection truthfully or lock upload. |
| Chat `Demo` badge | **wrong action** — prohibited product-facing state label; remove it without changing local message behavior. |
| Approval, fulfillment, shipment, delivery mutation | **correctly locked/absent** — dealer detail exposes none of these controls. |
| Remote note/chat/attachment persistence | **backend contract required** — authorization, audit, retries/idempotency, and file storage must be specified. |

<a id="controls-customers-equipment"></a>
### Customers/equipment `/dealer/customers`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Search, customer selection, create/edit, add equipment, order links | **working local** — selected/local records, validation, metrics, and navigation update. |
| Service/fleet/VIP category buttons | **wrong action** — all non-retail selections collapse to the same empty result instead of typed category semantics. Bind or remove them. |
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
| Tabs and row disclosure | **working local** — selected tab/empty state and expanded row change. |
| Query | **wrong action** — it filters container/BL only while promising model/VIN too. Align fields or implementation. |
| Receipt/shipment/status mutation | **correctly locked/absent** — no operational mutation control is exposed. |
| Remote unit/shipment read | **backend contract required** — dealer visibility and pagination/schema contracts are required. |

<a id="controls-workshop"></a>
### Workshop `/dealer/workshop`

| Control family | Classification and observable effect / lock reason |
|---|---|
| New work order modal, validation, cancel/create | **working local** — a valid record appears in the local New column. |
| Stage transition, assignment, edit, delete | **correctly locked/absent** — source lifecycle is unverified, so no control is exposed. Do not invent it. |
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
| Future/available view buttons and text query | **enabled inert** — clicks/typing do not change the view or collection. |
| Slot count/KPIs/timeline versus rendered rows | **wrong action** — projections do not derive from the shown typed collection. |
| Reservation/shipment mutation | **correctly locked/absent** — no such controls are exposed. |
| Remote schedule/availability read | **backend contract required** — timezone, visibility, pagination, and freshness must be defined. |

<a id="controls-documents"></a>
### Documents `/dealer/documents`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Query and type select | **enabled inert** — no document collection is filtered. Lock while empty or add typed local rows. |
| Export | **backend contract required** — disabled, but needs a persistent signed-artifact/authorization reason to be a correct lock. |

<a id="controls-drafts"></a>
### Drafts `/dealer/order-drafts`

| Control family | Classification and observable effect / lock reason |
|---|---|
| New Draft, query, Refresh | **enabled inert** — no draft is created, filtered, or refreshed. Implement local draft state or lock each control. |
| Excel | **backend contract required** — disabled without a persistent file-transfer reason. |

<a id="controls-consignment"></a>
### Consignment `/dealer/consignment`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Stock/network/request tabs and Create request modal | **working local** — selected empty state or modal visibility changes. |
| Query, Filters, request part/comment fields | **enabled inert** — they do not filter data or change the request summary. |
| Final Send request | **correctly locked/absent** and **backend contract required** — disabled; modal context explains preview-only, and operational eligibility/authorization/idempotency remain uncontracted. |

<a id="controls-settlements"></a>
### Settlements `/dealer/settlements`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Period buttons | **working local** — selected period and empty-state text change, but no ledger is filtered yet. |
| Refresh balance | **enabled inert** — no refresh/state change occurs. |
| Excel | **backend contract required** — disabled without a persistent export reason. |

<a id="controls-inventory"></a>
### Inventory `/dealer/parts-inventory`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Low-stock checkbox | **working local** — checked state and empty-state explanation change. |
| Query | **enabled inert** — input does not filter a collection. |
| Stock mutation/sync | **correctly locked/absent** — no operational controls are exposed. |
| Remote inventory read | **backend contract required** — location, freshness, price visibility, and pagination must be defined. |

<a id="controls-network"></a>
### Network `/dealer/network`

| Control family | Classification and observable effect / lock reason |
|---|---|
| Parts/units tabs | **working local** — placeholder and empty-state copy change. |
| Query and dealer select | **enabled inert** — no collection is filtered. |
| Allocation/reservation | **correctly locked/absent** — no cross-dealer write control is exposed. |
| Remote network read | **backend contract required** — cross-dealer privacy/scope/freshness contracts are required. |

<a id="controls-parts-report"></a>
### Parts report `/dealer/parts-report`

| Control family | Classification and observable effect / lock reason |
|---|---|
| KPI totals and order links | **working local** — values derive from local orders and links open detail. |
| Period and manager selects | **enabled inert** — neither filters rows/totals. |
| Status column | **wrong action** — every row renders New instead of deriving the order status. |
| Excel | **backend contract required** — disabled without a persistent export reason. |

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
