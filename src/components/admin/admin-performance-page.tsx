"use client";

import {
  Activity,
  Clock3,
  Database,
  Gauge,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Panel } from "@/components/shared/ui";
import {
  filterPerformanceQueries,
  PERFORMANCE_EMPTY_COPY,
  performanceDatasets,
  performanceRankingOptions,
  summarizePerformanceQueries,
  type PerformanceQueryRecord,
  type PerformanceRanking,
  type PerformanceSummary,
} from "@/lib/admin-performance-data";

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatDuration(milliseconds: number) {
  if (milliseconds >= 1_000) return `${(milliseconds / 1_000).toFixed(2)}s`;
  if (milliseconds >= 10) return `${milliseconds.toFixed(1)}ms`;
  return `${milliseconds.toFixed(2)}ms`;
}

function formatSlowestAverage(milliseconds: number) {
  return milliseconds >= 1_000
    ? `${(milliseconds / 1_000).toFixed(2)}s`
    : `${milliseconds.toFixed(2)}ms`;
}

function PerformanceHeader() {
  return (
    <header className="mb-4">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.045em] text-[var(--muted-foreground)]">
        <Database size={13} strokeWidth={1.8} aria-hidden="true" />
        POSTGRES QUERY ANALYTICS
      </div>
      <h1 className="m-0 text-[30px] font-bold leading-[36px] tracking-[-0.02em]">DB Performance</h1>
      <p className="mt-1 max-w-[820px] text-[13px] leading-[18px] text-[var(--muted-foreground)]">
        Find slow, frequent, or module-specific database queries before they become production bottlenecks.
      </p>
    </header>
  );
}

function PerformanceControls({
  query,
  ranking,
  onQueryChange,
  onRankingChange,
}: {
  query: string;
  ranking: PerformanceRanking;
  onQueryChange: (value: string) => void;
  onRankingChange: (value: PerformanceRanking) => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1.4fr)_auto]">
      <label className="relative min-w-0">
        <span className="sr-only">Search module or query</span>
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search module or query"
          autoComplete="off"
          className="h-10 w-full rounded-md border border-[var(--border)] bg-[#eaedf2] py-1 pl-9 pr-3 text-[13px] leading-[18.57px] text-[var(--foreground)] outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] dark:bg-[var(--surface-subtle)]"
        />
      </label>
      <label className="min-w-0">
        <span className="sr-only">Query ranking</span>
        <select
          value={ranking}
          onChange={(event) => onRankingChange(event.target.value as PerformanceRanking)}
          className="h-10 w-full rounded-md border border-[var(--border)] bg-[#eaedf2] px-3 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] dark:bg-[var(--surface-subtle)]"
        >
          {performanceRankingOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Refresh is disabled in this read-only clone"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-medium text-[var(--muted-foreground)] opacity-60 disabled:cursor-not-allowed"
      >
        <RefreshCw size={15} aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}

type KpiDefinition = {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
};

function PerformanceKpis({ summary }: { summary: PerformanceSummary }) {
  const definitions: KpiDefinition[] = [
    {
      label: "Calls",
      value: integerFormatter.format(summary.calls),
      icon: <Activity size={17} aria-hidden="true" />,
      tone: "bg-[var(--blue-soft)] text-[var(--blue)]",
    },
    {
      label: "Total SQL time",
      value: `${(summary.totalMs / 1_000).toFixed(2)}s`,
      icon: <Database size={17} aria-hidden="true" />,
      tone: "bg-[var(--amber-soft)] text-[var(--amber)]",
    },
    {
      label: "Slowest average",
      value: formatSlowestAverage(summary.slowestAverageMs),
      icon: <Gauge size={17} aria-hidden="true" />,
      tone: "bg-[var(--red-soft)] text-[var(--red)]",
    },
    {
      label: "Modules",
      value: integerFormatter.format(summary.moduleCount),
      icon: <Clock3 size={17} aria-hidden="true" />,
      tone: "bg-[var(--surface-subtle)] text-[var(--muted-foreground)]",
    },
  ];

  return (
    <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Database query metrics">
      {definitions.map((definition) => (
        <Panel key={definition.label} as="article" className="flex min-h-[84px] items-start gap-3 p-4 shadow-none">
          <span className={`grid size-9 shrink-0 place-items-center rounded-md ${definition.tone}`}>
            {definition.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
              {definition.label}
            </span>
            <strong className="mt-0.5 block text-[23px] leading-[27px] tracking-[-0.02em] tabular-nums">
              {definition.value}
            </strong>
          </span>
        </Panel>
      ))}
    </section>
  );
}

function ModuleBadge({ module }: Pick<PerformanceQueryRecord, "module">) {
  return (
    <span className="inline-flex max-w-full rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[9px] font-medium leading-[14px] text-[var(--muted-foreground)]">
      {module}
    </span>
  );
}

function DesktopQueryTable({ rows }: { rows: readonly PerformanceQueryRecord[] }) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[1100px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-y border-[var(--border)] bg-[var(--surface-subtle)] text-[11px] font-semibold uppercase leading-[14.67px] tracking-[0.025em] text-[var(--muted-foreground)]">
            <th className="w-[122px] px-3 py-2">Module</th>
            <th className="w-[78px] px-3 py-2 text-right">Calls</th>
            <th className="w-[86px] px-3 py-2 text-right">Mean</th>
            <th className="w-[86px] px-3 py-2 text-right">Max</th>
            <th className="w-[90px] px-3 py-2 text-right">Total</th>
            <th className="w-[76px] px-3 py-2 text-right">Rows</th>
            <th className="px-3 py-2">Query</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--border)] last:border-b-0">
              <td className="px-3 py-3 align-top"><ModuleBadge module={row.module} /></td>
              <td className="px-3 py-3 text-right align-top font-medium tabular-nums">{integerFormatter.format(row.calls)}</td>
              <td className="px-3 py-3 text-right align-top tabular-nums">{formatDuration(row.meanMs)}</td>
              <td className="px-3 py-3 text-right align-top tabular-nums">{formatDuration(row.maxMs)}</td>
              <td className="px-3 py-3 text-right align-top tabular-nums">{formatDuration(row.totalMs)}</td>
              <td className="px-3 py-3 text-right align-top tabular-nums">{integerFormatter.format(row.rows)}</td>
              <td className="max-w-0 px-3 py-3 align-top">
                <code className="line-clamp-3 break-all font-mono text-[9px] leading-[13px] text-[var(--muted-foreground)]">
                  {row.query}
                </code>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7} className="h-20 px-3 py-6 text-center text-[12px] text-[var(--muted-foreground)]">
                {PERFORMANCE_EMPTY_COPY}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MobileQueryCards({ rows }: { rows: readonly PerformanceQueryRecord[] }) {
  if (!rows.length) {
    return (
      <p className="m-3 rounded-md border border-[var(--border)] px-3 py-8 text-center text-[12px] text-[var(--muted-foreground)] sm:hidden">
        {PERFORMANCE_EMPTY_COPY}
      </p>
    );
  }

  return (
    <div className="grid gap-2 p-2 sm:hidden">
      {rows.map((row) => (
        <article key={row.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_1px_2px_rgba(31,35,40,0.04)]">
          <header className="flex items-start justify-between gap-3">
            <ModuleBadge module={row.module} />
            <strong className="shrink-0 text-[11px] tabular-nums">{integerFormatter.format(row.calls)} calls</strong>
          </header>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <dt className="text-[9px] uppercase text-[var(--muted-foreground)]">Mean</dt>
              <dd className="m-0 mt-0.5 text-[11px] font-medium tabular-nums">{formatDuration(row.meanMs)}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase text-[var(--muted-foreground)]">Max</dt>
              <dd className="m-0 mt-0.5 text-[11px] font-medium tabular-nums">{formatDuration(row.maxMs)}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase text-[var(--muted-foreground)]">Total</dt>
              <dd className="m-0 mt-0.5 text-[11px] font-medium tabular-nums">{formatDuration(row.totalMs)}</dd>
            </div>
          </dl>
          <code className="mt-3 line-clamp-3 break-all border-t border-[var(--border)] pt-2 font-mono text-[9px] leading-[13px] text-[var(--muted-foreground)]">
            {row.query}
          </code>
        </article>
      ))}
    </div>
  );
}

function QueryLeaderboard({ rows }: { rows: readonly PerformanceQueryRecord[] }) {
  return (
    <Panel className="overflow-hidden shadow-none">
      <header className="flex min-h-12 items-center justify-between gap-3 px-4 py-3">
        <h2 className="m-0 flex items-center gap-2 text-[13px] font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-[var(--orange-soft)] text-[var(--orange)]">
            <Activity size={15} aria-hidden="true" />
          </span>
          Query leaderboard
        </h2>
        <span className="rounded-full border border-blue-200 bg-[var(--blue-soft)] px-2 py-0.5 font-mono text-[9px] text-[var(--blue)] dark:border-blue-900">
          pg_stat_statements
        </span>
      </header>
      <DesktopQueryTable rows={rows} />
      <MobileQueryCards rows={rows} />
    </Panel>
  );
}

export function AdminPerformancePage() {
  const [ranking, setRanking] = useState<PerformanceRanking>("slowest-average");
  const [query, setQuery] = useState("");
  const dataset = performanceDatasets[ranking];
  const rows = useMemo(() => filterPerformanceQueries(dataset, query), [dataset, query]);
  const summary = useMemo(() => summarizePerformanceQueries(dataset), [dataset]);

  return (
    <main className="page page-narrow">
      <PerformanceHeader />
      <PerformanceControls
        query={query}
        ranking={ranking}
        onQueryChange={setQuery}
        onRankingChange={setRanking}
      />
      <PerformanceKpis summary={summary} />
      <QueryLeaderboard rows={rows} />
    </main>
  );
}
