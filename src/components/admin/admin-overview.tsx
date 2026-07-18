"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { adminNav } from "@/components/shell/nav-data";
import { adminSampleOrders, formatMoney, orderTotal } from "@/lib/mock-data";
import { adminOrderHref } from "@/lib/order-route-hrefs";
import styles from "./admin.module.css";

const queueStates = [
  { label: "Воркери", value: 1, tone: "green" as const },
  { label: "Активні", value: 0, tone: "neutral" as const },
  { label: "В очікуванні", value: 0, tone: "neutral" as const },
  { label: "Виконано", value: 0, tone: "green" as const },
  { label: "Помилки", value: 0, tone: "neutral" as const },
];

const distribution = [
  { label: "Склад Київ", value: 72, count: 1_246 },
  { label: "BossWeb", value: 19, count: 329 },
  { label: "Очікує поставки", value: 9, count: 155 },
];

export function AdminOverview() {
  const { state } = useDemoStore();
  const [query, setQuery] = useState("");

  const shortcuts = useMemo(() => adminNav.flatMap((group) => group.items.map((item) => ({
    ...item,
    group: group.label || "Огляд",
  }))), []);

  const visibleShortcuts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk");
    if (!normalized) return shortcuts;
    return shortcuts.filter((item) => `${item.label} ${item.group}`.toLocaleLowerCase("uk").includes(normalized));
  }, [query, shortcuts]);

  const localRevenue = state.orders.reduce((total, order) => total + orderTotal(order.lines), 0);
  const openLocal = state.orders.filter((order) => !["done", "cancelled"].includes(order.status)).length;
  const doneLocal = state.orders.filter((order) => order.status === "done").length;
  const revenue = 42_914.61 + localRevenue;
  const orderCount = 123 + state.orders.length;

  const recentOrders = [
    ...state.orders.slice(0, 2).map((order) => ({
      id: order.id,
      code: order.code,
      dealer: order.company,
      contact: order.creator,
      date: new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(order.createdAt)),
      amount: orderTotal(order.lines),
      status: order.status,
    })),
    ...adminSampleOrders.map((order) => ({
      id: order.code,
      code: order.code,
      dealer: order.dealer,
      contact: order.contact,
      date: order.date,
      amount: order.amount,
      status: order.status,
    })),
  ].slice(0, 5);

  return (
    <main className="page page-narrow">
      <div className={styles.pageStack}>
        <PageHeader
          admin
          title="Огляд панелі"
          description="Ласкаво просимо до панелі адміністратора. Ось зведення по системі."
        />

        <Panel className={styles.shortcutPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Робочі переходи</h2>
              <p className={styles.sectionCopy}>Знайдіть або відкрийте потрібний розділ адмінки без зайвого скролу.</p>
            </div>
            <div className={`toolbar-search ${styles.shortcutSearch}`}>
              <Search size={15} />
              <input
                aria-label="Пошук розділів адмінки"
                placeholder="Пошук розділів адмінки"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.shortcutGrid}>
            {visibleShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={styles.shortcut}>
                  <span className={styles.shortcutIcon}><Icon size={17} strokeWidth={1.7} /></span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.group}</small>
                  </span>
                </Link>
              );
            })}
            {visibleShortcuts.length === 0 ? <div className={styles.noShortcuts}>Розділів не знайдено</div> : null}
          </div>
        </Panel>

        <section className={styles.statGrid} aria-label="Ключові показники">
          <StatCard label="Загальна виручка" value={formatMoney(revenue)} helper="Включно з локальними демо-замовленнями" icon={<CircleDollarSign size={18} />} tone="green" />
          <StatCard label="Усього замовлень" value={orderCount} helper={`${state.orders.length} локальне демо`} icon={<ShoppingCart size={18} />} tone="blue" />
          <StatCard label="В обробці" value={19 + openLocal} helper="Замовлення в активних статусах" icon={<Clock3 size={18} />} tone="amber" />
          <StatCard label="Доставлено" value={74 + doneLocal} helper="Завершені замовлення" icon={<CheckCircle2 size={18} />} tone="green" />
        </section>

        <section className={styles.overviewGrid}>
          <Panel>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Стан черги</h2>
                <p className={styles.sectionCopy}>Фонові завдання та воркери імпорту.</p>
              </div>
              <StatusBadge tone="green">Система доступна</StatusBadge>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.queueChips}>
                {queueStates.map((item) => (
                  <span key={item.label} className={styles.queueChip}>
                    <StatusBadge tone={item.tone}>{item.label}: {item.value}</StatusBadge>
                  </span>
                ))}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-orange-600">
                <Boxes size={15} /> Керування задачами доступне лише для перегляду
              </div>
            </div>
          </Panel>

          <Panel>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Розподіл залишків</h2>
                <p className={styles.sectionCopy}>Поточне джерело доступності позицій.</p>
              </div>
              <PackageSearch size={18} className="text-orange-600" />
            </div>
            <div className={`${styles.panelBody} ${styles.redistribution}`}>
              {distribution.map((item) => (
                <div key={item.label} className={styles.progressRow}>
                  <span>{item.label}</span>
                  <span className={styles.progressTrack}><span /></span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Останні замовлення</h2>
              <p className={styles.sectionCopy}>Локальні демо-замовлення показуються першими.</p>
            </div>
            <Link href="/admin/order-pipeline" className="button button-outline">Відкрити пайплайн</Link>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.recentList}>
              {recentOrders.map((order) => (
                <Link key={`${order.id}-${order.code}`} href={adminOrderHref(order.id)} className={styles.recentOrder}>
                  <span className={styles.code}>{order.code}</span>
                  <span><strong>{order.dealer}</strong><small className={styles.subline}>{order.contact}</small></span>
                  <span className={styles.muted}>{order.date}</span>
                  <strong>{formatMoney(order.amount)}</strong>
                  <StatusBadge tone={order.status === "new" ? "orange" : order.status === "done" ? "green" : order.status === "cancelled" ? "red" : "amber"}>
                    {order.status === "new" ? "Новий" : order.status === "done" ? "Готово" : order.status === "cancelled" ? "Скасовано" : "Очікування"}
                  </StatusBadge>
                </Link>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
