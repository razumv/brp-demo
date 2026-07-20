"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
import {
  ADMIN_ORDER_BY_ID,
  ADMIN_ORDER_FIXTURES,
  ADMIN_ORDER_STATUS_META,
  ADMIN_ORDER_STATUS_ORDER,
  ADMIN_PIPELINE_COUNTS,
  ADMIN_PIPELINE_ROWS,
  ADMIN_PIPELINE_TOTAL,
  type AdminOrderStatus,
  type AdminPipelineRow,
  type AdminTone,
} from "@/lib/admin-order-data";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { adminOrderHref } from "@/lib/order-route-hrefs";
import styles from "./admin.module.css";

type PipelineView = "list" | "kanban";
type PipelinePage = 1 | 2 | 3;

type DisplayOrder = AdminPipelineRow & {
  local: boolean;
  searchIndex: string;
  detailHref: string;
  orderDate?: number;
};

type CalendarDay = {
  id: string;
  label: string;
  muted?: boolean;
};

const toneTextClasses: Record<AdminTone, string> = {
  neutral: "text-[var(--muted-foreground)]",
  orange: "text-[var(--orange)]",
  amber: "text-[var(--amber)]",
  blue: "text-[var(--blue)]",
  purple: "text-[var(--purple)]",
  green: "text-[var(--green)]",
  red: "text-[var(--red)]",
};

const pageGroupCounts: Record<PipelinePage, Partial<Record<AdminOrderStatus, number>>> = {
  1: { new: 10, waiting: 9, done: 31 },
  2: { waiting: 12, done: 28, cancelled: 10 },
  3: { waiting: 7, done: 15, cancelled: 2 },
};

const julyDays: readonly CalendarDay[] = [
  { id: "jun-28", label: "28", muted: true }, { id: "jun-29", label: "29", muted: true }, { id: "jun-30", label: "30", muted: true },
  ...Array.from({ length: 31 }, (_, index) => ({ id: `jul-${index + 1}`, label: String(index + 1) })),
  { id: "aug-1-preview", label: "1", muted: true },
];

const augustDays: readonly CalendarDay[] = [
  { id: "jul-26-preview", label: "26", muted: true }, { id: "jul-27-preview", label: "27", muted: true }, { id: "jul-28-preview", label: "28", muted: true },
  { id: "jul-29-preview", label: "29", muted: true }, { id: "jul-30-preview", label: "30", muted: true }, { id: "jul-31-preview", label: "31", muted: true },
  ...Array.from({ length: 31 }, (_, index) => ({ id: `aug-${index + 1}`, label: String(index + 1) })),
  { id: "sep-1", label: "1", muted: true }, { id: "sep-2", label: "2", muted: true }, { id: "sep-3", label: "3", muted: true },
  { id: "sep-4", label: "4", muted: true }, { id: "sep-5", label: "5", muted: true },
];

const log01Fixture = ADMIN_ORDER_FIXTURES.find((order) => order.code === "LOG-01");

const sourcePipelineRows: readonly AdminPipelineRow[] = [
  ...(log01Fixture ? [{
    id: log01Fixture.id,
    code: log01Fixture.code,
    company: log01Fixture.company,
    contact: log01Fixture.contact,
    date: "01:40",
    parts: log01Fixture.activeParts,
    amount: log01Fixture.total,
    status: log01Fixture.status,
    page: 1 as const,
    ready: 0,
    total: log01Fixture.totalUnits,
    badges: log01Fixture.lineBadges,
    detailEvidence: true,
  }] : []),
  ...ADMIN_PIPELINE_ROWS,
];

const sourcePipelineIdentities = new Set(sourcePipelineRows.flatMap((order) => [order.id, order.code]));

function parsePipelineDate(order: AdminPipelineRow, fixtureDate?: string) {
  const source = fixtureDate || order.date;
  const numeric = source.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (numeric) return new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1])).getTime();
  const normalized = /^\d{1,2}:\d{2}$/.test(source) ? `Jul 18, 2026 ${source}` : source;
  const direct = Date.parse(normalized);
  if (!Number.isNaN(direct)) return direct;
  const withYear = Date.parse(`${source}, 2026`);
  return Number.isNaN(withYear) ? undefined : withYear;
}

function calendarDayTimestamp(id: string) {
  const match = id.match(/^(jun|jul|aug|sep)-(\d+)/);
  if (!match) return undefined;
  const month = { jun: 5, jul: 6, aug: 7, sep: 8 }[match[1] as "jun" | "jul" | "aug" | "sep"];
  return new Date(2026, month, Number(match[2])).getTime();
}

function fixtureSearchText(order: AdminPipelineRow) {
  const fixture = ADMIN_ORDER_BY_ID.get(order.id) ?? ADMIN_ORDER_BY_ID.get(order.code);
  if (!fixture) return "";
  return [
    fixture.po,
    fixture.notes,
    ...fixture.lines.flatMap((line) => [line.partNumber, line.description, line.note, line.bossWebOrSupplier, line.stockSource]),
    ...fixture.documents.flatMap((document) => [document.reference, document.source, document.lines]),
    ...fixture.shipments.flatMap((shipment) => [shipment.carrier, shipment.tracking, shipment.destination]),
  ].filter(Boolean).join(" ");
}

const sourceDisplayOrders: readonly DisplayOrder[] = sourcePipelineRows.map((order) => {
  const detail = ADMIN_ORDER_BY_ID.get(order.id) ?? ADMIN_ORDER_BY_ID.get(order.code);
  return {
    ...order,
    local: false,
    searchIndex: `${order.code} ${order.company} ${order.contact} ${fixtureSearchText(order)}`.toLocaleLowerCase("uk"),
    detailHref: `/admin/orders/${detail?.id ?? order.id}`,
    orderDate: parsePipelineDate(order, detail?.created),
  };
});

function localStatusBadge(status: AdminOrderStatus, count: number) {
  const meta = ADMIN_ORDER_STATUS_META[status];
  return [{ label: meta.groupLabel, count, tone: meta.tone }] as const;
}

function countByStatus(orders: readonly DisplayOrder[]) {
  const result: Record<AdminOrderStatus, number> = {
    new: 0,
    waiting: 0,
    supplier: 0,
    ready: 0,
    sent: 0,
    done: 0,
    cancelled: 0,
  };
  orders.forEach((order) => {
    result[order.status] += 1;
  });
  return result;
}

function progressWidth(order: DisplayOrder) {
  if (order.total <= 0 || order.ready <= 0) return "w-0";
  const ratio = order.ready / order.total;
  if (ratio >= 1) return "w-full";
  if (ratio >= 0.75) return "w-3/4";
  if (ratio >= 0.5) return "w-1/2";
  if (ratio >= 0.25) return "w-1/4";
  return "w-[12%]";
}

function CalendarMonth({ title, days, selected, onSelect }: { title: string; days: readonly CalendarDay[]; selected: readonly string[]; onSelect: (id: string) => void }) {
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

function PeriodPopover({ open, selected, onSelect, onClose, onClear }: { open: boolean; selected: readonly string[]; onSelect: (id: string) => void; onClose: () => void; onClear: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(700px,calc(100vw-32px))] rounded-md border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-menu)] sm:right-0 sm:left-auto sm:w-[340px] lg:w-[520px] xl:w-[700px]" role="dialog" aria-label="Період замовлень">
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <CalendarMonth title="July 2026" days={julyDays} selected={selected} onSelect={onSelect} />
        <CalendarMonth title="August 2026" days={augustDays} selected={selected} onSelect={onSelect} />
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
        <span className="text-[10px] text-[var(--muted-foreground)]">{selected.length === 0 ? "Click start date" : selected.length === 1 ? "Оберіть кінцеву дату" : "Діапазон вибрано локально"}</span>
        <span className="flex gap-2">
          <button type="button" className="button button-ghost" onClick={onClear}>Очистити</button>
          <button type="button" className="button button-outline" onClick={onClose}>Закрити</button>
        </span>
      </footer>
    </div>
  );
}

function SummaryCards({ counts }: { counts: Readonly<Record<AdminOrderStatus, number>> }) {
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

function OrderIdentity({ order }: { order: DisplayOrder }) {
  return (
    <>
      <span className={styles.code}>{order.code}</span>
      <span>
        <strong>{order.company}</strong>
        <small className={styles.subline}>{order.contact}{order.local ? " · локальне демо" : !order.detailEvidence ? " · обмежені source-докази" : ""}</small>
      </span>
      <span className={styles.muted}>{order.date}</span>
      <span className={styles.muted}>{order.parts} запчастин</span>
      <strong className={styles.orderAmount}>{formatMoney(order.amount)}</strong>
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]"><span className={`block h-full rounded-full bg-[var(--blue)] ${progressWidth(order)}`} /></span>
        <span className="flex max-w-[112px] flex-wrap justify-end gap-1">
          {order.badges.slice(0, 2).map((badge) => <StatusBadge key={`${badge.label}-${badge.count}`} tone={badge.tone}>{badge.count} {badge.label}</StatusBadge>)}
        </span>
      </span>
    </>
  );
}

function ListOrder({ order }: { order: DisplayOrder }) {
  if (order.detailHref) {
    return <Link href={order.detailHref} className={styles.orderRow}><OrderIdentity order={order} /></Link>;
  }
  return (
    <div className={`${styles.orderRow} cursor-default`} aria-disabled="true" title="Представницький рядок: детальна картка не була зафіксована">
      <OrderIdentity order={order} />
    </div>
  );
}

function ListGroup({ status, count, orders, expanded, onToggle }: { status: AdminOrderStatus; count: number; orders: readonly DisplayOrder[]; expanded: boolean; onToggle: () => void }) {
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
      {expanded ? (
        orders.length > 0 ? (
          <div className={styles.orderList}>{orders.map((order) => <ListOrder key={`${order.id}-${order.code}`} order={order} />)}</div>
        ) : (
          <Panel><EmptyState compact title="Представницьких рядків на цій сторінці немає" description="Агрегований source count збережено; незафіксовані картки не були вигадані для клону." /></Panel>
        )
      ) : null}
    </section>
  );
}

function ListView({ orders, groupCounts, expanded, onToggle, empty }: { orders: readonly DisplayOrder[]; groupCounts: Readonly<Partial<Record<AdminOrderStatus, number>>>; expanded: ReadonlySet<AdminOrderStatus>; onToggle: (status: AdminOrderStatus) => void; empty: boolean }) {
  if (empty) {
    return <Panel><EmptyState compact title="Замовлень поки немає" description="Очистіть пошук або вимкніть фільтр, щоб повернути source-backed вибірку." /></Panel>;
  }
  const groups = ADMIN_ORDER_STATUS_ORDER.filter((status) => (groupCounts[status] ?? 0) > 0);
  return (
    <div className="grid gap-5">
      {groups.map((status) => (
        <ListGroup
          key={status}
          status={status}
          count={groupCounts[status] ?? 0}
          orders={orders.filter((order) => order.status === status)}
          expanded={expanded.has(status)}
          onToggle={() => onToggle(status)}
        />
      ))}
    </div>
  );
}

function KanbanCard({ order }: { order: DisplayOrder }) {
  const content = (
    <>
      <header className="flex items-start justify-between gap-3">
        <strong className={styles.code}>{order.code}</strong>
        <span className="text-[9px] text-[var(--muted-foreground)]">{order.date}</span>
      </header>
      <p>{order.company}<br /><span>{order.contact}</span></p>
      <div className="flex items-center justify-between gap-3 text-[10px]">
        <span>{order.parts} запчастин</span>
        <strong>{formatMoney(order.amount)}</strong>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]"><span className={`block h-full rounded-full bg-[var(--blue)] ${progressWidth(order)}`} /></span>
        <span className="text-[9px] text-[var(--muted-foreground)]">{order.ready}/{order.total}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {order.badges.map((badge) => <StatusBadge key={`${badge.label}-${badge.count}`} tone={badge.tone}>{badge.count} {badge.label}</StatusBadge>)}
      </div>
    </>
  );
  return (
    <article className={styles.kanbanCard}>
      {order.detailHref ? <Link href={order.detailHref} className="block">{content}</Link> : <div aria-disabled="true" title="Представницький рядок без зафіксованої detail-картки">{content}</div>}
      {order.status === "new" ? (
        <button type="button" className="button button-outline mt-3 w-full text-[var(--green)]" disabled title="Демо: підтвердження вимкнене">
          <LockKeyhole size={13} /> Підтвердити
        </button>
      ) : null}
    </article>
  );
}

function KanbanView({ orders, counts }: { orders: readonly DisplayOrder[]; counts: Readonly<Record<AdminOrderStatus, number>> }) {
  return (
    <section className="grid grid-flow-col auto-cols-[minmax(230px,1fr)] gap-3 overflow-x-auto pb-2" role="region" aria-label="Канбан замовлень" tabIndex={0}>
      {ADMIN_ORDER_STATUS_ORDER.map((status) => {
        const meta = ADMIN_ORDER_STATUS_META[status];
        const columnOrders = orders.filter((order) => order.status === status);
        return (
          <div key={status} className={styles.kanbanColumn}>
            <div className={styles.kanbanHeading}><span>{meta.kanbanLabel}</span><StatusBadge tone={meta.tone}>{counts[status]}</StatusBadge></div>
            {columnOrders.map((order) => <KanbanCard key={`${order.id}-${order.code}`} order={order} />)}
            {columnOrders.length === 0 ? <span className="grid min-h-32 place-items-center text-center text-[11px] text-[var(--muted-foreground)]">Замовлень поки немає</span> : null}
          </div>
        );
      })}
    </section>
  );
}

function SupplierOrderQueue() {
  return (
    <Panel>
      <div className={styles.panelHeader}>
        <div><h2 className={styles.sectionTitle}>Черга замовлень постачальнику</h2><p className={styles.sectionCopy}>Операційне створення та зміна статусів у локальному клоні вимкнені.</p></div>
        <button type="button" className="button button-outline" disabled title="Демо: створення замовлення постачальнику вимкнене"><LockKeyhole size={14} /><Plus size={14} /> Нове замовлення постачальнику</button>
      </div>
      <EmptyState compact title="Черга порожня" description="Source count для статусу «Очікує постачальника» дорівнює 0." />
    </Panel>
  );
}

function Pagination({ page, pageCount, total, onChange }: { page: PipelinePage; pageCount: number; total: number; onChange: (page: PipelinePage) => void }) {
  return (
    <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Пагінація замовлень">
      <span className="text-[11px] text-[var(--muted-foreground)]">{total} замовлень · сторінка {page} з {pageCount}</span>
      <div className="segmented">
        <button type="button" aria-label="Попередня сторінка" disabled={page === 1} onClick={() => onChange((page - 1) as PipelinePage)}><ChevronLeft size={14} /></button>
        {Array.from({ length: pageCount }, (_, index) => (index + 1) as PipelinePage).map((item) => <button key={item} type="button" aria-current={page === item ? "page" : undefined} aria-pressed={page === item} onClick={() => onChange(item)}>{item}</button>)}
        <button type="button" aria-label="Наступна сторінка" disabled={page === pageCount} onClick={() => onChange((page + 1) as PipelinePage)}><ChevronRight size={14} /></button>
      </div>
    </nav>
  );
}

function ToolbarButton({ active, expanded, children, onClick }: { active?: boolean; expanded?: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className={`button button-outline ${active ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : ""}`} aria-pressed={active} aria-expanded={expanded} onClick={onClick}>{children}</button>;
}

export function AdminOrderPipeline() {
  const { state } = useDemoStore();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<PipelineView>("list");
  const [page, setPage] = useState<PipelinePage>(1);
  const [expanded, setExpanded] = useState<ReadonlySet<AdminOrderStatus>>(() => new Set(["new"]));
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodSelection, setPeriodSelection] = useState<readonly string[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const additionalLocalOrders = useMemo<DisplayOrder[]>(() => state.orders
    .filter((order) => !sourcePipelineIdentities.has(order.id) && !sourcePipelineIdentities.has(order.code))
    .map((order) => {
      const parts = order.lines.reduce((total, line) => total + line.quantity, 0);
      const ready = ["ready", "sent", "done"].includes(order.status) ? parts : 0;
      return {
        id: order.id,
        code: order.code,
        company: order.company,
        contact: order.creator,
        date: new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(order.createdAt)),
        parts,
        amount: orderTotal(order.lines),
        status: order.status,
        page: 1,
        ready,
        total: parts,
        badges: localStatusBadge(order.status, parts),
        local: true,
        searchIndex: `${order.code} ${order.company} ${order.creator} ${order.po} ${order.note} ${order.lines.flatMap((line) => [line.partNumber, line.description, line.privateNote]).filter(Boolean).join(" ")}`.toLocaleLowerCase("uk"),
        detailHref: adminOrderHref(order.id),
        orderDate: new Date(order.createdAt).getTime(),
      };
    }), [state.orders]);

  const allOrders = useMemo<DisplayOrder[]>(() => [...additionalLocalOrders, ...sourceDisplayOrders], [additionalLocalOrders]);
  const normalizedQuery = query.trim().toLocaleLowerCase("uk");
  const periodBounds = useMemo(() => {
    if (periodSelection.length !== 2) return undefined;
    const values = periodSelection.map(calendarDayTimestamp).filter((value): value is number => value !== undefined).sort((a, b) => a - b);
    return values.length === 2 ? { start: values[0], end: values[1] + 86_399_999 } : undefined;
  }, [periodSelection]);
  const filterActive = Boolean(normalizedQuery || unreadOnly || periodBounds);

  const filteredOrders = useMemo(() => allOrders.filter((order) => {
    if (normalizedQuery && !order.searchIndex.includes(normalizedQuery)) return false;
    if (periodBounds && (!order.orderDate || order.orderDate < periodBounds.start || order.orderDate > periodBounds.end)) return false;
    if (unreadOnly && !order.unread) return false;
    return true;
  }), [allOrders, normalizedQuery, periodBounds, unreadOnly]);

  const pageOrders = useMemo(() => filterActive ? filteredOrders : filteredOrders.filter((order) => order.page === page), [filterActive, filteredOrders, page]);
  const filteredCounts = useMemo(() => countByStatus(filteredOrders), [filteredOrders]);
  const sourceCountsWithLocal = useMemo(() => {
    const counts = { ...ADMIN_PIPELINE_COUNTS };
    additionalLocalOrders.forEach((order) => {
      counts[order.status] += 1;
    });
    return counts;
  }, [additionalLocalOrders]);
  const summaryCounts = filterActive ? filteredCounts : sourceCountsWithLocal;
  const visibleTotal = filterActive ? filteredOrders.length : ADMIN_PIPELINE_TOTAL + additionalLocalOrders.length;
  const pageCount = filterActive ? 1 : 3;

  const listGroupCounts = useMemo<Partial<Record<AdminOrderStatus, number>>>(() => {
    if (filterActive) return filteredCounts;
    const counts = { ...pageGroupCounts[page] };
    if (page === 1) {
      additionalLocalOrders.forEach((order) => {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
      });
    }
    return counts;
  }, [additionalLocalOrders, filterActive, filteredCounts, page]);

  const changePage = (nextPage: PipelinePage) => {
    setPage(nextPage);
    setExpanded(new Set(nextPage === 1 ? ["new"] : nextPage === 2 ? ["done"] : []));
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
    setExpanded(new Set(ADMIN_ORDER_STATUS_ORDER));
  };

  const toggleExpanded = (status: AdminOrderStatus) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleUnread = () => {
    setUnreadOnly((current) => !current);
    setPage(1);
    setExpanded(new Set(ADMIN_ORDER_STATUS_ORDER));
  };

  const selectPeriodDay = (id: string) => {
    setPeriodSelection((current) => current.length >= 2 ? [id] : [...current, id]);
    setPage(1);
    setExpanded(new Set(ADMIN_ORDER_STATUS_ORDER));
  };

  return (
    <main className="page mx-auto max-w-[1184px]">
      <div className={styles.pageStack}>
        <PageHeader admin title="Пайплайн замовлень" action={<StatusBadge><Box size={12} /> {visibleTotal}</StatusBadge>} />

        <Panel className={styles.availability}>
          <div className={styles.availabilityMain}>
            <TriangleAlert size={17} className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
            <div><strong>Замовлення дилерів відкриті</strong><p>Дилери бачать складські індикатори та можуть надсилати замовлення.</p></div>
          </div>
          <button type="button" className={styles.readonlyPill} disabled title="Демо: призупинення вимкнене"><LockKeyhole size={14} /> Призупинити</button>
        </Panel>

        <AdminToolbar
          search={(
            <AdminSearchField
              value={query}
              onValueChange={changeQuery}
              label="Пошук замовлень"
              placeholder="Пошук замовлень, запчастин, замовлення постачальнику#, трекінг..."
            />
          )}
          filters={(
            <>
              <div className="relative" onKeyDown={(event) => { if (event.key === "Escape") setPeriodOpen(false); }}>
                <ToolbarButton active={periodOpen || periodSelection.length > 0} expanded={periodOpen} onClick={() => setPeriodOpen((current) => !current)}><CalendarDays size={15} /> Період</ToolbarButton>
                <PeriodPopover open={periodOpen} selected={periodSelection} onSelect={selectPeriodDay} onClose={() => setPeriodOpen(false)} onClear={() => setPeriodSelection([])} />
              </div>
              <ToolbarButton active={unreadOnly} onClick={toggleUnread}><MessageSquare size={15} /> 2 непрочитаних</ToolbarButton>
            </>
          )}
          view={(
            <AdminSegmentedControl<PipelineView>
              items={[
                { id: "list", label: "Список", icon: <List size={15} /> },
                { id: "kanban", label: "Канбан", icon: <Columns3 size={15} /> },
              ]}
            value={view}
            onValueChange={setView}
            label="Вигляд замовлень"
            mobileFullWidth
          />
          )}
          mobileDisclosure={{
            sections: ["filters"],
            activeCount: Number(periodSelection.length > 0) + Number(unreadOnly),
            iconOnly: true,
          }}
        />

        <SummaryCards counts={summaryCounts} />
        {view === "list" ? (
          <ListView orders={pageOrders} groupCounts={listGroupCounts} expanded={expanded} onToggle={toggleExpanded} empty={filteredOrders.length === 0} />
        ) : (
          <KanbanView orders={pageOrders} counts={summaryCounts} />
        )}
        <SupplierOrderQueue />
        <Pagination page={page} pageCount={pageCount} total={visibleTotal} onChange={changePage} />
      </div>
    </main>
  );
}
