import { AdminOrderDetail } from "@/components/admin/admin-order-detail";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_ORDER_FIXTURES, ADMIN_PIPELINE_ROWS } from "@/lib/admin-order-data";
import { initialDemoState } from "@/lib/mock-data";

export function generateStaticParams() {
  const ids = new Set([
    ...ADMIN_PIPELINE_ROWS.flatMap((order) => [order.id, order.code]),
    ...ADMIN_ORDER_FIXTURES.flatMap((order) => [order.id, order.code]),
    ...initialDemoState.orders.flatMap((order) => [order.id, order.code]),
  ]);
  return Array.from(ids, (id) => ({ id }));
}

export default async function AdminOrderRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell role="admin">
      <AdminOrderDetail id={id} />
    </AppShell>
  );
}
