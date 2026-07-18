export interface ConsignmentHolder {
  readonly id: string;
  readonly name: string;
}

export const consignmentHolders = [
  { id: "single-new", name: "ЧП Сингл Салон NEW" },
  { id: "vyshgorod", name: "BRP Вышгород" },
  { id: "dnipro", name: "BRP Днепр" },
  { id: "zhytomyr", name: "BRP Житомир" },
  { id: "zaporizhzhia-park-s", name: "BRP Запорожье (Парк-С)" },
  { id: "zaporizhzhia-elitsport", name: "BRP Запорожье (Элитспорт)" },
  { id: "kyiv", name: "BRP Киев" },
  { id: "kyiv-logos", name: "BRP Киев (Логос)" },
  { id: "lviv", name: "BRP Львов" },
  { id: "mukachevo", name: "BRP Мукачево" },
  { id: "odesa", name: "BRP Одесса" },
  { id: "poltava", name: "BRP Полтава" },
  { id: "kharkiv", name: "BRP Харьков" },
  { id: "kherson", name: "BRP Херсон" },
  { id: "cherkasy", name: "BRP Черкассы" },
  { id: "chernihiv", name: "BRP Чернигов" },
] as const satisfies readonly ConsignmentHolder[];

export type ConsignmentHolderId = (typeof consignmentHolders)[number]["id"];

export interface ConsignmentStockPosition {
  readonly partNumber: string;
  readonly description: string;
  readonly total: number;
  readonly quantities: Readonly<Partial<Record<ConsignmentHolderId, number>>>;
}

/**
 * A source-observed representative subset. The source totals are deliberately
 * kept separately so this fixture is never presented as the complete stock.
 */
export const consignmentStockPositions = [
  {
    partNumber: "219400168",
    description: "REAR RT TOPCASE BAG KIT",
    total: 1,
    quantities: { kyiv: 1 },
  },
  {
    partNumber: "219400764",
    description: "LUGGAGE RACK R KIT",
    total: 4,
    quantities: {
      vyshgorod: 1,
      dnipro: 1,
      "zaporizhzhia-park-s": 1,
      kharkiv: 1,
    },
  },
  {
    partNumber: "219400841",
    description: "SMARTPHONE SUPPORT KIT",
    total: 3,
    quantities: { kyiv: 1, "kyiv-logos": 1, poltava: 1 },
  },
  {
    partNumber: "219400869",
    description: "SPOILER TRIM BLACK",
    total: 3,
    quantities: { dnipro: 1, "zaporizhzhia-park-s": 1, kyiv: 1 },
  },
  {
    partNumber: "2859420684",
    description: "FREEDOM PFD (US/CA) MEN M",
    total: 1,
    quantities: { odesa: 1 },
  },
] as const satisfies readonly ConsignmentStockPosition[];

export const CONSIGNMENT_SOURCE_TOTALS = {
  parts: 1246,
  dealers: 16,
  networkPositions: 200,
  networkUnits: 270,
} as const;

export const consignmentRequestFilters = [
  { id: "waiting", label: "Очікування" },
  { id: "approved", label: "Схвалено" },
  { id: "completed", label: "Виконано" },
  { id: "rejected", label: "Відхилено" },
  { id: "cancelled", label: "Скасовано" },
  { id: "all", label: "Всі" },
] as const;

export type ConsignmentRequestFilter = (typeof consignmentRequestFilters)[number]["id"];
export type ConsignmentRequestStatus = Exclude<ConsignmentRequestFilter, "all">;

export interface ConsignmentRequest {
  readonly id: string;
  readonly dealer: string;
  readonly createdAt: string;
  readonly partNumber: string;
  readonly quantity: number;
  readonly status: ConsignmentRequestStatus;
  readonly oneCReference?: string;
}

// Every source-observed request status is currently empty.
export const consignmentRequests: readonly ConsignmentRequest[] = [];
