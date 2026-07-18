import { CustomersPage } from "@/components/dealer/dealer-customers";
import { AppShell } from "@/components/shell/app-shell";

export default function CustomersRoute() {
  return (
    <AppShell role="dealer">
      <CustomersPage />
    </AppShell>
  );
}
