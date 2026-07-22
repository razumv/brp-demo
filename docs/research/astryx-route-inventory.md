# Astryx route inventory

This inventory was reconciled against `src/app/**/page.tsx`, each `generateStaticParams` implementation, the production `.next/prerender-manifest.json`, and the existing Playwright/state tests at commit `f356dd9863db073d966d7ef83b3fee8ef39d7a5d`.

## Route source map and migration ownership

| Source route | Emitted/static scope | Stable shell and owning controller/view | Existing behavior coverage | Responsive or custom surface | Astryx batch |
| --- | --- | --- | --- | --- | --- |
| `/(dealer)/page.tsx` | `/` | `src/components/shell/app-shell.tsx` → `src/components/dealer/dealer-dashboard.tsx` | `dealer-shell-contract`, `dealer-auth-navigation` | dealer shared shell | 14 |
| `/(dealer)/cart/page.tsx` | `/cart` | `src/components/shell/app-shell.tsx` → `src/components/catalog/cart-page.tsx` | `dealer-catalog-order-flow`, `dealer-safe-actions` | cart drawer/page | 15 |
| `/(dealer)/catalog/[[...slug]]/page.tsx` | 11 catalog paths | `src/components/shell/app-shell.tsx` → `src/components/catalog/catalog-router.tsx`; standalone diagram uses `src/components/shell/role-gate.tsx` | `dealer-catalog-order-flow`, `dealer-accessory-data` | diagram has intentional horizontal domain scroller | 14 |
| `/(dealer)/dealer/orders/page.tsx`, `[id]/page.tsx`, `order-detail/page.tsx` | index + 2 fixture/static IDs/codes + query-compatible runtime prefixes | `src/components/shell/app-shell.tsx` → `src/components/dealer/dealer-orders.tsx` | `dealer-order-detail`, `dealer-orders-schedule-toolbar`, `dealer-workflow-isolation` | mobile order cards | 15 |
| `/(dealer)/order-confirmation/page.tsx`, `[id]/page.tsx` | index + 2 fixture/static IDs/codes | `src/components/shell/app-shell.tsx` → `src/components/catalog/order-confirmation-page.tsx` | `dealer-catalog-order-flow`, `dealer-order-drafts` | confirmation summary | 15 |
| `/(dealer)/dealer/customers/page.tsx` | `/dealer/customers` | `src/components/shell/app-shell.tsx` → `src/components/dealer/dealer-customers.tsx` | `dealer-customers-equipment`, `dealer-safe-actions` | mobile record cards | 18 |
| `/(dealer)/dealer/team-access/page.tsx` | `/dealer/team-access` | `src/components/shell/app-shell.tsx` → `src/components/dealer/team-access.tsx` | `dealer-auth-navigation`, `dealer-shell-contract` | permission controls | 18 |
| `/(dealer)/dealer/[feature]/page.tsx` | 12 feature paths below | `src/components/shell/app-shell.tsx` → `src/components/dealer/dealer-feature-page.tsx` dispatch | `dealer-feature-routes`, `dealer-operational-features`, `dealer-secondary-pages` | see per-feature rows | 14–18 |
| `/admin/page.tsx` | `/admin` | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-overview.tsx` | `admin-mobile-contract` | admin shared shell | 7 |
| `/admin/order-pipeline/page.tsx`, `orders/[id]/page.tsx`, `order-detail/page.tsx` | index + 33 fixture/static IDs/codes + query-compatible runtime prefixes | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-order-pipeline.tsx` / `src/components/admin/admin-order-detail.tsx` | `admin-mobile-operations`, `admin-mobile-contract` | responsive toolbars/list-kanban | 7 |
| `/admin/[feature]/page.tsx` | 22 feature paths below | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-feature-page.tsx` dispatch | `admin-mobile-*` route contracts where named below | see per-feature rows | 8–13 |
| `/admin/integrations/1c/page.tsx` | `/admin/integrations/1c` | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-integrations-page.tsx` (`AdminOneCIntegrationsPage`) | no dedicated route test | integration table | 13 |
| `/admin/integrations/1c/unit-mapping/page.tsx` | `/admin/integrations/1c/unit-mapping` | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-integrations-page.tsx` (`AdminUnitMappingPage`) | no dedicated route test | mapping table | 13 |
| `/admin/integrations/bossweb/page.tsx` | `/admin/integrations/bossweb` | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-integrations-page.tsx` (`AdminBossWebIntegrationsPage`) | no dedicated route test | mapping table | 13 |
| `/admin/settlements/mapping/page.tsx` | `/admin/settlements/mapping` | `src/components/shell/app-shell.tsx` → `src/components/admin/admin-integrations-page.tsx` (`AdminDealerMappingPage`) | no dedicated route test | mapping table | 13 |
| `/login/page.tsx` | `/login` | `src/components/shell/login-screen.tsx` | `dealer-login-role`, `dealer-auth-navigation` | shared auth surface | 6 |
| `/offline/page.tsx` | `/offline` | `src/app/offline/page.tsx` and `src/app/offline/offline.module.css` | `dealer-pwa-pages` | PWA offline shell | 6 |

### Admin feature dispatch (`AdminFeaturePage`)

| Static feature path | Concrete view | Existing behavior coverage | Responsive/custom note | Batch |
| --- | --- | --- | --- | ---: |
| `/admin/supplier-orders` | `src/components/admin/admin-supplier-orders-page.tsx` (`AdminSupplierOrdersPage`) | `admin-mobile-operations` | compact filter toolbar | 8 |
| `/admin/consignment` | `src/components/admin/admin-consignment-page.tsx` (`AdminConsignmentPage`) | `admin-mobile-operations` | intentional horizontal inventory matrix | 8 |
| `/admin/returns` | `src/components/admin/admin-returns-page.tsx` (`AdminReturnsPage`) | `admin-mobile-operations` | compact status/search controls | 8 |
| `/admin/air-freight` | `src/components/admin/admin-air-freight-page.tsx` (`AdminAirFreightPage`) | `admin-mobile-operations` | process timeline | 8 |
| `/admin/ocean-freight` | `src/components/admin/admin-ocean-freight-page.tsx` (`AdminOceanFreightPage`) | `admin-mobile-operations` | grouped BL/container table | 9 |
| `/admin/unit-shipping` | `src/components/admin/admin-unit-shipping-page.tsx` (`AdminUnitShippingPage`) | `admin-mobile-operations` | dense delivery filters | 9 |
| `/admin/warehouse` | `src/components/admin/admin-warehouse-page.tsx` (`AdminWarehousePage`) | `admin-mobile-warehouse-invoices` | operational workspace | 9 |
| `/admin/settlements` | `src/components/admin/admin-settlements-page.tsx` (`AdminSettlementsPage`) | `admin-mobile-operations` | expandable reconciliation rows | 9 |
| `/admin/invoices` | `src/components/admin/admin-invoices-page.tsx` (`AdminInvoicesPage`) | `admin-mobile-warehouse-invoices` | document/editor panels | 10 |
| `/admin/catalog` | `src/components/admin/admin-catalog-page.tsx` (`AdminCatalogPage`) | `admin-mobile-catalog` | table-to-card responsive behavior | 10 |
| `/admin/schedule` | `src/components/admin/admin-schedule-page.tsx` (`AdminSchedulePage`) | `admin-mobile-schedule` | custom chronology visualization | 10 |
| `/admin/analytics` | `src/components/admin/admin-analytics-page.tsx` (`AdminAnalyticsPage`) | `admin-mobile-contract` | data/grid visualization | 10 |
| `/admin/parts-report` | `src/components/admin/admin-parts-report-page.tsx` (`AdminPartsReportPage`) | no dedicated route test | report table | 11 |
| `/admin/performance` | `src/components/admin/admin-performance-page.tsx` (`AdminPerformancePage`) | no dedicated route test | performance visualization | 11 |
| `/admin/bossweb-lookup` | `src/components/admin/admin-bossweb-lookup-page.tsx` (`AdminBossWebLookupPage`) | no dedicated route test | query-driven lookup table | 11 |
| `/admin/companies` | `src/components/admin/admin-companies-page.tsx` (`AdminCompaniesPage`) | `admin-mobile-people` | mobile company cards | 12 |
| `/admin/dealer-access` | `src/components/admin/admin-dealer-access-page.tsx` (`AdminDealerAccessPage`) | `admin-mobile-people` | permission policy matrix | 12 |
| `/admin/users` | `src/components/admin/admin-users-page.tsx` (`AdminUsersPage`) | `admin-mobile-people` | mobile user cards | 12 |
| `/admin/permissions` | `src/components/admin/admin-permissions-page.tsx` (`AdminPermissionsPage`) | `admin-mobile-permissions-compact` | matrix becomes permission cards | 12 |
| `/admin/tasks` | `src/components/admin/admin-tasks-page.tsx` (`AdminTasksPage`) | no dedicated route test | operations table | 12 |
| `/admin/integrations` | `src/components/admin/admin-integrations-page.tsx` (`AdminIntegrationsPage`) | no dedicated route test | integration status panels | 13 |
| `/admin/settings` | `src/components/admin/admin-settings-page.tsx` (`AdminSettingsPage`) | no dedicated route test | design-system setting target | 13 |

### Dealer feature dispatch (`DealerFeaturePage`)

| Static feature path | Concrete view | Existing behavior coverage | Responsive/custom note | Batch |
| --- | --- | --- | --- | ---: |
| `/dealer/accessories` | `src/components/dealer/features/accessories-page.tsx` (`AccessoriesPage`) | `dealer-accessories-search`, `dealer-accessory-data` | brand/model/category filters, product cards | 16 |
| `/dealer/units` | `src/components/dealer/features/units-page.tsx` (`UnitsPage`) | `dealer-operational-features` | units table/cards | 16 |
| `/dealer/schedule` | `src/components/dealer/features/schedule-page.tsx` (`SchedulePage`) | `dealer-orders-schedule-toolbar` | schedule visualization | 16 |
| `/dealer/bossweb` | `src/components/dealer/features/bossweb-page.tsx` (`BossWebPage`) | `dealer-operational-features` | parts lookup | 16 |
| `/dealer/workshop` | `src/components/dealer/features/workshop-page.tsx` (`WorkshopPage`) | `dealer-operational-features`, `dealer-safe-actions` | board/status workflow | 16 |
| `/dealer/documents` | `src/components/dealer/features/secondary-data-pages.tsx` (`DocumentsPage`) | `dealer-secondary-pages` | documents table/cards | 17 |
| `/dealer/order-drafts` | `src/components/dealer/features/order-drafts-page.tsx` (`OrderDraftsPage`) | `dealer-order-drafts` | drafts workflow | 17 |
| `/dealer/consignment` | `src/components/dealer/features/secondary-data-pages.tsx` (`ConsignmentPage`) | `dealer-secondary-pages` | inventory matrix | 17 |
| `/dealer/settlements` | `src/components/dealer/features/secondary-data-pages.tsx` (`SettlementsPage`) | `dealer-secondary-pages` | settlement rows | 17 |
| `/dealer/parts-inventory` | `src/components/dealer/features/secondary-data-pages.tsx` (`InventoryPage`) | `dealer-secondary-pages` | inventory list | 17 |
| `/dealer/network` | `src/components/dealer/features/secondary-data-pages.tsx` (`NetworkPage`) | `dealer-secondary-pages` | network list | 18 |
| `/dealer/parts-report` | `src/components/dealer/features/secondary-data-pages.tsx` (`PartsReportPage`) | `dealer-secondary-pages` | parts report | 18 |

## Query-compatible routes

These are runtime query representations, so they are not separate prerender paths but must retain their view/controller behavior after a renderer switch.

| URL contract | Controller/view | Existing coverage |
| --- | --- | --- |
| `/admin/order-detail?id=demo-order-<runtime-id>` | `src/components/admin/admin-order-detail.tsx`; `src/lib/order-route-hrefs.ts` uses this query form only for the `demo-order-*` runtime prefix. All static fixture IDs/codes use `/admin/orders/<id-or-code>`. | `admin-mobile-operations` |
| `/dealer/order-detail?id=<runtime-id>` | `src/components/dealer/dealer-orders.tsx`; `src/lib/order-route-hrefs.ts` uses this query form only for `demo-order-*` or `dealer-order-*`. All static fixture IDs/codes use `/dealer/orders/<id-or-code>`. | `dealer-order-detail` |
| `/order-confirmation?id=<runtime-id>` | `src/components/catalog/order-confirmation-page.tsx`; `src/lib/order-route-hrefs.ts` uses this query form only for `demo-order-*` or `dealer-order-*`. All static fixture IDs/codes use `/order-confirmation/<id-or-code>`. | `dealer-catalog-order-flow` |
| `/catalog/...?...year=&series=&model=&configuration=&diagram=` | `src/components/catalog/catalog-router.tsx` / `src/components/catalog/diagram-viewer.tsx` | `dealer-catalog-order-flow` |
| `/admin/bossweb-lookup?part=` | `src/components/admin/admin-bossweb-lookup-page.tsx` (`AdminBossWebLookupPage`) | no dedicated query test |
| `/admin/dealer-access?company=` | `src/components/admin/admin-dealer-access-page.tsx` (`AdminDealerAccessPage`) | `admin-mobile-people` |

## Exact static output (102 paths)

### Public/framework paths (6)

`/_global-error`, `/_not-found`, `/favicon.ico`, `/login`, `/manifest.webmanifest`, `/offline`

### Admin paths (62)

**Root and feature paths (23):**

`/admin`, `/admin/air-freight`, `/admin/analytics`, `/admin/bossweb-lookup`, `/admin/catalog`, `/admin/companies`, `/admin/consignment`, `/admin/dealer-access`, `/admin/integrations`, `/admin/invoices`, `/admin/ocean-freight`, `/admin/parts-report`, `/admin/performance`, `/admin/permissions`, `/admin/returns`, `/admin/schedule`, `/admin/settings`, `/admin/settlements`, `/admin/supplier-orders`, `/admin/tasks`, `/admin/unit-shipping`, `/admin/users`, `/admin/warehouse`

**Special explicit paths (6):**

`/admin/integrations/1c`, `/admin/integrations/1c/unit-mapping`, `/admin/integrations/bossweb`, `/admin/order-detail`, `/admin/order-pipeline`, `/admin/settlements/mapping`

**Static fixture `/admin/orders/[id]` values (33):**

`386960e7-2e28-4bb0-8fa9-83e45f84df7a`, `659fb637-d5c6-4d10-8739-baf0e30d4449`, `7c5495ea-6549-4fc5-9421-e62e62cf5509`, `847a33b6-c168-46bf-9d5e-f4c0dabb2c7b`, `a20b2bdd-2a1f-4322-a50a-fe68a17f4963`, `aa12301e-0294-4cb2-8bcb-3ec8f13f0ba6`, `CHK-03`, `CHK-2-02`, `DNE-07`, `KHA-05`, `KHA-07`, `KHA-08`, `KIE-ST-20`, `KIE-ST-23`, `KIE-ST-28`, `KIE-ST-29`, `KIE-ST-30`, `KIE-ST-31`, `KS-01`, `KS-05`, `KS-06`, `KS-07`, `KS-08`, `KS-09`, `LOG-01`, `LSM-07`, `LSM-09`, `LSM-10`, `RVN-01`, `VYS-04`, `ZAP-E-03`, `ZHY-06`, `ZHY-07`.

Each static fixture value above appears as `/admin/orders/<value>`.

### Dealer paths (34)

**Core and explicit paths (18):**

`/`, `/cart`, `/dealer/accessories`, `/dealer/bossweb`, `/dealer/consignment`, `/dealer/customers`, `/dealer/documents`, `/dealer/network`, `/dealer/order-detail`, `/dealer/order-drafts`, `/dealer/orders`, `/dealer/parts-inventory`, `/dealer/parts-report`, `/dealer/schedule`, `/dealer/settlements`, `/dealer/team-access`, `/dealer/units`, `/dealer/workshop`

**Catalog static paths (11):**

`/catalog`, `/catalog/CAN_OFF_EN_US`, `/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25`, `/catalog/CAN_OFF_EN_US/152970b5-6fc4-427c-b0c4-0b44f69baa8e`, `/catalog/CAN_OFF_EN_US/33c5dc49-42ec-4f09-87c6-bd6cf1417de2`, `/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603`, `/catalog/CAN_OFF_EN_US/7560bdc0-e7f3-4d84-9812-b8ecb55d948a`, `/catalog/CAN_OFF_EN_US/sxs`, `/catalog/CAN_ONR_EN_US`, `/catalog/SEA_DOO_EN_US`, `/catalog/SKI_DOO_EN_US`

**Static fixture order and confirmation paths (5):**

`/dealer/orders/LOG-01`, `/dealer/orders/a20b2bdd-2a1f-4322-a50a-fe68a17f4963`, `/order-confirmation`, `/order-confirmation/LOG-01`, `/order-confirmation/a20b2bdd-2a1f-4322-a50a-fe68a17f4963`

The category totals are 6 public/framework + 62 admin + 34 dealer = **102**. Every static fixture value is explicit above; no generic route source has been mistaken for one visual surface.
