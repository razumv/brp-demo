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
  const counts: Record<WorkshopOrder["status"], number> = {
    new: 0,
    scheduled: 0,
    in_progress: 0,
    done: 0,
  };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

export function groupWorkshopOrders(orders: readonly WorkshopOrder[]) {
  const ordersByStage: Record<WorkshopOrder["status"], WorkshopOrder[]> = {
    new: [],
    scheduled: [],
    in_progress: [],
    done: [],
  };
  for (const order of orders) ordersByStage[order.status].push(order);
  return workshopStages.map((stage) => ({
    stage,
    orders: ordersByStage[stage.id],
  }));
}
