"use client";

import { useEffect, type ReactNode, type RefObject } from "react";

export const DATA_TOOLBAR_FILTER_FIELDS = [
  "label",
  "activeCount",
  "open",
  "onOpenChange",
  "panelId",
  "content",
  "onClear",
] as const;

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
  dismissOnPointerOutside?: boolean;
}>;

export function useDismissibleDataToolbarFilter({
  open,
  onOpenChange,
  triggerRef,
  panelRef,
  dismissOnPointerOutside = true,
}: DismissibleDataToolbarFilter) {
  useEffect(() => {
    if (!open) return;

    const dismiss = () => onOpenChange(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      dismiss();
    };

    document.addEventListener("keydown", onKeyDown);
    if (dismissOnPointerOutside) document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (dismissOnPointerOutside) document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [dismissOnPointerOutside, onOpenChange, open, panelRef, triggerRef]);
}
