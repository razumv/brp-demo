import assert from "node:assert/strict";
import test from "node:test";
import {
  DealerLocalPersistenceError,
  readDealerWorkflowPayload,
  removeDealerWorkflowPayload,
  writeDealerWorkflowPayload,
} from "@/lib/dealer/workflow-persistence";

test("dealer persistence treats blocked reads and cleanup as an empty usable payload", () => {
  const storage = {
    getItem() {
      throw new Error("storage blocked");
    },
    removeItem() {
      throw new Error("storage blocked");
    },
    setItem() {},
  };

  assert.equal(readDealerWorkflowPayload(storage, "dealer-v2"), null);
  assert.doesNotThrow(() => removeDealerWorkflowPayload(storage, "dealer-v2"));
});

test("dealer persistence rejects writes that cannot be durably stored", () => {
  const storage = {
    getItem() { return null; },
    removeItem() {},
    setItem() {
      throw new Error("quota exceeded");
    },
  };

  assert.throws(
    () => writeDealerWorkflowPayload(storage, "dealer-v2", { version: 2 }),
    DealerLocalPersistenceError,
  );
});
