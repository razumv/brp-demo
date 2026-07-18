export interface DealerCompanyOption {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
  readonly sourceIdentityStored: false;
}

export type DealerTeamRole = "Головний дилер" | "Співробітник";
export type DealerAccessProfile = "Full Access" | "Без доступу";
export type DealerTeamAccessStatus =
  | "Основний акаунт"
  | "Доступ призначено"
  | "Потрібно призначити доступ";

export interface DealerTeamSummary {
  readonly id: string;
  readonly displayName: string;
  readonly accountLabel: string;
  readonly role: DealerTeamRole;
  readonly profile: DealerAccessProfile;
  readonly accessStatus: DealerTeamAccessStatus;
  readonly sourceIdentityStored: false;
}

export interface DealerPermissionEntry {
  readonly id: string;
  readonly action: string;
  readonly enabled: boolean;
}

export interface DealerPermissionGroup {
  readonly id: string;
  readonly command: string;
  readonly sectionLabel?: "ДОКУМЕНТИ";
  readonly permissions: readonly DealerPermissionEntry[];
}

export const dealerCompanyOptions = [
  { id: "company-vyshhorod", slug: "brp-vyshhorod-demo", label: "BRP Вышгород", sourceIdentityStored: false },
  { id: "company-dnipro", slug: "brp-dnipro-demo", label: "BRP Днепр", sourceIdentityStored: false },
  { id: "company-zhytomyr", slug: "brp-zhytomyr-demo", label: "BRP Житомир", sourceIdentityStored: false },
  { id: "company-zaporizhzhia-park-s", slug: "brp-zaporizhzhia-park-s-demo", label: "BRP Запорожье (Парк-С)", sourceIdentityStored: false },
  { id: "company-zaporizhzhia-elitsport", slug: "brp-zaporizhzhia-elitsport-demo", label: "BRP Запорожье (Элитспорт)", sourceIdentityStored: false },
  { id: "company-kyiv", slug: "brp-kyiv-demo", label: "BRP Киев", sourceIdentityStored: false },
  { id: "company-kyiv-logos", slug: "brp-kyiv-logos-demo", label: "BRP Киев (Логос)", sourceIdentityStored: false },
  { id: "company-lviv", slug: "brp-lviv-demo", label: "BRP Львов", sourceIdentityStored: false },
  { id: "company-mukachevo", slug: "brp-mukachevo-demo", label: "BRP Мукачево", sourceIdentityStored: false },
  { id: "company-odesa", slug: "brp-odesa-demo", label: "BRP Одесса", sourceIdentityStored: false },
  { id: "company-poltava", slug: "brp-poltava-demo", label: "BRP Полтава", sourceIdentityStored: false },
  { id: "company-rivne", slug: "brp-rivne-demo", label: "BRP Ровно", sourceIdentityStored: false },
  { id: "company-kharkiv", slug: "brp-kharkiv-demo", label: "BRP Харьков", sourceIdentityStored: false },
  { id: "company-kherson", slug: "brp-kherson-demo", label: "BRP Херсон", sourceIdentityStored: false },
  { id: "company-cherkasy", slug: "brp-cherkasy-demo", label: "BRP Черкассы", sourceIdentityStored: false },
  { id: "company-chernihiv", slug: "brp-chernihiv-demo", label: "BRP Чернигов", sourceIdentityStored: false },
  { id: "company-cherkasy-center-2", slug: "brp-cherkasy-center-2-demo", label: "BRP центр Черкассы 2", sourceIdentityStored: false },
  { id: "company-logos", slug: "logos-demo", label: "Logos", sourceIdentityStored: false },
  { id: "company-logos-service", slug: "logos-service-demo", label: "Сервис Логос-спорт М", sourceIdentityStored: false },
  { id: "company-single-new", slug: "single-salon-new-demo", label: "ЧП Сингл Салон NEW", sourceIdentityStored: false },
] as const satisfies readonly DealerCompanyOption[];

export const dealerTeamSummaries = [
  {
    id: "dealer-primary",
    displayName: "Демо-керівник",
    accountLabel: "Демо-акаунт 01",
    role: "Головний дилер",
    profile: "Full Access",
    accessStatus: "Основний акаунт",
    sourceIdentityStored: false,
  },
  {
    id: "dealer-employee-1",
    displayName: "Демо-співробітник 1",
    accountLabel: "Демо-акаунт 02",
    role: "Співробітник",
    profile: "Full Access",
    accessStatus: "Доступ призначено",
    sourceIdentityStored: false,
  },
  {
    id: "dealer-employee-2",
    displayName: "Демо-співробітник 2",
    accountLabel: "Демо-акаунт 03",
    role: "Співробітник",
    profile: "Без доступу",
    accessStatus: "Потрібно призначити доступ",
    sourceIdentityStored: false,
  },
  {
    id: "dealer-employee-3",
    displayName: "Демо-співробітник 3",
    accountLabel: "Демо-акаунт 04",
    role: "Співробітник",
    profile: "Без доступу",
    accessStatus: "Потрібно призначити доступ",
    sourceIdentityStored: false,
  },
  {
    id: "dealer-employee-4",
    displayName: "Демо-співробітник 4",
    accountLabel: "Демо-акаунт 05",
    role: "Співробітник",
    profile: "Без доступу",
    accessStatus: "Потрібно призначити доступ",
    sourceIdentityStored: false,
  },
] as const satisfies readonly DealerTeamSummary[];

export const dealerPermissionGroups = [
  {
    id: "catalog",
    command: "Каталог",
    permissions: [
      { id: "catalog-create", action: "Створення", enabled: false },
      { id: "catalog-delete", action: "Видалення", enabled: false },
      { id: "catalog-read", action: "Читання", enabled: true },
      { id: "catalog-update", action: "Оновлення", enabled: false },
    ],
  },
  {
    id: "consignment",
    command: "Консигнація",
    permissions: [
      { id: "consignment-approve", action: "Схвалення", enabled: false },
      { id: "consignment-ship", action: "Відвантаження", enabled: true },
      { id: "consignment-read", action: "Читання", enabled: true },
      { id: "consignment-request", action: "Запит", enabled: true },
    ],
  },
  {
    id: "part-search",
    command: "Пошук запчастини",
    permissions: [
      { id: "part-search-read", action: "Читання", enabled: true },
    ],
  },
  {
    id: "customers",
    command: "Клієнти",
    permissions: [
      { id: "customers-create", action: "Створення", enabled: true },
      { id: "customers-delete", action: "Видалення", enabled: true },
      { id: "customers-read", action: "Читання", enabled: true },
      { id: "customers-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "dashboard",
    command: "Дашборд",
    permissions: [
      { id: "dashboard-read", action: "Читання", enabled: true },
    ],
  },
  {
    id: "documents",
    command: "Документи",
    sectionLabel: "ДОКУМЕНТИ",
    permissions: [
      { id: "documents-read", action: "Читання", enabled: true },
    ],
  },
  {
    id: "dealer-network",
    command: "Дилерська мережа",
    permissions: [
      { id: "dealer-network-create", action: "Створення", enabled: true },
      { id: "dealer-network-delete", action: "Видалення", enabled: true },
      { id: "dealer-network-read", action: "Читання", enabled: true },
      { id: "dealer-network-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "orders",
    command: "Мої замовлення",
    permissions: [
      { id: "orders-create", action: "Створення", enabled: true },
      { id: "orders-delete", action: "Видалення", enabled: false },
      { id: "orders-read", action: "Читання", enabled: true },
      { id: "orders-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "parts-warehouse",
    command: "Склад запчастин",
    permissions: [
      { id: "parts-warehouse-create", action: "Створення", enabled: true },
      { id: "parts-warehouse-delete", action: "Видалення", enabled: false },
      { id: "parts-warehouse-read", action: "Читання", enabled: true },
      { id: "parts-warehouse-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "dealer-prices",
    command: "Дилерські ціни",
    permissions: [
      { id: "dealer-prices-read", action: "Читання", enabled: true },
    ],
  },
  {
    id: "dealer-settlements",
    command: "Взаєморозрахунки дилера",
    permissions: [
      { id: "dealer-settlements-export", action: "Експорт", enabled: true },
      { id: "dealer-settlements-read", action: "Читання", enabled: true },
    ],
  },
  {
    id: "team-access",
    command: "Команда і доступи",
    permissions: [
      { id: "team-access-read", action: "Читання", enabled: true },
      { id: "team-access-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "vehicles",
    command: "Техніка",
    permissions: [
      { id: "vehicles-create", action: "Створення", enabled: true },
      { id: "vehicles-delete", action: "Видалення", enabled: false },
      { id: "vehicles-read", action: "Читання", enabled: true },
      { id: "vehicles-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "workshop",
    command: "Майстерня",
    permissions: [
      { id: "workshop-create", action: "Створення", enabled: true },
      { id: "workshop-delete", action: "Видалення", enabled: true },
      { id: "workshop-read", action: "Читання", enabled: true },
      { id: "workshop-update", action: "Оновлення", enabled: true },
    ],
  },
  {
    id: "returns",
    command: "Повернення",
    permissions: [
      { id: "returns-approve", action: "Схвалення", enabled: false },
      { id: "returns-create", action: "Створення", enabled: false },
      { id: "returns-read", action: "Читання", enabled: true },
    ],
  },
  {
    id: "schedule",
    command: "Розклад",
    permissions: [
      { id: "schedule-create", action: "Створення", enabled: false },
      { id: "schedule-delete", action: "Видалення", enabled: false },
      { id: "schedule-read", action: "Читання", enabled: true },
      { id: "schedule-update", action: "Оновлення", enabled: false },
    ],
  },
] as const satisfies readonly DealerPermissionGroup[];

export const dealerPermissionEntries: readonly DealerPermissionEntry[] = dealerPermissionGroups.reduce<DealerPermissionEntry[]>(
  (entries, group) => [...entries, ...group.permissions],
  [],
);

export const dealerPermissionSummary = {
  total: dealerPermissionEntries.length,
  checked: dealerPermissionEntries.filter((permission) => permission.enabled).length,
  unchecked: dealerPermissionEntries.filter((permission) => !permission.enabled).length,
} as const;
