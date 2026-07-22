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
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
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
import {usePersistedBoolean} from "@/hooks/use-persisted-boolean";
import {
  scheduleKpis,
  scheduleSlots,
  scheduleSourceTotals,
  scheduleStockRows,
  type ScheduleSlot,
  type ScheduleSlotStatus,
  type ScheduleTab,
} from "@/lib/admin-schedule-data";
import {
  buildScheduleTimelineModel,
  filterScheduleSearchResults,
  filterScheduleSlots,
  findScheduleSlot,
  formatScheduleTimelineDate,
  normalizeScheduleSearch,
  scheduleCategoryFilters,
  scheduleTimelineDateValue,
  scheduleTimelineDefaults,
  scheduleTimelineGroupLabel,
  scheduleTimelineReferenceDate,
  scheduleTimelineSlotLabel,
  scheduleTimelineStatusLabel,
  type ScheduleCategoryFilter,
} from "@/lib/admin-schedule-view-model";
import styles from "./admin-schedule.module.css";

const loadAstryxAdminScheduleView = () => import("./astryx-admin-schedule-view");

export type ScheduleViewProps = {
  activeTab: ScheduleTab;
  category: ScheduleCategoryFilter;
  query: string;
  page: number;
  selectedId: string | null;
  detailPage: number;
  pastMonths: number;
  futureMonths: number;
  chronologyOpen: boolean;
  onActiveTabChange: (tab: ScheduleTab) => void;
  onCategoryChange: (category: ScheduleCategoryFilter) => void;
  onQueryChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onSelectedIdChange: (id: string | null) => void;
  onDetailPageChange: (page: number) => void;
  onPastMonthsChange: (months: number) => void;
  onFutureMonthsChange: (months: number) => void;
  onChronologyOpenChange: (open: boolean) => void;
};

function LockedButton({ children, title, className = "", describedBy }: {
  children: ReactNode;
  title: string;
  className?: string;
  describedBy?: string;
}) {
  return (
    <button type="button" disabled aria-disabled="true" aria-describedby={describedBy} title={title} className={`button button-outline ${className}`}>
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

function Chronology({
  pastMonths,
  futureMonths,
  chronologyOpen,
  onPastMonthsChange,
  onFutureMonthsChange,
  onChronologyOpenChange,
}: Pick<ScheduleViewProps, "pastMonths" | "futureMonths" | "chronologyOpen" | "onPastMonthsChange" | "onFutureMonthsChange" | "onChronologyOpenChange">) {
  const timeline = useMemo(
    () => buildScheduleTimelineModel(pastMonths, futureMonths),
    [futureMonths, pastMonths],
  );

  return (
    <Panel className={`${styles.chronologyPanel} overflow-visible p-0 shadow-none`}>
      <PersistedCollapsibleSection
        persistenceId="admin.schedule.chronology"
        open={chronologyOpen}
        onOpenChange={onChronologyOpenChange}
        title="Хронологія доставок"
        headingId="schedule-timeline-title"
        icon={<CalendarDays size={14} />}
        summary={<>{timeline.visibleEvents.length} з {scheduleSlots.length - 1} груп у періоді · {timeline.rangeLabel}</>}
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
                  <button type="button" aria-label="Зменшити кількість минулих місяців" disabled={pastMonths === 0} onClick={() => onPastMonthsChange(Math.max(0, pastMonths - 1))}><Minus size={12} /></button>
                  <output aria-live="polite">{pastMonths} міс.</output>
                  <button type="button" aria-label="Збільшити кількість минулих місяців" disabled={pastMonths === scheduleTimelineDefaults.maxPastMonths} onClick={() => onPastMonthsChange(Math.min(scheduleTimelineDefaults.maxPastMonths, pastMonths + 1))}><Plus size={12} /></button>
                </div>
                <span className={styles.timelineRangeDivider} aria-hidden="true" />
                <div className={styles.timelineRangeGroup} role="group" aria-label="Місяці в майбутньому">
                  <span>Вперед</span>
                  <button type="button" aria-label="Зменшити кількість майбутніх місяців" disabled={futureMonths === 0} onClick={() => onFutureMonthsChange(Math.max(0, futureMonths - 1))}><Minus size={12} /></button>
                  <output aria-live="polite">{futureMonths} міс.</output>
                  <button type="button" aria-label="Збільшити кількість майбутніх місяців" disabled={futureMonths === scheduleTimelineDefaults.maxFutureMonths} onClick={() => onFutureMonthsChange(Math.min(scheduleTimelineDefaults.maxFutureMonths, futureMonths + 1))}><Plus size={12} /></button>
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
          <div className={styles.chronologyRailViewport} role="region" aria-label={`Хронологія доставок: ${timeline.rangeLabel}`} tabIndex={0}>
            <ol className={styles.chronologyMonthRail} aria-label="Місяці видимого періоду">
              {timeline.months.map((month) => {
                const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
                const todayPosition = ((scheduleTimelineReferenceDate.day - 0.5) / daysInMonth) * 100;
                const summary = month.eventCount > 0 ? `${scheduleTimelineGroupLabel(month.eventCount)} · ${month.quantity} од.` : "Доставок немає";
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
                        const day = new Date(scheduleTimelineDateValue(group.arrivalDate)).getUTCDate();
                        const position = ((day - 0.5) / daysInMonth) * 100;
                        return <line key={group.arrivalDate} className={`${styles.chronologyDateTick} ${eventToneClass(group.status)}`} x1={position} y1="3" x2={position} y2="13" vectorEffect="non-scaling-stroke" />;
                      })}
                      {month.current ? <line className={styles.chronologyNowTick} x1={todayPosition} y1="0" x2={todayPosition} y2="16" vectorEffect="non-scaling-stroke" /> : null}
                    </svg>
                    <span className={styles.chronologyMonthMetric}>{month.eventCount > 0 ? <><strong>{scheduleTimelineGroupLabel(month.eventCount)}</strong><small>{month.quantity} од.</small></> : <small>—</small>}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          {timeline.dateGroups.length > 0 ? (
            <div className={styles.chronologyAgenda}>
              <div className={styles.chronologyAgendaHeading}>
                <span>Доставки за датами</span>
                <small>{timeline.dateGroups.length} дат · {scheduleTimelineGroupLabel(timeline.visibleEvents.length)}</small>
              </div>
              <ol className={styles.chronologyDateGroups} aria-label="Доставки, згруповані за датами">
                {timeline.dateGroups.map((group) => (
                  <li key={group.arrivalDate} className={styles.chronologyDateGroup}>
                    <div className={styles.chronologyDateGroupHeading}>
                      <time dateTime={group.arrivalDate}>{formatScheduleTimelineDate(group.arrivalDate).slice(0, 5)}</time>
                      <span>{scheduleTimelineGroupLabel(group.events.length)}</span>
                    </div>
                    <ul>
                      {group.events.map((event) => {
                        const label = `${event.category}${event.slotCount > 1 ? ` ×${event.slotCount}` : ""}`;
                        return (
                          <li key={event.id} aria-label={`${label}: ${event.quantity} одиниць, ${event.free} вільно, ${scheduleTimelineStatusLabel(event.status).toLocaleLowerCase("uk-UA")}`}>
                            <span className={`${styles.chronologyAgendaDot} ${eventToneClass(event.status)}`} aria-hidden="true" />
                            <strong>{label}</strong>
                            <span className={styles.chronologyAgendaQuantity}>{event.quantity} <small>од.</small></span>
                            <small className={styles.chronologyAgendaMeta}>{scheduleTimelineSlotLabel(event.slotCount)} · {event.free} вільно</small>
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
      <div><Package size={22} className="mx-auto mb-2" /><p className="m-0">Для сторінки {page} поки немає рядків.</p><p className="mb-0 mt-1">Загальний лічильник 23 збережено за даними графіка.</p></div>
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
        {category === "all" ? `Сторінка ${page} з 4` : `Категорія ${category}`} · показано {slots.length} рядків.
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
        <div className="grid min-h-52 place-items-center p-6 text-center text-[11px] text-[var(--muted-foreground)]">Для цього слоту поки немає детальних позицій.</div>
      )}
      {lines.length > 0 ? (
        <div className="flex items-center justify-center gap-4 border-t border-[var(--border)] px-4 py-3"><button type="button" className="icon-button icon-button-small" aria-label="Попередня сторінка складу слоту" disabled={detailPage === 1} onClick={() => onDetailPageChange(Math.max(1, detailPage - 1))}><ChevronLeft size={15} /></button><span className="text-[11px] text-[var(--muted-foreground)]">{detailPage} / {detailPages}</span><button type="button" className="icon-button icon-button-small" aria-label="Наступна сторінка складу слоту" disabled={detailPage === detailPages} onClick={() => onDetailPageChange(Math.min(detailPages, detailPage + 1))}><ChevronRight size={15} /></button></div>
      ) : null}
    </Panel>
  );
}

function SearchResults({ query, category }: { query: string; category: ScheduleCategoryFilter }) {
  const results = useMemo(
    () => filterScheduleSearchResults(query, category),
    [category, query],
  );
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
  page,
  selectedId,
  detailPage,
  onCategoryChange,
  onQueryChange,
  onPageChange,
  onSelectedIdChange,
  onDetailPageChange,
}: Pick<ScheduleViewProps,
  | "category"
  | "query"
  | "page"
  | "selectedId"
  | "detailPage"
  | "onCategoryChange"
  | "onQueryChange"
  | "onPageChange"
  | "onSelectedIdChange"
  | "onDetailPageChange"
>) {
  const visibleSlots = useMemo(
    () => filterScheduleSlots(page, category),
    [category, page],
  );
  const selectedSlot = findScheduleSlot(selectedId);

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
            onValueChange={onQueryChange}
            label="Пошук SKU або моделі"
            placeholder="Пошук SKU або моделі..."
          />
        )}
        filters={(
          <AdminSegmentedControl<ScheduleCategoryFilter>
            items={scheduleCategoryFilters}
            value={category}
            onValueChange={onCategoryChange}
            label="Категорії слотів доставки"
          />
        )}
        mobileDisclosure={{ sections: ["filters"], activeCount: Number(category !== "all") }}
      />
      {normalizeScheduleSearch(query) ? (
        <SearchResults query={query} category={category} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <SlotList slots={visibleSlots} page={page} selectedId={selectedId} category={category} onPageChange={onPageChange} onSelect={(slot) => onSelectedIdChange(slot.id)} />
          <SlotDetail slot={selectedSlot} detailPage={detailPage} onDetailPageChange={onDetailPageChange} />
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
        notice="Показано 5 категорій · загальний складський лічильник — 33 од."
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

function CurrentAdminScheduleView(props: ScheduleViewProps) {
  return (
    <div data-admin-schedule-renderer="current">
      <AdminPage>
        <AdminPageHeader
          icon={<CalendarDays size={20} />}
          title="Графік доставки"
          actions={(
            <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto" data-schedule-actions>
              <LockedButton describedBy="schedule-actions-safety" title="Відкриття Excel потребує підключення робочої книги"><ExternalLink size={14} /> Відкрити Excel</LockedButton>
              <LockedButton describedBy="schedule-actions-safety" title="Синхронізація доступна після підключення інтеграції 1С" className="!border-[var(--orange)] !bg-[var(--orange)] !text-white"><RefreshCw size={14} /> Синхронізувати</LockedButton>
              <p id="schedule-actions-safety" className="col-span-2 m-0 text-[11px] text-[var(--muted-foreground)] md:hidden">
                Дії стануть доступні після підключення Excel та інтеграції 1С.
              </p>
            </div>
          )}
        />
        <ScheduleKpis />
        <Chronology
          pastMonths={props.pastMonths}
          futureMonths={props.futureMonths}
          chronologyOpen={props.chronologyOpen}
          onPastMonthsChange={props.onPastMonthsChange}
          onFutureMonthsChange={props.onFutureMonthsChange}
          onChronologyOpenChange={props.onChronologyOpenChange}
        />
        <AdminTabs<ScheduleTab>
          items={[
            { id: "deliveries", label: "Доставки", panelId: "schedule-deliveries-panel" },
            { id: "stock", label: "Складські запаси", panelId: "schedule-stock-panel" },
          ]}
          value={props.activeTab}
          onValueChange={props.onActiveTabChange}
          label="Графік доставки"
        />
        {props.activeTab === "deliveries" ? <Deliveries {...props} /> : <WarehouseStock />}
        <ScheduleFooter />
      </AdminPage>
    </div>
  );
}

export function AdminSchedulePage() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("deliveries");
  const [category, setCategory] = useState<ScheduleCategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [pastMonths, setPastMonths] = useState<number>(scheduleTimelineDefaults.pastMonths);
  const [futureMonths, setFutureMonths] = useState<number>(scheduleTimelineDefaults.futureMonths);
  const {value: chronologyOpen, setValue: setChronologyOpen} = usePersistedBoolean("admin.schedule.chronology", true);

  const changeCategory = (nextCategory: ScheduleCategoryFilter) => {
    setCategory(nextCategory);
    setPage(1);
    setSelectedId(null);
    setDetailPage(1);
  };
  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
    setSelectedId(null);
    setDetailPage(1);
  };
  const selectSlot = (id: string | null) => {
    setSelectedId(id);
    setDetailPage(1);
  };

  const viewProps: ScheduleViewProps = {
    activeTab,
    category,
    query,
    page,
    selectedId,
    detailPage,
    pastMonths,
    futureMonths,
    chronologyOpen,
    onActiveTabChange: setActiveTab,
    onCategoryChange: changeCategory,
    onQueryChange: changeQuery,
    onPageChange: setPage,
    onSelectedIdChange: selectSlot,
    onDetailPageChange: setDetailPage,
    onPastMonthsChange: setPastMonths,
    onFutureMonthsChange: setFutureMonths,
    onChronologyOpenChange: setChronologyOpen,
  };

  return (
    <RendererViewSwitch
      slotId="admin-schedule"
      currentView={<CurrentAdminScheduleView {...viewProps} />}
      loadAstryxView={loadAstryxAdminScheduleView}
      astryxViewProps={viewProps}
    />
  );
}
