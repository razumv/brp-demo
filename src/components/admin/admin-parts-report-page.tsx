"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Panel } from "@/components/shared/ui";
import {
  initialPartsReportFilter,
  PARTS_REPORT_CONTROL_NOTICE,
  PARTS_REPORT_PAYMENTS_EMPTY,
  PARTS_REPORT_RN_EMPTY,
  partsReportKpis,
  partsReportOrders,
  partsReportPaymentRows,
  partsReportPeriodPresets,
  partsReportRnRows,
  syntheticManagerOptions,
  type PartsReportFilter,
  type PartsReportPeriodPreset,
  type SyntheticManagerId,
} from "@/lib/admin-parts-report-data";

function formatUsd(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function FieldLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="mb-1 flex items-center gap-2 text-[13px] font-medium text-[var(--muted-foreground)]">
      {icon}
      {children}
    </span>
  );
}

function FilterPanel({
  draft,
  onChange,
  onApply,
}: {
  draft: PartsReportFilter;
  onChange: (next: PartsReportFilter) => void;
  onApply: () => void;
}) {
  const [managerOpen, setManagerOpen] = useState(false);
  const selectedManager = syntheticManagerOptions.find((manager) => manager.id === draft.managerId) ?? syntheticManagerOptions[0];

  const selectPreset = (preset: PartsReportPeriodPreset) => {
    onChange({ ...draft, from: preset.from, to: preset.to });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <Panel className="p-4 shadow-none">
      <form onSubmit={submit}>
        <div className="grid gap-4 xl:grid-cols-[minmax(180px,272px)_minmax(180px,272px)_minmax(240px,1fr)_115px] xl:items-end">
          <label className="block min-w-0">
            <FieldLabel icon={<CalendarDays size={14} />}>З дати</FieldLabel>
            <input
              type="date"
              className="h-8 w-full rounded-md border border-[var(--border)] bg-[#eaedf2] px-3 text-[13px] font-medium outline-none focus:border-[var(--orange)] dark:bg-[#010409]"
              value={draft.from}
              max={draft.to}
              onChange={(event) => onChange({ ...draft, from: event.target.value })}
            />
          </label>

          <label className="block min-w-0">
            <FieldLabel icon={<CalendarDays size={14} />}>По дату</FieldLabel>
            <input
              type="date"
              className="h-8 w-full rounded-md border border-[var(--border)] bg-[#eaedf2] px-3 text-[13px] font-medium outline-none focus:border-[var(--orange)] dark:bg-[#010409]"
              value={draft.to}
              min={draft.from}
              onChange={(event) => onChange({ ...draft, to: event.target.value })}
            />
          </label>

          <div className="relative min-w-0">
            <FieldLabel icon={<UserRound size={14} />}>Менеджер</FieldLabel>
            <button
              type="button"
              role="combobox"
              aria-label="Менеджер"
              aria-expanded={managerOpen}
              aria-controls="parts-report-manager-options"
              className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[#eaedf2] px-3 text-left text-[13px] font-medium outline-none focus:border-[var(--orange)] dark:bg-[#010409]"
              onClick={() => setManagerOpen((current) => !current)}
            >
              <span className="truncate">{selectedManager.label}</span>
              <ChevronDown size={14} className="shrink-0 text-[var(--muted-foreground)]" />
            </button>
            {managerOpen ? (
              <div
                id="parts-report-manager-options"
                role="listbox"
                aria-label="Синтетичні менеджери"
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)] py-1 shadow-[var(--shadow-menu)]"
              >
                {syntheticManagerOptions.map((manager) => {
                  const selected = manager.id === draft.managerId;
                  return (
                    <button
                      key={manager.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex min-h-8 w-full items-center justify-between gap-2 px-3 text-left text-[12px] hover:bg-[var(--surface-subtle)] ${selected ? "bg-[var(--surface-subtle)]" : ""}`}
                      onClick={() => {
                        onChange({ ...draft, managerId: manager.id as SyntheticManagerId });
                        setManagerOpen(false);
                      }}
                    >
                      <span>{manager.label}</span>
                      {selected ? <Check size={14} /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <button type="submit" className="button button-outline !min-h-8 px-4 text-[13px]">Застосувати</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {partsReportPeriodPresets.map((preset) => {
            const selected = draft.from === preset.from && draft.to === preset.to;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                className="button button-outline !min-h-7 px-3 text-[11px]"
                onClick={() => selectPreset(preset)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </form>
    </Panel>
  );
}

function DataControlNotice() {
  return (
    <section className="rounded-md border border-[#d8d2bd] bg-[#f3f2ed] px-4 py-3 text-[#8a6500] dark:border-[#4b4322] dark:bg-[#221f15] dark:text-[#d4a72c]" aria-label={PARTS_REPORT_CONTROL_NOTICE.title}>
      <div className="flex items-center gap-2 text-[13px] font-semibold">
        <AlertTriangle size={15} />
        <h2 className="m-0 text-[13px] font-semibold">{PARTS_REPORT_CONTROL_NOTICE.title}</h2>
      </div>
      <p className="mb-0 mt-2 flex items-start gap-2 text-[13px] leading-[18px]">
        <span aria-hidden="true">•</span>
        <span>{PARTS_REPORT_CONTROL_NOTICE.copy}</span>
      </p>
    </section>
  );
}

function KpiCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Показники звіту ЗЧ">
      {partsReportKpis.map((kpi) => (
        <Panel key={kpi.id} className="min-h-[119px] p-4 shadow-none">
          <p className="m-0 text-[13px] text-[var(--muted-foreground)]">{kpi.label}</p>
          <strong className="mt-2 block text-[30px] font-bold leading-8 tracking-[-0.02em]">{formatUsd(kpi.amountUsd)}</strong>
          <p className="mb-0 mt-2 text-[12px] text-[var(--muted-foreground)]">{kpi.helper}</p>
        </Panel>
      ))}
    </section>
  );
}

function OrdersTable() {
  return (
    <Panel className="overflow-hidden shadow-none">
      <h2 className="m-0 border-b border-[var(--border)] px-4 py-3 text-[24px] font-bold leading-8">Замовлення менеджера</h2>
      <div className="data-table-wrap">
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>Замовлення</th>
              <th>Дата</th>
              <th>Дилер</th>
              <th>Хто розмістив</th>
              <th>Менеджер</th>
              <th className="text-right">Позицій</th>
              <th className="text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {partsReportOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.detailId}`} className="font-medium text-[var(--orange)] hover:underline">{order.code}</Link>
                  <span className="mt-1 block w-fit rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[9px] text-[var(--muted-foreground)]">{order.status}</span>
                </td>
                <td className="whitespace-nowrap text-[var(--muted-foreground)]">{order.date}</td>
                <td>{order.dealer}</td>
                <td>{order.placedBy}</td>
                <td>{order.manager}</td>
                <td className="text-right tabular-nums">{order.positions}</td>
                <td className="text-right font-bold tabular-nums">{formatUsd(order.amountUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RnTable() {
  return (
    <Panel className="overflow-hidden shadow-none">
      <div className="flex items-start gap-2 border-b border-[var(--border)] px-4 py-3">
        <ReceiptText size={17} className="mt-1.5 shrink-0" />
        <h2 className="m-0 text-[24px] font-bold leading-8">РН / накладні за цими замовленнями</h2>
      </div>
      <div className="data-table-wrap">
        <table className="data-table min-w-[880px]">
          <thead>
            <tr>
              <th>РН</th>
              <th>Замовлення</th>
              <th>Дата</th>
              <th>Статус</th>
              <th className="text-right">К-сть</th>
              <th className="text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {partsReportRnRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-20 text-center text-[var(--muted-foreground)]">{PARTS_REPORT_RN_EMPTY}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PaymentsTable() {
  return (
    <Panel className="overflow-hidden shadow-none">
      <h2 className="m-0 border-b border-[var(--border)] px-4 py-3 text-[24px] font-bold leading-8">{"Оплати з точним зв'язком"}</h2>
      <div className="data-table-wrap">
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>Документ</th>
              <th>Дата</th>
              <th>{"Зв'язок"}</th>
              <th>Коментар</th>
              <th className="text-right">Сума</th>
            </tr>
          </thead>
          <tbody>
            {partsReportPaymentRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-20 text-center text-[var(--muted-foreground)]">{PARTS_REPORT_PAYMENTS_EMPTY}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function AdminPartsReportPage() {
  const [draftFilter, setDraftFilter] = useState<PartsReportFilter>({ ...initialPartsReportFilter });
  const [appliedFilter, setAppliedFilter] = useState<PartsReportFilter>({ ...initialPartsReportFilter });

  return (
    <main className="page">
      <div className="space-y-6">
        <header className="page-header !mb-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <FileText size={27} className="shrink-0 text-[var(--orange)]" />
              <h1 className="page-title">Звіт ЗЧ</h1>
            </div>
            <p className="page-description !text-[13px]">Замовлення, РН та оплати за менеджером і періодом</p>
          </div>
          <button
            type="button"
            disabled
            title="Оновлення звіту вимкнено у read-only демонстрації"
            className="button button-primary !min-h-8 px-4 text-[13px] disabled:opacity-70"
          >
            <LockKeyhole size={12} className="sr-only" />
            <RefreshCw size={14} />
            Оновити
          </button>
        </header>

        <FilterPanel
          draft={draftFilter}
          onChange={setDraftFilter}
          onApply={() => setAppliedFilter({ ...draftFilter })}
        />

        <DataControlNotice />
        <div
          data-report-from={appliedFilter.from}
          data-report-to={appliedFilter.to}
          data-report-manager={appliedFilter.managerId}
          aria-label={`Застосований звіт: ${appliedFilter.from} — ${appliedFilter.to}`}
        >
          <KpiCards />
        </div>
        <OrdersTable />
        <RnTable />
        <PaymentsTable />
      </div>
    </main>
  );
}
