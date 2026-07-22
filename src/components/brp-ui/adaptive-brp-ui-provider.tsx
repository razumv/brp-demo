"use client";

import {useLayoutEffect, useInsertionEffect, type ReactNode} from "react";
import {useAppearance} from "@/components/appearance/use-appearance";
import {BrpUiProvider} from "./brp-ui-provider";
import {astryxAdapter} from "./astryx-adapter";
import {currentAdapter} from "./current-adapter";

export function AdaptiveBrpUiProvider({children}: {children: ReactNode}) {
  const {
    desiredPreference,
    markRendererSlotReady,
    registerRendererSlot,
    rendererAttemptId,
    renderedDesignSystem,
  } = useAppearance();
  const wantsAstryx = desiredPreference.designSystem === "astryx";
  const attemptSlotId = `${rendererAttemptId}:adaptive-brp-ui-provider`;

  useInsertionEffect(() => {
    if (!wantsAstryx) return;
    return registerRendererSlot(attemptSlotId);
  }, [attemptSlotId, registerRendererSlot, wantsAstryx]);

  useLayoutEffect(() => {
    if (!wantsAstryx) return;
    markRendererSlotReady(attemptSlotId);
  }, [attemptSlotId, markRendererSlotReady, wantsAstryx]);

  return (
    <div data-dealer-ui-renderer={renderedDesignSystem}>
      <BrpUiProvider adapter={renderedDesignSystem === "astryx" ? astryxAdapter : currentAdapter}>
        {children}
      </BrpUiProvider>
    </div>
  );
}
