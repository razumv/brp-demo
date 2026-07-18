"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { EmptyState, Modal, PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
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
  type InvoiceCostMonthId,
  type InvoiceCostView,
  type InvoiceShipmentFilter,
  type InvoiceTabId,
} from "@/lib/admin-invoices-data";

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

const kpiToneClasses = {
  neutral: "bg-[var(--surface-subtle)] text-[var(--muted-foreground)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]",
  green: "bg-[var(--green-soft)] text-[var(--green)]",
} as const;

const pageKpiIcons = {
  shipments: FileText,
  ready: Clock3,
  missing: AlertTriangle,
  formed: CheckCircle2,
} as const;

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
    <p className="m-0 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
      Репрезентативна source-вибірка: показано {shown} з {total} {noun}. Загальні лічильники збережені точно.
    </p>
  );
}

function PageKpis() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Показники інвойсів">
      {invoicePageKpis.map((item) => {
        const Icon = pageKpiIcons[item.id];
        return (
          <Panel key={item.id} className="flex min-h-20 items-center gap-3 p-4 shadow-none">
            <span className={`grid size-9 shrink-0 place-items-center rounded-md ${kpiToneClasses[item.tone]}`}>
              <Icon size={17} />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.035em] text-[var(--muted-foreground)]">{item.label}</span>
              <strong className={`mt-1 block text-[23px] leading-none tabular-nums ${item.tone === "neutral" ? "" : kpiToneClasses[item.tone].split(" ")[1]}`}>
                {item.value}
              </strong>
            </span>
          </Panel>
        );
      })}
    </section>
  );
}

function InvoiceTabs({ active, onChange }: { active: InvoiceTabId; onChange: (tab: InvoiceTabId) => void }) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)] p-1 sm:w-fit" role="tablist" aria-label="Інвойси та документи">
      {tabItems.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={`button min-h-9 shrink-0 border-0 px-3 text-[11px] ${selected ? "bg-[var(--orange-soft)] text-[var(--orange)] shadow-[inset_0_-2px_var(--orange)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]"}`}
          >
            <Icon size={14} /> {item.label}
          </button>
        );
      })}
    </div>
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
          <LockedButton className="button-primary" title="Створення контракту вимкнене у read-only клоні">Створити контракт</LockedButton>
        </div>
      </div>
    </Panel>
  );
}

function ContractsTab() {
  const [creating, setCreating] = useState(false);

  if (creating) return <NewContractPreview onClose={() => setCreating(false)} />;

  return (
    <section role="tabpanel" className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="m-0 text-[16px] font-semibold">Контракти</h2>
          <p className="mb-0 mt-1 text-[12px] text-[var(--muted-foreground)]">Дані постачальника/покупця для генерації інвойсів та додатків</p>
        </div>
        <button type="button" className="button button-primary self-start" onClick={() => setCreating(true)}>
          <Plus size={15} /> Новий контракт
        </button>
      </div>

      <div className="grid gap-3">
        {invoiceContracts.map((contract) => (
          <Panel key={contract.id} as="article" className="flex min-h-[74px] flex-col gap-3 border-[#b7dfbf] bg-[var(--green-soft)] p-4 shadow-none sm:flex-row sm:items-center">
            <ChevronRight size={15} className="shrink-0 text-[var(--muted-foreground)]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-[14px]">{contract.shortNumber}</strong>
                <StatusBadge tone="green">Активний</StatusBadge>
              </div>
              <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">{contract.supplier} → {contract.buyer}</p>
            </div>
            <div className="flex flex-wrap gap-1 sm:justify-end" aria-label={`Заблоковані дії контракту ${contract.shortNumber}`}>
              <LockedButton title="Деактивація контракту вимкнена"><Eye size={14} /><span className="sr-only">Деактивувати</span></LockedButton>
              <LockedButton title="Редагування контракту вимкнене"><Pencil size={14} /><span className="sr-only">Редагувати</span></LockedButton>
              <LockedButton title="Дублювання контракту вимкнене"><Copy size={14} /><span className="sr-only">Дублювати</span></LockedButton>
              <LockedButton title="Видалення контракту вимкнене"><Trash2 size={14} /><span className="sr-only">Видалити</span></LockedButton>
            </div>
          </Panel>
        ))}
      </div>
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
            <RepresentativeNotice shown={preview.representativeLines.length} total={preview.totalSourceRows} noun="рядків документа" />
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
                <tfoot><tr className="border-t-2 border-[var(--border)]"><td className="p-3 font-semibold">Source total · {preview.totalSourceRows} рядків</td><td className="p-3 text-right font-semibold">{preview.totalQuantity}</td><td /><td className="p-3 text-right font-mono font-bold">{formatPreviewMoney(preview.totalAmount, preview.currency)}</td></tr></tfoot>
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

function AppendixKpis() {
  const items = [
    { label: "Додатки", value: invoiceAppendixSourceTotals.appendices, icon: FileText, color: "text-[var(--blue)] bg-[var(--blue-soft)]" },
    { label: "Проформи", value: invoiceAppendixSourceTotals.proformas, icon: FileText, color: "text-[var(--green)] bg-[var(--green-soft)]" },
    { label: "Загальна сума", value: invoiceAppendixSourceTotals.amount, icon: DollarSign, color: "text-[var(--amber)] bg-[var(--amber-soft)]" },
    { label: "Контейнери", value: invoiceAppendixSourceTotals.containers, icon: Box, color: "text-[var(--orange)] bg-[var(--orange-soft)]" },
    { label: "Найближчий ETA", value: invoiceAppendixSourceTotals.nearestEta, icon: CalendarDays, color: "text-[var(--purple)] bg-[var(--purple-soft)]" },
  ] as const;
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Показники додатків">
      {items.map((item) => {
        const Icon = item.icon;
        return <Panel key={item.label} className="flex min-h-20 items-center gap-3 p-4 shadow-none"><span className={`grid size-9 shrink-0 place-items-center rounded-md ${item.color}`}><Icon size={18} /></span><span><span className="block text-[10px] text-[var(--muted-foreground)]">{item.label}</span><strong className="mt-1 block text-[20px] leading-none tabular-nums">{item.value}</strong></span></Panel>;
      })}
    </section>
  );
}

function AppendicesTab() {
  const [preview, setPreview] = useState<AppendixPreview | null>(null);
  return (
    <section role="tabpanel" className="grid gap-4">
      <AppendixKpis />
      <Panel className="overflow-hidden shadow-none">
        <RepresentativeNotice shown={invoiceAppendices.length} total={invoiceAppendixSourceTotals.appendices} noun="додатків" />
        <div className="data-table-wrap" tabIndex={0} role="region" aria-label="Додатки">
          <table className="data-table min-w-[1050px]">
            <thead><tr><th>Додаток</th><th>Дата</th><th>Склад</th><th>Відправка</th><th>ETA</th><th>Контракт</th><th className="text-right">Сума</th><th>Дії</th></tr></thead>
            <tbody>
              {invoiceAppendices.map((appendix) => (
                <tr key={appendix.id}>
                  <td><strong>{appendix.name}</strong></td>
                  <td>{appendix.date}</td>
                  <td>{appendix.composition}</td>
                  <td className="font-medium text-[var(--blue)]">{appendix.shipment}</td>
                  <td>{appendix.eta}</td>
                  <td><select value={appendix.contractNumber} disabled aria-label={`Контракт ${appendix.name}`} className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2 text-[10px]"><option>{appendix.contractNumber}</option></select></td>
                  <td className="text-right font-semibold text-[var(--green)]">{appendix.amount}</td>
                  <td>
                    <div className="flex min-w-max items-center gap-1">
                      <button type="button" className="button button-ghost min-h-8 px-2 text-[10px]" disabled={!appendix.preview} title={appendix.preview ? "Відкрити безпечний попередній перегляд" : "Для цього додатка окремий preview не зафіксований"} onClick={appendix.preview ? () => setPreview(appendix.preview ?? null) : undefined}><Eye size={13} /> Просмотр</button>
                      <LockedButton title="Генерація митного документа вимкнена"><Download size={13} /> Таможня</LockedButton>
                      <LockedButton title="Генерація банківського документа вимкнена"><Landmark size={13} /> Банк</LockedButton>
                      <LockedButton title="Видалення додатка вимкнене"><Trash2 size={13} /><span className="sr-only">Видалити</span></LockedButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <AppendixPreviewModal preview={preview} onClose={() => setPreview(null)} />
    </section>
  );
}

const invoiceFilters: ReadonlyArray<{ id: InvoiceShipmentFilter; label: string; count: number }> = [
  { id: "all", label: "Всі", count: invoiceShipmentSourceCounts.all },
  { id: "in-transit", label: "В дорозі", count: invoiceShipmentSourceCounts["in-transit"] },
  { id: "arrived", label: "Прибув", count: invoiceShipmentSourceCounts.arrived },
];

function InvoicesTab() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InvoiceShipmentFilter>("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("uk-UA");
  const visibleGroups = useMemo(() => invoiceShipmentGroups.filter((group) => {
    const filterMatch = filter === "all" || group.filterState === filter;
    const queryMatch = !normalizedQuery || group.billOfLading.toLocaleLowerCase("uk-UA").includes(normalizedQuery);
    return filterMatch && queryMatch;
  }), [filter, normalizedQuery]);
  const sourceGroupedCount = filter === "all" ? invoiceShipmentSourceCounts.groupedAll : filter === "in-transit" ? invoiceShipmentSourceCounts.groupedInTransit : invoiceShipmentSourceCounts.groupedArrived;

  return (
    <section role="tabpanel" className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="input-with-icon min-w-0 flex-1 lg:max-w-[420px]">
          <span className="sr-only">Пошук інвойсів</span><Search size={15} />
          <input className="input pr-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук інвойсів..." autoComplete="off" />
          {query ? <button type="button" className="input-trailing" onClick={() => setQuery("")} aria-label="Очистити пошук"><X size={14} /></button> : null}
        </label>
        <div className="segmented max-w-full overflow-x-auto" aria-label="Статус відвантажень">
          {invoiceFilters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label} ({item.count})</button>)}
        </div>
      </div>

      <Panel className="overflow-hidden shadow-none">
        {visibleGroups.length ? (
          <>
            <RepresentativeNotice shown={visibleGroups.length} total={sourceGroupedCount} noun="згрупованих BL" />
            <div className="data-table-wrap" role="region" aria-label="Відвантаження для інвойсів" tabIndex={0}>
              <table className="data-table min-w-[1120px]">
                <thead><tr><th>Контейнер</th><th>Назва</th><th>Проформа</th><th>Одиниці</th><th>EUR</th><th>Готовність</th><th>Контракт</th><th>Додаток</th><th>Інвойс</th><th>Сума</th><th>Дії</th></tr></thead>
                <tbody>{visibleGroups.map((group) => (
                  <tr key={group.id}>
                    <td><strong className="font-mono text-[var(--orange)]">BL {group.billOfLading}</strong></td>
                    <td>{group.containerCount} контейнер{group.containerCount === 1 ? "" : "и"}</td>
                    <td>—</td>
                    <td className="tabular-nums">{group.unitCount}</td>
                    <td>—</td>
                    <td><div className="flex flex-wrap gap-1"><StatusBadge tone="amber">{group.readiness}</StatusBadge><StatusBadge tone="green">ETA: {group.eta} ({group.visibleStatusLabel})</StatusBadge></div></td>
                    <td>—</td><td>—</td><td>—</td><td>—</td>
                    <td><LockedButton className="button-primary min-h-8 whitespace-nowrap px-2 text-[10px]" title="Формування BL вимкнене">Сформувати BL</LockedButton></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        ) : <EmptyState compact title="Відвантажень не знайдено" description="Змініть пошуковий запит або статусний фільтр." />}
      </Panel>

      <Panel className="overflow-hidden shadow-none">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3"><CheckCircle2 size={15} className="text-[var(--green)]" /><h2 className="m-0 text-[13px] font-semibold">Сформовані інвойси</h2><StatusBadge>{60}</StatusBadge></div>
        <RepresentativeNotice shown={formedInvoices.length} total={60} noun="сформованих інвойсів" />
        <div className="divide-y divide-[var(--border)]">
          {formedInvoices.map((invoice) => (
            <article key={invoice.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <FileText size={16} className="shrink-0 text-[var(--blue)]" />
              <div className="min-w-0 flex-1"><strong className="block font-mono text-[12px]">{invoice.invoiceNumber}</strong><span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{invoice.containerNumber} · {invoice.unitCount} од. · {invoice.total}</span></div>
              <time className="text-[10px] text-[var(--muted-foreground)]">{invoice.date}</time>
              <LockedButton title="Завантаження DOCX вимкнене"><Download size={13} /> DOCX</LockedButton>
            </article>
          ))}
        </div>
      </Panel>
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
  return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Підсумки собівартості">{items.map((item) => { const Icon = item.icon; return <Panel key={item.label} className="flex min-h-20 items-center gap-3 p-4 shadow-none"><span className={`grid size-9 shrink-0 place-items-center rounded-md ${item.color}`}><Icon size={17} /></span><span className="min-w-0"><span className="block text-[9px] font-bold uppercase text-[var(--muted-foreground)]">{item.label}</span><strong className="mt-1 block truncate text-[20px] leading-none">{item.value}</strong></span></Panel>; })}</section>;
}

function MonthMenu({ open, selected, onToggleOpen, onToggleMonth, onAll, onReset }: {
  open: boolean;
  selected: readonly InvoiceCostMonthId[];
  onToggleOpen: () => void;
  onToggleMonth: (month: InvoiceCostMonthId) => void;
  onAll: () => void;
  onReset: () => void;
}) {
  const allSelected = selected.length === invoiceCostMonths.length;
  return (
    <div className="relative">
      <button type="button" className="button button-ghost" aria-expanded={open} aria-haspopup="menu" onClick={onToggleOpen}>
        {allSelected ? "Всі місяці" : selected.length ? `Місяців: ${selected.length}` : "Місяці не обрані"}<ChevronDown size={13} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-56 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-menu)]" role="menu" aria-label="Фільтр за місяцем">
          <div className="flex border-b border-[var(--border)] px-2 py-1.5"><button type="button" className="button button-ghost min-h-7 px-2 text-[10px]" onClick={onAll}>Обрати всі</button><button type="button" className="button button-ghost min-h-7 px-2 text-[10px]" onClick={onReset}>Скинути</button></div>
          <div className="p-1">{invoiceCostMonths.map((month) => <button key={month.id} type="button" role="menuitemcheckbox" aria-checked={selected.includes(month.id)} onClick={() => onToggleMonth(month.id)} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[11px] hover:bg-[var(--surface-subtle)]"><span className={`grid size-4 place-items-center rounded border ${selected.includes(month.id) ? "border-[var(--orange)] bg-[var(--orange)] text-white" : "border-[var(--border)]"}`}>{selected.includes(month.id) ? "✓" : ""}</span><span className="flex-1">{month.label}</span><span className="text-[var(--muted-foreground)]">{month.sourceCount}</span></button>)}</div>
        </div>
      ) : null}
    </div>
  );
}

function CostTab() {
  const [view, setView] = useState<InvoiceCostView>("active");
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<readonly InvoiceCostMonthId[]>(invoiceCostMonths.map((month) => month.id));
  const visibleCards = useMemo(() => invoiceCostCards.filter((card) => {
    const viewMatch = view === "archive" ? card.archived : view === "incomplete" ? !card.archived && card.incomplete : !card.archived;
    const allMonthsSelected = selectedMonths.length === invoiceCostMonths.length;
    const monthMatch = card.month ? selectedMonths.includes(card.month) : allMonthsSelected;
    return viewMatch && monthMatch;
  }), [selectedMonths, view]);
  const sourceCount = invoiceCostSourceCounts[view];

  const toggleMonth = (month: InvoiceCostMonthId) => setSelectedMonths((current) => current.includes(month) ? current.filter((item) => item !== month) : [...current, month]);

  return (
    <section role="tabpanel" className="grid gap-4">
      <CostKpis view={view} />
      <Panel className="overflow-visible shadow-none">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2"><DollarSign size={15} /><h2 className="m-0 text-[13px] font-semibold">Дані собівартості за коносаментом</h2><LockedButton title="Експорт Excel вимкнений"><Download size={13} /> Експорт Excel</LockedButton><MonthMenu open={monthMenuOpen} selected={selectedMonths} onToggleOpen={() => setMonthMenuOpen((value) => !value)} onToggleMonth={toggleMonth} onAll={() => setSelectedMonths(invoiceCostMonths.map((month) => month.id))} onReset={() => setSelectedMonths([])} /></div>
          <div className="segmented ml-auto max-w-full overflow-x-auto" aria-label="Стан даних собівартості">
            <button type="button" aria-pressed={view === "active"} onClick={() => setView("active")}>Активні</button>
            <button type="button" aria-pressed={view === "archive"} onClick={() => setView("archive")}>Архів</button>
            <button type="button" aria-pressed={view === "incomplete"} onClick={() => setView("incomplete")}>Незаповнені</button>
          </div>
        </div>
        {visibleCards.length ? (
          <>
            <RepresentativeNotice shown={visibleCards.length} total={sourceCount} noun="BL-карток" />
            <div className="grid gap-2 p-3">
              {visibleCards.map((card) => (
                <article key={card.id} className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                  <div className="grid min-w-[1020px] grid-cols-[28px_90px_72px_132px_150px_repeat(4,105px)_112px_70px_42px] items-center gap-2 px-3 py-3 text-[10px]">
                    <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
                    <strong className="font-mono text-[12px] text-[var(--blue)]">BL {card.billOfLading}</strong>
                    <span className="text-[var(--muted-foreground)]">{card.shipmentLabel}</span>
                    {card.eta ? <StatusBadge tone="green">ETA: {card.eta}</StatusBadge> : <span className="text-[var(--muted-foreground)]">ETA: —</span>}
                    <span className="text-[var(--green)]">Товар: <strong>{card.goodsEur}</strong> <span className="text-[var(--muted-foreground)]">({card.goodsUsd}) @1.08</span></span>
                    <span className="text-[var(--blue)]">Фрахт:<strong className="mt-1 block">{card.freight}</strong></span>
                    <span className="text-[var(--green)]">Митниця:<strong className="mt-1 block">{card.customs}</strong></span>
                    <span className="text-[var(--orange)]">Брокер:<strong className="mt-1 block">{card.broker}</strong></span>
                    <span className="text-[var(--purple)]">Гот.:<strong className="mt-1 block">{card.cash}</strong></span>
                    <span className="text-[var(--amber)]">Всього:<strong className="mt-1 block text-[12px]">{card.total}</strong></span>
                    <span className="text-[var(--muted-foreground)]">Собів.:<strong className="mt-1 block text-[var(--foreground)]">{card.costPercent}</strong></span>
                    <LockedButton title={card.archived ? "Відновлення BL вимкнене" : "Архівація BL вимкнена"}>{card.archived ? <RotateCcw size={13} /> : <Archive size={13} />}<span className="sr-only">{card.archived ? "Відновити цей BL" : "Архівувати цей BL"}</span></LockedButton>
                  </div>
                  {view === "incomplete" ? <div className="border-t border-[var(--border)] bg-[var(--amber-soft)] px-3 py-2 text-[10px] text-[var(--amber)]"><AlertTriangle size={13} className="mr-1 inline" />Є незаповнені витрати</div> : null}
                </article>
              ))}
            </div>
          </>
        ) : <EmptyState compact title="Даних за обраними місяцями немає" description="Оберіть інший місяць або поверніть фільтр «Всі місяці»." />}
      </Panel>
    </section>
  );
}

export function AdminInvoicesPage() {
  const [tab, setTab] = useState<InvoiceTabId>("contracts");
  const uploadLabel = uploadLabels[tab];

  return (
    <main className="page page-narrow">
      <PageHeader
        admin
        title="Інвойси та документи"
        description="Керування інвойсами, контрактами та митними документами"
        action={uploadLabel ? <LockedButton title={`${uploadLabel} вимкнене у read-only клоні`}><Upload size={14} /> {uploadLabel}</LockedButton> : undefined}
      />
      <div className="grid gap-5">
        <PageKpis />
        <InvoiceTabs active={tab} onChange={setTab} />
        {tab === "contracts" ? <ContractsTab /> : null}
        {tab === "appendices" ? <AppendicesTab /> : null}
        {tab === "invoices" ? <InvoicesTab /> : null}
        {tab === "cost" ? <CostTab /> : null}
      </div>
    </main>
  );
}
