"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {AppearanceContext, type AppearanceContextValue} from "@/components/appearance/use-appearance";
import {
  createBrowserAppearanceRepository,
  DEFAULT_APPEARANCE_PREFERENCE,
  normalizeAppearancePreference,
  resolveColorMode,
  type AppearancePreferenceV1,
  type AppearancePublicationContext,
  type AppearancePreferencesRepository,
  type ColorMode,
  type ResolvedTheme,
} from "@/lib/appearance";
import type {AppearanceBootstrapDiagnostic} from "@/lib/appearance/bootstrap-source";
import {
  appearanceTransitionReducer,
  createInitialAppearanceTransitionState,
  createRendererReadinessCoordinator,
} from "@/lib/appearance/renderer-readiness";

declare global {
  interface Window {
    __BRP_APPEARANCE_BOOTSTRAP__?: AppearancePreferenceV1;
    __BRP_APPEARANCE_DIAGNOSTIC__?: AppearanceBootstrapDiagnostic;
    __BRP_ASTRYX_WATCHDOG__?: number;
  }
}

export type AppearanceRepositoryPreferenceContext =
  | AppearancePublicationContext
  | {origin: "initial-read"; operationId: null};

export interface AppearanceRepositoryConnectionCallbacks {
  onPreference(
    preference: AppearancePreferenceV1,
    context: AppearanceRepositoryPreferenceContext,
  ): void;
  onError(error: unknown): void;
}

export interface AppearanceRepositoryConnection {
  (): void;
  invalidatePendingRead(): void;
}

export interface AppearanceAcceptanceGate {
  accept(preference: AppearancePreferenceV1): boolean;
  remember(preference: AppearancePreferenceV1): void;
  reset(): void;
}

export function createAppearanceAcceptanceGate(): AppearanceAcceptanceGate {
  let accepted = "";
  const serialize = (preference: AppearancePreferenceV1) => JSON.stringify(preference);

  return {
    accept(preference) {
      const serialized = serialize(preference);
      if (accepted === serialized) return false;
      accepted = serialized;
      return true;
    },
    remember(preference) {
      accepted = serialize(preference);
    },
    reset() {
      accepted = "";
    },
  };
}

export function connectAppearanceRepository(
  repository: AppearancePreferencesRepository,
  callbacks: AppearanceRepositoryConnectionCallbacks,
): AppearanceRepositoryConnection {
  let active = true;
  let revision = 0;
  let disconnected = false;
  const readRevision = revision;
  const unsubscribe = repository.subscribe((preference, context) => {
    if (!active) return;
    revision++;
    callbacks.onPreference(preference, context);
  });
  try {
    void repository.read().then(
      (preference) => {
        if (!active || revision !== readRevision || !preference) return;
        callbacks.onPreference(preference, {origin: "initial-read", operationId: null});
      },
      (error: unknown) => {
        if (!active || revision !== readRevision) return;
        callbacks.onError(error);
      },
    );
  } catch (error) {
    callbacks.onError(error);
  }

  const disconnect = (() => {
    if (disconnected) return;
    disconnected = true;
    active = false;
    unsubscribe();
  }) as AppearanceRepositoryConnection;
  disconnect.invalidatePendingRead = () => {
    if (!active) return;
    revision++;
  };
  return disconnect;
}

export interface AppearanceWriteCoordinatorCallbacks {
  invalidatePendingRead(): void;
  onAcknowledged(preference: AppearancePreferenceV1): void;
  onError(error: unknown): void;
}

export interface AppearanceWriteCoordinator {
  write(preference: AppearancePreferenceV1): Promise<boolean>;
  acceptPublication(
    preference: AppearancePreferenceV1,
    context: AppearanceRepositoryPreferenceContext,
  ): boolean;
  rememberDurablePreference(preference: AppearancePreferenceV1): void;
  dispose(): void;
}

let appearanceWriteCoordinatorSequence = 0;
const appearanceOperationSessionNamespace = (() => {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      const values = globalThis.crypto.getRandomValues(new Uint32Array(4));
      return Array.from(values, (value) => value.toString(36)).join("-");
    }
  } catch {
    // Fall through to a dependency-free namespace for restricted runtimes.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
})();

export function createAppearanceWriteCoordinator(
  repository: AppearancePreferencesRepository,
  callbacks: AppearanceWriteCoordinatorCallbacks,
): AppearanceWriteCoordinator {
  type IntentStatus = "queued" | "running" | "superseded" | "settled";
  type Intent = {
    preference: AppearancePreferenceV1;
    resolve(result: boolean): void;
    status: IntentStatus;
  };

  const coordinatorId = ++appearanceWriteCoordinatorSequence;
  const operationIdPrefix =
    `appearance-${appearanceOperationSessionNamespace}-${coordinatorId}-`;
  const serialize = (preference: AppearancePreferenceV1) => JSON.stringify(preference);
  const copyPreference = (preference: AppearancePreferenceV1): AppearancePreferenceV1 => ({
    version: 1,
    designSystem: preference.designSystem,
    colorMode: preference.colorMode,
  });
  const isSamePreference = (
    left: AppearancePreferenceV1 | null,
    right: AppearancePreferenceV1 | null,
  ) => left !== null && right !== null && serialize(left) === serialize(right);

  let active = true;
  let generation = 0;
  let authorityEpoch = 0;
  let operationSequence = 0;
  let latestIntent: Intent | null = null;
  let runningIntent: Intent | null = null;
  let authoritativePreference: AppearancePreferenceV1 | null = null;
  let lastKnownDurableWrite: AppearancePreferenceV1 | null = null;
  let convergenceBlockedEpoch: number | null = null;
  let flushPromise: Promise<void> | null = null;

  const settleIntent = (intent: Intent, result: boolean) => {
    if (intent.status === "settled") return;
    intent.status = "settled";
    intent.resolve(result);
  };
  const supersedeLatestIntent = () => {
    const intent = latestIntent;
    if (!intent) return;
    latestIntent = null;
    if (intent.status === "queued") {
      intent.status = "superseded";
      settleIntent(intent, false);
      return;
    }
    if (intent.status === "running") intent.status = "superseded";
  };
  const advanceAuthority = (
    preference: AppearancePreferenceV1,
    {notify, supersedeLocal}: {notify: boolean; supersedeLocal: boolean},
  ) => {
    const accepted = copyPreference(preference);
    authorityEpoch++;
    authoritativePreference = accepted;
    lastKnownDurableWrite = copyPreference(accepted);
    convergenceBlockedEpoch = null;
    if (supersedeLocal) supersedeLatestIntent();
    if (notify) callbacks.onAcknowledged(accepted);
  };
  const writeRepository = async (preference: AppearancePreferenceV1) => {
    const operationId = `${operationIdPrefix}${++operationSequence}`;
    await repository.write(preference, {operationId});
    if (!active) return;
    lastKnownDurableWrite = copyPreference(preference);
    convergenceBlockedEpoch = null;
    callbacks.invalidatePendingRead();
  };

  type ReconciliationGuard = {
    authorityEpoch: number;
    generation: number;
    intent: Intent | null;
  };
  type ReconciliationResult =
    | {status: "current"; preference: AppearancePreferenceV1}
    | {status: "failed"; error: unknown}
    | {status: "stale"};
  const isCurrentGuard = (guard: ReconciliationGuard) =>
    active &&
    authorityEpoch === guard.authorityEpoch &&
    generation === guard.generation &&
    latestIntent === guard.intent;
  const reconcileDurablePreference = async (
    guard: ReconciliationGuard,
  ): Promise<ReconciliationResult> => {
    if (!isCurrentGuard(guard)) return {status: "stale"};
    let readPreference: AppearancePreferenceV1 | null;
    try {
      readPreference = await repository.read();
    } catch (error) {
      if (!isCurrentGuard(guard)) return {status: "stale"};
      convergenceBlockedEpoch = guard.authorityEpoch;
      return {status: "failed", error};
    }
    if (!isCurrentGuard(guard)) return {status: "stale"};
    const normalized = readPreference === null
      ? DEFAULT_APPEARANCE_PREFERENCE
      : normalizeAppearancePreference(readPreference);
    if (!normalized) {
      convergenceBlockedEpoch = guard.authorityEpoch;
      return {
        status: "failed",
        error: new TypeError("Appearance repository returned an invalid preference."),
      };
    }
    const verified = copyPreference(normalized);
    lastKnownDurableWrite = verified;
    convergenceBlockedEpoch = null;
    return {status: "current", preference: verified};
  };
  const adoptVerifiedDurablePreference = (preference: AppearancePreferenceV1) => {
    const notify = !isSamePreference(preference, authoritativePreference);
    advanceAuthority(preference, {notify, supersedeLocal: false});
  };

  const runLocalIntent = async (intent: Intent) => {
    if (!active || latestIntent !== intent || intent.status !== "queued") {
      settleIntent(intent, false);
      return;
    }
    intent.status = "running";
    runningIntent = intent;
    const startEpoch = authorityEpoch;
    try {
      await writeRepository(intent.preference);
    } catch (error) {
      if (active) lastKnownDurableWrite = null;
      const guard = {
        authorityEpoch: startEpoch,
        generation,
        intent,
      };
      const reconciliation = await reconcileDurablePreference(guard);
      if (latestIntent === intent) {
        latestIntent = null;
        if (reconciliation.status === "current") {
          adoptVerifiedDurablePreference(reconciliation.preference);
        }
      }
      if (active) {
        callbacks.onError(error);
      }
      if (active && reconciliation.status === "failed") {
        callbacks.onError(reconciliation.error);
      }
      settleIntent(intent, false);
      if (runningIntent === intent) runningIntent = null;
      return;
    }

    if (
      active &&
      latestIntent === intent &&
      intent.status === "running" &&
      authorityEpoch === startEpoch
    ) {
      latestIntent = null;
      authorityEpoch++;
      authoritativePreference = copyPreference(intent.preference);
      callbacks.onAcknowledged(copyPreference(intent.preference));
      settleIntent(intent, true);
    } else {
      if (latestIntent === intent) latestIntent = null;
      settleIntent(intent, false);
    }
    if (runningIntent === intent) runningIntent = null;
  };

  const runConvergenceAttempt = async () => {
    if (!authoritativePreference || isSamePreference(lastKnownDurableWrite, authoritativePreference)) {
      return;
    }
    const target = copyPreference(authoritativePreference);
    const targetEpoch = authorityEpoch;
    const targetGeneration = generation;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await writeRepository(target);
      } catch (error) {
        if (active) lastKnownDurableWrite = null;
        const guard = {
          authorityEpoch: targetEpoch,
          generation: targetGeneration,
          intent: null,
        };
        if (!isCurrentGuard(guard)) {
          if (active) callbacks.onError(error);
          return;
        }
        const reconciliation = await reconcileDurablePreference(guard);
        if (reconciliation.status === "stale") {
          if (active) callbacks.onError(error);
          return;
        }
        if (reconciliation.status === "failed") {
          callbacks.onError(error);
          callbacks.onError(reconciliation.error);
          return;
        }
        if (isSamePreference(reconciliation.preference, target)) {
          callbacks.onError(error);
          return;
        }
        if (attempt === 1) {
          adoptVerifiedDurablePreference(reconciliation.preference);
          callbacks.onError(error);
          return;
        }
        callbacks.onError(error);
        continue;
      }
      return;
    }
  };

  const needsFlush = () =>
    latestIntent?.status === "queued" ||
    (authoritativePreference !== null &&
      convergenceBlockedEpoch !== authorityEpoch &&
      !isSamePreference(lastKnownDurableWrite, authoritativePreference));
  const runFlush = async () => {
    while (active) {
      const intent = latestIntent;
      if (intent?.status === "queued") {
        await runLocalIntent(intent);
        continue;
      }
      if (
        authoritativePreference &&
        convergenceBlockedEpoch !== authorityEpoch &&
        !isSamePreference(lastKnownDurableWrite, authoritativePreference)
      ) {
        await runConvergenceAttempt();
        continue;
      }
      return;
    }
  };
  const scheduleFlush = () => {
    if (!active || flushPromise) return;
    flushPromise = Promise.resolve()
      .then(runFlush)
      .finally(() => {
        flushPromise = null;
        if (active && needsFlush()) scheduleFlush();
      });
  };

  return {
    write(preference) {
      const normalized = normalizeAppearancePreference(preference);
      if (!normalized) {
        if (active) {
          callbacks.onError(new TypeError("Appearance preference must use the supported v1 contract."));
        }
        return Promise.resolve(false);
      }
      if (!active) return Promise.resolve(false);

      callbacks.invalidatePendingRead();
      supersedeLatestIntent();
      let resolveIntent: (result: boolean) => void = () => undefined;
      const result = new Promise<boolean>((resolve) => {
        resolveIntent = resolve;
      });
      latestIntent = {
        preference: copyPreference(normalized),
        resolve: resolveIntent,
        status: "queued",
      };
      generation++;
      scheduleFlush();
      return result;
    },
    acceptPublication(preference, context) {
      if (!active) return false;
      const normalized = normalizeAppearancePreference(preference);
      if (!normalized) return false;
      if (
        context.origin === "local-write" &&
        context.operationId !== null &&
        context.operationId.startsWith(operationIdPrefix)
      ) {
        return false;
      }
      advanceAuthority(normalized, {notify: false, supersedeLocal: true});
      scheduleFlush();
      return true;
    },
    rememberDurablePreference(preference) {
      if (!active) return;
      const normalized = normalizeAppearancePreference(preference);
      if (normalized) {
        advanceAuthority(normalized, {notify: false, supersedeLocal: true});
      }
    },
    dispose() {
      active = false;
      generation++;
      authorityEpoch++;
      supersedeLatestIntent();
      if (runningIntent) settleIntent(runningIntent, false);
      runningIntent = null;
      authoritativePreference = null;
      lastKnownDurableWrite = null;
      convergenceBlockedEpoch = null;
    },
  };
}

export async function persistAppearancePreference(
  repository: AppearancePreferencesRepository,
  preference: AppearancePreferenceV1,
): Promise<AppearancePreferenceV1> {
  const normalized = normalizeAppearancePreference(preference);
  if (!normalized) {
    throw new TypeError("Appearance preference must use the supported v1 contract.");
  }
  await repository.write(normalized);
  return normalized;
}

export interface ColorSchemeMediaQueryPort {
  matches: boolean;
  addEventListener(type: "change", listener: (event: {matches: boolean}) => void): void;
  removeEventListener(type: "change", listener: (event: {matches: boolean}) => void): void;
}

export function subscribeToResolvedTheme(
  colorMode: ColorMode,
  mediaQuery: ColorSchemeMediaQueryPort,
  listener: (theme: ResolvedTheme) => void,
): () => void {
  listener(resolveColorMode(colorMode, mediaQuery.matches));
  if (colorMode !== "system") return () => undefined;

  let subscribed = true;
  const handleChange = (event: {matches: boolean}) => listener(event.matches ? "dark" : "light");
  mediaQuery.addEventListener("change", handleChange);
  return () => {
    if (!subscribed) return;
    subscribed = false;
    mediaQuery.removeEventListener("change", handleChange);
  };
}

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

function useSystemPrefersDark(): boolean {
  const subscribe = useCallback((notify: () => void) => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", notify);
    return () => mediaQuery.removeEventListener("change", notify);
  }, []);
  const getSnapshot = useCallback(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    [],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : "Appearance operation failed.";
}

function clearWindowWatchdog(): void {
  if (typeof window === "undefined" || window.__BRP_ASTRYX_WATCHDOG__ === undefined) return;
  window.clearTimeout(window.__BRP_ASTRYX_WATCHDOG__);
  delete window.__BRP_ASTRYX_WATCHDOG__;
}

export function recoverRootToShadcn(preference: AppearancePreferenceV1): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const systemPrefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveColorMode(preference.colorMode, systemPrefersDark);
  root.dataset.designSystem = "shadcn";
  root.dataset.colorMode = preference.colorMode;
  root.dataset.resolvedTheme = resolved;
  root.classList.toggle("dark", resolved === "dark");
  // The permanently mounted compatibility Theme owns these Astryx markers even
  // while the semantic renderer has fallen back to shadcn.
  root.dataset.astryxTheme = "brp-current-compatibility";
  if (preference.colorMode === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = preference.colorMode;
  root.removeAttribute("data-renderer-pending");
}

export function updateRuntimeThemeColor(
  renderedDesignSystem: "shadcn" | "astryx",
  theme: ResolvedTheme,
): void {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[data-brp-runtime-theme-color="true"]');
  const firstThemeColor = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.dataset.brpRuntimeThemeColor = "true";
  }
  if (firstThemeColor && firstThemeColor !== meta) document.head.insertBefore(meta, firstThemeColor);
  else if (!meta.isConnected) document.head.append(meta);
  meta.removeAttribute("media");
  meta.content = renderedDesignSystem === "astryx"
    ? theme === "dark" ? "#1b1b1b" : "#f1f1f1"
    : theme === "dark" ? "#0d1117" : "#f6f8fa";
}

export function AppearanceProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(
    appearanceTransitionReducer,
    undefined,
    createInitialAppearanceTransitionState,
  );
  const stateRef = useRef(state);
  const bootstrapReconciledRef = useRef(false);
  const repositoryRef = useRef<AppearancePreferencesRepository | null>(null);
  const writeCoordinatorRef = useRef<AppearanceWriteCoordinator | null>(null);
  const providerWatchdogRef = useRef<number | null>(null);
  const transitionSequenceRef = useRef(0);
  const lastShadcnPreferenceRef = useRef<AppearancePreferenceV1>({
    version: 1,
    designSystem: "shadcn",
    colorMode: "light",
  });
  const suppressPublicationRef = useRef("");
  const handleTransitionFailureRef = useRef<(error: Error, transitionId: number | null) => void>(
    () => undefined,
  );
  const [coordinator] = useState(() => createRendererReadinessCoordinator({
    scheduler: {
      cancelAnimationFrame(handle) {
        window.cancelAnimationFrame(handle);
      },
      requestAnimationFrame(callback) {
        return window.requestAnimationFrame(callback);
      },
    },
    onReady(transitionId) {
      clearWindowWatchdog();
      if (providerWatchdogRef.current !== null) {
        window.clearTimeout(providerWatchdogRef.current);
        providerWatchdogRef.current = null;
      }
      dispatch({type: "commit-astryx", transitionId});
    },
    onFailure(transitionId, error) {
      handleTransitionFailureRef.current(error, transitionId);
    },
  }));
  const [acceptanceGate] = useState(createAppearanceAcceptanceGate);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const systemPrefersDark = useSystemPrefersDark();

  const clearProviderWatchdog = useCallback(() => {
    if (providerWatchdogRef.current === null) return;
    window.clearTimeout(providerWatchdogRef.current);
    providerWatchdogRef.current = null;
  }, []);

  const startProviderWatchdog = useCallback((transitionId: number) => {
    clearProviderWatchdog();
    providerWatchdogRef.current = window.setTimeout(() => {
      coordinator.fail(new Error("Astryx renderer readiness timed out."));
    }, 4_000);
    return transitionId;
  }, [clearProviderWatchdog, coordinator]);

  const acceptPreference = useCallback((preference: AppearancePreferenceV1) => {
    const normalized = normalizeAppearancePreference(preference);
    if (!normalized) return;
    const serialized = JSON.stringify(normalized);
    if (suppressPublicationRef.current === serialized) {
      suppressPublicationRef.current = "";
      return;
    }
    if (!acceptanceGate.accept(normalized)) return;

    if (normalized.designSystem === "shadcn") {
      coordinator.cancel();
      clearProviderWatchdog();
      clearWindowWatchdog();
      lastShadcnPreferenceRef.current = normalized;
      dispatch({type: "commit-shadcn", preference: normalized});
      return;
    }

    const transitionId = ++transitionSequenceRef.current;
    dispatch({type: "request-astryx", preference: normalized, transitionId});
    coordinator.begin(transitionId);
    startProviderWatchdog(transitionId);
  }, [acceptanceGate, clearProviderWatchdog, coordinator, startProviderWatchdog]);

  const handleTransitionFailure = useCallback((error: Error, transitionId: number | null) => {
    clearProviderWatchdog();
    clearWindowWatchdog();
    const fallback = lastShadcnPreferenceRef.current;
    const serializedFallback = JSON.stringify(fallback);
    acceptanceGate.remember(fallback);
    recoverRootToShadcn(fallback);
    dispatch({
      type: "fail",
      error: error.message,
      fallback,
      transitionId,
    });
    const writer = writeCoordinatorRef.current;
    if (writer) {
      void writer.write(fallback);
      return;
    }
    const repository = repositoryRef.current;
    if (repository) {
      suppressPublicationRef.current = serializedFallback;
      void repository.write(fallback).catch(() => {
        suppressPublicationRef.current = "";
      });
    }
  }, [acceptanceGate, clearProviderWatchdog]);

  useLayoutEffect(() => {
    stateRef.current = state;
    handleTransitionFailureRef.current = handleTransitionFailure;
  }, [handleTransitionFailure, state]);

  useEffect(() => {
    if (!hydrated) return;
    const repository = createBrowserAppearanceRepository();
    repositoryRef.current = repository;

    const recoveryListener = (event: Event) => {
      const diagnostic = (event as CustomEvent<AppearanceBootstrapDiagnostic>).detail;
      handleTransitionFailureRef.current(
        new Error(diagnostic?.code ?? "Appearance bootstrap recovery."),
        stateRef.current.transitionId,
      );
    };
    window.addEventListener("brp:appearance-recovery", recoveryListener);

    const bootstrap = normalizeAppearancePreference(window.__BRP_APPEARANCE_BOOTSTRAP__);
    bootstrapReconciledRef.current = true;
    if (bootstrap) acceptPreference(bootstrap);

    let connection: AppearanceRepositoryConnection | null = null;
    const writer = repository
      ? createAppearanceWriteCoordinator(repository, {
          invalidatePendingRead() {
            connection?.invalidatePendingRead();
          },
          onAcknowledged: acceptPreference,
          onError(error) {
            dispatch({type: "report-error", error: formatError(error)});
          },
        })
      : null;
    writeCoordinatorRef.current = writer;
    if (repository && writer) {
      writer.rememberDurablePreference(bootstrap ?? stateRef.current.renderedPreference);
      connection = connectAppearanceRepository(repository, {
        onPreference(preference, context) {
          if (!writer.acceptPublication(preference, context)) return;
          acceptPreference(preference);
        },
        onError(error) {
          dispatch({type: "report-error", error: formatError(error)});
        },
      });
    }

    return () => {
      writer?.dispose();
      connection?.();
      window.removeEventListener("brp:appearance-recovery", recoveryListener);
      if (repositoryRef.current === repository) repositoryRef.current = null;
      if (writeCoordinatorRef.current === writer) writeCoordinatorRef.current = null;
      bootstrapReconciledRef.current = false;
      acceptanceGate.reset();
      suppressPublicationRef.current = "";
    };
  }, [acceptPreference, acceptanceGate, hydrated]);

  useEffect(() => () => {
    coordinator.cancel();
    clearProviderWatchdog();
  }, [clearProviderWatchdog, coordinator]);

  const resolvedTheme = resolveColorMode(
    state.renderedPreference.colorMode,
    systemPrefersDark,
  );

  useLayoutEffect(() => {
    if (!hydrated || !bootstrapReconciledRef.current) return;
    const root = document.documentElement;

    root.dataset.designSystem = state.renderedDesignSystem;
    root.dataset.colorMode = state.renderedPreference.colorMode;
    root.dataset.resolvedTheme = resolvedTheme;
    root.classList.toggle("dark", resolvedTheme === "dark");
    if (state.transitionStatus === "loading-astryx") {
      root.dataset.rendererPending = "true";
    } else {
      root.removeAttribute("data-renderer-pending");
    }
    updateRuntimeThemeColor(state.renderedDesignSystem, resolvedTheme);
  }, [hydrated, resolvedTheme, state]);

  const updatePreference = useCallback(async (preference: AppearancePreferenceV1) => {
    const writer = writeCoordinatorRef.current;
    if (!writer) {
      dispatch({type: "report-error", error: "Appearance preferences are unavailable."});
      return false;
    }
    return writer.write(preference);
  }, []);

  const failRendererTransition = useCallback((error: Error) => {
    if (stateRef.current.transitionId === null) {
      handleTransitionFailureRef.current(error, null);
      return;
    }
    coordinator.fail(error);
  }, [coordinator]);

  const value = useMemo<AppearanceContextValue>(() => ({
    desiredPreference: state.desiredPreference,
    renderedPreference: state.renderedPreference,
    renderedColorMode: state.renderedPreference.colorMode,
    renderedDesignSystem: state.renderedDesignSystem,
    rendererTransitionId: state.transitionId,
    resolvedTheme,
    transitionStatus: state.transitionStatus,
    error: state.error,
    updatePreference,
    registerRendererSlot: coordinator.register,
    markRendererSlotReady: coordinator.markReady,
    failRendererTransition,
  }), [coordinator.markReady, coordinator.register, failRendererTransition, resolvedTheme, state.desiredPreference, state.error, state.renderedDesignSystem, state.renderedPreference, state.transitionId, state.transitionStatus, updatePreference]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}
