"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Box,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileText,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  ShoppingCart,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/shared/ui";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import { formatDate, OrderStatusBadge } from "./common";
import styles from "./dealer.module.css";

const shortcuts = [
  { href: "/catalog", label: "Каталог", helper: "Пошук і підбір запчастин", icon: BookOpen },
  { href: "/dealer/orders", label: "Замовлення", helper: "Історія і статуси замовлень", icon: ClipboardList },
  { href: "/dealer/order-drafts", label: "Чернетки", helper: "Незавершені замовлення", icon: FileClock },
  { href: "/dealer/documents", label: "Документи", helper: "Рахунки і накладні", icon: FileText },
  { href: "/dealer/consignment", label: "Консигнація", helper: "Запаси у дилерській мережі", icon: PackageOpen },
  { href: "/dealer/settlements", label: "Взаєморозрахунки", helper: "Рух коштів і баланс", icon: WalletCards },
  { href: "/dealer/customers", label: "Клієнти", helper: "Картки клієнтів і техніка", icon: Users },
  { href: "/dealer/workshop", label: "Майстерня", helper: "Сервісні роботи", icon: Wrench },
  { href: "/dealer/schedule", label: "Графік поставки", helper: "Майбутні слоти і залишки", icon: CalendarDays },
];

export function DealerDashboard() {
  const { state } = useDemoStore();
  const processing = state.orders.filter((order) => !["done", "cancelled"].includes(order.status));
  const completed = state.orders.filter((order) => order.status === "done");
  const totalSpend = state.orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + orderTotal(order.lines), 0);
  const now = new Date();
  const monthSpend = state.orders
    .filter((order) => {
      const created = new Date(order.createdAt);
      return order.status !== "cancelled"
        && created.getMonth() === now.getMonth()
        && created.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + orderTotal(order.lines), 0);

  return (
    <main className="page page-narrow">
      <PageHeader
        icon={<Box size={21} />}
        title="Головна"
        description="Короткий робочий огляд для Logos."
        action={(
          <Link href="/catalog" className="button button-primary">
            <Plus size={16} /> Нове замовлення
          </Link>
        )}
      />

      <section className={styles.statsGrid} aria-label="Показники замовлень">
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Усього замовлень"
          value={state.orders.length}
          helper={state.orders.length ? "За весь час" : "Немає відкритих замовлень"}
        />
        <StatCard
          icon={<PackageCheck size={18} />}
          label="У роботі"
          value={processing.length}
          helper={processing.length ? "Очікують виконання" : "Немає активних відвантажень"}
          tone="blue"
        />
        <StatCard
          icon={<WalletCards size={18} />}
          label="Витрати за місяць"
          value={formatMoney(monthSpend)}
          helper="Поточний календарний місяць"
          tone="orange"
        />
        <StatCard
          icon={<Package size={18} />}
          label="Загальні витрати"
          value={formatMoney(totalSpend)}
          helper="Без скасованих замовлень"
        />
      </section>

      <section className={styles.dashboardColumns}>
        <Panel className={styles.dashboardPanel}>
          <header className={styles.panelHeader}>
            <h2>Останні замовлення</h2>
            <Link href="/dealer/orders" className="button button-outline">
              Переглянути все <ArrowRight size={15} />
            </Link>
          </header>
          {state.orders.length ? (
            <div className={styles.recentOrders}>
              {state.orders.slice(0, 5).map((order) => (
                <Link href={dealerOrderHref(order.id)} className={styles.recentOrder} key={order.id}>
                  <span className={styles.orderIcon}><Package size={17} /></span>
                  <span className={styles.recentMain}>
                    <strong>{order.code}</strong>
                    <small>{formatDate(order.createdAt)} · {order.lines.length} позицій</small>
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <strong className={styles.amount}>{formatMoney(orderTotal(order.lines))}</strong>
                  <ArrowRight size={15} className={styles.rowArrow} />
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.dashboardEmpty}>
              <span><PackageOpen size={29} /></span>
              <h3>Замовлень поки немає</h3>
              <p>Оформіть перше замовлення, і воно з&apos;явиться тут.</p>
              <Link href="/catalog" className="button button-outline"><ShoppingCart size={15} /> Перейти до каталогу</Link>
            </div>
          )}
        </Panel>

        <Panel className={styles.dashboardPanel}>
          <header className={styles.panelHeader}><h2>Потребує уваги</h2></header>
          <div className={styles.attentionList}>
            {processing.length ? (
              processing.slice(0, 4).map((order) => (
                <Link href={dealerOrderHref(order.id)} key={order.id} className={styles.attentionItem}>
                  <span className={styles.attentionDot} />
                  <span><strong>{order.code}</strong><small>{order.stage}</small></span>
                  <ArrowRight size={14} />
                </Link>
              ))
            ) : (
              <div className={styles.allGood}>
                <CheckCircle2 size={20} />
                <div><strong>Все спокійно</strong><p>Немає термінових дій за доступними розділами.</p></div>
              </div>
            )}
          </div>
        </Panel>
      </section>

      <Panel className={styles.shortcutsPanel}>
        <header className={styles.panelHeader}><h2>Доступні розділи</h2></header>
        <div className={styles.shortcutGrid}>
          {shortcuts.map(({ href, label, helper, icon: Icon }) => (
            <Link href={href} className={styles.shortcut} key={href}>
              <span><Icon size={18} /></span>
              <div><strong>{label}</strong><small>{helper}</small></div>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </Panel>

      <section className={styles.summaryGrid} aria-label="Додаткові показники">
        <Panel className={styles.summaryCard}><span><PackageCheck size={17} /></span><div><small>Виконано</small><strong>{completed.length}</strong></div></Panel>
        <Panel className={styles.summaryCard}><span><Users size={17} /></span><div><small>Клієнтів</small><strong>{state.customers.length}</strong></div></Panel>
        <Panel className={styles.summaryCard}><span><Wrench size={17} /></span><div><small>Робіт у майстерні</small><strong>{state.workshopOrders.length}</strong></div></Panel>
        <Panel className={styles.summaryCard}><span><PackageOpen size={17} /></span><div><small>Позицій у кошику</small><strong>{state.cart.reduce((sum, line) => sum + line.quantity, 0)}</strong></div></Panel>
      </section>
    </main>
  );
}
