import {
  scheduleSearchResults,
  scheduleSlots,
  scheduleTimelineEvents,
  type ScheduleCategory,
  type ScheduleSearchResult,
  type ScheduleSlot,
  type ScheduleSlotStatus,
  type ScheduleTimelineEvent,
} from "@/lib/admin-schedule-data";

export type ScheduleCategoryFilter = ScheduleCategory | "all";

export const scheduleCategoryFilters = [
  {id: "all", label: "Усі"},
  {id: "PWC", label: "PWC"},
  {id: "ATV", label: "ATV"},
  {id: "SSV", label: "SSV"},
  {id: "3WV", label: "3WV"},
] as const satisfies ReadonlyArray<{id: ScheduleCategoryFilter; label: string}>;

export const scheduleTimelineDefaults = {
  pastMonths: 6,
  futureMonths: 2,
  maxPastMonths: 12,
  maxFutureMonths: 6,
} as const;

const timelineMonthNames = [
  {short: "СІЧ", long: "січень"},
  {short: "ЛЮТ", long: "лютий"},
  {short: "БЕР", long: "березень"},
  {short: "КВІ", long: "квітень"},
  {short: "ТРА", long: "травень"},
  {short: "ЧЕР", long: "червень"},
  {short: "ЛИП", long: "липень"},
  {short: "СЕР", long: "серпень"},
  {short: "ВЕР", long: "вересень"},
  {short: "ЖОВ", long: "жовтень"},
  {short: "ЛИС", long: "листопад"},
  {short: "ГРУ", long: "грудень"},
] as const;

export const scheduleTimelineReferenceDate = {year: 2026, month: 6, day: 18} as const;

export interface ScheduleTimelineDateGroup {
  readonly arrivalDate: ScheduleTimelineEvent["arrivalDate"];
  readonly events: readonly ScheduleTimelineEvent[];
  readonly quantity: number;
  readonly status: ScheduleSlotStatus;
}

export interface ScheduleTimelineMonth {
  readonly id: string;
  readonly label: string;
  readonly longLabel: string;
  readonly year: number;
  readonly month: number;
  readonly current: boolean;
  readonly groups: readonly ScheduleTimelineDateGroup[];
  readonly eventCount: number;
  readonly quantity: number;
}

export interface ScheduleTimelineModel {
  readonly rangeLabel: string;
  readonly months: readonly ScheduleTimelineMonth[];
  readonly dateGroups: readonly ScheduleTimelineDateGroup[];
  readonly visibleEvents: readonly ScheduleTimelineEvent[];
}

export function normalizeScheduleSearch(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

export function scheduleTimelineDateValue(value: `${number}-${number}-${number}`) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function formatScheduleTimelineDate(value: `${number}-${number}-${number}`) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export function scheduleTimelineStatusLabel(status: ScheduleSlotStatus) {
  if (status === "in-transit") return "В дорозі";
  if (status === "future") return "Майбутня";
  return "Прибуло";
}

export function scheduleTimelineSlotLabel(slotCount: number) {
  return slotCount === 1 ? "1 слот" : `${slotCount} слоти`;
}

export function scheduleTimelineGroupLabel(count: number) {
  const finalTwoDigits = count % 100;
  const finalDigit = count % 10;
  if (finalTwoDigits >= 11 && finalTwoDigits <= 14) return `${count} груп`;
  if (finalDigit === 1) return `${count} група`;
  if (finalDigit >= 2 && finalDigit <= 4) return `${count} групи`;
  return `${count} груп`;
}

function scheduleTimelineGroupStatus(events: readonly ScheduleTimelineEvent[]): ScheduleSlotStatus {
  if (events.some((event) => event.status === "in-transit")) return "in-transit";
  if (events.some((event) => event.status === "future")) return "future";
  return "arrived";
}

export function buildScheduleTimelineModel(pastMonths: number, futureMonths: number): ScheduleTimelineModel {
  const start = new Date(Date.UTC(
    scheduleTimelineReferenceDate.year,
    scheduleTimelineReferenceDate.month - pastMonths,
    1,
  ));
  const baseMonths = Array.from({length: pastMonths + futureMonths + 1}, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const monthName = timelineMonthNames[month];
    const includeYear = index === 0 || month === 0;
    return {
      id: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${monthName.short}${includeYear ? ` ’${String(year).slice(-2)}` : ""}`,
      longLabel: monthName.long,
      year,
      month,
      current: year === scheduleTimelineReferenceDate.year && month === scheduleTimelineReferenceDate.month,
    };
  });
  const firstMonth = baseMonths[0];
  const lastMonth = baseMonths[baseMonths.length - 1];
  const startValue = Date.UTC(firstMonth.year, firstMonth.month, 1);
  const endValue = Date.UTC(lastMonth.year, lastMonth.month + 1, 1);
  const visibleEvents = scheduleTimelineEvents.filter((event) => {
    const date = scheduleTimelineDateValue(event.arrivalDate);
    return date >= startValue && date < endValue;
  });
  const groups = new Map<ScheduleTimelineEvent["arrivalDate"], ScheduleTimelineEvent[]>();
  visibleEvents.forEach((event) => {
    const existing = groups.get(event.arrivalDate) ?? [];
    existing.push(event);
    groups.set(event.arrivalDate, existing);
  });
  const dateGroups = Array.from(groups, ([arrivalDate, events]) => ({
    arrivalDate,
    events,
    quantity: events.reduce((total, event) => total + event.quantity, 0),
    status: scheduleTimelineGroupStatus(events),
  })).sort((left, right) => scheduleTimelineDateValue(left.arrivalDate) - scheduleTimelineDateValue(right.arrivalDate));
  const months = baseMonths.map((month) => {
    const monthGroups = dateGroups.filter((group) => {
      const date = new Date(scheduleTimelineDateValue(group.arrivalDate));
      return date.getUTCFullYear() === month.year && date.getUTCMonth() === month.month;
    });
    return {
      ...month,
      groups: monthGroups,
      eventCount: monthGroups.reduce((total, group) => total + group.events.length, 0),
      quantity: monthGroups.reduce((total, group) => total + group.quantity, 0),
    };
  });

  return {
    rangeLabel: `${firstMonth.longLabel} ${firstMonth.year} — ${lastMonth.longLabel} ${lastMonth.year}`,
    months,
    dateGroups,
    visibleEvents,
  };
}

export function filterScheduleSlots(
  page: number,
  category: ScheduleCategoryFilter,
): readonly ScheduleSlot[] {
  return scheduleSlots.filter((slot) => (
    slot.sourcePage === page && (category === "all" || slot.category === category)
  ));
}

export function findScheduleSlot(selectedId: string | null) {
  return scheduleSlots.find((slot) => slot.id === selectedId) ?? null;
}

export function filterScheduleSearchResults(
  query: string,
  category: ScheduleCategoryFilter,
): readonly ScheduleSearchResult[] {
  const normalized = normalizeScheduleSearch(query);
  return scheduleSearchResults.filter((result) => {
    const slot = scheduleSlots.find((item) => item.id === result.slotId);
    if (category !== "all" && slot?.category !== category) return false;
    return normalizeScheduleSearch(`${result.sku} ${result.model} ${result.slotName}`).includes(normalized);
  });
}
