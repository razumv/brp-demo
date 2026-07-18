import { dealerCompanyOptions } from "@/lib/admin-dealer-access-data";

export type AdminUserTab = "pending" | "active" | "deactivated";
export type AdminUserRole = "dealer" | "manager" | "admin";
export type AdminUserStatus = "active";
export type RegistrationAge = "1 month ago" | "2 months ago" | "5 months ago";
export type PermissionState = "on" | "off" | "na";

export interface AdminUserRecord {
  readonly id: string;
  readonly displayName: string;
  readonly email: `${string}@example.invalid`;
  readonly accountLabel: `demo-account-${string}`;
  readonly company: string;
  readonly role: AdminUserRole;
  readonly status: AdminUserStatus;
  readonly registrationAge: RegistrationAge;
  readonly dealerCompanyRole?: "main" | "member";
  readonly sourceIdentityStored: false;
}

export interface AdminUserKpi {
  readonly id: "pending" | "active" | "total";
  readonly label: string;
  readonly value: number;
  readonly tone: "amber" | "green" | "blue";
}

export interface AdminUserTabOption {
  readonly id: AdminUserTab;
  readonly label: string;
}

export interface ReadOnlySelectOption {
  readonly id: string;
  readonly label: string;
}

export interface ManagerPermissionRow {
  readonly id: string;
  readonly entity: string;
  readonly read: PermissionState;
  readonly create: PermissionState;
  readonly update: PermissionState;
  readonly delete: PermissionState;
  readonly request: PermissionState;
  readonly approve: PermissionState;
  readonly ship: PermissionState;
}

export const adminUserKpis = [
  { id: "pending", label: "ОЧІКУЮТЬ ЗАТВЕРДЖЕННЯ", value: 0, tone: "amber" },
  { id: "active", label: "АКТИВНІ КОРИСТУВАЧІ", value: 102, tone: "green" },
  { id: "total", label: "ВСЬОГО КОРИСТУВАЧІВ", value: 102, tone: "blue" },
] as const satisfies readonly AdminUserKpi[];

export const adminUserTabs = [
  { id: "pending", label: "Очікування (0)" },
  { id: "active", label: "Активні (102)" },
  { id: "deactivated", label: "Деактивовані" },
] as const satisfies readonly AdminUserTabOption[];

export const adminUserRoleLabels: Record<AdminUserRole, string> = {
  dealer: "Дилер",
  manager: "Менеджер",
  admin: "Адмін",
};

export const adminUserRoleOptions = [
  { id: "dealer", label: "Дилер" },
  { id: "manager", label: "Менеджер" },
  { id: "admin", label: "Адмін" },
] as const satisfies readonly ReadOnlySelectOption[];

export const adminUserCompanyOptions: readonly ReadOnlySelectOption[] = [
  { id: "none", label: "Без компанії" },
  ...dealerCompanyOptions.map((company) => ({ id: company.id, label: company.label })),
];

export const dealerCompanyRoleOptions = [
  { id: "main", label: "Головний дилер" },
  { id: "member", label: "Учасник" },
] as const satisfies readonly ReadOnlySelectOption[];

export const activeAdminUsers = [
  {
    id: "demo-user-01",
    displayName: "Демо-користувач 01",
    email: "user01@example.invalid",
    accountLabel: "demo-account-01",
    company: "BRP Полтава",
    role: "dealer",
    status: "active",
    registrationAge: "2 months ago",
    dealerCompanyRole: "main",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-02",
    displayName: "Демо-користувач 02",
    email: "user02@example.invalid",
    accountLabel: "demo-account-02",
    company: "Logos",
    role: "manager",
    status: "active",
    registrationAge: "5 months ago",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-03",
    displayName: "Демо-користувач 03",
    email: "user03@example.invalid",
    accountLabel: "demo-account-03",
    company: "Logos",
    role: "admin",
    status: "active",
    registrationAge: "5 months ago",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-04",
    displayName: "Демо-користувач 04",
    email: "user04@example.invalid",
    accountLabel: "demo-account-04",
    company: "BRP Чернигов",
    role: "dealer",
    status: "active",
    registrationAge: "2 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-05",
    displayName: "Демо-користувач 05",
    email: "user05@example.invalid",
    accountLabel: "demo-account-05",
    company: "ЧП Сингл Салон NEW",
    role: "dealer",
    status: "active",
    registrationAge: "1 month ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-06",
    displayName: "Демо-користувач 06",
    email: "user06@example.invalid",
    accountLabel: "demo-account-06",
    company: "BRP Полтава",
    role: "dealer",
    status: "active",
    registrationAge: "1 month ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-07",
    displayName: "Демо-користувач 07",
    email: "user07@example.invalid",
    accountLabel: "demo-account-07",
    company: "BRP Херсон",
    role: "dealer",
    status: "active",
    registrationAge: "1 month ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-08",
    displayName: "Демо-користувач 08",
    email: "user08@example.invalid",
    accountLabel: "demo-account-08",
    company: "BRP Вышгород",
    role: "dealer",
    status: "active",
    registrationAge: "2 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-09",
    displayName: "Демо-користувач 09",
    email: "user09@example.invalid",
    accountLabel: "demo-account-09",
    company: "BRP Полтава",
    role: "dealer",
    status: "active",
    registrationAge: "5 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-10",
    displayName: "Демо-користувач 10",
    email: "user10@example.invalid",
    accountLabel: "demo-account-10",
    company: "BRP Днепр",
    role: "dealer",
    status: "active",
    registrationAge: "2 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-11",
    displayName: "Демо-користувач 11",
    email: "user11@example.invalid",
    accountLabel: "demo-account-11",
    company: "Logos",
    role: "manager",
    status: "active",
    registrationAge: "5 months ago",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-12",
    displayName: "Демо-користувач 12",
    email: "user12@example.invalid",
    accountLabel: "demo-account-12",
    company: "Logos",
    role: "admin",
    status: "active",
    registrationAge: "5 months ago",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-13",
    displayName: "Демо-користувач 13",
    email: "user13@example.invalid",
    accountLabel: "demo-account-13",
    company: "BRP Полтава",
    role: "dealer",
    status: "active",
    registrationAge: "1 month ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-14",
    displayName: "Демо-користувач 14",
    email: "user14@example.invalid",
    accountLabel: "demo-account-14",
    company: "BRP Чернигов",
    role: "dealer",
    status: "active",
    registrationAge: "2 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-15",
    displayName: "Демо-користувач 15",
    email: "user15@example.invalid",
    accountLabel: "demo-account-15",
    company: "ЧП Сингл Салон NEW",
    role: "dealer",
    status: "active",
    registrationAge: "1 month ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-16",
    displayName: "Демо-користувач 16",
    email: "user16@example.invalid",
    accountLabel: "demo-account-16",
    company: "BRP Херсон",
    role: "dealer",
    status: "active",
    registrationAge: "1 month ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-17",
    displayName: "Демо-користувач 17",
    email: "user17@example.invalid",
    accountLabel: "demo-account-17",
    company: "BRP Вышгород",
    role: "dealer",
    status: "active",
    registrationAge: "2 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
  {
    id: "demo-user-18",
    displayName: "Демо-користувач 18",
    email: "user18@example.invalid",
    accountLabel: "demo-account-18",
    company: "BRP Полтава",
    role: "dealer",
    status: "active",
    registrationAge: "5 months ago",
    dealerCompanyRole: "member",
    sourceIdentityStored: false,
  },
] as const satisfies readonly AdminUserRecord[];

export const managerPermissionRows = [
  { id: "orders", entity: "Orders", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "pipeline", entity: "Pipeline", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "consignment", entity: "Consignment", read: "on", create: "na", update: "na", delete: "na", request: "off", approve: "on", ship: "on" },
  { id: "returns", entity: "Returns", read: "on", create: "on", update: "na", delete: "na", request: "na", approve: "on", ship: "na" },
  { id: "air-freight", entity: "Air freight", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "receipt", entity: "Receipt", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "ocean-freight", entity: "Ocean freight", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "companies", entity: "Companies", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "users", entity: "Users", read: "on", create: "off", update: "off", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "invoices", entity: "Invoices", read: "off", create: "off", update: "off", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "settlements", entity: "Settlements", read: "on", create: "na", update: "na", delete: "na", request: "na", approve: "na", ship: "na" },
  { id: "catalog", entity: "Catalog", read: "on", create: "na", update: "on", delete: "na", request: "na", approve: "na", ship: "na" },
  { id: "schedule", entity: "Schedule", read: "on", create: "on", update: "on", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "tasks", entity: "Tasks", read: "off", create: "off", update: "off", delete: "off", request: "na", approve: "na", ship: "na" },
  { id: "reports", entity: "Reports", read: "on", create: "off", update: "na", delete: "na", request: "na", approve: "na", ship: "na" },
] as const satisfies readonly ManagerPermissionRow[];

export const adminUserTotals = {
  pending: 0,
  active: 102,
  deactivated: 0,
  total: 102,
} as const;
