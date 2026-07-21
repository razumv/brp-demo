import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("Astryx Neutral source and deterministic build artifacts are pinned", () => {
  const pkg = JSON.parse(read("package.json")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
  assert.equal(pkg.dependencies["@astryxdesign/core"], "0.1.7");
  assert.equal(pkg.dependencies["@stylexjs/stylex"], "0.19.0");
  assert.equal(pkg.devDependencies["@astryxdesign/cli"], "0.1.7");
  assert.equal(pkg.dependencies["@fontsource-variable/figtree"], "5.3.0");
  assert.match(
    pkg.scripts["theme:astryx:build"],
    /astryx theme build src\/themes\/neutral\/neutralTheme\.ts/,
  );
  assert.match(read("src/themes/neutral/neutralTheme.ts"), /name: 'neutral'/);
  assert.match(read("src/themes/neutral/neutral.css"), /data-astryx-theme/);
});

test("the canonical Tailwind and Astryx cascade layers load first", () => {
  const layers = read("src/app/astryx-layers.css");
  assert.equal(
    layers.trim(),
    "@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;",
  );
  const globals = read("src/app/globals.css");
  assert.equal(globals.split("\n")[0], '@import "./astryx-layers.css";');
  assert.match(globals, /@import "tailwindcss\/theme\.css" layer\(theme\)/);
  assert.match(globals, /@import "@astryxdesign\/core\/reset\.css"/);
  assert.match(globals, /@import "@astryxdesign\/core\/astryx\.css"/);
  assert.match(globals, /@import "\.\.\/themes\/neutral\/neutral\.css"/);
  assert.match(globals, /@import "@astryxdesign\/core\/tailwind-theme\.css"/);
  assert.match(globals, /@import "tailwindcss\/utilities\.css" layer\(utilities\)/);
  assert.match(globals, /@fontsource-variable\/figtree\/index\.css/);
  assert.match(globals, /inter-cyrillic\.woff2/);
  assert.match(read("src/themes/neutral/neutralTheme.ts"), /Figtree Variable[\s\S]*"Inter"/);
  assert.match(
    globals,
    /@scope \(html\[data-design-system="shadcn"\]\) to \(\[data-design-system="astryx"\]\)/,
  );
});
