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
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import { PersistedCollapsibleSection } from "@/components/shared/persisted-collapsible-section";
import { Panel, StatusBadge } from "@/components/shared/ui";
import {usePersistedBoolean} from "@/hooks/use-persisted-boolean";
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

export type SettlementSort = "name" | "movements" | "last-movement";

export interface AdminSettlementsModel {
  query: string;
  setQuery(value: string): void;
  expandedDealerId: string | null;
  toggleDealer(dealerId: string): void;
  sort: SettlementSort;
  setSort(value: SettlementSort): void;
  recentOnly: boolean;
  setRecentOnly(value: boolean): void;
  visibleDealers: readonly SettlementDealer[];
  visibleKpis: {
    dealers: number;
    mappedDealers: number;
    movements: number;
  };
  activePreset: SettlementPeriodPresetId | null;
  startDate: string;
  endDate: string;
  setStartDate(value: string): void;
  setEndDate(value: string): void;
  applyPreset(presetId: SettlementPeriodPresetId): void;
  diagnosticOpen: boolean;
  setDiagnosticOpen(value: boolean): void;
}

const loadAstryxAdminSettlementsView = () => import("./astryx-admin-settlements-view");

function parseMovementDate(value: string) {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day).getTime();
}

const mostRecentMovementDate = settlementDealers.reduce<string>(
  (latest, dealer) => parseMovementDate(dealer.movements.lastMovementDate) > parseMovementDate(latest)
    ? dealer.movements.lastMovementDate
    : latest,
  settlementDealers[0].movements.lastMovementDate,
);

function SyncDiagnostic({onOpenChange}: {onOpenChange(open: boolean): void}) {
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
            title="Синхронізація з 1С недоступна: доступ лише для читання."
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
        onOpenChange={onOpenChange}
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

function PeriodShell({ dealerId, model }: { dealerId: string; model: AdminSettlementsModel }) {
  const {activePreset, startDate, endDate, setStartDate, setEndDate, applyPreset} = model;

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
          title="Оновлення балансу недоступне: доступ лише для читання."
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
  model,
}: {
  dealer: SettlementDealer;
  expanded: boolean;
  onToggle: () => void;
  model: AdminSettlementsModel;
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

      {expanded ? <PeriodShell dealerId={dealer.id} model={model} /> : null}
    </article>
  );
}

function CurrentAdminSettlementsView({model}: {model: AdminSettlementsModel}) {
  return (
    <div data-brp-admin-fulfillment-renderer="shadcn">
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

        <SyncDiagnostic onOpenChange={model.setDiagnosticOpen} />

        <AdminKpiGrid
          columns={3}
          label="Показники взаєморозрахунків"
          hideOnMobile
          items={[
            { id: "dealers", label: "Дилерів", value: model.visibleKpis.dealers, icon: <Building2 size={18} />, tone: "blue" },
            { id: "mapped", label: "З маппінгом", value: model.visibleKpis.mappedDealers, icon: <CheckCircle2 size={18} />, tone: "green" },
            { id: "movements", label: "Всього рухів", value: formatInteger(model.visibleKpis.movements), icon: <ArrowLeftRight size={18} /> },
          ]}
        />

        <AdminToolbar
          search={(
            <AdminSearchField
              value={model.query}
              onValueChange={model.setQuery}
              label="Фільтр за дилером або 1С контрагентом"
              placeholder="Фільтр за дилером або 1С контрагентом…"
              clearLabel="Очистити фільтр взаєморозрахунків"
            />
          )}
          filters={(
            <>
              <label className="field min-w-0">
                <span className="sr-only">Сортування дилерів</span>
                <select value={model.sort} onChange={(event) => model.setSort(event.target.value as SettlementSort)} aria-label="Сортування дилерів">
                  <option value="name">За назвою дилера</option>
                  <option value="movements">За кількістю рухів</option>
                  <option value="last-movement">За датою останнього руху</option>
                </select>
              </label>
              <label className="inline-flex min-h-10 items-center gap-2 text-[11px]">
                <input type="checkbox" checked={model.recentOnly} onChange={(event) => model.setRecentOnly(event.target.checked)} aria-label={`Лише рухи за ${mostRecentMovementDate}`} />
                Останній рух {mostRecentMovementDate}
              </label>
            </>
          )}
          meta={<span className="hidden md:inline">{model.visibleDealers.length} з {settlementDealers.length} дилерів</span>}
          mobileDisclosure={{ sections: ["filters"], activeCount: Number(model.sort !== "name") + Number(model.recentOnly), iconOnly: true }}
        />

        <section className="grid gap-2" aria-label="Дилери">
          {model.visibleDealers.map((dealer) => (
            <DealerAccordionRow
              key={dealer.id}
              dealer={dealer}
              expanded={model.expandedDealerId === dealer.id}
              onToggle={() => model.toggleDealer(dealer.id)}
              model={model}
            />
          ))}

          {model.visibleDealers.length === 0 ? (
            <Panel className="grid min-h-52 place-items-center p-6 text-center shadow-none" as="section">
              <div>
                <Search size={38} strokeWidth={1.6} className="mx-auto text-[var(--faint)]" />
                <p className="mb-0 mt-3 text-[14px] font-medium">Немає збігів</p>
              </div>
            </Panel>
          ) : null}
        </section>
      </AdminPage>
    </div>
  );
}

export function AdminSettlementsPage() {
  const initialPreset = settlementPeriodPresets[0];
  const [query, setQuery] = useState("");
  const [expandedDealerId, setExpandedDealerId] = useState<string | null>(null);
  const [sort, setSort] = useState<SettlementSort>("name");
  const [recentOnly, setRecentOnly] = useState(false);
  const [activePreset, setActivePreset] = useState<SettlementPeriodPresetId | null>(initialPreset.id);
  const [startDate, setStartDateState] = useState<string>(initialPreset.startDate);
  const [endDate, setEndDateState] = useState<string>(initialPreset.endDate);
  const {value: diagnosticOpen, setValue: setDiagnosticOpen} = usePersistedBoolean("admin.settlements.sync-diagnostic", false);

  const visibleDealers = useMemo(() => settlementDealers
    .filter((dealer) => matchesDealer(dealer, query))
    .filter((dealer) => !recentOnly || dealer.movements.lastMovementDate === mostRecentMovementDate)
    .toSorted((left, right) => {
      if (sort === "movements") return right.movements.total - left.movements.total || left.name.localeCompare(right.name, "uk-UA");
      if (sort === "last-movement") return parseMovementDate(right.movements.lastMovementDate) - parseMovementDate(left.movements.lastMovementDate) || left.name.localeCompare(right.name, "uk-UA");
      return left.name.localeCompare(right.name, "uk-UA");
    }), [query, recentOnly, sort]);

  const visibleKpis = useMemo(() => ({
    dealers: visibleDealers.length,
    mappedDealers: visibleDealers.filter((dealer) => dealer.mapping.state === "mapped").length,
    movements: visibleDealers.reduce((total, dealer) => total + dealer.movements.total, 0),
  }), [visibleDealers]);

  const model: AdminSettlementsModel = {
    query,
    setQuery,
    expandedDealerId,
    toggleDealer: (dealerId) => setExpandedDealerId((current) => current === dealerId ? null : dealerId),
    sort,
    setSort,
    recentOnly,
    setRecentOnly,
    visibleDealers,
    visibleKpis,
    activePreset,
    startDate,
    endDate,
    setStartDate: (value) => {
      setActivePreset(null);
      setStartDateState(value);
    },
    setEndDate: (value) => {
      setActivePreset(null);
      setEndDateState(value);
    },
    applyPreset: (presetId) => {
      const preset = settlementPeriodPresets.find((item) => item.id === presetId);
      if (!preset) return;
      setActivePreset(preset.id);
      setStartDateState(preset.startDate);
      setEndDateState(preset.endDate);
    },
    diagnosticOpen,
    setDiagnosticOpen,
  };

  return (
    <RendererViewSwitch
      slotId="admin-settlements"
      currentView={<CurrentAdminSettlementsView model={model} />}
      loadAstryxView={loadAstryxAdminSettlementsView}
      astryxViewProps={{model}}
    />
  );
}
