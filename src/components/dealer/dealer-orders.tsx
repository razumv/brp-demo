"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileText,
  LayoutGrid,
  List,
  MessageSquare,
  Package,
  Paperclip,
  Save,
  Search,
  Send,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import type { OrderLine, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, OrderStatusBadge, SectionHeading } from "./common";
import styles from "./dealer.module.css";

type Layout = "list" | "kanban";

const filterStatuses: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "Усі" },
  { value: "new", label: "Нові" },
  { value: "waiting", label: "Очікування" },
  { value: "supplier", label: "У постачальника" },
  { value: "ready", label: "Готові" },
  { value: "sent", label: "Відправлені" },
  { value: "done", label: "Виконані" },
  { value: "cancelled", label: "Скасовані" },
];

export function DealerOrdersPage() {
  const { state } = useDemoStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [layout, setLayout] = useState<Layout>("list");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.orders.filter((order) => {
      const customer = state.customers.find((item) => item.id === order.customerId);
      const haystack = [
        order.code,
        order.company,
        order.creator,
        order.po,
        customer?.name || "",
        ...order.lines.flatMap((line) => [line.partNumber, line.description]),
      ].join(" ").toLowerCase();
      return (status === "all" || order.status === status) && (!normalized || haystack.includes(normalized));
    });
  }, [query, state.customers, state.orders, status]);

  const counts = useMemo(() => Object.fromEntries(filterStatuses.map((item) => [
    item.value,
    item.value === "all" ? state.orders.length : state.orders.filter((order) => order.status === item.value).length,
  ])) as Record<"all" | OrderStatus, number>, [state.orders]);

  return (
    <main className="page page-narrow">
      <PageHeader
        icon={<ShoppingBag size={21} />}
        title="Мої замовлення"
        description="Історія, поточні статуси та повідомлення по замовленнях."
        action={<Link href="/catalog" className="button button-primary">Нове замовлення</Link>}
      />

      <section className={styles.orderStats} aria-label="Статуси замовлень">
        {filterStatuses.slice(0, 5).map((item) => (
          <button
            type="button"
            key={item.value}
            className={cn(styles.orderStatButton, status === item.value && styles.orderStatButtonActive)}
            onClick={() => setStatus(item.value)}
          >
            <span>{item.label}</span>
            <strong>{counts[item.value]}</strong>
          </button>
        ))}
      </section>

      <Panel className={styles.ordersPanel}>
        <div className={styles.ordersToolbar}>
          <div className="toolbar-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук за номером, клієнтом, PO або запчастиною..."
              aria-label="Пошук замовлень"
            />
          </div>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)} aria-label="Статус">
            {filterStatuses.map((item) => <option value={item.value} key={item.value}>{item.label} ({counts[item.value]})</option>)}
          </select>
          <div className="segmented" aria-label="Вигляд замовлень">
            <button type="button" aria-pressed={layout === "list"} onClick={() => setLayout("list")}><List size={14} /> Список</button>
            <button type="button" aria-pressed={layout === "kanban"} onClick={() => setLayout("kanban")}><LayoutGrid size={14} /> Канбан</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={27} />}
            title={state.orders.length ? "Нічого не знайдено" : "Замовлень поки немає"}
            description={state.orders.length ? "Змініть пошуковий запит або фільтр статусу." : "Додайте запчастини з каталогу та оформіть перше замовлення."}
            action={<Link href="/catalog" className="button button-outline">Перейти до каталогу</Link>}
          />
        ) : layout === "list" ? (
          <div className={styles.orderList}>
            {filtered.map((order) => {
              const customer = state.customers.find((item) => item.id === order.customerId);
              return (
                <Link href={dealerOrderHref(order.id)} className={styles.orderRow} key={order.id}>
                  <span className={styles.orderIcon}><Package size={18} /></span>
                  <span className={styles.orderIdentity}><strong>{order.code}</strong><small>{customer?.name || order.company}</small></span>
                  <span className={styles.orderMeta}><small>Створив</small><strong>{order.creator}</strong></span>
                  <span className={styles.orderMeta}><small>Дата</small><strong>{formatDate(order.createdAt)}</strong></span>
                  <span className={styles.orderMeta}><small>Позицій</small><strong>{order.lines.length}</strong></span>
                  <span className={styles.orderStatus}><OrderStatusBadge status={order.status} /><small>{order.stage}</small></span>
                  <strong className={styles.amount}>{formatMoney(orderTotal(order.lines))}</strong>
                  <ChevronRight size={17} className={styles.rowArrow} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.kanbanBoard}>
            {filterStatuses.filter((item) => item.value !== "all" && counts[item.value] > 0).map((column) => (
              <section className={styles.kanbanColumn} key={column.value}>
                <header><span>{column.label}</span><strong>{counts[column.value]}</strong></header>
                {filtered.filter((order) => order.status === column.value).map((order) => (
                  <Link href={dealerOrderHref(order.id)} className={styles.kanbanCard} key={order.id}>
                    <div><strong>{order.code}</strong><OrderStatusBadge status={order.status} /></div>
                    <p>{state.customers.find((item) => item.id === order.customerId)?.name || order.company}</p>
                    <footer><span>{order.lines.length} позицій</span><strong>{formatMoney(orderTotal(order.lines))}</strong></footer>
                  </Link>
                ))}
              </section>
            ))}
          </div>
        )}
      </Panel>
    </main>
  );
}

function PrivateLineNote({ orderId, line }: { orderId: string; line: OrderLine }) {
  const { setLineNote } = useDemoStore();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(line.privateNote || "");

  return (
    <div className={styles.lineNote}>
      {editing ? (
        <>
          <input value={note} onChange={(event) => setNote(event.target.value)} aria-label={`Приватна нотатка ${line.partNumber}`} placeholder="Приватна нотатка..." />
          <button type="button" className="button button-outline" onClick={() => {
            setLineNote(orderId, line.partNumber, note.trim());
            setEditing(false);
          }}><Save size={13} /> Зберегти</button>
        </>
      ) : (
        <button type="button" className={styles.noteButton} onClick={() => setEditing(true)}>
          <FileText size={12} /> {line.privateNote || "Моя нотатка"}
        </button>
      )}
    </div>
  );
}

export function DealerOrderDetail({ id }: { id: string }) {
  const { state, addOrderMessage } = useDemoStore();
  const order = state.orders.find((item) => item.id === id);
  const [message, setMessage] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [lineTimelineOpen, setLineTimelineOpen] = useState(true);

  if (!order) {
    return (
      <main className="page page-narrow">
        <EmptyState title="Замовлення не знайдено" description="Можливо, локальні демо-дані були скинуті." action={<Link href="/dealer/orders" className="button button-outline">До замовлень</Link>} />
      </main>
    );
  }

  const customer = state.customers.find((item) => item.id === order.customerId);
  const total = orderTotal(order.lines);

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = message.trim();
    if (!body && !attachmentName) return;
    addOrderMessage(order.id, [body, attachmentName ? `📎 ${attachmentName}` : ""].filter(Boolean).join("\n"));
    setMessage("");
    setAttachmentName("");
  };

  return (
    <main className="page page-narrow">
      <nav className={styles.breadcrumbs} aria-label="Навігація">
        <Link href="/dealer/orders"><ArrowLeft size={14} /> Мої замовлення</Link>
        <ChevronRight size={14} />
        <span>{order.code}</span>
      </nav>

      <div className={styles.orderDetailGrid}>
        <div className={styles.orderDetailMain}>
          <Panel className={styles.orderSummary}>
            <div className={styles.orderSummaryTop}>
              <div>
                <div className={styles.orderTitleRow}>
                  <h1>{order.code}</h1>
                  <OrderStatusBadge status={order.status} />
                  <span className={styles.liveDot} title="Локальні дані оновлено" />
                </div>
                <p>Створено {formatDate(order.createdAt)} · {order.creator} · {customer?.name || order.company}</p>
                <div className={styles.chipRow}>
                  {order.po ? <span className={styles.codeChip}>PO: {order.po}</span> : null}
                  <StatusBadge tone="blue"><Truck size={11} /> {order.delivery === "standard" ? "Доставка" : "Самовивіз"}</StatusBadge>
                  <StatusBadge tone="neutral"><CircleDot size={10} /> {order.stage}</StatusBadge>
                </div>
              </div>
              <div className={styles.orderGrandTotal}><span>{order.lines.length} запчастин</span><strong>{formatMoney(total)}</strong></div>
            </div>
          </Panel>

          <Panel className={styles.linesPanel}>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Артикул</th><th>Опис</th><th>Джерело / статус</th><th>К-сть</th><th>Ціна</th><th>Сума</th></tr></thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.partNumber}>
                      <td><span className={styles.mono}>{line.partNumber}</span></td>
                      <td>
                        <strong>{line.description}</strong>
                        <PrivateLineNote orderId={order.id} line={line} />
                      </td>
                      <td><span className={styles.sourceLabel}>{line.source === "warehouse" ? "Склад" : line.source}</span><StatusBadge tone="neutral">Очікування</StatusBadge></td>
                      <td>{line.quantity}</td>
                      <td>{formatMoney(line.dealerPrice)}</td>
                      <td><strong>{formatMoney(line.quantity * line.dealerPrice)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={3}><strong>РАЗОМ</strong></td><td><strong>{order.lines.reduce((sum, line) => sum + line.quantity, 0)}</strong><small> позицій</small></td><td>—</td><td><strong>{formatMoney(total)}</strong></td></tr></tfoot>
              </table>
            </div>
          </Panel>
        </div>

        <aside className={styles.orderDetailRail}>
          <Panel className={styles.infoPanel}>
            <SectionHeading title="Інформація про замовлення" />
            <dl className={styles.infoList}>
              <div><dt>Замовлення №</dt><dd>{order.code}</dd></div>
              <div><dt>Статус</dt><dd><OrderStatusBadge status={order.status} /></dd></div>
              <div><dt>Створено</dt><dd>{formatDate(order.createdAt)}</dd></div>
              <div><dt>Покупець</dt><dd>{customer?.name || "—"}</dd></div>
              <div><dt>PO</dt><dd>{order.po || "—"}</dd></div>
              <div><dt>Доставка</dt><dd>{order.delivery === "standard" ? "Доставка" : "Самовивіз"}</dd></div>
            </dl>
            {order.note ? <div className={styles.orderNote}><span>Нотатки</span><p>{order.note}</p></div> : null}
          </Panel>

          <Panel className={styles.chatPanel}>
            <SectionHeading title="Чат" helper={`${order.messages.length} повідомлень`} />
            <div className={styles.messages} aria-live="polite">
              {order.messages.length ? order.messages.map((item) => (
                <article className={cn(styles.message, item.role === "dealer" && styles.messageOwn)} key={item.id}>
                  <header><strong>{item.author}</strong>{item.demo ? <StatusBadge tone="orange">Demo</StatusBadge> : null}</header>
                  <p>{item.body}</p>
                  <time>{formatDateTime(item.createdAt)}</time>
                </article>
              )) : (
                <div className={styles.chatEmpty}><MessageSquare size={24} /><strong>Повідомлень поки немає</strong><span>Розпочніть спілкування</span></div>
              )}
            </div>
            <form className={styles.chatComposer} onSubmit={sendMessage}>
              {attachmentName ? <span className={styles.attachmentPreview}><Paperclip size={12} /> {attachmentName}<button type="button" onClick={() => setAttachmentName("")}>×</button></span> : null}
              <div>
                <label className={styles.attachButton} aria-label="Додати файл">
                  <Paperclip size={16} />
                  <input type="file" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || "")} />
                </label>
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Введіть повідомлення..." aria-label="Повідомлення" />
                <button type="submit" aria-label="Надіслати"><Send size={16} /></button>
              </div>
            </form>
          </Panel>

          <Panel className={styles.timelinePanel}>
            <button type="button" className={styles.accordionButton} aria-expanded={timelineOpen} onClick={() => setTimelineOpen(!timelineOpen)}>
              <ChevronDown size={15} /> Хронологія <span>{order.timeline.length}</span>
            </button>
            {timelineOpen ? <ol className={styles.timeline}>{order.timeline.map((event) => <li key={event.id}><i /><div><strong>{event.label}</strong><p>{event.detail}</p><time>{formatDateTime(event.createdAt)}</time></div></li>)}</ol> : null}
          </Panel>

          <Panel className={styles.timelinePanel}>
            <button type="button" className={styles.accordionButton} aria-expanded={lineTimelineOpen} onClick={() => setLineTimelineOpen(!lineTimelineOpen)}>
              <ChevronDown size={15} /> Хронологія позицій <span>{order.lines.length}</span>
            </button>
            {lineTimelineOpen ? <div className={styles.lineEvents}>{order.lines.map((line) => <div key={line.partNumber}><Boxes size={14} /><span><strong>{line.partNumber}</strong><small>{line.description} · очікує постачання</small></span></div>)}</div> : null}
          </Panel>

          <Panel className={styles.shipmentPanel}>
            <SectionHeading title="Відправки дилеру" helper="Поки немає відправок" />
            <div><Truck size={21} /><span>Відправка з&apos;явиться після комплектації.</span></div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
