export type SettlementMappingSummary = {
  readonly linkedCounterparties: number;
  readonly state: "mapped";
  /**
   * The source did not return counterparty detail rows during inspection.
   * Keep this collection empty until exact per-dealer 1C names are evidenced.
   */
  readonly evidencedCounterpartyNames: readonly string[];
};

export type SettlementMovementSummary = {
  readonly total: number;
  readonly lastMovementDate: string;
};

export type SettlementDealer = {
  readonly id: string;
  readonly name: string;
  readonly mapping: SettlementMappingSummary;
  readonly movements: SettlementMovementSummary;
};

export type SettlementSyncDiagnostic = {
  readonly state: "updating";
  readonly stateLabel: "Оновлюється";
  readonly lastSuccessfulSync: string;
  readonly movementsSyncedAt: string;
  readonly daytimeSchedule: string;
  readonly nighttimeSchedule: string;
  readonly liveBalanceNote: string;
  readonly synchronizedMovementCount: number;
  readonly mappingCount: number;
  readonly errorCount: number;
  readonly lastError: string;
};

export type SettlementPeriodPresetId = "30d" | "90d" | "6m" | "1y";

export type SettlementPeriodPreset = {
  readonly id: SettlementPeriodPresetId;
  readonly label: string;
  readonly startDate: string;
  readonly endDate: string;
};

export const SETTLEMENT_SOURCE_TOTALS = {
  dealers: 19,
  mappedDealers: 19,
  movements: 2_359,
} as const;

export const settlementSyncDiagnostic: SettlementSyncDiagnostic = {
  state: "updating",
  stateLabel: "Оновлюється",
  lastSuccessfulSync: "09.06.2026, 18:40:33",
  movementsSyncedAt: "09.06.2026, 18:40:33",
  daytimeSchedule: "Вдень: кожні 15 хв, вікно 7 дн.",
  nighttimeSchedule: "Вночі 02:00: звірка 90 дн.",
  liveBalanceNote: "Актуальний баланс 1С читається окремо при відкритті деталізації.",
  synchronizedMovementCount: 77,
  mappingCount: 72,
  errorCount: 0,
  lastError: "getaddrinfo EAI_AGAIN brp-dev1-postgres",
};

export const settlementPeriodPresets = [
  { id: "30d", label: "30д", startDate: "2026-06-18", endDate: "2026-07-18" },
  { id: "90d", label: "90д", startDate: "2026-04-19", endDate: "2026-07-18" },
  { id: "6m", label: "6м", startDate: "2026-01-19", endDate: "2026-07-18" },
  { id: "1y", label: "1р", startDate: "2025-07-18", endDate: "2026-07-18" },
] as const satisfies readonly SettlementPeriodPreset[];

export const settlementDealers = [
  { id: "brp-vyshhorod", name: "BRP Вышгород", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 45, lastMovementDate: "08.06.2026" } },
  { id: "brp-dnipro", name: "BRP Днепр", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 309, lastMovementDate: "09.06.2026" } },
  { id: "brp-zhytomyr", name: "BRP Житомир", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 154, lastMovementDate: "09.06.2026" } },
  { id: "brp-zaporizhzhia-park-s", name: "BRP Запорожье (Парк-С)", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 15, lastMovementDate: "08.06.2026" } },
  { id: "brp-zaporizhzhia-elitsport", name: "BRP Запорожье (Элитспорт)", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 25, lastMovementDate: "08.06.2026" } },
  { id: "brp-kyiv", name: "BRP Киев", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 520, lastMovementDate: "09.06.2026" } },
  { id: "brp-kyiv-logos", name: "BRP Киев (Логос)", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 41, lastMovementDate: "08.06.2026" } },
  { id: "brp-lviv", name: "BRP Львов", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 257, lastMovementDate: "09.06.2026" } },
  { id: "brp-mukachevo", name: "BRP Мукачево", mapping: { linkedCounterparties: 3, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 146, lastMovementDate: "09.06.2026" } },
  { id: "brp-odesa", name: "BRP Одесса", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 20, lastMovementDate: "09.06.2026" } },
  { id: "brp-poltava", name: "BRP Полтава", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 83, lastMovementDate: "09.06.2026" } },
  { id: "brp-rivne", name: "BRP Ровно", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 76, lastMovementDate: "07.06.2026" } },
  { id: "brp-kharkiv", name: "BRP Харьков", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 121, lastMovementDate: "09.06.2026" } },
  { id: "brp-kherson", name: "BRP Херсон", mapping: { linkedCounterparties: 5, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 319, lastMovementDate: "09.06.2026" } },
  { id: "brp-cherkasy", name: "BRP Черкассы", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 55, lastMovementDate: "09.06.2026" } },
  { id: "brp-chernihiv", name: "BRP Чернигов", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 22, lastMovementDate: "04.06.2026" } },
  { id: "brp-center-cherkasy-2", name: "BRP центр Черкассы 2", mapping: { linkedCounterparties: 4, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 59, lastMovementDate: "08.06.2026" } },
  { id: "service-logos-sport-m", name: "Сервис Логос-спорт М", mapping: { linkedCounterparties: 1, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 46, lastMovementDate: "08.06.2026" } },
  { id: "single-salon-new", name: "ЧП Сингл Салон NEW", mapping: { linkedCounterparties: 3, state: "mapped", evidencedCounterpartyNames: [] }, movements: { total: 46, lastMovementDate: "08.06.2026" } },
] as const satisfies readonly SettlementDealer[];
