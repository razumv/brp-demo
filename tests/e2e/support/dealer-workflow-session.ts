import type { Page } from "@playwright/test";
import { initialDemoState } from "@/lib/mock-data";
import { dealerWorkflowStorageKey } from "@/lib/dealer/identity";
import type { DemoState } from "@/lib/types";

const DEALER_IDENTITY = {
  email: "orders@logos.ua",
  displayName: "Олена Коваль",
  company: "Logos",
} as const;

export const DEALER_WORKFLOW_STORAGE_KEY = dealerWorkflowStorageKey(DEALER_IDENTITY);

const SHARED_STORAGE_KEY = "brp-clone-demo-state-v1";
const SESSION_MARKER = "dealer-workflow-e2e-ready";

export async function seedDealerWorkflowSession(page: Page) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = {
    role: "dealer",
    ...DEALER_IDENTITY,
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };

  await page.addInitScript(({ sharedKey, dealerKey, marker, persistedState }) => {
    if (window.sessionStorage.getItem(marker)) return;
    window.localStorage.setItem(sharedKey, JSON.stringify(persistedState));
    window.localStorage.removeItem(dealerKey);
    window.sessionStorage.setItem(marker, "1");
  }, {
    sharedKey: SHARED_STORAGE_KEY,
    dealerKey: DEALER_WORKFLOW_STORAGE_KEY,
    marker: SESSION_MARKER,
    persistedState: state,
  });
}
