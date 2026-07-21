# BRP shadcn/ui + Astryx Neutral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one production-ready BRP application whose admin and dealer routes can switch globally between the preserved current `shadcn/ui` renderer and a complete official Astryx Neutral renderer in system, light, and dark modes, without changing workflows or breaking GitHub Pages/PWA delivery.

**Architecture:** Domain/session/cart/workflow state and route/shell controllers remain in stable ancestry; only renderer-specific views switch below those controllers. A versioned asynchronous appearance repository and synchronous first-paint snapshot own desired versus committed appearance state. A pre-hydration script applies validated root markers, while a stable infrastructure root keeps exactly one `Theme`, `LayerProvider`, and base-path-safe `LinkProvider` mounted. Lazy Astryx route/shell views are separately identifiable chunks; current views remain the server-prerendered default, Suspense fallback, and recovery path.

**Tech Stack:** Next.js 16.2.10 App Router/static export, React 19.2.4, TypeScript strict, Tailwind CSS v4, current shadcn/Base UI renderer, `@astryxdesign/core@0.1.7`, `@astryxdesign/cli@0.1.7`, `@stylexjs/stylex@0.19.0`, Astryx Neutral CLI source, local Figtree variable font for Latin/Latin-Extended with the existing local Inter Cyrillic fallback, Node test runner through `tsx`, Playwright, Workbox, GitHub Pages.

## Global Constraints

- Work only in `/Users/razumv/brp-clone/.worktrees/astryx-dual-design-system` on `codex/astryx-dual-design-system`; preserve unrelated changes.
- Treat `docs/superpowers/specs/2026-07-21-astryx-dual-design-system-design.md` and `docs/superpowers/specs/2026-07-21-astryx-dual-design-system-agent-prompt.md` as the binding product contract.
- Keep `DesignSystem = "shadcn" | "astryx"`, `ColorMode = "system" | "light" | "dark"`, version `1`, and storage key `brp-appearance-v1` exact.
- Preserve the current renderer as the server-prerendered and no-preference default; preserve the current default light mode when no saved preference exists.
- Do not render both design systems at once. Do not duplicate route trees or domain logic. Do not use Astryx as a CSS skin over current controls.
- Keep `DemoStoreProvider`, `DealerWorkflowProvider`, all workflow commands, storage keys, permissions, validation, routes, query compatibility, disabled reasons, and backend boundaries behaviorally unchanged.
- No user-visible copy may call the application a demo, mockup, clone, temporary frontend, or local implementation.
- Do not enable any locked or backend-dependent action merely because Astryx provides an enabled-looking primitive.
- Use exact pinned versions: `@astryxdesign/core@0.1.7`, `@astryxdesign/cli@0.1.7`, `@stylexjs/stylex@0.19.0`; add `@astryxdesign/theme-neutral@0.1.7` only if the installed CLI build path proves it is required.
- Run the owner-requested command exactly: `npx astryx theme add neutral`. Commit `src/themes/neutral/neutralTheme.ts` and `src/themes/neutral/icons.tsx` as editable source and deterministically build `neutral.css`, `neutral.js`, `neutral.d.ts`, and `neutral.variants.d.ts`.
- Use official Astryx MCP `search` then `get` whenever an import, prop, provider, CSS layer, or composition is uncertain; never invent an Astryx component API.
- Preserve official CSS order: `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities`; import this declaration before every other stylesheet.
- Bundle Figtree Latin/Latin-Extended locally and use the existing local Inter variable Cyrillic WOFF2 as the explicit fallback; never load remote fonts or claim Figtree contains Cyrillic glyphs.
- AppearanceProvider owns `data-design-system`, `data-color-mode`, `data-resolved-theme`, and `.dark`; Astryx `Theme` owns its required `data-theme` and `data-astryx-theme="neutral"` semantics. In system mode Astryx omits `data-theme`.
- GitHub Pages local storage is a browser-local shadow. The repository API remains asynchronous and backend-shaped so a future `brp-dev1` authoritative adapter does not change components.
- Keep `/brp-demo`, static export, Workbox navigation `NetworkOnly`, offline fallback, installed PWA, and current responsive behavior working.
- After Task 1, every appearance browser suite must run through the fresh-production `test:e2e:appearance` wrapper (or the dedicated fresh-export Pages wrapper). Raw Playwright invocations against an unspecified/default server are forbidden.
- Every behavior change follows RED → observed expected failure → minimal GREEN → surrounding suite. Do not write production behavior before its failing test.
- A task is complete only after its task-scoped reviewer returns both spec compliance and code-quality approval.

---

### Task 0: Freeze ancestry, route inventory, current-renderer screenshots, and baseline gates

**Files:**
- Create: `docs/research/astryx-migration-baseline.md`
- Create: `docs/research/astryx-route-inventory.md`
- Create: `docs/design-references/astryx-baseline/` screenshots

**Interfaces:**
- Consumes: current route files, `generateStaticParams`, compatibility-query routes, current Playwright fixtures, and the clean `e557383` behavior baseline.
- Produces: a checked human-readable route list, representative current-renderer regression images at 390/768/1280/1440, and exact baseline command evidence. It changes no application behavior.

- [ ] **Step 1: Prove the isolated worktree and ancestry**

Run:

```bash
test "$(git branch --show-current)" = "codex/astryx-dual-design-system"
test "$(git rev-parse --git-common-dir)" = "/Users/razumv/brp-clone/.git"
git merge-base --is-ancestor e557383 HEAD
test -z "$(git status --porcelain)" || {
  echo "Task 0 requires a clean worktree" >&2
  git status --short
  exit 1
}
```

- [ ] **Step 2: Generate and manually reconcile the complete route inventory**

Inventory every `src/app/**/page.tsx`, every emitted value from `generateStaticParams`, and the query-compatible admin/dealer order routes. Record the owning controller/view file, behavior tests, mobile exception, custom visualization exception, and target migration batch for every route. Cross-check that the current static build count and inventory count reconcile; do not treat one generic `[feature]` source file as one tested surface.

- [ ] **Step 3: Capture current-renderer baselines before CSS changes**

Build once, then capture representative and special routes in current light/dark at 390, 768, 1280, and 1440 widths, including shared shell/login/offline, admin pipeline/consignment/warehouse/catalog/schedule/permissions, and dealer catalog diagram/cart/orders/accessories/workshop/team access. Store deterministic PNG names in `docs/design-references/astryx-baseline/` and list them in the baseline document.

- [ ] **Step 4: Run and record the baseline**

Run:

```bash
npm run lint
npm run typecheck
npm run test:dealer-state
npm run build
```

Expected: all PASS and the build emits the same 102 static pages recorded at `e557383`. A failure blocks Task 1.

- [ ] **Step 5: Commit the baseline evidence**

```bash
git add docs/research/astryx-migration-baseline.md docs/research/astryx-route-inventory.md docs/design-references/astryx-baseline
git commit -m "test(astryx): freeze migration baseline"
```

---

### Task 1: Pin Astryx, scaffold Neutral, bundle fonts, and establish deterministic CSS layers

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/astryx-layers.css`
- Create: `src/app/astryx-foundation.css`
- Create: `src/components/appearance/astryx-foundation-probe.tsx`
- Create: `src/themes/current/currentCompatibilityTheme.ts`
- Create: `src/themes/neutral/neutralTheme.ts` via CLI
- Create: `src/themes/neutral/icons.tsx` via CLI
- Create: `src/themes/neutral/neutral.css` via CLI build
- Create: `src/themes/neutral/neutral.js` via CLI build
- Create: `src/themes/neutral/neutral.d.ts` via CLI build
- Create: `src/themes/neutral/neutral.variants.d.ts` via CLI build
- Create: `scripts/check-astryx-theme.mjs`
- Create: `scripts/test-appearance-production.mjs`
- Create: `playwright.appearance.config.ts`
- Test: `tests/astryx-theme-artifacts.test.ts`
- Test: `tests/e2e/astryx-foundation.spec.ts`

**Interfaces:**
- Consumes: Next 16 CSS import ordering guidance and the official Astryx 0.1.7 build contract.
- Produces: `neutralTheme` from `@/themes/neutral/neutral`, a stable current compatibility theme, canonical layer order, local Figtree Latin/Latin-Extended plus Inter Cyrillic fallback, scripts `theme:astryx:build`, semantic `theme:astryx:check`, and `test:appearance`. Task 2 is blocked until the real browser foundation probe passes in light/dark after a production build.

- [ ] **Step 1: Write the failing artifact contract**

```ts
// tests/astryx-theme-artifacts.test.ts
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
  assert.match(pkg.scripts["theme:astryx:build"], /astryx theme build src\/themes\/neutral\/neutralTheme\.ts/);
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
  assert.match(globals, /"Figtree Variable", "Inter"/);
});
```

- [ ] **Step 2: Run RED and record the expected failure**

Run: `npx tsx --test tests/astryx-theme-artifacts.test.ts`

Expected: FAIL because Astryx dependencies, `theme:astryx:build`, `src/app/astryx-layers.css`, and `src/themes/neutral/*` do not exist.

- [ ] **Step 3: Install exact packages, scaffold, and build**

Run exactly:

```bash
npm install --save-exact @astryxdesign/core@0.1.7 @stylexjs/stylex@0.19.0 @fontsource-variable/figtree@5.3.0
npm install --save-dev --save-exact @astryxdesign/cli@0.1.7
npx astryx theme add neutral
npx astryx theme build src/themes/neutral/neutralTheme.ts
```

Add exact scripts:

```json
{
  "theme:astryx:build": "astryx theme build src/themes/neutral/neutralTheme.ts",
  "theme:astryx:check": "node scripts/check-astryx-theme.mjs",
  "test:appearance": "tsx --test tests/appearance-*.test.ts tests/astryx-*.test.ts",
  "test:e2e:appearance": "node scripts/test-appearance-production.mjs",
  "test:e2e:appearance:foundation": "NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE=1 npm run test:e2e:appearance -- tests/e2e/astryx-foundation.spec.ts --project=chromium"
}
```

`scripts/test-appearance-production.mjs` always runs a fresh `next build` with the caller's environment, writes a unique build provenance value under `.next`, and only then invokes the requested Playwright files/projects through `playwright.appearance.config.ts`. That production-only config uses `baseURL=http://127.0.0.1:3101`, a `webServer` command that serves the just-built Next application on port `3101`, `reuseExistingServer: false`, validates the matching provenance, and waits on an explicit readiness URL. It must never fall back to `next dev` or attach to an unrelated server on port `3000`.

Create the first-import file exactly:

```css
/* src/app/astryx-layers.css */
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;
```

Replace the opening Tailwind import in `globals.css` with:

```css
@import "./astryx-layers.css";
@import "./astryx-foundation.css";
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "../themes/neutral/neutral.css";
@import "@astryxdesign/core/tailwind-theme.css";
@import "tailwindcss/utilities.css" layer(utilities);
@import "@fontsource-variable/figtree/index.css";
```

Keep the existing local Inter Latin/Cyrillic `@font-face` declarations. Update Neutral typography/fallbacks to `"Figtree Variable", "Inter", ui-sans-serif, system-ui, sans-serif`; do not claim Figtree has Cyrillic glyphs.

`scripts/check-astryx-theme.mjs` snapshots the committed outputs, rebuilds from copied source in a temporary directory, removes only the CLI `Generated:` timestamp header, compares normalized CSS/JS/declarations byte-for-byte, and restores/cleans in `finally`. It must fail on any semantic drift and leave `git status` unchanged.

In `astryx-foundation.css`, isolate only renderer-root/body behavior without styling components:

```css
[data-design-system="astryx"] body,
[data-design-system="astryx"] #brp-app-root {
  min-height: 100%;
  background: var(--color-background-body);
  color: var(--color-text-primary);
  font-family: "Figtree Variable", "Inter", ui-sans-serif, system-ui, sans-serif;
}

html[data-renderer-pending="true"] #brp-app-root {
  visibility: hidden;
}
```

- [ ] **Step 4: Audit generated files and isolate legacy global selectors**

Run:

```bash
rg -n '^(\*|:root|\.dark|html|body|button|input|select|textarea|a|::selection|:focus-visible)' src/app/globals.css
```

Keep the current token block and generic current resets under `[data-design-system="shadcn"]` selectors. Keep only structural `html`, `body`, and `#brp-app-root` rules global. Do not rename existing current classes. Add an artifact-test assertion that `button,`, `input,`, `select,`, `textarea`, `a`, and `:focus-visible` no longer appear as unscoped top-level selectors.

Inventory all duplicate keys between Astryx `tailwind-theme.css` and the project `@theme inline` block (`--color-primary`, `--color-card`, `--color-muted`, `--color-accent`, `--color-border`, spacing/font/radius keys). Keep the current project mapping after the imported bridge so current utilities retain their exact values. Astryx-specific views must use Astryx primitives or direct semantic runtime tokens, never ambiguous shared Tailwind utilities. Add computed-style and screenshot assertions proving the current Button/Card/Input/Table are unchanged from Task 0.

- [ ] **Step 5: Mount the gated real-component probe and run GREEN in production mode**

Render `AstryxFoundationProbe` only when `NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE=1`. Use verified imports from `@astryxdesign/core/Button`, `/TextInput`, `/Card`, `/Table`, `/Layer`, `/Link`, and `/theme`. The probe contains actual light and dark nested Theme regions. Assert non-zero padding on Button, TextInput, Card, and actual `th`/`td` cells (not the Table root), correct Figtree/Inter fallback, and no current-renderer screenshot regression.

Run:

```bash
npm run theme:astryx:check
npm run test:appearance
npm run typecheck
npm run test:e2e:appearance:foundation
```

Expected: artifact checks, typecheck, build, current regression screenshots, and real Astryx light/dark computed styles all PASS; the semantic artifact check leaves generated files and `git status` unchanged. Only then may Task 2 start.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/check-astryx-theme.mjs scripts/test-appearance-production.mjs playwright.appearance.config.ts src/app/layout.tsx src/app/globals.css src/app/astryx-layers.css src/app/astryx-foundation.css src/components/appearance/astryx-foundation-probe.tsx src/themes/current src/themes/neutral tests/astryx-theme-artifacts.test.ts tests/e2e/astryx-foundation.spec.ts
git commit -m "feat(astryx): establish neutral theme foundation"
```

---

### Task 2: Implement the versioned appearance contract and browser repository

**Files:**
- Create: `src/lib/appearance/contracts.ts`
- Create: `src/lib/appearance/preference-codec.ts`
- Create: `src/lib/appearance/browser-repository.ts`
- Create: `src/lib/appearance/index.ts`
- Test: `tests/appearance-preferences.test.ts`

**Interfaces:**
- Consumes: browser `Storage` and `storage` events through injected minimal ports.
- Produces: exact `AppearancePreferenceV1`, repository/snapshot contracts, codec helpers, `BrowserAppearancePreferencesRepository`, `createBrowserAppearanceRepository()`.

- [ ] **Step 1: Write failing codec and repository tests**

```ts
// tests/appearance-preferences.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE_PREFERENCE,
  BrowserAppearancePreferencesRepository,
  migrateLegacyTheme,
  normalizeAppearancePreference,
  parseAppearancePreference,
  resolveColorMode,
} from "../src/lib/appearance";

test("normalizes only the exact v1 design-system and mode union", () => {
  assert.deepEqual(normalizeAppearancePreference({version: 1, designSystem: "astryx", colorMode: "dark"}), {
    version: 1, designSystem: "astryx", colorMode: "dark",
  });
  assert.equal(normalizeAppearancePreference({version: 2, designSystem: "astryx", colorMode: "dark"}), null);
  assert.equal(normalizeAppearancePreference({version: 1, designSystem: "future", colorMode: "dark"}), null);
  assert.equal(parseAppearancePreference("not-json"), null);
  assert.deepEqual(DEFAULT_APPEARANCE_PREFERENCE, {version: 1, designSystem: "shadcn", colorMode: "light"});
});

test("migrates only legacy light and dark values to shadcn", () => {
  assert.deepEqual(migrateLegacyTheme("dark"), {version: 1, designSystem: "shadcn", colorMode: "dark"});
  assert.deepEqual(migrateLegacyTheme("light"), {version: 1, designSystem: "shadcn", colorMode: "light"});
  assert.equal(migrateLegacyTheme("system"), null);
  assert.equal(resolveColorMode("system", true), "dark");
  assert.equal(resolveColorMode("system", false), "light");
});

test("acknowledged writes publish locally and storage events publish cross-tab", async () => {
  const harness = createRepositoryHarness();
  const repo = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const seen: unknown[] = [];
  const unsubscribe = repo.subscribe((preference) => seen.push(preference));
  const preference = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  await repo.write(preference);
  assert.deepEqual(await repo.read(), preference);
  assert.deepEqual(seen, [preference]);
  harness.emitStorage(APPEARANCE_STORAGE_KEY, JSON.stringify({version: 1, designSystem: "shadcn", colorMode: "dark"}));
  assert.deepEqual(seen.at(-1), {version: 1, designSystem: "shadcn", colorMode: "dark"});
  unsubscribe();
});

test("failed writes keep the last-known-good preference and do not publish", async () => {
  const harness = createRepositoryHarness({throwOnSet: true});
  const repo = new BrowserAppearancePreferencesRepository(harness.dependencies);
  let publications = 0;
  repo.subscribe(() => publications++);
  await assert.rejects(repo.write({version: 1, designSystem: "astryx", colorMode: "dark"}));
  assert.equal(publications, 0);
  assert.equal(await repo.read(), null);
});
```

Implement `createRepositoryHarness` in the same test with a `Map<string,string>`, injected event listener registry, optional throwing `setItem`, and `emitStorage(key,newValue)`; do not depend on JSDOM.

- [ ] **Step 2: Run RED**

Run: `npx tsx --test tests/appearance-preferences.test.ts`

Expected: FAIL with `Cannot find module '../src/lib/appearance'`.

- [ ] **Step 3: Implement exact contracts and pure codec**

```ts
// src/lib/appearance/contracts.ts
export type DesignSystem = "shadcn" | "astryx";
export type ColorMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface AppearancePreferenceV1 {
  version: 1;
  designSystem: DesignSystem;
  colorMode: ColorMode;
}

export interface AppearancePreferencesRepository {
  read(): Promise<AppearancePreferenceV1 | null>;
  write(preference: AppearancePreferenceV1): Promise<void>;
  subscribe(listener: (preference: AppearancePreferenceV1) => void): () => void;
}

export interface AppearanceBootstrapSnapshot {
  read(): AppearancePreferenceV1 | null;
  write(preference: AppearancePreferenceV1): void;
}
```

```ts
// src/lib/appearance/preference-codec.ts
import type {AppearancePreferenceV1, ColorMode, ResolvedTheme} from "./contracts";

export const APPEARANCE_STORAGE_KEY = "brp-appearance-v1";
export const LEGACY_THEME_STORAGE_KEY = "brp-clone-theme";
export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreferenceV1 = {
  version: 1,
  designSystem: "shadcn",
  colorMode: "light",
};

export function normalizeAppearancePreference(value: unknown): AppearancePreferenceV1 | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1) return null;
  if (candidate.designSystem !== "shadcn" && candidate.designSystem !== "astryx") return null;
  if (candidate.colorMode !== "system" && candidate.colorMode !== "light" && candidate.colorMode !== "dark") return null;
  return {version: 1, designSystem: candidate.designSystem, colorMode: candidate.colorMode};
}

export function parseAppearancePreference(raw: string | null): AppearancePreferenceV1 | null {
  if (raw === null) return null;
  try { return normalizeAppearancePreference(JSON.parse(raw)); } catch { return null; }
}

export function resolveColorMode(mode: ColorMode, systemPrefersDark: boolean): ResolvedTheme {
  return mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
}

export function migrateLegacyTheme(raw: string | null): AppearancePreferenceV1 | null {
  return raw === "light" || raw === "dark"
    ? {version: 1, designSystem: "shadcn", colorMode: raw}
    : null;
}
```

Implement the repository with injected `storage`, `addStorageListener`, and `removeStorageListener` ports. `read()` validates v1 first, then migrates the legacy key once and removes it only after a successful v1 write. `write()` calls `storage.setItem` before updating last-known-good and listeners. `subscribe()` owns same-document listeners and filters storage events by the exact key.

- [ ] **Step 4: Run GREEN and surrounding tests**

Run:

```bash
npm run test:appearance
npm run test:dealer-state
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/appearance tests/appearance-preferences.test.ts
git commit -m "feat(appearance): add versioned preference repository"
```

---

### Task 3: Add shadcn-first bootstrap, desired/committed provider state, and runtime color resolution

**Files:**
- Create: `src/lib/appearance/bootstrap-source.ts`
- Create: `src/lib/appearance/renderer-readiness.ts`
- Create: `src/components/appearance/appearance-bootstrap-script.tsx`
- Create: `src/components/providers/appearance-provider.tsx`
- Create: `src/components/appearance/use-appearance.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/shell/app-shell.tsx`
- Test: `tests/appearance-bootstrap.test.ts`
- Test: `tests/appearance-provider-contract.test.ts`

**Interfaces:**
- Consumes: Task 2 repository/codec and the server shadcn default.
- Produces: separate desired preference and committed renderer state, readiness-slot registration, root-safe head bootstrap, bounded recovery, and single ownership of semantic root attributes.

- [ ] **Step 1: Write RED tests for the real head timing and shadcn-first hydration contract**

The VM harness must expose only `document.documentElement` during bootstrap; `#brp-app-root` is deliberately absent because Next emits `beforeInteractive` in `<head>`. Assert a saved Astryx/system preference sets `html.dataset.rendererPending="true"`, exact `data-theme`/`data-astryx-theme="neutral"` markers, resolved mode and `.dark`. Assert corrupt/future storage leaves visible shadcn light and no pending marker. Advance the watchdog by 4 seconds and assert atomic shadcn recovery on `<html>`.

The provider contract test must prove:

1. its first render is exactly default shadcn/light even when the synchronous browser snapshot requests Astryx;
2. after hydration it records Astryx as `desiredPreference` but keeps `renderedDesignSystem="shadcn"` and the application pending;
3. it commits Astryx only after every registered renderer slot reports ready;
4. a failed slot or watchdog reverts desired and committed state to last-known-good shadcn;
5. switching back to shadcn commits immediately without changing provider ancestry.

- [ ] **Step 2: Run RED**

Run: `npx tsx --test tests/appearance-bootstrap.test.ts tests/appearance-provider-contract.test.ts`

Expected: FAIL because bootstrap, readiness coordinator, and provider do not exist.

- [ ] **Step 3: Implement a literal dependency-free bootstrap**

The script validates/migrates storage, writes a serializable bootstrap snapshot on `window`, and only mutates `<html>`:

```ts
html.dataset.designSystem = desired.designSystem;
html.dataset.colorMode = desired.colorMode;
html.dataset.resolvedTheme = resolved;
html.classList.toggle("dark", resolved === "dark");
if (desired.designSystem === "astryx") {
  html.dataset.astryxTheme = "neutral";
  if (desired.colorMode === "system") html.removeAttribute("data-theme");
  else html.dataset.theme = desired.colorMode;
  html.dataset.rendererPending = "true";
  window.__BRP_ASTRYX_WATCHDOG__ = setTimeout(recoverShadcn, 4_000);
}
```

Never query `#brp-app-root` in the head script. `recoverShadcn` clears Astryx-only markers, restores semantic shadcn attributes, removes pending, and records a non-blocking diagnostic. The source is self-contained, `try/catch` guarded, and executable in the VM harness.

- [ ] **Step 4: Implement desired versus committed provider ownership**

Extend the context contract with:

```ts
desiredPreference: AppearancePreferenceV1;
renderedDesignSystem: DesignSystem;
transitionStatus: "idle" | "loading-astryx" | "ready" | "error";
registerRendererSlot(id: string): () => void;
markRendererSlotReady(id: string): void;
failRendererTransition(error: Error): void;
```

Provider rules:

1. render the exact shadcn/light default on the server and first client render; never initialize React state from storage during render;
2. subscribe before asynchronous `read()`, then consume the validated bootstrap snapshot/equivalent repository value after hydration;
3. keep desired Astryx separate from committed shadcn while readiness slots are pending; set/remove `html[data-renderer-pending]` only through the provider after hydration;
4. register shell and active-route slots, debounce the zero-pending barrier by one animation frame, require at least one Astryx-ready slot, then atomically commit root markers and reveal;
5. keep last-known-good on read/write/import/render error and expose `status="error"` without a dead screen;
6. resolve `system` through `matchMedia`, own semantic attributes, `.dark`, and runtime `theme-color`;
7. update desired preference only after repository `write()` acknowledgement;
8. never touch DemoStore or dealer workflow storage.

In `layout.tsx`, keep server defaults and the stable application root. Remove shell-local legacy storage and direct `.dark` ownership; the existing theme button calls the provider.

- [ ] **Step 5: Run GREEN with hydration diagnostics**

Run:

```bash
npm run test:appearance
npm run test:dealer-state
npm run typecheck
npm run build
```

Expected: all PASS; a browser smoke with saved Astryx records no hydration/recoverable console error and observes shadcn-first state before the later renderer readiness task.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/components/appearance src/components/providers/appearance-provider.tsx src/components/shell/app-shell.tsx src/lib/appearance tests/appearance-bootstrap.test.ts tests/appearance-provider-contract.test.ts
git commit -m "feat(appearance): add shadcn-first appearance state"
```

---

### Task 4: Mount stable renderer infrastructure, lazy per-view switching, and failure recovery

**Files:**
- Create: `src/components/appearance/stable-renderer-infrastructure.tsx`
- Create: `src/components/appearance/renderer-view-switch.tsx`
- Create: `src/components/appearance/astryx-view-boundary.tsx`
- Create: `src/components/appearance/renderer-state-preservation-probe.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/shell/app-shell.tsx`
- Test: `tests/appearance-renderer-contract.test.ts`
- Test: `tests/astryx-import-resolution.test.ts`
- Test: `tests/e2e/appearance-foundation.spec.ts`
- Test: `tests/e2e/appearance-state-preservation.spec.ts`

**Interfaces:**
- Consumes: Task 3 desired/committed state, `neutralTheme`, `currentCompatibilityTheme`, and base-path-safe Next links.
- Produces: stable provider ancestry, exactly one Theme/Layer/Link provider, lazy Astryx view slots, renderer readiness/recovery, and explicit preservation of route/shell/workflow state.

- [ ] **Step 1: Write RED architecture and state-preservation tests**

The source contract forbids conditional renderer roots around `children` and compiles the exact installed imports. The browser tests must:

- save Astryx before navigation and prove the first client render/hydration is shadcn, then the app is hidden only while registered Astryx slots load, then Astryx commits without console hydration errors;
- assert exactly one root Theme wrapper plus the separately synchronized `html[data-astryx-theme="neutral"]` marker (two matching attributes are expected), exactly one LayerProvider and one LinkProvider;
- type into the shell global query, open a shell overlay, create or edit a live dealer draft/cart value, set a page filter/pagination value, switch renderer, and assert every durable value survives; transient overlay may close with focus restored;
- inject a rejected lazy view import and a render error, then assert current shadcn view is visible and `html[data-renderer-pending]` is cleared within the watchdog bound.

- [ ] **Step 2: Run RED against a freshly built server**

```bash
npm run test:appearance
NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE=1 npm run build
NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE=1 npm run test:e2e:appearance -- tests/e2e/appearance-foundation.spec.ts tests/e2e/appearance-state-preservation.spec.ts --project=chromium
```

Expected: FAIL because stable infrastructure/view switching does not exist.

- [ ] **Step 3: Implement one stable provider root with verified 0.1.7 imports**

```tsx
import {LayerProvider} from "@astryxdesign/core/Layer";
import {LinkProvider} from "@astryxdesign/core/Link";
import {Theme} from "@astryxdesign/core/theme";
```

`StableRendererInfrastructure` is mounted once around the application for its entire lifetime. It always returns the same component ancestry and changes only `Theme` props between `currentCompatibilityTheme` and `neutralTheme`; it never returns `CurrentRoot` versus `AstryxRoot`. `Theme`, `LayerProvider`, and `LinkProvider component={Link}` each appear exactly once. Confirm import resolution with TypeScript against the installed declaration/export map—do not use string-only tests or `any`.

The compatibility theme is scoped to a `brp-current` theme name and must not change current component output. Neutral/current `Theme` prop changes are regression-tested for no descendant remount.

- [ ] **Step 4: Implement lazy view slots below stable controllers**

`RendererViewSwitch` accepts a current view and a module-top-level lazy/dynamic Astryx view. The calling page or shell controller owns all durable state above it. While the Astryx module suspends, only the current view is in the DOM. When the Astryx view commits it reports its stable slot ID ready; the provider barrier commits the semantic renderer after all registered shell/route slots are ready. `AstryxViewBoundary` reports import/render failure and restores current without changing ancestor types.

Do not pass route/layout `children` through alternative wrappers. In `AppShell`, first extract a stable controller/frame so `children` stay under the same `<main>` ancestry; only chrome view slots may switch. Preserve `DealerWorkflowProvider` and all route layout providers unchanged in the stable subtree.

- [ ] **Step 5: Run GREEN, inspect emitted lazy views, and commit**

```bash
npm run test:appearance
npm run test:dealer-state
npm run typecheck
NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE=1 npm run build
NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE=1 npm run test:e2e:appearance -- tests/e2e/appearance-foundation.spec.ts tests/e2e/appearance-state-preservation.spec.ts --project=chromium
rg -l 'data-astryx-theme|neutralTheme' .next/static/chunks .next/static/css
```

Expected: tests PASS; stable state survives both directions; at least one lazy Astryx view chunk and Neutral CSS asset are separately identifiable.

```bash
git add src/app/layout.tsx src/components/appearance src/components/shell/app-shell.tsx tests/appearance-renderer-contract.test.ts tests/astryx-import-resolution.test.ts tests/e2e/appearance-foundation.spec.ts tests/e2e/appearance-state-preservation.spec.ts
git commit -m "feat(appearance): add stable dual-renderer infrastructure"
```

---

### Task 5: Add admin appearance settings and the semantic BRP facade

**Files:**
- Create: `src/components/brp-ui/contracts.ts`
- Create: `src/components/brp-ui/brp-ui-provider.tsx`
- Create: `src/components/brp-ui/current-adapter.tsx`
- Create: `src/components/brp-ui/astryx-adapter.tsx`
- Create: `src/components/brp-ui/index.ts`
- Create: `src/components/appearance/appearance-settings-section.tsx`
- Create: `src/components/appearance/current-appearance-settings-view.tsx`
- Create: `src/components/appearance/astryx-appearance-settings-view.tsx`
- Create: `src/components/appearance/appearance-settings.module.css`
- Modify: `src/components/admin/admin-settings-page.tsx`
- Modify: `src/components/admin/admin-settings.module.css`
- Modify: `src/lib/admin-settings-data.ts`
- Test: `tests/appearance-facade-contract.test.ts`
- Test: `tests/e2e/appearance-settings.spec.ts`

**Interfaces:**
- Consumes: renderer selection and appearance context.
- Produces: stable semantic facade families `BrpButton`, `BrpIconButton`, `BrpTextInput`, `BrpSelect`, `BrpSwitch`, `BrpTabs`, `BrpSegmentedControl`, `BrpToolbar`, `BrpCard`, `BrpBadge`, `BrpStatusDot`, `BrpTable`, `BrpDialog`, `BrpAlertDialog`, `BrpMoreMenu`, `BrpPopover`, `BrpEmptyState`, `BrpSkeleton`; admin `Оформлення` editor.

- [ ] **Step 1: Write failing facade and editor tests**

The facade contract test compiles controlled-prop examples for both adapters and asserts no `xstyle`, current CSS class name, or raw Astryx prop leaks through `contracts.ts`. The Playwright test logs in as admin, opens `/admin/settings`, and verifies:

```ts
await expect(page.getByRole("heading", {name: "Оформлення"})).toBeVisible();
await expect(page.getByRole("radio", {name: /shadcn\/ui/})).toBeChecked();
await page.getByRole("radio", {name: /Astryx Neutral/}).check();
await expect(page.locator("html")).toHaveAttribute("data-design-system", "astryx");
await page.getByRole("radio", {name: "Темна"}).check();
await expect(page.locator("html")).toHaveAttribute("data-resolved-theme", "dark");
await page.reload();
await expect(page.getByRole("radio", {name: /Astryx Neutral/})).toBeChecked();
await page.getByRole("radio", {name: /shadcn\/ui/}).check();
await expect(page.locator("html")).toHaveAttribute("data-design-system", "shadcn");
```

Add a forced repository write failure case asserting the prior choice stays selected and an accessible error appears.

- [ ] **Step 2: Run RED**

Run: `npm run test:appearance && npm run test:e2e:appearance -- tests/e2e/appearance-settings.spec.ts --project=chromium`

Expected: FAIL because the facade and `Оформлення` section do not exist.

- [ ] **Step 3: Implement renderer-neutral facade contracts**

Facade props must be behavior-oriented. For example:

```ts
export interface BrpButtonProps {
  label: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  busy?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  type?: "button" | "submit";
  ariaLabel?: string;
}

export interface BrpTextInputProps {
  label: string;
  value: string;
  onValueChange(value: string): void;
  placeholder?: string;
  type?: "text" | "search" | "password" | "email";
  error?: string;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  trailingAction?: React.ReactNode;
}
```

`BrpUiProvider` selects one adapter from AppearanceContext. Every adapter returns actual renderer primitives. `CurrentAdapter` may compose existing current components; `AstryxAdapter` must import actual Astryx controls. Domain visuals (timeline, chart, diagram, permission applicability) consume tokens but remain custom.

- [ ] **Step 4: Add `Оформлення` first and searchable**

Extend `SettingsSectionId` with `"appearance"` before `"workers"`. The section renders two equal SelectableCard/radio choices and a separate three-way SegmentedControl/radio group. Current choice label may show `Поточна`; no demo/mockup copy. Keep workers, queue, database, and all disabled semantics unchanged.

- [ ] **Step 5: Run GREEN and commit**

Run:

```bash
npm run test:appearance
npm run test:e2e:appearance -- tests/e2e/appearance-settings.spec.ts --project=chromium
npm run typecheck
```

```bash
git add src/components/brp-ui src/components/appearance src/components/admin/admin-settings-page.tsx src/components/admin/admin-settings.module.css src/lib/admin-settings-data.ts tests/appearance-facade-contract.test.ts tests/e2e/appearance-settings.spec.ts
git commit -m "feat(settings): add global appearance controls"
```

---

### Task 6: Split and migrate shared shell, authentication, login, offline, and overlays

**Files:**
- Create: `src/components/shell/app-shell-controller.ts`
- Create: `src/components/shell/current-app-shell-view.tsx`
- Create: `src/components/shell/astryx-app-shell-view.tsx`
- Create: `src/components/shell/astryx-shell.css.ts`
- Modify: `src/components/shell/app-shell.tsx`
- Modify: `src/components/shell/global-parts-search.tsx`
- Modify: `src/components/shell/login-screen.tsx`
- Modify: `src/components/shell/nav-data.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/offline/page.tsx`
- Modify: `src/app/offline/offline.module.css`
- Test: `tests/e2e/appearance-shell.spec.ts`
- Test: `tests/e2e/astryx-overlays.spec.ts`

**Interfaces:**
- Consumes: stable `AppShell({role,children})` public API, shared store/workflow providers, BRP facade.
- Produces: controller state above renderer views, byte-equivalent current shell, real Astryx AppShell/TopNav/SideNav composition, renderer-safe global search/cart/profile/language/mobile navigation.

- [ ] **Step 1: Write RED shell-state and accessibility tests**

Cover admin and dealer login, grouped navigation, selected route, global query, cart count, mobile nav, profile/logout, theme action, focus containment, Escape close, focus return, route-change close, and state preservation across renderer switch. Assert exactly one `[data-brp-shell-renderer]` and exactly one dialog after switching.

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e:appearance -- tests/e2e/appearance-shell.spec.ts tests/e2e/astryx-overlays.spec.ts --project=chromium`

Expected: FAIL because the Astryx shell and stable controller/view boundary are absent.

- [ ] **Step 3: Extract controller without changing current markup**

Move all `AppShell` state, callbacks, router commands, identity derivation, nav data, focus-return refs, and overlay-open flags into `useAppShellController(role)`. Keep `DemoStoreProvider` and `DealerWorkflowProvider` above `AppShell`; keep route children under a stable keyed-free content boundary. Move existing JSX verbatim to `CurrentAppShellView` before changing behavior.

- [ ] **Step 4: Implement Astryx shell with verified primitives**

Use MCP-verified `AppShell`, navigation, Button/IconButton, TextInput, Dialog/Popover/Menu, Badge, and layout components. Use one provider root from Task 4. Build the dealer cart as Astryx `Dialog` or a documented custom side-panel composition, never an invented Drawer. Wire the same controller callbacks and refs. Login and offline render in both systems and preserve their current authorization behavior.

- [ ] **Step 5: Run GREEN, regress current shell, and commit**

Run:

```bash
npm run test:e2e:appearance -- tests/e2e/appearance-shell.spec.ts tests/e2e/astryx-overlays.spec.ts --project=chromium
npm run test:e2e:dealer
npm run test:e2e:mobile
npm run typecheck
```

```bash
git add src/components/shell src/app/login src/app/offline tests/e2e/appearance-shell.spec.ts tests/e2e/astryx-overlays.spec.ts
git commit -m "feat(shell): add complete Astryx application chrome"
```

---

### Task 7: Migrate admin overview, pipeline, and order detail through shared controllers

**Files:**
- Modify: `src/components/admin/admin-overview.tsx`
- Modify: `src/components/admin/admin-order-pipeline.tsx`
- Modify: `src/components/admin/admin-order-detail.tsx`
- Modify: `src/components/admin/admin-ui.tsx`
- Modify: `src/components/admin/admin.module.css`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/order-pipeline/page.tsx`
- Modify: `src/app/admin/orders/[id]/page.tsx`
- Modify: `src/app/admin/order-detail/page.tsx`
- Test: `tests/e2e/appearance-admin-orders.spec.ts`

**Interfaces:**
- Consumes: BRP facade and shell. Produces renderer-neutral order view models/controllers with current and Astryx views.

- [ ] **Step 1: Write RED route-behavior matrix**

For `/admin`, `/admin/order-pipeline`, every generated `/admin/orders/[id]`, and `/admin/order-detail?id=…`, test shadcn light/dark and Astryx light/dark. Preserve search, period/filter disclosure, list/kanban, expanded groups, pagination, order links, query compatibility, status/actions, and disabled reasons. Switch renderer with an edited search query and expanded group; assert both remain.

- [ ] **Step 2: Run RED**

Run: `npm run test:e2e:appearance -- tests/e2e/appearance-admin-orders.spec.ts --project=chromium`

Expected: Astryx cases FAIL because the pages still expose current native/shared controls.

- [ ] **Step 3: Lift state and render both views without duplicating logic**

Each page exports one controller component that owns hooks and produces a typed view model. Select only the view beneath that controller:

```tsx
const appearance = useAppearance();
const model = useAdminOrderPipelineController();
return appearance.preference.designSystem === "astryx"
  ? <AstryxAdminOrderPipelineView model={model} />
  : <CurrentAdminOrderPipelineView model={model} />;
```

Use Astryx Tabs/SegmentedControl, TextInput, Button/IconButton, Badge/StatusDot, Card, Table/List, Banner, Popover/Menu, Pagination, and Dialog where applicable. Keep status-strip and order-card domain visuals custom but token-driven.

- [ ] **Step 4: Run GREEN and commit**

Run:

```bash
npm run test:e2e:appearance -- tests/e2e/appearance-admin-orders.spec.ts tests/e2e/admin-mobile-contract.spec.ts --project=chromium
npm run typecheck
```

```bash
git add src/components/admin src/app/admin tests/e2e/appearance-admin-orders.spec.ts
git commit -m "feat(admin): migrate dashboard and order workflow to Astryx"
```

---

### Task 8: Migrate admin supplier orders, consignment, returns, and air freight

**Files:** `admin-supplier-orders-page.tsx`, `admin-consignment-page.tsx`, `admin-returns-page.tsx`, `admin-air-freight-page.tsx`, their CSS modules, and `tests/e2e/appearance-admin-procurement.spec.ts`.

- [ ] Write RED four-mode tests for full-width search/right filter, tabs/statuses, consignment matrix scroll/sticky/mobile cards, return commands, Air Freight workflow/status strip, and exact locked reasons. Switch with active filters and assert controller state survives.
- [ ] Freshly build, observe Astryx RED, then split each page into a stable controller plus Current/Astryx views. Use real Astryx toolbar/input/select/tabs/cards/table/banner primitives; keep the consignment matrix and freight workflow custom/token-driven.
- [ ] Run the focused suite, relevant admin mobile suite, typecheck, current screenshot diff, reviewer, then commit `feat(admin): migrate procurement logistics to Astryx`.

---

### Task 9: Migrate admin ocean freight, unit shipping, warehouse, and settlements

**Files:** `admin-ocean-freight-page.tsx`, `admin-ocean-detail.tsx`, `admin-unit-shipping-page.tsx`, `admin-warehouse-page.tsx`, `admin-settlements-page.tsx`, associated CSS, and `tests/e2e/appearance-admin-fulfillment.spec.ts`.

- [ ] Write RED four-mode tests for BL grouping/detail/ETA, unit date/type/model filters, warehouse selectors/scanning/kanban, settlement disclosure/search, responsive cards/tables, and disabled reasons. Preserve state across switching.
- [ ] Implement stable controllers and real Astryx views. Keep freight hierarchy, scanner, kanban, and financial disclosure as custom domain compositions with Astryx tokens; never unlock a backend action.
- [ ] Run focused + warehouse/mobile regressions, dealer-state, typecheck, screenshot diff, reviewer, then commit `feat(admin): migrate fulfillment and settlements to Astryx`.

---

### Task 10: Migrate admin invoices, catalog, schedule, and analytics

**Files:** `admin-invoices-page.tsx`, `admin-catalog-page.tsx`, `admin-schedule-page.tsx`, `admin-analytics-page.tsx`, `admin-schedule.module.css`, related route files, and `tests/e2e/appearance-admin-data.spec.ts`.

- [ ] Write RED at 390/768/1280 in four modes for invoice tabs/actions/search, catalog sticky/resizable columns and pricing filters, schedule timeline/timeframe/persisted collapse, and analytics charts/filters.
- [ ] Lift all durable state above view branches. Use Astryx controls/layout/table where applicable; retain table resizing, timeline, and chart renderers as custom token-driven domain views.
- [ ] Run focused + admin mobile regression, typecheck, screenshot diff, reviewer, then commit `feat(admin): migrate documents catalog and analytics to Astryx`.

---

### Task 11: Migrate admin reports, performance, and BossWeb lookup

**Files:** `admin-parts-report-page.tsx`, `admin-performance-page.tsx`, `admin-bossweb-lookup-page.tsx`, associated CSS, and `tests/e2e/appearance-admin-tools.spec.ts`.

- [ ] Write RED four-mode tests for report/search/filter/export, performance diagnostics, BossWeb lookup/results/errors, responsive behavior, and locked command semantics.
- [ ] Implement stable controllers and real Astryx search, filter, table/list, empty/error/status and action primitives without changing adapters or source evidence.
- [ ] Run focused suite, typecheck, current screenshot diff, reviewer, then commit `feat(admin): migrate reporting tools to Astryx`.

---

### Task 12: Migrate admin companies, dealer access, users, permissions, and tasks

**Files:** `admin-companies-page.tsx`, `admin-dealer-access-page.tsx`, `admin-users-page.tsx`, `admin-permissions-page.tsx`, `admin-permission-matrix.tsx`, `admin-tasks-page.tsx`, associated CSS, and `tests/e2e/appearance-admin-governance.spec.ts`.

- [ ] Write RED desktop/mobile four-mode tests for compact search/filter, company/user actions, company selection, team table, role/bulk controls, permission applicability/disabled cells, task filters/actions, and state preservation.
- [ ] Implement stable controllers and authentic Astryx controls/cards/tables/dialogs. Keep dense permission matrices custom and retain every applicability/authorization boundary.
- [ ] Run focused + admin mobile/accessibility regressions, typecheck, screenshot diff, reviewer, then commit `feat(admin): migrate people and access governance to Astryx`.

---

### Task 13: Migrate admin integrations, mappings, diagnostics, and appearance settings

**Files:** `admin-integrations-page.tsx`, `admin-settings-page.tsx`, integration/settings CSS, nested `/admin/integrations/**` and `/admin/settlements/mapping` route files, appearance settings views, and `tests/e2e/appearance-admin-integrations.spec.ts`.

- [ ] Write RED for integrations list/detail/1C/unit mapping/BossWeb/settlement mapping and `/admin/settings` in all four modes. Verify appearance choices themselves work from both renderers while diagnostics keep current disabled semantics.
- [ ] Implement stable controllers and actual Astryx forms/tables/status/dialog/segmented controls. Do not duplicate the appearance repository or expose the setting in dealer UI.
- [ ] Run focused suite, typecheck, cross-tab appearance test, screenshot diff, reviewer, then commit `feat(admin): migrate integrations and appearance settings to Astryx`.

---

### Task 14: Migrate dealer dashboard and the complete parts/accessory catalog cascade

**Files:** `dealer-dashboard.tsx`, `catalog-router.tsx`, `diagram-viewer.tsx`, catalog CSS/routes, and `tests/e2e/appearance-dealer-catalog.spec.ts`.

- [ ] Write RED for `/`, every generated catalog route, brand/model/category facets, independent cascade columns, URL/back state, diagram hotspots/parts search, mobile behavior, and renderer switch mid-cascade.
- [ ] Keep `DealerWorkflowProvider` and catalog controller stable. Implement Astryx selectors/navigation/cards/tables/toolbars around the custom diagram/cascade; do not replace custom SVG/hit targets or alter URL contracts.
- [ ] Run focused + dealer/Pages/state regressions, typecheck, screenshot diff, reviewer, then commit `feat(dealer): migrate dashboard and catalog to Astryx`.

---

### Task 15: Migrate dealer cart, orders, detail, and confirmation lifecycle

**Files:** `cart-page.tsx`, `order-confirmation-page.tsx`, `dealer-orders.tsx`, relevant route files/CSS, and `tests/e2e/appearance-dealer-orders.spec.ts`.

- [ ] Write RED for quantity/form validation, create-order command, all generated ID/code/query routes, filtering/detail/confirmation, reload persistence, locked boundaries, and switching mid-cart/mid-order edit.
- [ ] Lift durable cart/order/form/filter/modal state above renderer views. Use real Astryx inputs/buttons/cards/table/dialog/status/empty state and the same workflow commands/storage keys.
- [ ] Run focused + dealer-state + dealer Pages regressions, typecheck, screenshot diff, reviewer, then commit `feat(dealer): migrate order lifecycle to Astryx`.

---

### Task 16: Migrate dealer accessories, units, schedule, BossWeb, and workshop

**Files:** `dealer-data-toolbar.tsx`, `features/accessories-page.tsx`, `units-page.tsx`, `schedule-page.tsx`, `bossweb-page.tsx`, `workshop-page.tsx`, feature CSS/routes, and `tests/e2e/appearance-dealer-service.spec.ts`.

- [ ] Write RED for full-width search/right filter, brand/model/category facets, unit workflows, schedule, BossWeb results, workshop search/filter/status commands, mobile density, state preservation, and exact locked reasons. Do not invent drag-and-drop beyond verified existing behavior.
- [ ] Make `DealerDataToolbar` a renderer-neutral controller seam and implement actual Astryx input/icon-filter/popover/select/segmented/card/table/dialog primitives.
- [ ] Run focused + dealer-state + mobile/Pages regressions, typecheck, screenshot diff, reviewer, then commit `feat(dealer): migrate service operations to Astryx`.

---

### Task 17: Migrate dealer documents, drafts, consignment, settlements, and inventory

**Files:** `order-drafts-page.tsx`, document/consignment/settlement/inventory components in `features/secondary-data-pages.tsx` and related files, CSS/routes, and `tests/e2e/appearance-dealer-data.spec.ts`.

- [ ] Write RED for documents new-count/search/type/status/export/info, draft creation/search/filter/export/info, consignment, settlements with added search, parts stock search/filter, empty/error/loading states, and switching with active inputs.
- [ ] Split controllers/views; use real Astryx controls and tables/cards while keeping existing local-adapter commands and locked reasons.
- [ ] Run focused + dealer-state/Pages regressions, typecheck, screenshot diff, reviewer, then commit `feat(dealer): migrate dealer data workflows to Astryx`.

---

### Task 18: Migrate dealer network, customers, team/access, and parts reporting

**Files:** `dealer-customers.tsx`, `team-access.tsx`, `locked-operation.tsx`, network/parts-report feature files, related routes/CSS, and `tests/e2e/appearance-dealer-network.spec.ts`.

- [ ] Write RED for network/customer search and filters, customer create/edit boundaries, team profiles/permissions, locked-operation explanations, parts-report workflow/export, desktop/mobile accessibility, and state preservation.
- [ ] Implement stable controllers and real Astryx search/filter/card/table/dialog/switch/permission primitives; retain all authorization/applicability semantics.
- [ ] Run focused + dealer/state/Pages regressions, typecheck, screenshot diff, reviewer, then commit `feat(dealer): migrate network and access workflows to Astryx`.

---

### Task 19: Add checked route inventory and complete renderer/mode/browser accessibility matrix

**Files:**
- Create: `src/lib/appearance/route-inventory.ts`
- Create: `tests/appearance-route-inventory.test.ts`
- Create: `tests/e2e/route-renderer-matrix.spec.ts`
- Create: `tests/e2e/real-device-smoke.spec.ts`
- Create: `playwright.real-devices.config.ts`
- Create: `scripts/run-real-device-matrix.mjs`
- Create: `docs/research/astryx-real-device-certification.md`
- Modify: `playwright.config.ts`
- Modify: `playwright.dealer.config.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: every static route and `generateStaticParams` fixture.
- Produces: one checked route row per admin/dealer/query-compatible output, four renderer/mode cases per row, desktop/mobile/tablet/WebKit/Firefox projects, a required real-browser/device certification through BrowserStack Automate (or explicitly recorded equivalent physical devices), and scripts `test:e2e:appearance`, `test:e2e:appearance:matrix`, and `test:e2e:appearance:real-devices`.

- [ ] **Step 1: Write RED inventory completeness test**

Build an explicit typed inventory with `path`, `role`, `kind`, `specialBehaviors`, and `viewports`. The test scans `src/app/**/page.tsx`, imports generated fixture lists where possible, and fails if any literal page or generated param output lacks exactly one inventory row. Include all admin nested routes, all ten catalog outputs, every order ID/code, and query compatibility routes.

- [ ] **Step 2: Run RED**

Run: `npx tsx --test tests/appearance-route-inventory.test.ts`

Expected: FAIL until every route is enumerated.

- [ ] **Step 3: Implement matrix and browser projects**

Add Chromium 1280/1440, Firefox desktop, WebKit desktop, Chromium 390×844, WebKit 390×844, and Chromium tablet 768 projects. For each inventory row, seed the required role and appearance before navigation, assert no error boundary/hydration warning, one renderer, accessible page heading, working keyboard focus, no horizontal page overflow except explicitly tagged dense scrollers, and screenshot stable regions. Add overlay Escape/focus-return checks and reduced-motion/color-scheme coverage.

In addition, add a real-device smoke matrix using BrowserStack Automate + BrowserStack Local credentials (`BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY`) or a documented equivalent physical-device run. `scripts/run-real-device-matrix.mjs` must first build the exact checked-out candidate SHA in production mode, write/serve a matching provenance endpoint, start a non-reused local production server, open a uniquely identified BrowserStack Local tunnel to that server, and reject a session whose reported SHA differs. This provides a pre-merge candidate URL without depending on post-merge GitHub Pages. The required matrix is current stable Chrome, Edge, and Firefox desktop; Safari on macOS; iOS Safari on a current iPhone profile; and Android Chrome on a current Pixel/Samsung profile. Exercise shared shell/navigation, appearance settings and round-trip switching, one dense admin page, dealer catalog/order flow, dialog/menu/popover focus and Escape/return behavior, Tier-2 overlay fallback, refresh/deep link, and both light/dark Astryx modes. Record exact OS/browser/device versions, tunnel/build SHA, date, results, and evidence links in `docs/research/astryx-real-device-certification.md`. Missing credentials/evidence or mismatched provenance is a release blocker, not a skipped green check.

- [ ] **Step 4: Run GREEN and commit**

Run:

```bash
npm run test:appearance
npm run test:e2e:appearance
npm run test:e2e:appearance:matrix
npm run test:e2e:appearance:real-devices
```

```bash
git add src/lib/appearance/route-inventory.ts tests/appearance-route-inventory.test.ts tests/e2e/route-renderer-matrix.spec.ts tests/e2e/real-device-smoke.spec.ts playwright*.config.ts scripts/run-real-device-matrix.mjs docs/research/astryx-real-device-certification.md package.json .github/workflows/ci.yml
git commit -m "test(appearance): certify every route and renderer"
```

---

### Task 20: Certify GitHub Pages, offline/PWA assets, fonts, and stale-chunk recovery

**Files:**
- Modify: `scripts/generate-pwa.mjs`
- Modify: `scripts/validate-pwa.mjs`
- Create: `scripts/serve-appearance-pages.mjs`
- Create: `scripts/test-appearance-pages.mjs`
- Create: `playwright.appearance-pages.config.ts`
- Create: `tests/e2e/pwa-appearance.spec.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Pages export at `/brp-demo`, emitted Astryx/Neutral assets, local Figtree Latin/Latin-Extended assets, the local Inter Cyrillic fallback, and the Workbox service worker.
- Produces: deterministic validation that both renderers work after install, offline launch, update, and fallback; no admin/dealer HTML/RSC precache regression.

`scripts/test-appearance-pages.mjs` must always run a fresh `build:pages`, write a unique provenance token inside `out/`, and invoke `playwright.appearance-pages.config.ts` with that token. The config uses `baseURL=http://127.0.0.1:4174/brp-demo`, starts `scripts/serve-appearance-pages.mjs` with `reuseExistingServer: false`, requires the matching provenance before serving, and waits on an exported `/brp-demo/offline/` readiness URL. It must not attach to the production Next server or a stale `out/` directory.

- [ ] **Step 1: Write RED PWA asset and browser tests**

Extend validator assertions to find emitted Neutral CSS, Astryx runtime JS, Figtree Latin/Latin-Extended font assets, and the Inter Cyrillic fallback by manifest/content relationship rather than assumed chunk names. Assert each is precached under `/brp-demo`, navigation stays `NetworkOnly`, and only the offline HTML fallback is precached. Browser test saves Astryx, reloads offline, verifies installed-style navigation, simulates stale/rejected Astryx chunk and sees current shadcn fallback, returns online, receives update, and switches back.

- [ ] **Step 2: Run RED**

Run:

```bash
npm run build:pages
npm run test:e2e:appearance:pages -- --project=chromium
```

Expected: FAIL because validator/browser suite does not yet certify Astryx and Figtree assets.

- [ ] **Step 3: Implement Pages-safe asset discovery and recovery coverage**

Keep Workbox navigation strategy unchanged. Discover generated CSS/JS/fonts from `out/_next/static` and generated manifests, assert their `/brp-demo` URLs are in precache, and keep route HTML/RSC exclusions. Ensure renderer watchdog/error boundary is compatible with an old SW cache and clears the canonical `html[data-renderer-pending]` marker without mutating route/workflow state.

- [ ] **Step 4: Run GREEN and commit**

Run:

```bash
npm run build:pages
npm run test:e2e:dealer-pages
npm run test:e2e:appearance:pages -- --project=chromium
```

```bash
git add scripts/generate-pwa.mjs scripts/validate-pwa.mjs scripts/serve-appearance-pages.mjs scripts/test-appearance-pages.mjs playwright.appearance-pages.config.ts tests/e2e/pwa-appearance.spec.ts package.json .github/workflows/ci.yml
git commit -m "test(pwa): certify dual renderer Pages delivery"
```

---

### Task 21: Final regression, visual audit, review, PR, merge, and Pages verification

**Files:**
- Modify only files required by review findings.
- Update: `.superpowers/sdd/progress.md` as the durable task ledger (git-ignored).

**Interfaces:**
- Consumes: all prior tasks. Produces: review-clean branch, merged PR, green Pages deployment, and verified production URLs in both renderers/modes.

- [ ] **Step 1: Run the complete local gate**

```bash
npm run lint -- --quiet
npm run typecheck
npm run test:dealer-state
npm run test:appearance
npm run test:e2e:dealer
npm run test:e2e:mobile
npm run test:e2e:appearance
npm run test:e2e:appearance:matrix
npm run test:e2e:appearance:real-devices
npm run build
npm run build:pages
npm run test:e2e:dealer-pages
npm run test:e2e:appearance:pages
```

Expected: every command exits `0`, no hydration/runtime console errors, no unapproved screenshot differences.

- [ ] **Step 2: Run mechanical and visual audits**

```bash
rg -n 'demo|mockup|clone|temporary frontend|local implementation' src --glob '!**/*.test.*'
rg -n 'brp-clone-theme|document\.documentElement\.classList\.toggle\("dark"' src
rg -n '<(button|input|select|textarea|table)\b' src/components --glob '*.tsx'
rg -n 'data-design-system|data-astryx-theme|data-renderer-pending' src
git diff --check
```

Classify every native interactive match as current-renderer-only, documented custom domain exception, or defect; replace defects with the facade/Astryx primitive. Capture and inspect 390, 768, 1280, and 1440 screenshots for shared shell, settings, dense admin matrices, catalog cascade/diagram, dealer toolbars, timeline/charts, overlays, login and offline in all four renderer/mode combinations.

- [ ] **Step 3: Request broad Sol review and fix all Critical/Important findings**

Generate a review package from `git merge-base main HEAD` to `HEAD`. Give the reviewer the approved spec, plan, progress ledger, full diff package, and focused test evidence. Dispatch one fix agent for the complete final findings list, rerun covering tests, regenerate the package, and re-review until both spec compliance and code quality are approved.

- [ ] **Step 4: Commit final fixes**

```bash
git add -A
git commit -m "fix(appearance): close dual renderer audit findings"
```

Skip the commit only when there are no final fixes and the worktree is clean.

- [ ] **Step 5: Push, open PR, babysit checks, merge, and verify Pages**

```bash
git push -u origin codex/astryx-dual-design-system
gh pr create --base main --head codex/astryx-dual-design-system --title "feat: add shadcn and Astryx Neutral themes" --body-file <generated-pr-body>
```

Watch all PR checks, resolve review feedback, merge only when green, then watch the GitHub Pages workflow. On `https://razumv.github.io/brp-demo/`, verify admin settings can select Astryx and return to shadcn, dealer routes inherit it, system/light/dark persist, refresh/deep links work, offline launch works, and no demo/mockup copy or falsely enabled operation appears. The merge is blocked until the real-browser/device certification record contains successful Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome evidence for the exact candidate SHA served through the provenance-checked pre-merge tunnel. After Pages deploys that SHA, rerun a deployed-URL Chrome + iOS Safari smoke; any failure triggers an immediate revert PR and blocks declaring the goal complete.

## Plan Self-Review Record

- **Spec coverage:** Tasks 0–6 cover the frozen baseline, packages, CLI source/build, CSS isolation, repository/bootstrap/provider, failure recovery, facade, settings, shell/login/offline; Tasks 7–13 cover every admin surface; Tasks 14–18 cover every dealer surface; Tasks 19–21 cover route inventory, emulated and real-device browser/a11y/visual matrices, production/Pages/PWA proof, review, merge, and deployed verification.
- **Placeholder scan:** The plan intentionally contains no `TBD`, `TODO`, “implement later”, “similar to”, or unspecified error-handling steps. Astryx API uncertainty is resolved explicitly through installed declarations/MCP before implementation rather than guessed.
- **Type consistency:** `AppearancePreferenceV1`, repository/snapshot/context signatures, root marker names, scripts, provider ownership, storage key, and renderer values are identical across all tasks and the approved design.
- **Execution mode:** Product owner already approved implementation; execute continuously with `superpowers:subagent-driven-development`, one write-capable implementer at a time, task-scoped review after each, and a final Sol whole-branch review.
