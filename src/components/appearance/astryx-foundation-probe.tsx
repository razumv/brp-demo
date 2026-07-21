"use client";

import {useSyncExternalStore} from "react";
import {RendererStateHarnessController} from "@/components/appearance/renderer-state-harness-controller";
import {useAppearance} from "@/components/appearance/use-appearance";

function waitForManualRendererGate(query: URLSearchParams) {
  if (query.get("renderer-gate") !== "manual") return Promise.resolve();
  const gateWindow = window as Window & {
    __BRP_RENDERER_GATE_RELEASED__?: boolean;
    __BRP_RENDERER_GATE_WAITING__?: boolean;
  };
  if (gateWindow.__BRP_RENDERER_GATE_RELEASED__) return Promise.resolve();
  gateWindow.__BRP_RENDERER_GATE_WAITING__ = true;
  return new Promise<void>((resolve) => {
    window.addEventListener("brp:renderer-gate-release", () => {
      gateWindow.__BRP_RENDERER_GATE_RELEASED__ = true;
      gateWindow.__BRP_RENDERER_GATE_WAITING__ = false;
      resolve();
    }, {once: true});
  });
}

function loadAstryxFoundationView() {
  const query = new URLSearchParams(window.location.search);
  if (query.get("renderer-failure") === "import") {
    return Promise.reject(new Error("Injected Astryx lazy view import failure."));
  }
  const delay = Number(query.get("renderer-delay") ?? 0);
  const load = () => import("./renderer-state-preservation-probe")
    .then((module) => ({default: module.RendererStatePreservationProbe}));
  const delayPromise = !Number.isFinite(delay) || delay <= 0
    ? Promise.resolve()
    : new Promise<void>((resolve) => window.setTimeout(resolve, delay));
  return Promise.all([waitForManualRendererGate(query), delayPromise]).then(load);
}

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

/** Gated production probe for validating Astryx's compiled CSS foundation. */
export function AstryxFoundationProbe() {
  const appearance = useAppearance();
  const isEnabled = useSyncExternalStore(
    subscribeToLocation,
    getProbeQuerySnapshot,
    getServerProbeQuerySnapshot,
  );
  if (!isEnabled) return null;

  return (
    <section
      data-design-system={appearance.renderedDesignSystem}
      data-provider-color-mode={appearance.desiredPreference.colorMode}
      data-provider-design-system={appearance.desiredPreference.designSystem}
      data-provider-error={appearance.error ?? ""}
      data-provider-status={appearance.transitionStatus}
      data-testid="astryx-foundation-probe"
    >
      <RendererStateHarnessController loadAstryxView={loadAstryxFoundationView} />
    </section>
  );
}
