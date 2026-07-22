"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  Expand,
  FileText,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  Paperclip,
  RefreshCcw,
  Send,
  Truck,
  Warehouse,
} from "lucide-react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {
  EmptyState,
  InlineNotice,
  Modal,
  Panel,
  StatusBadge,
} from "@/components/shared/ui";
import {
  ADMIN_ORDER_BY_ID,
  ADMIN_ORDER_STATUS_META,
  ADMIN_PIPELINE_ROWS,
  type AdminLineStatus,
  type AdminOrderFixture,
  type AdminOrderLine,
  type AdminOrderStatus,
  type AdminPipelineRow,
  type AdminStatusBadgeCount,
  type AdminTone,
} from "@/lib/admin-order-data";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import type { Order, OrderLine, OrderStatus } from "@/lib/types";
import type {
  AdminOrderDetailViewModel,
  DeliveryChannel,
  LineFilter,
  PreflightView,
} from "./admin-order-detail-types";
import styles from "./admin.module.css";

const loadAstryxAdminOrderDetailView = () =>
  import("./astryx-admin-order-detail-view").then((module) => ({
    default: module.AstryxAdminOrderDetailView,
  }));

const lineStatusMeta: Record<AdminLineStatus, { label: string; tone: AdminTone }> = {
  pending: { label: "Очікування", tone: "amber" },
  waiting: { label: "Очікує замовлення", tone: "amber" },
  ready: { label: "Готово до відправки", tone: "green" },
  sent: { label: "Відправлено", tone: "purple" },
  delivered: { label: "Доставлено", tone: "green" },
  cancelled: { label: "Скасовано", tone: "red" },
};

const fixtureStatusLabels: Record<AdminOrderStatus, string> = {
  new: "Новий",
  waiting: "В процесі",
  supplier: "Очікує постачальника",
  ready: "Готово",
  sent: "Відправлено",
  done: "Доставлено",
  cancelled: "Скасовано",
};

function statusTone(status: AdminOrderStatus): AdminTone {
  return ADMIN_ORDER_STATUS_META[status].tone;
}

function storeLineStatus(status: OrderStatus): AdminLineStatus {
  if (status === "cancelled") return "cancelled";
  if (status === "done") return "delivered";
  if (status === "ready") return "ready";
  if (status === "sent") return "sent";
  if (status === "waiting" || status === "supplier") return "waiting";
  return "pending";
}

function adaptStoreLine(line: OrderLine, orderStatus: OrderStatus, index: number): AdminOrderLine {
  const status = storeLineStatus(orderStatus);
  const sourceLabel = line.source === "warehouse" ? String(line.quantity) : line.source === "bossweb" ? "BossWeb" : "Каталог";
  return {
    id: `local-${line.partNumber}-${index}`,
    partNumber: line.partNumber,
    description: line.description,
    note: line.privateNote,
    status,
    statusLabel: lineStatusMeta[status].label,
    bossWebOrSupplier: line.source === "bossweb" ? "BossWeb" : "—",
    stockSource: sourceLabel,
    quantity: line.quantity,
    unitPrice: line.dealerPrice,
    disabled: status === "cancelled",
  };
}

function statusBadges(lines: readonly AdminOrderLine[]): AdminStatusBadgeCount[] {
  return (Object.keys(lineStatusMeta) as AdminLineStatus[]).flatMap((status) => {
    const count = lines.filter((line) => line.status === status).reduce((sum, line) => sum + line.quantity, 0);
    return count ? [{ label: lineStatusMeta[status].label, count, tone: lineStatusMeta[status].tone }] : [];
  });
}

function formatStoreDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatStoreTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function adaptStoreOrder(order: Order): AdminOrderFixture {
  const lines = order.lines.map((line, index) => adaptStoreLine(line, order.status, index));
  const total = orderTotal(order.lines);
  return {
    id: order.id,
    code: order.code,
    company: order.company,
    contact: order.creator,
    created: formatStoreDate(order.createdAt),
    po: order.po,
    delivery: order.delivery === "standard" ? "Доставка" : "Самовивіз",
    notes: order.note,
    status: order.status,
    statusLabel: fixtureStatusLabels[order.status],
    stage: order.stage,
    activeParts: lines.filter((line) => line.status !== "cancelled").length,
    totalUnits: lines.reduce((sum, line) => sum + line.quantity, 0),
    total,
    lineBadges: statusBadges(lines),
    lines,
    totals: [{ label: `Замовлено (${lines.reduce((sum, line) => sum + line.quantity, 0)})`, value: total, tone: "amber" }],
    messages: order.messages.map((message) => ({
      id: message.id,
      author: message.author,
      role: message.role === "admin" ? "manager" : "dealer",
      body: message.body,
      time: formatStoreTime(message.createdAt),
    })),
    timeline: order.timeline.map((event) => ({ id: event.id, time: formatStoreTime(event.createdAt), text: `${event.label} — ${event.detail}` })),
    documents: [],
    shipments: [],
    evidenceComplete: true,
  };
}

function adaptPipelineRow(row: AdminPipelineRow): AdminOrderFixture {
  return {
    id: row.id,
    code: row.code,
    company: row.company,
    contact: row.contact,
    created: row.date,
    delivery: "Доставка",
    notes: "Для цього замовлення зафіксовано лише факти рядка пайплайна; склад позицій у джерельних матеріалах відсутній.",
    status: row.status,
    statusLabel: fixtureStatusLabels[row.status],
    stage: ADMIN_ORDER_STATUS_META[row.status].groupLabel,
    progress: `${row.ready} з ${row.total} готово`,
    activeParts: row.parts,
    totalUnits: row.total,
    total: row.amount,
    lineBadges: row.badges,
    lines: [],
    totals: [],
    messages: [],
    timeline: [],
    documents: [],
    shipments: [],
    evidenceComplete: false,
  };
}

function resolveOrder(id: string, storeOrders: readonly Order[]): AdminOrderFixture | null {
  const fixture = ADMIN_ORDER_BY_ID.get(id);
  if (fixture) return fixture;
  const storeOrder = storeOrders.find((candidate) => candidate.id === id || candidate.code === id);
  if (storeOrder) return adaptStoreOrder(storeOrder);
  const pipelineRow = ADMIN_PIPELINE_ROWS.find((candidate) => candidate.id === id || candidate.code === id);
  return pipelineRow ? adaptPipelineRow(pipelineRow) : null;
}

function toneText(tone: AdminTone) {
  if (tone === "green") return "text-[var(--green)]";
  if (tone === "red") return "text-[var(--red)]";
  if (tone === "purple") return "text-[var(--purple)]";
  if (tone === "blue") return "text-[var(--blue)]";
  if (tone === "orange") return "text-[var(--orange)]";
  if (tone === "amber") return "text-[var(--amber)]";
  return "text-[var(--muted-foreground)]";
}

const actionUnavailableReason = "Дія недоступна в поточному стані";

function DisabledActionButton({
  children,
  className,
  reason = actionUnavailableReason,
}: {
  children: ReactNode;
  className?: string;
  reason?: string;
}) {
  return <button type="button" className={`button button-outline ${className ?? ""}`} disabled title={reason}>{children}</button>;
}

function OrderLines({ order, filter, onFilter }: { order: AdminOrderFixture; filter: LineFilter; onFilter: (filter: LineFilter) => void }) {
  const availableStatuses = (Object.keys(lineStatusMeta) as AdminLineStatus[]).filter((status) => order.lines.some((line) => line.status === status));
  const effectiveFilter = filter === "all" || availableStatuses.includes(filter) ? filter : "all";
  const lines = effectiveFilter === "all" ? order.lines : order.lines.filter((line) => line.status === effectiveFilter);
  const allUnits = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" aria-label="Фільтр статусів позицій">
        <button type="button" onClick={() => onFilter("all")} aria-pressed={effectiveFilter === "all"} className={`rounded-full border px-3 py-1.5 text-[10px] ${effectiveFilter === "all" ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"}`}>Усі {allUnits}</button>
        {availableStatuses.map((status) => {
          const count = order.lines.filter((line) => line.status === status).reduce((sum, line) => sum + line.quantity, 0);
          const meta = lineStatusMeta[status];
          return <button key={status} type="button" onClick={() => onFilter(status)} aria-pressed={effectiveFilter === status} className={`rounded-full border px-3 py-1.5 text-[10px] ${effectiveFilter === status ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"}`}>{meta.label} {count}</button>;
        })}
      </div>

      {!order.evidenceComplete ? (
        <Panel className="overflow-hidden">
          <EmptyState
            compact
            icon={<FileText size={25} />}
            title="Склад позицій не зафіксовано"
            description={`Для ${order.code} доступні лише факти пайплайна: ${order.activeParts} позицій, ${formatMoney(order.total)}. Додаткові позиції не підставляються.`}
          />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div className="data-table-wrap">
            <table className={`data-table ${styles.lineTable}`}>
              <thead><tr><th><input type="checkbox" disabled aria-label="Вибрати всі позиції" /></th><th>Артикул</th><th>Опис</th><th>CRM статус</th><th>BossWeb / замовлення постачальнику</th><th>Склад / джерело</th><th>К-сть</th><th>Ціна</th><th>Сума</th></tr></thead>
              <tbody>
                {lines.map((line) => {
                  const meta = lineStatusMeta[line.status];
                  const cancelled = line.status === "cancelled";
                  return (
                    <tr key={line.id} className={cancelled ? "opacity-50" : undefined}>
                      <td><input type="checkbox" disabled aria-label={`Вибрати ${line.partNumber}`} /></td>
                      <td><span className={`${styles.code} ${cancelled ? "line-through" : ""}`}>{line.partNumber}</span></td>
                      <td><strong className={cancelled ? "line-through" : undefined}>{line.description}</strong>{line.note ? <small className={`${styles.subline} ${cancelled ? "text-[var(--red)]" : ""}`}>{line.note}</small> : null}</td>
                      <td><StatusBadge tone={meta.tone}>{line.statusLabel}</StatusBadge></td>
                      <td>{line.bossWebOrSupplier}</td>
                      <td>{line.stockSource === "—" ? "—" : <><span className="text-[var(--green)]">●</span> {line.stockSource}</>}</td>
                      <td className={cancelled ? "line-through" : undefined}>{line.quantity}</td>
                      <td className={cancelled ? "line-through" : undefined}>{formatMoney(line.unitPrice)}</td>
                      <td><strong className={cancelled ? "line-through" : undefined}>{formatMoney(line.unitPrice * line.quantity)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><td colSpan={6}><strong>РАЗОМ</strong></td><td>{order.totalUnits}<span className={`${styles.subline} whitespace-nowrap`}>одиниць</span></td><td>—</td><td><strong>{formatMoney(order.total)}</strong></td></tr></tfoot>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function TotalStrip({ order }: { order: AdminOrderFixture }) {
  return (
    <Panel className={styles.totalStrip}>
      <span className="flex flex-wrap items-center gap-3"><strong>РАЗОМ</strong>{order.totals.map((total) => <span key={total.label} className={toneText(total.tone)}>{total.label}: {formatMoney(total.value)}</span>)}{!order.evidenceComplete ? <span className={styles.muted}>Тільки сума рядка пайплайна</span> : null}</span>
      <strong>{formatMoney(order.total)}</strong>
    </Panel>
  );
}

function DocumentsPanel({ order }: { order: AdminOrderFixture }) {
  return (
    <Panel>
      <div className={styles.panelHeader}><div><h2 className={styles.sectionTitle}>Документи 1C</h2><p className={styles.sectionCopy}>Перегляд без завантаження, retry або синхронізації.</p></div><FileText size={16} /></div>
      {order.documents.length ? <div className={`${styles.panelBody} ${styles.stack}`}>{order.documents.map((document) => <article key={document.id} className="rounded-md border border-[var(--border)] p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><strong>{document.kind} · {document.reference}</strong><span className={styles.subline}>{document.source} · {document.lines}</span></div><div className="flex flex-wrap gap-2"><StatusBadge tone={document.sync === "синхр." ? "green" : "amber"}>{document.sync}</StatusBadge><StatusBadge tone={document.posting === "проведено" ? "green" : "amber"}>{document.posting}</StatusBadge></div></div><div className="mt-3 flex flex-wrap gap-2"><DisabledActionButton><Download size={13} /> Завантажити</DisabledActionButton><DisabledActionButton><RefreshCcw size={13} /> Повторити / sync 1C</DisabledActionButton></div></article>)}</div> : <EmptyState compact icon={<FileText size={24} />} title="Документів немає" description="Для цього джерельного стану документи 1C не зафіксовані." />}
    </Panel>
  );
}

function ShipmentsPanel({ order }: { order: AdminOrderFixture }) {
  return (
    <Panel>
      <div className={styles.panelHeader}><div><h2 className={styles.sectionTitle}>Відправлення дилеру</h2><p className={styles.sectionCopy}>Лише зафіксовані деталі доставки.</p></div><Truck size={16} /></div>
      {order.shipments.length ? <div className={`${styles.panelBody} ${styles.stack}`}>{order.shipments.map((shipment) => <article key={shipment.id} className="rounded-md border border-[var(--border)] p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><strong>{shipment.carrier}</strong><span className={styles.subline}>{shipment.method} · {shipment.shippedAt}</span></div><StatusBadge tone="purple">{shipment.status}</StatusBadge></div><p className="mb-0 mt-3 text-[11px]">{shipment.destination}</p>{shipment.tracking ? <p className={styles.sectionCopy}>ТТН: {shipment.tracking}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><DisabledActionButton>Редагувати</DisabledActionButton><DisabledActionButton>Позначити доставленим</DisabledActionButton><DisabledActionButton><Download size={13} /> Завантажити</DisabledActionButton></div></article>)}</div> : <EmptyState compact icon={<Truck size={24} />} title="Відправлень немає" description="Для цього стану замовлення дилерські відправлення відсутні." />}
    </Panel>
  );
}

function InlineChat({ order, onExpand }: { order: AdminOrderFixture; onExpand: () => void }) {
  const recent = order.messages.slice(-2);
  return (
    <Panel>
      <div className={styles.panelHeader}><h2 className={styles.sectionTitle}>Чат</h2><button type="button" className="icon-button icon-button-small" aria-label="Розгорнути чат" onClick={onExpand}><Expand size={15} /></button></div>
      <div className={`${styles.railBody} ${styles.stack}`}>
        {recent.length ? recent.map((message) => <article key={message.id} className={styles.chatMessage}><header><strong>{message.author}</strong><StatusBadge tone={message.role === "dealer" ? "blue" : "orange"}>{message.role}</StatusBadge><span className="ml-auto">{message.time}</span></header><p>{message.body}</p></article>) : <EmptyState compact icon={<MessageSquareText size={23} />} title="Повідомлень поки немає" description="Розпочніть спілкування у робочому середовищі." />}
        <div className="flex gap-2"><button type="button" className="icon-button" disabled title={actionUnavailableReason} aria-label="Додати вкладення"><Paperclip size={15} /></button><input disabled className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3" placeholder="Введіть повідомлення..." /><button type="button" className="icon-button" disabled title={actionUnavailableReason} aria-label="Надіслати"><Send size={15} /></button></div>
        <button type="button" className="button button-outline button-wide" onClick={onExpand}><Expand size={14} /> Розгорнути чат</button>
      </div>
    </Panel>
  );
}

function TimelinePanel({ order, open, onToggle }: { order: AdminOrderFixture; open: boolean; onToggle: () => void }) {
  return (
    <Panel>
      <button type="button" className={`${styles.panelHeader} w-full border-0 bg-transparent text-left`} aria-expanded={open} onClick={onToggle}><span className="flex items-center gap-2"><ClipboardCheck size={16} className="text-[var(--orange)]" /><strong>Хронологія {order.timeline.length}</strong></span>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
      {open ? <div className={styles.railBody}>{order.timeline.length ? <ol className={styles.timeline}>{order.timeline.map((event) => <li key={event.id}><strong>{event.time}</strong><span>{event.text}</span></li>)}</ol> : <p className={styles.sectionCopy}>Хронологія не зафіксована для цього рядка пайплайна.</p>}</div> : null}
    </Panel>
  );
}

function ChatModal({ order, open, onClose }: { order: AdminOrderFixture; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Чат" description={`${order.code} · повна історія`} className="!w-[min(640px,100%)]" footer={<div className="flex w-full gap-2"><button type="button" className="icon-button" disabled title={actionUnavailableReason} aria-label="Додати вкладення"><Paperclip size={15} /></button><input disabled className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3" placeholder="Введіть повідомлення..." /><button type="button" className="button button-primary" disabled title={actionUnavailableReason}><Send size={14} /> Надіслати</button></div>}>
      <div className="grid min-h-[360px] content-start gap-3">{order.messages.length ? order.messages.map((message) => <article key={message.id} className={styles.chatMessage}><header><strong>{message.author}</strong><StatusBadge tone={message.role === "dealer" ? "blue" : "orange"}>{message.role}</StatusBadge><span className="ml-auto">{message.time}</span></header><p>{message.body}</p></article>) : <EmptyState icon={<MessageSquareText size={26} />} title="Повідомлень поки немає" description="Надсилання повідомлень і вкладень недоступне у поточному стані." />}</div>
    </Modal>
  );
}

function PreviewTable({ order, delivery, replenishment, onDelivery, onReplenishment }: { order: AdminOrderFixture; delivery: DeliveryChannel; replenishment: number; onDelivery: (value: DeliveryChannel) => void; onReplenishment: (value: number) => void }) {
  const activeLines = order.lines.filter((line) => line.status !== "cancelled");
  if (!activeLines.length) return <EmptyState compact title="Немає підтверджених позицій для preview" description="Для цього рядка немає evidence-backed складу позицій; розрахунок не вигадується." />;
  return (
    <div className="grid gap-4">
      <InlineNotice>Репрезентативний layout джерельного preview. Значення нижче не записуються до замовлення.</InlineNotice>
      <div className="grid gap-3 sm:grid-cols-2"><label className="field"><span>Канал доставки</span><select value={delivery} onChange={(event) => onDelivery(event.target.value as DeliveryChannel)}><option value="air">air</option><option value="ocean">ocean</option></select></label><label className="field"><span>Поповнення, к-сть</span><input type="number" min={0} value={replenishment} onChange={(event) => onReplenishment(Math.max(0, Number(event.target.value) || 0))} /></label></div>
      <div className="data-table-wrap rounded-md border border-[var(--border)]"><table className="data-table min-w-[1120px]"><thead><tr><th>Артикул</th><th>Запитано</th><th>Склад зараз</th><th>Зі складу</th><th>Після підтвердження</th><th>Оборот</th><th>Відкрито Logos</th><th>До замовлення</th><th>Канал</th><th>Рішення Logos</th></tr></thead><tbody>{activeLines.map((line) => {
        const stock = Number.parseInt(line.stockSource, 10) || 0;
        const fromStock = Math.min(stock, line.quantity);
        const toOrder = Math.max(0, line.quantity - fromStock) + replenishment;
        return <tr key={line.id}><td className={styles.code}>{line.partNumber}</td><td>{line.quantity}</td><td>{stock}</td><td>{fromStock}</td><td>{Math.max(0, stock - fromStock)}</td><td>—</td><td>{line.status === "waiting" ? line.quantity : 0}</td><td>{toOrder}</td><td><StatusBadge tone={delivery === "air" ? "blue" : "purple"}>{delivery}</StatusBadge></td><td>{toOrder ? "Замовити" : "Зі складу"}</td></tr>;
      })}</tbody></table></div>
      <DisabledActionButton><RefreshCcw size={14} /> Оновити розрахунок</DisabledActionButton>
    </div>
  );
}

function PreflightModal({ order, open, onClose, view, setView, delivery, setDelivery, replenishment, setReplenishment }: { order: AdminOrderFixture; open: boolean; onClose: () => void; view: PreflightView; setView: (view: PreflightView) => void; delivery: DeliveryChannel; setDelivery: (delivery: DeliveryChannel) => void; replenishment: number; setReplenishment: (value: number) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Перевірка перед підтвердженням" description={`${order.code} · замовлення ще не підтверджено`} className="!w-[min(1180px,100%)]" footer={<><button type="button" className="button button-outline" onClick={onClose}>Скасувати</button><DisabledActionButton>Підтвердити замовлення</DisabledActionButton></>}>
      <div className="grid gap-4">
        <div className="segmented w-fit"><button type="button" aria-pressed={view === "error"} onClick={() => setView("error")}>Зафіксована відповідь</button><button type="button" aria-pressed={view === "representative"} onClick={() => setView("representative")}>Структура preview</button></div>
        {view === "error" ? <div className="rounded-md border border-[var(--red)] bg-[var(--red-soft)] p-5 text-[var(--red)]"><div className="flex items-start gap-3"><AlertTriangle size={20} /><div><strong className="block">Failed to build confirm preview</strong><p className="mb-0 mt-2 text-[11px]">Це точний результат безпечного source preflight для LOG-01 і KHA-08. Статус замовлення не змінився.</p></div></div></div> : <PreviewTable order={order} delivery={delivery} replenishment={replenishment} onDelivery={setDelivery} onReplenishment={setReplenishment} />}
      </div>
    </Modal>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.detailRow}><dt>{label}</dt><dd>{children}</dd></div>;
}

function CurrentAdminOrderDetailView({model}: {model: AdminOrderDetailViewModel}) {
  const {order, lineFilter, setLineFilter, timelineOpen, toggleTimeline, chatOpen, setChatOpen, preflightOpen, setPreflightOpen, preflightView, setPreflightView, delivery, setDelivery, replenishment, setReplenishment, hasCapturedPreflight} = model;

  return (
    <main className="page page-narrow" data-admin-order-detail-renderer="current">
      <div className={styles.pageStack}>
        <nav className={styles.breadcrumb} aria-label="Навігаційний ланцюжок"><Link href="/admin/order-pipeline">Пайплайн замовлень</Link><ChevronRight size={14} /><strong>{order.code}</strong></nav>
        <InlineNotice tone="warning"><LockKeyhole size={15} /> Адміністративні дії вимкнені. Доступні лише локальні фільтри, розкриття панелей і preflight без підтвердження.</InlineNotice>

        <div className={styles.orderDetailGrid}>
          <div className={styles.stack}>
            <Panel className={styles.summaryCard}>
              <div><div><h1>{order.code}</h1><StatusBadge tone={statusTone(order.status)}>{order.statusLabel}</StatusBadge>{order.age ? <span className={`ml-2 ${styles.muted}`}>{order.age}</span> : null}</div><p><strong>{order.company}</strong> · {order.contact}</p><small className={styles.subline}>Створено {order.created}{order.confirmed ? ` · Підтверджено ${order.confirmed}` : ""}{order.cancelled ? ` · Скасовано ${order.cancelled}` : ""}</small><div className={styles.summaryMeta}>{order.po ? <StatusBadge>PO: {order.po}</StatusBadge> : null}<StatusBadge tone="blue">{order.delivery}</StatusBadge><StatusBadge tone={statusTone(order.status)}>{order.stage}</StatusBadge></div>{order.progress ? <p className={styles.sectionCopy}>{order.progress}</p> : null}</div>
              <div className={styles.summaryTotal}><strong>{formatMoney(order.total)}</strong><span>{order.activeParts} активних · {order.totalUnits} одиниць</span></div>
            </Panel>

            <OrderLines order={order} filter={lineFilter} onFilter={setLineFilter} />
            <TotalStrip order={order} />
            <DocumentsPanel order={order} />
            <ShipmentsPanel order={order} />
          </div>

          <aside className={styles.sideRail}>
            <Panel>
              <div className={styles.panelHeader}><h2 className={styles.sectionTitle}>Дії</h2><LockKeyhole size={15} className="text-[var(--muted-foreground)]" /></div>
              <div className={`${styles.railBody} ${styles.actionStack}`}>
                {hasCapturedPreflight ? <button type="button" className="button button-outline button-wide !justify-start" onClick={() => setPreflightOpen(true)}><PackageCheck size={15} /> Перевірити перед підтвердженням</button> : <DisabledActionButton className="button-wide !justify-start" reason="Перевірка перед підтвердженням недоступна для цього замовлення"><LockKeyhole size={15} /> Перевірка недоступна</DisabledActionButton>}
                <DisabledActionButton className="button-wide"><Send size={15} /> Відправити дилеру ({order.shipments.length})</DisabledActionButton>
                <DisabledActionButton className="button-wide"><Warehouse size={15} /> Перевірити старий склад</DisabledActionButton>
                <span className="text-[10px] text-[var(--muted-foreground)]">Перевірка старого складу недоступна: запит не виконується.</span>
                <DisabledActionButton className="button-wide button-danger"><Ban size={15} /> Скасувати замовлення</DisabledActionButton>
              </div>
            </Panel>

            <Panel>
              <div className={styles.panelHeader}><h2 className={styles.sectionTitle}>Інформація про замовлення</h2></div>
              <div className={styles.railBody}><dl className={styles.detailList}><DetailRow label="Замовлення №"><span className="text-[var(--blue)]">{order.code}</span></DetailRow><DetailRow label="Статус"><StatusBadge tone={statusTone(order.status)}>{order.statusLabel}</StatusBadge></DetailRow><DetailRow label="Етап">{order.stage}</DetailRow><DetailRow label="Компанія">{order.company}</DetailRow>{order.dealer ? <DetailRow label="Дилер">{order.dealer}</DetailRow> : null}<DetailRow label="Відправив">{order.contact}</DetailRow><DetailRow label="Створено">{order.created}</DetailRow>{order.confirmed ? <DetailRow label="Підтверджено">{order.confirmed}</DetailRow> : null}{order.cancelled ? <DetailRow label="Скасовано">{order.cancelled}</DetailRow> : null}<DetailRow label="PO">{order.po || "—"}</DetailRow><DetailRow label="Доставка"><StatusBadge tone="blue">{order.delivery}</StatusBadge></DetailRow></dl><p className={styles.note}><strong>Нотатки</strong><br />{order.notes || "Нотаток немає"}</p></div>
            </Panel>

            <InlineChat order={order} onExpand={() => setChatOpen(true)} />
            <TimelinePanel order={order} open={timelineOpen} onToggle={toggleTimeline} />
          </aside>
        </div>
      </div>

      <ChatModal order={order} open={chatOpen} onClose={() => setChatOpen(false)} />
      {hasCapturedPreflight ? <PreflightModal order={order} open={preflightOpen} onClose={() => setPreflightOpen(false)} view={preflightView} setView={setPreflightView} delivery={delivery} setDelivery={setDelivery} replenishment={replenishment} setReplenishment={setReplenishment} /> : null}
    </main>
  );
}

export function AdminOrderDetail({id}: {id: string}) {
  const {state} = useDemoStore();
  const [lineFilter, setLineFilter] = useState<LineFilter>("all");
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [preflightView, setPreflightView] = useState<PreflightView>("error");
  const [delivery, setDelivery] = useState<DeliveryChannel>("air");
  const [replenishment, setReplenishment] = useState(0);
  const order = useMemo(() => resolveOrder(id, state.orders), [id, state.orders]);

  if (!order) {
    return <RendererViewSwitch
      slotId="admin-order-detail"
      currentView={<main className="page page-narrow" data-admin-order-detail-renderer="current"><Panel className={styles.panelBody}><h1 className={styles.sectionTitle}>Замовлення не знайдено</h1><p className={styles.sectionCopy}>Немає зафіксованого замовлення або рядка пайплайна з таким id.</p><Link href="/admin/order-pipeline" className="button button-outline mt-4">До пайплайна</Link></Panel></main>}
      loadAstryxView={loadAstryxAdminOrderDetailView}
      astryxViewProps={{model: null}}
    />;
  }

  const model: AdminOrderDetailViewModel = {
    order,
    lineFilter,
    setLineFilter,
    timelineOpen,
    toggleTimeline: () => setTimelineOpen((value) => !value),
    chatOpen,
    setChatOpen,
    preflightOpen: preflightOpen && order.status === "new" && (order.code === "LOG-01" || order.code === "KHA-08"),
    setPreflightOpen,
    preflightView,
    setPreflightView,
    delivery,
    setDelivery,
    replenishment,
    setReplenishment: (value) => setReplenishment(Math.max(0, value)),
    hasCapturedPreflight: order.status === "new" && (order.code === "LOG-01" || order.code === "KHA-08"),
  };

  return <RendererViewSwitch
    slotId="admin-order-detail"
    currentView={<CurrentAdminOrderDetailView model={model} />}
    loadAstryxView={loadAstryxAdminOrderDetailView}
    astryxViewProps={{model}}
  />;
}
