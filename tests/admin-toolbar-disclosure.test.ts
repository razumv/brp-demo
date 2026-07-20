import assert from "node:assert/strict";
import test from "node:test";

const toolbarDisclosure = import(
  new URL("../src/components/admin/admin-toolbar-disclosure.ts", import.meta.url).href,
);

test("does not disclose controls when mobile disclosure is omitted", async () => {
  const { getDisclosedToolbarSections } = await toolbarDisclosure;
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    undefined,
  );

  assert.deepEqual(sections, []);
});

test("defaults an explicit mobile disclosure to filters", async () => {
  const { getDisclosedToolbarSections } = await toolbarDisclosure;
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    {},
  );

  assert.deepEqual(sections, ["filters"]);
});

test("honors an explicit empty mobile disclosure", async () => {
  const { getDisclosedToolbarSections } = await toolbarDisclosure;
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    { sections: [] },
  );

  assert.deepEqual(sections, []);
});

test("uses the first configured slot that has a control", async () => {
  const { getDisclosedToolbarSections } = await toolbarDisclosure;
  const sections = getDisclosedToolbarSections(
    { filters: false, view: true, actions: false },
    { sections: ["filters", "view"] },
  );

  assert.deepEqual(sections, ["view"]);
});

test("keeps configured multi-slot controls in their legacy order", async () => {
  const { getDisclosedToolbarSections } = await toolbarDisclosure;
  const sections = getDisclosedToolbarSections(
    { filters: true, view: true, actions: true },
    { sections: ["filters", "actions"] },
  );

  assert.deepEqual(sections, ["filters", "actions"]);
});
