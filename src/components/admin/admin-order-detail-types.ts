import type {AdminLineStatus, AdminOrderFixture} from "@/lib/admin-order-data";

export type LineFilter = "all" | AdminLineStatus;
export type PreflightView = "error" | "representative";
export type DeliveryChannel = "air" | "ocean";

/**
 * Stable detail-screen contract shared by both renderers. The controller owns
 * every mutable value so changing the design system never resets the workflow.
 */
export type AdminOrderDetailViewModel = {
  order: AdminOrderFixture;
  lineFilter: LineFilter;
  setLineFilter(filter: LineFilter): void;
  timelineOpen: boolean;
  toggleTimeline(): void;
  chatOpen: boolean;
  setChatOpen(open: boolean): void;
  preflightOpen: boolean;
  setPreflightOpen(open: boolean): void;
  preflightView: PreflightView;
  setPreflightView(view: PreflightView): void;
  delivery: DeliveryChannel;
  setDelivery(delivery: DeliveryChannel): void;
  replenishment: number;
  setReplenishment(value: number): void;
  hasCapturedPreflight: boolean;
};
