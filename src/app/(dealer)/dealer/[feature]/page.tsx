import { DealerFeaturePage } from "@/components/dealer/dealer-feature-page";
import { AppShell } from "@/components/shell/app-shell";
import { DEALER_FEATURES } from "@/lib/appearance/route-inventory";

export const dynamicParams = false;

export function generateStaticParams() {
  return DEALER_FEATURES.map((feature) => ({ feature }));
}

export default async function DealerFeatureRoute({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  return (
    <AppShell role="dealer">
      <DealerFeaturePage feature={feature} />
    </AppShell>
  );
}
