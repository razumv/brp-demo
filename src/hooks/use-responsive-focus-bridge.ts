"use client";

import {useLayoutEffect, useRef, type FocusEventHandler} from "react";

export function useResponsiveFocusBridge(mode: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const lastLabelRef = useRef<string | null>(null);
  const previousModeRef = useRef(mode);

  const onFocusCapture: FocusEventHandler<HTMLDivElement> = (event) => {
    lastKeyRef.current = event.target.closest<HTMLElement>("[data-focus-key]")?.dataset.focusKey ?? null;
    lastLabelRef.current = event.target.getAttribute("aria-label");
  };

  useLayoutEffect(() => {
    if (previousModeRef.current === mode) return;
    previousModeRef.current = mode;
    if (document.activeElement !== document.body) return;
    const key = lastKeyRef.current;
    const label = lastLabelRef.current;
    const keyedControl = key
      ? rootRef.current
        ?.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)
        ?.querySelector<HTMLElement>("button, a, input, select, textarea, [tabindex]")
      : null;
    const labelledControl = label
      ? rootRef.current?.querySelector<HTMLElement>(`[aria-label="${CSS.escape(label)}"]`)
      : null;
    (keyedControl ?? labelledControl)?.focus();
  }, [mode]);

  return [rootRef, onFocusCapture] as const;
}
