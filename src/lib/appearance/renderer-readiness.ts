import type {AppearancePreferenceV1, DesignSystem} from "./contracts";
import {DEFAULT_APPEARANCE_PREFERENCE} from "./preference-codec";

export type AppearanceTransitionStatus = "idle" | "loading-astryx" | "ready" | "error";

export interface AppearanceTransitionState {
  desiredPreference: AppearancePreferenceV1;
  renderedPreference: AppearancePreferenceV1;
  renderedDesignSystem: DesignSystem;
  transitionStatus: AppearanceTransitionStatus;
  transitionId: number | null;
  error: string | null;
}

export type AppearanceTransitionAction =
  | {
      type: "request-astryx";
      preference: AppearancePreferenceV1;
      transitionId: number;
    }
  | {type: "commit-astryx"; transitionId: number}
  | {type: "commit-shadcn"; preference: AppearancePreferenceV1}
  | {
      type: "fail";
      error: string;
      fallback: AppearancePreferenceV1;
      transitionId: number | null;
    }
  | {type: "report-error"; error: string};

function copyPreference(preference: AppearancePreferenceV1): AppearancePreferenceV1 {
  return {
    version: 1,
    designSystem: preference.designSystem,
    colorMode: preference.colorMode,
  };
}

export function createInitialAppearanceTransitionState(): AppearanceTransitionState {
  const preference = copyPreference(DEFAULT_APPEARANCE_PREFERENCE);
  return {
    desiredPreference: preference,
    renderedPreference: copyPreference(preference),
    renderedDesignSystem: "shadcn",
    transitionStatus: "idle",
    transitionId: null,
    error: null,
  };
}

export function appearanceTransitionReducer(
  state: AppearanceTransitionState,
  action: AppearanceTransitionAction,
): AppearanceTransitionState {
  switch (action.type) {
    case "request-astryx":
      return {
        ...state,
        desiredPreference: copyPreference(action.preference),
        transitionStatus: "loading-astryx",
        transitionId: action.transitionId,
        error: null,
      };
    case "commit-astryx":
      if (state.transitionId !== action.transitionId || state.desiredPreference.designSystem !== "astryx") {
        return state;
      }
      return {
        ...state,
        renderedPreference: copyPreference(state.desiredPreference),
        renderedDesignSystem: "astryx",
        transitionStatus: state.error ? "error" : "ready",
        transitionId: null,
        error: state.error,
      };
    case "commit-shadcn":
      return {
        desiredPreference: copyPreference(action.preference),
        renderedPreference: copyPreference(action.preference),
        renderedDesignSystem: "shadcn",
        transitionStatus: "idle",
        transitionId: null,
        error: null,
      };
    case "fail":
      if (action.transitionId !== null && state.transitionId !== action.transitionId) {
        return state;
      }
      return {
        desiredPreference: copyPreference(action.fallback),
        renderedPreference: copyPreference(action.fallback),
        renderedDesignSystem: "shadcn",
        transitionStatus: "error",
        transitionId: null,
        error: action.error,
      };
    case "report-error":
      return {...state, transitionStatus: "error", error: action.error};
  }
}

export interface AnimationFrameScheduler {
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(handle: number): void;
}

export interface RendererReadinessCoordinatorOptions {
  scheduler: AnimationFrameScheduler;
  onReady(transitionId: number): void;
  onFailure(transitionId: number, error: Error): void;
}

export interface RendererReadinessCoordinator {
  begin(transitionId: number): void;
  cancel(): void;
  register(id: string): () => void;
  markReady(id: string): void;
  fail(error: Error): void;
}

export function createRendererReadinessCoordinator(
  options: RendererReadinessCoordinatorOptions,
): RendererReadinessCoordinator {
  const registrations = new Map<string, number>();
  const ready = new Set<string>();
  let activeTransition: number | null = null;
  let frame: number | null = null;

  const cancelFrame = () => {
    if (frame === null) return;
    options.scheduler.cancelAnimationFrame(frame);
    frame = null;
  };

  const allRegisteredSlotsAreReady = () => {
    if (registrations.size === 0) return false;
    for (const id of registrations.keys()) {
      if (!ready.has(id)) return false;
    }
    return true;
  };

  const scheduleIfReady = () => {
    if (activeTransition === null || frame !== null || !allRegisteredSlotsAreReady()) return;
    const scheduledTransition = activeTransition;
    frame = options.scheduler.requestAnimationFrame(() => {
      frame = null;
      if (activeTransition !== scheduledTransition || !allRegisteredSlotsAreReady()) return;
      activeTransition = null;
      options.onReady(scheduledTransition);
    });
  };

  return {
    begin(transitionId) {
      cancelFrame();
      activeTransition = transitionId;
      ready.clear();
      scheduleIfReady();
    },
    cancel() {
      cancelFrame();
      activeTransition = null;
      ready.clear();
    },
    register(id) {
      const previousCount = registrations.get(id) ?? 0;
      registrations.set(id, previousCount + 1);
      if (previousCount === 0) {
        ready.delete(id);
        cancelFrame();
      }
      let registered = true;
      return () => {
        if (!registered) return;
        registered = false;
        const count = registrations.get(id) ?? 0;
        if (count <= 1) {
          registrations.delete(id);
          ready.delete(id);
          cancelFrame();
          scheduleIfReady();
        } else {
          registrations.set(id, count - 1);
        }
      };
    },
    markReady(id) {
      if (activeTransition === null || !registrations.has(id)) return;
      ready.add(id);
      scheduleIfReady();
    },
    fail(error) {
      if (activeTransition === null) return;
      const failedTransition = activeTransition;
      cancelFrame();
      activeTransition = null;
      ready.clear();
      options.onFailure(failedTransition, error);
    },
  };
}
