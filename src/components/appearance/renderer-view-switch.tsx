"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useInsertionEffect,
  useState,
} from "react";
import {AstryxViewBoundary} from "@/components/appearance/astryx-view-boundary";
import {useAppearance} from "@/components/appearance/use-appearance";

export type AstryxRendererViewProps = {onReady(): void};
export type AstryxRendererViewModule<Props extends object> = {
  default: React.ComponentType<Props & AstryxRendererViewProps>;
};
export type AstryxRendererViewLoader<Props extends object> = () => Promise<
  AstryxRendererViewModule<Props>
>;

type RendererViewSwitchProps<Props extends object> = {
  slotId: string;
  currentView: React.ReactNode;
  loadAstryxView: AstryxRendererViewLoader<Props>;
  astryxViewProps: Props;
};

function LazyAstryxAttempt<Props extends object>({
  loadAstryxView,
  astryxViewProps,
  onReady,
}: {
  loadAstryxView: AstryxRendererViewLoader<Props>;
  astryxViewProps: Props;
  onReady(): void;
}) {
  const [AstryxView] = useState(() => lazy(loadAstryxView));
  return <AstryxView {...astryxViewProps} onReady={onReady} />;
}

/**
 * Switches only a renderer view below durable controllers. The current view is the SSR,
 * Suspense, and error fallback; readiness is reported only after the lazy view commits.
 */
export function RendererViewSwitch<Props extends object>({
  slotId,
  currentView,
  loadAstryxView,
  astryxViewProps,
}: RendererViewSwitchProps<Props>) {
  const {
    desiredPreference,
    failRendererTransition,
    markRendererSlotReady,
    registerRendererSlot,
    rendererAttemptId,
  } = useAppearance();
  const wantsAstryx = desiredPreference.designSystem === "astryx";
  const attemptSlotId = `${rendererAttemptId}:${slotId}`;
  const handleReady = useCallback(
    () => markRendererSlotReady(attemptSlotId),
    [attemptSlotId, markRendererSlotReady],
  );

  useInsertionEffect(() => {
    if (!wantsAstryx) return;
    return registerRendererSlot(attemptSlotId);
  }, [attemptSlotId, registerRendererSlot, wantsAstryx]);

  if (!wantsAstryx) return currentView;

  return (
    <AstryxViewBoundary
      fallback={currentView}
      onFailure={failRendererTransition}
      resetKey={rendererAttemptId}
    >
      <Suspense fallback={currentView}>
        <LazyAstryxAttempt
          key={rendererAttemptId}
          astryxViewProps={astryxViewProps}
          loadAstryxView={loadAstryxView}
          onReady={handleReady}
        />
      </Suspense>
    </AstryxViewBoundary>
  );
}
