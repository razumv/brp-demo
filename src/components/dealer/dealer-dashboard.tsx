"use client";

import Link from "next/link";
import type {ReactNode} from "react";
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
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { PageHeader } from "@/components/shared/ui";
import {BrpCard} from "@/components/brp-ui";
import {useAppearance} from "@/components/appearance/use-appearance";
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

function DealerStatCard({icon, label, value, helper, tone = "default"}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  helper: string;
  tone?: "default" | "info" | "warning";
}) {
  return (
    <div className="stat-card">
      <BrpCard tone={tone} padding="none">
        <div className="stat-icon">{icon}</div>
        <div className="min-w-0">
          <p className="stat-label">{label}</p>
          <div className="stat-value">{value}</div>
          <div className="stat-helper">{helper}</div>
        </div>
      </BrpCard>
    </div>
  );
}

export function DealerDashboard() {
  const {renderedDesignSystem} = useAppearance();
  const { snapshot } = useDealerWorkflow();
  const processing = snapshot.orders.filter((order) => !["done", "cancelled"].includes(order.status));
  const completed = snapshot.orders.filter((order) => order.status === "done");
  const totalSpend = snapshot.orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + orderTotal(order.lines), 0);
  const now = new Date();
  const monthSpend = snapshot.orders
    .filter((order) => {
      const created = new Date(order.createdAt);
      return order.status !== "cancelled"
        && created.getMonth() === now.getMonth()
        && created.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + orderTotal(order.lines), 0);

  return (
    <main className="page page-narrow" data-dealer-dashboard-renderer={renderedDesignSystem}>
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

      <section className={styles.workspaceSurface} data-dealer-workspace-surface={renderedDesignSystem}>
        <section className={styles.statsGrid} aria-label="Показники замовлень">
          <DealerStatCard
            icon={<ClipboardList size={18} />}
            label="Усього замовлень"
            value={snapshot.orders.length}
            helper={snapshot.orders.length ? "За весь час" : "Немає відкритих замовлень"}
          />
          <DealerStatCard
            icon={<PackageCheck size={18} />}
            label="У роботі"
            value={processing.length}
            helper={processing.length ? "Очікують виконання" : "Немає активних відвантажень"}
            tone="info"
          />
          <DealerStatCard
            icon={<WalletCards size={18} />}
            label="Витрати за місяць"
            value={formatMoney(monthSpend)}
            helper="Поточний календарний місяць"
            tone="warning"
          />
          <DealerStatCard
            icon={<Package size={18} />}
            label="Загальні витрати"
            value={formatMoney(totalSpend)}
            helper="Без скасованих замовлень"
          />
        </section>

        <section className={styles.dashboardColumns}>
          <div className={styles.dashboardPanel}><BrpCard padding="none">
          <header className={styles.panelHeader}>
            <h2>Останні замовлення</h2>
            <Link href="/dealer/orders" className="button button-outline">
              Переглянути все <ArrowRight size={15} />
            </Link>
          </header>
          {snapshot.orders.length ? (
            <div className={styles.recentOrders}>
              {snapshot.orders.slice(0, 5).map((order) => (
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
          </BrpCard></div>

          <div className={styles.dashboardPanel}><BrpCard padding="none">
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
          </BrpCard></div>
        </section>

        <div className={styles.shortcutsPanel}><BrpCard padding="none">
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
        </BrpCard></div>

        <section className={styles.summaryGrid} aria-label="Додаткові показники">
          <div className={styles.summaryCard}><BrpCard padding="none"><span><PackageCheck size={17} /></span><div><small>Виконано</small><strong>{completed.length}</strong></div></BrpCard></div>
          <div className={styles.summaryCard}><BrpCard padding="none"><span><Users size={17} /></span><div><small>Клієнтів</small><strong>{snapshot.customers.length}</strong></div></BrpCard></div>
          <div className={styles.summaryCard}><BrpCard padding="none"><span><Wrench size={17} /></span><div><small>Робіт у майстерні</small><strong>{snapshot.workshopOrders.length}</strong></div></BrpCard></div>
          <div className={styles.summaryCard}><BrpCard padding="none"><span><PackageOpen size={17} /></span><div><small>Позицій у кошику</small><strong>{snapshot.cart.reduce((sum, line) => sum + line.quantity, 0)}</strong></div></BrpCard></div>
        </section>
      </section>
    </main>
  );
}
