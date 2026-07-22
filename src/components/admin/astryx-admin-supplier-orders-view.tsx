"use client";

import {useLayoutEffect, useMemo} from "react";
import Link from "next/link";
import {AlertTriangle, CalendarDays, CheckCircle2, FileText, PackageOpen} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Popover} from "@astryxdesign/core/Popover";
import {Selector} from "@astryxdesign/core/Selector";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {TextInput} from "@astryxdesign/core/TextInput";
import {useAppearance} from "@/components/appearance/use-appearance";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {
  supplierOrderExceptions,
  supplierOrderKpis,
  supplierOrderSortOptions,
} from "@/lib/admin-supplier-orders-data";
import type {SupplierOrdersViewProps} from "./admin-supplier-orders-page";
import styles from "./astryx-admin-supplier-orders.module.css";

const tabs = [
  {id: "all", label: "Всі замовлення"},
  {id: "backorders", label: "Бекордери"},
  {id: "exceptions", label: "Винятки"},
] as const;

const calendarMonths = [
  {id: "2026-07", label: "July 2026", days: 31, leadingBlankDays: 2},
  {id: "2026-08", label: "August 2026", days: 31, leadingBlankDays: 5},
] as const;

const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

function formatPeriodLabel(start: string | null, end: string | null) {
  if (!start) return "Період";
  const format = (value: string) => {
    const [, month, day] = value.split("-");
    return `${day}.${month}`;
  };
  return end ? `${format(start)} – ${format(end)}` : format(start);
}

function Calendar({
  start,
  end,
  onSelect,
}: {
  start: SupplierOrdersViewProps["periodStart"];
  end: SupplierOrdersViewProps["periodEnd"];
  onSelect: SupplierOrdersViewProps["onPeriodSelect"];
}) {
  return (
    <div className={styles.calendarGrid}>
      {calendarMonths.map((month) => {
        const cells = [
          ...Array.from({length: month.leadingBlankDays}, () => null),
          ...Array.from({length: month.days}, (_, index) => index + 1),
        ];
        return (
          <section key={month.id} aria-label={month.label}>
            <h3 className={styles.calendarTitle}>{month.label}</h3>
            <div className={styles.calendarDays}>
              {weekdayLabels.map((weekday) => <span key={weekday}>{weekday}</span>)}
              {cells.map((day, index) => {
                if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
                const value = `${month.id}-${String(day).padStart(2, "0")}`;
                const selected = value === start || value === end;
                const inRange = Boolean(start && end && value > start && value < end);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    className={`${styles.calendarDay} ${selected ? styles.calendarDaySelected : inRange ? styles.calendarDayRange : ""}`}
                    onClick={() => onSelect(value)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyState({backorders = false}: {backorders?: boolean}) {
  return (
    <Card className={styles.emptyState} variant="transparent">
      {backorders ? <CheckCircle2 size={46} aria-hidden="true" /> : <PackageOpen size={46} aria-hidden="true" />}
      <h2>{backorders ? "Немає бекордерів — всі позиції виконані!" : "Немає замовлень за фільтром"}</h2>
      {!backorders ? <p>Змініть пошук, період або фільтр карток</p> : null}
    </Card>
  );
}

export default function AstryxAdminSupplierOrdersView({
  activeTab,
  selectedKpi,
  query,
  sort,
  periodOpen,
  periodStart,
  periodEnd,
  exceptionFilter,
  showClosed,
  hasSourceOrders,
  hasSourceBackorders,
  onActiveTabChange,
  onSelectedKpiChange,
  onQueryChange,
  onSortChange,
  onPeriodOpenChange,
  onPeriodSelect,
  onExceptionFilterChange,
  onShowClosedChange,
  onReady,
}: SupplierOrdersViewProps & AstryxRendererViewProps) {
  const {renderedDesignSystem} = useAppearance();
  const isRendererActive = renderedDesignSystem === "astryx";
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  const visibleExceptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk-UA");
    const exceptions = supplierOrderExceptions.filter((exception) => {
      if (!showClosed && exception.closed) return false;
      if (exceptionFilter === "missing-pdf" && exception.kind !== "missing-pdf") return false;
      return !normalized || `${exception.shipmentNumber} ${exception.label} ${exception.lineCount}`.toLocaleLowerCase("uk-UA").includes(normalized);
    });
    if (sort === "oldest") return [...exceptions].sort((left, right) => left.shipmentNumber.localeCompare(right.shipmentNumber));
    if (sort === "newest") return [...exceptions].sort((left, right) => right.shipmentNumber.localeCompare(left.shipmentNumber));
    return exceptions;
  }, [exceptionFilter, query, showClosed, sort]);

  const activePanelId = `supplier-orders-${activeTab}-panel`;

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-brp-admin-renderer="astryx" data-brp-admin-procurement-renderer="astryx">
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true"><FileText size={20} /></span>
          <div><h1>Замовлення постачальнику</h1><p>Статуси постачання, бекордери та винятки документів.</p></div>
        </header>

        <section className={styles.kpiGrid} aria-label="Показники замовлень постачальнику">
          {supplierOrderKpis.map((kpi) => (
            <Card key={kpi.id} className={`${styles.kpi} ${selectedKpi === kpi.id ? styles.kpiSelected : ""}`} padding={3}>
              <button type="button" aria-pressed={selectedKpi === kpi.id} onClick={() => onSelectedKpiChange(kpi.id)}>
                <span>{kpi.label}</span><strong>{kpi.value}</strong>
              </button>
            </Card>
          ))}
        </section>

        <TabList aria-label="Стан замовлень постачальнику" value={activeTab} onChange={(value) => onActiveTabChange(value as SupplierOrdersViewProps["activeTab"])} hasDivider>
          {tabs.map((tab) => <Tab key={tab.id} value={tab.id} label={tab.label} endContent={tab.id === "exceptions" ? <Badge label="2" variant="warning" /> : undefined} />)}
        </TabList>

        <section className={styles.toolbar} aria-label="Пошук і фільтри замовлень постачальнику">
          <TextInput label="Пошук за номером SO або артикулом" isLabelHidden value={query} onChange={onQueryChange} placeholder="Пошук за номером SO, артикулом..." hasClear width="100%" />
          <Popover
            label="Період замовлень постачальнику"
            isOpen={isRendererActive && periodOpen}
            onOpenChange={onPeriodOpenChange}
            width="min(620px, calc(100vw - 32px))"
            placement="below"
            content={<Calendar start={periodStart} end={periodEnd} onSelect={onPeriodSelect} />}
          >
            <Button label={formatPeriodLabel(periodStart, periodEnd)} icon={<CalendarDays size={15} />} variant="secondary" />
          </Popover>
          <Selector
            label="Сортування замовлень постачальнику"
            isLabelHidden
            value={sort}
            onChange={(value) => onSortChange((value ?? "status") as SupplierOrdersViewProps["sort"])}
            options={supplierOrderSortOptions.map((option) => ({value: option.id, label: option.label}))}
          />
        </section>

        <section id={activePanelId} role="tabpanel" aria-label={tabs.find((tab) => tab.id === activeTab)?.label} className={styles.panel}>
          {activeTab === "all" && !hasSourceOrders ? <EmptyState /> : null}
          {activeTab === "backorders" && !hasSourceBackorders ? <EmptyState backorders /> : null}
          {activeTab === "exceptions" ? (
            <>
              <div className={styles.exceptionFilters} role="group" aria-label="Фільтри винятків">
                <Button label="Всі · 2" variant={exceptionFilter === "all" ? "primary" : "secondary"} onClick={() => onExceptionFilterChange("all")} />
                <Button label="PDF не прив'язано · 2" variant={exceptionFilter === "missing-pdf" ? "primary" : "secondary"} onClick={() => onExceptionFilterChange("missing-pdf")} />
                <Button label="Показати закриті" variant={showClosed ? "primary" : "secondary"} onClick={() => onShowClosedChange(!showClosed)} />
              </div>
              {visibleExceptions.length ? <div className={styles.exceptionList}>{visibleExceptions.map((exception) => (
                <Card key={exception.id} className={styles.exception} padding={4}>
                  <AlertTriangle size={21} aria-hidden="true" />
                  <div><strong>{exception.shipmentNumber}</strong><p>{exception.lineCount} позицій</p></div>
                  <Badge label={exception.label} variant="warning" />
                  <Link href={exception.destination}>Відкрити</Link>
                </Card>
              ))}</div> : <EmptyState />}
            </>
          ) : null}
        </section>
      </main>
    </AstryxBrpUiProvider>
  );
}
