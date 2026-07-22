import { AdminFeaturePage } from "@/components/admin/admin-feature-page";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_FEATURES } from "@/lib/appearance/route-inventory";

export const dynamicParams = false;

export function generateStaticParams() {
  return ADMIN_FEATURES.map((feature) => ({ feature }));
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
