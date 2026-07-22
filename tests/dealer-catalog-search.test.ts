import assert from "node:assert/strict";
import test from "node:test";
import {
  filterDiagramNames,
  resolveCatalogSelection,
} from "@/lib/dealer/catalog-data";

const diagrams = [
  "00- Model Numbers",
  "02- Engine Cooling",
  "09- Brakes",
] as const;

test("diagram search matches names and diagram numbers without case sensitivity", () => {
  assert.deepEqual(filterDiagramNames(diagrams, "ENGINE"), ["02- Engine Cooling"]);
  assert.deepEqual(filterDiagramNames(diagrams, "09"), ["09- Brakes"]);
});

test("an empty diagram query returns every selected-model diagram in source order", () => {
  assert.deepEqual(filterDiagramNames(diagrams, "   "), diagrams);
});

test("an unmatched diagram query returns an empty collection", () => {
  assert.deepEqual(filterDiagramNames(diagrams, "transmission"), []);
});

test("diagram filtering leaves the upstream catalog selection untouched", () => {
  const selection = resolveCatalogSelection("sxs", {
    year: "2021",
    series: "005",
    model: "002",
  });
  const selectedModelDiagrams = selection.model?.children?.map((diagram) => diagram.label) ?? [];

  assert.deepEqual(filterDiagramNames(selectedModelDiagrams, "brakes"), ["03- Mechanic - Brakes"]);
  assert.equal(selection.year?.id, "2021");
  assert.equal(selection.series?.id, "005");
  assert.equal(selection.model?.id, "002");
  assert.equal(selection.model?.children?.length, 24);
});
