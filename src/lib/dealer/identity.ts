import type { DealerIdentity } from "@/lib/dealer/contracts";
import type { DemoState } from "@/lib/types";

export const DEALER_WORKFLOW_STORAGE_PREFIX = "brp-dealer-workflow-v2";

export function getDealerIdentity(state: DemoState): DealerIdentity | null {
  const session = state.session;
  if (session?.role !== "dealer") return null;

  const email = session.email.trim().toLocaleLowerCase("en-US");
  const displayName = session.displayName.trim();
  const company = session.company.trim();
  if (!email || !displayName || !company) return null;

  return { email, displayName, company };
}

export function dealerIdentityKey(identity: DealerIdentity) {
  return `${identity.email.trim().toLocaleLowerCase("en-US")}::${identity.company.trim().toLocaleLowerCase("uk-UA")}`;
}

export function dealerWorkflowStorageKey(identity: DealerIdentity) {
  return `${DEALER_WORKFLOW_STORAGE_PREFIX}:${encodeURIComponent(dealerIdentityKey(identity))}`;
}
