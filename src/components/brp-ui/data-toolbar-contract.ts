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
}>;

export function useDismissibleDataToolbarFilter({
  open,
  onOpenChange,
  triggerRef,
  panelRef,
}: DismissibleDataToolbarFilter) {
  useEffect(() => {
    if (!open) return;

    const dismiss = () => onOpenChange(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      dismiss();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onOpenChange, open, panelRef, triggerRef]);
}
