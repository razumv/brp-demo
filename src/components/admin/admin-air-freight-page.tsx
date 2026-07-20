"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Grid2X2,
  LayoutList,
  Package,
  PackageCheck,
  Plane,
  Plus,
  ScanLine,
  Search,
  Upload,
  Warehouse,
} from "lucide-react";
import {
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { EmptyState, Modal, Panel } from "@/components/shared/ui";
import {
  airFreightEvents,
  airFreightKpis,
  airFreightShipmentMetrics,
  airFreightShipments,
  airFreightWorkflowSteps,
  type AirFreightKpi,
  type AirFreightShipmentStatus,
  type AirFreightTone,
} from "@/lib/admin-air-freight-data";
import styles from "./admin.module.css";

type AirFreightTab = "overview" | "shipments";
type ShipmentFilter = "all" | AirFreightShipmentStatus;
type ShipmentView = "list" | "table";

const toneClasses: Record<AirFreightTone, { soft: string; text: string; border: string }> = {
  neutral: {
    soft: "bg-[var(--surface-subtle)]",
    text: "text-[var(--muted-foreground)]",
    border: "border-[var(--border)]",
  },
  blue: {
    soft: "bg-[var(--blue-soft)]",
    text: "text-[var(--blue)]",
    border: "border-[#b6d6f6] dark:border-[var(--border)]",
  },
  amber: {
    soft: "bg-[var(--amber-soft)]",
    text: "text-[var(--amber)]",
    border: "border-[#e3d694] dark:border-[var(--border)]",
  },
  orange: {
    soft: "bg-[var(--orange-soft)]",
    text: "text-[var(--orange)]",
    border: "border-[#f5c3a8] dark:border-[var(--border)]",
  },
  red: {
    soft: "bg-[var(--red-soft)]",
    text: "text-[var(--red)]",
    border: "border-[#efb7bc] dark:border-[var(--border)]",
  },
  purple: {
    soft: "bg-[var(--purple-soft)]",
    text: "text-[var(--purple)]",
    border: "border-[#d5c1f3] dark:border-[var(--border)]",
  },
  green: {
    soft: "bg-[var(--green-soft)]",
    text: "text-[var(--green)]",
    border: "border-[#b7dfbf] dark:border-[var(--border)]",
  },
};

const kpiIcons: Record<AirFreightKpi["id"], typeof Package> = {
  "supplier-orders": ClipboardList,
  "in-transit": Package,
  scan: ScanLine,
  shortage: AlertTriangle,
  completed: CheckCircle2,
  ready: ArrowRight,
};

const shipmentMetricIcons = {
  total: Boxes,
  "in-transit": Plane,
  delivered: PackageCheck,
  completed: CheckCircle2,
} as const;

const shipmentFilters: ReadonlyArray<{ id: ShipmentFilter; label: string }> = [
  { id: "all", label: "Всі" },
  { id: "in-transit", label: "В дорозі" },
  { id: "received", label: "Отримано" },
];

function HeaderActions({ onShowShipments }: { onShowShipments: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="button button-outline" onClick={onShowShipments}>
        <Search size={15} /> Пошук постачань
      </button>
      <button
        type="button"
        className="button button-outline"
        disabled
        title="Демо: складська операція не підтверджена як безпечна"
      >
        <Warehouse size={15} /> Склад
      </button>
    </div>
  );
}

function AirFreightTabs({ active, onChange }: { active: AirFreightTab; onChange: (tab: AirFreightTab) => void }) {
  return (
    <AdminTabs
      items={[
        {
          id: "overview",
          label: "Огляд",
          icon: <Grid2X2 size={14} />,
          panelId: "air-freight-overview-panel",
        },
        {
          id: "shipments",
          label: "Постачання",
          icon: <Package size={14} />,
          panelId: "air-freight-shipments-panel",
        },
      ]}
      value={active}
      onValueChange={onChange}
      label="Air Freight"
      mobileSelectLabel="Розділ Air Freight"
    />
  );
}

function WorkflowStrip() {
  return (
    <div className={styles.mobileHiddenOnMobile} data-mobile-surface="air-workflow">
      <Panel className="min-w-0">
        <div className="min-w-0 overflow-x-auto p-5" role="region" aria-label="Етапи Air Freight" tabIndex={0}>
          <div className="flex min-w-[790px] items-start">
            {airFreightWorkflowSteps.map((step, index) => {
              const tone = toneClasses[step.tone];
              return (
                <div key={step.id} className="contents">
                  <div className="flex min-w-[86px] flex-1 flex-col items-center text-center">
                    <span className={`grid size-11 place-items-center rounded-full border text-base font-bold ${tone.soft} ${tone.text} ${tone.border}`}>
                      {step.count}
                    </span>
                    <span className="mt-2 text-[10px] font-medium text-[var(--muted-foreground)]">{step.label}</span>
                  </div>
                  {index < airFreightWorkflowSteps.length - 1 ? (
                    <span className={`mt-[21px] h-px min-w-8 flex-1 ${index === 0 ? "bg-[var(--blue)]" : "bg-[var(--border)]"}`} aria-hidden="true" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function OverviewKpis() {
  return (
    <section className={`${styles.mobileHiddenOnMobile} grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6`} aria-label="Показники Air Freight">
      {airFreightKpis.map((kpi) => {
        const Icon = kpiIcons[kpi.id];
        const tone = toneClasses[kpi.tone];
        return (
          <Panel key={kpi.id} className="flex min-h-24 items-start gap-3 p-4">
            <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone.soft} ${tone.text}`}><Icon size={17} /></span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase leading-tight tracking-[0.035em] text-[var(--muted-foreground)]">{kpi.label}</span>
              <strong className={`mt-1 block text-2xl leading-none ${tone.text}`}>{kpi.value}</strong>
            </span>
          </Panel>
        );
      })}
    </section>
  );
}

function AttentionAndEvents() {
  return (
    <section className="grid items-start gap-4 lg:grid-cols-2">
      <div className="grid gap-3">
        <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
          <AlertTriangle size={15} /> Потребує уваги
        </h2>
        <div className="flex flex-col gap-3 rounded-md border border-[#b6d6f6] bg-[var(--blue-soft)] p-4 sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--blue-soft),var(--blue)_8%)] text-[var(--blue)]">
            <ClipboardList size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">28 Pending Consolidation</strong>
            <small className="mt-1 block text-[10px] text-[var(--muted-foreground)]">Orders with items awaiting supplier order creation</small>
          </span>
          <button type="button" className="button button-outline shrink-0" disabled title="Демо: операційна дія вимкнена">Вирішити</button>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="m-0 text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">Останні події</h2>
        </div>
        <ol className="m-0 max-h-[360px] list-none overflow-y-auto p-4">
          {airFreightEvents.map((event, index) => {
            const tone = toneClasses[event.tone];
            return (
              <li key={event.id} className="relative pb-5 pl-5 last:pb-0">
                <span className={`absolute left-0 top-1 size-2 rounded-full ${tone.soft} ring-2 ring-current ${tone.text}`} aria-hidden="true" />
                {index < airFreightEvents.length - 1 ? <span className="absolute bottom-0 left-[3px] top-3 w-px bg-[var(--border)]" aria-hidden="true" /> : null}
                <time className="block font-mono text-[9px] uppercase tracking-[0.04em] text-[var(--faint)]">{event.occurredAt}</time>
                <strong className="mt-1 block text-[11px]">{event.title}</strong>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted-foreground)]">{event.detail}</p>
              </li>
            );
          })}
        </ol>
      </Panel>
    </section>
  );
}

function OverviewTab() {
  return (
    <div
      id="air-freight-overview-panel"
      role="tabpanel"
      aria-labelledby="air-freight-overview-panel-tab"
      className="grid gap-4"
    >
      <WorkflowStrip />
      <OverviewKpis />
      <AttentionAndEvents />
    </div>
  );
}

function ShipmentMetrics() {
  return (
    <AdminKpiGrid
      hideOnMobile
      label="Показники постачань"
      items={airFreightShipmentMetrics.map((metric) => {
        const Icon = shipmentMetricIcons[metric.id];
        const tone = metric.tone === "purple" ? "neutral" : metric.tone;
        return {
          id: metric.id,
          label: metric.label,
          value: metric.value,
          icon: <Icon size={17} />,
          tone,
        };
      })}
    />
  );
}

function ShipmentsTab({ onCreate }: { onCreate: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShipmentFilter>("all");
  const [view, setView] = useState<ShipmentView>("list");

  const filteredShipments = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk");
    return airFreightShipments.filter((shipment) => {
      if (filter !== "all" && shipment.status !== filter) return false;
      if (!normalized) return true;
      return `${shipment.awb} ${shipment.proforma} ${shipment.shipmentNumber}`.toLocaleLowerCase("uk").includes(normalized);
    });
  }, [filter, query]);

  return (
    <div
      id="air-freight-shipments-panel"
      role="tabpanel"
      aria-labelledby="air-freight-shipments-panel-tab"
      className="grid gap-4"
    >
      <ShipmentMetrics />
      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук постачань"
            placeholder="Пошук AWB, проформа, номер постачання..."
          />
        )}
        filters={(
          <AdminSegmentedControl
            items={shipmentFilters}
            value={filter}
            onValueChange={setFilter}
            label="Статус постачання"
          />
        )}
        view={(
          <AdminSegmentedControl
            items={[
              { id: "list", label: "Список", icon: <LayoutList size={15} /> },
              { id: "table", label: "Таблиця", icon: <Grid2X2 size={15} /> },
            ]}
            value={view}
            onValueChange={setView}
            label="Вигляд постачань"
          />
        )}
        actions={(
          <button type="button" className="button button-primary" onClick={onCreate}>
            <Plus size={15} /> Нове постачання
          </button>
        )}
        meta={`${filteredShipments.length} з ${airFreightShipments.length} постачань`}
        mobileDisclosure={{
          sections: ["filters"],
          activeCount: Number(filter !== "all"),
        }}
      />
      <Panel>
        {filteredShipments.length === 0 ? (
          <EmptyState title="Немає постачань" description={query.trim() || filter !== "all" ? "Для вибраного пошуку та статусу постачань не знайдено." : ""} icon={<Boxes size={30} />} />
        ) : null}
      </Panel>
    </div>
  );
}

function NewShipmentPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Нове постачання" className="w-[min(768px,100%)]">
      <button
        type="button"
        disabled
        title="Демо: вибір і завантаження файлів вимкнені"
        className="flex min-h-40 w-full cursor-not-allowed flex-col items-center justify-center rounded-md border border-dashed border-[var(--faint)] bg-[var(--surface-subtle)] px-6 py-8 text-center opacity-80"
      >
        <Upload size={30} className="mb-3 text-[var(--muted-foreground)]" />
        <strong className="text-sm font-medium text-[var(--muted-foreground)]">Перетягніть PDF файли сюди або натисніть для завантаження</strong>
        <span className="mt-2 max-w-xl text-[10px] leading-relaxed text-[var(--faint)]">Для авіа-постачання потрібен AWB. Ocean/митні файли ведуться у морській доставці та документообігу.</span>
      </button>
    </Modal>
  );
}

export function AdminAirFreightPage() {
  const [tab, setTab] = useState<AirFreightTab>("overview");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AdminPage>
      <AdminPageHeader
        icon={<Plane size={21} />}
        title="Air Freight"
        description="Контролюйте замовлення постачальникам, постачання, приймання на склад, нестачі та передачу дилерам в одному робочому екрані."
        actions={<HeaderActions onShowShipments={() => setTab("shipments")} />}
      />

      <AirFreightTabs active={tab} onChange={setTab} />
      {tab === "overview" ? <OverviewTab /> : <ShipmentsTab onCreate={() => setCreateOpen(true)} />}
      <NewShipmentPreview open={createOpen} onClose={() => setCreateOpen(false)} />
    </AdminPage>
  );
}
