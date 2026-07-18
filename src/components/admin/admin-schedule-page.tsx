"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  Package,
  RefreshCw,
  Search,
  Ship,
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
import { EmptyState, Panel, StatusBadge } from "@/components/shared/ui";
import {
  scheduleKpis,
  scheduleSearchResults,
  scheduleSlots,
  scheduleSourceTotals,
  scheduleStockRows,
  type ScheduleCategory,
  type ScheduleSlot,
  type ScheduleSlotStatus,
  type ScheduleTab,
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

const monthLabels = ["СІЧ", "ЛЮТ", "БЕР", "КВІ", "ТРА", "ЧЕР", "ЛИП", "СЕР", "ВЕР", "ЖОВ", "ЛИС", "ГРУ"] as const;
const dayMs = 86_400_000;

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

type TimelineBucket = {
  id: string;
  date: string;
  dateMs: number;
  categoryLabel: string;
  quantity: number;
  status: ScheduleSlotStatus;
  lane: 0 | 1 | 2;
};

type TimelineDay = {
  id: string;
  bucket?: TimelineBucket;
  isToday: boolean;
  monthLabel?: string;
};

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function isoDate(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}

function startOfMonth(value: number) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function endOfMonth(value: number) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
}

function deriveTimeline(category: ScheduleCategoryFilter, query: string) {
  const normalizedQuery = normalize(query);
  const matchingSearchSlotIds = new Set(scheduleSearchResults
    .filter((result) => normalize(`${result.sku} ${result.model} ${result.slotName}`).includes(normalizedQuery))
    .map((result) => result.slotId));
  const filteredSlots = scheduleSlots.filter((slot) => {
    if (category !== "all" && slot.category !== category) return false;
    if (!normalizedQuery) return true;
    return matchingSearchSlotIds.has(slot.id) || normalize(`${slot.name} ${slot.detailTitle}`).includes(normalizedQuery);
  });

  const grouped = new Map<string, ScheduleSlot[]>();
  filteredSlots.forEach((slot) => grouped.set(slot.arrivalDate, [...(grouped.get(slot.arrivalDate) ?? []), slot]));

  const laneLastDates = [-Infinity, -Infinity, -Infinity];
  const buckets: TimelineBucket[] = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, slots]) => {
      const dateMs = parseIsoDate(date);
      let lane = laneLastDates.findIndex((lastDate) => dateMs - lastDate >= 5 * dayMs);
      if (lane === -1) lane = laneLastDates.indexOf(Math.min(...laneLastDates));
      laneLastDates[lane] = dateMs;

      const categories = new Map<ScheduleCategory, { count: number; quantity: number }>();
      slots.forEach((slot) => {
        const current = categories.get(slot.category) ?? { count: 0, quantity: 0 };
        categories.set(slot.category, { count: current.count + 1, quantity: current.quantity + slot.total });
      });
      const statuses = new Set(slots.map((slot) => slot.status));
      const status: ScheduleSlotStatus = statuses.size === 1
        ? slots[0].status
        : statuses.has("in-transit") ? "in-transit" : statuses.has("future") ? "future" : "arrived";

      return {
        id: `timeline-${date}`,
        date,
        dateMs,
        categoryLabel: [...categories.entries()]
          .map(([slotCategory, values]) => `${slotCategory}${values.count > 1 ? ` ×${values.count}` : ""}`)
          .join(" · "),
        quantity: slots.reduce((total, slot) => total + slot.total, 0),
        status,
        lane: lane as 0 | 1 | 2,
      };
    });

  if (!buckets.length) return { buckets, days: [] as TimelineDay[], label: "Немає подій у вибраному фільтрі" };

  const firstEvent = buckets[0].dateMs;
  const lastEvent = buckets[buckets.length - 1].dateMs;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const todayRelevant = today >= firstEvent - 31 * dayMs && today <= lastEvent + 45 * dayMs;
  const rangeStart = startOfMonth(todayRelevant ? Math.min(firstEvent, today) : firstEvent);
  const rangeEnd = endOfMonth(todayRelevant ? Math.max(lastEvent, today) : lastEvent);
  const bucketsByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));
  const days: TimelineDay[] = [];

  for (let current = rangeStart; current <= rangeEnd; current += dayMs) {
    const date = new Date(current);
    const monthStart = date.getUTCDate() === 1;
    days.push({
      id: isoDate(current),
      bucket: bucketsByDate.get(isoDate(current)),
      isToday: todayRelevant && current === today,
      monthLabel: monthStart ? `${monthLabels[date.getUTCMonth()]} ${date.getUTCFullYear()}` : undefined,
    });
  }

  const label = `${buckets[0].date.split("-").reverse().join(".")} — ${buckets[buckets.length - 1].date.split("-").reverse().join(".")}`;
  return { buckets, days, label };
}

function eventToneClass(status: ScheduleSlotStatus) {
  if (status === "in-transit") return styles.eventTransit;
  if (status === "future") return styles.eventFuture;
  return styles.eventArrived;
}

function Chronology({ category, query }: { category: ScheduleCategoryFilter; query: string }) {
  const timeline = useMemo(() => deriveTimeline(category, query), [category, query]);

  return (
    <Panel className="overflow-hidden p-4 shadow-none">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 flex items-center gap-2 text-[13px] font-semibold"><span aria-hidden="true" className="text-[var(--muted-foreground)]">┊┊</span> Хронологія доставок</h2>
        <div className="flex flex-wrap items-center gap-4 text-[9px] text-[var(--muted-foreground)]" aria-label="Легенда хронології">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--green)]" />Прибуло</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--blue)]" />В дорозі</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--faint)]" />Майбутні</span>
        </div>
      </div>

      {timeline.days.length ? (
        <div className={styles.timelineViewport} role="img" aria-label={`Хронологія доставок ${timeline.label}`} tabIndex={0}>
          <div className={styles.timelineTrack}>
            {timeline.days.map((day) => (
              <div key={day.id} className={`${styles.timelineDay} ${day.isToday ? styles.timelineToday : ""}`}>
                {day.bucket ? (
                  <div
                    className={`${styles.timelineEvent} ${styles[`lane${day.bucket.lane}`]} ${eventToneClass(day.bucket.status)}`}
                    title={`${day.bucket.categoryLabel}: ${day.bucket.quantity} · ${day.bucket.date.split("-").reverse().join(".")}`}
                  >
                    <span>{day.bucket.categoryLabel}</span>
                    <strong>{day.bucket.quantity}</strong>
                    <small>{day.bucket.date.slice(8, 10)}.{day.bucket.date.slice(5, 7)}</small>
                  </div>
                ) : null}
                {day.isToday ? <span className={styles.todayLabel}>Сьогодні</span> : null}
                {day.monthLabel ? <span className={styles.monthLabel}>{day.monthLabel}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.timelineEmpty}>{timeline.label}</div>
      )}
    </Panel>
  );
}

function SlotRow({ slot, selected, onSelect }: { slot: ScheduleSlot; selected: boolean; onSelect: (slot: ScheduleSlot) => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(slot)}
      className={`grid min-w-[510px] grid-cols-[minmax(210px,1.45fr)_90px_100px_62px] items-center gap-3 border-b border-[var(--border)] px-3 py-2.5 text-left text-[11px] transition-colors last:border-b-0 ${selected ? "bg-[color-mix(in_srgb,var(--blue-soft)_45%,var(--surface))]" : "hover:bg-[var(--surface-subtle)]"}`}
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
      <div className="overflow-x-auto">
        <div className="grid min-w-[510px] grid-cols-[minmax(210px,1.45fr)_90px_100px_62px] gap-3 border-b border-[var(--border)] px-3 py-3 text-[10px] text-[var(--muted-foreground)]"><span>Назва</span><span>Статус</span><span>Прибуття</span><span className="text-right">Вільно</span></div>
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
      />
      <Chronology category={category} query={query} />
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
    <section id="schedule-stock-panel" role="tabpanel" aria-labelledby="schedule-stock-panel-tab">
      <AdminTableShell
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
