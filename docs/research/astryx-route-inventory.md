# Astryx route inventory

This inventory was reconciled against `src/app/**/page.tsx`, each `generateStaticParams` implementation, the production `.next/prerender-manifest.json`, and the existing Playwright/state tests at commit `f356dd9863db073d966d7ef83b3fee8ef39d7a5d`.

## Route source map and migration ownership

| Source route | Emitted/static scope | Stable shell and owning controller/view | Existing behavior coverage | Responsive or custom surface | Astryx batch |
| --- | --- | --- | --- | --- | --- |
| `/(dealer)/page.tsx` | `/` | `AppShell(dealer)` → `DealerDashboard` | `dealer-shell-contract`, `dealer-auth-navigation` | dealer shared shell | 14 |
| `/(dealer)/cart/page.tsx` | `/cart` | `AppShell(dealer)` → `CartPage` | `dealer-catalog-order-flow`, `dealer-safe-actions` | cart drawer/page | 15 |
| `/(dealer)/catalog/[[...slug]]/page.tsx` | 11 catalog paths | `AppShell(dealer)` → `CatalogRouter`; standalone diagram uses `RoleGate` | `dealer-catalog-order-flow`, `dealer-accessory-data` | diagram has intentional horizontal domain scroller | 14 |
| `/(dealer)/dealer/orders/page.tsx`, `[id]/page.tsx`, `order-detail/page.tsx` | index + 2 generated IDs/codes + query route | `AppShell(dealer)` → `DealerOrdersPage` / `DealerOrderDetail` | `dealer-order-detail`, `dealer-orders-schedule-toolbar`, `dealer-workflow-isolation` | mobile order cards | 15 |
| `/(dealer)/order-confirmation/page.tsx`, `[id]/page.tsx` | index + 2 generated IDs/codes | `AppShell(dealer)` → `OrderConfirmationPage` | `dealer-catalog-order-flow`, `dealer-order-drafts` | confirmation summary | 15 |
| `/(dealer)/dealer/customers/page.tsx` | `/dealer/customers` | `AppShell(dealer)` → `DealerCustomers` | `dealer-customers-equipment`, `dealer-safe-actions` | mobile record cards | 18 |
| `/(dealer)/dealer/team-access/page.tsx` | `/dealer/team-access` | `AppShell(dealer)` → `DealerTeamAccess` | `dealer-auth-navigation`, `dealer-shell-contract` | permission controls | 18 |
| `/(dealer)/dealer/[feature]/page.tsx` | 12 feature paths below | `AppShell(dealer)` → `DealerFeaturePage` dispatch | `dealer-feature-routes`, `dealer-operational-features`, `dealer-secondary-pages` | see per-feature rows | 14–18 |
| `/admin/page.tsx` | `/admin` | `AppShell(admin)` → `AdminOverview` | `admin-mobile-contract` | admin shared shell | 4 |
| `/admin/order-pipeline/page.tsx`, `orders/[id]/page.tsx`, `order-detail/page.tsx` | index + 33 generated IDs/codes + query route | `AppShell(admin)` → `AdminOrderPipeline` / `AdminOrderDetail` | `admin-mobile-operations`, `admin-mobile-contract` | responsive toolbars/list-kanban | 8 |
| `/admin/[feature]/page.tsx` | 22 feature paths below | `AppShell(admin)` → `AdminFeaturePage` dispatch | `admin-mobile-*` route contracts where named below | see per-feature rows | 8–13 |
| `/admin/integrations/1c/page.tsx` | `/admin/integrations/1c` | `AppShell(admin)` → `AdminOneCIntegrationsPage` | no dedicated route test | integration table | 13 |
| `/admin/integrations/1c/unit-mapping/page.tsx` | `/admin/integrations/1c/unit-mapping` | `AppShell(admin)` → `AdminUnitMappingPage` | no dedicated route test | mapping table | 13 |
| `/admin/integrations/bossweb/page.tsx` | `/admin/integrations/bossweb` | `AppShell(admin)` → `AdminBossWebIntegrationsPage` | no dedicated route test | mapping table | 13 |
| `/admin/settlements/mapping/page.tsx` | `/admin/settlements/mapping` | `AppShell(admin)` → `AdminDealerMappingPage` | no dedicated route test | mapping table | 13 |
| `/login/page.tsx` | `/login` | `LoginForm` | `dealer-login-role`, `dealer-auth-navigation` | shared auth surface | 4 |
| `/offline/page.tsx` | `/offline` | `OfflinePage` | `dealer-pwa-pages` | PWA offline shell | 20 |

### Admin feature dispatch (`AdminFeaturePage`)

| Static feature path | Concrete view | Existing behavior coverage | Responsive/custom note | Batch |
| --- | --- | --- | --- | ---: |
| `/admin/supplier-orders` | `AdminSupplierOrdersPage` | `admin-mobile-operations` | compact filter toolbar | 8 |
| `/admin/consignment` | `AdminConsignmentPage` | `admin-mobile-operations` | intentional horizontal inventory matrix | 8 |
| `/admin/returns` | `AdminReturnsPage` | `admin-mobile-operations` | compact status/search controls | 8 |
| `/admin/air-freight` | `AdminAirFreightPage` | `admin-mobile-operations` | process timeline | 8 |
| `/admin/ocean-freight` | `AdminOceanFreightPage` | `admin-mobile-operations` | grouped BL/container table | 9 |
| `/admin/unit-shipping` | `AdminUnitShippingPage` | `admin-mobile-operations` | dense delivery filters | 9 |
| `/admin/warehouse` | `AdminWarehousePage` | `admin-mobile-warehouse-invoices` | operational workspace | 9 |
| `/admin/settlements` | `AdminSettlementsPage` | `admin-mobile-operations` | expandable reconciliation rows | 9 |
| `/admin/invoices` | `AdminInvoicesPage` | `admin-mobile-warehouse-invoices` | document/editor panels | 10 |
| `/admin/catalog` | `AdminCatalogPage` | `admin-mobile-catalog` | table-to-card responsive behavior | 10 |
| `/admin/schedule` | `AdminSchedulePage` | `admin-mobile-schedule` | custom chronology visualization | 10 |
| `/admin/analytics` | `AdminAnalyticsPage` | `admin-mobile-contract` | data/grid visualization | 10 |
| `/admin/parts-report` | `AdminPartsReportPage` | no dedicated route test | report table | 11 |
| `/admin/performance` | `AdminPerformancePage` | no dedicated route test | performance visualization | 11 |
| `/admin/bossweb-lookup` | `AdminBossWebLookupPage` | no dedicated route test | query-driven lookup table | 11 |
| `/admin/companies` | `AdminCompaniesPage` | `admin-mobile-people` | mobile company cards | 12 |
| `/admin/dealer-access` | `AdminDealerAccessPage` | `admin-mobile-people` | permission policy matrix | 12 |
| `/admin/users` | `AdminUsersPage` | `admin-mobile-people` | mobile user cards | 12 |
| `/admin/permissions` | `AdminPermissionsPage` | `admin-mobile-permissions-compact` | matrix becomes permission cards | 12 |
| `/admin/tasks` | `AdminTasksPage` | no dedicated route test | operations table | 12 |
| `/admin/integrations` | `AdminIntegrationsPage` | no dedicated route test | integration status panels | 13 |
| `/admin/settings` | `AdminSettingsPage` | no dedicated route test | design-system setting target | 13 |

### Dealer feature dispatch (`DealerFeaturePage`)

| Static feature path | Concrete view | Existing behavior coverage | Responsive/custom note | Batch |
| --- | --- | --- | --- | ---: |
| `/dealer/accessories` | `AccessoriesPage` | `dealer-accessories-search`, `dealer-accessory-data` | brand/model/category filters, product cards | 16 |
| `/dealer/units` | `UnitsPage` | `dealer-operational-features` | units table/cards | 16 |
| `/dealer/schedule` | `SchedulePage` | `dealer-orders-schedule-toolbar` | schedule visualization | 16 |
| `/dealer/bossweb` | `BossWebPage` | `dealer-operational-features` | parts lookup | 16 |
| `/dealer/workshop` | `WorkshopPage` | `dealer-operational-features`, `dealer-safe-actions` | board/status workflow | 16 |
| `/dealer/documents` | `DocumentsPage` | `dealer-secondary-pages` | documents table/cards | 17 |
| `/dealer/order-drafts` | `OrderDraftsPage` | `dealer-order-drafts` | drafts workflow | 17 |
| `/dealer/consignment` | `ConsignmentPage` | `dealer-secondary-pages` | inventory matrix | 17 |
| `/dealer/settlements` | `SettlementsPage` | `dealer-secondary-pages` | settlement rows | 17 |
| `/dealer/parts-inventory` | `InventoryPage` | `dealer-secondary-pages` | inventory list | 17 |
| `/dealer/network` | `NetworkPage` | `dealer-secondary-pages` | network list | 18 |
| `/dealer/parts-report` | `PartsReportPage` | `dealer-secondary-pages` | parts report | 18 |

## Query-compatible routes

These are runtime query representations, so they are not separate prerender paths but must retain their view/controller behavior after a renderer switch.

| URL contract | Controller/view | Existing coverage |
| --- | --- | --- |
| `/admin/order-detail?id=<generated-admin-id-or-code>` | `AdminOrderDetail` | `admin-mobile-operations` |
| `/dealer/order-detail?id=<generated-dealer-id-or-code>` | `DealerOrderDetail` | `dealer-order-detail` |
| `/order-confirmation?id=<generated-dealer-id-or-code>` | `OrderConfirmationPage` | `dealer-catalog-order-flow` |
| `/catalog/...?...year=&series=&model=&diagram=` | `CatalogRouter` / `DiagramViewer` | `dealer-catalog-order-flow` |
| `/admin/bossweb-lookup?part=` | `AdminBossWebLookupPage` | no dedicated query test |
| `/admin/dealer-access?company=` | `AdminDealerAccessPage` | `admin-mobile-people` |

## Exact static output (102 paths)

### Public/framework paths (6)

`/_global-error`, `/_not-found`, `/favicon.ico`, `/login`, `/manifest.webmanifest`, `/offline`

### Admin paths (62)

**Root and feature paths (23):**

`/admin`, `/admin/air-freight`, `/admin/analytics`, `/admin/bossweb-lookup`, `/admin/catalog`, `/admin/companies`, `/admin/consignment`, `/admin/dealer-access`, `/admin/integrations`, `/admin/invoices`, `/admin/ocean-freight`, `/admin/parts-report`, `/admin/performance`, `/admin/permissions`, `/admin/returns`, `/admin/schedule`, `/admin/settings`, `/admin/settlements`, `/admin/supplier-orders`, `/admin/tasks`, `/admin/unit-shipping`, `/admin/users`, `/admin/warehouse`

**Special explicit paths (6):**

`/admin/integrations/1c`, `/admin/integrations/1c/unit-mapping`, `/admin/integrations/bossweb`, `/admin/order-detail`, `/admin/order-pipeline`, `/admin/settlements/mapping`

**Generated `/admin/orders/[id]` values (33):**

`386960e7-2e28-4bb0-8fa9-83e45f84df7a`, `659fb637-d5c6-4d10-8739-baf0e30d4449`, `7c5495ea-6549-4fc5-9421-e62e62cf5509`, `847a33b6-c168-46bf-9d5e-f4c0dabb2c7b`, `a20b2bdd-2a1f-4322-a50a-fe68a17f4963`, `aa12301e-0294-4cb2-8bcb-3ec8f13f0ba6`, `CHK-03`, `CHK-2-02`, `DNE-07`, `KHA-05`, `KHA-07`, `KHA-08`, `KIE-ST-20`, `KIE-ST-23`, `KIE-ST-28`, `KIE-ST-29`, `KIE-ST-30`, `KIE-ST-31`, `KS-01`, `KS-05`, `KS-06`, `KS-07`, `KS-08`, `KS-09`, `LOG-01`, `LSM-07`, `LSM-09`, `LSM-10`, `RVN-01`, `VYS-04`, `ZAP-E-03`, `ZHY-06`, `ZHY-07`.

Each generated value above appears as `/admin/orders/<value>`.

### Dealer paths (34)

**Core and explicit paths (18):**

`/`, `/cart`, `/dealer/accessories`, `/dealer/bossweb`, `/dealer/consignment`, `/dealer/customers`, `/dealer/documents`, `/dealer/network`, `/dealer/order-detail`, `/dealer/order-drafts`, `/dealer/orders`, `/dealer/parts-inventory`, `/dealer/parts-report`, `/dealer/schedule`, `/dealer/settlements`, `/dealer/team-access`, `/dealer/units`, `/dealer/workshop`

**Catalog generated paths (11):**

`/catalog`, `/catalog/CAN_OFF_EN_US`, `/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25`, `/catalog/CAN_OFF_EN_US/152970b5-6fc4-427c-b0c4-0b44f69baa8e`, `/catalog/CAN_OFF_EN_US/33c5dc49-42ec-4f09-87c6-bd6cf1417de2`, `/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603`, `/catalog/CAN_OFF_EN_US/7560bdc0-e7f3-4d84-9812-b8ecb55d948a`, `/catalog/CAN_OFF_EN_US/sxs`, `/catalog/CAN_ONR_EN_US`, `/catalog/SEA_DOO_EN_US`, `/catalog/SKI_DOO_EN_US`

**Generated order and confirmation paths (5):**

`/dealer/orders/LOG-01`, `/dealer/orders/a20b2bdd-2a1f-4322-a50a-fe68a17f4963`, `/order-confirmation`, `/order-confirmation/LOG-01`, `/order-confirmation/a20b2bdd-2a1f-4322-a50a-fe68a17f4963`

The category totals are 6 public/framework + 62 admin + 34 dealer = **102**. Every generated value is explicit above; no generic route source has been mistaken for one visual surface.
