import { AdminOrderPipeline } from "@/components/admin/admin-order-pipeline";
import { AppShell } from "@/components/shell/app-shell";

export default function AdminPipelineRoute() {
  return (
    <AppShell role="admin">
      <AdminOrderPipeline />
    </AppShell>
  );
}
