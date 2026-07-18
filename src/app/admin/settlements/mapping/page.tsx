import { AdminDealerMappingPage } from "@/components/admin/admin-integrations-page";
import { AppShell } from "@/components/shell/app-shell";

export default function AdminDealerMappingRoute() {
  return (
    <AppShell role="admin">
      <AdminDealerMappingPage />
    </AppShell>
  );
}
