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
  normalizeAppearancePreference,
  resolveColorMode,
  type AppearancePreferenceV1,
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

export interface AppearanceRepositoryConnectionCallbacks {
  onPreference(preference: AppearancePreferenceV1): void;
  onError(error: unknown): void;
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
): () => void {
  let active = true;
  let revision = 0;
  let disconnected = false;
  const unsubscribe = repository.subscribe((preference) => {
    if (!active) return;
    revision++;
    callbacks.onPreference(preference);
  });
  const readRevision = revision;

  try {
    void repository.read().then(
      (preference) => {
        if (!active || revision !== readRevision || !preference) return;
        callbacks.onPreference(preference);
      },
      (error: unknown) => {
        if (!active || revision !== readRevision) return;
        callbacks.onError(error);
      },
    );
  } catch (error) {
    callbacks.onError(error);
  }

  return () => {
    if (disconnected) return;
    disconnected = true;
    active = false;
    unsubscribe();
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
  root.removeAttribute("data-astryx-theme");
  root.removeAttribute("data-theme");
  root.removeAttribute("data-renderer-pending");
}

function updateRuntimeThemeColor(renderedDesignSystem: "shadcn" | "astryx", theme: ResolvedTheme) {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[data-brp-runtime-theme-color="true"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.dataset.brpRuntimeThemeColor = "true";
    document.head.append(meta);
  }
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
  const repositoryRef = useRef<AppearancePreferencesRepository | null>(null);
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
    if (bootstrap) acceptPreference(bootstrap);

    const disconnect = repository
      ? connectAppearanceRepository(repository, {
          onPreference: acceptPreference,
          onError(error) {
            handleTransitionFailureRef.current(new Error(formatError(error)), stateRef.current.transitionId);
          },
        })
      : () => undefined;

    return () => {
      disconnect();
      window.removeEventListener("brp:appearance-recovery", recoveryListener);
      if (repositoryRef.current === repository) repositoryRef.current = null;
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
    if (!hydrated) return;
    const root = document.documentElement;
    const bootstrapStillPending =
      root.dataset.rendererPending === "true" &&
      state.transitionStatus === "idle" &&
      state.desiredPreference.designSystem === "shadcn" &&
      window.__BRP_APPEARANCE_BOOTSTRAP__?.designSystem === "astryx";
    if (bootstrapStillPending) return;

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
  }, [hydrated, resolvedTheme, state.desiredPreference.designSystem, state.renderedDesignSystem, state.renderedPreference.colorMode, state.transitionStatus]);

  const updatePreference = useCallback(async (preference: AppearancePreferenceV1) => {
    const repository = repositoryRef.current;
    if (!repository) {
      dispatch({type: "report-error", error: "Appearance preferences are unavailable."});
      return false;
    }
    try {
      const acknowledged = await persistAppearancePreference(repository, preference);
      acceptPreference(acknowledged);
      return true;
    } catch (error) {
      dispatch({type: "report-error", error: formatError(error)});
      return false;
    }
  }, [acceptPreference]);

  const failRendererTransition = useCallback((error: Error) => {
    if (stateRef.current.transitionId === null) {
      handleTransitionFailureRef.current(error, null);
      return;
    }
    coordinator.fail(error);
  }, [coordinator]);

  const value = useMemo<AppearanceContextValue>(() => ({
    desiredPreference: state.desiredPreference,
    renderedDesignSystem: state.renderedDesignSystem,
    resolvedTheme,
    transitionStatus: state.transitionStatus,
    error: state.error,
    updatePreference,
    registerRendererSlot: coordinator.register,
    markRendererSlotReady: coordinator.markReady,
    failRendererTransition,
  }), [coordinator.markReady, coordinator.register, failRendererTransition, resolvedTheme, state.desiredPreference, state.error, state.renderedDesignSystem, state.transitionStatus, updatePreference]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}
