import type { DealerIdentity } from "@/lib/dealer/contracts";
import type { DemoState, Role } from "@/lib/types";

export const DEALER_WORKFLOW_STORAGE_PREFIX = "brp-dealer-workflow-v2";

export function getDealerIdentityFromFields(
  role: Role | null,
  emailValue: string,
  displayNameValue: string,
  companyValue: string,
): DealerIdentity | null {
  if (role !== "dealer") return null;

  const email = emailValue.trim().toLocaleLowerCase("en-US");
  const displayName = displayNameValue.trim();
  const company = companyValue.trim();
  if (!email || !displayName || !company) return null;

  return { email, displayName, company };
}

export function getDealerIdentity(state: DemoState): DealerIdentity | null {
  const session = state.session;
  return getDealerIdentityFromFields(
    session?.role ?? null,
    session?.email ?? "",
    session?.displayName ?? "",
    session?.company ?? "",
  );
}

export function dealerIdentityKey(identity: DealerIdentity) {
  return `${identity.email.trim().toLocaleLowerCase("en-US")}::${identity.company.trim().toLocaleLowerCase("uk-UA")}`;
}

export function dealerWorkflowStorageKey(identity: DealerIdentity) {
  return `${DEALER_WORKFLOW_STORAGE_PREFIX}:${encodeURIComponent(dealerIdentityKey(identity))}`;
}
