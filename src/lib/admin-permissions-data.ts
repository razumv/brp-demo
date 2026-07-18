export type AdminPermissionRole = "manager" | "dealer";

export type AdminPermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "request"
  | "approve"
  | "export"
  | "ship";

export type AdminPermissionState = "on" | "off";

export type AdminPermissionIcon =
  | "package"
  | "pipeline"
  | "consignment"
  | "return"
  | "plane"
  | "receipt"
  | "ship"
  | "company"
  | "users"
  | "invoice"
  | "settlements"
  | "catalog"
  | "calendar"
  | "tasks"
  | "reports"
  | "dashboard"
  | "orders"
  | "warehouse"
  | "unit"
  | "network"
  | "workshop"
  | "search"
  | "prices"
  | "documents";

export interface AdminPermissionActionDefinition {
  readonly id: AdminPermissionAction;
  readonly label: string;
}

export interface AdminPermissionEntity {
  readonly id: string;
  readonly label: string;
  readonly icon: AdminPermissionIcon;
  readonly sectionBefore?: string;
  readonly permissions: Readonly<Partial<Record<AdminPermissionAction, AdminPermissionState>>>;
}

export interface AdminPermissionRoleDefinition {
  readonly id: AdminPermissionRole;
  readonly label: string;
  readonly actions: readonly AdminPermissionAction[];
  readonly entities: readonly AdminPermissionEntity[];
}

export interface AdminPermissionSummary {
  readonly checked: number;
  readonly total: number;
  readonly unchecked: number;
}

export const adminPermissionActions = [
  { id: "read", label: "Читання" },
  { id: "create", label: "Створення" },
  { id: "update", label: "Зміна" },
  { id: "delete", label: "Видалення" },
  { id: "request", label: "Запит" },
  { id: "approve", label: "Схвалення" },
  { id: "export", label: "Експорт" },
  { id: "ship", label: "Відвантаження" },
] as const satisfies readonly AdminPermissionActionDefinition[];

export const adminPermissionActionLabels = Object.fromEntries(
  adminPermissionActions.map((action) => [action.id, action.label]),
) as Readonly<Record<AdminPermissionAction, string>>;

export const managerPermissionEntities = [
  {
    id: "orders",
    label: "Замовлення",
    icon: "package",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "pipeline",
    label: "Пайплайн",
    icon: "pipeline",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "consignment",
    label: "Консигнація",
    icon: "consignment",
    permissions: { read: "on", request: "off", approve: "on", ship: "on" },
  },
  {
    id: "returns",
    label: "Повернення",
    icon: "return",
    permissions: { read: "on", create: "on", approve: "on" },
  },
  {
    id: "air-freight",
    label: "Авіафрахт",
    icon: "plane",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "receipt",
    label: "Приймання",
    icon: "receipt",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "ocean-freight",
    label: "Морський фрахт",
    icon: "ship",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "companies",
    label: "Компанії",
    icon: "company",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "users",
    label: "Користувачі",
    icon: "users",
    permissions: { read: "on", create: "off", update: "off", delete: "off" },
  },
  {
    id: "invoices",
    label: "Інвойси",
    icon: "invoice",
    permissions: { read: "off", create: "off", update: "off", delete: "off" },
  },
  {
    id: "settlements",
    label: "Взаєморозрахунки",
    icon: "settlements",
    permissions: { read: "on" },
  },
  {
    id: "catalog",
    label: "Каталог",
    icon: "catalog",
    permissions: { read: "on", create: "off", update: "on", delete: "off" },
  },
  {
    id: "schedule",
    label: "Розклад",
    icon: "calendar",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "tasks",
    label: "Завдання",
    icon: "tasks",
    permissions: { read: "on", create: "off", update: "off", delete: "off" },
  },
  {
    id: "reports",
    label: "Звіти",
    icon: "reports",
    permissions: { read: "on", create: "off" },
  },
] as const satisfies readonly AdminPermissionEntity[];

export const dealerPermissionEntities = [
  {
    id: "consignment",
    label: "Консигнація",
    icon: "consignment",
    permissions: { read: "on", request: "on", approve: "off", ship: "on" },
  },
  {
    id: "returns",
    label: "Повернення",
    icon: "return",
    permissions: { read: "on", create: "off", approve: "off" },
  },
  {
    id: "catalog",
    label: "Каталог",
    icon: "catalog",
    permissions: { read: "on", create: "off", update: "off", delete: "off" },
  },
  {
    id: "schedule",
    label: "Розклад",
    icon: "calendar",
    permissions: { read: "on", create: "off", update: "off", delete: "off" },
  },
  {
    id: "dealer-dashboard",
    label: "Панель дилера",
    icon: "dashboard",
    permissions: { read: "on" },
  },
  {
    id: "team-access",
    label: "Команда і доступи",
    icon: "users",
    permissions: { read: "on", update: "on" },
  },
  {
    id: "dealer-orders",
    label: "Мої замовлення",
    icon: "orders",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "dealer-settlements",
    label: "Взаєморозрахунки дилера",
    icon: "settlements",
    permissions: { read: "on", export: "on" },
  },
  {
    id: "parts-warehouse",
    label: "Склад запчастин",
    icon: "warehouse",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "units",
    label: "Юніти",
    icon: "unit",
    permissions: { read: "on", create: "on", update: "on", delete: "off" },
  },
  {
    id: "dealer-network",
    label: "Дилерська мережа",
    icon: "network",
    permissions: { read: "on", create: "on", update: "on", delete: "on" },
  },
  {
    id: "clients",
    label: "Клієнти",
    icon: "users",
    permissions: { read: "on", create: "on", update: "on", delete: "on" },
  },
  {
    id: "workshop",
    label: "Майстерня",
    icon: "workshop",
    permissions: { read: "on", create: "on", update: "on", delete: "on" },
  },
  {
    id: "parts-search",
    label: "Пошук запчастини",
    icon: "search",
    permissions: { read: "on" },
  },
  {
    id: "dealer-prices",
    label: "permissions.dealer_prices",
    icon: "prices",
    permissions: { read: "on" },
  },
  {
    id: "documents",
    label: "Документи",
    icon: "documents",
    sectionBefore: "Документи",
    permissions: { read: "on" },
  },
] as const satisfies readonly AdminPermissionEntity[];

export const adminPermissionRoles = [
  {
    id: "manager",
    label: "Менеджер",
    actions: ["read", "create", "update", "delete", "request", "approve", "ship"],
    entities: managerPermissionEntities,
  },
  {
    id: "dealer",
    label: "Дилер",
    actions: ["read", "create", "update", "delete", "request", "approve", "export", "ship"],
    entities: dealerPermissionEntities,
  },
] as const satisfies readonly AdminPermissionRoleDefinition[];

export function summarizeAdminPermissions(
  entities: readonly AdminPermissionEntity[],
): AdminPermissionSummary {
  let checked = 0;
  let total = 0;

  for (const entity of entities) {
    for (const state of Object.values(entity.permissions)) {
      if (state === undefined) continue;
      total += 1;
      if (state === "on") checked += 1;
    }
  }

  return { checked, total, unchecked: total - checked };
}

export const adminPermissionSummaries: Readonly<Record<AdminPermissionRole, AdminPermissionSummary>> = {
  manager: summarizeAdminPermissions(managerPermissionEntities),
  dealer: summarizeAdminPermissions(dealerPermissionEntities),
};
