import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {createElement} from "react";
import {renderToString} from "react-dom/server";
import {AppearanceProvider} from "../src/components/providers/appearance-provider";
import {useAppearance} from "../src/components/appearance/use-appearance";
import type {
  AppearancePreferenceV1,
  AppearancePreferencesRepository,
} from "../src/lib/appearance";
import {
  appearanceTransitionReducer,
  createInitialAppearanceTransitionState,
  createRendererReadinessCoordinator,
} from "../src/lib/appearance/renderer-readiness";
import {
  connectAppearanceRepository,
  createAppearanceAcceptanceGate,
  createAppearanceWriteCoordinator,
  persistAppearancePreference,
  recoverRootToShadcn,
  subscribeToResolvedTheme,
  updateRuntimeThemeColor,
} from "../src/components/providers/appearance-provider";

const DEFAULT = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
const ASTRYX_SYSTEM = {version: 1, designSystem: "astryx", colorMode: "system"} as const;

type DeferredAppearanceWrite = {
  preference: AppearancePreferenceV1;
  reject(error: Error): void;
  resolve(): void;
};

function createDeferredDurabilityHarness() {
  const pending: DeferredAppearanceWrite[] = [];
  let durablePreference: AppearancePreferenceV1 | null = null;
  let seedBaseline = true;
  const repository: AppearancePreferencesRepository = {
    async read() {
      return durablePreference;
    },
    write(preference) {
      if (seedBaseline) {
        seedBaseline = false;
        durablePreference = preference;
        return Promise.resolve();
      }
      return new Promise<void>((resolve, reject) => {
        pending.push({
          preference,
          reject,
          resolve() {
            durablePreference = preference;
            resolve();
          },
        });
      });
    },
    subscribe() {
      return () => undefined;
    },
  };
  return {
    getDurablePreference: () => durablePreference,
    pending,
    repository,
    setDurablePreference(preference: AppearancePreferenceV1) {
      durablePreference = preference;
    },
  };
}

const flushCoordinator = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function AppearanceProbe() {
  const appearance = useAppearance();
  return createElement("output", {
    "data-desired": `${appearance.desiredPreference.designSystem}/${appearance.desiredPreference.colorMode}`,
    "data-rendered": appearance.renderedDesignSystem,
    "data-status": appearance.transitionStatus,
  });
}

test("provider server and first React render are exactly shadcn light", () => {
  const html = renderToString(
    createElement(AppearanceProvider, null, createElement(AppearanceProbe)),
  );

  assert.match(html, /data-desired="shadcn\/light"/);
  assert.match(html, /data-rendered="shadcn"/);
  assert.match(html, /data-status="idle"/);
});

test("hydrated Astryx intent remains distinct from committed shadcn", () => {
  const initial = createInitialAppearanceTransitionState();
  const loading = appearanceTransitionReducer(initial, {
    type: "request-astryx",
    preference: ASTRYX_SYSTEM,
    transitionId: 1,
  });

  assert.deepEqual(initial.desiredPreference, DEFAULT);
  assert.equal(initial.renderedDesignSystem, "shadcn");
  assert.deepEqual(loading.desiredPreference, ASTRYX_SYSTEM);
  assert.equal(loading.renderedDesignSystem, "shadcn");
  assert.equal(loading.transitionStatus, "loading-astryx");
});

function createFrameHarness() {
  const callbacks = new Map<number, () => void>();
  const canceled: number[] = [];
  let nextHandle = 1;
  return {
    canceled,
    scheduler: {
      cancelAnimationFrame(handle: number) {
        canceled.push(handle);
        callbacks.delete(handle);
      },
      requestAnimationFrame(callback: () => void) {
        const handle = nextHandle++;
        callbacks.set(handle, callback);
        return handle;
      },
    },
    runFrames() {
      const queued = [...callbacks.values()];
      callbacks.clear();
      for (const callback of queued) callback();
    },
    queuedFrames() {
      return callbacks.size;
    },
  };
}

test("all registered renderer slots must be ready for one animation frame before commit", () => {
  const frames = createFrameHarness();
  const ready: number[] = [];
  const coordinator = createRendererReadinessCoordinator({
    scheduler: frames.scheduler,
    onReady: (transitionId) => ready.push(transitionId),
    onFailure: () => assert.fail("unexpected failure"),
  });
  coordinator.begin(7);
  coordinator.register("shell");
  coordinator.register("route");

  coordinator.markReady("shell");
  assert.equal(frames.queuedFrames(), 0);
  coordinator.markReady("route");
  assert.equal(frames.queuedFrames(), 1);
  assert.deepEqual(ready, []);

  frames.runFrames();
  assert.deepEqual(ready, [7]);
});

test("a late slot cancels a scheduled commit until the new slot is ready", () => {
  const frames = createFrameHarness();
  const ready: number[] = [];
  const coordinator = createRendererReadinessCoordinator({
    scheduler: frames.scheduler,
    onReady: (transitionId) => ready.push(transitionId),
    onFailure: () => assert.fail("unexpected failure"),
  });
  coordinator.begin(2);
  coordinator.register("shell");
  coordinator.markReady("shell");
  assert.equal(frames.queuedFrames(), 1);

  coordinator.register("route");
  assert.equal(frames.queuedFrames(), 0);
  assert.equal(frames.canceled.length, 1);
  frames.runFrames();
  assert.deepEqual(ready, []);

  coordinator.markReady("route");
  frames.runFrames();
  assert.deepEqual(ready, [2]);
});

test("duplicate slot IDs and repeated unregister calls are deterministic", () => {
  const frames = createFrameHarness();
  const ready: number[] = [];
  const coordinator = createRendererReadinessCoordinator({
    scheduler: frames.scheduler,
    onReady: (transitionId) => ready.push(transitionId),
    onFailure: () => assert.fail("unexpected failure"),
  });
  coordinator.begin(3);
  const unregisterFirst = coordinator.register("shell");
  const unregisterSecond = coordinator.register("shell");
  coordinator.markReady("shell");
  unregisterFirst();
  unregisterFirst();
  frames.runFrames();
  assert.deepEqual(ready, [3]);

  coordinator.begin(4);
  coordinator.markReady("shell");
  unregisterSecond();
  unregisterSecond();
  frames.runFrames();
  assert.deepEqual(ready, [3]);
});

test("new transitions and explicit cancellation invalidate stale RAF barriers", () => {
  const frames = createFrameHarness();
  const ready: number[] = [];
  const coordinator = createRendererReadinessCoordinator({
    scheduler: frames.scheduler,
    onReady: (transitionId) => ready.push(transitionId),
    onFailure: () => assert.fail("unexpected failure"),
  });
  coordinator.register("route");
  coordinator.begin(10);
  coordinator.markReady("route");
  coordinator.begin(11);
  frames.runFrames();
  assert.deepEqual(ready, []);

  coordinator.markReady("route");
  coordinator.cancel();
  frames.runFrames();
  assert.deepEqual(ready, []);
});

test("slot failure rolls desired and committed state back to shadcn", () => {
  const initial = createInitialAppearanceTransitionState();
  const loading = appearanceTransitionReducer(initial, {
    type: "request-astryx",
    preference: ASTRYX_SYSTEM,
    transitionId: 9,
  });
  const failed = appearanceTransitionReducer(loading, {
    type: "fail",
    error: "route import failed",
    fallback: DEFAULT,
    transitionId: 9,
  });

  assert.deepEqual(failed.desiredPreference, DEFAULT);
  assert.equal(failed.renderedDesignSystem, "shadcn");
  assert.equal(failed.transitionStatus, "error");
  assert.equal(failed.error, "route import failed");
});

test("only the active transition commits and shadcn commits immediately", () => {
  const initial = createInitialAppearanceTransitionState();
  const first = appearanceTransitionReducer(initial, {
    type: "request-astryx",
    preference: ASTRYX_SYSTEM,
    transitionId: 1,
  });
  const secondPreference = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
  const second = appearanceTransitionReducer(first, {
    type: "request-astryx",
    preference: secondPreference,
    transitionId: 2,
  });
  const staleCommit = appearanceTransitionReducer(second, {type: "commit-astryx", transitionId: 1});
  assert.deepEqual(staleCommit, second);

  const committed = appearanceTransitionReducer(second, {type: "commit-astryx", transitionId: 2});
  assert.equal(committed.renderedDesignSystem, "astryx");
  assert.equal(committed.transitionStatus, "ready");

  const shadcnDark = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const returned = appearanceTransitionReducer(committed, {
    type: "commit-shadcn",
    preference: shadcnDark,
  });
  assert.deepEqual(returned.desiredPreference, shadcnDark);
  assert.equal(returned.renderedDesignSystem, "shadcn");
  assert.equal(returned.transitionStatus, "idle");
});

test("repository subscription wins over a delayed stale read and cleanup is idempotent", async () => {
  let releaseRead: ((preference: AppearancePreferenceV1 | null) => void) | null = null;
  let listener: Parameters<AppearancePreferencesRepository["subscribe"]>[0] | null = null;
  const order: string[] = [];
  let unsubscribeCalls = 0;
  const repository: AppearancePreferencesRepository = {
    read() {
      order.push("read");
      return new Promise((resolve) => {
        releaseRead = resolve;
      });
    },
    async write() {},
    subscribe(next) {
      order.push("subscribe");
      listener = next;
      return () => unsubscribeCalls++;
    },
  };
  const seen: AppearancePreferenceV1[] = [];
  const disconnect = connectAppearanceRepository(repository, {
    onError: (error) => assert.fail(String(error)),
    onPreference: (preference) => seen.push(preference),
  });

  assert.deepEqual(order, ["subscribe", "read"]);
  const remote = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
  assert.ok(listener);
  (listener as Parameters<AppearancePreferencesRepository["subscribe"]>[0])(
    remote,
    {origin: "external", operationId: null},
  );
  assert.ok(releaseRead);
  (releaseRead as (preference: AppearancePreferenceV1 | null) => void)(DEFAULT);
  await Promise.resolve();
  assert.deepEqual(seen, [remote]);

  disconnect();
  disconnect();
  assert.equal(unsubscribeCalls, 1);
});

test("a synchronous subscribe emission invalidates the later stale repository read", async () => {
  let releaseRead: ((preference: AppearancePreferenceV1 | null) => void) | null = null;
  const authoritative = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;
  const order: string[] = [];
  const repository: AppearancePreferencesRepository = {
    read() {
      order.push("read");
      return new Promise((resolve) => {
        releaseRead = resolve;
      });
    },
    async write() {},
    subscribe(listener) {
      order.push("subscribe");
      listener(authoritative, {origin: "external", operationId: null});
      return () => undefined;
    },
  };
  const seen: AppearancePreferenceV1[] = [];
  connectAppearanceRepository(repository, {
    onError: (error) => assert.fail(String(error)),
    onPreference: (preference) => seen.push(preference),
  });

  assert.deepEqual(order, ["subscribe", "read"]);
  assert.ok(releaseRead);
  (releaseRead as (preference: AppearancePreferenceV1 | null) => void)(DEFAULT);
  await Promise.resolve();
  assert.deepEqual(seen, [authoritative]);
});

test("StrictMode cleanup resets duplicate acceptance so replay restarts readiness", () => {
  const gate = createAppearanceAcceptanceGate();

  assert.equal(gate.accept(ASTRYX_SYSTEM), true);
  assert.equal(gate.accept(ASTRYX_SYSTEM), false);
  gate.reset();
  assert.equal(gate.accept(ASTRYX_SYSTEM), true);
  gate.remember(DEFAULT);
  assert.equal(gate.accept(DEFAULT), false);
});

test("failed persistence never publishes an unacknowledged desired preference", async () => {
  let acknowledged = false;
  const repository: AppearancePreferencesRepository = {
    async read() {
      return DEFAULT;
    },
    async write() {
      throw new Error("quota denied");
    },
    subscribe() {
      return () => undefined;
    },
  };

  await assert.rejects(
    persistAppearancePreference(repository, ASTRYX_SYSTEM).then(() => {
      acknowledged = true;
    }),
    /quota denied/,
  );
  assert.equal(acknowledged, false);
});

test("a correlated local repository publication is suppressed by operation ID", async () => {
  const coordinatorRef: {
    current: ReturnType<typeof createAppearanceWriteCoordinator> | null;
  } = {current: null};
  let acceptedDuringWrite = true;
  const repository: AppearancePreferencesRepository = {
    async read() {
      return null;
    },
    write(preference, context) {
      assert.ok(context);
      assert.ok(coordinatorRef.current);
      acceptedDuringWrite = coordinatorRef.current.acceptPublication(preference, {
        origin: "local-write",
        operationId: context.operationId,
      });
      return Promise.resolve();
    },
    subscribe() {
      return () => undefined;
    },
  };
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: () => undefined,
    onError: (error) => assert.fail(String(error)),
  });
  coordinatorRef.current = coordinator;

  assert.equal(await coordinator.write(ASTRYX_SYSTEM), true);
  assert.equal(acceptedDuringWrite, false);
  assert.equal(coordinator.acceptPublication(ASTRYX_SYSTEM, {
    origin: "local-write",
    operationId: "another-client-operation",
  }), true);
});

test("a delayed correlated local echo stays suppressed after its write is acknowledged", async () => {
  let publish: Parameters<AppearancePreferencesRepository["subscribe"]>[0] | null = null;
  let acknowledgedOperationId: string | null = null;
  const repository: AppearancePreferencesRepository = {
    async read() {
      return null;
    },
    async write(_preference, context) {
      acknowledgedOperationId = context?.operationId ?? null;
    },
    subscribe(listener) {
      publish = listener;
      return () => undefined;
    },
  };
  const visible: AppearancePreferenceV1[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => visible.push(preference),
    onError: (error) => assert.fail(String(error)),
  });
  connectAppearanceRepository(repository, {
    onError: (error) => assert.fail(String(error)),
    onPreference(preference, context) {
      if (coordinator.acceptPublication(preference, context)) visible.push(preference);
    },
  });

  assert.equal(await coordinator.write(ASTRYX_SYSTEM), true);
  assert.ok(acknowledgedOperationId);
  assert.ok(publish);
  (publish as Parameters<AppearancePreferencesRepository["subscribe"]>[0])(
    ASTRYX_SYSTEM,
    {origin: "local-write", operationId: acknowledgedOperationId},
  );

  assert.deepEqual(visible, [ASTRYX_SYSTEM]);
});

test("repository writes are serialized and only the latest queued user intent commits", async () => {
  const releases = new Map<string, Array<() => void>>();
  let durablePreference: AppearancePreferenceV1 | null = null;
  const repository: AppearancePreferencesRepository = {
    async read() {
      return null;
    },
    write(preference) {
      return new Promise((resolve) => {
        const key = JSON.stringify(preference);
        const queued = releases.get(key) ?? [];
        queued.push(() => {
          durablePreference = preference;
          resolve();
        });
        releases.set(key, queued);
      });
    },
    subscribe() {
      return () => undefined;
    },
  };
  const acknowledged: AppearancePreferenceV1[] = [];
  let invalidations = 0;
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => invalidations++,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: (error) => assert.fail(String(error)),
  });
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const second = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const secondResult = coordinator.write(second);

  releases.get(JSON.stringify(first))?.shift()?.();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.equal(releases.get(JSON.stringify(second))?.length, 1);
  releases.get(JSON.stringify(second))?.shift()?.();
  assert.equal(await firstResult, false);
  assert.equal(await secondResult, true);
  assert.deepEqual(acknowledged, [second]);
  assert.deepEqual(durablePreference, second);
  assert.equal(invalidations, 4);
});

test("a failed latest intent rolls a later stale success back to the last acknowledged durable preference", async () => {
  const {getDurablePreference, pending, repository} = createDeferredDurabilityHarness();
  const acknowledged: AppearancePreferenceV1[] = [];
  const errors: string[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: (error) => errors.push(String(error)),
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const second = {version: 1, designSystem: "astryx", colorMode: "system"} as const;

  assert.equal(await coordinator.write(baseline), true);
  acknowledged.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const secondResult = coordinator.write(second);
  assert.deepEqual(pending.map(({preference}) => preference), [first]);

  pending[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(pending[1]?.preference, second);
  pending[1]?.reject(new Error("latest write failed"));
  assert.equal(await secondResult, false);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(pending[2]?.preference, baseline);
  pending[2]?.resolve();
  assert.equal(await firstResult, false);
  assert.deepEqual(acknowledged, []);
  assert.deepEqual(getDurablePreference(), baseline);
  assert.deepEqual(errors, ["Error: latest write failed"]);
});

test("an already failed latest intent is never retried as authoritative", async () => {
  const {getDurablePreference, pending, repository} = createDeferredDurabilityHarness();
  const acknowledged: AppearancePreferenceV1[] = [];
  const errors: string[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: (error) => errors.push(String(error)),
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const second = {version: 1, designSystem: "astryx", colorMode: "system"} as const;

  assert.equal(await coordinator.write(baseline), true);
  acknowledged.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const secondResult = coordinator.write(second);
  pending[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  pending[1]?.reject(new Error("latest write failed"));
  assert.equal(await secondResult, false);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(pending[2]?.preference, baseline);
  pending[2]?.resolve();
  assert.equal(await firstResult, false);
  assert.equal(pending.length, 3);
  assert.deepEqual(acknowledged, []);
  assert.deepEqual(getDurablePreference(), baseline);
  assert.deepEqual(errors, ["Error: latest write failed"]);
});

test("a failed convergence is retried once before restoring durable authority", async () => {
  const {getDurablePreference, pending, repository} = createDeferredDurabilityHarness();
  const acknowledged: AppearancePreferenceV1[] = [];
  const errors: string[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: (error) => errors.push(String(error)),
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const second = {version: 1, designSystem: "astryx", colorMode: "system"} as const;

  assert.equal(await coordinator.write(baseline), true);
  acknowledged.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const secondResult = coordinator.write(second);
  pending[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  pending[1]?.reject(new Error("latest write failed"));
  assert.equal(await secondResult, false);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  pending[2]?.reject(new Error("latest repair failed"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(pending[3]?.preference, baseline);
  pending[3]?.resolve();
  assert.equal(await firstResult, false);
  assert.deepEqual(acknowledged, []);
  assert.deepEqual(getDurablePreference(), baseline);
  assert.deepEqual(errors, ["Error: latest write failed", "Error: latest repair failed"]);
});

test("a failed ultimate rollback explicitly adopts the last known durable value", async () => {
  const {getDurablePreference, pending, repository} = createDeferredDurabilityHarness();
  const acknowledged: AppearancePreferenceV1[] = [];
  const errors: string[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: (error) => errors.push(String(error)),
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const second = {version: 1, designSystem: "astryx", colorMode: "system"} as const;

  assert.equal(await coordinator.write(baseline), true);
  acknowledged.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const secondResult = coordinator.write(second);
  pending[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  pending[1]?.reject(new Error("latest write failed"));
  assert.equal(await secondResult, false);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  pending[2]?.reject(new Error("latest repair failed"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  pending[3]?.reject(new Error("rollback failed"));
  await flushCoordinator();

  assert.equal(await firstResult, false);
  assert.deepEqual(getDurablePreference(), first);
  assert.deepEqual(acknowledged, [first]);
  assert.deepEqual(errors, [
    "Error: latest write failed",
    "Error: latest repair failed",
    "Error: rollback failed",
  ]);
});

test("a newer local preference commits after an older rollback finishes", async () => {
  const {getDurablePreference, pending, repository} = createDeferredDurabilityHarness();
  const acknowledged: AppearancePreferenceV1[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: () => undefined,
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const failed = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  const newer = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;

  assert.equal(await coordinator.write(baseline), true);
  acknowledged.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const failedResult = coordinator.write(failed);
  assert.deepEqual(pending[0]?.preference, first);
  pending[0]?.resolve();
  await flushCoordinator();
  assert.deepEqual(pending[1]?.preference, failed);
  pending[1]?.reject(new Error("latest write failed"));
  assert.equal(await failedResult, false);
  await flushCoordinator();
  assert.deepEqual(pending[2]?.preference, baseline);
  pending[2]?.reject(new Error("latest repair failed"));
  await flushCoordinator();
  assert.deepEqual(pending[3]?.preference, baseline);

  const newerResult = coordinator.write(newer);
  assert.equal(pending.length, 4);
  pending[3]?.resolve();
  await flushCoordinator();
  assert.deepEqual(pending[4]?.preference, newer);
  pending[4]?.resolve();
  assert.equal(await newerResult, true);
  assert.equal(await firstResult, false);
  assert.deepEqual(acknowledged, [newer]);
  assert.deepEqual(getDurablePreference(), newer);
  assert.equal(pending.length, 5);
});

test("an external authoritative preference repairs over an older rollback", async () => {
  const {getDurablePreference, pending, repository, setDurablePreference} =
    createDeferredDurabilityHarness();
  const visible: AppearancePreferenceV1[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => visible.push(preference),
    onError: () => undefined,
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const failed = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  const external = {version: 1, designSystem: "astryx", colorMode: "light"} as const;

  assert.equal(await coordinator.write(baseline), true);
  visible.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const failedResult = coordinator.write(failed);
  pending[0]?.resolve();
  await flushCoordinator();
  pending[1]?.reject(new Error("latest write failed"));
  assert.equal(await failedResult, false);
  await flushCoordinator();
  assert.deepEqual(pending[2]?.preference, baseline);

  setDurablePreference(external);
  assert.equal(coordinator.acceptPublication(external, {
    origin: "external",
    operationId: null,
  }), true);
  visible.push(external);
  pending[2]?.resolve();
  await flushCoordinator();

  assert.deepEqual(pending[3]?.preference, external);
  pending[3]?.resolve();
  assert.equal(await firstResult, false);
  assert.deepEqual(visible, [external]);
  assert.deepEqual(getDurablePreference(), external);
  assert.equal(pending.length, 4);
});

test("an external authority repairs a stale local write that completes later", async () => {
  const {getDurablePreference, pending, repository, setDurablePreference} =
    createDeferredDurabilityHarness();
  const acknowledged: AppearancePreferenceV1[] = [];
  const visible: AppearancePreferenceV1[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => {
      acknowledged.push(preference);
      visible.push(preference);
    },
    onError: () => undefined,
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const external = {version: 1, designSystem: "astryx", colorMode: "light"} as const;

  assert.equal(await coordinator.write(baseline), true);
  acknowledged.length = 0;
  visible.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  assert.deepEqual(pending[0]?.preference, first);
  setDurablePreference(external);
  assert.equal(coordinator.acceptPublication(external, {
    origin: "external",
    operationId: null,
  }), true);
  visible.push(external);
  pending[0]?.resolve();
  await flushCoordinator();

  assert.deepEqual(pending[1]?.preference, external);
  pending[1]?.resolve();
  assert.equal(await firstResult, false);
  assert.deepEqual(acknowledged, []);
  assert.deepEqual(visible.at(-1), external);
  assert.deepEqual(getDurablePreference(), external);
  assert.equal(pending.length, 2);
});

test("A then B then external X then local D converges to D with one serialized writer", async () => {
  const {getDurablePreference, pending, repository, setDurablePreference} =
    createDeferredDurabilityHarness();
  const visible: AppearancePreferenceV1[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => visible.push(preference),
    onError: (error) => assert.fail(String(error)),
  });
  const baseline = {version: 1, designSystem: "shadcn", colorMode: "light"} as const;
  const first = {version: 1, designSystem: "shadcn", colorMode: "dark"} as const;
  const second = {version: 1, designSystem: "astryx", colorMode: "system"} as const;
  const external = {version: 1, designSystem: "astryx", colorMode: "light"} as const;
  const latest = {version: 1, designSystem: "astryx", colorMode: "dark"} as const;

  assert.equal(await coordinator.write(baseline), true);
  visible.length = 0;
  const firstResult = coordinator.write(first);
  await Promise.resolve();
  const secondResult = coordinator.write(second);
  setDurablePreference(external);
  assert.equal(coordinator.acceptPublication(external, {
    origin: "external",
    operationId: null,
  }), true);
  visible.push(external);
  const latestResult = coordinator.write(latest);

  assert.equal(await secondResult, false);
  pending[0]?.resolve();
  await flushCoordinator();
  assert.deepEqual(pending[1]?.preference, latest);
  pending[1]?.resolve();

  assert.equal(await firstResult, false);
  assert.equal(await latestResult, true);
  assert.deepEqual(visible, [external, latest]);
  assert.deepEqual(getDurablePreference(), latest);
  assert.deepEqual(pending.map(({preference}) => preference), [first, latest]);
});

test("a same-value authoritative publication survives a concurrent local write failure", async () => {
  let durablePreference: AppearancePreferenceV1 | null = DEFAULT;
  let publish: Parameters<AppearancePreferencesRepository["subscribe"]>[0] | null = null;
  let rejectWrite: ((error: Error) => void) | null = null;
  const repository: AppearancePreferencesRepository = {
    read() {
      return new Promise<AppearancePreferenceV1 | null>(() => undefined);
    },
    write() {
      return new Promise<void>((_resolve, reject) => {
        rejectWrite = reject;
      });
    },
    subscribe(listener) {
      publish = listener;
      return () => undefined;
    },
  };
  const visible: AppearancePreferenceV1[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => visible.push(preference),
    onError: () => undefined,
  });
  coordinator.rememberDurablePreference(DEFAULT);
  connectAppearanceRepository(repository, {
    onError: (error) => assert.fail(String(error)),
    onPreference(preference, context) {
      if (!coordinator.acceptPublication(preference, context)) return;
      visible.push(preference);
    },
  });

  const writeResult = coordinator.write(ASTRYX_SYSTEM);
  await Promise.resolve();
  durablePreference = ASTRYX_SYSTEM;
  assert.ok(publish);
  (publish as Parameters<AppearancePreferencesRepository["subscribe"]>[0])(
    ASTRYX_SYSTEM,
    {origin: "external", operationId: null},
  );
  assert.ok(rejectWrite);
  (rejectWrite as (error: Error) => void)(new Error("local backend request failed"));

  assert.equal(await writeResult, false);
  assert.deepEqual(visible, [ASTRYX_SYSTEM]);
  assert.deepEqual(durablePreference, ASTRYX_SYSTEM);
});

test("a user intent invalidates an older pending initial repository read immediately", async () => {
  let releaseRead: ((preference: AppearancePreferenceV1 | null) => void) | null = null;
  let releaseWrite: (() => void) | null = null;
  const repository: AppearancePreferencesRepository = {
    read() {
      return new Promise((resolve) => {
        releaseRead = resolve;
      });
    },
    write() {
      return new Promise<void>((resolve) => {
        releaseWrite = resolve;
      });
    },
    subscribe() {
      return () => undefined;
    },
  };
  const seen: AppearancePreferenceV1[] = [];
  const connection = connectAppearanceRepository(repository, {
    onError: (error) => assert.fail(String(error)),
    onPreference: (preference) => seen.push(preference),
  });
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: connection.invalidatePendingRead,
    onAcknowledged: (preference) => seen.push(preference),
    onError: (error) => assert.fail(String(error)),
  });
  coordinator.rememberDurablePreference(DEFAULT);

  const writeResult = coordinator.write(ASTRYX_SYSTEM);
  assert.ok(releaseRead);
  (releaseRead as (preference: AppearancePreferenceV1 | null) => void)(DEFAULT);
  await Promise.resolve();
  assert.deepEqual(seen, []);

  await Promise.resolve();
  assert.ok(releaseWrite);
  (releaseWrite as () => void)();
  assert.equal(await writeResult, true);
  assert.deepEqual(seen, [ASTRYX_SYSTEM]);
});

test("an acknowledged write invalidates an older pending initial read without adapter publication", async () => {
  let releaseRead: ((preference: AppearancePreferenceV1 | null) => void) | null = null;
  const repository: AppearancePreferencesRepository = {
    read() {
      return new Promise((resolve) => {
        releaseRead = resolve;
      });
    },
    async write() {},
    subscribe() {
      return () => undefined;
    },
  };
  const seen: AppearancePreferenceV1[] = [];
  const connection = connectAppearanceRepository(repository, {
    onError: (error) => assert.fail(String(error)),
    onPreference: (preference) => seen.push(preference),
  });
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: connection.invalidatePendingRead,
    onAcknowledged: (preference) => seen.push(preference),
    onError: (error) => assert.fail(String(error)),
  });

  assert.equal(await coordinator.write(ASTRYX_SYSTEM), true);
  assert.ok(releaseRead);
  (releaseRead as (preference: AppearancePreferenceV1 | null) => void)(DEFAULT);
  await Promise.resolve();
  assert.deepEqual(seen, [ASTRYX_SYSTEM]);
});

test("disposing the coordinator settles pending work and ignores late durability callbacks", async () => {
  let releaseWrite: (() => void) | null = null;
  const repository: AppearancePreferencesRepository = {
    async read() {
      return null;
    },
    write() {
      return new Promise<void>((resolve) => {
        releaseWrite = resolve;
      });
    },
    subscribe() {
      return () => undefined;
    },
  };
  const acknowledged: AppearancePreferenceV1[] = [];
  const errors: unknown[] = [];
  const coordinator = createAppearanceWriteCoordinator(repository, {
    invalidatePendingRead: () => undefined,
    onAcknowledged: (preference) => acknowledged.push(preference),
    onError: (error) => errors.push(error),
  });

  const result = coordinator.write(ASTRYX_SYSTEM);
  await Promise.resolve();
  assert.ok(releaseWrite);
  coordinator.dispose();
  assert.equal(await result, false);
  assert.equal(coordinator.acceptPublication(ASTRYX_SYSTEM, {
    origin: "external",
    operationId: null,
  }), false);
  (releaseWrite as () => void)();
  await flushCoordinator();

  assert.deepEqual(acknowledged, []);
  assert.deepEqual(errors, []);
  assert.equal(await coordinator.write(DEFAULT), false);
});

test("runtime theme color stays first and supports shadcn and Astryx palettes", () => {
  type FakeMeta = {
    content: string;
    dataset: Record<string, string>;
    isConnected: boolean;
    media: string | null;
    name: string;
    removeAttribute(name: string): void;
  };
  const createMeta = (name = "theme-color", media: string | null = null): FakeMeta => ({
    content: "",
    dataset: {},
    isConnected: true,
    media,
    name,
    removeAttribute(attribute) {
      if (attribute === "media") this.media = null;
    },
  });
  const staticLight = createMeta("theme-color", "(prefers-color-scheme: light)");
  const staticDark = createMeta("theme-color", "(prefers-color-scheme: dark)");
  const elements = [staticLight, staticDark];
  const head = {
    append(meta: FakeMeta) {
      meta.isConnected = true;
      elements.push(meta);
    },
    insertBefore(meta: FakeMeta, before: FakeMeta) {
      const existing = elements.indexOf(meta);
      if (existing >= 0) elements.splice(existing, 1);
      meta.isConnected = true;
      elements.splice(elements.indexOf(before), 0, meta);
    },
    querySelector(selector: string) {
      if (selector.includes("data-brp-runtime-theme-color")) {
        return elements.find((meta) => meta.dataset.brpRuntimeThemeColor === "true") ?? null;
      }
      return elements.find((meta) => meta.name === "theme-color") ?? null;
    },
  };
  const previousDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement() {
        const meta = createMeta("", null);
        meta.isConnected = false;
        return meta;
      },
      head,
    },
  });

  try {
    updateRuntimeThemeColor("shadcn", "dark");
    assert.equal(elements[0]?.dataset.brpRuntimeThemeColor, "true");
    assert.equal(elements[0]?.content, "#0d1117");
    assert.equal(elements[0]?.media, null);
    assert.deepEqual(elements.slice(1), [staticLight, staticDark]);

    updateRuntimeThemeColor("astryx", "light");
    assert.equal(elements[0]?.content, "#f1f1f1");
    assert.equal(elements.filter((meta) => meta.dataset.brpRuntimeThemeColor === "true").length, 1);
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previousDocument,
    });
  }
});

test("system color mode changes are observed and listener cleanup is exact", () => {
  let changeListener: ((event: {matches: boolean}) => void) | null = null;
  let removals = 0;
  const resolved: string[] = [];
  const unsubscribe = subscribeToResolvedTheme(
    "system",
    {
      matches: false,
      addEventListener(type, listener) {
        assert.equal(type, "change");
        changeListener = listener;
      },
      removeEventListener(type, listener) {
        assert.equal(type, "change");
        assert.equal(listener, changeListener);
        removals++;
      },
    },
    (theme) => resolved.push(theme),
  );

  assert.deepEqual(resolved, ["light"]);
  assert.ok(changeListener);
  (changeListener as (event: {matches: boolean}) => void)({matches: true});
  assert.deepEqual(resolved, ["light", "dark"]);
  unsubscribe();
  unsubscribe();
  assert.equal(removals, 1);
});

test("atomic shadcn recovery resolves a saved system mode from matchMedia", () => {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const dataset: Record<string, string> = {
    astryxTheme: "neutral",
    rendererPending: "true",
    theme: "dark",
  };
  const classes = new Set<string>();
  const root = {
    classList: {
      toggle(value: string, force?: boolean) {
        if (force) classes.add(value);
        else classes.delete(value);
      },
    },
    dataset,
    removeAttribute(name: string) {
      const key = name.replace(/^data-/, "").replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      delete dataset[key];
    },
  };

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {documentElement: root},
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      matchMedia(query: string) {
        assert.equal(query, "(prefers-color-scheme: dark)");
        return {matches: true};
      },
    },
  });

  try {
    recoverRootToShadcn({version: 1, designSystem: "shadcn", colorMode: "system"});
    assert.deepEqual(dataset, {
      colorMode: "system",
      designSystem: "shadcn",
      resolvedTheme: "dark",
    });
    assert.equal(classes.has("dark"), true);
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: previousDocument,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    });
  }
});

test("AppShell delegates color mode and owns no legacy storage or root dark class", async () => {
  const source = await readFile("src/components/shell/app-shell.tsx", "utf8");

  assert.doesNotMatch(source, /brp-clone-theme/);
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /document\.documentElement\.classList/);
  assert.match(source, /useAppearance/);
});

test("renderer fallback persistence is routed through the race-safe writer", async () => {
  const source = await readFile("src/components/providers/appearance-provider.tsx", "utf8");
  const failureHandler = source.slice(
    source.indexOf("const handleTransitionFailure ="),
    source.indexOf("useLayoutEffect(() =>", source.indexOf("const handleTransitionFailure =")),
  );

  assert.match(failureHandler, /writeCoordinatorRef\.current/);
  assert.match(failureHandler, /writer\.write\(fallback\)/);
});
