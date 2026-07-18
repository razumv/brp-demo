import { AdminOneCIntegrationsPage } from "@/components/admin/admin-integrations-page";
import { AppShell } from "@/components/shell/app-shell";

export default function AdminOneCPage() {
  return (
    <AppShell role="admin">
      <AdminOneCIntegrationsPage />
    </AppShell>
  );
}
