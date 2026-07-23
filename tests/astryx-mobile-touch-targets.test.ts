import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const shellView = readFileSync("src/components/shell/astryx-app-shell-view.tsx", "utf8");
const shellClasses = readFileSync("src/components/shell/astryx-shell.css.ts", "utf8");
const globalStyles = readFileSync("src/app/globals.css", "utf8");

test("Astryx mobile header actions keep a 44px minimum touch target", () => {
  assert.match(shellClasses, /mobileTheme: "brp-astryx-shell-mobile-theme"/);
  assert.match(shellView, /className=\{styles\.mobileTheme\}/);
  assert.match(
    globalStyles,
    /@media \(max-width: 720px\)[\s\S]*?\.brp-astryx-shell-mobile-menu,[\s\S]*?\.brp-astryx-shell-mobile-search,[\s\S]*?\.brp-astryx-shell-mobile-theme\s*\{[\s\S]*?width: 44px !important;[\s\S]*?min-width: 44px !important;[\s\S]*?height: 44px !important;[\s\S]*?min-height: 44px !important;[\s\S]*?flex: 0 0 44px !important;/,
  );
});
