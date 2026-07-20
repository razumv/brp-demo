"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  PackageOpen,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import {
  sourceSupplierBackorders,
  sourceSupplierOrders,
  supplierOrderExceptions,
  supplierOrderKpis,
  supplierOrderSortOptions,
  type SupplierOrderKpiTone,
  type SupplierOrdersSort,
  type SupplierOrdersTab,
} from "@/lib/admin-supplier-orders-data";
import styles from "./admin.module.css";

type ExceptionFilter = "all" | "missing-pdf";

type CalendarMonth = {
  id: string;
  label: string;
  days: number;
  leadingBlankDays: number;
};

const tabs: ReadonlyArray<{ id: SupplierOrdersTab; label: string }> = [
  { id: "all", label: "Всі замовлення" },
  { id: "backorders", label: "Бекордери" },
  { id: "exceptions", label: "Винятки" },
];

const calendarMonths: readonly CalendarMonth[] = [
  { id: "2026-07", label: "July 2026", days: 31, leadingBlankDays: 2 },
  { id: "2026-08", label: "August 2026", days: 31, leadingBlankDays: 5 },
];

const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

const kpiToneClasses: Record<SupplierOrderKpiTone, { dot: string; value: string }> = {
  neutral: { dot: "bg-[var(--faint)]", value: "text-[var(--muted-foreground)]" },
  blue: { dot: "bg-[var(--blue)]", value: "text-[var(--blue)]" },
  amber: { dot: "bg-[var(--amber)]", value: "text-[var(--amber)]" },
  green: { dot: "bg-[var(--green)]", value: "text-[var(--green)]" },
};

function isoDate(month: CalendarMonth, day: number) {
  return `${month.id}-${String(day).padStart(2, "0")}`;
}

function formatPeriodLabel(start: string | null, end: string | null) {
  if (!start) return "Період";
  const format = (value: string) => {
    const [, month, day] = value.split("-");
    return `${day}.${month}`;
  };
  return end ? `${format(start)} – ${format(end)}` : format(start);
}

function KpiGrid({ selected, onSelect }: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className={`${styles.mobileHiddenOnMobile} grid grid-cols-2 gap-3 xl:grid-cols-4`} aria-label="Показники замовлень постачальнику">
      {supplierOrderKpis.map((kpi) => {
        const tone = kpiToneClasses[kpi.tone];
        const isSelected = selected === kpi.id;
        return (
          <button
            key={kpi.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(kpi.id)}
            className={`min-h-[82px] rounded-md border bg-[var(--surface)] px-3 py-3 text-left shadow-[var(--shadow-card)] transition-colors sm:px-4 ${isSelected ? "border-[var(--orange)] ring-1 ring-[var(--orange-soft)]" : "border-[var(--border)] hover:border-[var(--faint)]"}`}
          >
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
              <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
              {kpi.label}
            </span>
            <strong className={`mt-2 block text-[22px] leading-none ${tone.value}`}>{kpi.value}</strong>
          </button>
        );
      })}
    </section>
  );
}

function CalendarMonthView({
  month,
  start,
  end,
  onSelect,
}: {
  month: CalendarMonth;
  start: string | null;
  end: string | null;
  onSelect: (value: string) => void;
}) {
  const cells = [
    ...Array.from({ length: month.leadingBlankDays }, () => null),
    ...Array.from({ length: month.days }, (_, index) => index + 1),
  ];

  return (
    <section className="min-w-0 flex-1" aria-label={month.label}>
      <h3 className="mb-3 text-center text-[13px] font-semibold">{month.label}</h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((weekday) => (
          <span key={weekday} className="py-1 text-[9px] font-semibold uppercase text-[var(--faint)]">{weekday}</span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
          const value = isoDate(month, day);
          const isStart = value === start;
          const isEnd = value === end;
          const inRange = Boolean(start && end && value > start && value < end);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isStart || isEnd}
              onClick={() => onSelect(value)}
              className={`grid aspect-square min-h-7 place-items-center rounded text-[11px] transition-colors ${isStart || isEnd ? "bg-[var(--orange)] font-semibold text-white" : inRange ? "bg-[var(--orange-soft)] text-[var(--orange)]" : "hover:bg-[var(--surface-subtle)]"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PeriodPicker({
  open,
  start,
  end,
  onToggle,
  onSelect,
}: {
  open: boolean;
  start: string | null;
  end: string | null;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="button button-outline w-fit whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onToggle}
      >
        <CalendarDays size={14} /> {formatPeriodLabel(start, end)}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Період замовлень постачальнику"
          className="absolute left-0 z-30 mt-2 w-[min(620px,calc(100vw-32px))] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl sm:right-0 sm:left-auto sm:w-[320px] lg:w-[560px] xl:w-[620px]"
        >
          <p className="mb-4 text-center text-[11px] text-[var(--muted-foreground)]">
            {!start || end ? "Click start date" : "Click end date"}
          </p>
          <div className="grid gap-5 lg:grid-cols-2">
            {calendarMonths.map((month) => (
              <CalendarMonthView key={month.id} month={month} start={start} end={end} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchToolbar({
  query,
  sort,
  periodOpen,
  periodStart,
  periodEnd,
  onQueryChange,
  onSortChange,
  onPeriodToggle,
  onPeriodSelect,
}: {
  query: string;
  sort: SupplierOrdersSort;
  periodOpen: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SupplierOrdersSort) => void;
  onPeriodToggle: () => void;
  onPeriodSelect: (value: string) => void;
}) {
  return (
    <AdminToolbar
      search={(
        <AdminSearchField
          value={query}
          onValueChange={onQueryChange}
          label="Пошук за номером SO або артикулом"
          placeholder="Пошук за номером SO, артикулом..."
        />
      )}
      filters={(
        <>
          <PeriodPicker
            open={periodOpen}
            start={periodStart}
            end={periodEnd}
            onToggle={onPeriodToggle}
            onSelect={onPeriodSelect}
          />
          <label className="relative min-w-[190px]">
            <span className="sr-only">Сортування замовлень постачальнику</span>
            <select
              className="h-10 w-full appearance-none rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 pr-9 text-[13px] outline-none focus:border-[var(--orange)]"
              value={sort}
              onChange={(event) => onSortChange(event.target.value as SupplierOrdersSort)}
            >
              {supplierOrderSortOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          </label>
        </>
      )}
      mobileDisclosure={{
        sections: ["filters"],
        activeCount: Number(Boolean(periodStart) || Boolean(periodEnd)) + Number(sort !== "status"),
      }}
    />
  );
}

function SupplierOrderTabs({ active, onChange }: {
  active: SupplierOrdersTab;
  onChange: (tab: SupplierOrdersTab) => void;
}) {
  return (
    <AdminTabs<SupplierOrdersTab>
      items={tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        mobileLabel: tab.label,
        count: tab.id === "exceptions" ? 2 : undefined,
        icon: tab.id === "exceptions" ? <AlertTriangle size={13} /> : undefined,
        panelId: `supplier-orders-${tab.id}-panel`,
      }))}
      value={active}
      onValueChange={onChange}
      label="Стан замовлень постачальнику"
      mobileSelectLabel="Стан замовлень"
    />
  );
}

function EmptyOrders() {
  return (
    <div className="grid min-h-[260px] place-items-center px-5 py-10 text-center" role="status">
      <div>
        <PackageOpen size={46} strokeWidth={1.7} className="mx-auto text-[var(--faint)]" />
        <h2 className="mt-4 text-[17px] font-semibold">Немає замовлень за фільтром</h2>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">Змініть пошук, період або фільтр карток</p>
      </div>
    </div>
  );
}

function BackordersEmptyState() {
  return (
    <div className="grid min-h-[260px] place-items-center px-5 py-10 text-center" role="status">
      <div>
        <CheckCircle2 size={46} strokeWidth={1.7} className="mx-auto text-[var(--green)]" />
        <h2 className="mt-4 text-[17px] font-semibold">Немає бекордерів — всі позиції виконані!</h2>
      </div>
    </div>
  );
}

function ExceptionsTab({ query, sort }: { query: string; sort: SupplierOrdersSort }) {
  const [filter, setFilter] = useState<ExceptionFilter>("all");
  const [showClosed, setShowClosed] = useState(false);

  const visibleExceptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk-UA");
    const filtered = supplierOrderExceptions.filter((exception) => {
      if (!showClosed && exception.closed) return false;
      if (filter === "missing-pdf" && exception.kind !== "missing-pdf") return false;
      if (!normalized) return true;
      return `${exception.shipmentNumber} ${exception.label} ${exception.lineCount}`
        .toLocaleLowerCase("uk-UA")
        .includes(normalized);
    });

    if (sort === "oldest") {
      return [...filtered].sort((left, right) => left.shipmentNumber.localeCompare(right.shipmentNumber));
    }
    if (sort === "newest") {
      return [...filtered].sort((left, right) => right.shipmentNumber.localeCompare(left.shipmentNumber));
    }
    // No exception amount was exposed by the source. "За сумою" therefore
    // preserves the observed card order instead of fabricating a monetary value.
    return filtered;
  }, [filter, query, showClosed, sort]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Фільтри винятків">
        <button
          type="button"
          aria-pressed={filter === "all"}
          className={`button ${filter === "all" ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : "button-outline"}`}
          onClick={() => setFilter("all")}
        >
          Всі · 2
        </button>
        <button
          type="button"
          aria-pressed={filter === "missing-pdf"}
          className={`button ${filter === "missing-pdf" ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : "button-outline"}`}
          onClick={() => setFilter("missing-pdf")}
        >
          PDF не прив&apos;язано · 2
        </button>
        <button
          type="button"
          aria-pressed={showClosed}
          className={`button ${showClosed ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : "button-outline"}`}
          onClick={() => setShowClosed((current) => !current)}
        >
          Показати закриті
        </button>
      </div>

      {visibleExceptions.length ? (
        <div className="grid gap-3">
          {visibleExceptions.map((exception) => (
            <article key={exception.id} className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--amber-soft)] text-[var(--amber)]">
                <FileText size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-mono text-[13px]">{exception.shipmentNumber}</strong>
                  <span className="rounded-full border border-[#e3d694] bg-[var(--amber-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--amber)] dark:border-[var(--border)]">
                    {exception.label}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">{exception.lineCount} позицій</p>
              </div>
              <Link href={exception.destination} className="button button-outline shrink-0 sm:self-center">
                Відкрити
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyOrders />
      )}
    </div>
  );
}

export function AdminSupplierOrdersPage() {
  const [activeTab, setActiveTab] = useState<SupplierOrdersTab>("all");
  const [selectedKpi, setSelectedKpi] = useState("total");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SupplierOrdersSort>("status");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  useEffect(() => {
    if (!periodOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPeriodOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [periodOpen]);

  const selectPeriodDate = (value: string) => {
    if (!periodStart || periodEnd) {
      setPeriodStart(value);
      setPeriodEnd(null);
      return;
    }
    if (value < periodStart) {
      setPeriodStart(value);
      setPeriodEnd(periodStart);
      return;
    }
    setPeriodEnd(value);
  };

  const hasSourceOrders = sourceSupplierOrders.length > 0;
  const hasSourceBackorders = sourceSupplierBackorders.length > 0;
  const activePanelId = `supplier-orders-${activeTab}-panel`;

  return (
    <AdminPage>
      <AdminPageHeader icon={<FileText size={20} />} title="Замовлення постачальнику" />
      <KpiGrid selected={selectedKpi} onSelect={setSelectedKpi} />
      <SupplierOrderTabs active={activeTab} onChange={setActiveTab} />
      <SearchToolbar
        query={query}
        sort={sort}
        periodOpen={periodOpen}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onQueryChange={setQuery}
        onSortChange={setSort}
        onPeriodToggle={() => setPeriodOpen((current) => !current)}
        onPeriodSelect={selectPeriodDate}
      />
      <section
        id={activePanelId}
        role="tabpanel"
        aria-labelledby={`${activePanelId}-tab`}
      >
        {activeTab === "all" ? (
          hasSourceOrders ? null : <EmptyOrders />
        ) : activeTab === "backorders" ? (
          hasSourceBackorders ? null : <BackordersEmptyState />
        ) : (
          <ExceptionsTab query={query} sort={sort} />
        )}
      </section>
    </AdminPage>
  );
}
