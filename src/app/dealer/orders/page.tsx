import { DealerOrdersPage } from "@/components/dealer/dealer-orders";
import { AppShell } from "@/components/shell/app-shell";

export default function DealerOrdersRoute() {
  return (
    <AppShell role="dealer">
      <DealerOrdersPage />
    </AppShell>
  );
}
