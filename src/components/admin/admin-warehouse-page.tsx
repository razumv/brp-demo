"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Grid2X2,
  History,
  LayoutList,
  LockKeyhole,
  Package,
  PackageCheck,
  RefreshCw,
  ScanLine,
  Search,
  Truck,
  Upload,
  Warehouse,
  X,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { EmptyState, Panel, StatusBadge } from "@/components/shared/ui";
import {
  receiptSummaryMetrics,
  receiptSummaryRows,
  warehouseFulfillmentMetrics,
  warehouseFulfillmentOrders,
  warehouseInventoryPartRows,
  warehouseInventoryShipmentRows,
  warehouseInventoryTotals,
  warehousePartsShipmentFilters,
  warehousePlacementRows,
  warehousePlacementSummary,
  warehouseProcessTabs,
  warehouseShipments,
  warehouseShortageMetrics,
  warehouseShortages,
  type ReceiptSummaryFilter,
  type ReceiptSummaryView,
  type WarehouseFulfillmentFilter,
  type WarehouseFulfillmentView,
  type WarehousePartsShipmentFilter,
  type WarehouseProcessId,
  type WarehouseShortageView,
} from "@/lib/admin-warehouse-data";

type KpiTone = "neutral" | "blue" | "green" | "amber" | "orange";

const kpiToneClasses: Record<KpiTone, string> = {
  neutral: "bg-[var(--surface-subtle)] text-[var(--muted-foreground)]",
  blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
  green: "bg-[var(--green-soft)] text-[var(--green)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function formatEur(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function LockedButton({ children, className = "", title }: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={title}
      className={`button button-outline ${className}`}
    >
      <LockKeyhole size={13} />
      {children}
    </button>
  );
}

function KpiGrid({ items }: {
  items: ReadonlyArray<{
    label: string;
    value: ReactNode;
    icon: ReactNode;
    tone?: KpiTone;
    helper?: string;
  }>;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 max-md:hidden sm:grid-cols-2 xl:grid-cols-4" aria-label="Показники складу">
      {items.map((item) => (
        <Panel key={item.label} className="flex min-h-20 items-start gap-3 p-4 shadow-none">
          <span className={`grid size-9 shrink-0 place-items-center rounded-md ${kpiToneClasses[item.tone ?? "neutral"]}`}>
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
              {item.label}
            </span>
            <strong className="mt-1 block text-[22px] leading-none tabular-nums">{item.value}</strong>
            {item.helper ? <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{item.helper}</span> : null}
          </span>
        </Panel>
      ))}
    </section>
  );
}

function ProcessNavigation({ active, onChange }: {
  active: WarehouseProcessId;
  onChange: (process: WarehouseProcessId) => void;
}) {
  return (
    <AdminTabs<WarehouseProcessId>
      items={warehouseProcessTabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        mobileLabel: tab.label,
        panelId: `warehouse-${tab.id}-panel`,
      }))}
      value={active}
      onValueChange={onChange}
      label="Процеси складу"
      mobileSelectLabel="Процес складу"
      size="compact"
    />
  );
}

function RepresentativeNotice({ shown, total, noun = "рядків" }: { shown: number; total: number; noun?: string }) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5 text-[10px] text-[var(--muted-foreground)]">
      Репрезентативна доказова вибірка: показано {shown} з {total} {noun} у source.
    </div>
  );
}

function ReceivingTab() {
  const [shipmentId, setShipmentId] = useState<(typeof warehouseShipments)[number]["id"]>(warehouseShipments[0].id);
  const shipment = warehouseShipments.find((item) => item.id === shipmentId) ?? warehouseShipments[0];

  return (
    <section className="grid gap-4">
      <AdminToolbar
        mobileDisclosure={{ sections: [] }}
        filters={(
          <label className="field min-w-[220px]">
            <span className="sr-only">Постачання</span>
            <select
              className="h-10"
              value={shipmentId}
              onChange={(event) => setShipmentId(event.target.value as (typeof warehouseShipments)[number]["id"])}
            >
              {warehouseShipments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.proforma} · {item.shipmentNumber} · {item.status}
                </option>
              ))}
            </select>
          </label>
        )}
        actions={(
          <>
            <LockedButton className="!min-h-10" title="Приймання всіх позицій є операційною дією і вимкнене">
              <PackageCheck size={14} /> Прийняти все
            </LockedButton>
            <LockedButton title="Запуск приймання є операційною дією і вимкнений" className="!min-h-10 border-[color-mix(in_srgb,var(--green)_25%,var(--border))] bg-[var(--green-soft)] text-[var(--green)]">
              <ScanLine size={14} /> Почати приймання
            </LockedButton>
            <LockedButton className="!min-h-10" title="Приймання в 1С є операційною дією і вимкнене">
              <CheckCircle2 size={14} /> Прийняти (вже в 1С)
            </LockedButton>
          </>
        )}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-[17px] font-semibold">{shipment.proforma} · {shipment.shipmentNumber}</h2>
            <StatusBadge tone="blue">{shipment.status}</StatusBadge>
          </div>
          <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">
            Маніфест {shipment.manifest.id} · {shipment.manifest.sourceLineCount} позицій packing list
          </p>
        </div>
      </div>

      <KpiGrid items={[
        { label: "Очікується", value: shipment.metrics.expectedUnits, icon: <Boxes size={17} />, tone: "blue" },
        { label: "Відскановано", value: shipment.metrics.scannedUnits, icon: <ScanLine size={17} /> },
        { label: "Повністю", value: shipment.metrics.fullyReceivedUnits, icon: <PackageCheck size={17} />, tone: "green" },
        { label: "Відсутні / розбіжності", value: shipment.metrics.discrepancyCount, icon: <AlertTriangle size={17} />, tone: "orange" },
      ]} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <Panel className="overflow-hidden shadow-none">
          <div className="flex flex-col gap-2 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="m-0 text-[13px] font-semibold">Packing list</h3>
              <p className="mb-0 mt-1 text-[10px] text-[var(--muted-foreground)]">{shipment.proforma} · склад маніфесту</p>
            </div>
            <StatusBadge tone="neutral">{shipment.manifest.sourceLineCount} позицій</StatusBadge>
          </div>
          <RepresentativeNotice shown={shipment.manifest.representativeLines.length} total={shipment.manifest.sourceLineCount} />
          <div className="data-table-wrap" role="region" aria-label="Packing list" tabIndex={0}>
            <table className="data-table min-w-[620px]">
              <thead><tr><th>Артикул</th><th>Опис</th><th className="text-right">К-ть</th><th className="text-center">Скан</th></tr></thead>
              <tbody>
                {shipment.manifest.representativeLines.map((line) => (
                  <tr key={line.id}>
                    <td className="font-mono font-semibold">{line.partNumber}</td>
                    <td>{line.description}</td>
                    <td className="text-right font-semibold tabular-nums">{line.quantity}</td>
                    <td className="text-center text-[var(--faint)]">{line.scannedQuantity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid content-start gap-4">
          <Panel className="p-4 shadow-none">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-subtle)] text-[var(--muted-foreground)]"><ClipboardList size={17} /></span>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">Зв’язані замовлення</span>
                <strong className="mt-1 block text-xl">{shipment.linkedSupplierOrderCount}</strong>
                <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">Немає зв&apos;язаних замовлень</p>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden shadow-none">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h3 className="m-0 text-[13px] font-semibold">Сканування</h3>
            </div>
            <div className="grid gap-3 p-4">
              <input disabled className="input" placeholder="Спочатку почніть приймання..." />
              <div className="grid grid-cols-3 gap-2">
                <button type="button" disabled className="button border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]">OK</button>
                <button type="button" disabled className="button border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)]">Пошкоджено</button>
                <button type="button" disabled className="button border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]">Не той</button>
              </div>
              <p className="m-0 text-[11px] text-[var(--muted-foreground)]">Натисніть &quot;Почати приймання&quot; для початку</p>
              <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] text-[11px] text-[var(--muted-foreground)]">
                Немає сканів
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function ReceiptSummaryTab() {
  const [view, setView] = useState<ReceiptSummaryView>("parts");
  const [shipment, setShipment] = useState("all");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReceiptSummaryFilter>("all");

  const visibleRows = useMemo(() => receiptSummaryRows.filter((row) => {
    if (shipment !== "all" && row.shipmentNumber !== shipment) return false;
    if (filter !== "all" && row.source !== filter) return false;
    const needle = normalize(query);
    return !needle || normalize(`${row.partNumber} ${row.shipmentNumber}`).includes(needle);
  }), [filter, query, shipment]);

  return (
    <section className="grid gap-4">
      <KpiGrid items={[
        { label: "Артикулів", value: receiptSummaryMetrics.parts, icon: <Package size={17} />, tone: "blue" },
        { label: "CRM", value: receiptSummaryMetrics.crm, icon: <ClipboardList size={17} />, tone: "green" },
        { label: "Legacy поза CRM", value: receiptSummaryMetrics.legacyOutsideCrm, icon: <History size={17} />, tone: "amber" },
        { label: "Недоотримано", value: receiptSummaryMetrics.missing, icon: <AlertTriangle size={17} />, tone: "orange" },
      ]} />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук за артикулом"
            placeholder="Пошук за артикулом…"
          />
        )}
        filters={(
          <>
            <label className="field w-full max-w-[230px]">
              <span className="sr-only">Постачання</span>
              <select value={shipment} onChange={(event) => setShipment(event.target.value)}>
                <option value="all">Усі відвантаження</option>
                {warehouseShipments.map((item) => <option key={item.id} value={item.shipmentNumber}>{item.proforma} · {item.shipmentNumber}</option>)}
              </select>
            </label>
            <AdminSegmentedControl<ReceiptSummaryFilter>
              items={[
                { id: "all", label: "Усі" },
                { id: "crm", label: "CRM" },
                { id: "legacy", label: "Legacy" },
              ]}
              value={filter}
              onValueChange={setFilter}
              label="Джерело приймання"
            />
          </>
        )}
        view={(
          <AdminSegmentedControl<ReceiptSummaryView>
            items={[
              { id: "parts", label: "За артикулами" },
              { id: "shipments", label: "До відвантаження" },
            ]}
            value={view}
            onValueChange={setView}
            label="Вигляд зведення приймання"
          />
        )}
        actions={(
          <>
            <LockedButton title="Оновлення може змінювати зовнішній стан і вимкнене"><RefreshCw size={14} /> Оновити</LockedButton>
            <LockedButton title="Експорт не запускається у read-only клоні"><Download size={14} /> Експорт</LockedButton>
          </>
        )}
        mobileDisclosure={{
          sections: ["filters", "actions"],
          activeCount: Number(shipment !== "all") + Number(filter !== "all"),
        }}
      />

      <Panel className="overflow-hidden shadow-none">
        {visibleRows.length === 0 ? (
          <EmptyState compact title="Поки немає прийнятого товару" description="Приймання у source не запускалося; усі показники дорівнюють нулю." icon={<PackageCheck size={28} />} />
        ) : null}
      </Panel>
    </section>
  );
}

const shortageViews: ReadonlyArray<{
  id: WarehouseShortageView;
  label: string;
  count: number;
  heading: string;
  empty: string;
}> = [
  { id: "active", label: "Активні", count: 0, heading: "Очікують перевірки", empty: "Немає активних нестач" },
  { id: "history", label: "Історія", count: 0, heading: "Додано до консолідації", empty: "Поки немає позицій в історії" },
  { id: "surplus", label: "Надлишок", count: 0, heading: "Надлишки при прийманні", empty: "Немає невирішених надлишків" },
];

function ShortagesTab() {
  const [view, setView] = useState<WarehouseShortageView>("active");
  const [query, setQuery] = useState("");
  const activeView = shortageViews.find((item) => item.id === view) ?? shortageViews[0];

  const visibleShortages = useMemo(() => {
    const needle = normalize(query);
    return warehouseShortages.filter((item) => {
      if (view === "surplus" && item.kind !== "surplus") return false;
      if (view !== "surplus" && item.kind === "surplus") return false;
      return !needle || normalize(`${item.partNumber} ${item.shipmentNumber}`).includes(needle);
    });
  }, [query, view]);

  return (
    <section className="grid gap-4">
      <KpiGrid items={[
        { label: "Очікують", value: warehouseShortageMetrics.waiting, icon: <History size={17} />, tone: "amber" },
        { label: "Пошкоджені", value: warehouseShortageMetrics.damaged, icon: <AlertTriangle size={17} />, tone: "orange" },
        { label: "Не та деталь", value: warehouseShortageMetrics.wrongPart, icon: <CircleX size={17} />, tone: "orange" },
        { label: "Надлишок", value: warehouseShortageMetrics.surplus, icon: <Boxes size={17} />, tone: "blue" },
      ]} />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук за артикулом або постачанням"
            placeholder="Пошук за артикулом або постачанням..."
          />
        )}
        filters={(
          <AdminSegmentedControl<WarehouseShortageView>
            items={shortageViews.map((item) => ({ id: item.id, label: item.label, count: item.count }))}
            value={view}
            onValueChange={setView}
            label="Стани нестач"
          />
        )}
        actions={<LockedButton title="Оновлення нестач вимкнене у read-only клоні"><RefreshCw size={14} /> Оновити</LockedButton>}
        mobileDisclosure={{ sections: ["filters", "actions"], activeCount: Number(view !== "active") }}
      />

      <Panel className="overflow-hidden shadow-none">
        <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
          <h2 className="m-0 text-[12px] font-semibold">{activeView.heading}</h2>
        </div>
        {visibleShortages.length === 0 ? (
          <EmptyState compact title={activeView.empty} description={query ? "Пошук у поточному порожньому source-стані не дав результатів." : "У source зафіксовано нуль позицій."} icon={<AlertTriangle size={28} />} />
        ) : null}
      </Panel>
    </section>
  );
}

const fulfillmentFilters: ReadonlyArray<{ id: WarehouseFulfillmentFilter; label: string }> = [
  { id: "all", label: "Всі" },
  { id: "in-progress", label: "В роботі" },
  { id: "completed", label: "Завершені" },
  { id: "backorder", label: "Бекордер" },
];

function FulfillmentKanban() {
  const columns = [
    { id: "waiting", label: "Очікують" },
    { id: "in-progress", label: "В роботі" },
    { id: "completed", label: "Завершені" },
  ] as const;

  return (
    <div className="grid gap-3 p-4 lg:grid-cols-3" aria-label="Kanban виконання">
      {columns.map((column) => (
        <section key={column.id} className="min-h-48 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <strong className="text-[11px]">{column.label}</strong>
            <StatusBadge tone="neutral">0</StatusBadge>
          </header>
          <div className="grid min-h-32 place-items-center text-center text-[11px] text-[var(--muted-foreground)]">Немає замовлень</div>
        </section>
      ))}
    </div>
  );
}

function FulfillmentTab() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WarehouseFulfillmentFilter>("all");
  const [view, setView] = useState<WarehouseFulfillmentView>("list");

  const visibleOrders = useMemo(() => {
    const needle = normalize(query);
    return warehouseFulfillmentOrders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      return !needle || normalize(`${order.orderNumber} ${order.supplier}`).includes(needle);
    });
  }, [filter, query]);

  return (
    <section className="grid gap-4">
      <KpiGrid items={[
        { label: "Всього замовлень", value: warehouseFulfillmentMetrics.totalOrders, icon: <ClipboardList size={17} />, tone: "blue" },
        { label: "Відправлено", value: warehouseFulfillmentMetrics.shipped, icon: <Truck size={17} /> },
        { label: "Отримано", value: warehouseFulfillmentMetrics.received, icon: <PackageCheck size={17} />, tone: "green" },
        { label: "Бекордер", value: warehouseFulfillmentMetrics.backorder, icon: <History size={17} />, tone: "amber" },
      ]} />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук замовлень"
            placeholder="Пошук замовлень..."
          />
        )}
        filters={(
          <AdminSegmentedControl<WarehouseFulfillmentFilter>
            items={fulfillmentFilters}
            value={filter}
            onValueChange={setFilter}
            label="Статус виконання"
          />
        )}
        view={(
          <AdminSegmentedControl<WarehouseFulfillmentView>
            items={[
              { id: "list", label: "Список", icon: <LayoutList size={15} /> },
              { id: "kanban", label: "Kanban", icon: <Grid2X2 size={15} /> },
            ]}
            value={view}
            onValueChange={setView}
            label="Вигляд виконання"
          />
        )}
        actions={<LockedButton title="Перезіставлення є операційною дією і вимкнене"><RefreshCw size={14} /> Перезіставити</LockedButton>}
        mobileDisclosure={{ sections: ["filters", "actions"], activeCount: Number(filter !== "all") }}
      />

      <Panel className="overflow-hidden shadow-none">
        {view === "list" ? (
          visibleOrders.length === 0 ? <EmptyState compact title="Немає замовлень постачальнику" description="У source зафіксовано порожній список виконання." icon={<ClipboardList size={28} />} /> : null
        ) : <FulfillmentKanban />}
      </Panel>
    </section>
  );
}

type InventorySummaryView = "parts" | "shipments";

function InventoryPartsTable({ query, shipmentFilter }: { query: string; shipmentFilter: WarehousePartsShipmentFilter }) {
  const rows = useMemo(() => {
    const needle = normalize(query);
    return warehouseInventoryPartRows.filter((row) => {
      if (shipmentFilter !== "all" && row.shipment !== shipmentFilter) return false;
      return !needle || normalize(`${row.partNumber} ${row.description} ${row.shipment}`).includes(needle);
    });
  }, [query, shipmentFilter]);

  return (
    <Panel className="overflow-hidden shadow-none">
      <RepresentativeNotice shown={rows.length} total={warehouseInventoryTotals.parts} noun="деталей" />
      {rows.length ? (
        <div className="data-table-wrap" role="region" aria-label="Зведення за деталями" tabIndex={0}>
          <table className="data-table min-w-[1100px]">
            <thead>
              <tr><th>Артикул</th><th>Опис</th><th>Постачання</th><th className="text-right">Відправлено</th><th className="text-right">Отримано</th><th className="text-right">€ шт.</th><th className="text-right">€ всього</th><th>Стан</th><th>Розподіл</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono font-semibold">{row.partNumber}</td>
                  <td>{row.description}</td>
                  <td>{row.shipment}</td>
                  <td className="text-right tabular-nums">{row.shipped}</td>
                  <td className="text-right tabular-nums">{row.received}</td>
                  <td className="text-right tabular-nums">{formatEur(row.unitEur)}</td>
                  <td className="text-right font-semibold tabular-nums">{formatEur(row.totalEur)}</td>
                  <td><StatusBadge tone="red">{row.status}</StatusBadge></td>
                  <td><StatusBadge tone="neutral">{row.allocation}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[var(--border)] bg-[var(--surface-subtle)] font-semibold">
              <tr>
                <td colSpan={2} className="px-3 py-3">{warehouseInventoryTotals.parts} деталей</td>
                <td>Всього source</td>
                <td className="text-right">{warehouseInventoryTotals.shipped}</td>
                <td className="text-right">{warehouseInventoryTotals.received}</td>
                <td />
                <td className="text-right">{formatEur(warehouseInventoryTotals.totalEur)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <EmptyState compact title="Нічого не знайдено" description="Змініть пошук або фільтр постачання." icon={<Search size={28} />} />
      )}
    </Panel>
  );
}

function InventoryShipmentsTable({ query, shipmentFilter }: { query: string; shipmentFilter: WarehousePartsShipmentFilter }) {
  const rows = useMemo(() => {
    const needle = normalize(query);
    return warehouseInventoryShipmentRows.filter((row) => {
      if (shipmentFilter !== "all" && row.proforma !== shipmentFilter) return false;
      return !needle || normalize(`${row.shipmentNumber} ${row.proforma}`).includes(needle);
    });
  }, [query, shipmentFilter]);

  if (rows.length === 0) {
    return <Panel className="shadow-none"><EmptyState compact title="Нічого не знайдено" description="Змініть пошук або фільтр постачання." icon={<Search size={28} />} /></Panel>;
  }

  return (
    <Panel className="overflow-hidden shadow-none">
      <div className="data-table-wrap" role="region" aria-label="Зведення за постачаннями" tabIndex={0}>
        <table className="data-table min-w-[760px]">
          <thead><tr><th>Постачання</th><th>Проформа</th><th className="text-right">Позицій</th><th className="text-right">Відправлено</th><th className="text-right">EUR</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-mono font-semibold">{row.shipmentNumber}</td>
                <td>{row.proforma}</td>
                <td className="text-right tabular-nums">{row.positions}</td>
                <td className="text-right tabular-nums">{row.shipped}</td>
                <td className="text-right font-semibold tabular-nums">{formatEur(row.totalEur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function InventorySummaryTab() {
  const [view, setView] = useState<InventorySummaryView>("parts");
  const [query, setQuery] = useState("");
  const [shipmentFilter, setShipmentFilter] = useState<WarehousePartsShipmentFilter>("all");

  return (
    <section className="grid gap-4">
      <KpiGrid items={[
        { label: "Всього деталей", value: warehouseInventoryTotals.parts, icon: <Package size={17} />, tone: "blue" },
        { label: "Відправлено", value: warehouseInventoryTotals.shipped, icon: <Truck size={17} /> },
        { label: "Отримано", value: warehouseInventoryTotals.received, icon: <PackageCheck size={17} />, tone: "green" },
        { label: "Всього EUR", value: formatEur(warehouseInventoryTotals.totalEur), icon: <FileSpreadsheet size={17} />, tone: "amber" },
      ]} />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук артикулу"
            placeholder="Пошук артикулу..."
          />
        )}
        filters={(
          <>
            <label className="field w-full max-w-[190px]">
              <span className="sr-only">Постачання</span>
              <select value={shipmentFilter} onChange={(event) => setShipmentFilter(event.target.value as WarehousePartsShipmentFilter)}>
                {warehousePartsShipmentFilters.map((item) => <option key={item} value={item}>{item === "all" ? "Всі постачання" : item}</option>)}
                <option disabled>34 ocean identifiers · назви не зафіксовано у spec</option>
              </select>
            </label>
            <label className="field w-full max-w-[170px]">
              <span className="sr-only">Дилер</span>
              <select defaultValue="all">
                <option value="all">Всі дилери</option>
                <option disabled>20 дилерів · назви не зафіксовано у spec</option>
              </select>
            </label>
          </>
        )}
        view={(
          <AdminSegmentedControl<InventorySummaryView>
            items={[
              { id: "parts", label: "За деталями" },
              { id: "shipments", label: "За постачаннями" },
            ]}
            value={view}
            onValueChange={setView}
            label="Вигляд складського зведення"
          />
        )}
        actions={<LockedButton title="Excel-експорт не запускається у read-only клоні"><Download size={14} /> Експорт Excel</LockedButton>}
        mobileDisclosure={{ sections: ["filters", "actions"], activeCount: Number(shipmentFilter !== "all") }}
      />
      <p className="m-0 text-[10px] text-[var(--muted-foreground)]">Фільтри працюють по доказовій вибірці; KPI зберігають повні source totals.</p>

      {view === "parts"
        ? <InventoryPartsTable query={query} shipmentFilter={shipmentFilter} />
        : <InventoryShipmentsTable query={query} shipmentFilter={shipmentFilter} />}
    </section>
  );
}

function PlacementCellEditor({ row, editing, draft, onOpen, onDraftChange, onCancel }: {
  row: (typeof warehousePlacementRows)[number];
  editing: boolean;
  draft: string;
  onOpen: () => void;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
}) {
  if (!editing) {
    return (
      <button
        type="button"
        className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] font-semibold hover:border-[var(--orange)] hover:text-[var(--orange)]"
        onClick={onOpen}
        aria-label={`Переглянути редагування комірки ${row.cell} для ${row.partNumber}`}
      >
        {row.cell}
      </button>
    );
  }

  return (
    <div className="flex min-w-[160px] items-center gap-1.5">
      <input
        autoFocus
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
          if (event.key === "Enter") event.preventDefault();
        }}
        className="input h-8 min-w-0 flex-1 font-mono text-[11px]"
        aria-label={`Комірка для ${row.partNumber}`}
      />
      <button
        type="button"
        disabled
        aria-label="Зберегти комірку — вимкнено"
        title="Збереження комірки є операційною дією і вимкнене"
        className="icon-button"
      >
        <Check size={14} />
      </button>
      <button type="button" className="icon-button" aria-label="Скасувати редагування комірки" onClick={onCancel}>
        <X size={14} />
      </button>
    </div>
  );
}

function PlacementTab() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftCell, setDraftCell] = useState("");
  const totalPages = Math.ceil(warehousePlacementSummary.total / warehousePlacementSummary.pageSize);
  const needle = normalize(query);
  const filteredRows = useMemo(() => warehousePlacementRows.filter((row) => (
    !needle || normalize(`${row.partNumber} ${row.description} ${row.cell} ${row.zone ?? ""}`).includes(needle)
  )), [needle]);
  const visibleRows = needle ? filteredRows : page === 1 ? warehousePlacementRows : [];
  const rangeStart = needle ? (filteredRows.length ? 1 : 0) : ((page - 1) * warehousePlacementSummary.pageSize) + 1;
  const rangeEnd = needle
    ? filteredRows.length
    : Math.min(page * warehousePlacementSummary.pageSize, warehousePlacementSummary.total);
  const rangeTotal = needle ? filteredRows.length : warehousePlacementSummary.total;

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
    setEditingId(null);
    setDraftCell("");
  };

  const changePage = (nextPage: number) => {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
    setEditingId(null);
    setDraftCell("");
  };

  const openEditor = (row: (typeof warehousePlacementRows)[number]) => {
    setEditingId(row.id);
    setDraftCell(row.cell);
  };

  const cancelEditor = () => {
    setEditingId(null);
    setDraftCell("");
  };

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-[20px] font-semibold">Розміщення на складі</h2>
        <p className="m-0 text-[11px] text-[var(--muted-foreground)]">{warehousePlacementSummary.total} позицій · source Excel</p>
      </div>

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={changeQuery}
            label="Пошук за артикулом, коміркою або зоною"
            placeholder="Пошук: артикул, комірка, зона…"
          />
        )}
        actions={(
          <>
            <LockedButton title="Оновлення складських даних вимкнене"><RefreshCw size={14} /> Оновити</LockedButton>
            <LockedButton title="Експорт складських даних вимкнений"><Download size={14} /> Експорт</LockedButton>
            <LockedButton title="Upload/import Excel є операційною дією і вимкнений"><Upload size={14} /> Завантажити Excel</LockedButton>
          </>
        )}
        mobileDisclosure={{ sections: ["actions"] }}
      />

      <Panel className="overflow-hidden shadow-none">
        <RepresentativeNotice shown={visibleRows.length} total={warehousePlacementSummary.total} noun="позицій" />
        {visibleRows.length ? (
          <div className="data-table-wrap" role="region" aria-label="Розміщення на складі" tabIndex={0}>
            <table className="data-table min-w-[940px]">
              <thead><tr><th>Артикул</th><th>Опис</th><th>Комірка</th><th>Зона</th><th className="text-right">Залишок 1С</th><th>Джерело</th><th>Оновлено</th></tr></thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono font-semibold">{row.partNumber}</td>
                    <td>{row.description}</td>
                    <td>
                      <PlacementCellEditor
                        row={row}
                        editing={editingId === row.id}
                        draft={editingId === row.id ? draftCell : row.cell}
                        onOpen={() => openEditor(row)}
                        onDraftChange={setDraftCell}
                        onCancel={cancelEditor}
                      />
                    </td>
                    <td className="text-[var(--faint)]">{row.zone ?? "—"}</td>
                    <td className="text-right tabular-nums">{row.oneCStock}</td>
                    <td>{row.source}</td>
                    <td>{row.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : needle ? (
          <EmptyState compact title="Немає розміщених позицій" description="Пошук у локальній доказовій вибірці не дав результатів." icon={<Search size={28} />} />
        ) : (
          <div className="grid min-h-48 place-items-center px-6 py-10 text-center">
            <div>
              <Package size={30} className="mx-auto text-[var(--faint)]" />
              <h3 className="mt-3 text-[14px] font-semibold">Source page {page}: рядки не входять до доказової вибірки</h3>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Лічильник і навігація відтворені без вигадування невідомих складських даних.</p>
            </div>
          </div>
        )}
        <footer className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <span className="tabular-nums" aria-live="polite">{rangeStart}–{rangeEnd} з {rangeTotal}</span>
          <div className="flex gap-2">
            <button type="button" className="button button-outline" disabled={needle.length > 0 || page === 1} onClick={() => changePage(page - 1)}>
              <ChevronLeft size={14} /> Назад
            </button>
            <button type="button" className="button button-outline" disabled={needle.length > 0 || page === totalPages} onClick={() => changePage(page + 1)}>
              Вперед <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </Panel>
    </section>
  );
}

export function AdminWarehousePage() {
  const [activeProcess, setActiveProcess] = useState<WarehouseProcessId>("receiving");
  const activePanelId = `warehouse-${activeProcess}-panel`;

  return (
    <AdminPage>
      <AdminPageHeader
        icon={<Warehouse size={20} />}
        title="Склад"
        description="Приймайте постачання, розбирайте нестачі, керуйте виконанням і контролюйте готовність складу в одному процесі."
      />

      <ProcessNavigation active={activeProcess} onChange={setActiveProcess} />

      <div
        id={activePanelId}
        role="tabpanel"
        aria-labelledby={`${activePanelId}-tab`}
      >
        {activeProcess === "receiving" ? <ReceivingTab /> : null}
        {activeProcess === "receipt-summary" ? <ReceiptSummaryTab /> : null}
        {activeProcess === "shortages" ? <ShortagesTab /> : null}
        {activeProcess === "fulfillment" ? <FulfillmentTab /> : null}
        {activeProcess === "inventory-summary" ? <InventorySummaryTab /> : null}
        {activeProcess === "placement" ? <PlacementTab /> : null}
      </div>
    </AdminPage>
  );
}
