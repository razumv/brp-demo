import { ADMIN_ORDER_FIXTURES, ADMIN_PIPELINE_ROWS } from "@/lib/admin-order-data";
import { CATALOG_IDS, catalogBrands, initialDemoState } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

export type AppearanceRouteKind = "literal" | "generated" | "query-compatible";
export type AppearanceViewport = "mobile" | "tablet" | "desktop" | "wide";

export interface AppearanceRouteInventoryRow {
  readonly path: string;
  readonly source: string;
  readonly role: Role | "public";
  readonly kind: AppearanceRouteKind;
  readonly specialBehaviors: readonly string[];
  readonly viewports: readonly AppearanceViewport[];
}

export const ADMIN_FEATURES = [
  "supplier-orders", "consignment", "returns", "air-freight", "ocean-freight",
  "unit-shipping", "warehouse", "settlements", "invoices", "catalog", "schedule",
  "companies", "dealer-access", "users", "permissions", "tasks", "analytics",
  "parts-report", "performance", "bossweb-lookup", "integrations", "settings",
] as const;

export const DEALER_FEATURES = [
  "accessories", "units", "schedule", "bossweb", "workshop", "documents",
  "order-drafts", "consignment", "settlements", "parts-inventory", "network",
  "parts-report",
] as const;

const allViewports = ["mobile", "tablet", "desktop", "wide"] as const;
const literal = (path: string, source: string, role: Role | "public", specialBehaviors: readonly string[] = []): AppearanceRouteInventoryRow => ({
  path, source, role, kind: "literal", specialBehaviors, viewports: allViewports,
});
const generated = (path: string, source: string, role: Role, specialBehaviors: readonly string[] = []): AppearanceRouteInventoryRow => ({
  path, source, role, kind: "generated", specialBehaviors, viewports: allViewports,
});
const queryCompatible = (path: string, source: string, role: Role): AppearanceRouteInventoryRow => ({
  path, source, role, kind: "query-compatible", specialBehaviors: ["legacy-query-route"], viewports: allViewports,
});

const catalogPaths = [
  "/catalog/",
  ...catalogBrands.map((brand) => `/catalog/${brand.code}/`),
  `/catalog/${CATALOG_IDS.brand}/sxs/`,
  `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.category}/`,
  `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.series}/`,
  `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.model}/`,
  `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.configuration}/`,
  `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.diagram}/`,
];

const adminOrderIds = Array.from(new Set([
  ...ADMIN_PIPELINE_ROWS.flatMap((order) => [order.id, order.code]),
  ...ADMIN_ORDER_FIXTURES.flatMap((order) => [order.id, order.code]),
  ...initialDemoState.orders.flatMap((order) => [order.id, order.code]),
]));
const dealerOrderIds = initialDemoState.orders.flatMap((order) => [order.id, order.code]);

export const APPEARANCE_ROUTE_INVENTORY: readonly AppearanceRouteInventoryRow[] = [
  literal("/login/", "src/app/login/page.tsx", "public", ["authentication"]),
  literal("/offline/", "src/app/offline/page.tsx", "public", ["offline-fallback"]),
  literal("/admin/", "src/app/admin/page.tsx", "admin"),
  literal("/admin/order-pipeline/", "src/app/admin/order-pipeline/page.tsx", "admin", ["dense-scroller"]),
  literal("/admin/integrations/1c/", "src/app/admin/integrations/1c/page.tsx", "admin"),
  literal("/admin/integrations/1c/unit-mapping/", "src/app/admin/integrations/1c/unit-mapping/page.tsx", "admin", ["dense-scroller"]),
  literal("/admin/integrations/bossweb/", "src/app/admin/integrations/bossweb/page.tsx", "admin"),
  literal("/admin/settlements/mapping/", "src/app/admin/settlements/mapping/page.tsx", "admin", ["dense-scroller"]),
  ...ADMIN_FEATURES.map((feature) => generated(`/admin/${feature}/`, "src/app/admin/[feature]/page.tsx", "admin", ["feature-route"])),
  ...adminOrderIds.map((id) => generated(`/admin/orders/${encodeURIComponent(id)}/`, "src/app/admin/orders/[id]/page.tsx", "admin", ["order-detail"])),
  ...initialDemoState.orders.map((order) => queryCompatible(`/admin/order-detail/?id=${encodeURIComponent(order.id)}`, "src/app/admin/order-detail/page.tsx", "admin")),
  literal("/", "src/app/(dealer)/page.tsx", "dealer"),
  literal("/cart/", "src/app/(dealer)/cart/page.tsx", "dealer"),
  literal("/dealer/orders/", "src/app/(dealer)/dealer/orders/page.tsx", "dealer"),
  literal("/dealer/customers/", "src/app/(dealer)/dealer/customers/page.tsx", "dealer"),
  literal("/dealer/team-access/", "src/app/(dealer)/dealer/team-access/page.tsx", "dealer"),
  literal("/order-confirmation/", "src/app/(dealer)/order-confirmation/page.tsx", "dealer", ["legacy-query-route"]),
  ...DEALER_FEATURES.map((feature) => generated(`/dealer/${feature}/`, "src/app/(dealer)/dealer/[feature]/page.tsx", "dealer", ["feature-route"])),
  ...catalogPaths.map((path) => generated(path, "src/app/(dealer)/catalog/[[...slug]]/page.tsx", "dealer", path.endsWith(`/${CATALOG_IDS.diagram}/`) ? ["standalone-diagram", "dense-scroller"] : ["catalog"])),
  ...dealerOrderIds.map((id) => generated(`/dealer/orders/${encodeURIComponent(id)}/`, "src/app/(dealer)/dealer/orders/[id]/page.tsx", "dealer", ["order-detail"])),
  ...dealerOrderIds.map((id) => generated(`/order-confirmation/${encodeURIComponent(id)}/`, "src/app/(dealer)/order-confirmation/[id]/page.tsx", "dealer", ["order-confirmation"])),
  ...initialDemoState.orders.map((order) => queryCompatible(`/dealer/order-detail/?id=${encodeURIComponent(order.id)}`, "src/app/(dealer)/dealer/order-detail/page.tsx", "dealer")),
  ...initialDemoState.orders.map((order) => queryCompatible(`/order-confirmation/?id=${encodeURIComponent(order.id)}`, "src/app/(dealer)/order-confirmation/page.tsx", "dealer")),
];

export function inventoryRowsForSource(source: string) {
  return APPEARANCE_ROUTE_INVENTORY.filter((row) => row.source === source);
}
