import type { ReactNode } from "react";
import { DealerWorkflowProvider } from "@/components/dealer/dealer-workflow-provider";
import { AdaptiveBrpUiProvider } from "@/components/brp-ui/adaptive-brp-ui-provider";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return (
    <DealerWorkflowProvider>
      <AdaptiveBrpUiProvider>{children}</AdaptiveBrpUiProvider>
    </DealerWorkflowProvider>
  );
}
