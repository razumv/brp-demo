# Page Topology

## Authentication and role entry

- /login is the only sign-in screen.
- A successful dealer sign-in lands on /.
- A successful administrator sign-in lands on /admin.
- The clone infers the demo role from the entered email and never stores the password.
- Authenticated pages share the same 64px header. At 1024px and above they use a 256px sidebar; below that breakpoint navigation is a drawer.

## Dealer route tree

- / — dashboard, KPIs, recent orders, attention and shortcuts.
- /catalog — manufacturer cards and model/part quick search.
- /catalog/CAN_OFF_EN_US — Can-Am Off-Road categories.
- /catalog/CAN_OFF_EN_US/:categoryId — years and series.
- /catalog/CAN_OFF_EN_US/:seriesId?parentId=:categoryId — model variants.
- /catalog/CAN_OFF_EN_US/:modelId?parentId=:seriesId — configurations.
- /catalog/CAN_OFF_EN_US/:configurationId?parentId=:modelId — diagrams.
- /catalog/CAN_OFF_EN_US/:diagramId?parentId=:configurationId — split diagram viewer and parts table.
- /dealer/accessories — accessory family and product browser.
- /dealer/orders — search, status totals, list/Kanban and order cards.
- /dealer/orders/:id — order lines, notes, chat and timelines.
- /dealer/documents — invoice/document filters and empty state.
- /dealer/order-drafts — draft list, Excel tools and new-draft action.
- /dealer/consignment — stock/network/request tabs.
- /dealer/settlements — period totals and transaction list.
- /dealer/parts-inventory — local inventory KPIs and search.
- /dealer/units — summary, incoming, inventory and sold tabs.
- /dealer/network — unit and part marketplace.
- /dealer/customers — searchable CRM, client creation and client details.
- /dealer/workshop — work-order board and creation dialog.
- /dealer/team-access — current team and permission policy.
- /dealer/parts-report — date/manager/period report.
- /dealer/bossweb — part availability comparison.
- /dealer/schedule — delivery timeline and slot detail.
- /cart — editable order draft and checkout.
- /order-confirmation/:id — submitted-order receipt.

## Admin route tree

- /admin — shortcuts, KPIs, queue state, redistribution and recent orders.
- /admin/order-pipeline — seven status filters, list/Kanban and grouped orders.
- /admin/orders/:id — read-only clone of order lines, messages and timelines.
- /admin/supplier-orders — supplier/backorder/exception views.
- /admin/consignment — parts-by-dealer matrix and requests.
- /admin/returns — return filters and empty state.
- /admin/air-freight — consolidation overview and event log.
- /admin/ocean-freight — ocean shipment cards and document/ETA controls rendered disabled in the clone.
- /admin/unit-shipping — shipment KPIs, categories and unit table.
- /admin/warehouse — receiving overview rendered read-only in the clone.
- /admin/settlements — dealer balances and movement totals.
- /admin/invoices — source currently exposes an empty main region.
- /admin/catalog — catalog, distributor prices and parts tabs.
- /admin/schedule — delivery timeline and slot detail.
- /admin/companies — company table, employee list and assignment-form preview.
- /admin/dealer-access — dealer/company selection and permission policy.
- /admin/users — pending, active and deactivated user views.
- /admin/permissions — role permission matrix.
- /admin/tasks — queue/task diagnostics rendered read-only in the clone.
- /admin/analytics — unsynchronised analytics empty state.
- /admin/parts-report — parts totals and linked orders.
- /admin/performance — database metrics and leaderboard.
- /admin/bossweb-lookup — part availability comparison.
- /admin/integrations — 1C/BossWeb integration status.
- /admin/settings — worker, queue and database diagnostics rendered read-only.

## Representative deep catalog path

Catalog -> Can-Am Off-Road -> ATV -> 2026 -> 001 - North America - Outlander 500/700 Series -> Outlander 500 2X4 - North America, 2026 -> configuration 0001KTB00 -> 00- Service - Maintenance Parts & Fluids.

The clone keeps this complete path navigable. The final view has desktop split panes and a mobile Schema/Parts tab switch.
