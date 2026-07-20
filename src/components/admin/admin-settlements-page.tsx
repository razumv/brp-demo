"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  LockKeyhole,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { PersistedCollapsibleSection } from "@/components/shared/persisted-collapsible-section";
import { Panel, StatusBadge } from "@/components/shared/ui";
import {
  settlementDealers,
  settlementPeriodPresets,
  settlementSyncDiagnostic,
  type SettlementDealer,
  type SettlementPeriodPresetId,
} from "@/lib/admin-settlements-data";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value).replace(/[\u00a0\u202f]/g, " ");
}

function matchesDealer(dealer: SettlementDealer, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  return normalize([
    dealer.name,
    ...dealer.mapping.evidencedCounterpartyNames,
  ].join(" ")).includes(normalizedQuery);
}

function SyncDiagnostic() {
  const diagnostic = settlementSyncDiagnostic;

  return (
    <Panel className="overflow-hidden shadow-none">
      <PersistedCollapsibleSection
        persistenceId="admin.settlements.sync-diagnostic"
        title="Оновлюється"
        defaultOpen={false}
        collapseMode="mobile"
        headingLevel="h2"
        icon={<span className="size-2 shrink-0 rounded-full bg-[var(--amber)]" />}
        titleContent={<span data-settlement-status><StatusBadge tone="amber">{diagnostic.stateLabel}</StatusBadge></span>}
        actions={(
          <button
            type="button"
            data-settlement-refresh
            className="button button-outline w-fit"
            disabled
            title="Синхронізація з 1С вимкнена у read-only демонстрації"
          >
            <LockKeyhole size={13} />
            <RefreshCw size={14} />
            Оновити з 1С (30 днів)
          </button>
        )}
        headerClassName="border-b border-[var(--border)] px-4 py-3"
        contentClassName="p-4"
        hiddenUntilFound={false}
        keepMounted
        hideActionsWhenMobileClosed
        dataComponent="settlements-diagnostic"
      >
        <div data-settlement-diagnostic-grid className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.74fr)]">
          <div className="grid content-start gap-2 text-[12px] text-[var(--muted-foreground)]">
            <p className="m-0">
              Остання успішна синхронізація: <strong className="text-[var(--foreground)]">{diagnostic.lastSuccessfulSync}</strong>
            </p>
            <p className="m-0">
              Рухи синхронізовано: <strong className="text-[var(--foreground)]">{diagnostic.movementsSyncedAt}</strong>
            </p>
            <p className="m-0">{diagnostic.daytimeSchedule} · {diagnostic.nighttimeSchedule}</p>
            <p className="m-0">{diagnostic.liveBalanceNote}</p>
          </div>

          <div className="grid content-start gap-2">
            <p className="m-0 w-fit rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px]">
              {diagnostic.synchronizedMovementCount} рухів / {diagnostic.mappingCount} маппінгів / {diagnostic.errorCount} помилок
            </p>
            <div className="flex min-w-0 items-start gap-2 rounded-md border border-[var(--red)] bg-[var(--red-soft)] px-3 py-2 text-[11px] text-[var(--red)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p className="m-0 min-w-0">
                <span className="font-medium">Остання помилка: </span>
                <code className="break-all font-mono">{diagnostic.lastError}</code>
              </p>
            </div>
          </div>
        </div>
      </PersistedCollapsibleSection>
    </Panel>
  );
}

function PeriodShell({ dealerId }: { dealerId: string }) {
  const initialPreset = settlementPeriodPresets[0];
  const [activePreset, setActivePreset] = useState<SettlementPeriodPresetId | null>(initialPreset.id);
  const [startDate, setStartDate] = useState<string>(initialPreset.startDate);
  const [endDate, setEndDate] = useState<string>(initialPreset.endDate);

  const applyPreset = (presetId: SettlementPeriodPresetId) => {
    const preset = settlementPeriodPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setActivePreset(preset.id);
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)] p-4" id={`settlement-${dealerId}-detail`}>
      <div className="grid gap-3 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto_auto] xl:items-end">
        <label className="field">
          <span>Дата початку періоду</span>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => {
              setActivePreset(null);
              setStartDate(event.target.value);
            }}
          />
        </label>
        <label className="field">
          <span>Дата завершення періоду</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => {
              setActivePreset(null);
              setEndDate(event.target.value);
            }}
          />
        </label>

        <AdminSegmentedControl<SettlementPeriodPresetId | "custom">
          items={settlementPeriodPresets.map((preset) => ({ id: preset.id, label: preset.label }))}
          value={activePreset ?? "custom"}
          onValueChange={(presetId) => {
            if (presetId !== "custom") applyPreset(presetId);
          }}
          label="Швидкий вибір періоду"
        />

        <button
          type="button"
          className="button button-outline shrink-0"
          disabled
          title="Читання актуального балансу 1С вимкнене у read-only демонстрації"
        >
          <LockKeyhole size={13} />
          <RefreshCw size={14} />
          Оновити
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-md border border-[var(--red)] bg-[var(--red-soft)] p-3 text-[12px] text-[var(--red)]" role="status">
        <Database size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <code className="block break-all font-mono font-semibold">{settlementSyncDiagnostic.lastError}</code>
          <p className="mb-0 mt-1">{settlementSyncDiagnostic.liveBalanceNote}</p>
        </div>
      </div>
    </div>
  );
}

function DealerAccordionRow({
  dealer,
  expanded,
  onToggle,
}: {
  dealer: SettlementDealer;
  expanded: boolean;
  onToggle: () => void;
}) {
  const detailId = `settlement-${dealer.id}-detail`;

  return (
    <article className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <button
        type="button"
        className="flex min-h-[60px] w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--surface-subtle)] sm:px-4"
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={`${expanded ? "Закрити" : "Відкрити"} баланси ${dealer.name}`}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[13px]">{dealer.name}</strong>
          <span className="mt-1 block text-[10px] text-[var(--muted-foreground)] sm:hidden">
            Останній рух {dealer.movements.lastMovementDate}
          </span>
        </div>

        <div className="hidden min-w-[118px] text-right sm:block">
          <strong className="block text-[12px] tabular-nums">{dealer.mapping.linkedCounterparties}</strong>
          <span className="text-[10px] text-[var(--muted-foreground)]">балансів</span>
        </div>
        <div className="min-w-[72px] text-right">
          <strong className="block text-[12px] tabular-nums">{formatInteger(dealer.movements.total)}</strong>
          <span className="text-[10px] text-[var(--muted-foreground)]">рухів</span>
        </div>
        <div className="hidden min-w-[138px] text-right md:block">
          <strong className="block text-[12px] font-medium tabular-nums">{dealer.movements.lastMovementDate}</strong>
          <span className="text-[10px] text-[var(--muted-foreground)]">останній рух</span>
        </div>
        {expanded ? <ChevronUp size={16} className="shrink-0 text-[var(--muted-foreground)]" /> : <ChevronDown size={16} className="shrink-0 text-[var(--muted-foreground)]" />}
      </button>

      {expanded ? <PeriodShell dealerId={dealer.id} /> : null}
    </article>
  );
}

export function AdminSettlementsPage() {
  const [query, setQuery] = useState("");
  const [expandedDealerId, setExpandedDealerId] = useState<string | null>(null);

  const visibleDealers = useMemo(
    () => settlementDealers.filter((dealer) => matchesDealer(dealer, query)),
    [query],
  );

  const visibleKpis = useMemo(() => ({
    dealers: visibleDealers.length,
    mappedDealers: visibleDealers.filter((dealer) => dealer.mapping.state === "mapped").length,
    movements: visibleDealers.reduce((total, dealer) => total + dealer.movements.total, 0),
  }), [visibleDealers]);

  return (
    <AdminPage>
      <Link
        href="/admin"
        className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={14} />
        Назад
      </Link>

      <AdminPageHeader
        icon={<ArrowLeftRight size={20} />}
        title="Взаєморозрахунки з дилерами"
        description="Баланси дилерів з розбивкою по контрагентах в 1С (Bombardier / Bombardier СД / Sea Doo СД)"
      />

      <SyncDiagnostic />

      <AdminKpiGrid
        columns={3}
        label="Показники взаєморозрахунків"
        hideOnMobile
        items={[
          { id: "dealers", label: "Дилерів", value: visibleKpis.dealers, icon: <Building2 size={18} />, tone: "blue" },
          { id: "mapped", label: "З маппінгом", value: visibleKpis.mappedDealers, icon: <CheckCircle2 size={18} />, tone: "green" },
          { id: "movements", label: "Всього рухів", value: formatInteger(visibleKpis.movements), icon: <ArrowLeftRight size={18} /> },
        ]}
      />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Фільтр за дилером або 1С контрагентом"
            placeholder="Фільтр за дилером або 1С контрагентом…"
            clearLabel="Очистити фільтр взаєморозрахунків"
          />
        )}
        meta={`${visibleDealers.length} з ${settlementDealers.length} дилерів`}
      />

      <section className="grid gap-2" aria-label="Дилери">
        {visibleDealers.map((dealer) => (
          <DealerAccordionRow
            key={dealer.id}
            dealer={dealer}
            expanded={expandedDealerId === dealer.id}
            onToggle={() => setExpandedDealerId((current) => current === dealer.id ? null : dealer.id)}
          />
        ))}

        {visibleDealers.length === 0 ? (
          <Panel className="grid min-h-52 place-items-center p-6 text-center shadow-none" as="section">
            <div>
              <Search size={38} strokeWidth={1.6} className="mx-auto text-[var(--faint)]" />
              <p className="mb-0 mt-3 text-[14px] font-medium">Немає збігів</p>
            </div>
          </Panel>
        ) : null}
      </section>
    </AdminPage>
  );
}
