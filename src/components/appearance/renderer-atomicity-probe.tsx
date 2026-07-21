"use client";

import {useLayoutEffect} from "react";
import {Card} from "@astryxdesign/core/Card";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";

export type RendererAtomicityProbeProps = {
  label: string;
};

/** A second real Astryx slot used only by the gated atomic-transition test. */
export function RendererAtomicityProbe({
  label,
  onReady,
}: RendererAtomicityProbeProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <Card data-testid="renderer-secondary-astryx-view" padding={4}>
      {label}
    </Card>
  );
}
