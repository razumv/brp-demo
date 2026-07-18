export type AirFreightTone =
  | "neutral"
  | "blue"
  | "amber"
  | "orange"
  | "red"
  | "purple"
  | "green";

export type AirFreightWorkflowStep = {
  id: string;
  label: string;
  count: number;
  tone: AirFreightTone;
};

export type AirFreightKpi = {
  id: "supplier-orders" | "in-transit" | "scan" | "shortage" | "completed" | "ready";
  label: string;
  value: string;
  tone: AirFreightTone;
};

export type AirFreightShipmentMetric = {
  id: "total" | "in-transit" | "delivered" | "completed";
  label: string;
  value: number;
  tone: AirFreightTone;
};

export type AirFreightEvent = {
  id: string;
  occurredAt: string;
  title: string;
  detail: string;
  tone: AirFreightTone;
};

export type AirFreightShipmentStatus = "in-transit" | "received";

export type AirFreightShipment = {
  id: string;
  awb: string;
  proforma: string;
  shipmentNumber: string;
  status: AirFreightShipmentStatus;
};

export const airFreightWorkflowSteps: readonly AirFreightWorkflowStep[] = [
  { id: "supplier-order", label: "SO створено", count: 0, tone: "blue" },
  { id: "consolidation", label: "Консолідація", count: 28, tone: "amber" },
  { id: "in-transit", label: "В дорозі", count: 0, tone: "orange" },
  { id: "delivered", label: "Доставлено", count: 0, tone: "red" },
  { id: "receiving", label: "Приймання", count: 0, tone: "purple" },
  { id: "ready", label: "Готово", count: 0, tone: "green" },
  { id: "sent", label: "Відправлено дилеру", count: 0, tone: "green" },
];

export const airFreightKpis: readonly AirFreightKpi[] = [
  { id: "supplier-orders", label: "Замовлення постачальнику", value: "0", tone: "blue" },
  { id: "in-transit", label: "В дорозі", value: "0", tone: "amber" },
  { id: "scan", label: "Очікує сканування", value: "0", tone: "purple" },
  { id: "shortage", label: "Нестача", value: "0", tone: "red" },
  { id: "completed", label: "Виконано", value: "0%", tone: "green" },
  { id: "ready", label: "Готово до відправки", value: "0", tone: "green" },
];

export const airFreightShipmentMetrics: readonly AirFreightShipmentMetric[] = [
  { id: "total", label: "Всього", value: 0, tone: "neutral" },
  { id: "in-transit", label: "В дорозі", value: 0, tone: "amber" },
  { id: "delivered", label: "Доставлено", value: 0, tone: "orange" },
  { id: "completed", label: "Завершено", value: 0, tone: "green" },
];

export const airFreightEvents: readonly AirFreightEvent[] = [
  {
    id: "log-01-message",
    occurredAt: "Jul 18, 01:42 AM",
    title: "New message — LOG-01",
    detail: "LOG-01: CODEX QA — тестове повідомлення по демонстраційному замовленню",
    tone: "blue",
  },
  {
    id: "log-01-order",
    occurredAt: "Jul 18, 01:40 AM",
    title: "New Order — LOG-01",
    detail: "Order LOG-01 — $13.09",
    tone: "blue",
  },
  {
    id: "bossweb-unmapped-56",
    occurredAt: "Jul 17, 08:51 AM",
    title: "BossWeb: 56 груп без однозначної SO связи",
    detail: "В BossWeb є замовлення без однозначної SO связи: AIR 15072026, Air 14072026, AIR 13072026, Email Artem 13/07, AIR 09072026, AIR 07072026 +50. SO не створюється автоматично з BossWeb. Перевірте тип замовлення.",
    tone: "amber",
  },
  {
    id: "bossweb-unmapped-55",
    occurredAt: "Jul 14, 01:40 PM",
    title: "BossWeb: 55 груп без однозначної SO связи",
    detail: "В BossWeb є замовлення без однозначної SO связи: Air 14072026, AIR 13072026, Email Artem 13/07, AIR 09072026, AIR 07072026, Air 05072026 +48.",
    tone: "amber",
  },
];

// The observed source shipment list is empty. Do not add representative source rows here.
export const airFreightShipments: readonly AirFreightShipment[] = [];
