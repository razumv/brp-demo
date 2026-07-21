import { DealerFeaturePage } from "@/components/dealer/dealer-feature-page";
import { AppShell } from "@/components/shell/app-shell";

const dealerFeatures = [
  "accessories",
  "units",
  "schedule",
  "bossweb",
  "workshop",
  "documents",
  "order-drafts",
  "consignment",
  "settlements",
  "parts-inventory",
  "network",
  "parts-report",
] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return dealerFeatures.map((feature) => ({ feature }));
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
