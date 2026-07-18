"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  Grid2X2,
  List,
  PackageCheck,
  Ship,
  Truck,
  Upload,
} from "lucide-react";
import {
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTableShell,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import {
  EmptyState,
  InlineNotice,
  Modal,
  Panel,
  ReadOnlyButton,
  StatusBadge,
} from "@/components/shared/ui";
import {
  OceanBillDetailModal,
  OceanContainerDisclosure,
} from "@/components/admin/admin-ocean-detail";
import {
  OCEAN_KPIS,
  OCEAN_RESEARCH_COVERAGE,
  dealerEquipment,
  dealerNames,
  existingEquipmentReceipt,
  newEquipmentReceipt,
  oceanBillsOfLading,
  partsReceipt,
  type DealerEquipmentStatus,
  type DealerEquipmentType,
  type EquipmentReceiptPreview,
  type OceanBillOfLading,
  type OceanContainer,
  type OceanReceiptPreviewKind,
  type OceanStatus,
} from "@/lib/admin-ocean-freight-data";
import styles from "./admin-ocean-freight-page.module.css";

type PageTab = "ocean" | "ground" | "equipment";
type ViewMode = "table" | "cards";
type StatusFilter = "all" | "transit" | "soon" | "arrived" | "delivered";
type PreviewState =
  | { type: "upload" }
  | { type: "ground" }
  | { type: "eta" }
  | { type: "bill-detail"; billId: string }
  | { type: "receipt"; billId: string; receiptKind: OceanReceiptPreviewKind }
  | null;
type PartsTab = "composition" | "blocked" | "link" | "create" | "transfer" | "check" | "price";
type OpenReceiptPreview = (billId: string, kind: OceanReceiptPreviewKind) => void;
type OpenBillDetail = (billId: string) => void;

const oceanTabs: Array<{ id: PageTab; label: string }> = [
  { id: "ocean", label: "Морські перевезення" },
  { id: "ground", label: "Наземна доставка" },
  { id: "equipment", label: "Техніка дилерів" },
];

const statusOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Всі статуси" },
  { id: "transit", label: "В дорозі" },
  { id: "soon", label: "Скоро прибуття" },
  { id: "arrived", label: "Прибув" },
  { id: "delivered", label: "Доставлено" },
];

const dealerStatuses: DealerEquipmentStatus[] = ["Assigned", "Warehouse", "Reserved", "Demo", "Service", "Sold"];
const dealerTypes: Array<"all" | DealerEquipmentType> = ["all", "ATV", "SSV", "PWC", "3WV"];

const surfaceCard = "rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]";
const mutedText = "text-[var(--muted-foreground)]";
const compactSelect = "input h-10 bg-[var(--surface)]";

const statusMeta: Record<OceanStatus, { label: string; tone: "green" | "blue" | "amber" | "neutral" }> = {
  arrived: { label: "Прибув", tone: "green" },
  transit: { label: "В дорозі", tone: "blue" },
  soon: { label: "Скоро прибуття", tone: "amber" },
  delivered: { label: "Доставлено", tone: "green" },
  mixed: { label: "Змішаний", tone: "neutral" },
};

function formatEur(value: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function OceanKpis() {
  const items = [
    { id: "bills", label: "Total BLs", value: OCEAN_KPIS.billsOfLading, icon: <FileText size={18} />, tone: "blue" },
    { id: "transit", label: "In Transit", value: OCEAN_KPIS.inTransit, icon: <Ship size={18} />, tone: "blue" },
    { id: "containers", label: "Containers", value: OCEAN_KPIS.containers, icon: <Truck size={18} />, tone: "orange" },
    { id: "arrived", label: "Arrived", value: OCEAN_KPIS.arrived, icon: <CheckCircle2 size={18} />, tone: "green" },
  ] as const;

  return <AdminKpiGrid items={items} label="Показники морських перевезень" />;
}

function PageTabs({ active, onChange }: { active: PageTab; onChange: (tab: PageTab) => void }) {
  return (
    <AdminTabs
      items={oceanTabs.map((tab) => ({ ...tab, panelId: `ocean-${tab.id}-panel` }))}
      value={active}
      onValueChange={onChange}
      label="Розділи морських перевезень"
      mobileSelectLabel="Розділ перевезень"
    />
  );
}

function receiptStateLabel(bill: OceanBillOfLading) {
  if (bill.receipt.state === "created-unposted") {
    return `${bill.receipt.documentNumber} · не проведена`;
  }
  if (bill.receipt.state === "posted") return "Техніка · проведена";
  return "Прибуткову не створено";
}

function ReceiptPreviewButton({ bill, onOpen }: { bill: OceanBillOfLading; onOpen: OpenReceiptPreview }) {
  if (bill.receipt.state === "posted") {
    return (
      <span className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#a9d5b2] bg-[var(--green-soft)] px-3 text-[10px] font-semibold text-[var(--green)]">
        <CheckCircle2 size={13} />
        Техніка · проведена
      </span>
    );
  }

  const label = bill.receipt.state === "created-unposted" ? "Провести ПН" : "Створити прибуткову";

  return (
    <button
      type="button"
      className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[#d9c796] bg-[var(--amber-soft)] px-3 text-[10px] font-semibold text-[var(--amber)] hover:border-[var(--orange)]"
      onClick={() => onOpen(bill.id, bill.receipt.kind)}
      aria-label={`${label} · BL ${bill.id}`}
      title={`${receiptStateLabel(bill)} · відкривається лише безпечний preview`}
    >
      <PackageCheck size={13} />
      {label}
    </button>
  );
}

function EtaChip({ container, onOpen }: { container: OceanContainer; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      title="Безпечний локальний перегляд: ETA не змінюється"
      className="inline-flex min-h-7 items-center gap-1 rounded-full border-0 bg-[var(--green-soft)] px-2 text-[10px] text-[var(--green)] hover:ring-1 hover:ring-[var(--orange)]"
    >
      <CalendarDays size={12} />
      {container.arrivalLabel}
    </button>
  );
}

function ContainerTable({
  bills,
  grouped,
  expandedContainerId,
  onContainerToggle,
  onPreview,
  onBillOpen,
  onEta,
}: {
  bills: OceanBillOfLading[];
  grouped: boolean;
  expandedContainerId: string | null;
  onContainerToggle: (id: string) => void;
  onPreview: OpenReceiptPreview;
  onBillOpen: OpenBillDetail;
  onEta: () => void;
}) {
  const renderContainerRows = (container: OceanContainer, bill: OceanBillOfLading) => {
    const isExpanded = expandedContainerId === container.id;
    const disclosureId = `ocean-table-container-${container.id}`;

    return (
      <Fragment key={container.id}>
        <tr
          className={`${styles.containerRow} ${isExpanded ? styles.containerRowSelected : ""}`}
          onClick={() => onContainerToggle(container.id)}
        >
          <td>
            <button
              type="button"
              className={styles.containerTrigger}
              aria-expanded={isExpanded}
              aria-controls={disclosureId}
              onClick={(event) => {
                event.stopPropagation();
                onContainerToggle(container.id);
              }}
            >
              <ChevronDown size={13} className={`${styles.disclosureChevron} ${isExpanded ? styles.disclosureChevronOpen : ""}`} />
              <span className="font-medium">{container.name}</span>
            </button>
            {!grouped ? (
              <button
                type="button"
                className={`${styles.billTrigger} mt-1 text-[10px] text-[var(--muted-foreground)]`}
                aria-haspopup="dialog"
                onClick={(event) => {
                  event.stopPropagation();
                  onBillOpen(bill.id);
                }}
              >
                BL {bill.id}
              </button>
            ) : null}
          </td>
          <td className="font-mono font-semibold">{container.number}</td>
          <td><StatusBadge tone="blue">{container.cargoType === "units" ? "Одиниці" : "Запчастини"}</StatusBadge></td>
          <td className="font-mono text-[11px]">{container.proforma}</td>
          <td>{formatEur(container.eur)}</td>
          <td><strong>{container.assigned}/{container.total}</strong></td>
          <td>
            <span className={`block text-[10px] ${bill.receipt.state === "created-unposted" ? "text-[var(--amber)]" : bill.receipt.state === "posted" ? "text-[var(--green)]" : mutedText}`}>
              {receiptStateLabel(bill)}
            </span>
            <span className={`block text-[9px] ${mutedText}`}>Дія на рівні BL</span>
          </td>
          <td><EtaChip container={container} onOpen={onEta} /></td>
          <td><StatusBadge tone={statusMeta[container.status].tone}>{statusMeta[container.status].label}</StatusBadge></td>
        </tr>
        {isExpanded ? (
          <tr className={styles.disclosureRow}>
            <td colSpan={9} className={styles.disclosureCell}>
              <OceanContainerDisclosure bill={bill} container={container} id={disclosureId} onOpenBill={() => onBillOpen(bill.id)} />
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  };

  return (
    <AdminTableShell scrollLabel="Контейнери морських перевезень">
      <table className="data-table min-w-[1080px]">
          <thead>
            <tr><th>Назва</th><th>Контейнер</th><th>Тип</th><th>Проформа</th><th>EUR</th><th>Одиниці</th><th>Прихід</th><th>ETA</th><th>Статус</th></tr>
          </thead>
          <tbody>
            {grouped ? bills.map((bill) => (
              <Fragment key={bill.id}>
                <tr className="bg-[var(--surface-subtle)]">
                  <td colSpan={9} className="!py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={styles.billTrigger}
                        aria-haspopup="dialog"
                        onClick={() => onBillOpen(bill.id)}
                      >
                        <FileText size={15} className="text-[var(--blue)]" />
                        <strong className="font-mono">{bill.id}</strong>
                      </button>
                      <StatusBadge tone={statusMeta[bill.status].tone}>{statusMeta[bill.status].label}</StatusBadge>
                      <span className={mutedText}>{bill.containers.length} {bill.containers.length === 1 ? "container" : "containers"}</span>
                      <span className={`text-[10px] ${bill.receipt.state === "created-unposted" ? "text-[var(--amber)]" : bill.receipt.state === "posted" ? "text-[var(--green)]" : mutedText}`}>{receiptStateLabel(bill)}</span>
                      <span className="ml-auto"><ReceiptPreviewButton bill={bill} onOpen={onPreview} /></span>
                    </div>
                  </td>
                </tr>
                {bill.containers.map((container) => renderContainerRows(container, bill))}
              </Fragment>
            )) : bills.flatMap((bill) => bill.containers.map((container) => renderContainerRows(container, bill)))}
          </tbody>
      </table>
    </AdminTableShell>
  );
}

function BillCards({
  bills,
  grouped,
  expandedContainerId,
  onContainerToggle,
  onPreview,
  onBillOpen,
  onEta,
}: {
  bills: OceanBillOfLading[];
  grouped: boolean;
  expandedContainerId: string | null;
  onContainerToggle: (id: string) => void;
  onPreview: OpenReceiptPreview;
  onBillOpen: OpenBillDetail;
  onEta: () => void;
}) {
  if (!grouped) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {bills.flatMap((bill) => bill.containers.map((container) => {
          const isExpanded = expandedContainerId === container.id;
          const contentId = `ocean-card-container-${container.id}`;
          return (
            <article key={container.id} className={`${styles.cardContainer} ${isExpanded ? styles.cardContainerSelected : ""}`}>
              <button type="button" className={styles.cardContainerTrigger} aria-expanded={isExpanded} aria-controls={contentId} onClick={() => onContainerToggle(container.id)}>
                <span className={styles.cardContainerMain}>
                  <strong className="font-mono">{container.number}</strong>
                  <span className={`mt-1 block text-[10px] ${mutedText}`}>BL {bill.id} · {container.proforma}</span>
                </span>
                <StatusBadge tone={statusMeta[container.status].tone}>{statusMeta[container.status].label}</StatusBadge>
                <ChevronDown size={15} className={`${styles.disclosureChevron} ${isExpanded ? styles.disclosureChevronOpen : ""}`} />
              </button>
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2">
                <button type="button" className={`${styles.billTrigger} text-[10px] text-[var(--blue)]`} aria-haspopup="dialog" onClick={() => onBillOpen(bill.id)}>Деталі BL {bill.id}</button>
                <span className="ml-auto"><EtaChip container={container} onOpen={onEta} /></span>
              </div>
              {isExpanded ? <div className={styles.cardDisclosure}><OceanContainerDisclosure bill={bill} container={container} id={contentId} onOpenBill={() => onBillOpen(bill.id)} /></div> : null}
            </article>
          );
        }))}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {bills.map((bill) => {
        const meta = statusMeta[bill.status];
        return (
          <article key={bill.id} className={`${surfaceCard} overflow-hidden`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <button type="button" className={`${styles.cardBillTrigger} px-5 py-4`} aria-haspopup="dialog" onClick={() => onBillOpen(bill.id)}>
                <Ship size={18} className="shrink-0 text-[var(--blue)]" />
                <span className="min-w-0 flex-1">
                  <strong className="font-mono">{bill.id}</strong>
                  <span className={`ml-2 ${mutedText}`}>{bill.containers.length} {bill.containers.length === 1 ? "container" : "containers"}</span>
                  <span className={`mt-1 block text-[10px] ${mutedText}`}>{bill.carrier ? `${bill.carrier} · ` : ""}{bill.route ? `${bill.route} · ` : ""}ETA: {bill.eta}</span>
                </span>
                <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
              </button>
              <div className="px-5 pb-4 sm:py-0 sm:pl-0 sm:pr-4"><ReceiptPreviewButton bill={bill} onOpen={onPreview} /></div>
            </div>
            <div className={styles.cardContainerList}>
              {bill.containers.map((container) => {
                const isExpanded = expandedContainerId === container.id;
                const contentId = `ocean-grouped-card-container-${container.id}`;
                return (
                  <div key={container.id} className={`${styles.cardContainer} ${isExpanded ? styles.cardContainerSelected : ""}`}>
                    <button type="button" className={styles.cardContainerTrigger} aria-expanded={isExpanded} aria-controls={contentId} onClick={() => onContainerToggle(container.id)}>
                      <span className={styles.cardContainerMain}>
                        <strong>{container.name}</strong>
                        <span className={`ml-2 font-mono text-[11px] ${mutedText}`}>{container.number}</span>
                        <span className={`mt-1 block text-[10px] ${mutedText}`}>PRF {container.proforma} · {formatEur(container.eur)} · {container.assigned}/{container.total}</span>
                      </span>
                      <StatusBadge tone={statusMeta[container.status].tone}>{statusMeta[container.status].label}</StatusBadge>
                      <ChevronDown size={15} className={`${styles.disclosureChevron} ${isExpanded ? styles.disclosureChevronOpen : ""}`} />
                    </button>
                    <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2"><EtaChip container={container} onOpen={onEta} /></div>
                    {isExpanded ? <div className={styles.cardDisclosure}><OceanContainerDisclosure bill={bill} container={container} id={contentId} onOpenBill={() => onBillOpen(bill.id)} /></div> : null}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OceanTab({
  onReceiptPreview,
  onBillOpen,
  onEta,
}: {
  onReceiptPreview: OpenReceiptPreview;
  onBillOpen: OpenBillDetail;
  onEta: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [grouped, setGrouped] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [expandedContainerId, setExpandedContainerId] = useState<string | null>(null);

  const filteredBills = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("uk");
    return oceanBillsOfLading.flatMap((bill) => {
      const filteredContainers = bill.containers.filter((container) => {
        const matchesStatus = status === "all" || container.status === status || bill.status === status;
        const haystack = `${bill.id} ${bill.carrier || ""} ${bill.route || ""} ${container.name} ${container.number} ${container.proforma}`.toLocaleLowerCase("uk");
        return matchesStatus && (!query || haystack.includes(query));
      });
      return filteredContainers.length ? [{ ...bill, containers: filteredContainers }] : [];
    });
  }, [search, status]);

  const isFiltered = search.trim().length > 0 || status !== "all";
  const visibleCount = filteredBills.reduce((count, bill) => count + bill.containers.length, 0);
  const visibleBillCount = filteredBills.length;
  const showCards = view === "cards";
  const toggleContainer = (id: string) => setExpandedContainerId((current) => current === id ? null : id);

  return (
    <div
      id="ocean-ocean-panel"
      className="grid gap-4"
      role="tabpanel"
      aria-labelledby="ocean-ocean-panel-tab"
    >
      <OceanKpis />
      <AdminToolbar
        search={(
          <AdminSearchField
            value={search}
            onValueChange={setSearch}
            label="Пошук контейнера, BL, проформи"
            placeholder="Пошук контейнера, BL, проформи..."
          />
        )}
        filters={(
          <select className={compactSelect} aria-label="Статус морського перевезення" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            {statusOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        )}
        view={(
          <AdminSegmentedControl
            items={[
              { id: "table", label: "Таблиця", icon: <List size={15} /> },
              { id: "cards", label: "Картки", icon: <Grid2X2 size={15} /> },
            ]}
            value={view}
            onValueChange={setView}
            label="Вид колекції"
          />
        )}
        actions={(
          <button type="button" aria-pressed={grouped} className={`button button-outline ${grouped ? "!border-[var(--orange)] !text-[var(--orange)]" : ""}`} onClick={() => setGrouped((value) => !value)}>
            <Grid2X2 size={14} /> Групувати за BL
          </button>
        )}
        meta={(
          <span>
            {visibleBillCount}/{OCEAN_RESEARCH_COVERAGE.billsOfLading} BL · {visibleCount}/{OCEAN_RESEARCH_COVERAGE.containers} контейнерів
            {isFiltered ? " · фільтр активний" : ""}
          </span>
        )}
      />
      {filteredBills.length === 0 ? (
        <Panel><EmptyState compact title="Контейнери не знайдено" description="Змініть пошуковий запит або статус." /></Panel>
      ) : showCards ? (
        <BillCards bills={filteredBills} grouped={grouped} expandedContainerId={expandedContainerId} onContainerToggle={toggleContainer} onPreview={onReceiptPreview} onBillOpen={onBillOpen} onEta={onEta} />
      ) : (
        <>
          <div className="hidden md:block"><ContainerTable bills={filteredBills} grouped={grouped} expandedContainerId={expandedContainerId} onContainerToggle={toggleContainer} onPreview={onReceiptPreview} onBillOpen={onBillOpen} onEta={onEta} /></div>
          <div className="md:hidden"><BillCards bills={filteredBills} grouped={grouped} expandedContainerId={expandedContainerId} onContainerToggle={toggleContainer} onPreview={onReceiptPreview} onBillOpen={onBillOpen} onEta={onEta} /></div>
        </>
      )}
    </div>
  );
}

function GroundTab({ onOpen }: { onOpen: () => void }) {
  const [query, setQuery] = useState("");

  return (
    <div
      id="ocean-ground-panel"
      className="grid gap-4"
      role="tabpanel"
      aria-labelledby="ocean-ground-panel-tab"
    >
      <AdminToolbar
        search={<AdminSearchField value={query} onValueChange={setQuery} label="Пошук наземного постачання" placeholder="Пошук контейнера, BL, проформи..." />}
        actions={<button type="button" className="button button-primary" onClick={onOpen}><Truck size={14} /> Додати наземну</button>}
        meta={query ? "0 результатів" : "Наземних постачань немає"}
      />
      <AdminTableShell scrollLabel="Наземні постачання">
        <EmptyState icon={<Truck size={28} />} title="Поки немає наземних постачань" description="Додайте за проформою." action={<button type="button" className="button button-outline" onClick={onOpen}>Додати наземну</button>} />
      </AdminTableShell>
    </div>
  );
}

function DealerEquipmentTab() {
  const [dealer, setDealer] = useState<(typeof dealerNames)[number]>(dealerNames[0]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<"all" | "2026">("all");
  const [type, setType] = useState<"all" | DealerEquipmentType>("all");
  const [status, setStatus] = useState<DealerEquipmentStatus>("Assigned");

  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk");
    return dealerEquipment.filter((item) => {
      const haystack = `${item.vin} ${item.engine} ${item.model} ${item.code}`.toLocaleLowerCase("uk");
      return item.dealer === dealer && (year === "all" || item.year === Number(year)) && (type === "all" || item.type === type) && item.status === status && (!normalized || haystack.includes(normalized));
    });
  }, [dealer, query, status, type, year]);

  return (
    <div
      id="ocean-equipment-panel"
      className="grid gap-4"
      role="tabpanel"
      aria-labelledby="ocean-equipment-panel-tab"
    >
      <AdminToolbar
        search={<AdminSearchField value={query} onValueChange={setQuery} label="Пошук техніки дилера" placeholder="Пошук: VIN, № двигуна, модель, код" />}
        filters={(
          <>
            <select className={compactSelect} aria-label="Дилер" value={dealer} onChange={(event) => setDealer(event.target.value as (typeof dealerNames)[number])}>{dealerNames.map((name) => <option key={name}>{name}</option>)}</select>
            <select className={compactSelect} aria-label="Рік техніки" value={year} onChange={(event) => setYear(event.target.value as "all" | "2026")}><option value="all">Всі роки</option><option value="2026">2026</option></select>
          </>
        )}
        meta={`${rows.length} одиниць`}
      />
      <AdminToolbar
        contained={false}
        filters={(
          <AdminSegmentedControl
            items={dealerTypes.map((item) => ({ id: item, label: item === "all" ? "Всі типи" : item }))}
            value={type}
            onValueChange={setType}
            label="Тип техніки"
          />
        )}
        view={(
          <AdminSegmentedControl
            items={dealerStatuses.map((item) => ({ id: item, label: item, count: item === "Assigned" ? 15 : 0 }))}
            value={status}
            onValueChange={setStatus}
            label="Статус техніки"
          />
        )}
      />
      <AdminTableShell scrollLabel="Техніка дилерів">
        {rows.length ? <table className="data-table min-w-[1100px]"><thead><tr><th>Дилер</th><th>Код / модель</th><th>VIN / двигун</th><th>Рік</th><th>Статус</th><th>Відправка</th><th>Клієнт</th><th>Дата</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{item.dealer}</td><td><strong>{item.code}</strong><span className={`block text-[10px] ${mutedText}`}>{item.model}</span></td><td><span className="font-mono text-[11px]">{item.vin}</span><span className={`block font-mono text-[10px] ${mutedText}`}>{item.engine}</span></td><td>{item.year}</td><td><StatusBadge tone="blue">{item.status}</StatusBadge></td><td className="font-mono">{item.shipment}</td><td>{item.client}</td><td>{item.date}</td></tr>)}</tbody></table> : <EmptyState compact title="Техніку не знайдено" description="Змініть дилера, тип, статус або пошуковий запит." />}
      </AdminTableShell>
    </div>
  );
}

function GroundPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Додати наземне постачання" description="Назва постачання підтягується з таблиці за проформою, якщо залишити порожнім" className="!w-[min(680px,100%)]" footer={<><button type="button" className="button button-outline" onClick={onClose}>Скасувати</button><ReadOnlyButton>Створити постачання</ReadOnlyButton></>}>
      <div className="grid gap-5">
        <div className="rounded-md border border-dashed border-[var(--border)] p-4"><ReadOnlyButton><Upload size={14} /> Завантажити проформу (PDF)</ReadOnlyButton><p className={`mb-0 mt-2 text-[10px] ${mutedText}`}>Поля нижче підставляться і залишаться редагованими у робочому середовищі.</p></div>
        <div className="grid gap-3 sm:grid-cols-3"><label className="field"><span>Номер проформи</span><input disabled placeholder="напр. 1022830926" /></label><label className="field"><span>Назва постачання (необов’язково)</span><input disabled /></label><label className="field"><span>ETA (необов’язково)</span><input disabled type="date" /></label></div>
        <div><div className="mb-2 flex items-center justify-between"><strong>Техніка</strong><span className={`text-[10px] ${mutedText}`}>Усього 0 од.</span></div><div className="grid gap-2 rounded-md border border-[var(--border)] p-3 sm:grid-cols-[1fr_1.5fr_80px_110px]"><label className="field"><span>Код моделі</span><input disabled value="26TB" readOnly /></label><label className="field"><span>Модель</span><input disabled value="PWC GTX LTD 325" readOnly /></label><label className="field"><span>К-ть</span><input disabled value="1" readOnly /></label><label className="field"><span>Ціна €</span><input disabled value="EUR" readOnly /></label></div><div className="mt-2"><ReadOnlyButton>Додати модель</ReadOnlyButton></div></div>
      </div>
    </Modal>
  );
}

function UploadPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Завантаження документів відправки" className="!w-[min(1120px,100%)]" footer={<button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>}>
      <label className="flex min-h-[205px] cursor-not-allowed flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] p-8 text-center opacity-80">
        <input type="file" accept="application/pdf" multiple disabled className="sr-only" />
        <Upload size={38} className="text-[var(--muted-foreground)]" />
        <strong className="mt-4 text-[15px]">Перетягніть PDF файли сюди</strong>
        <span className={`mt-1 text-[12px] ${mutedText}`}>або натисніть для вибору файлів</span>
        <span className={`mt-4 text-[10px] ${mutedText}`}>BL + Проформи (1-10 файлів). Автовизначення типу документа.</span>
      </label>
    </Modal>
  );
}

function ReceiptGroupTable({ receipt, editableNames = false }: { receipt: EquipmentReceiptPreview; editableNames?: boolean }) {
  return <div className="grid gap-3">{receipt.groups.map((group) => <section key={group.containerNumber} className="overflow-hidden rounded-md border border-[var(--border)]"><header className="flex flex-wrap items-center gap-3 bg-[var(--surface-subtle)] px-4 py-3"><strong className="font-mono">{group.containerNumber}</strong><span className={`text-[10px] ${mutedText}`}>PRF: {group.proforma}</span><span className={`text-[10px] ${mutedText}`}>{group.units} units</span><StatusBadge tone="blue">Доказові рядки {group.rows.length}/{group.units}</StatusBadge><strong className="ml-auto">{formatEur(group.totalEur)}</strong></header><div className="data-table-wrap"><table className="data-table min-w-[760px]"><thead><tr><th>#</th><th>Model</th><th>VIN</th><th>Engine #</th><th>EUR</th><th>USD</th></tr></thead><tbody>{group.rows.map((unit) => <tr key={unit.id}><td>{unit.number}</td><td><span className="mr-2 font-mono text-[var(--blue)]">{unit.code}</span>{editableNames ? <input disabled value={unit.model} readOnly className="h-8 min-w-[270px] rounded border border-[var(--border)] bg-[var(--surface-subtle)] px-2" /> : unit.model}</td><td className="font-mono text-[11px]">{unit.vin}</td><td className="font-mono text-[11px]">{unit.engine}</td><td>{formatEur(unit.eur)}</td><td>{unit.usd ? `$${unit.usd}` : "—"}</td></tr>)}</tbody></table></div></section>)}</div>;
}

function EquipmentReceiptModal({ receipt, open, onClose }: { receipt: EquipmentReceiptPreview; open: boolean; onClose: () => void }) {
  const evidenceCoverage = receipt.billOfLadingId === existingEquipmentReceipt.billOfLadingId
    ? OCEAN_RESEARCH_COVERAGE.existingEquipment
    : OCEAN_RESEARCH_COVERAGE.newEquipment;
  const existing = Boolean(receipt.existingDocument);
  return (
    <Modal open={open} onClose={onClose} title="Створити прибуткову" description={`BL: ${receipt.billOfLadingId}`} className="!w-[min(900px,100%)]" footer={<><button type="button" className="button button-outline" onClick={onClose}>Скасувати</button><ReadOnlyButton>{existing ? "ПН уже создана" : "Підтвердити та створити"}</ReadOnlyButton></>}>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-4"><label className="field max-w-[180px]"><span>Комерційний курс EUR/USD</span><input disabled value={receipt.commercialRate.toFixed(4)} readOnly /></label><span>Units: <strong>{receipt.unitCount}</strong></span><span>Total EUR: <strong>{formatEur(receipt.totalEur)}</strong></span></div>
        <InlineNotice>Доказове покриття таблиці: <strong>{evidenceCoverage.evidencedRows}/{evidenceCoverage.sourceTotal}</strong> одиниць. Показані тільки рядки, зафіксовані у source evidence; відсутні рядки не домодельовані.</InlineNotice>
        {existing ? <div className="rounded-md border border-[#d9c796] bg-[var(--amber-soft)] p-4 text-[var(--amber)]"><div className="flex flex-wrap items-center gap-3"><FileCheck2 size={18} /><div className="min-w-[190px] flex-1"><strong className="block">ПН создана, не проведена</strong><span className="text-[10px]">Документов 1C: 1 · проведено: 0</span></div><ReadOnlyButton>Проверить статус 1C</ReadOnlyButton><ReadOnlyButton>Провести в 1C</ReadOnlyButton></div><StatusBadge tone="amber">{receipt.existingDocument?.number} · не проведена</StatusBadge></div> : null}
        <ReceiptGroupTable receipt={receipt} editableNames={!existing} />
        {existing ? <InlineNotice tone="warning">Повторное создание заблокировано: {receipt.existingDocument?.number}</InlineNotice> : <InlineNotice>Фінальна дія вимкнена. Preview не змінює receipt, статус BL або складський стан.</InlineNotice>}
      </div>
    </Modal>
  );
}

function SummaryEquipmentReceiptModal({ bill, open, onClose }: { bill: OceanBillOfLading; open: boolean; onClose: () => void }) {
  const unitCount = bill.containers.reduce((total, container) => total + container.total, 0);
  const assignedCount = bill.containers.reduce((total, container) => total + container.assigned, 0);
  const totalEur = bill.containers.reduce((total, container) => total + container.eur, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Створити прибуткову"
      description={`BL: ${bill.id}`}
      className="!w-[min(900px,100%)]"
      footer={(
        <>
          <button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>
          <ReadOnlyButton>Підтвердити та створити</ReadOnlyButton>
        </>
      )}
    >
      <div className="grid gap-4">
        <AdminKpiGrid
          columns={3}
          label={`Підсумок BL ${bill.id}`}
          items={[
            { id: "containers", label: "Контейнери", value: bill.containers.length, icon: <Ship size={17} />, tone: "blue" },
            { id: "units", label: "Одиниці", value: `${assignedCount}/${unitCount}`, icon: <PackageCheck size={17} />, tone: "orange" },
            { id: "eur", label: "Сума EUR", value: formatEur(totalEur), icon: <FileText size={17} />, tone: "green" },
          ]}
        />
        <InlineNotice tone="warning">
          Для цього BL джерело підтверджує контейнерний підсумок, але не повний VIN-склад приходної. Preview не домодельовує відсутні рядки й не змінює документи, статуси чи склад.
        </InlineNotice>
        <AdminTableShell scrollLabel={`Контейнери BL ${bill.id}`}>
          <table className="data-table min-w-[720px]">
            <thead><tr><th>Контейнер</th><th>Назва</th><th>Проформа</th><th>Одиниці</th><th>EUR</th></tr></thead>
            <tbody>{bill.containers.map((container) => (
              <tr key={container.id}>
                <td className="font-mono font-semibold">{container.number}</td>
                <td>{container.name}</td>
                <td className="font-mono">{container.proforma}</td>
                <td>{container.assigned}/{container.total}</td>
                <td>{formatEur(container.eur)}</td>
              </tr>
            ))}</tbody>
          </table>
        </AdminTableShell>
      </div>
    </Modal>
  );
}

function PartsReceiptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<PartsTab>("composition");
  const tabItems: Array<{ id: PartsTab; label: string; count: number }> = [
    { id: "composition", label: "Состав ПН", count: partsReceipt.linesReady },
    { id: "blocked", label: "Блокеры", count: partsReceipt.issueCounts.blocked },
    { id: "link", label: "Связать", count: partsReceipt.issueCounts.link },
    { id: "create", label: "Завести в 1C", count: partsReceipt.issueCounts.create },
    { id: "transfer", label: "Перевод", count: partsReceipt.issueCounts.transfer },
    { id: "check", label: "Проверить", count: partsReceipt.issueCounts.check },
    { id: "price", label: "Цена", count: partsReceipt.issueCounts.price },
  ];
  const metrics = [
    [`${partsReceipt.linesReady}/${partsReceipt.linesTotal}`, "строк ПН"],
    [new Intl.NumberFormat("uk-UA").format(partsReceipt.quantity), "штук"],
    [formatEur(partsReceipt.totalEur), "сумма EUR"],
    [`${partsReceipt.mapped}/${partsReceipt.mappedTotal}`, "1C маппинг"],
    ["0", "связать"], ["0", "завести"], ["0", "перевод"], ["0", "цена"],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Подготовка ПН запчастей" description={partsReceipt.shipment} className="!w-[min(1120px,100%)]" footer={<><button type="button" className="button button-outline" onClick={onClose}>Закрыть</button><ReadOnlyButton>Пересчитать сверху</ReadOnlyButton><ReadOnlyButton>ПН уже создана</ReadOnlyButton></>}>
      <div className="grid gap-4">
        <InlineNotice tone="warning">ПН уже создана: {partsReceipt.document.number} · не проведена</InlineNotice>
        <InlineNotice tone="warning">ПН создана, не проведена. Создано документов: 1, проведено: 0.</InlineNotice>
        <InlineNotice>Доказове покриття таблиці: <strong>{OCEAN_RESEARCH_COVERAGE.parts.evidencedRows}/{OCEAN_RESEARCH_COVERAGE.parts.sourceTotal}</strong> готових рядків. Решта рядків не домодельована.</InlineNotice>
        <section className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{metrics.map(([value, label]) => <div key={label} className={`${surfaceCard} p-3`}><strong className="block text-[18px]">{value}</strong><span className={`text-[9px] uppercase ${mutedText}`}>{label}</span></div>)}</section>
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3"><span className="mr-auto"><strong>Документы 1C</strong><StatusBadge tone="amber">{partsReceipt.document.number} · synced · не проведена</StatusBadge></span><ReadOnlyButton>Проверить статус 1C</ReadOnlyButton><ReadOnlyButton>Провести в 1C</ReadOnlyButton></div>
        <AdminTabs
          items={tabItems.map((item) => ({ ...item, panelId: `parts-receipt-${item.id}-panel` }))}
          value={tab}
          onValueChange={setTab}
          label="Етапи підготовки ПН запчастин"
          mobileSelectLabel="Етап підготовки"
          size="compact"
        />
        {tab === "composition" ? (
          <div
            id="parts-receipt-composition-panel"
            role="tabpanel"
            aria-labelledby="parts-receipt-composition-panel-tab"
            className="overflow-hidden rounded-md border border-[var(--border)]"
          >
            <div className={`border-b border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-[10px] uppercase ${mutedText}`}>
              Состав приходной накладной · доказові рядки {OCEAN_RESEARCH_COVERAGE.parts.evidencedRows}/{OCEAN_RESEARCH_COVERAGE.parts.sourceTotal}
            </div>
            <div className="data-table-wrap">
              <table className="data-table min-w-[840px]">
                <thead><tr><th>Артикул</th><th>Наименование</th><th>1C карточка</th><th>Папка</th><th>Кол-во</th><th>Цена EUR</th></tr></thead>
                <tbody>{partsReceipt.lines.map((line) => <tr key={line.article}><td><strong>{line.article}</strong><span className={`block text-[10px] ${mutedText}`}>{line.sourceCategory}</span></td><td>{line.name}</td><td><StatusBadge tone="green">Код 1C: {line.oneCCard}</StatusBadge></td><td className="max-w-[240px] text-[10px]">{line.folder}</td><td>{line.quantity}</td><td>{formatEur(line.eur)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            id={`parts-receipt-${tab}-panel`}
            role="tabpanel"
            aria-labelledby={`parts-receipt-${tab}-panel-tab`}
            className="panel shadow-none"
          >
            <EmptyState compact title="Проблем не знайдено" description="У джерельному стані цей розділ має нульовий лічильник. Операційні дії вимкнені." />
          </div>
        )}
      </div>
    </Modal>
  );
}

function ReceiptPreviewModal({
  preview,
  onClose,
}: {
  preview: Extract<Exclude<PreviewState, null>, { type: "receipt" }> | null;
  onClose: () => void;
}) {
  if (!preview) return null;

  const bill = oceanBillsOfLading.find((item) => item.id === preview.billId);
  if (!bill) return null;

  if (preview.receiptKind === "parts") {
    return <PartsReceiptModal open onClose={onClose} />;
  }

  if (preview.billId === existingEquipmentReceipt.billOfLadingId) {
    return <EquipmentReceiptModal receipt={existingEquipmentReceipt} open onClose={onClose} />;
  }

  if (preview.billId === newEquipmentReceipt.billOfLadingId) {
    return <EquipmentReceiptModal receipt={newEquipmentReceipt} open onClose={onClose} />;
  }

  return <SummaryEquipmentReceiptModal bill={bill} open onClose={onClose} />;
}

function EtaSafetyPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} title="ETA — лише перегляд" description="Дата та статус контейнера не змінюються" footer={<button type="button" className="button button-outline" onClick={onClose}>Закрити</button>}><InlineNotice tone="warning">Цей date-chip у вихідній адмінці виконував зміну одразу. У клоні він відкриває тільки це інформаційне вікно; Save, Apply та Оновити ETA відсутні.</InlineNotice></Modal>;
}

export function AdminOceanFreightPage() {
  const [tab, setTab] = useState<PageTab>("ocean");
  const [preview, setPreview] = useState<PreviewState>(null);
  const closePreview = () => setPreview(null);
  const receiptPreview = preview?.type === "receipt" ? preview : null;
  const detailBill = preview?.type === "bill-detail"
    ? oceanBillsOfLading.find((bill) => bill.id === preview.billId) ?? null
    : null;

  return (
    <AdminPage>
      <AdminPageHeader
        icon={<Ship size={21} />}
        title="Морські перевезення"
        description="Відстеження контейнерів та розподіл техніки"
        actions={<div className="flex flex-col gap-2 sm:flex-row"><button type="button" className="button button-primary" onClick={() => setPreview({ type: "upload" })}><Upload size={14} /> Завантажити документи</button><ReadOnlyButton>Оновити ETA</ReadOnlyButton></div>}
      />
      <PageTabs active={tab} onChange={setTab} />
      {tab === "ocean" ? (
        <OceanTab
          onReceiptPreview={(billId, receiptKind) => setPreview({ type: "receipt", billId, receiptKind })}
          onBillOpen={(billId) => setPreview({ type: "bill-detail", billId })}
          onEta={() => setPreview({ type: "eta" })}
        />
      ) : null}
      {tab === "ground" ? <GroundTab onOpen={() => setPreview({ type: "ground" })} /> : null}
      {tab === "equipment" ? <DealerEquipmentTab /> : null}

      <UploadPreview open={preview?.type === "upload"} onClose={closePreview} />
      <GroundPreview open={preview?.type === "ground"} onClose={closePreview} />
      <ReceiptPreviewModal preview={receiptPreview} onClose={closePreview} />
      {detailBill ? <OceanBillDetailModal bill={detailBill} open onClose={closePreview} /> : null}
      <EtaSafetyPreview open={preview?.type === "eta"} onClose={closePreview} />
    </AdminPage>
  );
}
