export type AdminReturnStatus =
  | "draft"
  | "approved"
  | "closed"
  | "rejected"
  | "cancelled";

export type AdminReturnStatusFilter = AdminReturnStatus | "all";

export type AdminReturnRecord = {
  id: string;
  number: string;
  dealerId: ReturnDealerId;
  orderNumber: string;
  note: string | null;
  status: AdminReturnStatus;
  createdAt: string;
  evidence: "source-observed";
};

export type ReturnDealerId =
  | "vys"
  | "dne"
  | "zhy"
  | "zap-p"
  | "zap-e"
  | "kie-st"
  | "kie-l"
  | "lvv"
  | "muk"
  | "ode"
  | "pol"
  | "rvn"
  | "kha"
  | "ks"
  | "chk"
  | "chn"
  | "chk-2"
  | "log"
  | "lsm"
  | "ssn";

export type ReturnDealer = {
  id: ReturnDealerId;
  name: string;
  code: string;
  eligibleLineCount: number;
  evidence: "source-observed";
};

export type EligibleReturnLine = {
  id: string;
  dealerId: ReturnDealerId;
  orderNumber: string;
  partNumber: string;
  description: string;
  availableQuantity: number;
  unitPriceUsd: number;
  evidence: "source-observed";
};

export type ReturnCondition =
  | "damaged"
  | "wrong-part"
  | "unused"
  | "other";

export const adminReturnStatusFilters: ReadonlyArray<{
  id: AdminReturnStatusFilter;
  label: string;
}> = [
  { id: "draft", label: "Чернетка" },
  { id: "approved", label: "Затверджено" },
  { id: "closed", label: "Закрито" },
  { id: "rejected", label: "Відхилено" },
  { id: "cancelled", label: "Скасовано" },
  { id: "all", label: "Усі" },
];

// All six source lists were rechecked after the create-form preview and remained empty.
export const sourceAdminReturns: readonly AdminReturnRecord[] = [];

export const returnDealers: readonly ReturnDealer[] = [
  { id: "vys", name: "BRP Вышгород", code: "VYS", eligibleLineCount: 8, evidence: "source-observed" },
  { id: "dne", name: "BRP Днепр", code: "DNE", eligibleLineCount: 10, evidence: "source-observed" },
  { id: "zhy", name: "BRP Житомир", code: "ZHY", eligibleLineCount: 6, evidence: "source-observed" },
  { id: "zap-p", name: "BRP Запорожье (Парк-С)", code: "ZAP-P", eligibleLineCount: 0, evidence: "source-observed" },
  { id: "zap-e", name: "BRP Запорожье (Элитспорт)", code: "ZAP-E", eligibleLineCount: 3, evidence: "source-observed" },
  { id: "kie-st", name: "BRP Киев", code: "KIE-ST", eligibleLineCount: 24, evidence: "source-observed" },
  { id: "kie-l", name: "BRP Киев (Логос)", code: "KIE-L", eligibleLineCount: 1, evidence: "source-observed" },
  { id: "lvv", name: "BRP Львов", code: "LVV", eligibleLineCount: 12, evidence: "source-observed" },
  { id: "muk", name: "BRP Мукачево", code: "MUK", eligibleLineCount: 8, evidence: "source-observed" },
  { id: "ode", name: "BRP Одесса", code: "ODE", eligibleLineCount: 7, evidence: "source-observed" },
  { id: "pol", name: "BRP Полтава", code: "POL", eligibleLineCount: 5, evidence: "source-observed" },
  { id: "rvn", name: "BRP Ровно", code: "RVN", eligibleLineCount: 9, evidence: "source-observed" },
  { id: "kha", name: "BRP Харьков", code: "KHA", eligibleLineCount: 10, evidence: "source-observed" },
  { id: "ks", name: "BRP Херсон", code: "KS", eligibleLineCount: 5, evidence: "source-observed" },
  { id: "chk", name: "BRP Черкассы", code: "CHK", eligibleLineCount: 6, evidence: "source-observed" },
  { id: "chn", name: "BRP Чернигов", code: "CHN", eligibleLineCount: 0, evidence: "source-observed" },
  { id: "chk-2", name: "BRP центр Черкассы 2", code: "CHK-2", eligibleLineCount: 1, evidence: "source-observed" },
  { id: "log", name: "Logos", code: "LOG", eligibleLineCount: 0, evidence: "source-observed" },
  { id: "lsm", name: "Сервис Логос-спорт М", code: "LSM", eligibleLineCount: 3, evidence: "source-observed" },
  { id: "ssn", name: "ЧП Сингл Салон NEW", code: "SSN", eligibleLineCount: 3, evidence: "source-observed" },
];

// The source exposed 24 eligible KIE-ST lines. Only these six rows were captured
// field-by-field, so the clone keeps the remaining 18 out rather than inventing data.
export const representativeEligibleReturnLines: readonly EligibleReturnLine[] = [
  {
    id: "kie-st-27-417223767",
    dealerId: "kie-st",
    orderNumber: "KIE-ST-27",
    partNumber: "417223767",
    description: "ROLLER",
    availableQuantity: 6,
    unitPriceUsd: 11.73,
    evidence: "source-observed",
  },
  {
    id: "kie-st-25-860202246",
    dealerId: "kie-st",
    orderNumber: "KIE-ST-25",
    partNumber: "860202246",
    description: "TANK_FUEL KIT",
    availableQuantity: 1,
    unitPriceUsd: 261.67,
    evidence: "source-observed",
  },
  {
    id: "kie-st-24-277001874",
    dealerId: "kie-st",
    orderNumber: "KIE-ST-24",
    partNumber: "277001874",
    description: "WEAR RING",
    availableQuantity: 14,
    unitPriceUsd: 12.91,
    evidence: "source-observed",
  },
  {
    id: "kie-st-20-710006910",
    dealerId: "kie-st",
    orderNumber: "KIE-ST-20",
    partNumber: "710006910",
    description: "HEADLIGHT_HIGH BEAM LED",
    availableQuantity: 1,
    unitPriceUsd: 158.34,
    evidence: "source-observed",
  },
  {
    id: "kie-st-16-715007312",
    dealerId: "kie-st",
    orderNumber: "KIE-ST-16",
    partNumber: "715007312",
    description: "BAR_INTRUSION B-160",
    availableQuantity: 1,
    unitPriceUsd: 468.34,
    evidence: "source-observed",
  },
  {
    id: "kie-st-01-715005813",
    dealerId: "kie-st",
    orderNumber: "KIE-ST-01",
    partNumber: "715005813",
    description: "CANVAS COVER_TOWAGE KIT SSP",
    availableQuantity: 1,
    unitPriceUsd: 422.04,
    evidence: "source-observed",
  },
];

export const returnConditions: ReadonlyArray<{
  id: ReturnCondition;
  label: string;
}> = [
  { id: "damaged", label: "Пошкоджена" },
  { id: "wrong-part", label: "Не та деталь" },
  { id: "unused", label: "Не використана" },
  { id: "other", label: "Інше" },
];
