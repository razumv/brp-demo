"use client";

import {useLayoutEffect} from "react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";

/**
 * Environment/query-gated readiness target used by production foundation tests. It is
 * intentionally invisible in normal builds and demonstrates that a lazy Astryx slot can
 * commit without remounting its stable route, workflow, or shell ancestors.
 */
export function RendererStatePreservationProbe({onReady}: AstryxRendererViewProps) {
  if (new URLSearchParams(window.location.search).get("renderer-failure") === "render") {
    throw new Error("Injected Astryx lazy view render failure.");
  }

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return <output aria-hidden="true" data-testid="renderer-state-preservation-probe" />;
}
