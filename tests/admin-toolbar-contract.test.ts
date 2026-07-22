import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const adminToolbarPath = "src/components/admin/admin-ui.tsx";

test("AdminToolbar keeps the mobile disclosure change handler stable across unrelated renders", () => {
  const source = readFileSync(adminToolbarPath, "utf8");

  assert.match(source, /useCallback,/);
  assert.match(source, /const isControlledMobileDisclosure = Boolean\(/);
  assert.match(source, /const controlledExpandedChange = mobileDisclosure\?\.onExpandedChange;/);
  assert.match(source, /const onMobileExpandedChange = useCallback\(/);
  assert.match(source, /\[isControlledMobileDisclosure, controlledExpandedChange\]/);
});
