"use client";

import Link from "next/link";
import {useEffect, useLayoutEffect, useRef} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {Pagination} from "@astryxdesign/core/Pagination";
import {Popover, type PopoverTriggerRenderProps} from "@astryxdesign/core/Popover";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {Toolbar} from "@astryxdesign/core/Toolbar";
import {
  Box,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Columns3,
  List,
  LockKeyhole,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {useAppearance} from "@/components/appearance/use-appearance";
import {
  ADMIN_ORDER_STATUS_META,
  ADMIN_ORDER_STATUS_ORDER,
  type AdminOrderStatus,
  type AdminTone,
} from "@/lib/admin-order-data";
import {formatMoney} from "@/lib/mock-data";
import {
  ADMIN_PIPELINE_AUGUST_DAYS,
  ADMIN_PIPELINE_JULY_DAYS,
  type AdminOrderPipelineModel,
  type AdminPipelineCalendarDay,
  type AdminPipelineDisplayOrder,
  type AdminPipelinePage,
} from "./admin-order-pipeline-controller";
import styles from "./astryx-admin-order-pipeline.module.css";

type AstryxAdminOrderPipelineViewProps = {
  model: AdminOrderPipelineModel;
} & AstryxRendererViewProps;

const astryxTone: Record<AdminTone, "neutral" | "info" | "success" | "warning" | "error"> = {
  neutral: "neutral",
  orange: "warning",
  amber: "warning",
  blue: "info",
  purple: "info",
  green: "success",
  red: "error",
};

const statusDotTone: Record<AdminTone, "neutral" | "accent" | "success" | "warning" | "error"> = {
  neutral: "neutral",
  orange: "warning",
  amber: "warning",
  blue: "accent",
  purple: "accent",
  green: "success",
  red: "error",
};

function useRendererReady(onReady: () => void) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);
}

function progressClass(order: AdminPipelineDisplayOrder) {
  if (order.total <= 0 || order.ready <= 0) return styles.progress0;
  const ratio = order.ready / order.total;
  if (ratio >= 1) return styles.progress100;
  if (ratio >= 0.75) return styles.progress75;
  if (ratio >= 0.5) return styles.progress50;
  if (ratio >= 0.25) return styles.progress25;
  return styles.progress12;
}

function CalendarMonth({title, days, model}: {title: string; days: readonly AdminPipelineCalendarDay[]; model: AdminOrderPipelineModel}) {
  return (
    <section>
      <Heading level={3} className={styles.calendarHeading}>{title}</Heading>
      <div className={styles.calendarGrid}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <Text key={day} type="supporting" justify="center">{day}</Text>)}
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            className={`${styles.calendarDay} ${day.muted ? styles.calendarDayMuted : ""} ${model.periodSelection.includes(day.id) ? styles.calendarDaySelected : ""}`}
            aria-label={`${title} ${day.label}${day.muted ? ", outside current month" : ""}`}
            aria-pressed={model.periodSelection.includes(day.id)}
            onClick={() => model.selectPeriodDay(day.id)}
          >
            {day.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function AstryxPeriodContent({model}: {model: AdminOrderPipelineModel}) {
  return (
    <div>
      <div className={styles.periodGrid}>
        <CalendarMonth title="July 2026" days={ADMIN_PIPELINE_JULY_DAYS} model={model} />
        <CalendarMonth title="August 2026" days={ADMIN_PIPELINE_AUGUST_DAYS} model={model} />
      </div>
      <footer className={styles.periodFooter}>
        <Text type="supporting">{model.periodSelection.length === 0 ? "Click start date" : model.periodSelection.length === 1 ? "Оберіть кінцеву дату" : "Діапазон вибрано локально"}</Text>
        <div className={styles.periodActions}>
          <Button label="Очистити" variant="ghost" size="sm" onClick={model.clearPeriod} />
          <Button label="Закрити" variant="secondary" size="sm" onClick={() => model.setPeriodOpen(false)} />
        </div>
      </footer>
    </div>
  );
}

function PeriodFilter({model, isRendererCommitted}: {model: AdminOrderPipelineModel; isRendererCommitted: boolean}) {
  const isOpen = isRendererCommitted && model.periodOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      model.setPeriodOpen(false);
      queueMicrotask(() => triggerRef.current?.focus());
    };
    document.addEventListener("keydown", dismiss, true);
    return () => document.removeEventListener("keydown", dismiss, true);
  }, [isOpen, model]);

  return (
    <Popover
      label="Період замовлень"
      content={<AstryxPeriodContent model={model} />}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isRendererCommitted) model.setPeriodOpen(open);
      }}
      hasAutoFocus
      hasLightDismiss
      hasEscapeDismiss
      placement="below"
      width="min(700px, calc(100vw - 32px))"
    >
      {(trigger: PopoverTriggerRenderProps) => (
        <Button
          ref={(element) => {
            triggerRef.current = element;
            (trigger.ref as (element: HTMLButtonElement | null) => void)(element);
          }}
          label="Період"
          icon={<CalendarDays size={15} />}
          endContent={<ChevronDown size={14} />}
          size="md"
          variant={model.periodOpen || model.periodSelection.length > 0 ? "primary" : "secondary"}
          onClick={trigger.onClick}
          aria-haspopup={trigger["aria-haspopup"]}
          aria-expanded={isOpen}
          aria-controls={trigger["aria-controls"]}
        />
      )}
    </Popover>
  );
}

function SummaryCards({counts}: {counts: Readonly<Record<AdminOrderStatus, number>>}) {
  return (
    <section className={styles.summary} data-mobile-surface="pipeline-summary" role="region" aria-label="Зведення статусів" tabIndex={0}>
      {ADMIN_ORDER_STATUS_ORDER.map((status) => {
        const meta = ADMIN_ORDER_STATUS_META[status];
        return (
          <Card key={status} className={styles.summaryCard} padding={3}>
            <Text className={styles.summaryCount} hasTabularNumbers>{counts[status]}</Text>
            <span className={styles.orderProgress}><StatusDot label={meta.label} variant={statusDotTone[meta.tone]} /><Text type="supporting">{meta.label}</Text></span>
          </Card>
        );
      })}
    </section>
  );
}

function OrderBadges({order}: {order: AdminPipelineDisplayOrder}) {
  return <span className={styles.orderBadges}>{order.badges.slice(0, 2).map((badge) => <Badge key={`${badge.label}-${badge.count}`} label={`${badge.count} ${badge.label}`} variant={astryxTone[badge.tone]} />)}</span>;
}

function OrderRow({order}: {order: AdminPipelineDisplayOrder}) {
  const body = (
    <>
      <Text weight="semibold">{order.code}</Text>
      <span><Text weight="semibold" display="block">{order.company}</Text><Text type="supporting" color="secondary" display="block" className={styles.orderSubline}>{order.contact}{order.local ? " · локальне замовлення" : !order.detailEvidence ? " · обмежені source-докази" : ""}</Text></span>
      <Text type="supporting" color="secondary">{order.date}</Text>
      <Text type="supporting" color="secondary">{order.parts} запчастин</Text>
      <Text weight="semibold" hasTabularNumbers>{formatMoney(order.amount)}</Text>
      <span className={styles.orderProgress}><span className={styles.progressTrack}><span className={`${styles.progressFill} ${progressClass(order)}`} /></span><OrderBadges order={order} /></span>
    </>
  );
  if (order.detailHref) return <Link href={order.detailHref} className={styles.orderRow}>{body}</Link>;
  return <div className={styles.orderRow} aria-disabled="true" title="Представницький рядок: детальна картка не була зафіксована">{body}</div>;
}

function ListView({model}: {model: AdminOrderPipelineModel}) {
  if (model.filteredOrders.length === 0) return <Card padding={6}><EmptyState isCompact title="Замовлень поки немає" description="Очистіть пошук або вимкніть фільтр, щоб повернути доступні замовлення." /></Card>;
  const groups = ADMIN_ORDER_STATUS_ORDER.filter((status) => (model.listGroupCounts[status] ?? 0) > 0);
  return (
    <section className={styles.list}>
      {groups.map((status) => {
        const meta = ADMIN_ORDER_STATUS_META[status];
        const count = model.listGroupCounts[status] ?? 0;
        const expanded = model.expanded.has(status);
        const orders = model.pageOrders.filter((order) => order.status === status);
        return (
          <Card key={status} className={styles.listGroup} padding={4}>
            <header className={styles.listGroupHeader}>
              <button type="button" className={styles.groupButton} aria-expanded={expanded} onClick={() => model.toggleExpanded(status)}>
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {meta.groupLabel}
                <Badge label={String(count)} variant={astryxTone[meta.tone]} />
              </button>
              <Text type="supporting">{expanded ? "Згорнути" : `+${count} (натисніть, щоб розгорнути)`}</Text>
            </header>
            {expanded ? (orders.length > 0 ? <div className={styles.orderList}>{orders.map((order) => <OrderRow key={`${order.id}-${order.code}`} order={order} />)}</div> : <EmptyState isCompact title="Представницьких рядків на цій сторінці немає" description="Агрегований підсумок збережено; детальні картки для цих записів недоступні." />) : null}
          </Card>
        );
      })}
    </section>
  );
}

function KanbanCard({order}: {order: AdminPipelineDisplayOrder}) {
  const body = (
    <>
      <header className={styles.kanbanHeader}><Text weight="semibold">{order.code}</Text><Text type="supporting">{order.date}</Text></header>
      <Text weight="semibold" display="block">{order.company}</Text>
      <Text type="supporting" color="secondary" display="block">{order.contact}</Text>
      <div className={styles.kanbanMeta}><Text type="supporting">{order.parts} запчастин</Text><Text weight="semibold" hasTabularNumbers>{formatMoney(order.amount)}</Text></div>
      <div className={`${styles.orderProgress} ${styles.kanbanProgress}`}><span className={styles.progressTrack}><span className={`${styles.progressFill} ${progressClass(order)}`} /></span><Text type="supporting">{order.ready}/{order.total}</Text></div>
      <OrderBadges order={order} />
    </>
  );
  return (
    <Card className={styles.kanbanCard} padding={3}>
      {order.detailHref ? <Link href={order.detailHref} className={styles.kanbanLink}>{body}</Link> : <div aria-disabled="true" title="Представницький рядок без зафіксованої detail-картки">{body}</div>}
      {order.status === "new" ? <><Button label="Підтвердити" icon={<LockKeyhole size={14} />} variant="secondary" width="100%" isDisabled /><Text type="supporting" color="secondary" className={styles.disabledReason}>Підтвердження стане доступним після підключення операційної інтеграції.</Text></> : null}
    </Card>
  );
}

function KanbanView({model}: {model: AdminOrderPipelineModel}) {
  return (
    <section className={styles.kanban} role="region" aria-label="Канбан замовлень" tabIndex={0}>
      {ADMIN_ORDER_STATUS_ORDER.map((status) => {
        const meta = ADMIN_ORDER_STATUS_META[status];
        const orders = model.pageOrders.filter((order) => order.status === status);
        return (
          <Card key={status} className={styles.kanbanColumn} padding={3} variant="muted">
            <header className={styles.kanbanHeader}><Text weight="semibold">{meta.kanbanLabel}</Text><Badge label={String(model.summaryCounts[status])} variant={astryxTone[meta.tone]} /></header>
            {orders.map((order) => <KanbanCard key={`${order.id}-${order.code}`} order={order} />)}
            {orders.length === 0 ? <EmptyState isCompact title="Замовлень поки немає" /> : null}
          </Card>
        );
      })}
    </section>
  );
}

function SupplierOrderQueue() {
  return (
    <Card padding={4}>
      <header className={styles.queueHeader}>
        <div className={styles.queueCopy}><Heading level={2}>Черга замовлень постачальнику</Heading><Text type="supporting" color="secondary">Операційне створення та зміна статусів стануть доступними після підключення інтеграції.</Text></div>
        <Button label="Нове замовлення постачальнику" icon={<Plus size={14} />} endContent={<LockKeyhole size={14} />} variant="secondary" isDisabled />
      </header>
      <Text type="supporting" color="secondary" className={styles.disabledReason}>Створення замовлення постачальнику стане доступним після підключення інтеграції.</Text>
      <EmptyState isCompact title="Черга порожня" description="Source count для статусу «Очікує постачальника» дорівнює 0." />
    </Card>
  );
}

export function AstryxAdminOrderPipelineView({model, onReady}: AstryxAdminOrderPipelineViewProps) {
  const {renderedDesignSystem} = useAppearance();
  const isRendererCommitted = renderedDesignSystem === "astryx";
  useRendererReady(onReady);

  return (
    <main className={styles.page} data-admin-pipeline-renderer="astryx">
      <header className={styles.header}>
        <div className={styles.headerTitle}><Heading level={1}>Пайплайн замовлень</Heading><Badge label={String(model.visibleTotal)} variant="neutral" icon={<Box size={13} />} /></div>
      </header>
      <Banner status="warning" container="card" title="Замовлення дилерів відкриті" description="Дилери бачать складські індикатори та можуть надсилати замовлення." endContent={<Button label="Призупинити" icon={<LockKeyhole size={14} />} variant="secondary" isDisabled />}>
        <Text type="supporting">Призупинення замовлень стане доступним після підключення операційної інтеграції.</Text>
      </Banner>
      <Card className={styles.toolbar} padding={3}>
        <Toolbar
          label="Керування пайплайном"
          className={styles.astryxToolbar}
          startContent={<div className={styles.search}><TextInput label="Пошук замовлень" isLabelHidden value={model.query} onChange={model.changeQuery} placeholder="Пошук замовлень, запчастин, замовлення постачальнику#, трекінг..." startIcon={<Search size={16} />} hasClear width="100%" /></div>}
          endContent={<div className={styles.filterGroup}><PeriodFilter model={model} isRendererCommitted={isRendererCommitted} /><Button label="2 непрочитаних" icon={<MessageSquare size={15} />} variant={model.unreadOnly ? "primary" : "secondary"} aria-pressed={model.unreadOnly} onClick={model.toggleUnread} /></div>}
        />
        <div className={styles.viewGroup}>
          <SegmentedControl label="Вигляд замовлень" value={model.view} onChange={(value) => model.setView(value as "list" | "kanban")} layout="fill" size="md">
            <SegmentedControlItem value="list" label="Список" icon={<List size={15} />} />
            <SegmentedControlItem value="kanban" label="Канбан" icon={<Columns3 size={15} />} />
          </SegmentedControl>
        </div>
      </Card>
      <SummaryCards counts={model.summaryCounts} />
      {model.view === "list" ? <ListView model={model} /> : <KanbanView model={model} />}
      <SupplierOrderQueue />
      <div className={styles.pagination}>
        <Text type="supporting">{model.visibleTotal} замовлень · сторінка {model.page} з {model.pageCount}</Text>
        <Pagination page={model.page} totalPages={model.pageCount} variant="pages" siblingCount={1} label="Пагінація замовлень" onChange={(page) => model.changePage(page as AdminPipelinePage)} />
      </div>
    </main>
  );
}
