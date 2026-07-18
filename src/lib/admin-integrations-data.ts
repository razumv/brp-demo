export type IntegrationOverviewId = "one-c" | "bossweb";

export type IntegrationOverviewFixture = {
  readonly id: IntegrationOverviewId;
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly href: "/admin/integrations/1c" | "/admin/integrations/bossweb";
  readonly searchTerms: readonly string[];
  readonly telemetry?: {
    readonly mode: string;
    readonly response: string;
    readonly poller: string;
    readonly error: string;
  };
};

export type OneCIntegrationTab = "sync" | "tokens" | "history" | "docs";

export type OneCKpi = {
  readonly id: "pending" | "exported" | "positions";
  readonly label: string;
  readonly value: number;
  readonly helper: string;
  readonly tone: "amber" | "green" | "blue";
};

export type OneCExportRow = {
  readonly id: string;
  readonly orderCode: string;
  readonly partNumber: string;
  readonly quantity: number;
  readonly dealer: string;
  readonly status: "Очікує";
  readonly createdAt: string;
};

export type UnitMappingFilter = "all" | "linked" | "pending";
export type UnitCategory = "ATV" | "PWC" | "SSV";

export type UnitMappingCode = {
  readonly id: string;
  readonly code: string;
  readonly category: UnitCategory;
  readonly family: string;
  readonly units: number;
  readonly linked: number;
  readonly pending: number;
  readonly state: "linked" | "pending";
};

export type UnitMappingRecord = {
  readonly id: string;
  readonly vin: string;
  readonly engineCode: string;
  readonly nomenclature: string | null;
  readonly state: "linked" | "pending";
};

export type DealerMappingConnection = {
  readonly id: string;
  readonly category: "Bombardier" | "Bombardier СД" | "Sea Doo СД" | "Запчастини" | "Інше";
  readonly label: string;
  readonly identity: "synthetic-display-only";
};

export type DealerMappingRow = {
  readonly id: string;
  readonly dealer: string;
  readonly connections: readonly DealerMappingConnection[];
};

export type BossWebIntegrationTab = "settings" | "orders" | "price-lists" | "matching";
export type BossWebDeliveryStatus = "Not Delivered" | "Totally Delivered";

export type BossWebOrderPosition = {
  readonly id: string;
  readonly position: number;
  readonly partNumber: string;
  readonly description: string;
  readonly ordered: number;
  readonly backordered: number;
  readonly shipped: number;
  readonly eta: string;
};

export type BossWebOrderRow = {
  readonly id: string;
  readonly orderNumber: string;
  readonly date: string;
  readonly customerOrder: string;
  readonly type: "Regular";
  readonly status: BossWebDeliveryStatus;
  readonly linkedSalesOrder: null;
  readonly collectedAge: string;
  readonly positions: readonly BossWebOrderPosition[];
};

export type BossWebMatchingRow = {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerOrder: string;
  readonly status: BossWebDeliveryStatus;
};

export type BossWebPriceList = {
  readonly id: string;
  readonly family: string;
  readonly document: string;
  readonly documentDate: "11.07.2026";
  readonly fileSize: string;
  readonly synchronizedAge: "6d ago";
};

export const integrationOverviewFixtures = [
  {
    id: "one-c",
    title: "Інтеграція 1С",
    badge: "Збій OData",
    description: "Синхронізація замовлень та залишків з системою 1С через webhook",
    href: "/admin/integrations/1c",
    searchTerms: ["1с", "1c", "odata", "webhook", "залишки", "замовлення"],
    telemetry: {
      mode: "OData polling",
      response: "5000 мс",
      poller: "на паузі",
      error: "The operation was aborted due to timeout",
    },
  },
  {
    id: "bossweb",
    title: "BossWeb",
    badge: "49 замовлень",
    description: "Парсинг статусів доставки замовлень з bossweb.brp.com",
    href: "/admin/integrations/bossweb",
    searchTerms: ["bossweb", "boss web", "замовлення", "каталог"],
  },
] as const satisfies readonly IntegrationOverviewFixture[];

export const oneCIntegrationTabs = [
  { id: "sync", label: "Синхронізація складу" },
  { id: "tokens", label: "API-токени" },
  { id: "history", label: "Історія експорту" },
  { id: "docs", label: "Документація API" },
] as const satisfies readonly { id: OneCIntegrationTab; label: string }[];

export const oneCIntegrationKpis = [
  { id: "pending", label: "Очікує експорту", value: 262, helper: "Позиції, що очікують отримання 1С", tone: "amber" },
  { id: "exported", label: "Усього експортовано", value: 0, helper: "Успішно синхронізовано в 1С", tone: "green" },
  { id: "positions", label: "Усього позицій", value: 262, helper: "Записи експорту за весь час", tone: "blue" },
] as const satisfies readonly OneCKpi[];

const exportDealers = ["Logos", "Сервісний дилер A", "Демо-дилер Київ", "Демо-дилер Південь", "Демо-дилер Центр"] as const;

export const oneCExportHistory: readonly OneCExportRow[] = Array.from({ length: 262 }, (_, index) => ({
  id: `export-demo-${String(index + 1).padStart(3, "0")}`,
  orderCode: index === 0 ? "LOG-01" : `EXP-${String(index + 1).padStart(3, "0")}`,
  partNumber: index === 0 ? "9779150" : `DEMO-${String(2_000_000 + index)}`,
  quantity: (index % 4) + 1,
  dealer: exportDealers[index % exportDealers.length],
  status: "Очікує",
  createdAt: index === 0 ? "18.07.2026, 01:40:39" : `05.06.2026, ${String(20 - (index % 12)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`,
}));

export const ONE_C_EXPORT_PAGE_SIZE = 20;
export const ONE_C_EXPORT_PAGE_COUNT = 14;

const unitFamilies = [
  { category: "ATV", family: "Outlander" },
  { category: "PWC", family: "GTX" },
  { category: "SSV", family: "Defender" },
  { category: "PWC", family: "Spark" },
  { category: "SSV", family: "Maverick" },
] as const;

const linkedUnitCodes: readonly UnitMappingCode[] = Array.from({ length: 17 }, (_, index) => {
  const family = unitFamilies[index % unitFamilies.length];
  return {
    id: `unit-code-linked-${String(index + 1).padStart(2, "0")}`,
    code: `L${String(index + 1).padStart(2, "0")}A`,
    category: family.category,
    family: family.family,
    units: 10,
    linked: 10,
    pending: 0,
    state: "linked",
  };
});

const pendingUnitCodes: readonly UnitMappingCode[] = Array.from({ length: 35 }, (_, index) => {
  const family = unitFamilies[(index + 1) % unitFamilies.length];
  const units = index < 25 ? 10 : 9;
  const pending = index < 8 ? 7 : 6;
  return {
    id: `unit-code-pending-${String(index + 1).padStart(2, "0")}`,
    code: `P${String(index + 1).padStart(2, "0")}A`,
    category: family.category,
    family: family.family,
    units,
    linked: units - pending,
    pending,
    state: "pending",
  };
});

export const unitMappingCodes: readonly UnitMappingCode[] = [
  {
    id: "unit-code-4wtj",
    code: "4WTJ",
    category: "ATV",
    family: "Outlander",
    units: 90,
    linked: 32,
    pending: 58,
    state: "pending",
  },
  ...linkedUnitCodes,
  ...pendingUnitCodes,
];

export const representative4WTJUnits: readonly UnitMappingRecord[] = Array.from({ length: 90 }, (_, index) => {
  const linked = index < 32;
  return {
    id: `unit-4wtj-demo-${String(index + 1).padStart(3, "0")}`,
    vin: `DEMO4WTJ${String(index + 1).padStart(9, "0")}`,
    engineCode: `MR-DEMO-${String(8_000_000 + index)}`,
    nomenclature: linked ? `Номенклатура 1С · демо ${String(index + 1).padStart(2, "0")}` : null,
    state: linked ? "linked" : "pending",
  };
});

const dealerMappingBlueprints = [
  ["BRP Вышгород", 4],
  ["BRP Днепр", 4],
  ["BRP Житомир", 4],
  ["BRP Запорожье (Парк-С)", 4],
  ["BRP Запорожье (Элитспорт)", 4],
  ["BRP Киев", 4],
  ["BRP Киев (Логос)", 4],
  ["BRP Львов", 4],
  ["BRP Мукачево", 3],
  ["BRP Одесса", 4],
  ["BRP Полтава", 4],
  ["BRP Ровно", 4],
  ["BRP Харьков", 4],
  ["BRP Херсон", 5],
  ["BRP Черкассы", 4],
  ["BRP Чернигов", 4],
  ["BRP центр Черкассы 2", 4],
  ["Logos", 0],
  ["Сервис Логос-спорт М", 1],
  ["ЧП Сингл Салон NEW", 3],
] as const;

const connectionCategories: readonly DealerMappingConnection["category"][] = ["Bombardier", "Bombardier СД", "Sea Doo СД", "Запчастини", "Інше"];

export const dealerMappingRows: readonly DealerMappingRow[] = dealerMappingBlueprints.map(([dealer, count], dealerIndex) => ({
  id: `dealer-mapping-demo-${String(dealerIndex + 1).padStart(2, "0")}`,
  dealer,
  connections: Array.from({ length: count }, (_, connectionIndex) => ({
    id: `dealer-${dealerIndex + 1}-connection-${connectionIndex + 1}`,
    category: connectionCategories[connectionIndex % connectionCategories.length],
    label: `Синтетичний контрагент ${dealerIndex + 1}.${connectionIndex + 1}`,
    identity: "synthetic-display-only",
  })),
}));

export const bossWebIntegrationTabs = [
  { id: "settings", label: "Налаштування" },
  { id: "orders", label: "Замовлення (232)" },
  { id: "price-lists", label: "Прайс-листи" },
  { id: "matching", label: "Зіставлення", count: 0 },
] as const satisfies readonly { id: BossWebIntegrationTab; label: string; count?: number }[];

export const representativeBossWebPositions = [
  { position: 100, partNumber: "704908577", description: "CAN-AM DECAL B-406", ordered: 2, backordered: 0, shipped: 0 },
  { position: 200, partNumber: "705015041", description: "GUARD_MUD REAR L", ordered: 1, backordered: 0, shipped: 0 },
  { position: 300, partNumber: "705017565", description: "TRIM_HEADLIGHT LH", ordered: 1, backordered: 0, shipped: 0 },
  { position: 400, partNumber: "705017566", description: "TRIM_HEADLIGHT RH", ordered: 1, backordered: 0, shipped: 0 },
  { position: 500, partNumber: "705502757", description: "JOINT_CV REAR ASSY", ordered: 2, backordered: 0, shipped: 0 },
  { position: 600, partNumber: "707002227", description: "SHIFTING CABLE", ordered: 1, backordered: 0, shipped: 0 },
  { position: 700, partNumber: "708303555", description: "TRIM_OPEN CARRIER LH B-406 PAINTED", ordered: 1, backordered: 0, shipped: 0 },
  { position: 800, partNumber: "708303556", description: "TRIM_OPEN CARRIER RH B-406 PAINTED", ordered: 1, backordered: 0, shipped: 0 },
  { position: 900, partNumber: "715006814", description: "GUARD_MUD EXTENDED KIT", ordered: 1, backordered: 0, shipped: 0 },
  { position: 1000, partNumber: "715010164", description: "ARM_SUSPENSION LWR L B-450 ASSY", ordered: 1, backordered: 0, shipped: 0 },
  { position: 1100, partNumber: "715010170", description: "KNUCKLE FL ASSY", ordered: 1, backordered: 0, shipped: 0 },
  { position: 1200, partNumber: "715010171", description: "KNUCKLE FR ASSY", ordered: 1, backordered: 0, shipped: 0 },
  { position: 1300, partNumber: "DEMO-POS-13", description: "REPRESENTATIVE POSITION 13", ordered: 1, backordered: 0, shipped: 0 },
].map((position, index) => ({ ...position, id: `boss-position-demo-${index + 1}`, eta: "—" })) satisfies readonly BossWebOrderPosition[];

export const bossWebOrders: readonly BossWebOrderRow[] = Array.from({ length: 200 }, (_, index) => ({
  id: `boss-order-demo-${String(index + 1).padStart(3, "0")}`,
  orderNumber: `BW-DEMO-${String(index + 1).padStart(4, "0")}`,
  date: `${String(15 - (index % 12)).padStart(2, "0")}.07.2026`,
  customerOrder: `DEMO-${index % 3 === 0 ? "AIR" : "REG"}-${String(index + 1).padStart(4, "0")}`,
  type: "Regular",
  status: index < 25 ? "Not Delivered" : "Totally Delivered",
  linkedSalesOrder: null,
  collectedAge: "8h ago",
  positions: index === 0 ? representativeBossWebPositions : [],
}));

export const bossWebMatchingRows: readonly BossWebMatchingRow[] = Array.from({ length: 232 }, (_, index) => ({
  id: `boss-match-demo-${String(index + 1).padStart(3, "0")}`,
  orderNumber: `BW-MATCH-DEMO-${String(index + 1).padStart(4, "0")}`,
  customerOrder: `DEMO-CUSTOMER-${String(index + 1).padStart(4, "0")}`,
  status: index < 25 ? "Not Delivered" : "Totally Delivered",
}));

export const bossWebPriceLists = [
  { id: "price-atv", family: "ATV", document: "ATV All Categories Dist Europe STOCK EURO EXCEL", documentDate: "11.07.2026", fileSize: "2.8 MB", synchronizedAge: "6d ago" },
  { id: "price-roadster", family: "Roadster", document: "Roadster All Categories Dist Europe STOCK EURO EXCEL", documentDate: "11.07.2026", fileSize: "1.5 MB", synchronizedAge: "6d ago" },
  { id: "price-ssv", family: "Side-by-Side", document: "SSV All Categories Dist Europe STOCK EURO EXCEL", documentDate: "11.07.2026", fileSize: "2.3 MB", synchronizedAge: "6d ago" },
  { id: "price-snow", family: "Snowmobile", document: "Ski-Doo All Categories Dist Europe STOCK EURO EXCEL", documentDate: "11.07.2026", fileSize: "4.3 MB", synchronizedAge: "6d ago" },
  { id: "price-water", family: "Watercraft", document: "Sea-Doo & Sport Boats All Categories Dist Europe STOCK EURO EXCEL", documentDate: "11.07.2026", fileSize: "2.8 MB", synchronizedAge: "6d ago" },
] as const satisfies readonly BossWebPriceList[];

export const BOSSWEB_PRICE_TELEMETRY = {
  lastAutomaticSync: "1h ago",
  lastSavedImport: "6d ago",
  newRecords: 168_877,
  prices: 142_422,
  durationSeconds: 304,
} as const;
