"use client";

import {Suspense, useInsertionEffect} from "react";
import {AstryxViewBoundary} from "@/components/appearance/astryx-view-boundary";
import {useAppearance} from "@/components/appearance/use-appearance";

export type AstryxRendererViewProps = {onReady(): void};

type RendererViewSwitchProps = {
  slotId: string;
  currentView: React.ReactNode;
  AstryxView: React.ComponentType<AstryxRendererViewProps>;
};

/**
 * Switches only a renderer view below durable controllers. The current view is the SSR,
 * Suspense, and error fallback; readiness is reported only after the lazy view commits.
 */
export function RendererViewSwitch({
  slotId,
  currentView,
  AstryxView,
}: RendererViewSwitchProps) {
  const {
    desiredPreference,
    failRendererTransition,
    markRendererSlotReady,
    registerRendererSlot,
    rendererTransitionId,
  } = useAppearance();
  const wantsAstryx = desiredPreference.designSystem === "astryx";

  useInsertionEffect(() => {
    if (!wantsAstryx) return;
    return registerRendererSlot(slotId);
  }, [registerRendererSlot, slotId, wantsAstryx]);

  if (!wantsAstryx) return currentView;

  return (
    <AstryxViewBoundary
      fallback={currentView}
      onFailure={failRendererTransition}
      resetKey={rendererTransitionId}
    >
      <Suspense fallback={currentView}>
        <AstryxView onReady={() => markRendererSlotReady(slotId)} />
      </Suspense>
    </AstryxViewBoundary>
  );
}
