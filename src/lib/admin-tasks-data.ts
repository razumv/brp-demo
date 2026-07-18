export type AdminQueueSummary = {
  readonly workers: number;
  readonly active: number;
  readonly waiting: number;
  readonly done: number;
  readonly failed: number;
};

export type AdminTaskCard = {
  readonly id: "catalog-sync" | "sku-sync" | "reset-all";
  readonly title: string;
  readonly description: string;
  readonly actionLabel: "Запустити" | "Скинути все";
  readonly tone: "catalog" | "neutral" | "danger";
};

export type CatalogSyncTargetId = "tree" | "images" | "parts";

export type CatalogSyncTarget = {
  readonly id: CatalogSyncTargetId;
  readonly label: string;
};

export type CatalogBrandId = "all" | "can-am-off-road" | "can-am-on-road" | "sea-doo" | "ski-doo";

export type CatalogBrand = {
  readonly id: CatalogBrandId;
  readonly label: string;
};

export type CatalogSyncModeId = "dry" | "live";

export type CatalogSyncMode = {
  readonly id: CatalogSyncModeId;
  readonly label: string;
  readonly helper: string;
};

export type CatalogSyncSelection = {
  readonly tree: boolean;
  readonly images: boolean;
  readonly parts: boolean;
  readonly brand: CatalogBrandId;
  readonly mode: CatalogSyncModeId;
};

export type CatalogSyncPresetId = "dry-tree" | "live-tree" | "images-new-only" | "parts-queue";

export type CatalogSyncPreset = {
  readonly id: CatalogSyncPresetId;
  readonly step: 1 | 2 | 3 | 4;
  readonly title: string;
  readonly helper: string;
  readonly selection: CatalogSyncSelection;
};

export type AdminTasksIntegrationNote = {
  readonly title: string;
  readonly lines: readonly string[];
};

export const adminQueueSummary: AdminQueueSummary = {
  workers: 1,
  active: 0,
  waiting: 0,
  done: 0,
  failed: 0,
};

export const adminTaskCards = {
  catalogSync: {
    id: "catalog-sync",
    title: "Єдина синхронізація каталогу",
    description: "Об'єднана синхронізація дерева каталогу, зображень та запчастин з пробним режимом",
    actionLabel: "Запустити",
    tone: "catalog",
  },
  skuSync: {
    id: "sku-sync",
    title: "Оновлення SKU з 1С",
    description: "Синхронізація кількості з 1С через FTP (SKU_BRP.csv)",
    actionLabel: "Запустити",
    tone: "neutral",
  },
  resetAll: {
    id: "reset-all",
    title: "Скидання замовлень та авіафрахту",
    description: "Видаляє ВСІ замовлення дилерів, замовлення постачальникам, авіафрахт, сесії приймання, резервації, сповіщення та журнали аудиту. Потім синхронізує залишки з 1С. Використовуйте для чистого MVP-тестування.",
    actionLabel: "Скинути все",
    tone: "danger",
  },
} as const satisfies Record<string, AdminTaskCard>;

export const catalogSyncTargets = [
  { id: "tree", label: "Дерево каталогу" },
  { id: "images", label: "Зображення" },
  { id: "parts", label: "Запчастини" },
] as const satisfies readonly CatalogSyncTarget[];

export const catalogBrands = [
  { id: "all", label: "Усі бренди" },
  { id: "can-am-off-road", label: "Can-Am Off-Road" },
  { id: "can-am-on-road", label: "Can-Am On-Road" },
  { id: "sea-doo", label: "Sea-Doo" },
  { id: "ski-doo", label: "Ski-Doo" },
] as const satisfies readonly CatalogBrand[];

export const catalogSyncModes = [
  {
    id: "dry",
    label: "Пробний запуск (без запису)",
    helper: "Пробний запуск: дерево каталогу буде обійдено та зміни показано без модифікації БД. Зображення та запчастини покажуть статистику без завантаження та запису.",
  },
  {
    id: "live",
    label: "Бойовий",
    helper: "Бойовий режим: синхронізація дерева каталогу, потім завантаження зображень, потім черга завдань по запчастинах. Виконується послідовно по брендах.",
  },
] as const satisfies readonly CatalogSyncMode[];

export const catalogSyncPresets = [
  {
    id: "dry-tree",
    step: 1,
    title: "Dry-run дерева",
    helper: "Позначте тільки дерево каталогу та пробний режим. Перевірте нові, змінені та missing вузли.",
    selection: { tree: true, images: false, parts: false, brand: "all", mode: "dry" },
  },
  {
    id: "live-tree",
    step: 2,
    title: "Live дерева",
    helper: "Позначте тільки дерево каталогу та бойовий режим. Зображення й запчастини поки не вмикайте.",
    selection: { tree: true, images: false, parts: false, brand: "all", mode: "live" },
  },
  {
    id: "images-new-only",
    step: 3,
    title: "Зображення new-only",
    helper: "Позначте тільки зображення в бойовому режимі. Завантажаться відсутні картинки збірок.",
    selection: { tree: false, images: true, parts: false, brand: "all", mode: "live" },
  },
  {
    id: "parts-queue",
    step: 4,
    title: "Черга запчастин",
    helper: "Позначте тільки запчастини в бойовому режимі. Перед запуском перевірте Redis/чергу.",
    selection: { tree: false, images: false, parts: true, brand: "all", mode: "live" },
  },
] as const satisfies readonly CatalogSyncPreset[];

export const initialCatalogSyncSelection: CatalogSyncSelection = catalogSyncPresets[0].selection;

export const adminTasksIntegrationNote: AdminTasksIntegrationNote = {
  title: "BossWeb і 1C працюють окремо",
  lines: [
    "BossWeb сам перевіряє прайс-листи кожні 24 години та імпортує нові файли при зміні.",
    "1C зазвичай оновлює залишки через OData polling. FTP SKU_BRP.csv лишаємо як актуальний аварійний fallback, а не як крок ARI-оновлення.",
    "Після черги запчастин перевірте health: останній BossWeb import, 1C polling, unmapped parts та помилки черги.",
  ],
};

export const SAFE_UPDATE_ORDER_TITLE = "БЕЗПЕЧНИЙ ПОРЯДОК ОНОВЛЕННЯ";
export const SAFE_UPDATE_ORDER_HELPER = "Запускайте кроки по черзі: спочатку перевірка дерева, потім запис дерева, далі зображення та черга запчастин.";
