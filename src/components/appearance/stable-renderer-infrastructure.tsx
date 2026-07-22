"use client";

import NextLink from "next/link";
import {LayerProvider} from "@astryxdesign/core/Layer";
import {LinkProvider} from "@astryxdesign/core/Link";
import {Theme} from "@astryxdesign/core/theme";
import {useAppearance} from "@/components/appearance/use-appearance";
import {currentCompatibilityTheme} from "@/themes/current/currentCompatibilityTheme";
import {neutralTheme} from "@/themes/neutral/neutral";

/**
 * Provider ancestry that remains mounted while renderer-specific views change below it.
 * The current renderer deliberately receives a compatibility theme so the root Theme can
 * own Astryx's required attributes without changing the existing component tree.
 */
export function StableRendererInfrastructure({children}: {children: React.ReactNode}) {
  const {renderedPreference, renderedColorMode} = useAppearance();
  const activeTheme = renderedPreference.designSystem === "astryx"
    ? neutralTheme
    : currentCompatibilityTheme;
  const resolvedMode = renderedColorMode;

  return (
    <Theme theme={activeTheme} mode={resolvedMode}>
      <LayerProvider>
        <LinkProvider component={NextLink}>{children}</LinkProvider>
      </LayerProvider>
    </Theme>
  );
}
