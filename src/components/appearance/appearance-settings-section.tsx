"use client";

import {useCallback, useState} from "react";
import {CurrentBrpUiProvider} from "@/components/brp-ui/current-brp-ui-provider";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {useAppearance} from "@/components/appearance/use-appearance";
import type {ColorMode, DesignSystem} from "@/lib/appearance";
import {
  CurrentAppearanceSettingsView,
  type AppearanceSettingsViewProps,
} from "./current-appearance-settings-view";

const loadAstryxAppearanceSettingsView = () => import("./astryx-appearance-settings-view");

export function AppearanceSettingsSection() {
  const {
    desiredPreference,
    renderedDesignSystem,
    transitionStatus,
    error,
    updatePreference,
  } = useAppearance();
  const [writePending, setWritePending] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const busy = writePending || transitionStatus === "loading-astryx";

  const persist = useCallback(async (
    update: Partial<Pick<typeof desiredPreference, "designSystem" | "colorMode">>,
  ) => {
    if (writePending) return;
    const nextPreference = {...desiredPreference, ...update};
    if (
      nextPreference.designSystem === desiredPreference.designSystem &&
      nextPreference.colorMode === desiredPreference.colorMode
    ) return;

    setWritePending(true);
    setWriteError(null);
    const saved = await updatePreference(nextPreference);
    if (!saved) setWriteError("Не вдалося зберегти налаштування оформлення.");
    setWritePending(false);
  }, [desiredPreference, updatePreference, writePending]);

  const handleDesignSystemChange = useCallback((designSystem: DesignSystem) => {
    void persist({designSystem});
  }, [persist]);

  const handleColorModeChange = useCallback((colorMode: ColorMode) => {
    void persist({colorMode});
  }, [persist]);

  const viewProps: AppearanceSettingsViewProps = {
    designSystem: desiredPreference.designSystem,
    activeDesignSystem: renderedDesignSystem,
    colorMode: desiredPreference.colorMode,
    busy,
    error: error ?? writeError,
    onDesignSystemChange: handleDesignSystemChange,
    onColorModeChange: handleColorModeChange,
  };

  return (
    <RendererViewSwitch
      slotId="admin-settings-appearance"
      currentView={(
        <CurrentBrpUiProvider>
          <CurrentAppearanceSettingsView {...viewProps} />
        </CurrentBrpUiProvider>
      )}
      loadAstryxView={loadAstryxAppearanceSettingsView}
      astryxViewProps={viewProps}
    />
  );
}
