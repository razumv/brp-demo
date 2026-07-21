# Dealer Secondary Pages Specification

Use one shared FeaturePage grammar: 24px heading, 15px helper, optional KPI row, a dealer-owned data toolbar, white bordered content card and source-specific empty/populated state. The data toolbar keeps the search field fluid and the 44px filter trigger immediately to its right; filters disclose below the row, show an active count, and provide a deterministic reset.

## Certification status

Except where a 2026-07-18 artifact is named below, secondary-page observations are historical route-inventory records rather than fresh source captures. The 2026-07-20 probe was admin-authenticated and is non-certifying for dealer-only routes. Fresh dealer-authenticated evidence is **PENDING** for desktop 1440px and mobile 390px on every page in this specification.

The current local implementation follows the boundary in [dealer-workflow-boundaries.spec.md](./dealer-workflow-boundaries.spec.md): enabled means deterministic local effect; unproven remote effects are absent unless a source-required lock can provide a persistent touch- and keyboard-readable reason. This is implementation evidence, not a new dealer-source observation.

## Meaningful variants

- Accessories: three families, product grid, filters and product detail dialog. Family/query/sort/compatibility controls must filter a typed local product collection; add-to-cart must use the selected product's SKU/price, never a fixed unrelated fixture. Historical detail evidence: [dealer-accessory-detail.png](../../design-references/dealer-accessory-detail.png).
- Units: four tabs and the captured 15-shipment / 13-unit Incoming projection. Container HAMU4124410 exposes `1/4`, BL `260101582`, ETA `May 11`, source status/action badges, proforma, and the captured unit-row column family. Search covers container, BL, model, SKU and VIN; action filtering and all counters derive from the same typed shipment collection. Shipment/status/action badges remain read-only. Historical evidence: [dealer-units-expanded.png](../../design-references/dealer-units-expanded.png).
- Schedule: timeline, selected-slot detail dialog, category filter, text query, and displayed counts derive from the same typed local slot collection. The current local page does not claim a source-observed alternate view tab. Historical evidence: [dealer-schedule-slot.png](../../design-references/dealer-schedule-slot.png).
- BossWeb: local fixture lookup, result/no-result, and availability comparison. It must not invoke BossWeb or imply a remote lookup. Historical evidence: [dealer-bossweb-result.png](../../design-references/dealer-bossweb-result.png).
- Workshop: full-width search covers description, customer, mechanic and notes; stage and work-type filters change the rendered static board. Local work-order creation is allowed and persisted, but cards are intentionally non-draggable and stage/progression/assignment semantics remain unverified until the dealer source pass. Do not enable unverified workflow transitions.
- Consignment: stock/network/request tabs remain outside the toolbar. Search and explicit available/reserved/requested filters operate on the active typed collection; request creation and final operational submission remain absent until their contract exists.
- Settlements: query and period filter one typed local ledger against the fixed certification reference date. Refresh, synchronization and real export are absent until their contracts exist.
- Documents: search plus type/status filters use the shared toolbar against typed document rows; Export is absent. Drafts: create/open/delete, search, content/buyer filters and Reset use persisted drafts through the shared toolbar; Excel and Refresh are absent. Inventory query/stock state and Network query/dealer selection are deterministic; Network dealer options derive from the active parts/units tab. No inventory mutation, reservation or allocation is exposed.
- Customers: query plus category filter share the same toolbar; category selection filters typed customer records and Reset restores all categories.
- Parts report: the dealer projection exposes order-code search, a date range, order links, item counts and totals from local orders. It intentionally omits the admin report schema, invented manager/status dimensions and non-working export.

## Source-safe future pass

For each page, record URL, dealer identity, viewport, capture path, safe navigation/filter/tab/disclosure actions, visible lock reasons, and confidence. Do not invoke synchronization, import/export/download, operational submit, reservation, shipment, approval, or permission changes.
