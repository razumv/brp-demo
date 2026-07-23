import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import test from "node:test";
import {
  APPEARANCE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
} from "../src/lib/appearance";
import {getAppearanceBootstrapSource} from "../src/lib/appearance/bootstrap-source";

type TimeoutCallback = () => void;

function plain(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function createHtmlRoot() {
  const classes = new Set<string>();
  const dataset: Record<string, string> = {
    colorMode: "light",
    designSystem: "shadcn",
    resolvedTheme: "light",
  };

  return {
    classList: {
      contains(value: string) {
        return classes.has(value);
      },
      toggle(value: string, force?: boolean) {
        const shouldAdd = force ?? !classes.has(value);
        if (shouldAdd) classes.add(value);
        else classes.delete(value);
        return shouldAdd;
      },
    },
    dataset,
    removeAttribute(name: string) {
      const key = name.replace(/^data-/, "").replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      delete dataset[key];
    },
  };
}

function createBootstrapHarness(options: {
  initial?: Readonly<Record<string, string>>;
  prefersDark?: boolean;
  throwOnGet?: boolean;
  throwOnSet?: boolean;
  previousWatchdog?: number;
} = {}) {
  const values = new Map(Object.entries(options.initial ?? {}));
  const html = createHtmlRoot();
  const timers = new Map<number, TimeoutCallback>();
  const clearedTimers: number[] = [];
  let nextTimer = 1;

  if (options.previousWatchdog !== undefined) {
    timers.set(options.previousWatchdog, () => undefined);
    nextTimer = Math.max(nextTimer, options.previousWatchdog + 1);
  }

  const context: Record<string, unknown> = {
    Date: {now: () => 1_725_000_000_000},
    JSON,
    clearTimeout(handle: number) {
      clearedTimers.push(handle);
      timers.delete(handle);
    },
    document: {documentElement: html},
    localStorage: {
      getItem(key: string) {
        if (options.throwOnGet) throw new Error("storage blocked");
        return values.get(key) ?? null;
      },
      removeItem(key: string) {
        values.delete(key);
      },
      setItem(key: string, value: string) {
        if (options.throwOnSet) throw new Error("storage blocked");
        values.set(key, value);
      },
    },
    matchMedia(query: string) {
      assert.equal(query, "(prefers-color-scheme: dark)");
      return {matches: options.prefersDark ?? false};
    },
    setTimeout(callback: TimeoutCallback, delay: number) {
      assert.equal(delay, 15_000);
      const handle = nextTimer++;
      timers.set(handle, callback);
      return handle;
    },
  };
  context.window = context;
  if (options.previousWatchdog !== undefined) {
    context.__BRP_ASTRYX_WATCHDOG__ = options.previousWatchdog;
  }

  return {
    clearedTimers,
    context,
    html,
    runBootstrap() {
      vm.runInNewContext(getAppearanceBootstrapSource(), context);
    },
    runWatchdog() {
      const pending = [...timers.values()];
      timers.clear();
      for (const callback of pending) callback();
    },
    stored(key: string) {
      return values.get(key) ?? null;
    },
    timerCount() {
      return timers.size;
    },
  };
}

test("bootstrap source is inline-script safe and dependency-free", () => {
  const source = getAppearanceBootstrapSource();

  assert.doesNotMatch(source, /<\/script/i);
  assert.equal(source.includes("\u2028"), false);
  assert.equal(source.includes("\u2029"), false);
  assert.doesNotMatch(source, /getElementById|querySelector|document\.body/);
});

test("saved Astryx system preference owns only html markers before paint", () => {
  const preference = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  const harness = createBootstrapHarness({
    initial: {
      [APPEARANCE_STORAGE_KEY]: JSON.stringify(preference),
      [LEGACY_THEME_STORAGE_KEY]: "light",
    },
    prefersDark: true,
  });

  harness.runBootstrap();

  assert.deepEqual({...harness.html.dataset}, {
    astryxTheme: "neutral",
    colorMode: "system",
    designSystem: "astryx",
    rendererPending: "true",
    resolvedTheme: "dark",
  });
  assert.equal(harness.html.classList.contains("dark"), true);
  assert.equal(harness.timerCount(), 1);
  assert.deepEqual(plain(harness.context.__BRP_APPEARANCE_BOOTSTRAP__), preference);
  assert.equal(harness.stored(LEGACY_THEME_STORAGE_KEY), "light");
});

test("an explicit Astryx mode seeds exact Neutral theme markers", () => {
  const preference = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
  const harness = createBootstrapHarness({
    initial: {[APPEARANCE_STORAGE_KEY]: JSON.stringify(preference)},
  });

  harness.runBootstrap();

  assert.equal(harness.html.dataset.theme, "dark");
  assert.equal(harness.html.dataset.astryxTheme, "neutral");
  assert.equal(harness.html.dataset.rendererPending, "true");
});

test("corrupt and future v1 records retain the visible shadcn light fallback", () => {
  for (const raw of ["not-json", JSON.stringify({version: 2, designSystem: "astryx", colorMode: "dark"})]) {
    const harness = createBootstrapHarness({
      initial: {
        [APPEARANCE_STORAGE_KEY]: raw,
        [LEGACY_THEME_STORAGE_KEY]: "dark",
      },
      prefersDark: true,
    });

    harness.runBootstrap();

    assert.deepEqual({...harness.html.dataset}, {
      colorMode: "light",
      designSystem: "shadcn",
      resolvedTheme: "light",
    });
    assert.equal(harness.html.classList.contains("dark"), false);
    assert.equal(harness.timerCount(), 0);
  }
});

test("legacy light or dark migrates only when v1 is absent and persistence succeeds", () => {
  const harness = createBootstrapHarness({
    initial: {[LEGACY_THEME_STORAGE_KEY]: "dark"},
  });

  harness.runBootstrap();

  const migrated = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  assert.deepEqual(plain(harness.context.__BRP_APPEARANCE_BOOTSTRAP__), migrated);
  assert.equal(harness.stored(APPEARANCE_STORAGE_KEY), JSON.stringify(migrated));
  assert.equal(harness.stored(LEGACY_THEME_STORAGE_KEY), null);
  assert.equal(harness.html.classList.contains("dark"), true);
});

test("blocked legacy migration and unavailable storage retain shadcn light", () => {
  const blockedWrite = createBootstrapHarness({
    initial: {[LEGACY_THEME_STORAGE_KEY]: "dark"},
    throwOnSet: true,
  });
  blockedWrite.runBootstrap();
  assert.deepEqual(plain(blockedWrite.context.__BRP_APPEARANCE_BOOTSTRAP__), {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
  assert.equal(blockedWrite.stored(LEGACY_THEME_STORAGE_KEY), "dark");
  assert.equal(blockedWrite.html.classList.contains("dark"), false);

  const blockedRead = createBootstrapHarness({throwOnGet: true, prefersDark: true});
  blockedRead.runBootstrap();
  assert.equal(blockedRead.html.dataset.designSystem, "shadcn");
  assert.equal(blockedRead.html.dataset.colorMode, "light");
  assert.equal(blockedRead.html.dataset.resolvedTheme, "light");
  assert.equal(blockedRead.timerCount(), 0);
});

test("cold Astryx gives supported browsers enough time before atomic recovery", () => {
  const harness = createBootstrapHarness({
    initial: {
      [APPEARANCE_STORAGE_KEY]: JSON.stringify({
        version: 1,
        designSystem: "astryx",
        colorMode: "dark",
      }),
    },
    previousWatchdog: 41,
  });

  harness.runBootstrap();
  assert.deepEqual(harness.clearedTimers, [41]);
  assert.equal(harness.timerCount(), 1);

  harness.runWatchdog();

  assert.deepEqual({...harness.html.dataset}, {
    colorMode: "light",
    designSystem: "shadcn",
    resolvedTheme: "light",
  });
  assert.equal(harness.html.classList.contains("dark"), false);
  assert.deepEqual(plain(harness.context.__BRP_APPEARANCE_DIAGNOSTIC__), {
    at: 1_725_000_000_000,
    code: "renderer-watchdog-timeout",
  });
  assert.doesNotThrow(() => JSON.stringify(harness.context.__BRP_APPEARANCE_DIAGNOSTIC__));
  assert.equal(harness.context.__BRP_ASTRYX_WATCHDOG__, undefined);
});

test("bootstrap and provider use the same non-aggressive Astryx readiness budget", () => {
  const provider = readFileSync("src/components/providers/appearance-provider.tsx", "utf8");

  assert.match(getAppearanceBootstrapSource(), /},15000\)/);
  assert.match(provider, /}, 15_000\);/);
});
