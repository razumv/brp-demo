import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const preferenceHookPath = "src/components/shell/use-shell-preferences.ts";
const appShellPath = "src/components/shell/app-shell.tsx";
const shellViewPath = "src/components/shell/astryx-app-shell-view.tsx";
const shellClassesPath = "src/components/shell/astryx-shell.css.ts";
const globalStylesPath = "src/app/globals.css";

test("Astryx shell persists a hydration-safe compact desktop rail with labelled controls", () => {
  const preferenceHook = readFileSync(preferenceHookPath, "utf8");
  const appShell = readFileSync(appShellPath, "utf8");
  const shellView = readFileSync(shellViewPath, "utf8");
  const shellClasses = readFileSync(shellClassesPath, "utf8");
  const globalStyles = readFileSync(globalStylesPath, "utf8");

  assert.match(
    preferenceHook,
    /export function usePersistedBooleanPreference\(key: string, fallback: boolean\): readonly \[boolean, \(value: boolean\) => void, boolean\]/,
  );
  assert.match(preferenceHook, /useEffect\(/);
  assert.match(preferenceHook, /window\.localStorage\.getItem\(key\)/);
  assert.match(preferenceHook, /window\.localStorage\.setItem\(key,/);
  assert.match(preferenceHook, /catch \{/);

  assert.match(appShell, /usePersistedBooleanPreference\("brp-clone-ui-v1:astryx-sidebar-collapsed", false\)/);
  assert.match(appShell, /data-sidebar-collapsed=\{sidebarCollapsed \? "true" : "false"\}/);
  assert.match(appShell, /data-sidebar-preferences-ready=\{sidebarPreferencesReady \? "true" : "false"\}/);
  assert.match(shellView, /<IconButton[\s\S]*label=\{sidebarCollapsed \? "Розгорнути бічну навігацію" : "Згорнути бічну навігацію"\}/);
  assert.match(shellView, /tooltip=\{sidebarCollapsed \? "Розгорнути бічну навігацію" : "Згорнути бічну навігацію"\}/);
  assert.match(shellView, /collapsible=\{\{/);
  assert.doesNotMatch(shellView, /data-sidebar-collapsed=/);
  assert.match(shellView, /<SideNavItem[\s\S]*label=\{item\.label\}/);

  assert.match(shellClasses, /sideNavControls:/);
  assert.match(globalStyles, /\.app-shell\[data-brp-shell-renderer="astryx"\]\[data-sidebar-collapsed="true"\]/);
  assert.doesNotMatch(globalStyles, /:has\(\.brp-astryx-shell-side-nav/);
  assert.match(globalStyles, /--brp-astryx-sidebar-width/);
  assert.match(globalStyles, /var\(--shadow-med\)/);
});
