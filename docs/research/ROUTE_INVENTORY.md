# Route Inventory

## Priority legend

- P0: must be deeply interactive for acceptance.
- P1: faithful page and meaningful local interaction.
- P2: faithful representative state.

## Dealer

| Route | Priority | Captured state | Clone acceptance |
|---|---:|---|---|
| / | P0 | Populated after LOG-01 | KPI/order values react to local demo data |
| /catalog and /catalog/:slug* | P0 | Full path through diagram | Search and every representative drill-down step work |
| /cart | P0 | Empty and one-line populated | Quantity/customer/PO/note/delivery/submit work |
| /order-confirmation/:id | P0 | LOG-01 receipt | New local order data is rendered |
| /dealer/orders | P0 | Empty then one New order | Search/status/list/Kanban and open detail |
| /dealer/orders/:id | P0 | New LOG-01 | Line, notes, chat and timelines |
| /dealer/customers | P0 | Empty then one QA client | Create, search, detail and equipment |
| /dealer/team-access | P0 | One primary user | Read-only rights; no invented dealer add-user action |
| /dealer/accessories | P1 | Families, grid, product dialog | Filters and product detail; add representative product |
| /dealer/units | P1 | 15 shipments / 13 units | Tabs and expandable shipment row |
| /dealer/workshop | P1 | Empty board/new-order dialog | Local demo work order creation |
| /dealer/bossweb | P1 | 9779150 result | Search and dual availability comparison |
| /dealer/schedule | P1 | 23 slots | Timeline and slot detail |
| /dealer/documents | P2 | Empty | Filters and source empty state |
| /dealer/order-drafts | P2 | Empty | Search/tool controls and source empty state |
| /dealer/consignment | P2 | Empty | Tabs and request dialog preview |
| /dealer/settlements | P2 | Period summary | Period selection and representative table |
| /dealer/parts-inventory | P2 | Empty | KPI/search/low-stock state |
| /dealer/network | P2 | Empty | Equipment/parts tabs |
| /dealer/parts-report | P2 | Report | Date/manager filters and local order |

## Admin

| Route | Priority | Captured state | Clone acceptance |
|---|---:|---|---|
| /admin | P0 | 124 orders, LOG-01 recent | Shortcut search and local-order metrics |
| /admin/order-pipeline | P0 | 124 total; 10 New, 28 Waiting, 0 Supplier-waiting, 0 Ready, 0 Sent, 74 Done, 12 Cancelled; list/Kanban, page 1/3, search hit/miss, period and unread states | Search/list/Kanban/unread/pagination/group expansion; representative rows open; no status mutation |
| /admin/orders/:id | P0 | LOG-01 New, KS-05 Waiting, KIE-ST-23 Partially shipped, KHA-07 Done, KS-01 Cancelled; real distinct lines/chat/timelines/1C/shipment; preflight error | Typed per-order lines and panels; safe GET preview opens; every POST/PATCH/final action disabled |
| /admin/supplier-orders | P1 | All empty; Backorders empty-positive; Exceptions has two missing-PDF shipments; period and four sorts | Every tab is independent; local period/sort/filter; safe Air Freight links; no supplier-order mutation |
| /admin/consignment | P1 | 1,246-part / 16-dealer warehouse matrix; 200-row network / 270 units; six empty request statuses; hit/miss search | Independent Warehouse/Network/Requests tabs, matrix scrolling and local filters; request mutation absent |
| /admin/returns | P1 | Six empty list statuses; create preview; empty and populated dealer states; representative 24-line KIE-ST set | Working status filters and safe create-form browsing; final return creation hard-disabled |
| /admin/air-freight | P0 | Overview: 28 pending consolidation; Shipments: empty; upload preview | Route-specific overview/shipments and disabled upload preview |
| /admin/ocean-freight | P0 | Evidence lock 32 BLs / 71 containers / 36 transit / 35 arrived; final live read-only check 35 transit / 36 arrived; three tabs and all seven Parts Receipt subtabs | Typed BL/container/equipment data, working views/filters, disabled final actions |
| /admin/unit-shipping | P0 | 34 remaining, 84 shipped; VIN expansion and no-result | Typed BossWeb rows, tabs/search/filter/pagination/VIN expansion; sync disabled |
| /admin/warehouse | P1 | Six workflow families: four receiving shipments, zero receipt summary, three empty shortage views, empty fulfillment, 1,061-part/four-shipment summary, 5,211 placement rows | Every tab/subtab/view is separate; search/pagination/preview work; receiving, export, import and location commits disabled |
| /admin/settlements | P1 | 19 dealers, 2,359 movements; search hit/miss; collapsed/expanded dealer; four date presets; source DNS diagnostic | Local search/expand/date state; no polling, refresh or settlement mutation |
| /admin/invoices | P1 | Contracts (2), Appendices (23), Invoices (32 BL / 60 formed), Cost (24 active / 8 archive / 19 incomplete); previews and filters | Four route-specific tab families, safe preview modals and working local filters; create/update/export disabled |
| /admin/catalog | P1 | Vehicles 98; distributor prices 129; parts 176,221 / 3,525 pages; Debug 415005700; 20 import rows | Every catalog tab has its own model/search/filter/page behavior; edit/delete/recalculate/import/sync disabled |
| /admin/schedule | P1 | Deliveries 23 / four pages; slot two-page detail; hit/miss search; populated Warehouse stock | Both tabs, page controls, search and slot selection work locally; no schedule mutation |
| /admin/companies | P1 | 20 companies / 102 employees; hit/miss search; employees popover; create/edit/assign/policy previews | Preview-only local forms and GET policy navigation; final create/update/assign disabled |
| /admin/dealer-access | P1 | Five team rows; 47 rights (35/12); 20-company selector; command/profile/no-result searches | Company selection and dual collection filtering work; every permission switch/save is read-only |
| /admin/users | P1 | Pending 0, Active 102, Deactivated 0; searches; dealer/manager/admin edit previews | All three tabs are distinct; menus may inspect; deactivate/save/toggles/reset disabled |
| /admin/permissions | P1 | Manager 15 entities / 33 of 54; Dealer 16 + divider / 35 of 47; role-local searches | Both role tabs and action/object searches work; all switches and reset/save controls disabled |
| /admin/tasks | P1 | Queue 1/0/0/0/0; all four catalog-sync presets; 1C task and danger zone | Presets change local form state only; Run/pause/clear/reset/sync actions disabled |
| /admin/analytics | P1 | Eight tabs: seven explicit unsynced empty families plus populated 600-unit analytics; all shared filters, unit filters/sorts/search and six pages | Every tab and filter family is independently implemented; no sync or operational callback |
| /admin/parts-report | P1 | Six period presets; manager menu; one $13.09 order; empty RN/payment tables | Working local dates/manager selection; safe order link; Refresh/export disabled |
| /admin/performance | P1 | Four distinct top-40 rankings; exact KPI per ranking; module/SQL/no-result search | Ranking selects different fixtures; immediate search; Refresh hard-disabled |
| /admin/bossweb-lookup | P1 | Empty, source query-param defect, loading, known 9779150 result and local unknown state | `?part=` intentionally fixed to resolve immediately from typed fixtures; refresh/external call disabled |
| /admin/integrations | P1 | Two-card overview; immediate 1C/BossWeb/no-result search | Route-specific cards and safe GET navigation; no generic diagnostics placeholder |
| /admin/integrations/1c | P1 | KPI 262/0/262; Sync, Tokens, 262-row History across all 14 pages, API Docs | Four distinct tabs; local pagination; every token/sync/mode/POST action disabled |
| /admin/integrations/1c/unit-mapping | P1 | 53 codes / 600 units / 324 linked / 276 pending; 17/36 filters; 4WTJ 90-row expansion | Independent filters and expansion; auto-link/link actions disabled |
| /admin/settlements/mapping | P1 | 20 dealers / 19 mapped / 72 links; Logos hit and no-result | Immediate local search with synthetic identifiers; add/edit/delete disabled |
| /admin/integrations/bossweb | P1 | Settings; 200 of 232 orders (25/175) with 13-position expansion; five price lists; 232 matching (25/207) | Four distinct tabs and representative expansion; settings/sync/download/link/rematch all hard-disabled |
| /admin/settings | P1 | Workers, queue and database panels; worker/queue/database/no-result searches | Immediate section search; Refresh, worker selector and all queue actions hard-disabled |

Every admin row above has a route-specific source specification under `docs/research/components/`. Claims not backed by its screenshot/DOM evidence are labelled as local behavior inside that specification; no remaining admin route in this inventory is represented by the old generic assumption page.
