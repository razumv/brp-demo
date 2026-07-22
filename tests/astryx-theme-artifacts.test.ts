import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

type CssBlock = {
  header: string;
  parent?: CssBlock;
};

const boundedLegacyScope =
  '@scope (html[data-design-system="shadcn"]) to ([data-design-system="astryx"])';
const genericLegacySelectors = new Set([
  "*",
  "body",
  "button,input,select,textarea",
  "button,a",
  "button",
  "a",
  "::selection",
  ":focus-visible",
]);

function normalizeCssHeader(header: string) {
  return header
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",");
}

function parseCssBlocks(source: string) {
  const blocks: CssBlock[] = [];
  const stack: Array<{ block?: CssBlock; statementStart: number }> = [
    { statementStart: 0 },
  ];
  let quote: '"' | "'" | undefined;
  let inComment = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (character === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    const context = stack.at(-1);
    assert.ok(context, "CSS parser lost its root context");
    if (character === "{") {
      const block: CssBlock = {
        header: normalizeCssHeader(source.slice(context.statementStart, index)),
        parent: context.block,
      };
      blocks.push(block);
      stack.push({ block, statementStart: index + 1 });
    } else if (character === ";") {
      context.statementStart = index + 1;
    } else if (character === "}") {
      assert.ok(context.block, "CSS contains an unmatched closing brace");
      stack.pop();
      const parent = stack.at(-1);
      assert.ok(parent, "CSS parser lost the parent context");
      parent.statementStart = index + 1;
    }
  }

  assert.equal(stack.length, 1, "CSS contains an unclosed block");
  return blocks;
}

function bareGenericSelectors(header: string) {
  if (header.startsWith("@")) return [];
  return header
    .split(",")
    .filter((selector) => /^(?:\*|html|body|button|input|select|textarea|a|::selection|:focus-visible)$/.test(selector));
}

function assertLegacyResetIsolation(source: string) {
  const blocks = parseCssBlocks(source);
  const scopes = blocks.filter((block) => block.header === boundedLegacyScope);
  assert.equal(scopes.length, 1, "expected exactly one bounded shadcn-to-Astryx scope");
  const scope = scopes[0];
  assert.ok(scope);

  const genericBlocks = blocks.filter((block) => bareGenericSelectors(block.header).length > 0);
  const structuralGlobals = new Set(["html,body,#brp-app-root"]);
  for (const block of genericBlocks) {
    if (structuralGlobals.has(block.header)) {
      assert.equal(block.parent, undefined, `${block.header} must remain a top-level structural global`);
      continue;
    }
    assert.ok(
      genericLegacySelectors.has(block.header),
      `unexpected generic legacy selector: ${block.header}`,
    );
    assert.equal(block.parent, scope, `${block.header} escaped the bounded legacy scope`);
  }

  for (const selector of genericLegacySelectors) {
    assert.equal(
      genericBlocks.filter((block) => block.header === selector).length,
      1,
      `expected exactly one generic legacy rule for ${selector}`,
    );
  }
}

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
  assertLegacyResetIsolation(globals);
  assert.throws(
    () => assertLegacyResetIsolation(`${globals}\nbutton { color: inherit; }\n`),
    /button escaped the bounded legacy scope/,
  );
  assert.throws(
    () => assertLegacyResetIsolation(`${globals}\nbutton,.escaped { color: inherit; }\n`),
    /unexpected generic legacy selector: button,.escaped/,
  );
  assert.throws(
    () => assertLegacyResetIsolation(globals.replace(boundedLegacyScope, '@scope (html[data-design-system="shadcn"])')),
    /exactly one bounded shadcn-to-Astryx scope/,
  );
});

test("Playwright appearance artifacts stay under .next", () => {
  const playwright = read("playwright.appearance.config.ts");
  assert.match(playwright, /outputDir:\s*["']\.next\/playwright-appearance-results["']/);
});

test("the appearance probe query gate is hydration-safe", () => {
  const probe = read("src/components/appearance/astryx-foundation-probe.tsx");
  assert.match(probe, /useSyncExternalStore/);
  assert.doesNotMatch(probe, /\buseEffect\b|\buseState\b/);
  assert.match(probe, /astryx-foundation-probe/);
});

test("ESLint ignores only generated Neutral declaration artifacts", () => {
  const eslint = read("eslint.config.mjs");
  assert.match(eslint, /src\/themes\/neutral\/\*\.d\.ts/);
});
