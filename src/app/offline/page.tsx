"use client";

import {useCallback, useEffect} from "react";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {CurrentBrpUiProvider} from "@/components/brp-ui/current-brp-ui-provider";
import { publicAssetPath } from "@/lib/public-base-path";
import {CurrentOfflineView} from "./current-offline-view";
import type {AstryxOfflineViewProps} from "./astryx-offline-view";

const loadAstryxOfflineView = () => import("./astryx-offline-view");

export default function OfflinePage() {
  const retry = useCallback(() => window.location.reload(), []);

  useEffect(() => {
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [retry]);

  const viewProps: AstryxOfflineViewProps = {
    homeHref: publicAssetPath("/"),
    onRetry: retry,
  };

  return (
    <RendererViewSwitch
      astryxViewProps={viewProps}
      currentView={(
        <CurrentBrpUiProvider>
          <CurrentOfflineView {...viewProps} />
        </CurrentBrpUiProvider>
      )}
      loadAstryxView={loadAstryxOfflineView}
      slotId="offline-screen"
    />
  );
}
