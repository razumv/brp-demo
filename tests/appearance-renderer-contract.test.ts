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
  assert.match(viewSwitch, /loadAstryxView:\s*AstryxRendererViewLoader<Props>/);
  assert.match(viewSwitch, /astryxViewProps:\s*Props/);
  assert.match(viewSwitch, /useState\(\(\) => lazy\(loadAstryxView\)\)/);
  assert.match(viewSwitch, /key=\{rendererAttemptId\}/);
  assert.match(viewSwitch, /attemptSlotId = `\$\{rendererAttemptId\}:\$\{slotId\}`/);
  assert.match(viewSwitch, /registerRendererSlot/);
  assert.match(viewSwitch, /markRendererSlotReady/);
  assert.match(viewSwitch, /renderedDesignSystem/);
  assert.match(viewSwitch, /hidden=\{!isAstryxCommitted\}/);
  assert.match(viewSwitch, /isAstryxCommitted \? null : currentView/);
  assert.match(viewSwitch, /<AstryxViewBoundary/);
  assert.match(viewSwitch, /failRendererTransition/);
  assert.match(boundary, /fallback/);
});

test("the public appearance contract exposes committed renderer preference separately from desired intent", () => {
  const context = read("src/components/appearance/use-appearance.ts");
  const provider = read("src/components/providers/appearance-provider.tsx");

  assert.match(context, /renderedPreference:\s*AppearancePreferenceV1/);
  assert.match(context, /rendererAttemptId:\s*number/);
  assert.match(provider, /renderedPreference:\s*state\.renderedPreference/);
  assert.match(provider, /rendererAttemptId:\s*state\.rendererAttemptId/);
});

test("AppShell keeps route children below one stable main and has no diagnostic readiness slot", () => {
  const shell = read("src/components/shell/app-shell.tsx");
  const layout = read("src/app/layout.tsx");
  const probe = read("src/components/appearance/renderer-state-preservation-probe.tsx");

  assert.match(shell, /<main[^>]*>[\s\S]*\{children\}[\s\S]*<\/main>/);
  assert.doesNotMatch(shell, /RendererStatePreservationProbe|ReadinessSlot/);
  assert.match(layout, /NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE/);
  assert.match(probe, /@astryxdesign\/core\/Button/);
  assert.match(probe, /@astryxdesign\/core\/TextInput/);
  assert.match(probe, /RendererStateHarnessProps/);
  assert.doesNotMatch(probe, /<output[^>]*aria-hidden/);
});
