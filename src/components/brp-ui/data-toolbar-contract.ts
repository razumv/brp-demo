"use client";

import { useEffect, type ReactNode, type RefObject } from "react";

export type DataToolbarFilterContract = Readonly<{
  label: string;
  activeCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelId: string;
  content: ReactNode;
  onClear?: () => void;
}>;

type DismissibleDataToolbarFilter = Pick<DataToolbarFilterContract, "open" | "onOpenChange"> & Readonly<{
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  additionalTriggerRef?: RefObject<HTMLElement | null>;
  additionalPanelRef?: RefObject<HTMLElement | null>;
  dismissOnPointerOutside?: boolean;
}>;

export function useDismissibleDataToolbarFilter({
  open,
  onOpenChange,
  triggerRef,
  panelRef,
  additionalTriggerRef,
  additionalPanelRef,
  dismissOnPointerOutside = true,
}: DismissibleDataToolbarFilter) {
  useEffect(() => {
    if (!open) return;

    const dismiss = () => onOpenChange(false);
    const triggerRefs = [triggerRef, additionalTriggerRef].filter(Boolean) as RefObject<HTMLElement | null>[];
    const panelRefs = [panelRef, additionalPanelRef].filter(Boolean) as RefObject<HTMLElement | null>[];
    const focusVisibleTrigger = () => {
      const visibleTrigger = triggerRefs
        .map((ref) => ref.current)
        .find((element) => element && element.getClientRects().length > 0);
      visibleTrigger?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      dismiss();
      focusVisibleTrigger();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRefs.some((ref) => ref.current?.contains(target))) return;
      if (panelRefs.some((ref) => ref.current?.contains(target))) return;
      dismiss();
    };

    document.addEventListener("keydown", onKeyDown);
    if (dismissOnPointerOutside) document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (dismissOnPointerOutside) document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [additionalPanelRef, additionalTriggerRef, dismissOnPointerOutside, onOpenChange, open, panelRef, triggerRef]);
}
