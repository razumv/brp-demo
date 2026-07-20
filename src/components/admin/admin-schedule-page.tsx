"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Box,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Ship,
  SlidersHorizontal,
  Warehouse,
} from "lucide-react";
import {
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTableShell,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { PersistedCollapsibleSection } from "@/components/shared/persisted-collapsible-section";
import { EmptyState, Panel, StatusBadge } from "@/components/shared/ui";
import {
  scheduleKpis,
  scheduleSearchResults,
  scheduleSlots,
  scheduleSourceTotals,
  scheduleStockRows,
  scheduleTimelineEvents,
  type ScheduleCategory,
  type ScheduleSlot,
  type ScheduleSlotStatus,
  type ScheduleTab,
  type ScheduleTimelineEvent,
} from "@/lib/admin-schedule-data";
import styles from "./admin-schedule.module.css";

type ScheduleCategoryFilter = ScheduleCategory | "all";

const categoryFilters = [
  { id: "all", label: "Усі" },
  { id: "PWC", label: "PWC" },
  { id: "ATV", label: "ATV" },
  { id: "SSV", label: "SSV" },
  { id: "3WV", label: "3WV" },
] as const;

const timelineMonthNames = [
  { short: "СІЧ", long: "січень" },
  { short: "ЛЮТ", long: "лютий" },
  { short: "БЕР", long: "березень" },
  { short: "КВІ", long: "квітень" },
  { short: "ТРА", long: "травень" },
  { short: "ЧЕР", long: "червень" },
  { short: "ЛИП", long: "липень" },
  { short: "СЕР", long: "серпень" },
  { short: "ВЕР", long: "вересень" },
  { short: "ЖОВ", long: "жовтень" },
  { short: "ЛИС", long: "листопад" },
  { short: "ГРУ", long: "грудень" },
] as const;

const timelineReferenceDate = { year: 2026, month: 6, day: 18 } as const;
const defaultPastMonths = 6;
const defaultFutureMonths = 2;

type TimelineEvent = ScheduleTimelineEvent;

interface TimelineDateGroup {
  readonly arrivalDate: TimelineEvent["arrivalDate"];
  readonly events: readonly TimelineEvent[];
  readonly quantity: number;
  readonly status: ScheduleSlotStatus;
}

function buildTimelineMonths(pastMonths: number, futureMonths: number) {
  const start = new Date(Date.UTC(timelineReferenceDate.year, timelineReferenceDate.month - pastMonths, 1));
  return Array.from({ length: pastMonths + futureMonths + 1 }, (_, index) => {
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
      current: year === timelineReferenceDate.year && month === timelineReferenceDate.month,
    };
  });
}

function timelineDateValue(value: `${number}-${number}-${number}`) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatTimelineDate(value: `${number}-${number}-${number}`) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function LockedButton({ children, title, className = "" }: {
  children: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button type="button" disabled aria-disabled="true" title={title} className={`button button-outline ${className}`}>
      <LockKeyhole size={13} /> {children}
    </button>
  );
}

function ScheduleKpis() {
  const icons = {
    arriving: Ship,
    overdue: AlertCircle,
    units: Box,
    stock: Warehouse,
  } as const;

  return (
    <AdminKpiGrid
      label="Показники графіка доставки"
      hideOnMobile
      items={scheduleKpis.map((metric) => {
        const Icon = icons[metric.id];
        return {
          id: metric.id,
          label: metric.label,
          value: metric.value,
          helper: metric.helper,
          tone: metric.tone,
          icon: <Icon size={17} />,
        };
      })}
    />
  );
}

function eventToneClass(status: ScheduleSlotStatus) {
  if (status === "in-transit") return styles.eventTransit;
  if (status === "future") return styles.eventFuture;
  return styles.eventArrived;
}

function timelineStatusLabel(status: ScheduleSlotStatus) {
  if (status === "in-transit") return "В дорозі";
  if (status === "future") return "Майбутня";
  return "Прибуло";
}

function timelineSlotLabel(slotCount: number) {
  return slotCount === 1 ? "1 слот" : `${slotCount} слоти`;
}

function timelineGroupLabel(count: number) {
  const finalTwoDigits = count % 100;
  const finalDigit = count % 10;
  if (finalTwoDigits >= 11 && finalTwoDigits <= 14) return `${count} груп`;
  if (finalDigit === 1) return `${count} група`;
  if (finalDigit >= 2 && finalDigit <= 4) return `${count} групи`;
  return `${count} груп`;
}

function timelineGroupStatus(events: readonly TimelineEvent[]): ScheduleSlotStatus {
  if (events.some((event) => event.status === "in-transit")) return "in-transit";
  if (events.some((event) => event.status === "future")) return "future";
  return "arrived";
}

function Chronology() {
  const [pastMonths, setPastMonths] = useState(defaultPastMonths);
  const [futureMonths, setFutureMonths] = useState(defaultFutureMonths);
  const timelineMonths = useMemo(() => buildTimelineMonths(pastMonths, futureMonths), [futureMonths, pastMonths]);
  const firstMonth = timelineMonths[0];
  const lastMonth = timelineMonths[timelineMonths.length - 1];
  const rangeLabel = `${firstMonth.longLabel} ${firstMonth.year} — ${lastMonth.longLabel} ${lastMonth.year}`;
  const timelineWindow = useMemo(() => ({
    start: Date.UTC(firstMonth.year, firstMonth.month, 1),
    end: Date.UTC(lastMonth.year, lastMonth.month + 1, 1),
  }), [firstMonth.month, firstMonth.year, lastMonth.month, lastMonth.year]);
  const visibleTimelineEvents = useMemo(
    () => scheduleTimelineEvents.filter((event) => {
      const date = timelineDateValue(event.arrivalDate);
      return date >= timelineWindow.start && date < timelineWindow.end;
    }),
    [timelineWindow.end, timelineWindow.start],
  );
  const timelineDateGroups = useMemo<TimelineDateGroup[]>(() => {
    const groups = new Map<TimelineEvent["arrivalDate"], TimelineEvent[]>();
    visibleTimelineEvents.forEach((event) => {
      const existing = groups.get(event.arrivalDate) ?? [];
      existing.push(event);
      groups.set(event.arrivalDate, existing);
    });
    return Array.from(groups, ([arrivalDate, events]) => ({
      arrivalDate,
      events,
      quantity: events.reduce((total, event) => total + event.quantity, 0),
      status: timelineGroupStatus(events),
    })).sort((left, right) => timelineDateValue(left.arrivalDate) - timelineDateValue(right.arrivalDate));
  }, [visibleTimelineEvents]);
  const timelineMonthSummaries = useMemo(() => timelineMonths.map((month) => {
    const groups = timelineDateGroups.filter((group) => {
      const date = new Date(timelineDateValue(group.arrivalDate));
      return date.getUTCFullYear() === month.year && date.getUTCMonth() === month.month;
    });
    return {
      ...month,
      groups,
      eventCount: groups.reduce((total, group) => total + group.events.length, 0),
      quantity: groups.reduce((total, group) => total + group.quantity, 0),
    };
  }), [timelineDateGroups, timelineMonths]);

  return (
    <Panel className={`${styles.chronologyPanel} overflow-visible p-0 shadow-none`}>
      <PersistedCollapsibleSection
        persistenceId="admin.schedule.chronology"
        title="Хронологія доставок"
        headingId="schedule-timeline-title"
        icon={<CalendarDays size={14} />}
        summary={<>{visibleTimelineEvents.length} з {scheduleTimelineEvents.length} груп у періоді · {rangeLabel}</>}
        titleAccessory={(
          <details className={styles.timelineRangeDetails}>
            <summary aria-label="Налаштувати видимий період">
              <SlidersHorizontal size={12} aria-hidden="true" />
              <span>Період</span>
              <ChevronDown size={12} className={styles.timelineRangeChevron} aria-hidden="true" />
            </summary>
            <div className={styles.timelineRangePopover}>
              <div className={styles.timelineRangeControls} aria-label="Налаштування видимого періоду">
                <div className={styles.timelineRangeGroup} role="group" aria-label="Місяці в минулому">
                  <span>Назад</span>
                  <button type="button" aria-label="Зменшити кількість минулих місяців" disabled={pastMonths === 0} onClick={() => setPastMonths((value) => Math.max(0, value - 1))}><Minus size={12} /></button>
                  <output aria-live="polite">{pastMonths} міс.</output>
                  <button type="button" aria-label="Збільшити кількість минулих місяців" disabled={pastMonths === 12} onClick={() => setPastMonths((value) => Math.min(12, value + 1))}><Plus size={12} /></button>
                </div>
                <span className={styles.timelineRangeDivider} aria-hidden="true" />
                <div className={styles.timelineRangeGroup} role="group" aria-label="Місяці в майбутньому">
                  <span>Вперед</span>
                  <button type="button" aria-label="Зменшити кількість майбутніх місяців" disabled={futureMonths === 0} onClick={() => setFutureMonths((value) => Math.max(0, value - 1))}><Minus size={12} /></button>
                  <output aria-live="polite">{futureMonths} міс.</output>
                  <button type="button" aria-label="Збільшити кількість майбутніх місяців" disabled={futureMonths === 6} onClick={() => setFutureMonths((value) => Math.min(6, value + 1))}><Plus size={12} /></button>
                </div>
              </div>
            </div>
          </details>
        )}
        actions={(
          <div className="flex flex-wrap items-center gap-4 text-[9px] text-[var(--muted-foreground)]" aria-label="Легенда хронології">
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--green)]" />Прибуло</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--blue)]" />В дорозі</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--faint)]" />Майбутні</span>
          </div>
        )}
        headerClassName="p-4"
        contentClassName="px-4 pb-4"
      >
        <figure className="m-0" aria-labelledby="schedule-timeline-title" aria-describedby="schedule-timeline-caption">
          <div className={styles.chronologyRailViewport} role="region" aria-label={`Хронологія доставок: ${rangeLabel}`} tabIndex={0}>
            <ol className={styles.chronologyMonthRail} aria-label="Місяці видимого періоду">
              {timelineMonthSummaries.map((month) => {
                const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
                const todayPosition = ((timelineReferenceDate.day - 0.5) / daysInMonth) * 100;
                const summary = month.eventCount > 0 ? `${timelineGroupLabel(month.eventCount)} · ${month.quantity} од.` : "Доставок немає";
                return (
                  <li
                    key={month.id}
                    className={`${styles.chronologyMonth} ${month.eventCount > 0 ? styles.chronologyMonthActive : ""} ${month.current ? styles.chronologyCurrentMonth : ""}`}
                    aria-current={month.current ? "date" : undefined}
                    aria-label={`${month.longLabel} ${month.year}: ${summary}${month.current ? ", поточний місяць" : ""}`}
                  >
                    <span className={styles.chronologyMonthHeading}>
                      <strong>{month.label}</strong>
                      {month.current ? <span>Сьогодні</span> : null}
                    </span>
                    <svg className={styles.chronologyMonthAxis} viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">
                      <line className={styles.chronologyMonthAxisLine} x1="0" y1="8" x2="100" y2="8" vectorEffect="non-scaling-stroke" />
                      {month.groups.map((group) => {
                        const day = new Date(timelineDateValue(group.arrivalDate)).getUTCDate();
                        const position = ((day - 0.5) / daysInMonth) * 100;
                        return <line key={group.arrivalDate} className={`${styles.chronologyDateTick} ${eventToneClass(group.status)}`} x1={position} y1="3" x2={position} y2="13" vectorEffect="non-scaling-stroke" />;
                      })}
                      {month.current ? <line className={styles.chronologyNowTick} x1={todayPosition} y1="0" x2={todayPosition} y2="16" vectorEffect="non-scaling-stroke" /> : null}
                    </svg>
                    <span className={styles.chronologyMonthMetric}>{month.eventCount > 0 ? <><strong>{timelineGroupLabel(month.eventCount)}</strong><small>{month.quantity} од.</small></> : <small>—</small>}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          {timelineDateGroups.length > 0 ? (
            <div className={styles.chronologyAgenda}>
              <div className={styles.chronologyAgendaHeading}>
                <span>Доставки за датами</span>
                <small>{timelineDateGroups.length} дат · {timelineGroupLabel(visibleTimelineEvents.length)}</small>
              </div>
              <ol className={styles.chronologyDateGroups} aria-label="Доставки, згруповані за датами">
                {timelineDateGroups.map((group) => (
                  <li key={group.arrivalDate} className={styles.chronologyDateGroup}>
                    <div className={styles.chronologyDateGroupHeading}>
                      <time dateTime={group.arrivalDate}>{formatTimelineDate(group.arrivalDate).slice(0, 5)}</time>
                      <span>{timelineGroupLabel(group.events.length)}</span>
                    </div>
                    <ul>
                      {group.events.map((event) => {
                        const label = `${event.category}${event.slotCount > 1 ? ` ×${event.slotCount}` : ""}`;
                        return (
                          <li key={event.id} aria-label={`${label}: ${event.quantity} одиниць, ${event.free} вільно, ${timelineStatusLabel(event.status).toLocaleLowerCase("uk-UA")}`}>
                            <span className={`${styles.chronologyAgendaDot} ${eventToneClass(event.status)}`} aria-hidden="true" />
                            <strong>{label}</strong>
                            <span className={styles.chronologyAgendaQuantity}>{event.quantity} <small>од.</small></span>
                            <small className={styles.chronologyAgendaMeta}>{timelineSlotLabel(event.slotCount)} · {event.free} вільно</small>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          ) : <p className={styles.chronologyEmpty}>У цьому періоді немає доставок</p>}
          <figcaption id="schedule-timeline-caption" className="sr-only">Огляд місяців із маркерами реальних дат і компактним журналом доставок. Зміна періоду одночасно змінює шкалу та додає або прибирає датовані групи.</figcaption>
        </figure>
      </PersistedCollapsibleSection>
    </Panel>
  );
}

function SlotRow({ slot, selected, onSelect }: { slot: ScheduleSlot; selected: boolean; onSelect: (slot: ScheduleSlot) => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(slot)}
      className={`${styles.slotRow} border-b border-[var(--border)] text-left text-[11px] transition-colors last:border-b-0 ${selected ? "bg-[color-mix(in_srgb,var(--blue-soft)_45%,var(--surface))]" : "hover:bg-[var(--surface-subtle)]"}`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2"><StatusBadge>{slot.category}</StatusBadge><strong className="truncate text-[13px] font-medium">{slot.name.replace(`${slot.category} `, "")}</strong></span>
        <span className="mt-1 block pl-10 text-[9px] text-[var(--red)]">Оплата до: {slot.paymentDue}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]"><span className="size-1.5 rounded-full bg-[var(--green)]" />Прибуло</span>
      <span className="tabular-nums">{slot.arrival}</span>
      <span className="text-right tabular-nums"><strong className={slot.free > 0 ? "text-[var(--green)]" : "font-normal"}>{slot.free}</strong>/{slot.total}</span>
    </button>
  );
}

function SourceBoundaryEmpty({ page }: { page: number }) {
  return (
    <div className="grid min-h-44 place-items-center p-6 text-center text-[11px] text-[var(--muted-foreground)]">
      <div><Package size={22} className="mx-auto mb-2" /><p className="m-0">Сторінка {page} доступна у локальній пагінації.</p><p className="mb-0 mt-1">Її рядки не входять до репрезентативного source fixture; загальний лічильник 23 збережено.</p></div>
    </div>
  );
}

function SlotList({
  slots,
  page,
  selectedId,
  category,
  onPageChange,
  onSelect,
}: {
  slots: readonly ScheduleSlot[];
  page: number;
  selectedId: string | null;
  category: ScheduleCategoryFilter;
  onPageChange: (page: number) => void;
  onSelect: (slot: ScheduleSlot) => void;
}) {
  return (
    <Panel className="min-w-0 overflow-hidden shadow-none">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <span className="grid size-8 place-items-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]"><Ship size={15} /></span>
        <h2 className="m-0 text-[15px] font-semibold">Слоти доставки <span className="font-normal text-[var(--muted-foreground)]">(23)</span></h2>
      </div>
      <p className="m-0 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
        Репрезентативна source-вибірка: {category === "all" ? `сторінка ${page} з 4` : `категорія ${category}`} · показано {slots.length} рядків.
      </p>
      <div className={styles.slotListScroller}>
        <div className={`${styles.slotListHeader} border-b border-[var(--border)] text-[10px] text-[var(--muted-foreground)]`}><span>Назва</span><span>Статус</span><span>Прибуття</span><span className="text-right">Вільно</span></div>
        {slots.map((slot) => <SlotRow key={slot.id} slot={slot} selected={selectedId === slot.id} onSelect={onSelect} />)}
        {slots.length === 0 && page <= 2 ? <div className="grid min-h-44 place-items-center p-6 text-[11px] text-[var(--muted-foreground)]">У репрезентативній вибірці немає слотів цієї категорії.</div> : null}
        {page > 2 ? <SourceBoundaryEmpty page={page} /> : null}
      </div>
      <div className="flex items-center justify-center gap-4 border-t border-[var(--border)] px-4 py-3">
        <button type="button" className="icon-button icon-button-small" aria-label="Попередня сторінка слотів" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}><ChevronLeft size={15} /></button>
        <span className="text-[11px] text-[var(--muted-foreground)]">{page} / {scheduleSourceTotals.pages}</span>
        <button type="button" className="icon-button icon-button-small" aria-label="Наступна сторінка слотів" disabled={page === scheduleSourceTotals.pages} onClick={() => onPageChange(Math.min(scheduleSourceTotals.pages, page + 1))}><ChevronRight size={15} /></button>
      </div>
    </Panel>
  );
}

function SlotDetail({ slot, detailPage, onDetailPageChange }: { slot: ScheduleSlot | null; detailPage: number; onDetailPageChange: (page: number) => void }) {
  if (!slot) {
    return (
      <Panel className="min-h-[430px] overflow-hidden shadow-none">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3"><span className="grid size-8 place-items-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]"><CalendarDays size={15} /></span><h2 className="m-0 text-[15px] font-semibold">Оберіть слот</h2></div>
        <EmptyState icon={<CalendarDays size={24} />} title="Оберіть слот доставки" description="Оберіть слот доставки для перегляду деталей" />
      </Panel>
    );
  }

  const hasPaginatedLines = slot.id === "pwc-march-2026-1";
  const lines = hasPaginatedLines
    ? (detailPage === 1 ? slot.lines.slice(0, 9) : slot.lines.slice(9))
    : slot.lines;
  const detailPages = hasPaginatedLines ? 2 : 1;

  return (
    <Panel className="min-h-[430px] min-w-0 overflow-hidden shadow-none">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3"><span className="grid size-8 place-items-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]"><CalendarDays size={15} /></span><StatusBadge>{slot.category}</StatusBadge><h2 className="m-0 truncate text-[15px] font-semibold">{slot.detailTitle}</h2></div>
      <div className="grid grid-cols-1 gap-3 border-b border-[var(--border)] px-4 py-4 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]"><CalendarDays size={14} />Прибуття: <strong className="text-[var(--foreground)]">{slot.arrival}</strong></span>
        <span className="inline-flex items-center gap-2 text-[11px] text-[var(--red)]"><CreditCard size={14} />Оплата: <strong>{slot.paymentDue}</strong></span>
      </div>
      {lines.length > 0 ? (
        <div className="data-table-wrap" role="region" aria-label={`Склад слоту ${slot.name}`} tabIndex={0}>
          <table className="data-table min-w-[520px]">
            <thead><tr><th>SKU</th><th>Модель</th><th className="text-right">Усього</th><th className="text-right">Вільно</th></tr></thead>
            <tbody>{lines.map((line) => <tr key={line.id}><td className="font-mono">{line.sku}</td><td>{line.model}</td><td className="text-right tabular-nums">{line.total}</td><td className="text-right tabular-nums">{line.free}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="grid min-h-52 place-items-center p-6 text-center text-[11px] text-[var(--muted-foreground)]">Детальні позиції цього слоту не входять до репрезентативного source fixture.</div>
      )}
      {lines.length > 0 ? (
        <div className="flex items-center justify-center gap-4 border-t border-[var(--border)] px-4 py-3"><button type="button" className="icon-button icon-button-small" aria-label="Попередня сторінка складу слоту" disabled={detailPage === 1} onClick={() => onDetailPageChange(Math.max(1, detailPage - 1))}><ChevronLeft size={15} /></button><span className="text-[11px] text-[var(--muted-foreground)]">{detailPage} / {detailPages}</span><button type="button" className="icon-button icon-button-small" aria-label="Наступна сторінка складу слоту" disabled={detailPage === detailPages} onClick={() => onDetailPageChange(Math.min(detailPages, detailPage + 1))}><ChevronRight size={15} /></button></div>
      ) : null}
    </Panel>
  );
}

function SearchResults({ query, category }: { query: string; category: ScheduleCategoryFilter }) {
  const results = useMemo(() => scheduleSearchResults.filter((result) => {
    const slot = scheduleSlots.find((item) => item.id === result.slotId);
    if (category !== "all" && slot?.category !== category) return false;
    return normalize(`${result.sku} ${result.model} ${result.slotName}`).includes(normalize(query));
  }), [category, query]);
  const matchingSlotIds = new Set(results.map((result) => result.slotId));
  const matchingSlots = scheduleSlots.filter((slot) => matchingSlotIds.has(slot.id));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel className="overflow-hidden shadow-none">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3"><span className="grid size-8 place-items-center rounded-md bg-[var(--blue-soft)] text-[var(--blue)]"><Ship size={15} /></span><h2 className="m-0 text-[15px] font-semibold">Відповідні слоти <span className="font-normal text-[var(--muted-foreground)]">({matchingSlots.length} з 23)</span></h2></div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[500px] grid-cols-[minmax(210px,1.4fr)_90px_100px_54px] gap-3 border-b border-[var(--border)] px-3 py-3 text-[10px] text-[var(--muted-foreground)]"><span>Назва</span><span>Статус</span><span>Прибуття</span><span className="text-right">Збіги</span></div>
          {matchingSlots.map((slot) => (
            <div key={slot.id} className="grid min-w-[500px] grid-cols-[minmax(210px,1.4fr)_90px_100px_54px] items-center gap-3 px-3 py-3 text-[11px]"><span><span className="flex items-center gap-2"><StatusBadge>{slot.category}</StatusBadge><strong className="text-[13px]">{slot.name.replace(`${slot.category} `, "")}</strong></span><small className="mt-1 block pl-10 text-[9px] text-[var(--red)]">Оплата до: {slot.paymentDue}</small></span><span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]"><span className="size-1.5 rounded-full bg-[var(--green)]" />Прибуло</span><span>{slot.arrival}</span><strong className="text-right text-[var(--green)]">{results.filter((result) => result.slotId === slot.id).reduce((sum, result) => sum + result.total, 0)}</strong></div>
          ))}
          {matchingSlots.length === 0 ? <div className="grid min-h-32 place-items-center p-5 text-[11px] text-[var(--muted-foreground)]">Відповідних слотів не знайдено</div> : null}
        </div>
      </Panel>

      <Panel className="overflow-hidden shadow-none">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3"><span className="grid size-8 place-items-center rounded-md bg-[var(--orange-soft)] text-[var(--orange)]"><Search size={15} /></span><h2 className="m-0 truncate text-[15px] font-semibold">Результати: &quot;{query}&quot;</h2></div>
        <div className="data-table-wrap">
          <table className="data-table min-w-[520px]"><thead><tr><th>Модель</th><th>Слот</th><th className="text-right">Усього</th><th className="text-right">Вільно</th></tr></thead><tbody>
            {results.map((result) => <tr key={result.id}><td><strong className="block font-medium">{result.model}</strong><span className="font-mono text-[10px] text-[var(--muted-foreground)]">{result.sku}</span></td><td>{result.slotName}<span className="block text-[10px] text-[var(--muted-foreground)]">{result.arrival}</span></td><td className="text-right">{result.total}</td><td className="text-right">{result.free}</td></tr>)}
            {results.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-[var(--muted-foreground)]">Позиції не знайдено</td></tr> : null}
          </tbody></table>
        </div>
      </Panel>
    </div>
  );
}

function Deliveries({
  category,
  query,
  onCategoryChange,
  onQueryChange,
}: {
  category: ScheduleCategoryFilter;
  query: string;
  onCategoryChange: (category: ScheduleCategoryFilter) => void;
  onQueryChange: (query: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);

  const visibleSlots = useMemo(() => scheduleSlots.filter((slot) => {
    if (slot.sourcePage !== page) return false;
    return category === "all" || slot.category === category;
  }), [category, page]);
  const selectedSlot = scheduleSlots.find((slot) => slot.id === selectedId) ?? null;

  const updateCategory = (next: ScheduleCategoryFilter) => {
    onCategoryChange(next);
    setPage(1);
    setSelectedId(null);
    setDetailPage(1);
  };
  const updateQuery = (next: string) => {
    onQueryChange(next);
    setPage(1);
    setSelectedId(null);
    setDetailPage(1);
  };
  const updatePage = (next: number) => {
    setPage(next);
  };
  const selectSlot = (slot: ScheduleSlot) => {
    setSelectedId(slot.id);
    setDetailPage(1);
  };

  return (
    <section
      id="schedule-deliveries-panel"
      role="tabpanel"
      aria-labelledby="schedule-deliveries-panel-tab"
      className="grid gap-4"
    >
      <AdminToolbar
        className={styles.scheduleToolbar}
        search={(
          <AdminSearchField
            value={query}
            onValueChange={updateQuery}
            label="Пошук SKU або моделі"
            placeholder="Пошук SKU або моделі..."
          />
        )}
        filters={(
          <AdminSegmentedControl<ScheduleCategoryFilter>
            items={categoryFilters}
            value={category}
            onValueChange={updateCategory}
            label="Категорії слотів доставки"
          />
        )}
        mobileDisclosure={{ sections: ["filters"], activeCount: Number(category !== "all") }}
      />
      {normalize(query) ? (
        <SearchResults query={query} category={category} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <SlotList slots={visibleSlots} page={page} selectedId={selectedId} category={category} onPageChange={updatePage} onSelect={selectSlot} />
          <SlotDetail slot={selectedSlot} detailPage={detailPage} onDetailPageChange={setDetailPage} />
        </div>
      )}
    </section>
  );
}

function WarehouseStock() {
  return (
    <section id="schedule-stock-panel" role="tabpanel" aria-labelledby="schedule-stock-panel-tab" className={styles.stockPanel}>
      <AdminTableShell
        className={styles.stockTable}
        notice="Репрезентативна source-вибірка: 5 категорій; точний загальний складський лічильник — 33 од."
        scrollLabel="Складські запаси"
      >
        <table className="data-table min-w-[760px]">
          <thead><tr><th>Модель</th><th>Категорія</th><th>Розташування</th><th className="text-right">Усього</th><th className="text-right">Зарезервовано</th><th className="text-right">Вільно</th></tr></thead>
          <tbody>{scheduleStockRows.map((row) => <tr key={row.id}><td className="font-medium">{row.model}</td><td><StatusBadge>{row.category}</StatusBadge></td><td>{row.location}</td><td className="text-right tabular-nums">{row.total}</td><td className="text-right tabular-nums">{row.reserved || "—"}</td><td className="text-right font-medium tabular-nums text-[var(--green)]">{row.free}</td></tr>)}</tbody>
        </table>
      </AdminTableShell>
    </section>
  );
}

function ScheduleFooter() {
  return (
    <footer className="flex flex-col gap-2 border-t border-[var(--border)] pt-3 text-[10px] text-[var(--muted-foreground)] sm:flex-row sm:items-center">
      <span>Остання перевірка: <strong className="text-[var(--foreground)]">{scheduleSourceTotals.lastChecked}</strong></span>
      <span>Остання синхр.: <strong className="text-[var(--foreground)]">{scheduleSourceTotals.lastSynced}</strong></span>
      <span className="sm:ml-auto">{scheduleSourceTotals.slots} слотів</span><span>{scheduleSourceTotals.positions} позицій</span><span>{scheduleSourceTotals.stock} на складі</span>
    </footer>
  );
}

export function AdminSchedulePage() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("deliveries");
  const [category, setCategory] = useState<ScheduleCategoryFilter>("all");
  const [query, setQuery] = useState("");

  return (
    <AdminPage>
      <AdminPageHeader
        icon={<CalendarDays size={20} />}
        title="Графік доставки"
        actions={(
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
            <LockedButton title="Відкриття або експорт Excel вимкнені у read-only клоні"><ExternalLink size={14} /> Відкрити Excel</LockedButton>
            <LockedButton title="Синхронізація вимкнена у read-only клоні" className="!border-[var(--orange)] !bg-[var(--orange)] !text-white"><RefreshCw size={14} /> Синхронізувати</LockedButton>
          </div>
        )}
      />
      <ScheduleKpis />
      <Chronology />
      <AdminTabs<ScheduleTab>
        items={[
          { id: "deliveries", label: "Доставки", panelId: "schedule-deliveries-panel" },
          { id: "stock", label: "Складські запаси", panelId: "schedule-stock-panel" },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
        label="Графік доставки"
      />
      {activeTab === "deliveries" ? (
        <Deliveries category={category} query={query} onCategoryChange={setCategory} onQueryChange={setQuery} />
      ) : <WarehouseStock />}
      <ScheduleFooter />
    </AdminPage>
  );
}
