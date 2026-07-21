import assert from "node:assert/strict";
import test from "node:test";
import {
  dealerIdentityKey,
  dealerWorkflowStorageKey,
  getDealerIdentity,
} from "@/lib/dealer/identity";
import { initialDemoState } from "@/lib/mock-data";

test("identity resolves only from an authenticated dealer session", () => {
  assert.equal(getDealerIdentity(initialDemoState), null);
  assert.equal(getDealerIdentity({
    ...initialDemoState,
    session: {
      role: "admin",
      email: "admin@example.invalid",
      displayName: "Admin",
      company: "Logos",
      remember: true,
      expiresAt: null,
    },
  }), null);
  assert.deepEqual(getDealerIdentity({
    ...initialDemoState,
    session: {
      role: "dealer",
      email: " Dealer@One.UA ",
      displayName: " Олена ",
      company: " Logos ",
      remember: true,
      expiresAt: null,
    },
  }), {
    email: "dealer@one.ua",
    displayName: "Олена",
    company: "Logos",
  });
});

test("persistence keys are stable per dealer and isolated across identities", () => {
  const first = { email: " Dealer@One.UA ", displayName: "Олена", company: "Logos" };
  const same = { email: "dealer@one.ua", displayName: "Інше ім'я", company: "LOGOS" };
  const other = { email: "dealer@two.ua", displayName: "Олена", company: "Logos" };

  assert.equal(dealerIdentityKey(first), dealerIdentityKey(same));
  assert.equal(dealerWorkflowStorageKey(first), dealerWorkflowStorageKey(same));
  assert.notEqual(dealerWorkflowStorageKey(first), dealerWorkflowStorageKey(other));
});
