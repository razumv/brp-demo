import assert from "node:assert/strict";
import test from "node:test";
import type {DataToolbarFilterContract} from "../src/components/brp-ui/data-toolbar-contract";

test("shared filter contract names every route-owned filter responsibility", () => {
  const filter = {
    label: "Фільтри",
    activeCount: 2,
    open: true,
    onOpenChange: () => undefined,
    panelId: "inventory-filters",
    content: "filter controls",
    onClear: () => undefined,
  } satisfies DataToolbarFilterContract;

  assert.equal(filter.panelId, "inventory-filters");
  assert.equal(filter.activeCount, 2);
});
