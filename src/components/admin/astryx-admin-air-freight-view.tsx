"use client";

import { useLayoutEffect } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import {
  Boxes,
  ClipboardList,
  Grid2X2,
  LayoutList,
  Package,
  Plane,
  Plus,
  Search,
  Upload,
  Warehouse,
} from "lucide-react";
import type { AstryxRendererViewProps } from "@/components/appearance/renderer-view-switch";
import { useAppearance } from "@/components/appearance/use-appearance";
import {
  airFreightEvents,
  airFreightKpis,
  airFreightShipmentMetrics,
  airFreightWorkflowSteps,
  type AirFreightTone,
} from "@/lib/admin-air-freight-data";
import type { AdminAirFreightModel, ShipmentFilter, ShipmentView } from "./admin-air-freight-page";
import styles from "./astryx-admin-air-freight-view.module.css";

type Props = { model: AdminAirFreightModel } & AstryxRendererViewProps;

const warehouseReason = "Складська операція недоступна: доступ лише для читання.";
const uploadReason = "Завантаження файлів недоступне: доступ лише для читання.";

const statusButtons: ReadonlyArray<{ id: ShipmentFilter; label: string }> = [
  { id: "all", label: "Всі" },
  { id: "in-transit", label: "В дорозі" },
  { id: "received", label: "Отримано" },
];

const dotTone: Record<AirFreightTone, "neutral" | "accent" | "success" | "warning" | "error"> = {
  neutral: "neutral",
  blue: "accent",
  amber: "warning",
  orange: "warning",
  red: "error",
  purple: "accent",
  green: "success",
};

function useRendererReady(onReady: () => void) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);
}

function Workflow() {
  return (
    <div className={styles.workflowCard}>
      <Card padding={0}>
        <div className={styles.workflowViewport} role="region" aria-label="Етапи Air Freight" tabIndex={0}>
          <div className={styles.workflowTrack}>
            {airFreightWorkflowSteps.map((step, index) => (
              <div key={step.id} className={styles.workflowStep}>
                <span className={styles.workflowCount}>{step.count}</span>
                <span className={styles.workflowLabel}><StatusDot variant={dotTone[step.tone]} label={step.label} />{step.label}</span>
                {index < airFreightWorkflowSteps.length - 1 ? <span className={styles.workflowConnector} aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Kpis() {
  return (
    <section className={styles.kpis} aria-label="Показники Air Freight">
      {airFreightKpis.map((kpi) => (
        <Card key={kpi.id} padding={3} variant={kpi.tone === "green" ? "green" : kpi.tone === "red" ? "red" : kpi.tone === "amber" ? "yellow" : "blue"}>
          <Text type="label" color="secondary" display="block">{kpi.label}</Text>
          <Text type="display-3" hasTabularNumbers display="block">{kpi.value}</Text>
        </Card>
      ))}
    </section>
  );
}

function Overview() {
  return (
    <section id="astryx-air-overview" role="tabpanel" aria-labelledby="astryx-air-overview-tab" className={styles.stack}>
      <Workflow />
      <Kpis />
      <div className={styles.overviewGrid}>
        <Banner
          title="28 Pending Consolidation"
          description="Orders with items awaiting supplier order creation"
          status="info"
          icon={<ClipboardList size={18} />}
          endContent={<Button label="Вирішити" variant="secondary" isDisabled tooltip="Операційна дія недоступна: доступ лише для читання." />}
        />
        <Card padding={4}>
          <Heading level={2}>Останні події</Heading>
          <ol className={styles.eventList}>
            {airFreightEvents.map((event) => (
              <li key={event.id} className={styles.event}>
                <StatusDot variant={dotTone[event.tone]} label={event.title} />
                <span>
                  <Text type="supporting" color="secondary" display="block">{event.occurredAt}</Text>
                  <Text weight="semibold" display="block">{event.title}</Text>
                  <Text type="supporting" color="secondary" display="block">{event.detail}</Text>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </section>
  );
}

function StatusButtons({ model }: { model: AdminAirFreightModel }) {
  return (
    <div className={styles.buttonGroup} role="group" aria-label="Статус постачання">
      {statusButtons.map((item) => (
        <Button
          key={item.id}
          label={item.label}
          size="sm"
          variant={model.filter === item.id ? "primary" : "ghost"}
          aria-pressed={model.filter === item.id}
          onClick={() => model.setFilter(item.id)}
        />
      ))}
    </div>
  );
}

function ViewButtons({ model }: { model: AdminAirFreightModel }) {
  const items: ReadonlyArray<{ id: ShipmentView; label: string; icon: typeof LayoutList }> = [
    { id: "list", label: "Список", icon: LayoutList },
    { id: "table", label: "Таблиця", icon: Grid2X2 },
  ];
  return (
    <div className={styles.buttonGroup} role="group" aria-label="Вигляд постачань">
      {items.map((item) => {
        const Icon = item.icon;
        return <Button key={item.id} label={item.label} icon={<Icon size={14} />} isIconOnly size="sm" variant={model.view === item.id ? "primary" : "ghost"} aria-pressed={model.view === item.id} onClick={() => model.setView(item.id)} />;
      })}
    </div>
  );
}

function Shipments({ model }: { model: AdminAirFreightModel }) {
  return (
    <section id="astryx-air-shipments" role="tabpanel" aria-labelledby="astryx-air-shipments-tab" className={styles.stack}>
      <section className={styles.metrics} aria-label="Показники постачань">
        {airFreightShipmentMetrics.map((metric) => (
          <Card key={metric.id} padding={3}>
            <Text type="label" color="secondary" display="block">{metric.label}</Text>
            <Text type="display-3" hasTabularNumbers display="block">{metric.value}</Text>
          </Card>
        ))}
      </section>
      <div className={styles.toolbar}>
        <Toolbar
          label="Пошук і фільтри постачань"
          startContent={(
            <TextInput
              label="Пошук постачань"
              isLabelHidden
              startIcon={<Search size={15} />}
              value={model.query}
              onChange={model.setQuery}
              placeholder="AWB, проформа або номер постачання..."
              hasClear
              width="100%"
            />
          )}
          endContent={(
            <div className={styles.toolbarEnd}>
              <StatusButtons model={model} />
              <ViewButtons model={model} />
              <Button label="Нове постачання" icon={<Plus size={14} />} variant="primary" onClick={model.openCreate} />
            </div>
          )}
        />
      </div>
      <Card padding={6} minHeight={220}>
        <EmptyState
          icon={<Boxes size={30} />}
          title="Немає постачань"
          description={model.query.trim() || model.filter !== "all" ? "Для вибраного пошуку та статусу постачань не знайдено." : undefined}
        />
      </Card>
    </section>
  );
}

function NewShipmentDialog({ model, isRendererCommitted }: { model: AdminAirFreightModel; isRendererCommitted: boolean }) {
  const isOpen = isRendererCommitted && model.createOpen;
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isRendererCommitted && !open) model.closeCreate();
      }}
      purpose="form"
      aria-label="Нове постачання"
      width="min(760px, calc(100vw - 32px))"
    >
      <Layout
        height="auto"
        defaultHasDividers
        header={<DialogHeader title="Нове постачання" onOpenChange={() => model.closeCreate()} />}
        content={(
          <LayoutContent padding={4} isScrollable={false}>
            <Button
              label="Перетягніть PDF файли сюди або натисніть для завантаження"
              icon={<Upload size={28} />}
              variant="secondary"
              width="100%"
              isDisabled
              tooltip={uploadReason}
              className={styles.uploadButton}
            />
            <Text type="supporting" color="secondary" display="block" className={styles.uploadHint}>Для авіа-постачання потрібен AWB. Ocean та митні файли ведуться у морській доставці й документообігу.</Text>
          </LayoutContent>
        )}
      />
    </Dialog>
  );
}

export function AstryxAdminAirFreightView({ model, onReady }: Props) {
  useRendererReady(onReady);
  const { renderedDesignSystem } = useAppearance();
  const isRendererCommitted = renderedDesignSystem === "astryx";

  return (
    <main className={styles.page} data-brp-admin-procurement-renderer="astryx">
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}><Plane size={21} /></span>
        <div className={styles.titleCopy}>
          <Heading level={1}>Air Freight</Heading>
          <Text color="secondary">Контролюйте замовлення постачальникам, постачання, приймання на склад, нестачі та передачу дилерам в одному робочому екрані.</Text>
        </div>
        <div className={styles.headerActions}>
          <Button label="Пошук постачань" icon={<Search size={15} />} variant="secondary" onClick={() => model.setTab("shipments")} />
          <Button label="Склад" icon={<Warehouse size={15} />} variant="secondary" isDisabled tooltip={warehouseReason} />
        </div>
      </header>

      <TabList value={model.tab} onChange={(value) => model.setTab(value as AdminAirFreightModel["tab"])} layout="hug" aria-label="Air Freight" role="tablist" hasDivider>
        <Tab value="overview" label="Огляд" icon={<Grid2X2 size={14} />} id="astryx-air-overview-tab" role="tab" aria-selected={model.tab === "overview"} aria-controls="astryx-air-overview" />
        <Tab value="shipments" label="Постачання" icon={<Package size={14} />} id="astryx-air-shipments-tab" role="tab" aria-selected={model.tab === "shipments"} aria-controls="astryx-air-shipments" />
      </TabList>

      {model.tab === "overview" ? <Overview /> : <Shipments model={model} />}
      <NewShipmentDialog model={model} isRendererCommitted={isRendererCommitted} />
    </main>
  );
}
