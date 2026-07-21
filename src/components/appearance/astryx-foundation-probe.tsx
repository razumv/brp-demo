"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { LayerProvider } from "@astryxdesign/core/Layer";
import { Link, LinkProvider } from "@astryxdesign/core/Link";
import {
  proportional,
  Table,
} from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Theme } from "@astryxdesign/core/theme";
import { useAppearance } from "@/components/appearance/use-appearance";
import { neutralTheme } from "@/themes/neutral/neutral";

type ThemeRegionProps = {
  mode: "light" | "dark";
};

const foundationRows = [{ part: "Foundation row" }];

const foundationColumns = [
  {
    key: "part",
    header: "Foundation column",
    width: proportional(1),
  },
];

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getProbeQuerySnapshot() {
  return new URLSearchParams(window.location.search).get("astryx-foundation-probe") === "1";
}

function getServerProbeQuerySnapshot() {
  return false;
}

function ThemeRegion({ mode }: ThemeRegionProps) {
  return (
    <section data-testid={`astryx-foundation-${mode}`}>
      <Button label="Foundation action" variant="primary" />
      <TextInput
        isLabelHidden
        label="Foundation input"
        onChange={() => {}}
        value=""
      />
      <Card data-testid={`astryx-foundation-card-${mode}`} padding={4}>
        Foundation card
      </Card>
      <Table columns={foundationColumns} data={foundationRows} />
      <Link href="/" label="Foundation link">
        Foundation link
      </Link>
    </section>
  );
}

/** Gated production probe for validating Astryx's compiled CSS foundation. */
export function AstryxFoundationProbe() {
  const pathname = usePathname();
  const appearance = useAppearance();
  const {markRendererSlotReady, registerRendererSlot} = appearance;
  const isEnabled = useSyncExternalStore(
    subscribeToLocation,
    getProbeQuerySnapshot,
    getServerProbeQuerySnapshot,
  );
  const isVisible = pathname === "/login" && isEnabled;

  useLayoutEffect(() => {
    if (!isVisible) return;
    const unregister = registerRendererSlot("astryx-foundation-probe");
    const frame = window.requestAnimationFrame(() => {
      markRendererSlotReady("astryx-foundation-probe");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      unregister();
    };
  }, [
    markRendererSlotReady,
    registerRendererSlot,
    isVisible,
  ]);

  if (!isVisible) return null;

  return (
    <section
      data-design-system="astryx"
      data-provider-color-mode={appearance.desiredPreference.colorMode}
      data-provider-design-system={appearance.desiredPreference.designSystem}
      data-provider-error={appearance.error ?? ""}
      data-provider-status={appearance.transitionStatus}
      data-testid="astryx-foundation-probe"
    >
      <LinkProvider component={NextLink}>
        <LayerProvider>
          <Theme mode="light" theme={neutralTheme}>
            <ThemeRegion mode="light" />
            <Theme mode="dark" theme={neutralTheme}>
              <ThemeRegion mode="dark" />
            </Theme>
          </Theme>
        </LayerProvider>
      </LinkProvider>
    </section>
  );
}
