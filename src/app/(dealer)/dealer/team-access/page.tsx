import { TeamAccessPage } from "@/components/dealer/team-access";
import { AppShell } from "@/components/shell/app-shell";

export default function TeamAccessRoute() {
  return (
    <AppShell role="dealer">
      <TeamAccessPage />
    </AppShell>
  );
}
