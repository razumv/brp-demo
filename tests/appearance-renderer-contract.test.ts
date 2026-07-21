import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("the application has one permanent Astryx provider ancestry below AppearanceProvider", () => {
  const layout = read("src/app/layout.tsx");
  const infrastructure = read("src/components/appearance/stable-renderer-infrastructure.tsx");

  assert.match(layout, /<AppearanceProvider>[\s\S]*<StableRendererInfrastructure>[\s\S]*<div id="brp-app-root">[\s\S]*<DemoStoreProvider>/);
  assert.equal((infrastructure.match(/<Theme\b/g) ?? []).length, 1);
  assert.equal((infrastructure.match(/<LayerProvider\b/g) ?? []).length, 1);
  assert.equal((infrastructure.match(/<LinkProvider\b/g) ?? []).length, 1);
  assert.match(infrastructure, /theme=\{activeTheme\}/);
  assert.match(infrastructure, /mode=\{resolvedMode\}/);
  assert.match(infrastructure, /component=\{NextLink\}/);
  assert.doesNotMatch(infrastructure, /CurrentRoot|AstryxRoot/);
});

test("renderer switching is lazy, slot-based, and recovers to the current view", () => {
  const viewSwitch = read("src/components/appearance/renderer-view-switch.tsx");
  const boundary = read("src/components/appearance/astryx-view-boundary.tsx");

  assert.match(viewSwitch, /^"use client";/);
  assert.match(viewSwitch, /AstryxView:\s*React\.ComponentType<AstryxRendererViewProps>/);
  assert.match(viewSwitch, /registerRendererSlot/);
  assert.match(viewSwitch, /markRendererSlotReady/);
  assert.match(viewSwitch, /<AstryxViewBoundary/);
  assert.match(viewSwitch, /failRendererTransition/);
  assert.match(boundary, /fallback/);
});

test("the public appearance contract exposes committed renderer preference separately from desired intent", () => {
  const context = read("src/components/appearance/use-appearance.ts");
  const provider = read("src/components/providers/appearance-provider.tsx");

  assert.match(context, /renderedPreference:\s*AppearancePreferenceV1/);
  assert.match(provider, /renderedPreference:\s*state\.renderedPreference/);
});

test("AppShell keeps route children below one stable main while only chrome has a renderer slot", () => {
  const shell = read("src/components/shell/app-shell.tsx");

  assert.match(shell, /RendererViewSwitch/);
  assert.match(shell, /const\s+AstryxShellReadinessSlot\s*=\s+dynamic\(/);
  assert.match(shell, /ssr:\s*false/);
  assert.match(shell, /<main[^>]*>[\s\S]*\{children\}[\s\S]*<\/main>/);
  assert.match(shell, /currentView=\{null\}/);
});
