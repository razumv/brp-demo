import assert from "node:assert/strict";
import test from "node:test";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE_PREFERENCE,
  BrowserAppearancePreferencesRepository,
  LEGACY_THEME_STORAGE_KEY,
  migrateLegacyTheme,
  normalizeAppearancePreference,
  parseAppearancePreference,
  resolveColorMode,
} from "../src/lib/appearance";

type StorageEventLike = {
  key: string | null;
  newValue: string | null;
};

type RepositoryHarnessOptions = {
  throwOnRemove?: boolean;
  throwOnSet?: boolean;
};

function createRepositoryHarness(options: RepositoryHarnessOptions = {}) {
  const values = new Map<string, string>();
  const listeners = new Set<(event: StorageEventLike) => void>();
  let throwOnSet = options.throwOnSet ?? false;

  return {
    dependencies: {
      storage: {
        getItem(key: string) {
          return values.get(key) ?? null;
        },
        removeItem(key: string) {
          if (options.throwOnRemove) {
            throw new Error("remove failed");
          }
          values.delete(key);
        },
        setItem(key: string, value: string) {
          if (throwOnSet) {
            throw new Error("set failed");
          }
          values.set(key, value);
        },
      },
      addStorageListener(listener: (event: StorageEventLike) => void) {
        listeners.add(listener);
      },
      removeStorageListener(listener: (event: StorageEventLike) => void) {
        listeners.delete(listener);
      },
    },
    emitStorage(key: string | null, newValue: string | null) {
      for (const listener of listeners) {
        listener({key, newValue});
      }
    },
    get(key: string) {
      return values.get(key) ?? null;
    },
    listenerCount() {
      return listeners.size;
    },
    set(key: string, value: string) {
      values.set(key, value);
    },
    setThrowOnSet(value: boolean) {
      throwOnSet = value;
    },
  };
}

test("normalizes only the exact v1 design-system and mode union", () => {
  assert.deepEqual(
    normalizeAppearancePreference({
      version: 1,
      designSystem: "astryx",
      colorMode: "dark",
    }),
    {version: 1, designSystem: "astryx", colorMode: "dark"},
  );
  assert.equal(
    normalizeAppearancePreference({
      version: 2,
      designSystem: "astryx",
      colorMode: "dark",
    }),
    null,
  );
  assert.equal(
    normalizeAppearancePreference({
      version: 1,
      designSystem: "future",
      colorMode: "dark",
    }),
    null,
  );
  assert.equal(parseAppearancePreference("not-json"), null);
  assert.equal(parseAppearancePreference('{"version":2}'), null);
  assert.deepEqual(DEFAULT_APPEARANCE_PREFERENCE, {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
});

test("migrates only legacy light and dark values to shadcn", () => {
  assert.deepEqual(migrateLegacyTheme("dark"), {
    version: 1,
    designSystem: "shadcn",
    colorMode: "dark",
  });
  assert.deepEqual(migrateLegacyTheme("light"), {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
  assert.equal(migrateLegacyTheme("system"), null);
  assert.equal(resolveColorMode("system", true), "dark");
  assert.equal(resolveColorMode("system", false), "light");
});

test("read prefers a valid v1 preference over a legacy value", async () => {
  const harness = createRepositoryHarness();
  const current = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  harness.set(APPEARANCE_STORAGE_KEY, JSON.stringify(current));
  harness.set(LEGACY_THEME_STORAGE_KEY, "dark");

  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);

  assert.deepEqual(await repository.read(), current);
  assert.equal(harness.get(LEGACY_THEME_STORAGE_KEY), "dark");
});

test("read migrates a valid legacy theme only after v1 persistence succeeds", async () => {
  const harness = createRepositoryHarness();
  harness.set(LEGACY_THEME_STORAGE_KEY, "dark");
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);

  const migrated = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  assert.deepEqual(await repository.read(), migrated);
  assert.equal(harness.get(APPEARANCE_STORAGE_KEY), JSON.stringify(migrated));
  assert.equal(harness.get(LEGACY_THEME_STORAGE_KEY), null);
});

test("failed legacy migration preserves the legacy value and does not manufacture state", async () => {
  const harness = createRepositoryHarness({throwOnSet: true});
  harness.set(LEGACY_THEME_STORAGE_KEY, "dark");
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);

  await assert.rejects(repository.read());
  assert.equal(harness.get(APPEARANCE_STORAGE_KEY), null);
  assert.equal(harness.get(LEGACY_THEME_STORAGE_KEY), "dark");
});

test("legacy cleanup failure keeps the acknowledged v1 preference", async () => {
  const harness = createRepositoryHarness({throwOnRemove: true});
  harness.set(LEGACY_THEME_STORAGE_KEY, "light");
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);

  const migrated = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  assert.deepEqual(await repository.read(), migrated);
  assert.equal(harness.get(APPEARANCE_STORAGE_KEY), JSON.stringify(migrated));
  assert.equal(harness.get(LEGACY_THEME_STORAGE_KEY), "light");
});

test("acknowledged writes publish locally and valid storage events publish cross-tab", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const seen: unknown[] = [];
  const unsubscribe = repository.subscribe((preference) => seen.push(preference));
  const preference = {version: 1, designSystem: "astryx", colorMode: "system"} as const;

  await repository.write(preference);
  assert.deepEqual(await repository.read(), preference);
  assert.deepEqual(seen, [preference]);

  const fromOtherTab = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  harness.emitStorage(APPEARANCE_STORAGE_KEY, JSON.stringify(fromOtherTab));
  assert.deepEqual(seen.at(-1), fromOtherTab);

  unsubscribe();
});

test("storage subscriptions filter unrelated, removed, and invalid payloads", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const seen: unknown[] = [];
  const unsubscribe = repository.subscribe((preference) => seen.push(preference));

  harness.emitStorage("another-key", JSON.stringify({version: 1, designSystem: "astryx", colorMode: "dark"}));
  harness.emitStorage(APPEARANCE_STORAGE_KEY, null);
  harness.emitStorage(APPEARANCE_STORAGE_KEY, "not-json");
  harness.emitStorage(APPEARANCE_STORAGE_KEY, JSON.stringify({version: 2, designSystem: "astryx", colorMode: "dark"}));
  assert.deepEqual(seen, []);

  const valid = {version: 1, designSystem: "astryx", colorMode: "light"} as const;
  harness.emitStorage(APPEARANCE_STORAGE_KEY, JSON.stringify(valid));
  assert.deepEqual(seen, [valid]);

  unsubscribe();
  assert.equal(harness.listenerCount(), 0);
  harness.emitStorage(APPEARANCE_STORAGE_KEY, JSON.stringify({version: 1, designSystem: "shadcn", colorMode: "dark"}));
  assert.deepEqual(seen, [valid]);
});

test("invalid storage state retains an already acknowledged last-known-good preference", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const preference = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
  await repository.write(preference);

  harness.set(APPEARANCE_STORAGE_KEY, "not-json");
  harness.emitStorage(APPEARANCE_STORAGE_KEY, "not-json");

  assert.deepEqual(await repository.read(), preference);
});

test("failed writes keep the last-known-good preference and do not publish", async () => {
  const harness = createRepositoryHarness({throwOnSet: true});
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  let publications = 0;
  repository.subscribe(() => publications++);

  await assert.rejects(
    repository.write({version: 1, designSystem: "astryx", colorMode: "dark"}),
  );
  assert.equal(publications, 0);
  assert.equal(await repository.read(), null);
});

test("failed writes preserve an earlier acknowledged preference", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const initial = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  await repository.write(initial);
  harness.setThrowOnSet(true);

  await assert.rejects(
    repository.write({version: 1, designSystem: "astryx", colorMode: "dark"}),
  );

  assert.deepEqual(await repository.read(), initial);
});

test("a throwing local observer cannot reject an acknowledged write or block later observers", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const preference = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
  let observed: unknown = null;
  let persistedWhenObserved: string | null = null;

  repository.subscribe(() => {
    throw new Error("observer failure");
  });
  repository.subscribe((received) => {
    observed = received;
    persistedWhenObserved = harness.get(APPEARANCE_STORAGE_KEY);
  });

  await repository.write(preference);

  assert.deepEqual(observed, preference);
  assert.equal(persistedWhenObserved, JSON.stringify(preference));
  assert.equal(harness.get(APPEARANCE_STORAGE_KEY), JSON.stringify(preference));
});

test("a throwing cross-tab observer cannot block later observers", () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const preference = {version: 1, designSystem: "astryx", colorMode: "light"} as const;
  let observed: unknown = null;

  repository.subscribe(() => {
    throw new Error("observer failure");
  });
  repository.subscribe((received) => {
    observed = received;
  });

  assert.doesNotThrow(() => {
    harness.emitStorage(APPEARANCE_STORAGE_KEY, JSON.stringify(preference));
  });
  assert.deepEqual(observed, preference);
});

test("repository boundaries do not expose mutable last-known-good state", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  const supplied: {version: 1; designSystem: "shadcn" | "astryx"; colorMode: "light" | "dark" | "system"} = {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  };
  let secondObserverValue: unknown = null;

  repository.subscribe((received) => {
    received.designSystem = "astryx";
  });
  repository.subscribe((received) => {
    secondObserverValue = received;
  });
  await repository.write(supplied);
  supplied.designSystem = "astryx";

  const returned = await repository.read();
  assert.ok(returned);
  returned.colorMode = "dark";
  harness.set(APPEARANCE_STORAGE_KEY, "not-json");

  assert.deepEqual(secondObserverValue, {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
  const recovered = await repository.read();
  assert.deepEqual(recovered, {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
  assert.ok(recovered);
  recovered.designSystem = "astryx";
  assert.deepEqual(await repository.read(), {
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
});

test("duplicate subscriptions stay independent until their own unsubscribe", async () => {
  const harness = createRepositoryHarness();
  const repository = new BrowserAppearancePreferencesRepository(harness.dependencies);
  let calls = 0;
  const listener = () => {
    calls++;
  };
  const firstUnsubscribe = repository.subscribe(listener);
  const secondUnsubscribe = repository.subscribe(listener);

  await repository.write({version: 1, designSystem: "shadcn", colorMode: "light"});
  assert.equal(calls, 2);
  assert.equal(harness.listenerCount(), 1);

  firstUnsubscribe();
  await repository.write({version: 1, designSystem: "astryx", colorMode: "dark"});
  assert.equal(calls, 3);
  assert.equal(harness.listenerCount(), 1);

  secondUnsubscribe();
  assert.equal(harness.listenerCount(), 0);
});
