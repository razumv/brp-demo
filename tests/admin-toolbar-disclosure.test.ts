import assert from "node:assert/strict";
import test from "node:test";
import { getDisclosedToolbarSections } from "../src/components/admin/admin-toolbar-disclosure";

test("does not disclose controls when mobile disclosure is omitted", () => {
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    undefined,
  );

  assert.deepEqual(sections, []);
});

test("defaults an explicit mobile disclosure to filters", () => {
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    {},
  );

  assert.deepEqual(sections, ["filters"]);
});

test("honors an explicit empty mobile disclosure", () => {
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    { sections: [] },
  );

  assert.deepEqual(sections, []);
});

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
