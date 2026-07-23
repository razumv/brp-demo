"use client";

import Link from "next/link";
import {type ReactNode} from "react";
import {
  Box,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  List,
  LockKeyhole,
  MessageSquare,
  Plus,
  TriangleAlert,
} from "lucide-react";
import {
  AdminSearchField,
  AdminSegmentedControl,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import {EmptyState, PageHeader, Panel, StatusBadge} from "@/components/shared/ui";
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
  getAdminPipelineProgressWidth,
  type AdminOrderPipelineModel,
  type AdminPipelineCalendarDay,
  type AdminPipelineDisplayOrder,
  type AdminPipelinePage,
  type AdminPipelineView,
} from "./admin-order-pipeline-controller";
import styles from "./admin.module.css";

const toneTextClasses: Record<AdminTone, string> = {
  neutral: "text-[var(--muted-foreground)]",
  orange: "text-[var(--orange)]",
  amber: "text-[var(--amber)]",
  blue: "text-[var(--blue)]",
  purple: "text-[var(--purple)]",
  green: "text-[var(--green)]",
  red: "text-[var(--red)]",
};

function CalendarMonth({title, days, selected, onSelect}: {title: string; days: readonly AdminPipelineCalendarDay[]; selected: readonly string[]; onSelect: (id: string) => void}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-center text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-7 text-center text-[10px] text-[var(--muted-foreground)]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-1">{day}</span>)}
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            aria-label={`${title} ${day.label}${day.muted ? ", outside current month" : ""}`}
            aria-pressed={selected.includes(day.id)}
            onClick={() => onSelect(day.id)}
            className={`min-h-8 rounded-md border-0 text-xs ${selected.includes(day.id) ? "bg-[var(--orange)] text-white" : day.muted ? "bg-transparent text-[var(--faint)]" : "bg-transparent hover:bg-[var(--surface-subtle)]"}`}
          >
            {day.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function PeriodPopover({model}: {model: AdminOrderPipelineModel}) {
  if (!model.periodOpen) return null;
  return (
    <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(700px,calc(100vw-32px))] rounded-md border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-menu)] sm:right-0 sm:left-auto sm:w-[340px] lg:w-[520px] xl:w-[700px]" role="dialog" aria-label="Період замовлень">
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <CalendarMonth title="July 2026" days={ADMIN_PIPELINE_JULY_DAYS} selected={model.periodSelection} onSelect={model.selectPeriodDay} />
        <CalendarMonth title="August 2026" days={ADMIN_PIPELINE_AUGUST_DAYS} selected={model.periodSelection} onSelect={model.selectPeriodDay} />
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
        <span className="text-[10px] text-[var(--muted-foreground)]">{model.periodSelection.length === 0 ? "Click start date" : model.periodSelection.length === 1 ? "Оберіть кінцеву дату" : "Діапазон вибрано локально"}</span>
        <span className="flex gap-2">
          <button type="button" className="button button-ghost" onClick={model.clearPeriod}>Очистити</button>
          <button type="button" className="button button-outline" onClick={() => model.setPeriodOpen(false)}>Закрити</button>
        </span>
      </footer>
    </div>
  );
}

function SummaryCards({counts}: {counts: Readonly<Record<AdminOrderStatus, number>>}) {
  return (
    <div
      className={`${styles.statusScroller} ${styles.mobileHiddenOnMobile}`}
      data-mobile-surface="pipeline-summary"
      role="region"
      aria-label="Зведення статусів"
      tabIndex={0}
    >
      <section className={styles.statusGrid}>
        {ADMIN_ORDER_STATUS_ORDER.map((status) => {
          const meta = ADMIN_ORDER_STATUS_META[status];
          const colorClass = toneTextClasses[meta.tone];
          return (
            <article key={status} className={`${styles.statusCard} cursor-default`}>
              <span className={`${styles.statusCount} ${colorClass}`}>{counts[status]}</span>
              <span className={styles.statusLabel}><span className={`${styles.statusDot} ${colorClass}`} />{meta.label}</span>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function OrderIdentity({order}: {order: AdminPipelineDisplayOrder}) {
  return (
    <>
      <span className={styles.code}>{order.code}</span>
      <span>
        <strong>{order.company}</strong>
        <small className={styles.subline}>{order.contact}</small>
      </span>
      <span className={styles.muted}>{order.date}</span>
      <span className={styles.muted}>{order.parts} запчастин</span>
      <strong className={styles.orderAmount}>{formatMoney(order.amount)}</strong>
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]"><span className={`block h-full rounded-full bg-[var(--blue)] ${getAdminPipelineProgressWidth(order)}`} /></span>
        <span className="flex max-w-[112px] flex-wrap justify-end gap-1">
          {order.badges.slice(0, 2).map((badge) => <StatusBadge key={`${badge.label}-${badge.count}`} tone={badge.tone}>{badge.count} {badge.label}</StatusBadge>)}
        </span>
      </span>
    </>
  );
}

function ListOrder({order}: {order: AdminPipelineDisplayOrder}) {
  if (order.detailHref) return <Link href={order.detailHref} className={styles.orderRow}><OrderIdentity order={order} /></Link>;
  return <div className={`${styles.orderRow} cursor-default`} aria-disabled="true" title="Представницький рядок: детальна картка не була зафіксована"><OrderIdentity order={order} /></div>;
}

function ListGroup({status, count, orders, expanded, onToggle}: {status: AdminOrderStatus; count: number; orders: readonly AdminPipelineDisplayOrder[]; expanded: boolean; onToggle: () => void}) {
  const meta = ADMIN_ORDER_STATUS_META[status];
  return (
    <section className="grid gap-2">
      <button type="button" className={styles.groupTitle} aria-expanded={expanded} onClick={onToggle}>
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {meta.groupLabel}
          <StatusBadge tone={meta.tone}>{count}</StatusBadge>
        </span>
        {!expanded ? <span>+{count} (натисніть, щоб розгорнути)</span> : <span>Згорнути</span>}
      </button>
      {expanded ? (orders.length > 0 ? <div className={styles.orderList}>{orders.map((order) => <ListOrder key={`${order.id}-${order.code}`} order={order} />)}</div> : <Panel><EmptyState compact title="Представницьких рядків на цій сторінці немає" description="Агрегований підсумок збережено; детальні картки для цих записів недоступні." /></Panel>) : null}
    </section>
  );
}

function ListView({model}: {model: AdminOrderPipelineModel}) {
  if (model.filteredOrders.length === 0) return <Panel><EmptyState compact title="Замовлень поки немає" description="Очистіть пошук або вимкніть фільтр, щоб повернути доступні замовлення." /></Panel>;
  const groups = ADMIN_ORDER_STATUS_ORDER.filter((status) => (model.listGroupCounts[status] ?? 0) > 0);
  return <div className="grid gap-5">{groups.map((status) => <ListGroup key={status} status={status} count={model.listGroupCounts[status] ?? 0} orders={model.pageOrders.filter((order) => order.status === status)} expanded={model.expanded.has(status)} onToggle={() => model.toggleExpanded(status)} />)}</div>;
}

function KanbanCard({order}: {order: AdminPipelineDisplayOrder}) {
  const content = (
    <>
      <header className="flex items-start justify-between gap-3"><strong className={styles.code}>{order.code}</strong><span className="text-[9px] text-[var(--muted-foreground)]">{order.date}</span></header>
      <p>{order.company}<br /><span>{order.contact}</span></p>
      <div className="flex items-center justify-between gap-3 text-[10px]"><span>{order.parts} запчастин</span><strong>{formatMoney(order.amount)}</strong></div>
      <div className="mt-3 flex items-center gap-2"><span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]"><span className={`block h-full rounded-full bg-[var(--blue)] ${getAdminPipelineProgressWidth(order)}`} /></span><span className="text-[9px] text-[var(--muted-foreground)]">{order.ready}/{order.total}</span></div>
      <div className="mt-2 flex flex-wrap gap-1">{order.badges.map((badge) => <StatusBadge key={`${badge.label}-${badge.count}`} tone={badge.tone}>{badge.count} {badge.label}</StatusBadge>)}</div>
    </>
  );
  return (
    <article className={styles.kanbanCard}>
      {order.detailHref ? <Link href={order.detailHref} className="block">{content}</Link> : <div aria-disabled="true" title="Представницький рядок без зафіксованої detail-картки">{content}</div>}
      {order.status === "new" ? <button type="button" className="button button-outline mt-3 w-full text-[var(--green)]" disabled title="Підтвердження стане доступним після підключення операційної інтеграції."><LockKeyhole size={13} /> Підтвердити</button> : null}
    </article>
  );
}

function KanbanView({model}: {model: AdminOrderPipelineModel}) {
  return (
    <section className="grid grid-flow-col auto-cols-[minmax(230px,1fr)] gap-3 overflow-x-auto pb-2" role="region" aria-label="Канбан замовлень" tabIndex={0}>
      {ADMIN_ORDER_STATUS_ORDER.map((status) => {
        const meta = ADMIN_ORDER_STATUS_META[status];
        const columnOrders = model.pageOrders.filter((order) => order.status === status);
        return <div key={status} className={styles.kanbanColumn}><div className={styles.kanbanHeading}><span>{meta.kanbanLabel}</span><StatusBadge tone={meta.tone}>{model.summaryCounts[status]}</StatusBadge></div>{columnOrders.map((order) => <KanbanCard key={`${order.id}-${order.code}`} order={order} />)}{columnOrders.length === 0 ? <span className="grid min-h-32 place-items-center text-center text-[11px] text-[var(--muted-foreground)]">Замовлень поки немає</span> : null}</div>;
      })}
    </section>
  );
}

function SupplierOrderQueue() {
  return (
    <Panel>
      <div className={styles.panelHeader}>
        <div><h2 className={styles.sectionTitle}>Черга замовлень постачальнику</h2><p className={styles.sectionCopy}>Позиції, що очікують консолідації та відправлення постачальнику.</p></div>
        <button type="button" className="button button-outline" disabled title="Створення замовлення постачальнику стане доступним після підключення інтеграції."><LockKeyhole size={14} /><Plus size={14} /> Нове замовлення постачальнику</button>
      </div>
      <EmptyState compact title="Черга порожня" description="Наразі немає позицій, що очікують замовлення постачальнику." />
    </Panel>
  );
}

function Pagination({page, pageCount, total, onChange}: {page: AdminPipelinePage; pageCount: number; total: number; onChange: (page: AdminPipelinePage) => void}) {
  return (
    <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Пагінація замовлень">
      <span className="text-[11px] text-[var(--muted-foreground)]">{total} замовлень · сторінка {page} з {pageCount}</span>
      <div className="segmented">
        <button type="button" aria-label="Попередня сторінка" disabled={page === 1} onClick={() => onChange((page - 1) as AdminPipelinePage)}><ChevronLeft size={14} /></button>
        {Array.from({length: pageCount}, (_, index) => (index + 1) as AdminPipelinePage).map((item) => <button key={item} type="button" aria-current={page === item ? "page" : undefined} aria-pressed={page === item} onClick={() => onChange(item)}>{item}</button>)}
        <button type="button" aria-label="Наступна сторінка" disabled={page === pageCount} onClick={() => onChange((page + 1) as AdminPipelinePage)}><ChevronRight size={14} /></button>
      </div>
    </nav>
  );
}

function ToolbarButton({active, expanded, children, onClick}: {active?: boolean; expanded?: boolean; children: ReactNode; onClick: () => void}) {
  return <button type="button" className={`button button-outline ${active ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : ""}`} aria-pressed={active} aria-expanded={expanded} onClick={onClick}>{children}</button>;
}

export function CurrentAdminOrderPipelineView({model}: {model: AdminOrderPipelineModel}) {
  return (
    <main className="page mx-auto max-w-[1184px]" data-admin-pipeline-renderer="current">
      <div className={styles.pageStack}>
        <PageHeader admin title="Пайплайн замовлень" action={<StatusBadge><Box size={12} /> {model.visibleTotal}</StatusBadge>} />
        <Panel className={styles.availability}>
          <div className={styles.availabilityMain}><TriangleAlert size={17} className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" /><div><strong>Замовлення дилерів відкриті</strong><p>Дилери бачать складські індикатори та можуть надсилати замовлення.</p></div></div>
          <button type="button" className={styles.readonlyPill} disabled title="Призупинення замовлень стане доступним після підключення операційної інтеграції."><LockKeyhole size={14} /> Призупинити</button>
        </Panel>
        <AdminToolbar
          search={<AdminSearchField value={model.query} onValueChange={model.changeQuery} label="Пошук замовлень" placeholder="Пошук замовлень, запчастин, замовлення постачальнику#, трекінг..." />}
          filters={<><div className="relative" onKeyDown={(event) => { if (event.key === "Escape") model.setPeriodOpen(false); }}><ToolbarButton active={model.periodOpen || model.periodSelection.length > 0} expanded={model.periodOpen} onClick={model.togglePeriod}><CalendarDays size={15} /> Період</ToolbarButton><PeriodPopover model={model} /></div><ToolbarButton active={model.unreadOnly} onClick={model.toggleUnread}><MessageSquare size={15} /> 2 непрочитаних</ToolbarButton></>}
          view={<AdminSegmentedControl<AdminPipelineView> items={[{id: "list", label: "Список", icon: <List size={15} />}, {id: "kanban", label: "Канбан", icon: <Columns3 size={15} />}]} value={model.view} onValueChange={model.setView} label="Вигляд замовлень" mobileFullWidth />}
          mobileDisclosure={{sections: ["filters"], activeCount: Number(model.periodSelection.length > 0) + Number(model.unreadOnly), iconOnly: true}}
        />
        <SummaryCards counts={model.summaryCounts} />
        {model.view === "list" ? <ListView model={model} /> : <KanbanView model={model} />}
        <SupplierOrderQueue />
        <Pagination page={model.page} pageCount={model.pageCount} total={model.visibleTotal} onChange={model.changePage} />
      </div>
    </main>
  );
}
