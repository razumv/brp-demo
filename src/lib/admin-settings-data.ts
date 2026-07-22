export type SettingsSectionId = "appearance" | "workers" | "queue" | "database";

export type WorkerOption = {
  readonly value: number;
  readonly label: string;
};

export type QueueMetricTone = "neutral" | "blue" | "green" | "red";

export type QueueMetric = {
  readonly id: "pending" | "active" | "completed" | "failed";
  readonly label: string;
  readonly value: number;
  readonly tone: QueueMetricTone;
};

export type QueueActionTone = "neutral" | "danger";

export type QueueAction = {
  readonly id: "clear-completed" | "clear-failed" | "reset-counters" | "clear-pending";
  readonly label: string;
  readonly tone: QueueActionTone;
};

export type DatabaseSetting = {
  readonly id: "connection" | "type" | "database";
  readonly label: string;
  readonly value: string;
  readonly connected?: boolean;
};

export const SETTINGS_EMPTY_COPY = "Нічого не знайдено";

export const selectedWorkerCount = 2;

export const workerOptions: readonly WorkerOption[] = [
  { value: 1, label: "1 воркер" },
  { value: 2, label: "2 воркерів" },
  { value: 3, label: "3 воркерів" },
  { value: 4, label: "4 воркерів" },
  { value: 5, label: "5 воркерів" },
  { value: 10, label: "10 воркерів" },
  { value: 20, label: "20 воркерів" },
  { value: 50, label: "50 воркерів" },
];

export const workerExplanation = "Кількість паралельних завдань, які може обробляти воркер. Більші значення пришвидшують обробку, але споживають більше ресурсів.";

export const queueMetrics: readonly QueueMetric[] = [
  { id: "pending", label: "В очікуванні", value: 0, tone: "neutral" },
  { id: "active", label: "Активних", value: 0, tone: "blue" },
  { id: "completed", label: "Виконано", value: 0, tone: "green" },
  { id: "failed", label: "З помилкою", value: 0, tone: "red" },
];

export const queueActions: readonly QueueAction[] = [
  { id: "clear-completed", label: "Очистити виконані (0)", tone: "neutral" },
  { id: "clear-failed", label: "Очистити з помилкою (0)", tone: "neutral" },
  { id: "reset-counters", label: "Скинути лічильники", tone: "neutral" },
  { id: "clear-pending", label: "Очистити всі в очікуванні", tone: "danger" },
];

export const databaseSettings: readonly DatabaseSetting[] = [
  { id: "connection", label: "Підключення", value: "Підключено", connected: true },
  { id: "type", label: "Тип", value: "PostgreSQL 16" },
  { id: "database", label: "База даних", value: "brp_catalog" },
];

export const settingsSectionOrder: readonly SettingsSectionId[] = ["appearance", "workers", "queue", "database"];

const settingsSearchIndex: Readonly<Record<SettingsSectionId, string>> = {
  appearance: [
    "Оформлення",
    "Дизайн-система",
    "shadcn/ui",
    "Astryx Neutral",
    "Колірна тема",
    "Системна",
    "Світла",
    "Темна",
  ].join(" "),
  workers: [
    "Налаштування воркерів",
    "Паралельність воркерів",
    workerExplanation,
    ...workerOptions.map((option) => option.label),
  ].join(" "),
  queue: [
    "Керування чергою",
    "черга queue",
    ...queueMetrics.map((metric) => metric.label),
    ...queueActions.map((action) => action.label),
  ].join(" "),
  database: [
    "База даних",
    ...databaseSettings.flatMap((setting) => [setting.label, setting.value]),
  ].join(" "),
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

export function filterSettingsSections(query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return settingsSectionOrder;
  return settingsSectionOrder.filter((section) => normalize(settingsSearchIndex[section]).includes(normalizedQuery));
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Admin settings fixture invariant failed: ${message}`);
}

export function assertSettingsDataInvariants() {
  assert(workerOptions.length === 8, "eight worker options");
  assert(workerOptions.map((option) => option.value).join(",") === "1,2,3,4,5,10,20,50", "worker option values");
  assert(workerOptions.find((option) => option.value === selectedWorkerCount)?.label === "2 воркерів", "selected worker value");
  assert(queueMetrics.length === 4 && queueMetrics.every((metric) => metric.value === 0), "queue 0/0/0/0");
  assert(queueActions.length === 4, "four queue actions");
  assert(databaseSettings[0]?.label === "Підключення" && databaseSettings[0].value === "Підключено", "database connection");
  assert(databaseSettings[1]?.value === "PostgreSQL 16", "database type");
  assert(databaseSettings[2]?.value === "brp_catalog", "database name");
  assert(filterSettingsSections("").join(",") === "appearance,workers,queue,database", "baseline search");
  assert(filterSettingsSections("оформлення").join(",") === "appearance", "appearance search");
  assert(filterSettingsSections("Astryx").join(",") === "appearance", "design system search");
  assert(filterSettingsSections("темна").join(",") === "appearance", "color mode search");
  assert(filterSettingsSections("воркер").join(",") === "workers", "worker search");
  assert(filterSettingsSections("черг").join(",") === "queue", "queue search");
  assert(filterSettingsSections("черга").join(",") === "queue", "queue nominative search");
  assert(filterSettingsSections("база").join(",") === "database", "database search");
  assert(filterSettingsSections("zzzz-no-result").length === 0, "no-result search");
  assert(SETTINGS_EMPTY_COPY === "Нічого не знайдено", "no-result copy");
}
