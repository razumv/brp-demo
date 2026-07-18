import { AdminOverview } from "@/components/admin/admin-overview";
import { AppShell } from "@/components/shell/app-shell";

export default function AdminHomePage() {
  return (
    <AppShell role="admin">
      <AdminOverview />
    </AppShell>
  );
}
