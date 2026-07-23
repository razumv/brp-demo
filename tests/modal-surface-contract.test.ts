import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("shared dialogs expose one semantic surface contract", () => {
  const componentPath = "src/components/shared/dialog-surfaces.tsx";
  assert.equal(
    existsSync(componentPath),
    true,
    "DialogSection must own the shared semantic section contract",
  );

  const modalSource = read("src/components/shared/ui.tsx");
  const globalStyles = read("src/app/globals.css");

  for (const className of [
    "modal-surface-frame",
    "modal-surface-header",
    "modal-surface-body",
    "modal-surface-footer",
  ]) {
    assert.match(modalSource, new RegExp(className));
    assert.match(globalStyles, new RegExp(`\\.${className}`));
  }
});

test("DialogSection renders a labelled section with tone and inset variants", () => {
  const source = read("src/components/shared/dialog-surfaces.tsx");

  assert.match(source, /export function DialogSection/);
  assert.match(source, /aria-labelledby=\{titleId\}/);
  assert.match(source, /dialog-section-/);
  assert.match(source, /dialog-section-inset/);
  assert.match(source, /dialog-section-row/);
});

test("the BRP UI adapter uses the same modal frame contract", () => {
  const sources = [
    read("src/components/brp-ui/current-adapter.tsx"),
    read("src/components/brp-ui/astryx-adapter.tsx"),
  ];

  for (const source of sources) {
    for (const className of [
      "modal-surface-frame",
      "modal-surface-header",
      "modal-surface-body",
      "modal-surface-footer",
    ]) {
      assert.match(source, new RegExp(className));
    }
  }
});

test("both ocean renderers expose the same BL tile structure", () => {
  const renderers = [
    read("src/components/admin/admin-ocean-detail.tsx"),
    read("src/components/admin/astryx-admin-ocean-freight-view.tsx"),
  ];

  for (const source of renderers) {
    for (const section of [
      "bl-containers",
      "bl-container",
      "bl-proformas",
      "bl-information",
      "bl-documents",
      "bl-timeline",
    ]) {
      assert.match(source, new RegExp(`data-dialog-section="${section}"`));
    }
  }
});

test("shared page surfaces provide the four width modes used by both renderers", () => {
  const source = read("src/components/shared/ui.tsx");
  const globalStyles = read("src/app/globals.css");

  assert.match(source, /export function PageSurface/);
  for (const width of ["default", "wide", "reading", "full-workspace"]) {
    assert.match(source, new RegExp(`page-surface-${width}`));
    assert.match(globalStyles, new RegExp(`\\.page-surface-${width}`));
  }
});
