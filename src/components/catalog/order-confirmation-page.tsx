"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  PackageCheck,
  Plane,
  ShoppingCart,
} from "lucide-react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { EmptyState, Panel, StatusBadge } from "@/components/shared/ui";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import styles from "@/components/catalog/catalog.module.css";

export function OrderConfirmationPage({ id }: { id: string }) {
  const { state, hydrated } = useDemoStore();
  const order = state.orders.find((item) => item.id === id);

  if (!hydrated) {
    return (
      <div className={`page page-narrow ${styles.confirmationPage}`}>
        <Panel className={styles.confirmationLoading}>Завантаження замовлення…</Panel>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`page page-narrow ${styles.confirmationPage}`}>
        <Panel>
          <EmptyState
            title="Замовлення не знайдено"
            description="Локальний запис міг бути очищений або створений в іншому браузері."
            action={<Link className="button button-primary" href="/catalog">Повернутися до каталогу</Link>}
          />
        </Panel>
      </div>
    );
  }

  const total = orderTotal(order.lines);
  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className={`page page-narrow ${styles.confirmationPage}`}>
      <section className={styles.confirmationHero}>
        <span><CheckCircle2 size={32} /></span>
        <h1>Замовлення оформлено</h1>
        <p>Ваше замовлення надіслано та очікує підтвердження</p>
      </section>

      <div className={styles.confirmationContent}>
        <Panel className={styles.receiptCard}>
          <div className={styles.receiptTop}>
            <div><span>Номер замовлення</span><strong>{order.code}</strong><button type="button" aria-label="Скопіювати номер замовлення" onClick={() => navigator.clipboard?.writeText(order.code)}><Copy size={14} /></button></div>
            <div><span>Разом</span><strong>{formatMoney(total)}</strong></div>
          </div>
          <div className={styles.receiptMeta}>
            <span>{order.lines.length} запчастин / {units} одиниць</span>
            {order.po ? <code>PO: {order.po}</code> : null}
            <StatusBadge tone="blue">{order.delivery === "standard" ? "Доставка" : "Самовивіз"}</StatusBadge>
          </div>
        </Panel>

        <Panel className={styles.nextSteps}>
          <h2>Що далі</h2>
          <ol>
            <li><span className={styles.stepActive}><Clock3 size={17} /></span><div><strong>Перевірка менеджером</strong><small>Наша команда перевірить та підтвердить ваше замовлення</small></div></li>
            <li><span><PackageCheck size={17} /></span><div><strong>Розподіл запчастин</strong><small>{units} зі складу</small></div></li>
            <li><span><Plane size={17} /></span><div><strong>Відправка</strong><small>{order.delivery === "standard" ? "Відправлення після комплектації" : "Підготовка до самовивозу"}</small></div></li>
          </ol>
        </Panel>

        <Panel className={styles.confirmationLines}>
          <header>Позиції дилерів</header>
          {order.lines.map((line) => (
            <div key={line.partNumber}>
              <strong>{line.partNumber}</strong>
              <span>{line.description}</span>
              <StatusBadge tone="green">{line.quantity} зі складу</StatusBadge>
              <b>{formatMoney(line.quantity * line.dealerPrice)}</b>
            </div>
          ))}
        </Panel>

        <div className={styles.confirmationActions}>
          <Link className="button button-primary" href={dealerOrderHref(order.id)}>Мої замовлення <ArrowRight size={15} /></Link>
          <Link className="button button-outline" href="/catalog"><ShoppingCart size={15} /> Продовжити покупки</Link>
        </div>
        <p className={styles.localReceipt}><Check size={13} /> Це локальне демонстраційне замовлення; зовнішні системи не змінювались.</p>
      </div>
    </div>
  );
}
