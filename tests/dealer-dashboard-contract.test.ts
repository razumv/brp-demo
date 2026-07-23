import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboardSource = readFileSync(
  "src/components/dealer/dealer-dashboard.tsx",
  "utf8",
);

test("dealer dashboard omits the redundant available-sections directory", () => {
  assert.doesNotMatch(dashboardSource, /Доступні розділи/);
  assert.doesNotMatch(dashboardSource, /const shortcuts =/);
  assert.doesNotMatch(dashboardSource, /styles\.shortcutsPanel/);
});
