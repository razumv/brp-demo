"use client";

import {useLayoutEffect, useMemo} from "react";
import {Activity, Clock3, Database, Gauge, RefreshCw, Search} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {Selector} from "@astryxdesign/core/Selector";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {performanceRankingOptions, type PerformanceQueryRecord, type PerformanceRanking} from "@/lib/admin-performance-data";
import type {PerformanceViewProps} from "./admin-performance-page";
import styles from "./astryx-admin-tools.module.css";

type QueryRow = Record<string, unknown> & PerformanceQueryRecord;
const integerFormatter = new Intl.NumberFormat("en-US", {maximumFractionDigits: 0});

function formatDuration(milliseconds: number) {
  if (milliseconds >= 1_000) return `${(milliseconds / 1_000).toFixed(2)}s`;
  if (milliseconds >= 10) return `${milliseconds.toFixed(1)}ms`;
  return `${milliseconds.toFixed(2)}ms`;
}

export default function AstryxAdminPerformanceView({query, ranking, rows, summary, onQueryChange, onRankingChange, onReady}: PerformanceViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  const columns = useMemo<TableColumn<QueryRow>[]>(() => [
    {key: "module", header: "Module", width: pixel(140), renderCell: (row) => <Badge label={row.module} variant="neutral" />},
    {key: "calls", header: "Calls", width: pixel(84), align: "end", renderCell: (row) => integerFormatter.format(row.calls)},
    {key: "meanMs", header: "Mean", width: pixel(90), align: "end", renderCell: (row) => formatDuration(row.meanMs)},
    {key: "maxMs", header: "Max", width: pixel(90), align: "end", renderCell: (row) => formatDuration(row.maxMs)},
    {key: "totalMs", header: "Total", width: pixel(96), align: "end", renderCell: (row) => formatDuration(row.totalMs)},
    {key: "rows", header: "Rows", width: pixel(82), align: "end", renderCell: (row) => integerFormatter.format(row.rows)},
    {key: "query", header: "Query", width: proportional(3), renderCell: (row) => <code className={styles.sql}>{row.query}</code>},
  ], []);
  const data: QueryRow[] = rows.map((row) => ({...row}));
  const metrics = [
    {id: "calls", label: "Calls", value: integerFormatter.format(summary.calls), icon: <Activity size={18} />, variant: "blue" as const},
    {id: "total", label: "Total SQL time", value: `${(summary.totalMs / 1_000).toFixed(2)}s`, icon: <Database size={18} />, variant: "orange" as const},
    {id: "slowest", label: "Slowest average", value: formatDuration(summary.slowestAverageMs), icon: <Gauge size={18} />, variant: "red" as const},
    {id: "modules", label: "Modules", value: integerFormatter.format(summary.moduleCount), icon: <Clock3 size={18} />, variant: "transparent" as const},
  ];

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-admin-performance-renderer="astryx">
        <header className={styles.performanceHeader}>
          <div><Text type="supporting" color="secondary"><Database size={13} /> POSTGRES QUERY ANALYTICS</Text><Heading level={1}>DB Performance</Heading><Text color="secondary">Find slow, frequent, or module-specific database queries before they become production bottlenecks.</Text></div>
        </header>
        <Card padding={3} width="100%">
          <div className={styles.performanceToolbar}>
            <div className={styles.searchGrow}><TextInput label="Search module or query" isLabelHidden value={query} onChange={onQueryChange} placeholder="Search module or query" hasClear startIcon={<Search size={15} />} width="100%" /></div>
            <Selector label="Query ranking" isLabelHidden value={ranking} onChange={(value) => value && onRankingChange(value as PerformanceRanking)} options={performanceRankingOptions.map((option) => ({value: option.id, label: option.label}))} width={230} />
            <Button label="Refresh" variant="secondary" icon={<RefreshCw size={14} />} isDisabled tooltip="Requires a live pg_stat_statements connection" />
          </div>
        </Card>
        <section className={styles.kpiGrid} aria-label="Database query metrics">
          {metrics.map((metric) => <Card key={metric.id} padding={4} variant={metric.variant}><span className={styles.kpiIcon}>{metric.icon}</span><Text type="supporting" color="secondary" display="block">{metric.label}</Text><strong>{metric.value}</strong></Card>)}
        </section>
        <Card className={styles.sectionCard} padding={0} width="100%">
          <div className={styles.sectionHeading}><Heading level={2}>Query leaderboard</Heading><Badge label="pg_stat_statements" variant="info" /></div>
          {data.length ? <><div className={styles.desktopTable}><div className={styles.tableScroller} role="region" aria-label="Database query leaderboard" tabIndex={0}><Table aria-label="Database query leaderboard" data={data} columns={columns} idKey="id" density="compact" dividers="rows" hasHover verticalAlign="top" /></div></div><div className={styles.mobileCards}>{data.map((row) => <Card key={row.id} padding={3}><div className={styles.cardHeading}><Badge label={row.module} variant="neutral" /><strong>{integerFormatter.format(row.calls)} calls</strong></div><dl className={styles.metricList}><div><dt>Mean</dt><dd>{formatDuration(row.meanMs)}</dd></div><div><dt>Max</dt><dd>{formatDuration(row.maxMs)}</dd></div><div><dt>Total</dt><dd>{formatDuration(row.totalMs)}</dd></div></dl><code className={styles.sql}>{row.query}</code></Card>)}</div></> : <EmptyState title="No query statistics yet" description="Change the search or ranking to inspect another query group." />}
        </Card>
      </main>
    </AstryxBrpUiProvider>
  );
}
