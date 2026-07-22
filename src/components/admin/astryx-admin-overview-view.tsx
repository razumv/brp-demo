"use client";

import {useLayoutEffect} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {Link} from "@astryxdesign/core/Link";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {Text} from "@astryxdesign/core/Text";
import {
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {formatMoney} from "@/lib/mock-data";
import type {
  AdminOverviewMetricIcon,
  AdminOverviewModel,
} from "./admin-overview.types";
import styles from "./astryx-admin-overview.module.css";

type AstryxAdminOverviewViewProps = {
  model: AdminOverviewModel;
};

function MetricIcon({icon}: {icon: AdminOverviewMetricIcon}) {
  if (icon === "revenue") return <CircleDollarSign size={18} aria-hidden="true" />;
  if (icon === "orders") return <ShoppingCart size={18} aria-hidden="true" />;
  if (icon === "processing") return <Clock3 size={18} aria-hidden="true" />;
  return <CheckCircle2 size={18} aria-hidden="true" />;
}

function statusLabel(status: AdminOverviewModel["recentOrders"][number]["status"]) {
  if (status === "new") return "Новий";
  if (status === "done") return "Готово";
  if (status === "cancelled") return "Скасовано";
  return "Очікування";
}

function statusVariant(status: AdminOverviewModel["recentOrders"][number]["status"]) {
  if (status === "new") return "warning" as const;
  if (status === "done") return "success" as const;
  if (status === "cancelled") return "error" as const;
  return "warning" as const;
}

export default function AstryxAdminOverviewView({
  model,
  onReady,
}: AstryxAdminOverviewViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-admin-overview-renderer="astryx">
        <header className={styles.header}>
          <Heading level={1}>Огляд панелі</Heading>
          <Text color="secondary" display="block">Ласкаво просимо до панелі адміністратора. Ось зведення по системі.</Text>
        </header>

        <section className={styles.statGrid} aria-label="Ключові показники">
          {model.metrics.map((metric) => (
            <Card key={metric.label} className={styles.metricCard} padding={4}>
              <div className={styles.metricTop}>
                <span className={styles.metricIcon} data-tone={metric.tone}>
                  <MetricIcon icon={metric.icon} />
                </span>
                <Text type="label" color="secondary">{metric.label}</Text>
              </div>
              <Text as="p" className={styles.metricValue} hasTabularNumbers>{metric.value}</Text>
              <Text type="supporting" color="secondary">{metric.helper}</Text>
            </Card>
          ))}
        </section>

        <section className={styles.overviewGrid}>
          <Card className={styles.panel} padding={4}>
            <header className={styles.panelHeader}>
              <div>
                <Heading level={2}>Стан черги</Heading>
                <Text type="supporting" color="secondary">Фонові завдання та воркери імпорту.</Text>
              </div>
              <Badge label="Система доступна" variant="success" />
            </header>
            <div className={styles.queueList}>
              {model.queue.map((item) => (
                <span className={styles.queueItem} key={item.label}>
                  <StatusDot label={item.label} variant={item.tone === "green" ? "success" : "neutral"} />
                  <Text type="supporting">{item.label}: {item.value}</Text>
                </span>
              ))}
            </div>
            <Text className={styles.readonlyNotice} type="supporting">
              <Boxes size={15} aria-hidden="true" /> Керування задачами доступне лише для перегляду
            </Text>
          </Card>

          <Card className={styles.panel} padding={4}>
            <header className={styles.panelHeader}>
              <div>
                <Heading level={2}>Розподіл залишків</Heading>
                <Text type="supporting" color="secondary">Поточне джерело доступності позицій.</Text>
              </div>
              <PackageSearch size={18} aria-hidden="true" />
            </header>
            <div className={styles.distribution}>
              {model.distribution.map((item) => (
                <div className={styles.distributionRow} key={item.label}>
                  <Text type="supporting">{item.label}</Text>
                  <span className={styles.progressTrack} data-value={item.value} aria-hidden="true"><span /></span>
                  <Text type="supporting" weight="semibold" hasTabularNumbers>{item.count}</Text>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className={styles.recentPanel} padding={4}>
          <header className={styles.panelHeader}>
            <div>
              <Heading level={2}>Останні замовлення</Heading>
              <Text type="supporting" color="secondary">Локальні замовлення показуються першими.</Text>
            </div>
            <Button href="/admin/order-pipeline" label="Відкрити пайплайн" variant="secondary" />
          </header>
          <div className={styles.recentList}>
            {model.recentOrders.map((order) => (
              <Link className={styles.recentOrder} href={order.href} key={`${order.id}-${order.code}`} type="inherit">
                <Text className={styles.orderCode} type="code" weight="semibold">{order.code}</Text>
                <span className={styles.orderCopy}>
                  <Text type="label" maxLines={1}>{order.dealer}</Text>
                  <Text type="supporting" color="secondary" maxLines={1}>{order.contact}</Text>
                </span>
                <Text className={styles.orderDate} type="supporting" color="secondary">{order.date}</Text>
                <Text className={styles.orderAmount} type="label" hasTabularNumbers>{formatMoney(order.amount)}</Text>
                <Badge label={statusLabel(order.status)} variant={statusVariant(order.status)} />
              </Link>
            ))}
          </div>
        </Card>
      </main>
    </AstryxBrpUiProvider>
  );
}
