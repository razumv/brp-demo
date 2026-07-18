import { OrderConfirmationPage } from "@/components/catalog/order-confirmation-page";
import { AppShell } from "@/components/shell/app-shell";
import { initialDemoState } from "@/lib/mock-data";

export function generateStaticParams() {
  return initialDemoState.orders.flatMap((order) => [
    { id: order.id },
    { id: order.code },
  ]);
}

export default async function OrderConfirmationRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="dealer">
      <OrderConfirmationPage id={id} />
    </AppShell>
  );
}
