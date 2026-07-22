"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  PackageCheck,
  Plane,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import {BrpCard} from "@/components/brp-ui";
import {useAppearance} from "@/components/appearance/use-appearance";
import { EmptyState, Panel, StatusBadge } from "@/components/shared/ui";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { findDealerOrder } from "@/lib/dealer/order-state";
import styles from "@/components/catalog/catalog.module.css";

export function OrderConfirmationPage({ id }: { id: string }) {
  const {renderedDesignSystem} = useAppearance();
  const { snapshot, hydrated, commands } = useDealerWorkflow();
  const [copyFeedback, setCopyFeedback] = useState("");
  const order = findDealerOrder(snapshot, id);

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
            description="Запис недоступний або вже видалений."
            action={<Link className="button button-primary" href="/catalog">Повернутися до каталогу</Link>}
          />
        </Panel>
      </div>
    );
  }

  const total = orderTotal(order.lines);
  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className={`page page-narrow ${styles.confirmationPage}`} data-dealer-order-confirmation-renderer={renderedDesignSystem}>
      <section className={styles.confirmationHero}>
        <span><CheckCircle2 size={32} /></span>
        <h1>Замовлення створено</h1>
        <p>Замовлення збережено та доступне у розділі «Мої замовлення».</p>
      </section>

      <div className={styles.confirmationContent}>
        <div className={styles.receiptCard}><BrpCard padding="none">
          <div className={styles.receiptTop}>
            <div><span>Номер замовлення</span><strong>{order.code}</strong><button type="button" aria-label="Скопіювати номер замовлення" onClick={async () => {
              const result = await commands.copyText({ text: order.code });
              setCopyFeedback(result.ok ? "Номер скопійовано." : "Не вдалося скопіювати номер.");
            }}><Copy size={14} /></button></div>
            <div><span>Разом</span><strong>{formatMoney(total)}</strong></div>
          </div>
          <div className={styles.receiptMeta}>
            <span>{order.lines.length} запчастин / {units} одиниць</span>
            {order.po ? <code>PO: {order.po}</code> : null}
            <StatusBadge tone="blue">{order.delivery === "standard" ? "Доставка" : "Самовивіз"}</StatusBadge>
          </div>
        </BrpCard></div>
        {copyFeedback ? <p className={styles.successMessage} role="status">{copyFeedback}</p> : null}

        <div className={styles.nextSteps}><BrpCard padding="none">
          <h2>Що далі</h2>
          <ol>
            <li><span className={styles.stepActive}><Clock3 size={17} /></span><div><strong>Створено</strong><small>Замовлення додано до списку дилера</small></div></li>
            <li><span><PackageCheck size={17} /></span><div><strong>Комплектація</strong><small>Статус з’явиться після підключення обробки замовлень</small></div></li>
            <li><span><Plane size={17} /></span><div><strong>Отримання</strong><small>{order.delivery === "standard" ? "Доставка після комплектації" : "Самовивіз після комплектації"}</small></div></li>
          </ol>
        </BrpCard></div>

        <div className={styles.confirmationLines}><BrpCard padding="none">
          <header>Позиції дилерів</header>
          {order.lines.map((line) => (
            <div key={line.partNumber}>
              <strong>{line.partNumber}</strong>
              <span>{line.description}</span>
              <StatusBadge tone="neutral">{line.quantity} од.</StatusBadge>
              <b>{formatMoney(line.quantity * line.dealerPrice)}</b>
            </div>
          ))}
        </BrpCard></div>

        <div className={styles.confirmationActions}>
          <Link className="button button-primary" href="/dealer/orders">Мої замовлення <ArrowRight size={15} /></Link>
          <Link className="button button-outline" href="/catalog"><ShoppingCart size={15} /> Продовжити покупки</Link>
        </div>
      </div>
    </div>
  );
}
