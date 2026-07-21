"use client";

import {useSyncExternalStore} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import {Link} from "@astryxdesign/core/Link";
import {
  proportional,
  Table,
} from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useAppearance } from "@/components/appearance/use-appearance";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";

const AstryxFoundationReadinessSlot = dynamic(
  () => {
    if (new URLSearchParams(window.location.search).get("renderer-failure") === "import") {
      return Promise.reject(new Error("Injected Astryx lazy view import failure."));
    }
    return import("./renderer-state-preservation-probe").then((module) => module.RendererStatePreservationProbe);
  },
  {ssr: false},
);

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
  const isEnabled = useSyncExternalStore(
    subscribeToLocation,
    getProbeQuerySnapshot,
    getServerProbeQuerySnapshot,
  );
  const isVisible = pathname === "/login" && isEnabled;

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
      <ThemeRegion mode="light" />
      <ThemeRegion mode="dark" />
      <RendererViewSwitch
        AstryxView={AstryxFoundationReadinessSlot}
        currentView={null}
        slotId="astryx-foundation-probe"
      />
    </section>
  );
}
