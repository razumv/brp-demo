"use client";

import {useMemo, useState} from "react";
import {useDemoStore} from "@/components/providers/demo-store-provider";
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
} from "@/lib/admin-order-data";
import {orderTotal} from "@/lib/mock-data";
import {adminOrderHref} from "@/lib/order-route-hrefs";

export type AdminPipelineView = "list" | "kanban";
export type AdminPipelinePage = 1 | 2 | 3;

export type AdminPipelineDisplayOrder = AdminPipelineRow & {
  local: boolean;
  searchIndex: string;
  detailHref: string;
  orderDate?: number;
};

export type AdminPipelineCalendarDay = {
  id: string;
  label: string;
  muted?: boolean;
};

export type AdminOrderPipelineModel = {
  query: string;
  view: AdminPipelineView;
  page: AdminPipelinePage;
  expanded: ReadonlySet<AdminOrderStatus>;
  periodOpen: boolean;
  periodSelection: readonly string[];
  unreadOnly: boolean;
  filterActive: boolean;
  visibleTotal: number;
  pageCount: number;
  pageOrders: readonly AdminPipelineDisplayOrder[];
  filteredOrders: readonly AdminPipelineDisplayOrder[];
  listGroupCounts: Readonly<Partial<Record<AdminOrderStatus, number>>>;
  summaryCounts: Readonly<Record<AdminOrderStatus, number>>;
  setView(view: AdminPipelineView): void;
  changeQuery(value: string): void;
  changePage(page: AdminPipelinePage): void;
  toggleExpanded(status: AdminOrderStatus): void;
  togglePeriod(): void;
  setPeriodOpen(open: boolean): void;
  selectPeriodDay(id: string): void;
  clearPeriod(): void;
  toggleUnread(): void;
};

export const ADMIN_PIPELINE_JULY_DAYS: readonly AdminPipelineCalendarDay[] = [
  {id: "jun-28", label: "28", muted: true}, {id: "jun-29", label: "29", muted: true}, {id: "jun-30", label: "30", muted: true},
  ...Array.from({length: 31}, (_, index) => ({id: `jul-${index + 1}`, label: String(index + 1)})),
  {id: "aug-1-preview", label: "1", muted: true},
];

export const ADMIN_PIPELINE_AUGUST_DAYS: readonly AdminPipelineCalendarDay[] = [
  {id: "jul-26-preview", label: "26", muted: true}, {id: "jul-27-preview", label: "27", muted: true}, {id: "jul-28-preview", label: "28", muted: true},
  {id: "jul-29-preview", label: "29", muted: true}, {id: "jul-30-preview", label: "30", muted: true}, {id: "jul-31-preview", label: "31", muted: true},
  ...Array.from({length: 31}, (_, index) => ({id: `aug-${index + 1}`, label: String(index + 1)})),
  {id: "sep-1", label: "1", muted: true}, {id: "sep-2", label: "2", muted: true}, {id: "sep-3", label: "3", muted: true},
  {id: "sep-4", label: "4", muted: true}, {id: "sep-5", label: "5", muted: true},
];

const pageGroupCounts: Record<AdminPipelinePage, Partial<Record<AdminOrderStatus, number>>> = {
  1: {new: 10, waiting: 9, done: 31},
  2: {waiting: 12, done: 28, cancelled: 10},
  3: {waiting: 7, done: 15, cancelled: 2},
};

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
  const month = {jun: 5, jul: 6, aug: 7, sep: 8}[match[1] as "jun" | "jul" | "aug" | "sep"];
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

const sourceDisplayOrders: readonly AdminPipelineDisplayOrder[] = sourcePipelineRows.map((order) => {
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
  return [{label: meta.groupLabel, count, tone: meta.tone}] as const;
}

function countByStatus(orders: readonly AdminPipelineDisplayOrder[]) {
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

export function getAdminPipelineProgressWidth(order: AdminPipelineDisplayOrder) {
  if (order.total <= 0 || order.ready <= 0) return "w-0";
  const ratio = order.ready / order.total;
  if (ratio >= 1) return "w-full";
  if (ratio >= 0.75) return "w-3/4";
  if (ratio >= 0.5) return "w-1/2";
  if (ratio >= 0.25) return "w-1/4";
  return "w-[12%]";
}

export function useAdminOrderPipelineController(): AdminOrderPipelineModel {
  const {state} = useDemoStore();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<AdminPipelineView>("list");
  const [page, setPage] = useState<AdminPipelinePage>(1);
  const [expanded, setExpanded] = useState<ReadonlySet<AdminOrderStatus>>(() => new Set(["new"]));
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodSelection, setPeriodSelection] = useState<readonly string[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const additionalLocalOrders = useMemo<AdminPipelineDisplayOrder[]>(() => state.orders
    .filter((order) => !sourcePipelineIdentities.has(order.id) && !sourcePipelineIdentities.has(order.code))
    .map((order) => {
      const parts = order.lines.reduce((total, line) => total + line.quantity, 0);
      const ready = ["ready", "sent", "done"].includes(order.status) ? parts : 0;
      return {
        id: order.id,
        code: order.code,
        company: order.company,
        contact: order.creator,
        date: new Intl.DateTimeFormat("uk-UA", {day: "2-digit", month: "2-digit", year: "numeric"}).format(new Date(order.createdAt)),
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

  const allOrders = useMemo<AdminPipelineDisplayOrder[]>(() => [...additionalLocalOrders, ...sourceDisplayOrders], [additionalLocalOrders]);
  const normalizedQuery = query.trim().toLocaleLowerCase("uk");
  const periodBounds = useMemo(() => {
    if (periodSelection.length !== 2) return undefined;
    const values = periodSelection.map(calendarDayTimestamp).filter((value): value is number => value !== undefined).sort((a, b) => a - b);
    return values.length === 2 ? {start: values[0], end: values[1] + 86_399_999} : undefined;
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
    const counts = {...ADMIN_PIPELINE_COUNTS};
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
    const counts = {...pageGroupCounts[page]};
    if (page === 1) {
      additionalLocalOrders.forEach((order) => {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
      });
    }
    return counts;
  }, [additionalLocalOrders, filterActive, filteredCounts, page]);

  const changePage = (nextPage: AdminPipelinePage) => {
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

  return {
    query,
    view,
    page,
    expanded,
    periodOpen,
    periodSelection,
    unreadOnly,
    filterActive,
    visibleTotal,
    pageCount,
    pageOrders,
    filteredOrders,
    listGroupCounts,
    summaryCounts,
    setView,
    changeQuery,
    changePage,
    toggleExpanded,
    togglePeriod: () => setPeriodOpen((current) => !current),
    setPeriodOpen,
    selectPeriodDay,
    clearPeriod: () => setPeriodSelection([]),
    toggleUnread,
  };
}
