import type { WorkshopOrder } from "@/lib/types";

export type WorkshopStage = Readonly<{
  id: WorkshopOrder["status"];
  label: string;
  tone: "orange" | "blue" | "amber" | "green";
}>;

export const workshopStages = [
  { id: "new", label: "Нові", tone: "orange" },
  { id: "scheduled", label: "Заплановані", tone: "blue" },
  { id: "in_progress", label: "В роботі", tone: "amber" },
  { id: "done", label: "Готові", tone: "green" },
] as const satisfies readonly WorkshopStage[];

export const workshopTypeLabels = {
  maintenance: "ТО",
  repair: "Ремонт",
  warranty: "Гарантія",
  inspection: "Огляд",
  recall: "Recall",
} as const satisfies Record<WorkshopOrder["type"], string>;

export const workshopTransitionCapability = {
  status: "unavailable",
  reason:
    "Зміна статусу недоступна: підтверджено лише створення нового замовлення-наряду.",
} as const;

export function getWorkshopColumnCounts(orders: readonly WorkshopOrder[]) {
  return workshopStages.reduce<Record<WorkshopOrder["status"], number>>(
    (counts, stage) => {
      counts[stage.id] = orders.filter((order) => order.status === stage.id).length;
      return counts;
    },
    { new: 0, scheduled: 0, in_progress: 0, done: 0 },
  );
}

export function groupWorkshopOrders(orders: readonly WorkshopOrder[]) {
  return workshopStages.map((stage) => ({
    stage,
    orders: orders.filter((order) => order.status === stage.id),
  }));
}
