"use client";

import {createContext, useContext} from "react";
import type {AppearancePreferenceV1, DesignSystem, ResolvedTheme} from "@/lib/appearance";
import type {AppearanceTransitionStatus} from "@/lib/appearance/renderer-readiness";

export interface AppearanceContextValue {
  desiredPreference: AppearancePreferenceV1;
  renderedPreference: AppearancePreferenceV1;
  renderedColorMode: AppearancePreferenceV1["colorMode"];
  renderedDesignSystem: DesignSystem;
  rendererTransitionId: number | null;
  resolvedTheme: ResolvedTheme;
  transitionStatus: AppearanceTransitionStatus;
  error: string | null;
  updatePreference(preference: AppearancePreferenceV1): Promise<boolean>;
  registerRendererSlot(id: string): () => void;
  markRendererSlotReady(id: string): void;
  failRendererTransition(error: Error): void;
}

export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function useAppearance(): AppearanceContextValue {
  const value = useContext(AppearanceContext);
  if (!value) {
    throw new Error("useAppearance must be used within AppearanceProvider.");
  }
  return value;
}
