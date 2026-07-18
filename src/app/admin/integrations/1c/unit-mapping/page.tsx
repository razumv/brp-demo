import { AdminUnitMappingPage } from "@/components/admin/admin-integrations-page";
import { AppShell } from "@/components/shell/app-shell";

export default function AdminUnitMappingRoute() {
  return (
    <AppShell role="admin">
      <AdminUnitMappingPage />
    </AppShell>
  );
}
