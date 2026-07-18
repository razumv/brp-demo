import { AdminFeaturePage } from "@/components/admin/admin-feature-page";
import { AppShell } from "@/components/shell/app-shell";

const adminFeatures = [
  "supplier-orders",
  "consignment",
  "returns",
  "air-freight",
  "ocean-freight",
  "unit-shipping",
  "warehouse",
  "settlements",
  "invoices",
  "catalog",
  "schedule",
  "companies",
  "dealer-access",
  "users",
  "permissions",
  "tasks",
  "analytics",
  "parts-report",
  "performance",
  "bossweb-lookup",
  "integrations",
  "settings",
] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return adminFeatures.map((feature) => ({ feature }));
}

export default async function AdminFeatureRoute({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  return (
    <AppShell role="admin">
      <AdminFeaturePage feature={feature} />
    </AppShell>
  );
}
