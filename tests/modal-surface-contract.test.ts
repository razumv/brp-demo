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
