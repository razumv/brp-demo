import assert from "node:assert/strict";
import test from "node:test";

import {isPathSelected} from "../src/components/shell/app-shell-controller";

test("portal overview links only match their exact root routes", () => {
  assert.equal(isPathSelected("/", "/"), true);
  assert.equal(isPathSelected("/dealer/orders", "/"), false);
  assert.equal(isPathSelected("/admin", "/admin"), true);
  assert.equal(isPathSelected("/admin/ocean-freight", "/admin"), false);
});

test("feature links continue to match their nested detail routes", () => {
  assert.equal(isPathSelected("/admin/orders/123", "/admin/orders"), true);
  assert.equal(isPathSelected("/dealer/orders/123", "/dealer/orders"), true);
});
