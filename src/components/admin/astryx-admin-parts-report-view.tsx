"use client";

import {useLayoutEffect, useMemo} from "react";
import {AlertTriangle, FileText, RefreshCw} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {DateInput} from "@astryxdesign/core/DateInput";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {Selector} from "@astryxdesign/core/Selector";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import type {ISODateString} from "@astryxdesign/core/Calendar";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  PARTS_REPORT_CONTROL_NOTICE,
  PARTS_REPORT_PAYMENTS_EMPTY,
  PARTS_REPORT_RN_EMPTY,
  partsReportKpis,
  partsReportOrders,
  partsReportPaymentRows,
  partsReportPeriodPresets,
  partsReportRnRows,
  syntheticManagerOptions,
  type PartsReportOrderRow,
  type PartsReportPaymentRow,
  type PartsReportRnRow,
  type SyntheticManagerId,
} from "@/lib/admin-parts-report-data";
import type {PartsReportViewProps} from "./admin-parts-report-page";
import styles from "./astryx-admin-tools.module.css";

type OrderRow = Record<string, unknown> & PartsReportOrderRow;
type RnRow = Record<string, unknown> & PartsReportRnRow;
type PaymentRow = Record<string, unknown> & PartsReportPaymentRow;

function formatUsd(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function ReportTable({title, emptyCopy, rows, columns}: {
  title: string;
  emptyCopy: string;
  rows: readonly Record<string, unknown>[];
  columns: readonly TableColumn<Record<string, unknown>>[];
}) {
  return (
    <Card className={styles.sectionCard} padding={0} width="100%">
      <div className={styles.sectionHeading}><Heading level={2}>{title}</Heading></div>
      {rows.length ? (
        <div className={styles.tableScroller} role="region" aria-label={title} tabIndex={0}>
          <Table aria-label={title} data={[...rows]} columns={[...columns]} idKey="id" density="compact" dividers="rows" hasHover />
        </div>
      ) : <EmptyState isCompact title={emptyCopy} description="Змініть період або менеджера, щоб перевірити інші дані." />}
    </Card>
  );
}

export default function AstryxAdminPartsReportView({
  draftFilter,
  appliedFilter,
  onDraftFilterChange,
  onApplyFilter,
  onReady,
}: PartsReportViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  const orderColumns = useMemo<TableColumn<OrderRow>[]>(() => [
    {key: "code", header: "Замовлення", width: pixel(130), renderCell: (row) => <div className={styles.orderLink}><Button href={`/admin/orders/${row.detailId}`} label={row.code} variant="ghost" size="sm">{row.code}</Button><Badge label={row.status} variant="info" /></div>},
    {key: "date", header: "Дата", width: pixel(150)},
    {key: "dealer", header: "Дилер", width: proportional(1)},
    {key: "placedBy", header: "Хто розмістив", width: proportional(1)},
    {key: "manager", header: "Менеджер", width: proportional(1)},
    {key: "positions", header: "Позицій", width: pixel(88), align: "end"},
    {key: "amountUsd", header: "Сума", width: pixel(100), align: "end", renderCell: (row) => <strong>{formatUsd(row.amountUsd)}</strong>},
  ], []);
  const rnColumns = useMemo<TableColumn<RnRow>[]>(() => [
    {key: "rn", header: "РН", width: proportional(1)},
    {key: "orderCode", header: "Замовлення", width: proportional(1)},
    {key: "date", header: "Дата", width: pixel(140)},
    {key: "status", header: "Статус", width: pixel(120)},
    {key: "quantity", header: "К-сть", width: pixel(80), align: "end"},
    {key: "amountUsd", header: "Сума", width: pixel(100), align: "end", renderCell: (row) => formatUsd(row.amountUsd)},
  ], []);
  const paymentColumns = useMemo<TableColumn<PaymentRow>[]>(() => [
    {key: "document", header: "Документ", width: proportional(1)},
    {key: "date", header: "Дата", width: pixel(140)},
    {key: "relation", header: "Зв'язок", width: proportional(1)},
    {key: "comment", header: "Коментар", width: proportional(2)},
    {key: "amountUsd", header: "Сума", width: pixel(100), align: "end", renderCell: (row) => formatUsd(row.amountUsd)},
  ], []);
  const selectedPreset = partsReportPeriodPresets.find((preset) => preset.from === draftFilter.from && preset.to === draftFilter.to)?.id;

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-admin-parts-report-renderer="astryx" data-parts-report-filter-from={draftFilter.from} data-parts-report-filter-to={draftFilter.to}>
        <header className={styles.pageHeader}>
          <span className={styles.pageIcon}><FileText size={22} aria-hidden="true" /></span>
          <div className={styles.pageTitle}>
            <Heading level={1}>Звіт ЗЧ</Heading>
            <Text color="secondary">Замовлення, РН та оплати за менеджером і періодом</Text>
          </div>
          <Button label="Оновити" variant="primary" icon={<RefreshCw size={14} />} isDisabled tooltip="Потрібне підключення сервісу звітів" />
        </header>

        <Card padding={3} width="100%">
          <div className={styles.reportFilters}>
            <DateInput label="З дати" value={draftFilter.from as ISODateString} max={draftFilter.to as ISODateString} onChange={(value) => value && onDraftFilterChange({...draftFilter, from: value})} width="100%" />
            <DateInput label="По дату" value={draftFilter.to as ISODateString} min={draftFilter.from as ISODateString} onChange={(value) => value && onDraftFilterChange({...draftFilter, to: value})} width="100%" />
            <Selector label="Менеджер" value={draftFilter.managerId} options={syntheticManagerOptions.map((manager) => ({value: manager.id, label: manager.label}))} onChange={(value) => value && onDraftFilterChange({...draftFilter, managerId: value as SyntheticManagerId})} width="100%" />
            <Button label="Застосувати" variant="primary" onClick={onApplyFilter} />
          </div>
          <div className={styles.presetRow} aria-label="Швидкий вибір періоду">
            {partsReportPeriodPresets.map((preset) => (
              <Button key={preset.id} label={preset.label} variant={selectedPreset === preset.id ? "primary" : "secondary"} size="sm" onClick={() => onDraftFilterChange({...draftFilter, from: preset.from, to: preset.to})} />
            ))}
          </div>
        </Card>

        <Banner status="warning" title={PARTS_REPORT_CONTROL_NOTICE.title} description={PARTS_REPORT_CONTROL_NOTICE.copy} icon={<AlertTriangle size={17} />} />

        <section className={styles.kpiGrid} data-report-from={appliedFilter.from} data-report-to={appliedFilter.to} data-report-manager={appliedFilter.managerId} aria-label={`Застосований звіт: ${appliedFilter.from} — ${appliedFilter.to}`}>
          {partsReportKpis.map((kpi) => <Card key={kpi.id} padding={4} variant={kpi.id === "orders" ? "blue" : kpi.id === "payments" ? "green" : "transparent"}><Text type="supporting" color="secondary" display="block">{kpi.label}</Text><strong>{formatUsd(kpi.amountUsd)}</strong><small>{kpi.helper}</small></Card>)}
        </section>

        <ReportTable title="Замовлення менеджера" emptyCopy="Замовлень за вибраний період немає" rows={partsReportOrders.map((row) => ({...row}))} columns={orderColumns as TableColumn<Record<string, unknown>>[]} />
        <ReportTable title="РН / накладні за цими замовленнями" emptyCopy={PARTS_REPORT_RN_EMPTY} rows={[...partsReportRnRows] as RnRow[]} columns={rnColumns as TableColumn<Record<string, unknown>>[]} />
        <ReportTable title="Оплати з точним зв'язком" emptyCopy={PARTS_REPORT_PAYMENTS_EMPTY} rows={[...partsReportPaymentRows] as PaymentRow[]} columns={paymentColumns as TableColumn<Record<string, unknown>>[]} />
      </main>
    </AstryxBrpUiProvider>
  );
}
