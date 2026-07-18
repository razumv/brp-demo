"use client";

import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Panel } from "@/components/shared/ui";
import {
  analyticsPeriodOptions,
  analyticsProductOptions,
  analyticsTabs,
  analyticsUnitAssignmentOptions,
  analyticsUnits,
  analyticsUnitSortOptions,
  analyticsUnitStatusOptions,
  filterAnalyticsUnits,
  paginateAnalyticsUnits,
  sortAnalyticsUnits,
  summarizeAnalyticsUnits,
  type AnalyticsPeriod,
  type AnalyticsProduct,
  type AnalyticsTab,
  type AnalyticsUnitAssignmentFilter,
  type AnalyticsUnitSort,
  type AnalyticsUnitStatus,
  type AnalyticsUnitStatusFilter,
  type AnalyticsUnitSummary,
} from "@/lib/admin-analytics-data";

const compactSelectClass = "h-8 min-w-0 rounded-md border border-[var(--border)] bg-[#eaedf2] px-3 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] dark:bg-[#010409]";

function formatInteger(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function formatCost(value: number) {
  return `€${formatInteger(value)}`;
}

function AnalyticsHeader() {
  return (
    <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="m-0 text-[30px] font-bold leading-[36px] tracking-[-0.02em] dark:text-[28px] dark:leading-[33.6px]">
          Аналитика
        </h1>
        <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">Управленческий дашборд (данные из 1С)</p>
      </div>
      <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-[10px] text-[var(--muted-foreground)] sm:mt-7">
        <RefreshCw size={12} aria-hidden="true" />
        1С · обновлено нет данных · устарело
      </span>
    </header>
  );
}

function AnalyticsTabs({ active, onChange }: { active: AnalyticsTab; onChange: (tab: AnalyticsTab) => void }) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label="Разделы аналитики">
      {analyticsTabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.id)}
            className={`min-h-8 rounded-md border px-3.5 py-1.5 text-[13px] transition-colors dark:text-[12px] ${selected
              ? "border-[var(--blue)] bg-[var(--blue-soft)] text-[var(--blue)]"
              : "border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function SharedAnalyticsFilters({
  period,
  product,
  onPeriodChange,
  onProductChange,
}: {
  period: AnalyticsPeriod;
  product: AnalyticsProduct;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onProductChange: (product: AnalyticsProduct) => void;
}) {
  const range = analyticsPeriodOptions.find((option) => option.id === period)?.range ?? "";
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md bg-[#eaedf2] px-3 py-2 dark:bg-[var(--surface-subtle)]">
      <label>
        <span className="sr-only">Период</span>
        <select
          className={compactSelectClass}
          value={period}
          onChange={(event) => onPeriodChange(event.target.value as AnalyticsPeriod)}
        >
          {analyticsPeriodOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Товар</span>
        <select
          className={compactSelectClass}
          value={product}
          onChange={(event) => onProductChange(event.target.value as AnalyticsProduct)}
        >
          {analyticsProductOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">{range}</span>
    </div>
  );
}

function UnsynchronizedState() {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center px-4 py-12 text-center" aria-live="polite">
      <AlertTriangle size={48} strokeWidth={1.7} className="mb-4 text-[var(--faint)]" aria-hidden="true" />
      <h2 className="m-0 text-[17px] font-semibold">Аналитика ещё не синхронизирована из 1С</h2>
      <p className="mt-3 max-w-[430px] text-[13px] leading-5 text-[var(--muted-foreground)]">
        Включите воркер (ANALYTICS_V2_ENABLED) или запустите backfill.
      </p>
    </section>
  );
}

type KpiCardDefinition = {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  iconClass: string;
  borderClass: string;
};

function UnitKpis({ summary }: { summary: AnalyticsUnitSummary }) {
  const cards: KpiCardDefinition[] = [
    {
      label: "Всего юнитов",
      value: summary.total.count,
      helper: formatCost(summary.total.purchaseCost),
      icon: <Boxes size={19} />,
      iconClass: "bg-[var(--blue-soft)] text-[var(--blue)]",
      borderClass: "border-blue-200/80 dark:border-blue-900/70",
    },
    {
      label: "В наличии",
      value: summary.available.count,
      helper: formatCost(summary.available.purchaseCost),
      icon: <PackageCheck size={19} />,
      iconClass: "bg-[var(--green-soft)] text-[var(--green)]",
      borderClass: "border-green-200/80 dark:border-green-900/70",
    },
    {
      label: "В пути",
      value: summary.inTransit.count,
      helper: formatCost(summary.inTransit.purchaseCost),
      icon: <TrendingUp size={19} />,
      iconClass: "bg-[var(--blue-soft)] text-[var(--blue)]",
      borderClass: "border-blue-200/80 dark:border-blue-900/70",
    },
    {
      label: "Свободно (не за дилером)",
      value: summary.free.count,
      helper: `${formatInteger(summary.assigned.count)} за дилером`,
      icon: <AlertTriangle size={19} />,
      iconClass: "bg-[var(--amber-soft)] text-[var(--amber)]",
      borderClass: "border-amber-200/80 dark:border-amber-900/70",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Показатели техники">
      {cards.map((card) => (
        <Panel as="article" key={card.label} className={`min-h-[134px] p-5 shadow-none ${card.borderClass}`}>
          <span className={`mb-3 grid size-10 place-items-center rounded-md ${card.iconClass}`}>{card.icon}</span>
          <strong className="block text-[25px] leading-none tabular-nums">{formatInteger(card.value)}</strong>
          <span className="mt-2 block text-[13px] text-[var(--muted-foreground)]">{card.label}</span>
          <small className="mt-1 block text-[11px] tabular-nums text-[var(--muted-foreground)]">{card.helper}</small>
        </Panel>
      ))}
    </section>
  );
}

function UnitToolbar({
  query,
  status,
  assignment,
  sort,
  page,
  pageCount,
  start,
  end,
  total,
  busy,
  onQueryChange,
  onStatusChange,
  onAssignmentChange,
  onSortChange,
  onPageChange,
}: {
  query: string;
  status: AnalyticsUnitStatusFilter;
  assignment: AnalyticsUnitAssignmentFilter;
  sort: AnalyticsUnitSort;
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  busy: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: AnalyticsUnitStatusFilter) => void;
  onAssignmentChange: (assignment: AnalyticsUnitAssignmentFilter) => void;
  onSortChange: (sort: AnalyticsUnitSort) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-[#eaedf2] p-2 dark:bg-[var(--surface-subtle)]">
      <label className="relative w-full sm:w-[224px]">
        <span className="sr-only">Поиск по VIN или модели</span>
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden="true" />
        <input
          className="h-8 w-full rounded-[4px] border border-[var(--border)] bg-[var(--surface)] py-1 pl-9 pr-3 text-[13px] outline-none focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)]"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="VIN или модель…"
          autoComplete="off"
          aria-busy={busy}
        />
      </label>
      <label>
        <span className="sr-only">Статус</span>
        <select className={compactSelectClass} value={status} onChange={(event) => onStatusChange(event.target.value as AnalyticsUnitStatusFilter)}>
          {analyticsUnitStatusOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Назначение дилеру</span>
        <select className={compactSelectClass} value={assignment} onChange={(event) => onAssignmentChange(event.target.value as AnalyticsUnitAssignmentFilter)}>
          {analyticsUnitAssignmentOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Сортировка</span>
        <select className={compactSelectClass} value={sort} onChange={(event) => onSortChange(event.target.value as AnalyticsUnitSort)}>
          {analyticsUnitSortOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      {total ? (
        <div className="ml-auto flex items-center gap-2 text-[11px] tabular-nums text-[var(--muted-foreground)]">
          <span>{formatInteger(start)}–{formatInteger(end)} из {formatInteger(total)}</span>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-md border border-[var(--border)] bg-transparent disabled:cursor-not-allowed disabled:opacity-35"
            disabled={page === 1}
            aria-label="Предыдущая страница"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-md border border-[var(--border)] bg-transparent disabled:cursor-not-allowed disabled:opacity-35"
            disabled={page === pageCount}
            aria-label="Следующая страница"
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function UnitStatusBadge({ status }: { status: AnalyticsUnitStatus }) {
  const available = status === "available";
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] ${available
      ? "bg-[var(--green-soft)] text-[var(--green)]"
      : "bg-[var(--blue-soft)] text-[var(--blue)]"}`}
    >
      {available ? "В наличии" : "В пути"}
    </span>
  );
}

function UnitTable({ rows }: { rows: ReturnType<typeof paginateAnalyticsUnits>["rows"] }) {
  if (!rows.length) {
    return <div className="grid min-h-[150px] place-items-center text-[13px] text-[var(--muted-foreground)]">Ничего не найдено</div>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[662px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-[var(--surface-subtle)] text-[var(--muted-foreground)]">
            <th scope="col" className="px-3 py-4 text-left text-[13px] font-normal sm:py-2.5 dark:text-[12px]">VIN</th>
            <th scope="col" className="px-3 py-4 text-left text-[13px] font-normal sm:py-2.5 dark:text-[12px]">Модель</th>
            <th scope="col" className="px-3 py-4 text-left text-[13px] font-normal sm:py-2.5 dark:text-[12px]">Статус</th>
            <th scope="col" className="px-3 py-4 text-left text-[13px] font-normal sm:py-2.5 dark:text-[12px]">Дилер</th>
            <th scope="col" className="px-3 py-4 text-right text-[13px] font-normal sm:py-2.5 dark:text-[12px]">Стоимость €</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-subtle)]">
              <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] sm:py-2.5">{row.vin ?? "—"}</td>
              <td className="max-w-[380px] whitespace-nowrap px-3 py-3.5 sm:py-2.5">{row.model}</td>
              <td className="whitespace-nowrap px-3 py-3.5 sm:py-2.5"><UnitStatusBadge status={row.status} /></td>
              <td className="whitespace-nowrap px-3 py-3.5 sm:py-2.5">{row.dealer ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-3.5 text-right font-medium tabular-nums sm:py-2.5">{formatCost(row.purchaseCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnitAnalytics() {
  const [queryInput, setQueryInput] = useState("");
  const [settledQuery, setSettledQuery] = useState("");
  const [status, setStatus] = useState<AnalyticsUnitStatusFilter>("all");
  const [assignment, setAssignment] = useState<AnalyticsUnitAssignmentFilter>("all");
  const [sort, setSort] = useState<AnalyticsUnitSort>("cost");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSettledQuery(queryInput.trim());
      setPage(1);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [queryInput]);

  const filteredRows = useMemo(() => filterAnalyticsUnits(analyticsUnits, {
    query: settledQuery,
    status,
    assignment,
  }), [assignment, settledQuery, status]);
  const summary = useMemo(() => summarizeAnalyticsUnits(filteredRows), [filteredRows]);
  const sortedRows = useMemo(() => sortAnalyticsUnits(filteredRows, sort), [filteredRows, sort]);
  const pagination = useMemo(() => paginateAnalyticsUnits(sortedRows, page), [page, sortedRows]);

  const updateStatus = (nextStatus: AnalyticsUnitStatusFilter) => {
    setStatus(nextStatus);
    setPage(1);
  };
  const updateAssignment = (nextAssignment: AnalyticsUnitAssignmentFilter) => {
    setAssignment(nextAssignment);
    setPage(1);
  };
  const updateSort = (nextSort: AnalyticsUnitSort) => {
    setSort(nextSort);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <UnitKpis summary={summary} />
      <UnitToolbar
        query={queryInput}
        status={status}
        assignment={assignment}
        sort={sort}
        page={pagination.page}
        pageCount={pagination.pageCount}
        start={pagination.start}
        end={pagination.end}
        total={pagination.total}
        busy={queryInput.trim() !== settledQuery}
        onQueryChange={setQueryInput}
        onStatusChange={updateStatus}
        onAssignmentChange={updateAssignment}
        onSortChange={updateSort}
        onPageChange={setPage}
      />
      <p className="m-0 text-[11px] text-[var(--muted-foreground)]">
        Стоимость — по закупке (€); продажи и маржа техники — отдельным шагом позже.
      </p>
      <UnitTable rows={pagination.rows} />
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [period, setPeriod] = useState<AnalyticsPeriod>("year");
  const [product, setProduct] = useState<AnalyticsProduct>("all");
  const hasSharedFilters = activeTab === "overview" || activeTab === "finance" || activeTab === "dealers";

  return (
    <main className="page page-narrow">
      <div className="flex flex-col gap-4">
        <AnalyticsHeader />
        <AnalyticsTabs active={activeTab} onChange={setActiveTab} />
        {hasSharedFilters ? (
          <SharedAnalyticsFilters
            period={period}
            product={product}
            onPeriodChange={setPeriod}
            onProductChange={setProduct}
          />
        ) : null}
        {activeTab === "units" ? <UnitAnalytics /> : <UnsynchronizedState />}
      </div>
    </main>
  );
}
