"use client";

import {useLayoutEffect, useMemo} from "react";
import {AlertTriangle, Boxes, PackageCheck, RefreshCw, TrendingUp} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Selector} from "@astryxdesign/core/Selector";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  analyticsPeriodOptions,
  analyticsProductOptions,
  analyticsTabs,
  analyticsUnitAssignmentOptions,
  analyticsUnitSortOptions,
  analyticsUnitStatusOptions,
  type AnalyticsUnit,
  type AnalyticsUnitStatus,
} from "@/lib/admin-analytics-data";
import type {AnalyticsViewProps} from "./admin-analytics-page";
import styles from "./astryx-admin-analytics.module.css";

type UnitRow = Record<string, unknown> & AnalyticsUnit;

function formatInteger(value: number) {
  return new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 0}).format(value);
}

function formatCost(value: number) {
  return `€${formatInteger(value)}`;
}

function unitStatusLabel(status: AnalyticsUnitStatus) {
  return status === "available" ? "В наличии" : "В пути";
}

function unitStatusVariant(status: AnalyticsUnitStatus): "success" | "accent" {
  return status === "available" ? "success" : "accent";
}

function Header() {
  return (
    <header className={styles.header}>
      <div>
        <h1>Аналитика</h1>
        <p>Управленческий дашборд по данным из 1С.</p>
      </div>
      <Badge label="1С · требуется синхронизация" variant="warning" icon={<RefreshCw size={13} />} />
    </header>
  );
}

function SharedFilters(props: Pick<AnalyticsViewProps, "period" | "product" | "onPeriodChange" | "onProductChange">) {
  const range = analyticsPeriodOptions.find((option) => option.id === props.period)?.range ?? "";
  return (
    <Card className={styles.sharedFilters} padding={3}>
      <Selector
        label="Период"
        isLabelHidden
        value={props.period}
        onChange={(value) => value && props.onPeriodChange(value as AnalyticsViewProps["period"])}
        options={analyticsPeriodOptions.map((option) => ({value: option.id, label: option.label}))}
      />
      <Selector
        label="Товар"
        isLabelHidden
        value={props.product}
        onChange={(value) => value && props.onProductChange(value as AnalyticsViewProps["product"])}
        options={analyticsProductOptions.map((option) => ({value: option.id, label: option.label}))}
      />
      <Text type="supporting" color="secondary">{range}</Text>
    </Card>
  );
}

function Kpis({summary}: {summary: AnalyticsViewProps["unitSummary"]}) {
  const cards = [
    {id: "total", label: "Всего юнитов", value: summary.total.count, helper: formatCost(summary.total.purchaseCost), icon: <Boxes size={18} />, variant: "blue" as const},
    {id: "available", label: "В наличии", value: summary.available.count, helper: formatCost(summary.available.purchaseCost), icon: <PackageCheck size={18} />, variant: "green" as const},
    {id: "transit", label: "В пути", value: summary.inTransit.count, helper: formatCost(summary.inTransit.purchaseCost), icon: <TrendingUp size={18} />, variant: "blue" as const},
    {id: "free", label: "Свободно", value: summary.free.count, helper: `${formatInteger(summary.assigned.count)} за дилером`, icon: <AlertTriangle size={18} />, variant: "orange" as const},
  ];

  return (
    <section className={styles.kpiGrid} aria-label="Показатели техники">
      {cards.map((card) => (
        <Card key={card.id} padding={4} variant={card.variant}>
          <span className={styles.kpiIcon}>{card.icon}</span>
          <Text type="supporting" color="secondary" display="block">{card.label}</Text>
          <strong>{formatInteger(card.value)}</strong>
          <small>{card.helper}</small>
        </Card>
      ))}
    </section>
  );
}

function UnitFilters(props: AnalyticsViewProps) {
  return (
    <Card className={styles.unitFilters} padding={3}>
      <div className={styles.search}>
        <TextInput
          label="Поиск по VIN или модели"
          isLabelHidden
          value={props.queryInput}
          onChange={props.onQueryInputChange}
          placeholder="VIN или модель…"
          hasClear
          width="100%"
        />
      </div>
      <Selector
        label="Статус"
        isLabelHidden
        value={props.status}
        onChange={(value) => value && props.onStatusChange(value as AnalyticsViewProps["status"])}
        options={analyticsUnitStatusOptions.map((option) => ({value: option.id, label: option.label}))}
      />
      <Selector
        label="Назначение дилеру"
        isLabelHidden
        value={props.assignment}
        onChange={(value) => value && props.onAssignmentChange(value as AnalyticsViewProps["assignment"])}
        options={analyticsUnitAssignmentOptions.map((option) => ({value: option.id, label: option.label}))}
      />
      <Selector
        label="Сортировка"
        isLabelHidden
        value={props.sort}
        onChange={(value) => value && props.onSortChange(value as AnalyticsViewProps["sort"])}
        options={analyticsUnitSortOptions.map((option) => ({value: option.id, label: option.label}))}
      />
    </Card>
  );
}

function UnitTable({rows}: {rows: readonly AnalyticsUnit[]}) {
  const columns = useMemo<TableColumn<UnitRow>[]>(() => [
    {key: "vin", header: "VIN", width: pixel(170), renderCell: (row) => <span className={styles.vin}>{row.vin ?? "—"}</span>},
    {key: "model", header: "Модель", width: proportional(2)},
    {key: "status", header: "Статус", width: pixel(122), renderCell: (row) => <StatusDot label={unitStatusLabel(row.status)} variant={unitStatusVariant(row.status)} />},
    {key: "dealer", header: "Дилер", width: proportional(1), renderCell: (row) => row.dealer ?? "—"},
    {key: "purchaseCost", header: "Стоимость €", width: pixel(116), align: "end", renderCell: (row) => <strong>{formatCost(row.purchaseCost)}</strong>},
  ], []);
  const data: UnitRow[] = rows.map((row) => ({...row}));

  if (!data.length) {
    return <EmptyState title="Ничего не найдено" description="Измените запрос или фильтры." />;
  }
  return (
    <div className={styles.tableScroller} role="region" aria-label="Техника в аналитике" tabIndex={0}>
      <Table aria-label="Техника в аналитике" data={data} columns={columns} idKey="id" density="compact" dividers="rows" />
    </div>
  );
}

function Pagination(props: AnalyticsViewProps) {
  if (!props.unitTotal) return null;
  return (
    <div className={styles.pagination}>
      <Text type="supporting" color="secondary">{formatInteger(props.unitStart)}–{formatInteger(props.unitEnd)} из {formatInteger(props.unitTotal)}</Text>
      <Button label="Предыдущая страница" variant="secondary" size="sm" isDisabled={props.unitPage === 1} onClick={() => props.onUnitPageChange(props.unitPage - 1)}>←</Button>
      <output aria-live="polite">{props.unitPage} / {props.unitPageCount}</output>
      <Button label="Следующая страница" variant="secondary" size="sm" isDisabled={props.unitPage === props.unitPageCount} onClick={() => props.onUnitPageChange(props.unitPage + 1)}>→</Button>
    </div>
  );
}

function Units(props: AnalyticsViewProps) {
  return (
    <section className={styles.units} id="astryx-analytics-units" role="tabpanel">
      <Kpis summary={props.unitSummary} />
      <UnitFilters {...props} />
      <div className={styles.tableHeading}>
        <div><h2>Техника</h2><Text type="supporting" color="secondary">Стоимость по закупке (€)</Text></div>
        <Badge label={`${formatInteger(props.unitTotal)} юнитов`} variant="neutral" />
      </div>
      <UnitTable rows={props.unitRows} />
      <Pagination {...props} />
    </section>
  );
}

function UnsynchronizedState() {
  return (
    <Card padding={6}>
      <EmptyState
        title="Аналитика ещё не синхронизирована из 1С"
        description="Данные появятся после подключения и запуска аналитической синхронизации."
        icon={<AlertTriangle size={24} />}
      />
    </Card>
  );
}

export default function AstryxAdminAnalyticsView(props: AnalyticsViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(props.onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [props.onReady]);

  const hasSharedFilters = props.activeTab === "overview" || props.activeTab === "finance" || props.activeTab === "dealers";
  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-admin-analytics-renderer="astryx">
        <Header />
        <div className={styles.tabs}>
          <TabList aria-label="Разделы аналитики" value={props.activeTab} onChange={(value) => props.onActiveTabChange(value as AnalyticsViewProps["activeTab"])} layout="hug" hasDivider>
            {analyticsTabs.map((tab) => <Tab key={tab.id} value={tab.id} label={tab.label} />)}
          </TabList>
        </div>
        {hasSharedFilters ? <SharedFilters {...props} /> : null}
        {props.activeTab === "units" ? <Units {...props} /> : <UnsynchronizedState />}
      </main>
    </AstryxBrpUiProvider>
  );
}
