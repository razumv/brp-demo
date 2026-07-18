import { AppShell } from "@/components/shell/app-shell";
import { DealerDashboard } from "@/components/dealer/dealer-dashboard";

export default function DealerHomePage() {
  return (
    <AppShell role="dealer">
      <DealerDashboard />
    </AppShell>
  );
}
