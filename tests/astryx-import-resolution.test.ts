import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {LayerProvider} from "@astryxdesign/core/Layer";
import {LinkProvider} from "@astryxdesign/core/Link";
import {Theme} from "@astryxdesign/core/theme";

type AstryxProvider = typeof Theme | typeof LayerProvider | typeof LinkProvider;

const providers: readonly AstryxProvider[] = [Theme, LayerProvider, LinkProvider];

test("the pinned 0.1.7 Astryx exports resolve as real provider values", () => {
  assert.equal(providers.length, 3);
  for (const provider of providers) assert.equal(typeof provider, "function");
});

test("stable infrastructure uses the installed 0.1.7 entry points", () => {
  const source = readFileSync("src/components/appearance/stable-renderer-infrastructure.tsx", "utf8");

  assert.match(source, /from "@astryxdesign\/core\/theme"/);
  assert.match(source, /from "@astryxdesign\/core\/Layer"/);
  assert.match(source, /from "@astryxdesign\/core\/Link"/);
});
