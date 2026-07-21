import type { DealerCustomer } from "@/lib/dealer/contracts";
import { normalizeDealerSearch } from "@/lib/dealer/format";
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

export type WorkshopFilters = Readonly<{
  query: string;
  stages: readonly WorkshopOrder["status"][];
  types: readonly WorkshopOrder["type"][];
}>;

export function filterWorkshopOrders(
  orders: readonly WorkshopOrder[],
  customers: readonly DealerCustomer[],
  filters: WorkshopFilters,
) {
  const query = normalizeDealerSearch(filters.query);
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));

  return orders.filter((order) => {
    if (filters.stages.length && !filters.stages.includes(order.status)) return false;
    if (filters.types.length && !filters.types.includes(order.type)) return false;
    if (!query) return true;
    return [
      order.description,
      customerNames.get(order.customerId) ?? "",
      order.mechanic,
      order.notes,
    ].some((value) => normalizeDealerSearch(value).includes(query));
  });
}

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
