"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileDown,
  FileText,
  Landmark,
  LockKeyhole,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { RendererViewSwitch } from "@/components/appearance/renderer-view-switch";
import {
  AdminIconAction,
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTableShell,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { EmptyState, InlineNotice, Modal, Panel, StatusBadge } from "@/components/shared/ui";
import {
  formedInvoices,
  invoiceAppendices,
  invoiceAppendixSourceTotals,
  invoiceContracts,
  invoiceCostCards,
  invoiceCostKpis,
  invoiceCostMonths,
  invoiceCostSourceCounts,
  invoicePageKpis,
  invoiceShipmentGroups,
  invoiceShipmentSourceCounts,
  type AppendixPreview,
  type FormedInvoice,
  type InvoiceAppendix,
  type InvoiceContract,
  type InvoiceCostCard,
  type InvoiceCostMonthId,
  type InvoiceCostView,
  type InvoiceShipmentGroup,
  type InvoiceShipmentFilter,
  type InvoiceTabId,
} from "@/lib/admin-invoices-data";

const loadAstryxAdminInvoicesView = () => import("./astryx-admin-invoices-view");

const tabItems: ReadonlyArray<{ id: InvoiceTabId; label: string; icon: typeof FileText }> = [
  { id: "contracts", label: "Контракти", icon: FileText },
  { id: "appendices", label: "Додатки", icon: FileText },
  { id: "invoices", label: "Інвойси", icon: FileText },
  { id: "cost", label: "Собівартість", icon: DollarSign },
];

const uploadLabels: Partial<Record<InvoiceTabId, string>> = {
  appendices: "Завантажити проформи",
  invoices: "Завантажити VIN",
  cost: "Завантажити документи",
};

const uploadLockedReasons: Partial<Record<InvoiceTabId, string>> = {
  appendices: "Потрібне підключення сервісу документів",
  invoices: "Потрібна інтеграція імпорту VIN з 1С",
  cost: "Потрібне підключення сервісу документів",
};

const pageKpiIcons = {
  shipments: FileText,
  ready: Clock3,
  missing: AlertTriangle,
  formed: CheckCircle2,
} as const;

export type InvoiceSummaryPreview =
  | { kind: "shipment"; item: InvoiceShipmentGroup }
  | { kind: "formed"; item: FormedInvoice }
  | null;

export type AdminInvoicesViewProps = {
  tab: InvoiceTabId;
  contractsCreating: boolean;
  contractsQuery: string;
  selectedContract: InvoiceContract | null;
  appendicesQuery: string;
  selectedAppendix: InvoiceAppendix | null;
  invoiceQuery: string;
  invoiceFilter: InvoiceShipmentFilter;
  invoicePreview: InvoiceSummaryPreview;
  costView: InvoiceCostView;
  costQuery: string;
  costMonthMenuOpen: boolean;
  selectedMonths: readonly InvoiceCostMonthId[];
  selectedCostCard: InvoiceCostCard | null;
  onTabChange: (tab: InvoiceTabId) => void;
  onContractsCreatingChange: (creating: boolean) => void;
  onContractsQueryChange: (query: string) => void;
  onSelectedContractChange: (contract: InvoiceContract | null) => void;
  onAppendicesQueryChange: (query: string) => void;
  onSelectedAppendixChange: (appendix: InvoiceAppendix | null) => void;
  onInvoiceQueryChange: (query: string) => void;
  onInvoiceFilterChange: (filter: InvoiceShipmentFilter) => void;
  onInvoicePreviewChange: (preview: InvoiceSummaryPreview) => void;
  onCostViewChange: (view: InvoiceCostView) => void;
  onCostQueryChange: (query: string) => void;
  onCostMonthMenuOpenChange: (open: boolean) => void;
  onSelectedMonthsChange: (months: readonly InvoiceCostMonthId[]) => void;
  onSelectedCostCardChange: (card: InvoiceCostCard | null) => void;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function LockedButton({ children, className = "", title }: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <button
      type="button"
      className={`button button-outline ${className}`}
      disabled
      aria-disabled="true"
      title={title}
    >
      <LockKeyhole size={13} />
      {children}
    </button>
  );
}

function RepresentativeNotice({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <span>
      {total} {noun} · у поточному перегляді {shown}
    </span>
  );
}

function PageKpis() {
  return (
    <AdminKpiGrid
      label="Показники інвойсів"
      hideOnMobile
      items={invoicePageKpis.map((item) => {
        const Icon = pageKpiIcons[item.id];
        return { ...item, icon: <Icon size={17} /> };
      })}
    />
  );
}

function InvoiceTabs({ active, onChange }: { active: InvoiceTabId; onChange: (tab: InvoiceTabId) => void }) {
  return (
    <AdminTabs
      items={tabItems.map((item) => {
        const Icon = item.icon;
        return { id: item.id, label: item.label, icon: <Icon size={14} />, panelId: `invoices-${item.id}-panel` };
      })}
      value={active}
      onValueChange={onChange}
      label="Інвойси та документи"
      mobileSelectLabel="Розділ документів"
    />
  );
}

const previewFields = [
  ["Коротка назва", "CR/DMS-01"],
  ["Повний номер контракту", "№ CR/DMS-01 of/від 23.07.2025"],
  ["Назва компанії постачальника", "CREATIVE TRADE GROUP"],
  ["Директор / Підписант", "Gregory Katz"],
  ["Адреса", "10 Mead Street, Suite 11"],
  ["Місто", "Stamford, CT 06907, USA"],
  ["Вантажовідправник", "BRP MEXICO S.A. DE CV"],
  ["ІПН", "BME-970909-GC4"],
] as const;

function NewContractPreview({ onClose }: { onClose: () => void }) {
  return (
    <Panel className="overflow-hidden shadow-none" as="section">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <FileText size={16} />
        <h2 className="m-0 text-[14px] font-semibold">Новий контракт</h2>
      </div>
      <div className="grid gap-6 p-4">
        <section>
          <h3 className="mb-3 mt-0 text-[12px] font-semibold text-[var(--muted-foreground)]">Основні дані</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {previewFields.map(([label, value]) => (
              <label key={label} className="field">
                <span>{label}</span>
                <input value={value} readOnly aria-readonly="true" />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 mt-0 text-[12px] font-semibold text-[var(--muted-foreground)]">Покупець</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="field"><span>Назва українською</span><input value="ПП «ДНЕПРМАРИН СПОРТ»" readOnly /></label>
            <label className="field"><span>Назва англійською</span><input value="PP DNEPRMARIN SPORT" readOnly /></label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 mt-0 text-[12px] font-semibold text-[var(--muted-foreground)]">Умови</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="field"><span>Умови поставки</span><input value="FOB Houston, USA" readOnly /></label>
            <label className="field"><span>Валюта</span><input value="US FUNDS / Долари США" readOnly /></label>
            <label className="field"><span>Країна походження EN</span><input value="Mexico" readOnly /></label>
            <label className="field"><span>Країна походження UA</span><input value="Мексика" readOnly /></label>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>
          <LockedButton className="button-primary" title="Потрібне підключення реєстру договорів для запису">Створити контракт</LockedButton>
        </div>
      </div>
    </Panel>
  );
}

function ContractDetailModal({ contract, onClose }: { contract: InvoiceContract | null; onClose: () => void }) {
  if (!contract) return null;

  const fields = [
    ["Короткий номер", contract.shortNumber],
    ["Повний номер", contract.detail.fullNumber],
    ["Дата контракту", contract.detail.contractDate],
    ["Постачальник", contract.supplier],
    ["Представник", contract.detail.representative],
    ["Адреса постачальника", contract.detail.supplierAddress],
    ["Вантажовідправник", contract.detail.shipper],
    ["ІПН", contract.detail.taxId],
    ["Покупець", contract.buyer],
    ["Умови поставки", contract.detail.deliveryTerms],
    ["Валюта", contract.detail.currency],
    ["Країна походження", [contract.detail.originEn, contract.detail.originUa].filter(Boolean).join(" / ") || null],
  ] as const;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Контракт ${contract.shortNumber}`}
      description="Реквізити контракту"
      className="!w-[min(860px,100%)]"
      footer={<button type="button" className="button button-outline" onClick={onClose}>Закрити</button>}
    >
      <div className="grid gap-4">
        <InlineNotice>Незаповнені реквізити позначені «—». Перегляд не змінює контракт.</InlineNotice>
        <dl className="grid gap-px overflow-hidden rounded-md border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="bg-[var(--surface)] p-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.035em] text-[var(--muted-foreground)]">{label}</dt>
              <dd className="mb-0 mt-1 text-[12px] font-medium">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}

function ContractsTab(props: Pick<AdminInvoicesViewProps, "contractsCreating" | "contractsQuery" | "selectedContract" | "onContractsCreatingChange" | "onContractsQueryChange" | "onSelectedContractChange">) {

  const visibleContracts = useMemo(() => {
    const needle = normalize(props.contractsQuery);
    if (!needle) return invoiceContracts;
    return invoiceContracts.filter((contract) => normalize(`${contract.shortNumber} ${contract.supplier} ${contract.buyer}`).includes(needle));
  }, [props.contractsQuery]);

  if (props.contractsCreating) {
    return (
      <section id="invoices-contracts-panel" role="tabpanel" aria-labelledby="invoices-contracts-panel-tab">
        <NewContractPreview onClose={() => props.onContractsCreatingChange(false)} />
      </section>
    );
  }

  return (
    <section id="invoices-contracts-panel" role="tabpanel" aria-labelledby="invoices-contracts-panel-tab" className="grid gap-4">
      <div>
        <h2 className="m-0 text-[16px] font-semibold">Контракти</h2>
        <p className="mb-0 mt-1 text-[12px] text-[var(--muted-foreground)]">Дані постачальника/покупця для генерації інвойсів та додатків</p>
      </div>

      <AdminToolbar
        search={<AdminSearchField value={props.contractsQuery} onValueChange={props.onContractsQueryChange} label="Пошук контрактів" placeholder="Пошук номера, постачальника або покупця..." />}
        actions={<button type="button" className="button button-primary" onClick={() => props.onContractsCreatingChange(true)}><Plus size={15} /> Новий контракт</button>}
        meta={<span className="hidden md:inline">{visibleContracts.length} з {invoiceContracts.length}</span>}
      />

      <div className="grid gap-3">
        {visibleContracts.map((contract) => (
          <Panel key={contract.id} as="article" className="flex min-h-[74px] flex-col gap-3 border-[#b7dfbf] bg-[var(--green-soft)] p-4 shadow-none sm:flex-row sm:items-center">
            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => props.onSelectedContractChange(contract)} aria-haspopup="dialog">
              <ChevronRight size={15} className="shrink-0 text-[var(--muted-foreground)]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-[14px]">{contract.shortNumber}</strong>
                  <StatusBadge tone="green">Активний</StatusBadge>
                </span>
                <span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">{contract.supplier} → {contract.buyer}</span>
              </span>
            </button>
            <div className="flex flex-wrap gap-1 sm:justify-end" aria-label={`Дії контракту ${contract.shortNumber}`}>
              <AdminIconAction label={`Переглянути контракт ${contract.shortNumber}`} tooltip="Безпечний перегляд реквізитів" icon={<Eye size={14} />} tone="primary" onClick={() => props.onSelectedContractChange(contract)} />
              <AdminIconAction label={`Редагувати контракт ${contract.shortNumber}`} tooltip="Потрібне підключення реєстру договорів для змін" icon={<Pencil size={14} />} disabled />
              <AdminIconAction label={`Дублювати контракт ${contract.shortNumber}`} tooltip="Потрібне підключення реєстру договорів для створення копії" icon={<Copy size={14} />} disabled />
              <AdminIconAction label={`Видалити контракт ${contract.shortNumber}`} tooltip="Потрібне підключення реєстру договорів для видалення" icon={<Trash2 size={14} />} tone="danger" disabled />
            </div>
          </Panel>
        ))}
        {visibleContracts.length === 0 ? (
          <EmptyState compact title="Контрактів не знайдено" description="Змініть номер, постачальника або покупця у пошуку." icon={<FileText size={24} />} />
        ) : null}
      </div>
      <ContractDetailModal contract={props.selectedContract} onClose={() => props.onSelectedContractChange(null)} />
    </section>
  );
}

function formatPreviewMoney(value: number, currency: "EUR" | "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function AppendixPreviewModal({ preview, onClose }: { preview: AppendixPreview | null; onClose: () => void }) {
  return (
    <Modal
      open={preview !== null}
      onClose={onClose}
      title="Попередній перегляд документа"
      description="Перегляньте документ додатка перед генерацією"
      className="!w-[min(920px,100%)]"
      footer={(
        <>
          <button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>
          <LockedButton title="Генерація митного DOCX вимкнена"><FileDown size={14} /> Таможня DOCX</LockedButton>
          <LockedButton title="Генерація банківського DOCX вимкнена"><Landmark size={14} /> Банк DOCX</LockedButton>
        </>
      )}
    >
      {preview ? (
        <div className="grid gap-4">
          <header className="grid gap-4 rounded-md bg-[var(--surface-subtle)] p-4 text-center">
            <div>
              <h3 className="m-0 text-[17px] font-bold">APPENDIX / ДОДАТОК</h3>
              <p className="mb-0 mt-1 font-medium">Nr. {preview.appendixNumber} dated/від {preview.appendixDate}</p>
              <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">to Contract / до Контракту № {preview.contractNumber} of/від {preview.contractDate}</p>
            </div>
            <div className="grid gap-3 text-left sm:grid-cols-2">
              <div><strong className="block text-[11px]">Consignee / Вантажоодержувач:</strong><span className="block text-[11px]">{preview.consignee}</span><span className="block text-[11px] text-[var(--muted-foreground)]">{preview.consigneeAddress}</span></div>
              <div className="sm:text-right"><strong className="block text-[11px]">Delivery terms / Умови поставки:</strong><span className="block text-[11px]">{preview.deliveryTerms}</span></div>
            </div>
          </header>

          <div className="overflow-hidden rounded-md border border-[var(--border)]">
            <p className="m-0 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
              <RepresentativeNotice shown={preview.representativeLines.length} total={preview.totalSourceRows} noun="рядків документа" />
            </p>
            <div className="data-table-wrap" tabIndex={0} role="region" aria-label="Рядки попереднього перегляду">
              <table className="data-table min-w-[760px]">
                <thead><tr><th>Description / Опис</th><th className="text-right">Qty</th><th className="text-right">Price, {preview.currency}</th><th className="text-right">Amount, {preview.currency}</th></tr></thead>
                <tbody>
                  {preview.representativeLines.map((line) => (
                    <tr key={line.id}>
                      <td><strong className="block text-[11px] font-medium">{line.primaryDescription}</strong><span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{line.secondaryDescription}</span></td>
                      <td className="text-right tabular-nums">{line.quantity}</td>
                      <td className="text-right font-mono tabular-nums">{formatPreviewMoney(line.unitPrice, preview.currency)}</td>
                      <td className="text-right font-mono tabular-nums">{formatPreviewMoney(line.amount, preview.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-[var(--border)]"><td className="p-3 font-semibold">Разом · {preview.totalSourceRows} рядків</td><td className="p-3 text-right font-semibold">{preview.totalQuantity}</td><td /><td className="p-3 text-right font-mono font-bold">{formatPreviewMoney(preview.totalAmount, preview.currency)}</td></tr></tfoot>
              </table>
            </div>
          </div>

          <div className="grid gap-6 pt-3 text-[11px] sm:grid-cols-2">
            <div className="border-t border-[var(--foreground)] pt-2">Supplier / Постачальник</div>
            <div className="border-t border-[var(--foreground)] pt-2 sm:text-right">Buyer / Покупець</div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function AppendixDetailModal({ appendix, onClose }: { appendix: InvoiceAppendix | null; onClose: () => void }) {
  if (!appendix?.preview) return null;
  return <AppendixPreviewModal preview={appendix.preview} onClose={onClose} />;
}

function AppendixKpis() {
  const items = [
    { label: "Додатки", value: invoiceAppendixSourceTotals.appendices, icon: FileText, color: "text-[var(--blue)] bg-[var(--blue-soft)]" },
    { label: "Проформи", value: invoiceAppendixSourceTotals.proformas, icon: FileText, color: "text-[var(--green)] bg-[var(--green-soft)]" },
    { label: "Загальна сума", value: invoiceAppendixSourceTotals.amount, icon: DollarSign, color: "text-[var(--amber)] bg-[var(--amber-soft)]" },
    { label: "Контейнери", value: invoiceAppendixSourceTotals.containers, icon: Box, color: "text-[var(--orange)] bg-[var(--orange-soft)]" },
    { label: "Найближчий ETA", value: invoiceAppendixSourceTotals.nearestEta, icon: CalendarDays, color: "text-[var(--purple)] bg-[var(--purple-soft)]" },
  ] as const;
  return (
    <section className="grid grid-cols-1 gap-3 max-md:hidden sm:grid-cols-2 xl:grid-cols-5" aria-label="Показники додатків">
      {items.map((item) => {
        const Icon = item.icon;
        return <Panel key={item.label} className="flex min-h-20 items-center gap-3 p-4 shadow-none"><span className={`grid size-9 shrink-0 place-items-center rounded-md ${item.color}`}><Icon size={18} /></span><span><span className="block text-[10px] text-[var(--muted-foreground)]">{item.label}</span><strong className="mt-1 block text-[20px] leading-none tabular-nums">{item.value}</strong></span></Panel>;
      })}
    </section>
  );
}

function AppendicesTab(props: Pick<AdminInvoicesViewProps, "appendicesQuery" | "selectedAppendix" | "onAppendicesQueryChange" | "onSelectedAppendixChange">) {
  const visibleAppendices = useMemo(() => {
    const needle = normalize(props.appendicesQuery);
    if (!needle) return invoiceAppendices;
    return invoiceAppendices.filter((appendix) => normalize(`${appendix.name} ${appendix.date} ${appendix.composition} ${appendix.shipment} ${appendix.contractNumber} ${appendix.amount}`).includes(needle));
  }, [props.appendicesQuery]);

  return (
    <section id="invoices-appendices-panel" role="tabpanel" aria-labelledby="invoices-appendices-panel-tab" className="grid gap-4">
      <AppendixKpis />
      <AdminToolbar
        search={<AdminSearchField value={props.appendicesQuery} onValueChange={props.onAppendicesQueryChange} label="Пошук додатків" placeholder="Пошук додатка, відправки або контракту..." />}
        meta={<span className="hidden md:inline">{visibleAppendices.length} з {invoiceAppendixSourceTotals.appendices}</span>}
      />
      <AdminTableShell
        notice={<RepresentativeNotice shown={visibleAppendices.length} total={invoiceAppendixSourceTotals.appendices} noun="додатків" />}
        scrollLabel="Додатки"
      >
          <table className="data-table min-w-[1050px]">
            <thead><tr><th>Додаток</th><th>Дата</th><th>Склад</th><th>Відправка</th><th>ETA</th><th>Контракт</th><th className="text-right">Сума</th><th>Дії</th></tr></thead>
            <tbody>
              {visibleAppendices.map((appendix) => (
                <tr key={appendix.id}>
                  <td>
                    {appendix.preview ? (
                      <button type="button" className="font-semibold text-[var(--blue)] hover:underline" onClick={() => props.onSelectedAppendixChange(appendix)} aria-haspopup="dialog">{appendix.name}</button>
                    ) : <strong className="font-semibold">{appendix.name}</strong>}
                  </td>
                  <td>{appendix.date}</td>
                  <td>{appendix.composition}</td>
                  <td className="font-medium text-[var(--blue)]">{appendix.shipment}</td>
                  <td>{appendix.eta}</td>
                  <td><select value={appendix.contractNumber} disabled aria-label={`Контракт ${appendix.name}`} className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2 text-[10px]"><option>{appendix.contractNumber}</option></select></td>
                  <td className="text-right font-semibold text-[var(--green)]">{appendix.amount}</td>
                  <td>
                    <div className="flex min-w-max items-center gap-1">
                      <AdminIconAction label={`Переглянути ${appendix.name}`} tooltip={appendix.preview ? "Відкрити підтверджений документ" : "Повний preview не зафіксовано у source"} icon={<Eye size={13} />} tone="primary" onClick={() => props.onSelectedAppendixChange(appendix)} disabled={!appendix.preview} />
                      <AdminIconAction label={`Митний документ ${appendix.name}`} tooltip="Генерація митного документа вимкнена" icon={<Download size={13} />} disabled />
                      <AdminIconAction label={`Банківський документ ${appendix.name}`} tooltip="Генерація банківського документа вимкнена" icon={<Landmark size={13} />} disabled />
                      <AdminIconAction label={`Видалити ${appendix.name}`} tooltip="Видалення додатка вимкнене" icon={<Trash2 size={13} />} tone="danger" disabled />
                    </div>
                  </td>
                </tr>
              ))}
              {visibleAppendices.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-[var(--muted-foreground)]">Додатків не знайдено.</td></tr> : null}
            </tbody>
          </table>
      </AdminTableShell>
      <AppendixDetailModal appendix={props.selectedAppendix} onClose={() => props.onSelectedAppendixChange(null)} />
    </section>
  );
}

const invoiceFilters: ReadonlyArray<{ id: InvoiceShipmentFilter; label: string; count: number }> = [
  { id: "all", label: "Всі", count: invoiceShipmentSourceCounts.all },
  { id: "in-transit", label: "В дорозі", count: invoiceShipmentSourceCounts["in-transit"] },
  { id: "arrived", label: "Прибув", count: invoiceShipmentSourceCounts.arrived },
];

function InvoiceSummaryModal({ preview, onClose }: { preview: InvoiceSummaryPreview; onClose: () => void }) {
  if (!preview) return null;

  const isShipment = preview.kind === "shipment";
  const title = isShipment ? `BL ${preview.item.billOfLading}` : `Інвойс ${preview.item.invoiceNumber}`;
  const fields = isShipment
    ? [
        ["Контейнери", String(preview.item.containerCount)],
        ["Одиниці", String(preview.item.unitCount)],
        ["Готовність", preview.item.readiness],
        ["ETA", `${preview.item.eta} (${preview.item.visibleStatusLabel})`],
      ]
    : [
        ["Контейнер", preview.item.containerNumber],
        ["Одиниці", String(preview.item.unitCount)],
        ["Сума", preview.item.total],
        ["Дата", preview.item.date],
      ];

  return (
    <Modal open onClose={onClose} title={title} description="Деталі документа" className="!w-[min(680px,100%)]" footer={<button type="button" className="button button-outline" onClick={onClose}>Закрити</button>}>
      <div className="grid gap-4">
        <InlineNotice>Перегляд показує збережені дані та не формує і не завантажує документ.</InlineNotice>
        <dl className="grid gap-px overflow-hidden rounded-md border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {fields.map(([label, value]) => <div key={label} className="bg-[var(--surface)] p-3"><dt className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">{label}</dt><dd className="mb-0 mt-1 text-[13px] font-medium">{value}</dd></div>)}
        </dl>
      </div>
    </Modal>
  );
}

function InvoicesTab(props: Pick<AdminInvoicesViewProps, "invoiceQuery" | "invoiceFilter" | "invoicePreview" | "onInvoiceQueryChange" | "onInvoiceFilterChange" | "onInvoicePreviewChange">) {
  const normalizedQuery = props.invoiceQuery.trim().toLocaleLowerCase("uk-UA");
  const visibleGroups = useMemo(() => invoiceShipmentGroups.filter((group) => {
    const filterMatch = props.invoiceFilter === "all" || group.filterState === props.invoiceFilter;
    const queryMatch = !normalizedQuery || group.billOfLading.toLocaleLowerCase("uk-UA").includes(normalizedQuery);
    return filterMatch && queryMatch;
  }), [props.invoiceFilter, normalizedQuery]);
  const visibleFormedInvoices = useMemo(() => formedInvoices.filter((invoice) => (
    !normalizedQuery || normalize(`${invoice.invoiceNumber} ${invoice.containerNumber} ${invoice.total} ${invoice.date}`).includes(normalizedQuery)
  )), [normalizedQuery]);
  const sourceGroupedCount = props.invoiceFilter === "all" ? invoiceShipmentSourceCounts.groupedAll : props.invoiceFilter === "in-transit" ? invoiceShipmentSourceCounts.groupedInTransit : invoiceShipmentSourceCounts.groupedArrived;

  return (
    <section id="invoices-invoices-panel" role="tabpanel" aria-labelledby="invoices-invoices-panel-tab" className="grid gap-4">
      <AdminToolbar
        search={<AdminSearchField value={props.invoiceQuery} onValueChange={props.onInvoiceQueryChange} label="Пошук інвойсів" placeholder="Пошук інвойсів..." />}
        filters={<AdminSegmentedControl items={invoiceFilters.map((item) => ({ id: item.id, label: item.label, count: item.count }))} value={props.invoiceFilter} onValueChange={props.onInvoiceFilterChange} label="Статус відвантажень" />}
        meta={`${visibleGroups.length} BL · ${visibleFormedInvoices.length} інвойсів`}
        mobileDisclosure={{ sections: ["filters"], activeCount: Number(props.invoiceFilter !== "all") }}
      />

      <AdminTableShell notice={visibleGroups.length ? <RepresentativeNotice shown={visibleGroups.length} total={sourceGroupedCount} noun="згрупованих BL" /> : undefined} scrollLabel="Відвантаження для інвойсів">
        {visibleGroups.length ? (
              <table className="data-table min-w-[1120px]">
                <thead><tr><th>Контейнер</th><th>Назва</th><th>Проформа</th><th>Одиниці</th><th>EUR</th><th>Готовність</th><th>Контракт</th><th>Додаток</th><th>Інвойс</th><th>Сума</th><th>Дії</th></tr></thead>
                <tbody>{visibleGroups.map((group) => (
                  <tr key={group.id}>
                    <td><button type="button" className="font-mono font-semibold text-[var(--orange)] hover:underline" onClick={() => props.onInvoicePreviewChange({ kind: "shipment", item: group })} aria-haspopup="dialog">BL {group.billOfLading}</button></td>
                    <td>{group.containerCount} контейнер{group.containerCount === 1 ? "" : "и"}</td>
                    <td>—</td>
                    <td className="tabular-nums">{group.unitCount}</td>
                    <td>—</td>
                    <td><div className="flex flex-wrap gap-1"><StatusBadge tone="amber">{group.readiness}</StatusBadge><StatusBadge tone="green">ETA: {group.eta} ({group.visibleStatusLabel})</StatusBadge></div></td>
                    <td>—</td><td>—</td><td>—</td><td>—</td>
                    <td><div className="flex min-w-max items-center gap-1"><AdminIconAction label={`Переглянути BL ${group.billOfLading}`} tooltip="Переглянути деталі BL" icon={<Eye size={13} />} tone="primary" onClick={() => props.onInvoicePreviewChange({ kind: "shipment", item: group })} /><LockedButton className="button-primary min-h-8 whitespace-nowrap px-2 text-[10px]" title="Формування BL вимкнене">Сформувати BL</LockedButton></div></td>
                  </tr>
                ))}</tbody>
              </table>
        ) : <EmptyState compact title="Відвантажень не знайдено" description="Змініть пошуковий запит або статусний фільтр." />}
      </AdminTableShell>

      <AdminTableShell title="Сформовані інвойси" actions={<StatusBadge>{60}</StatusBadge>} notice={visibleFormedInvoices.length ? <RepresentativeNotice shown={visibleFormedInvoices.length} total={60} noun="сформованих інвойсів" /> : undefined}>
        {visibleFormedInvoices.length ? (
          <div className="divide-y divide-[var(--border)]">
          {visibleFormedInvoices.map((invoice) => (
            <article key={invoice.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <FileText size={16} className="shrink-0 text-[var(--blue)]" />
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => props.onInvoicePreviewChange({ kind: "formed", item: invoice })} aria-haspopup="dialog"><strong className="block font-mono text-[12px] text-[var(--blue)] hover:underline">{invoice.invoiceNumber}</strong><span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{invoice.containerNumber} · {invoice.unitCount} од. · {invoice.total}</span></button>
              <time className="text-[10px] text-[var(--muted-foreground)]">{invoice.date}</time>
              <AdminIconAction label={`Переглянути інвойс ${invoice.invoiceNumber}`} tooltip="Переглянути деталі інвойсу" icon={<Eye size={13} />} tone="primary" onClick={() => props.onInvoicePreviewChange({ kind: "formed", item: invoice })} />
              <AdminIconAction label={`Завантажити DOCX ${invoice.invoiceNumber}`} tooltip="Завантаження DOCX вимкнене" icon={<Download size={13} />} disabled />
            </article>
          ))}
          </div>
        ) : <EmptyState compact title="Сформованих інвойсів не знайдено" description="Змініть пошуковий запит або очистьте поле пошуку." />}
      </AdminTableShell>
      <InvoiceSummaryModal preview={props.invoicePreview} onClose={() => props.onInvoicePreviewChange(null)} />
    </section>
  );
}

function CostKpis({ view }: { view: InvoiceCostView }) {
  const kpis = view === "archive" ? invoiceCostKpis.archive : invoiceCostKpis.active;
  const items = [
    { label: "Всього фрахт", value: kpis.freight, icon: Package, color: "text-[var(--blue)] bg-[var(--blue-soft)]" },
    { label: "Всього митниця", value: kpis.customs, icon: FileText, color: "text-[var(--green)] bg-[var(--green-soft)]" },
    { label: "Всього брокер", value: kpis.broker, icon: FileText, color: "text-[var(--orange)] bg-[var(--orange-soft)]" },
    { label: "Всього готівка", value: kpis.cash, icon: DollarSign, color: "text-[var(--purple)] bg-[var(--purple-soft)]" },
    { label: "Всього витрати", value: kpis.total, icon: CircleDollarSign, color: "text-[var(--amber)] bg-[var(--amber-soft)]" },
  ] as const;
  return <section className="grid grid-cols-1 gap-3 max-md:hidden sm:grid-cols-2 xl:grid-cols-5" aria-label="Підсумки собівартості">{items.map((item) => { const Icon = item.icon; return <Panel key={item.label} className="flex min-h-20 items-center gap-3 p-4 shadow-none"><span className={`grid size-9 shrink-0 place-items-center rounded-md ${item.color}`}><Icon size={17} /></span><span className="min-w-0"><span className="block text-[9px] font-bold uppercase text-[var(--muted-foreground)]">{item.label}</span><strong className="mt-1 block truncate text-[20px] leading-none">{item.value}</strong></span></Panel>; })}</section>;
}

function MonthMenu({ open, selected, onToggleOpen, onClose, onToggleMonth, onAll, onReset }: {
  open: boolean;
  selected: readonly InvoiceCostMonthId[];
  onToggleOpen: () => void;
  onClose: () => void;
  onToggleMonth: (month: InvoiceCostMonthId) => void;
  onAll: () => void;
  onReset: () => void;
}) {
  const allSelected = selected.length === invoiceCostMonths.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, open]);

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" className="button button-ghost" aria-expanded={open} aria-controls="invoice-cost-month-filter" onClick={onToggleOpen}>
        {allSelected ? "Всі місяці" : selected.length ? `Місяців: ${selected.length}` : "Місяці не обрані"}<ChevronDown size={13} />
      </button>
      {open ? (
        <div id="invoice-cost-month-filter" className="absolute left-0 top-[calc(100%+4px)] z-30 w-56 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-menu)]" role="group" aria-label="Фільтр за місяцем">
          <div className="flex border-b border-[var(--border)] px-2 py-1.5"><button type="button" className="button button-ghost min-h-7 px-2 text-[10px]" onClick={onAll}>Обрати всі</button><button type="button" className="button button-ghost min-h-7 px-2 text-[10px]" onClick={onReset}>Скинути</button></div>
          <div className="p-1">{invoiceCostMonths.map((month) => <button key={month.id} type="button" aria-pressed={selected.includes(month.id)} onClick={() => onToggleMonth(month.id)} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[11px] hover:bg-[var(--surface-subtle)]"><span className={`grid size-4 place-items-center rounded border ${selected.includes(month.id) ? "border-[var(--orange)] bg-[var(--orange)] text-white" : "border-[var(--border)]"}`}>{selected.includes(month.id) ? "✓" : ""}</span><span className="flex-1">{month.label}</span><span className="text-[var(--muted-foreground)]">{month.sourceCount}</span></button>)}</div>
        </div>
      ) : null}
    </div>
  );
}

function CostDetailModal({ card, onClose }: { card: InvoiceCostCard | null; onClose: () => void }) {
  if (!card) return null;

  const fields = [
    ["Відправка", card.shipmentLabel],
    ["ETA / прибуття", card.eta ?? "—"],
    ["Товар EUR", card.goodsEur],
    ["Товар USD", `${card.goodsUsd} @${card.exchangeRate.toFixed(2)}`],
    ["Фрахт", card.freight],
    ["Митниця", card.customs],
    ["Брокер", card.broker],
    ["Готівка", card.cash],
    ["Всього витрат", card.total],
    ["Собівартість", card.costPercent],
  ] as const;

  return (
    <Modal open onClose={onClose} title={`Собівартість · BL ${card.billOfLading}`} description="Деталізація витрат" className="!w-[min(820px,100%)]" footer={<button type="button" className="button button-outline" onClick={onClose}>Закрити</button>}>
      <div className="grid gap-4">
        <InlineNotice tone={card.incomplete ? "warning" : "info"}>
          {card.incomplete ? "Незаповнені витрати позначені «—». " : ""}Перегляд не архівує BL і не змінює курс або суми.
        </InlineNotice>
        <dl className="grid gap-px overflow-hidden rounded-md border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {fields.map(([label, value]) => <div key={label} className="bg-[var(--surface)] p-3"><dt className="text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">{label}</dt><dd className="mb-0 mt-1 text-[13px] font-semibold">{value}</dd></div>)}
        </dl>
      </div>
    </Modal>
  );
}

function CostTab(props: Pick<AdminInvoicesViewProps, "costView" | "costQuery" | "costMonthMenuOpen" | "selectedMonths" | "selectedCostCard" | "onCostViewChange" | "onCostQueryChange" | "onCostMonthMenuOpenChange" | "onSelectedMonthsChange" | "onSelectedCostCardChange">) {
  const visibleCards = useMemo(() => invoiceCostCards.filter((card) => {
    const viewMatch = props.costView === "archive" ? card.archived : props.costView === "incomplete" ? !card.archived && card.incomplete : !card.archived;
    const allMonthsSelected = props.selectedMonths.length === invoiceCostMonths.length;
    const monthMatch = card.month ? props.selectedMonths.includes(card.month) : allMonthsSelected;
    const queryMatch = !normalize(props.costQuery) || normalize(`${card.billOfLading} ${card.shipmentLabel}`).includes(normalize(props.costQuery));
    return viewMatch && monthMatch && queryMatch;
  }), [props.costQuery, props.costView, props.selectedMonths]);
  const sourceCount = invoiceCostSourceCounts[props.costView];

  const toggleMonth = (month: InvoiceCostMonthId) => props.onSelectedMonthsChange(props.selectedMonths.includes(month) ? props.selectedMonths.filter((item) => item !== month) : [...props.selectedMonths, month]);

  return (
    <section id="invoices-cost-panel" role="tabpanel" aria-labelledby="invoices-cost-panel-tab" className="grid gap-4">
      <CostKpis view={props.costView} />
      <AdminToolbar
        search={<AdminSearchField value={props.costQuery} onValueChange={props.onCostQueryChange} label="Пошук собівартості" placeholder="Пошук BL або відправки..." />}
        filters={<MonthMenu open={props.costMonthMenuOpen} selected={props.selectedMonths} onToggleOpen={() => props.onCostMonthMenuOpenChange(!props.costMonthMenuOpen)} onClose={() => props.onCostMonthMenuOpenChange(false)} onToggleMonth={toggleMonth} onAll={() => props.onSelectedMonthsChange(invoiceCostMonths.map((month) => month.id))} onReset={() => props.onSelectedMonthsChange([])} />}
        view={<AdminSegmentedControl items={[{ id: "active", label: "Активні" }, { id: "archive", label: "Архів" }, { id: "incomplete", label: "Незаповнені" }]} value={props.costView} onValueChange={props.onCostViewChange} label="Стан даних собівартості" />}
        actions={<AdminIconAction label="Експорт Excel" tooltip="Експорт Excel вимкнений" icon={<Download size={14} />} disabled />}
        meta={`${visibleCards.length} BL`}
        mobileDisclosure={{
          sections: ["filters", "actions"],
          activeCount: Number(props.selectedMonths.length !== invoiceCostMonths.length),
        }}
      />
      <AdminTableShell title="Дані собівартості за коносаментом" notice={visibleCards.length ? <RepresentativeNotice shown={visibleCards.length} total={sourceCount} noun="BL-карток" /> : undefined}>
        {visibleCards.length ? (
            <div className="grid gap-2 p-3">
              {visibleCards.map((card) => (
                <article key={card.id} className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]" role="region" aria-label={`Картка собівартості BL ${card.billOfLading}`} tabIndex={0}>
                  <div className="grid min-w-[1050px] grid-cols-[28px_90px_72px_132px_150px_repeat(4,105px)_112px_70px_72px] items-center gap-2 px-3 py-3 text-[10px]">
                    <button type="button" className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]" onClick={() => props.onSelectedCostCardChange(card)} aria-label={`Переглянути BL ${card.billOfLading}`} aria-haspopup="dialog"><ChevronRight size={14} /></button>
                    <button type="button" className="font-mono text-left text-[12px] font-semibold text-[var(--blue)] hover:underline" onClick={() => props.onSelectedCostCardChange(card)} aria-haspopup="dialog">BL {card.billOfLading}</button>
                    <span className="text-[var(--muted-foreground)]">{card.shipmentLabel}</span>
                    {card.eta ? <StatusBadge tone="green">ETA: {card.eta}</StatusBadge> : <span className="text-[var(--muted-foreground)]">ETA: —</span>}
                    <span className="text-[var(--green)]">Товар: <strong>{card.goodsEur}</strong> <span className="text-[var(--muted-foreground)]">({card.goodsUsd}) @{card.exchangeRate.toFixed(2)}</span></span>
                    <span className="text-[var(--blue)]">Фрахт:<strong className="mt-1 block">{card.freight}</strong></span>
                    <span className="text-[var(--green)]">Митниця:<strong className="mt-1 block">{card.customs}</strong></span>
                    <span className="text-[var(--orange)]">Брокер:<strong className="mt-1 block">{card.broker}</strong></span>
                    <span className="text-[var(--purple)]">Гот.:<strong className="mt-1 block">{card.cash}</strong></span>
                    <span className="text-[var(--amber)]">Всього:<strong className="mt-1 block text-[12px]">{card.total}</strong></span>
                    <span className="text-[var(--muted-foreground)]">Собів.:<strong className="mt-1 block text-[var(--foreground)]">{card.costPercent}</strong></span>
                    <span className="flex items-center gap-1"><AdminIconAction label={`Переглянути BL ${card.billOfLading}`} tooltip="Безпечний перегляд собівартості" icon={<Eye size={13} />} tone="primary" onClick={() => props.onSelectedCostCardChange(card)} /><AdminIconAction label={card.archived ? `Відновити BL ${card.billOfLading}` : `Архівувати BL ${card.billOfLading}`} tooltip={card.archived ? "Відновлення BL вимкнене" : "Архівація BL вимкнена"} icon={card.archived ? <RotateCcw size={13} /> : <Archive size={13} />} disabled /></span>
                  </div>
                  {props.costView === "incomplete" ? <div className="border-t border-[var(--border)] bg-[var(--amber-soft)] px-3 py-2 text-[10px] text-[var(--amber)]"><AlertTriangle size={13} className="mr-1 inline" />Є незаповнені витрати</div> : null}
                </article>
              ))}
            </div>
        ) : <EmptyState compact title="Даних за обраними місяцями немає" description="Оберіть інший місяць або поверніть фільтр «Всі місяці»." />}
      </AdminTableShell>
      <CostDetailModal card={props.selectedCostCard} onClose={() => props.onSelectedCostCardChange(null)} />
    </section>
  );
}

function CurrentAdminInvoicesView(props: AdminInvoicesViewProps) {
  const uploadLabel = uploadLabels[props.tab];

  return (
    <div data-admin-invoices-renderer="current"><AdminPage>
      <AdminPageHeader
        icon={<FileText size={20} />}
        title="Інвойси та документи"
        description="Керування інвойсами, контрактами та митними документами"
        actions={uploadLabel ? <LockedButton title={uploadLockedReasons[props.tab] ?? "Потрібна інтеграція сервісу документів"}><Upload size={14} /> {uploadLabel}</LockedButton> : undefined}
      />
      <div className="grid gap-5">
        <PageKpis />
        <InvoiceTabs active={props.tab} onChange={props.onTabChange} />
        {props.tab === "contracts" ? <ContractsTab {...props} /> : null}
        {props.tab === "appendices" ? <AppendicesTab {...props} /> : null}
        {props.tab === "invoices" ? <InvoicesTab {...props} /> : null}
        {props.tab === "cost" ? <CostTab {...props} /> : null}
      </div>
    </AdminPage></div>
  );
}

export function AdminInvoicesPage() {
  const [tab, setTab] = useState<InvoiceTabId>("contracts");
  const [contractsCreating, setContractsCreating] = useState(false);
  const [contractsQuery, setContractsQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<InvoiceContract | null>(null);
  const [appendicesQuery, setAppendicesQuery] = useState("");
  const [selectedAppendix, setSelectedAppendix] = useState<InvoiceAppendix | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceShipmentFilter>("all");
  const [invoicePreview, setInvoicePreview] = useState<InvoiceSummaryPreview>(null);
  const [costView, setCostView] = useState<InvoiceCostView>("active");
  const [costQuery, setCostQuery] = useState("");
  const [costMonthMenuOpen, setCostMonthMenuOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<readonly InvoiceCostMonthId[]>(invoiceCostMonths.map((month) => month.id));
  const [selectedCostCard, setSelectedCostCard] = useState<InvoiceCostCard | null>(null);

  const viewProps: AdminInvoicesViewProps = {
    tab, contractsCreating, contractsQuery, selectedContract, appendicesQuery, selectedAppendix, invoiceQuery, invoiceFilter, invoicePreview, costView, costQuery, costMonthMenuOpen, selectedMonths, selectedCostCard,
    onTabChange: setTab, onContractsCreatingChange: setContractsCreating, onContractsQueryChange: setContractsQuery, onSelectedContractChange: setSelectedContract,
    onAppendicesQueryChange: setAppendicesQuery, onSelectedAppendixChange: setSelectedAppendix, onInvoiceQueryChange: setInvoiceQuery, onInvoiceFilterChange: setInvoiceFilter,
    onInvoicePreviewChange: setInvoicePreview, onCostViewChange: setCostView, onCostQueryChange: setCostQuery, onCostMonthMenuOpenChange: setCostMonthMenuOpen,
    onSelectedMonthsChange: setSelectedMonths, onSelectedCostCardChange: setSelectedCostCard,
  };

  return <RendererViewSwitch slotId="admin-invoices" currentView={<CurrentAdminInvoicesView {...viewProps} />} loadAstryxView={loadAstryxAdminInvoicesView} astryxViewProps={viewProps} />;
}
