# Dealer Secondary Pages Specification

Use one shared FeaturePage grammar: 24px heading, 15px helper, optional KPI row, 36px toolbar, white bordered content card and source-specific empty/populated state.

## Certification status

Except where a 2026-07-18 artifact is named below, secondary-page observations are historical route-inventory records rather than fresh source captures. The 2026-07-20 probe was admin-authenticated and is non-certifying for dealer-only routes. Fresh dealer-authenticated evidence is **PENDING** for desktop 1440px and mobile 390px on every page in this specification.

All local controls follow the boundary in [dealer-workflow-boundaries.spec.md](./dealer-workflow-boundaries.spec.md): enabled means deterministic local effect; unavailable external effects are locked with a persistent touch- and keyboard-readable reason.

## Meaningful variants

- Accessories: three families, product grid, filters and product detail dialog. Family/query/sort/compatibility controls must filter a typed local product collection; add-to-cart must use the selected product's SKU/price, never a fixed unrelated fixture. Historical detail evidence: [dealer-accessory-detail.png](../../design-references/dealer-accessory-detail.png).
- Units: four tabs and expandable container HAMU4124410. Tab counts, query fields (including the fields named in its placeholder), and expanded data must derive from the same typed local collection. Historical evidence: [dealer-units-expanded.png](../../design-references/dealer-units-expanded.png).
- Schedule: local timeline/list/detail dialog. Category, text query, selected slot, view tab, and displayed counts must derive from the same typed local slot collection. Historical evidence: [dealer-schedule-slot.png](../../design-references/dealer-schedule-slot.png).
- BossWeb: local fixture lookup, result/no-result, and availability comparison. It must not invoke BossWeb or imply a remote lookup. Historical evidence: [dealer-bossweb-result.png](../../design-references/dealer-bossweb-result.png).
- Workshop: local work-order creation is allowed, but stage/progression/assignment semantics remain unverified until the dealer source pass. Do not enable unverified workflow transitions.
- Consignment: stock/network/request tabs and request preview may be local. Search/filter must be deterministic if enabled; final operational request submission remains locked.
- Settlements: period selection may be enabled only when it filters a typed local ledger. Refresh, synchronization, and real export remain locked.
- Documents, Drafts, Inventory and Network: historical empty states do not prove current fields or actions. Use an honest empty/read-only state until source evidence and typed local data define a deterministic interaction. In particular, do not leave an enabled inert draft/create/refresh/filter control.
- Parts report: local date/manager/status filters and totals must derive from local order data, or remain locked/empty. Real refresh/export remains locked.

## Source-safe future pass

For each page, record URL, dealer identity, viewport, capture path, safe navigation/filter/tab/disclosure actions, visible lock reasons, and confidence. Do not invoke synchronization, import/export/download, operational submit, reservation, shipment, approval, or permission changes.
