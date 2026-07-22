"use client";

import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { adminSampleOrders, formatMoney, orderTotal } from "@/lib/mock-data";
import { adminOrderHref } from "@/lib/order-route-hrefs";
import type {
  AdminOverviewMetricIcon,
  AdminOverviewModel,
  AdminOverviewTone,
} from "./admin-overview.types";
import styles from "./admin.module.css";

const loadAstryxAdminOverviewView = () => import("./astryx-admin-overview-view");

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

function metricIcon(icon: AdminOverviewMetricIcon) {
  if (icon === "revenue") return <CircleDollarSign size={18} />;
  if (icon === "orders") return <ShoppingCart size={18} />;
  if (icon === "processing") return <Clock3 size={18} />;
  return <CheckCircle2 size={18} />;
}

function statusTone(status: AdminOverviewModel["recentOrders"][number]["status"]): AdminOverviewTone {
  if (status === "new") return "orange";
  if (status === "done") return "green";
  if (status === "cancelled") return "red";
  return "amber";
}

function metricTone(tone: AdminOverviewTone): "amber" | "blue" | "green" | "neutral" | "orange" {
  return tone === "red" ? "orange" : tone;
}

function toOverviewStatus(status: string): AdminOverviewModel["recentOrders"][number]["status"] {
  if (status === "done" || status === "cancelled" || status === "new") return status;
  return "waiting";
}

function statusLabel(status: AdminOverviewModel["recentOrders"][number]["status"]) {
  if (status === "new") return "Новий";
  if (status === "done") return "Готово";
  if (status === "cancelled") return "Скасовано";
  return "Очікування";
}

function CurrentAdminOverviewView({model}: {model: AdminOverviewModel}) {
  return (
    <main className="page page-narrow" data-admin-overview-renderer="current">
      <div className={styles.pageStack}>
        <PageHeader
          admin
          title="Огляд панелі"
          description="Ласкаво просимо до панелі адміністратора. Ось зведення по системі."
        />

        <section className={styles.statGrid} aria-label="Ключові показники">
          {model.metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              icon={metricIcon(metric.icon)}
              tone={metricTone(metric.tone)}
            />
          ))}
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
                {model.queue.map((item) => (
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
              {model.distribution.map((item) => (
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
              <p className={styles.sectionCopy}>Локальні замовлення показуються першими.</p>
            </div>
            <Link href="/admin/order-pipeline" className="button button-outline">Відкрити пайплайн</Link>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.recentList}>
              {model.recentOrders.map((order) => (
                <Link key={`${order.id}-${order.code}`} href={order.href} className={styles.recentOrder}>
                  <span className={styles.code}>{order.code}</span>
                  <span><strong>{order.dealer}</strong><small className={styles.subline}>{order.contact}</small></span>
                  <span className={styles.muted}>{order.date}</span>
                  <strong>{formatMoney(order.amount)}</strong>
                  <StatusBadge tone={statusTone(order.status)}>{statusLabel(order.status)}</StatusBadge>
                </Link>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}

export function AdminOverview() {
  const { state } = useDemoStore();

  const localRevenue = state.orders.reduce((total, order) => total + orderTotal(order.lines), 0);
  const openLocal = state.orders.filter((order) => !["done", "cancelled"].includes(order.status)).length;
  const doneLocal = state.orders.filter((order) => order.status === "done").length;
  const revenue = 42_914.61 + localRevenue;
  const orderCount = 123 + state.orders.length;

  const recentOrders: AdminOverviewModel["recentOrders"] = [
    ...state.orders.slice(0, 2).map((order) => ({
      id: order.id,
      code: order.code,
      dealer: order.company,
      contact: order.creator,
      date: new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(order.createdAt)),
      amount: orderTotal(order.lines),
      status: toOverviewStatus(order.status),
      href: adminOrderHref(order.id),
    })),
    ...adminSampleOrders.map((order) => ({
      id: order.code,
      code: order.code,
      dealer: order.dealer,
      contact: order.contact,
      date: order.date,
      amount: order.amount,
      status: toOverviewStatus(order.status),
      href: adminOrderHref(order.code),
    })),
  ].slice(0, 5);

  const model: AdminOverviewModel = {
    metrics: [
      {label: "Загальна виручка", value: formatMoney(revenue), helper: "Включно з локальними замовленнями", icon: "revenue", tone: "green"},
      {label: "Усього замовлень", value: orderCount, helper: `Локальні замовлення: ${state.orders.length}`, icon: "orders", tone: "blue"},
      {label: "В обробці", value: 19 + openLocal, helper: "Замовлення в активних статусах", icon: "processing", tone: "amber"},
      {label: "Доставлено", value: 74 + doneLocal, helper: "Завершені замовлення", icon: "delivered", tone: "green"},
    ],
    queue: queueStates,
    distribution,
    recentOrders,
  };

  return <RendererViewSwitch
    slotId="admin-overview"
    currentView={<CurrentAdminOverviewView model={model} />}
    loadAstryxView={loadAstryxAdminOverviewView}
    astryxViewProps={{model}}
  />;
}
