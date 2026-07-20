import assert from "node:assert/strict";
import test from "node:test";

const { getDisclosedToolbarSections } = await import(
  new URL("../src/components/admin/admin-toolbar-disclosure.ts", import.meta.url).href,
);

test("uses the first configured slot that has a control", () => {
  const sections = getDisclosedToolbarSections(
    { filters: false, view: true, actions: false },
    { sections: ["filters", "view"] },
  );

  assert.deepEqual(sections, ["view"]);
});

test("keeps configured multi-slot controls in their legacy order", () => {
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    { sections: ["filters", "actions"] },
  );

  assert.deepEqual(sections, ["filters", "actions"]);
});
