import { DealerOrderDetail } from "@/components/dealer/dealer-orders";
import { AppShell } from "@/components/shell/app-shell";
import { initialDemoState } from "@/lib/mock-data";

export function generateStaticParams() {
  return initialDemoState.orders.flatMap((order) => [
    { id: order.id },
    { id: order.code },
  ]);
}

export default async function DealerOrderRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="dealer">
      <DealerOrderDetail id={id} />
    </AppShell>
  );
}
