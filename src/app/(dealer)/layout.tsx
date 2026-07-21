import type { ReactNode } from "react";
import { DealerWorkflowProvider } from "@/components/dealer/dealer-workflow-provider";

export default function DealerLayout({ children }: { children: ReactNode }) {
  return <DealerWorkflowProvider>{children}</DealerWorkflowProvider>;
}
