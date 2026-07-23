import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("the shared shell exposes only the language it actually renders", () => {
  const preferences = read("src/components/shell/use-shell-preferences.ts");
  const controller = read("src/components/shell/app-shell-controller.ts");

  assert.match(preferences, /export function usePersistedChoicePreference/);
  assert.match(preferences, /useEffect\(/);
  assert.match(preferences, /window\.localStorage\.getItem\(key\)/);
  assert.match(preferences, /window\.localStorage\.setItem\(key, nextValue\)/);
  assert.match(controller, /brp-clone-ui-v1:language/);
  assert.match(controller, /export type ShellLanguage = "uk"/);
  assert.doesNotMatch(controller, /id: "en"|id: "ru"/);
  assert.match(controller, /language: ShellLanguage/);
  assert.match(controller, /setLanguage\(language: ShellLanguage\): void/);
});

test("both shell renderers expose real language and notification popovers", () => {
  const current = read("src/components/shell/current-app-shell-view.tsx");
  const astryx = read("src/components/shell/astryx-app-shell-view.tsx");

  for (const source of [current, astryx]) {
    assert.match(source, /Сповіщення/);
    assert.match(source, /Позначити все прочитаним/);
    assert.match(source, /controller\.setLanguage/);
    assert.match(source, /controller\.togglePopover\("notifications"\)/);
  }
});

test("the current shell has the same persisted desktop-rail contract as Astryx", () => {
  const shell = read("src/components/shell/app-shell.tsx");
  const current = read("src/components/shell/current-app-shell-view.tsx");
  const styles = read("src/app/globals.css");

  assert.match(shell, /brp-clone-ui-v1:current-sidebar-collapsed/);
  assert.match(current, /Згорнути бічну навігацію/);
  assert.match(current, /Розгорнути бічну навігацію/);
  assert.match(styles, /data-brp-shell-renderer="current"\]\[data-sidebar-collapsed="true"\]/);
  assert.match(styles, /\.desktop-sidebar-toggle/);
});
