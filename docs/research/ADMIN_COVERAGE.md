# Admin source → specification → clone coverage

Updated 2026-07-18. This table is the final route-level handoff. Exact source URLs, screenshots, DOM inventories and visual tokens live in the corresponding files under `docs/research/components/`.

Evidence rules:

- **Covered** means the source state is evidenced in its route specification and the local implementation was exercised without an external request.
- **Local-only** means a deterministic safety/accessibility correction or representative fixture, not a claim about source behavior.
- **Blocked** means the source state would require a mutation, synchronization, upload/download or deliberately induced failure.
- Every table tab, subtab, segmented state and role switch is tested independently even when two states share the same empty copy.

## Route coverage

| Route | Source states inspected | Local states exercised | Comparison evidence | Remaining gap |
|---|---|---|---|---|
| `/admin` | KPI, queue, shortcuts, recent orders | KPI, queue/distribution and recent orders; shortcut panel deliberately removed by the 2026-07-18 user refinement | `clone-admin-overview-{desktop,mobile,tablet,dark}.png` | Legacy overview spec predates the strict evidence label |
| `/admin/order-pipeline` | List/Kanban, search hit/miss, period, notifications, unread, pages 1–3, collapsed/expanded groups | Both views; notification/unread results; all three pages; every page group | `clone-admin-order-pipeline-{desktop,mobile,tablet,dark}.png` | Loading/network error not forced; seven KPI cards are source summaries, not proven filters |
| `/admin/orders/:id` | New, Waiting, Partially shipped, Done, Cancelled; lines, timeline, chat, 1C, shipment, preflight error | Distinct typed orders and safe preview; final actions disabled | `clone-admin-order-detail-new-{desktop,mobile,tablet,dark}.png` | Successful live preflight and all mutation endpoints blocked |
| `/admin/supplier-orders` | All, Backorders, Exceptions | All three tabs independently selected; period/sorts/filter-empty/exception cards | `clone-admin-supplier-orders-{desktop,mobile}.png` | No populated supplier-order detail in source |
| `/admin/consignment` | Warehouse, Network, Requests | Three tabs plus all six request-status states | `clone-admin-consignment-{desktop,mobile}.png` | Request detail/confirmation absent in source |
| `/admin/returns` | Six empty statuses; create preview variants | All six statuses; dealer/line/quantity/condition preview | `clone-admin-returns-{desktop,mobile}.png` | No saved return/detail in source |
| `/admin/air-freight` | Overview, Shipments, shipment filters, upload preview | Both tabs and all empty shipment filters; upload final disabled | `clone-admin-air-freight-{desktop,mobile}.png` | Source has no populated AWB/manifest workflow |
| `/admin/ocean-freight` | Ocean, Ground, Dealer Equipment; table/cards/grouping; container disclosure, BL detail, receipt/document previews; all seven Parts Receipt subtabs | Three tabs; grouped/ungrouped, table/cards; container disclosure; evidence-limited or exact BL detail; five dealer-equipment categories; BL-level receipt preview and seven independent receipt states | `clone-admin-ocean-freight-{desktop,mobile,tablet,dark}.png` | Network error and exact no-result copy not forced |
| `/admin/unit-shipping` | Remaining, Shipped, VIN expansion, page/search/filter states | Both tabs, search hit/miss/reset, pagination and VIN expansion | `clone-admin-unit-shipping-{desktop,mobile}.png` | Sync blocked; loading/error not forced |
| `/admin/warehouse` | Six process tabs and route-specific subviews | Six tabs; receipt 2 views × 3 sources; shortages 3; fulfillment 4 filters × 2 views; summary 2; placement search/pages/edit preview | `clone-admin-warehouse-{desktop,mobile,tablet,dark}.png` | Receipt/import/export/location commits blocked |
| `/admin/settlements` | Search, dealer expansion, four date presets, source DNS failure | Search/expand/date-only local fields | `clone-admin-settlements-{desktop,mobile}.png` | Live 1C balances unavailable; refresh blocked |
| `/admin/invoices` | Contracts, Appendices, Invoices, Cost | Four tabs; per-tab search; safe contract/appendix/BL/formed-invoice/cost previews; invoice All/Transit/Arrived; cost Active/Archive/Incomplete | `clone-admin-invoices-{desktop,mobile}.png` | Source mobile main area is defective; clone keeps content accessible; deep rows remain limited to captured evidence |
| `/admin/catalog` | Vehicles, Distributor Prices, Parts; all category tabs; filters/debug/history/pages | Three primary tabs; all 4 vehicle categories; all 4 distributor categories; external advanced-filter disclosure; parts filters/pages | `clone-admin-catalog-{desktop,mobile,tablet,dark}.png` | Durable route error not forced |
| `/admin/schedule` | Deliveries, Warehouse Stock; list/detail pages and search | Both tabs, search and both pagination families | `clone-admin-schedule-{desktop,mobile}.png` | Durable error not forced; sync/export blocked |
| `/admin/companies` | Search, employee popover, create/edit/assign/policy previews | All safe preview states with synthetic identities | `clone-admin-companies-{desktop,mobile}.png` | Source employee selector identifiers intentionally not captured |
| `/admin/dealer-access` | Team, company selector, 47-right matrix, searches | Company/search states; switches disabled | `clone-admin-dealer-access-{desktop,mobile,tablet,dark}.png` | Alternate company policy datasets not established |
| `/admin/users` | Pending, Active, Deactivated; searches and three role previews | All three tabs independently selected; safe edit previews | `clone-admin-users-{desktop,mobile}.png` | Empty Pending tab has no approval preview |
| `/admin/permissions` | Manager and Dealer schemas/searches | Both role tabs and role-local searches | `clone-admin-permissions-{desktop,mobile}.png` | Admin tab does not exist by design |
| `/admin/tasks` | Four form presets and non-filtering search | Every preset changes form-only state; operational actions disabled | `clone-admin-tasks-{desktop,mobile}.png` | No safe task output/log state |
| `/admin/analytics` | Eight tabs; seven unsynced states; populated 600-unit tab | All eight tabs independently selected; Unit filters/sort/search/six pages | `clone-admin-analytics-{desktop,mobile}.png` | Durable route error not forced |
| `/admin/parts-report` | Six periods, manager menu, three result tables | All periods/manager/date-only filter and safe order link | `clone-admin-parts-report-{desktop,mobile}.png` | Refresh/export blocked |
| `/admin/performance` | Four distinct rankings and search/no-result | Four rankings independently selected; hit/miss search | `clone-admin-performance-{desktop,mobile,dark}.png` | Refresh/loading/error blocked or unforced |
| `/admin/bossweb-lookup` | Initial, source handoff defect, loading, known result | `?part=` immediate known result and deterministic local miss | `clone-admin-bossweb-lookup-{desktop,mobile,dark}.png` | Unknown live source lookup and refresh blocked |
| `/admin/integrations` | Two-card overview and live search states | Both/1C/BossWeb/no-result search | `clone-admin-integrations-{desktop,mobile,dark}.png` | Live telemetry varies |
| `/admin/integrations/1c` | Sync, Tokens, 262-row History, API Docs | All four tabs; all 14 history pages | `clone-admin-integrations-1c-{sync,mobile,dark}.png` | Token/sync/mode/resume operations blocked |
| `/admin/integrations/1c/unit-mapping` | All 53, Linked 17, Pending 36; 90-row expansion | Three states and representative expansion | `clone-admin-integrations-unit-mapping-{expanded,mobile}.png` | Auto-link/per-unit link blocked |
| `/admin/settlements/mapping` | Baseline, Logos hit, no-result | Search states with synthetic identifiers | `clone-admin-integrations-dealer-mapping.png`, `clone-admin-integrations-dealer-mapping-mobile.png` | Add/edit/delete blocked |
| `/admin/integrations/bossweb` | Settings, Orders, Price Lists, Matching; order expansion | Four tabs independently selected; 13-position expansion; all settings disabled | `clone-admin-integrations-bossweb-{settings,order-expanded,mobile,tablet,dark}.png` | Source preset incident makes every settings/sync path blocked |
| `/admin/settings` | Worker, queue, database searches; no-result | All search families and no-result; system controls disabled | `clone-admin-settings-{desktop,mobile,tablet,dark}.png` | Durable loading/error not forced |

## Cross-route acceptance

- Desktop comparison exists for every admin route; mobile comparison exists for every admin route.
- Tablet and dark captures cover each unique layout family rather than duplicating identical shells.
- Dealer global search opens on input without Enter and consumes no URL navigation; all five result tabs are independent.
- Ocean receipt/posting preview is rendered at BL/коносамент group level and never once per container row.
- Ocean freight is the shared control-composition benchmark: tabs remain separate from the contained search/filter/view toolbar, while consignment intentionally combines search and compact tabs in one contained row per the user refinement.
- No local admin component calls an external API or changes an order/integration/warehouse operational status.
- Final operational CTAs are hard-disabled; read-only preview controls can only open/close local UI.
