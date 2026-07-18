import { AdminBossWebIntegrationsPage } from "@/components/admin/admin-integrations-page";
import { AppShell } from "@/components/shell/app-shell";

export default function AdminBossWebPage() {
  return (
    <AppShell role="admin">
      <AdminBossWebIntegrationsPage />
    </AppShell>
  );
}
