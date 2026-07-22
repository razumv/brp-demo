"use client";

import type {ReactNode} from "react";
import {useAppearance} from "@/components/appearance/use-appearance";
import {BrpUiProvider} from "./brp-ui-provider";
import {astryxAdapter} from "./astryx-adapter";
import {currentAdapter} from "./current-adapter";

export function AdaptiveBrpUiProvider({children}: {children: ReactNode}) {
  const {renderedDesignSystem} = useAppearance();

  return (
    <div data-dealer-ui-renderer={renderedDesignSystem}>
      <BrpUiProvider adapter={renderedDesignSystem === "astryx" ? astryxAdapter : currentAdapter}>
        {children}
      </BrpUiProvider>
    </div>
  );
}
