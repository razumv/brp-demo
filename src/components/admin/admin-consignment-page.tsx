"use client";

import { useMemo, useState } from "react";
import {
  Download,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { Panel } from "@/components/shared/ui";
import {
  CONSIGNMENT_SOURCE_TOTALS,
  consignmentHolders,
  consignmentRequestFilters,
  consignmentRequests,
  consignmentStockPositions,
  type ConsignmentHolderId,
  type ConsignmentRequestFilter,
  type ConsignmentStockPosition,
} from "@/lib/admin-consignment-data";

type ConsignmentView = "warehouse" | "network" | "requests";

const views: ReadonlyArray<{ id: ConsignmentView; label: string }> = [
  { id: "warehouse", label: "Весь склад" },
  { id: "network", label: "Мережа" },
  { id: "requests", label: "Заявки" },
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function matchesPosition(position: ConsignmentStockPosition, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return normalize(`${position.partNumber} ${position.description}`).includes(normalizedQuery);
}

function holderQuantity(position: ConsignmentStockPosition, holderId: ConsignmentHolderId) {
  return position.quantities[holderId] ?? 0;
}

function positionHolderEntries(position: ConsignmentStockPosition) {
  return consignmentHolders.flatMap((holder) => {
    const quantity = holderQuantity(position, holder.id);
    return quantity > 0 ? [{ holder, quantity }] : [];
  });
}

function WarehouseMatrix({ positions }: { positions: readonly ConsignmentStockPosition[] }) {
  return (
    <Panel className="overflow-hidden shadow-none">
      <div
        className="max-w-full overflow-x-auto"
        role="region"
        aria-label="Залишки по 16 дилерах"
        tabIndex={0}
      >
        <table className="min-w-[2380px] table-fixed border-separate border-spacing-0 text-[11px]">
          <caption className="sr-only">Матриця складських залишків по дилерській мережі</caption>
          <colgroup>
            <col className="w-[120px]" />
            <col className="w-[260px]" />
            <col className="w-[80px]" />
            {consignmentHolders.map((holder) => <col key={holder.id} className="w-[120px]" />)}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-r border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5 text-left font-semibold md:sticky md:left-0 md:z-30"
              >
                Артикул
              </th>
              <th
                scope="col"
                className="border-b border-r border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5 text-left font-semibold md:sticky md:left-[120px] md:z-30"
              >
                Опис
              </th>
              <th
                scope="col"
                className="border-b border-r border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5 text-center font-semibold md:sticky md:left-[380px] md:z-30"
              >
                Разом
              </th>
              {consignmentHolders.map((holder) => (
                <th
                  key={holder.id}
                  scope="col"
                  className="border-b border-r border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-2.5 text-center align-bottom text-[10px] font-semibold leading-tight last:border-r-0"
                >
                  {holder.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.partNumber} className="group">
                <th
                  scope="row"
                  className="border-b border-r border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left font-mono font-semibold group-hover:bg-[var(--surface-subtle)] md:sticky md:left-0 md:z-20"
                >
                  {position.partNumber}
                </th>
                <td className="border-b border-r border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-medium group-hover:bg-[var(--surface-subtle)] md:sticky md:left-[120px] md:z-20">
                  {position.description}
                </td>
                <td className="border-b border-r border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-center font-bold group-hover:bg-[var(--surface-subtle)] md:sticky md:left-[380px] md:z-20">
                  {position.total}
                </td>
                {consignmentHolders.map((holder) => {
                  const quantity = holderQuantity(position, holder.id);
                  return (
                    <td
                      key={holder.id}
                      className="border-b border-r border-[var(--border)] px-2 py-2.5 text-center tabular-nums last:border-r-0 group-hover:bg-[var(--surface-subtle)]"
                    >
                      {quantity > 0 ? <strong>{quantity}</strong> : <span className="text-[var(--faint)]">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function NetworkTable({ positions }: { positions: readonly ConsignmentStockPosition[] }) {
  return (
    <Panel className="overflow-hidden shadow-none">
      <div className="max-w-full overflow-x-auto" role="region" aria-label="Залишки мережі" tabIndex={0}>
        <table className="data-table min-w-[900px]">
          <caption className="sr-only">Мережеві залишки та їхні держателі</caption>
          <thead>
            <tr>
              <th scope="col">Артикул</th>
              <th scope="col">Опис</th>
              <th scope="col" className="text-center">Разом</th>
              <th scope="col">Тримачі</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.partNumber}>
                <th scope="row" className="font-mono text-[11px]">{position.partNumber}</th>
                <td className="font-medium">{position.description}</td>
                <td className="text-center font-bold tabular-nums">{position.total}</td>
                <td>
                  <div className="flex max-w-[650px] flex-wrap gap-1.5">
                    {positionHolderEntries(position).map(({ holder, quantity }) => (
                      <span
                        key={holder.id}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-[10px]"
                      >
                        <span>{holder.name}</span>
                        <strong className="tabular-nums">{quantity}</strong>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RequestsView({
  status,
  onStatusChange,
  query,
}: {
  status: ConsignmentRequestFilter;
  onStatusChange: (status: ConsignmentRequestFilter) => void;
  query: string;
}) {
  const statusRequests = status === "all"
    ? consignmentRequests
    : consignmentRequests.filter((request) => request.status === status);
  const normalizedQuery = normalize(query);
  const requests = normalizedQuery
    ? statusRequests.filter((request) => normalize(`${request.id} ${request.dealer} ${request.partNumber} ${request.oneCReference ?? ""}`).includes(normalizedQuery))
    : statusRequests;

  return (
    <Panel className="overflow-hidden shadow-none">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <AdminSegmentedControl
          items={consignmentRequestFilters}
          value={status}
          onValueChange={onStatusChange}
          label="Статус заявки"
        />
        <button
          type="button"
          className="button button-outline shrink-0"
          disabled
          title="Оновлення вимкнено у read-only демонстрації"
        >
          <LockKeyhole size={13} />
          <RefreshCw size={14} />
          Оновити
        </button>
      </div>
      <div className="grid min-h-52 place-items-center px-6 py-12 text-center" aria-live="polite">
        {requests.length === 0 ? (
          <p className="m-0 text-sm text-[var(--muted-foreground)]">
            {normalizedQuery ? "Заявок за пошуком не знайдено." : "Немає заявок з цим статусом."}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdminConsignmentPage() {
  const [activeView, setActiveView] = useState<ConsignmentView>("warehouse");
  const [query, setQuery] = useState("");
  const [requestStatus, setRequestStatus] = useState<ConsignmentRequestFilter>("waiting");

  const filteredPositions = useMemo(
    () => consignmentStockPositions.filter((position) => matchesPosition(position, query)),
    [query],
  );
  const hasQuery = normalize(query).length > 0;
  const filteredUnits = filteredPositions.reduce((sum, position) => sum + position.total, 0);
  const warehouseCount = hasQuery ? filteredPositions.length : CONSIGNMENT_SOURCE_TOTALS.parts;
  const networkCount = hasQuery ? filteredPositions.length : CONSIGNMENT_SOURCE_TOTALS.networkPositions;
  const networkUnits = hasQuery ? filteredUnits : CONSIGNMENT_SOURCE_TOTALS.networkUnits;
  const searchPlaceholder = activeView === "requests"
    ? "Пошук за заявками, дилером, посиланням 1С…"
    : "Фільтр за артикулом або описом…";

  return (
    <AdminPage>
      <AdminPageHeader
        title="Консигнація"
        description="Складські залишки по мережі, заявки дилерів, переміщення 1С"
      />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label={searchPlaceholder}
            placeholder={searchPlaceholder}
          />
        )}
        filters={(
          <AdminTabs
            items={views.map((view) => ({
              ...view,
              panelId: `consignment-${view.id}-panel`,
            }))}
            value={activeView}
            onValueChange={setActiveView}
            label="Розділи консигнації"
            size="compact"
          />
        )}
      />

      {activeView === "warehouse" ? (
        <section
          id="consignment-warehouse-panel"
          role="tabpanel"
          aria-labelledby="consignment-warehouse-panel-tab"
          className="grid gap-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              <strong className="text-sm">{warehouseCount} запчастин · {CONSIGNMENT_SOURCE_TOTALS.dealers} дилерів</strong>
              <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">
                Репрезентативна вибірка: {filteredPositions.length} з {hasQuery ? "результатів локальної вибірки" : CONSIGNMENT_SOURCE_TOTALS.parts}.
              </p>
            </div>
            <button
              type="button"
              className="button button-outline shrink-0 self-start"
              disabled
              title="Експорт вимкнено у read-only демонстрації"
            >
              <LockKeyhole size={13} />
              <Download size={14} />
              Експорт CSV
            </button>
          </div>
          <WarehouseMatrix positions={filteredPositions} />
        </section>
      ) : null}

      {activeView === "network" ? (
        <section
          id="consignment-network-panel"
          role="tabpanel"
          aria-labelledby="consignment-network-panel-tab"
          className="grid gap-3"
        >
          <div aria-live="polite">
            <strong className="text-sm">{networkCount} позицій · {networkUnits} од.</strong>
            <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">
              Показано {networkCount} з {CONSIGNMENT_SOURCE_TOTALS.parts}. Репрезентативна локальна вибірка: {filteredPositions.length} рядків.
            </p>
          </div>
          <NetworkTable positions={filteredPositions} />
        </section>
      ) : null}

      {activeView === "requests" ? (
        <section
          id="consignment-requests-panel"
          role="tabpanel"
          aria-labelledby="consignment-requests-panel-tab"
        >
          <RequestsView status={requestStatus} onStatusChange={setRequestStatus} query={query} />
        </section>
      ) : null}
    </AdminPage>
  );
}
