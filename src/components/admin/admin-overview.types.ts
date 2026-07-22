export type AdminOverviewTone = "amber" | "blue" | "green" | "neutral" | "orange" | "red";

export type AdminOverviewMetricIcon = "delivered" | "orders" | "processing" | "revenue";

export type AdminOverviewMetric = {
  label: string;
  value: number | string;
  helper: string;
  tone: AdminOverviewTone;
  icon: AdminOverviewMetricIcon;
};

export type AdminOverviewQueueItem = {
  label: string;
  value: number;
  tone: "green" | "neutral";
};

export type AdminOverviewDistributionItem = {
  label: string;
  value: number;
  count: number;
};

export type AdminOverviewOrderStatus = "cancelled" | "done" | "new" | "waiting";

export type AdminOverviewRecentOrder = {
  id: string;
  code: string;
  dealer: string;
  contact: string;
  date: string;
  amount: number;
  href: string;
  status: AdminOverviewOrderStatus;
};

export type AdminOverviewModel = {
  metrics: readonly AdminOverviewMetric[];
  queue: readonly AdminOverviewQueueItem[];
  distribution: readonly AdminOverviewDistributionItem[];
  recentOrders: readonly AdminOverviewRecentOrder[];
};
