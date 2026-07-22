"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  LockKeyhole,
  RefreshCw,
  SearchX,
  Truck,
  X,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import { Panel, StatusBadge } from "@/components/shared/ui";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {
  REMAINING_UNIT_SHIPMENTS,
  SHIPPED_UNIT_SHIPMENTS,
  UNIT_SHIPPING_CATEGORIES,
  bossWebOrderNumber,
  type BossWebShipment,
  type UnitShippingCategory,
  type UnitShippingTab,
} from "@/lib/admin-unit-shipping-data";
import styles from "./admin.module.css";

export const DEFAULT_SYNC_FROM = "2025-10-18";
export const DEFAULT_SYNC_TO = "2026-07-18";
const DEFAULT_PAGE_SIZE = 50;

export type UnitShippingModelOption = BossWebShipment["model"];

export type AdminUnitShippingModel = {
  activeTab: UnitShippingTab;
  selectTab(tab: UnitShippingTab): void;
  query: string;
  setQuery(value: string): void;
  category: UnitShippingCategory;
  selectCategory(value: UnitShippingCategory): void;
  period: string;
  setPeriod(value: string): void;
  modelNumber: string;
  setModelNumber(value: string): void;
  shippedFrom: string;
  setShippedFrom(value: string): void;
  shippedTo: string;
  setShippedTo(value: string): void;
  syncFrom: string;
  setSyncFrom(value: string): void;
  syncTo: string;
  setSyncTo(value: string): void;
  pageSize: number;
  setPageSize(value: number): void;
  currentPage: number;
  totalPages: number;
  setPage(value: number): void;
  expandedOrderId: string | null;
  toggleOrder(id: string): void;
  remainingFiltered: BossWebShipment[];
  shippedFiltered: BossWebShipment[];
  activeRecords: readonly BossWebShipment[];
  filteredRecords: BossWebShipment[];
  pageRecords: BossWebShipment[];
  periods: string[];
  models: UnitShippingModelOption[];
  activePanelId: string;
  activeFilterCount: number;
  resetFilters(): void;
};

const loadAstryxAdminUnitShippingView = () => import("./astryx-admin-unit-shipping-view")
  .then((module) => ({default: module.AstryxAdminUnitShippingView}));

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

export function filterShipments(
  records: readonly BossWebShipment[],
  query: string,
  category: UnitShippingCategory,
  period: string,
  modelNumber: string,
  shippedFrom: string,
  shippedTo: string,
) {
  const normalizedQuery = normalize(query);

  return records.filter((record) => {
    if (category !== "Всі" && record.model.category !== category) return false;
    if (period && record.order.deliveryPeriod !== period) return false;
    if (modelNumber && record.model.number !== modelNumber) return false;
    if (shippedFrom && record.shippedAt && record.shippedAt < shippedFrom) return false;
    if (shippedTo && record.shippedAt && record.shippedAt > shippedTo) return false;

    if (!normalizedQuery) return true;
    const searchable = [
      bossWebOrderNumber(record),
      record.order.number,
      record.order.segment,
      record.model.number,
      record.model.description,
      record.model.color,
      record.order.deliveryPeriod,
      record.order.salesProgram,
      record.order.destination,
    ].join(" ");
    return normalize(searchable).includes(normalizedQuery);
  });
}

function uniqueValues(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "uk-UA"));
}

function useAdminUnitShippingController(): AdminUnitShippingModel {
  const [activeTab, setActiveTab] = useState<UnitShippingTab>("remaining");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<UnitShippingCategory>("Всі");
  const [period, setPeriod] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [shippedFrom, setShippedFrom] = useState("");
  const [shippedTo, setShippedTo] = useState("");
  const [syncFrom, setSyncFrom] = useState(DEFAULT_SYNC_FROM);
  const [syncTo, setSyncTo] = useState(DEFAULT_SYNC_TO);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const remainingFiltered = useMemo(() => filterShipments(
    REMAINING_UNIT_SHIPMENTS,
    query,
    category,
    period,
    modelNumber,
    "",
    "",
  ), [category, modelNumber, period, query]);

  const shippedFiltered = useMemo(() => filterShipments(
    SHIPPED_UNIT_SHIPMENTS,
    query,
    category,
    period,
    modelNumber,
    shippedFrom,
    shippedTo,
  ), [category, modelNumber, period, query, shippedFrom, shippedTo]);

  const activeRecords = activeTab === "remaining" ? REMAINING_UNIT_SHIPMENTS : SHIPPED_UNIT_SHIPMENTS;
  const filteredRecords = activeTab === "remaining" ? remainingFiltered : shippedFiltered;
  const periods = useMemo(
    () => uniqueValues(activeRecords.map((record) => record.order.deliveryPeriod)),
    [activeRecords],
  );
  const models = useMemo(() => {
    const byNumber = new Map(activeRecords.map((record) => [record.model.number, record.model]));
    return [...byNumber.values()].sort((left, right) => left.number.localeCompare(right.number));
  }, [activeRecords]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activePanelId = `unit-shipping-${activeTab}-panel`;
  const activeFilterCount = [
    category !== "Всі",
    Boolean(period),
    Boolean(modelNumber),
    activeTab === "shipped" && Boolean(shippedFrom),
    activeTab === "shipped" && Boolean(shippedTo),
  ]
    .filter(Boolean)
    .length;

  const resetFilters = () => {
    setQuery("");
    setCategory("Всі");
    setPeriod("");
    setModelNumber("");
    setShippedFrom("");
    setShippedTo("");
    setPage(1);
    setExpandedOrderId(null);
  };

  const selectCategory = (nextCategory: UnitShippingCategory) => {
    setCategory(nextCategory);
    setPage(1);
    setExpandedOrderId(null);
  };

  const selectTab = (nextTab: UnitShippingTab) => {
    setActiveTab(nextTab);
    setPage(1);
    setExpandedOrderId(null);
  };

  return {
    activeTab,
    selectTab,
    query,
    setQuery: (value) => {
      setQuery(value);
      setPage(1);
      setExpandedOrderId(null);
    },
    category,
    selectCategory,
    period,
    setPeriod: (value) => {
      setPeriod(value);
      setPage(1);
      setExpandedOrderId(null);
    },
    modelNumber,
    setModelNumber: (value) => {
      setModelNumber(value);
      setPage(1);
      setExpandedOrderId(null);
    },
    shippedFrom,
    setShippedFrom: (value) => {
      setShippedFrom(value);
      setPage(1);
      setExpandedOrderId(null);
    },
    shippedTo,
    setShippedTo: (value) => {
      setShippedTo(value);
      setPage(1);
      setExpandedOrderId(null);
    },
    syncFrom,
    setSyncFrom,
    syncTo,
    setSyncTo,
    pageSize,
    setPageSize: (value) => {
      setPageSize(value);
      setPage(1);
      setExpandedOrderId(null);
    },
    currentPage,
    totalPages,
    setPage: (value) => {
      setPage(Math.max(1, Math.min(totalPages, value)));
      setExpandedOrderId(null);
    },
    expandedOrderId,
    toggleOrder: (id) => setExpandedOrderId((current) => current === id ? null : id),
    remainingFiltered,
    shippedFiltered,
    activeRecords,
    filteredRecords,
    pageRecords,
    periods,
    models,
    activePanelId,
    activeFilterCount,
    resetFilters,
  };
}

function CurrentAdminUnitShippingView({model}: {model: AdminUnitShippingModel}) {
  const {
    activeTab,
    selectTab,
    query,
    setQuery,
    category,
    selectCategory,
    period,
    setPeriod,
    modelNumber,
    setModelNumber,
    shippedFrom,
    setShippedFrom,
    shippedTo,
    setShippedTo,
    syncFrom,
    setSyncFrom,
    syncTo,
    setSyncTo,
    pageSize,
    setPageSize,
    currentPage,
    totalPages,
    setPage,
    expandedOrderId,
    toggleOrder,
    remainingFiltered,
    shippedFiltered,
    activeRecords,
    filteredRecords,
    pageRecords,
    periods,
    models,
    activePanelId,
    activeFilterCount,
    resetFilters,
  } = model;

  return (
    <div className="contents" data-admin-unit-shipping-renderer="current" data-brp-admin-fulfillment-renderer="shadcn">
    <AdminPage>
      <AdminPageHeader
        icon={<Truck size={20} />}
        title="Відвантаження техніки"
        description="Інформація про відвантаження з BossWeb"
        meta={(
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Остання синхр.: 28 May 2026, 15:36</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 font-semibold text-[var(--foreground)]">
              До відвантаження: 34 / Відвантажено: 84
            </span>
          </div>
        )}
        actions={(
          <div className="grid w-full gap-2">
            <div className="grid grid-cols-2 gap-2 md:flex md:items-end">
              <label className="field min-w-0 md:w-[145px]">
                <span>Shipped: з</span>
                <input type="date" value={syncFrom} onChange={(event) => setSyncFrom(event.target.value)} />
              </label>
              <span className="hidden pb-2.5 text-[var(--muted-foreground)] md:inline">–</span>
              <label className="field min-w-0 md:w-[145px]">
                <span>Shipped: по</span>
                <input type="date" value={syncTo} onChange={(event) => setSyncTo(event.target.value)} />
              </label>
              <button
                type="button"
                className="button button-primary col-span-2 h-11 w-full whitespace-nowrap md:col-auto md:h-9 md:w-auto"
                disabled
                aria-describedby="bossweb-sync-safety"
                title="Зовнішня синхронізація недоступна: доступ лише для читання."
              >
                <RefreshCw size={14} /> Синхр. з BossWeb
              </button>
            </div>
            <p id="bossweb-sync-safety" className="m-0 inline-flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
              <LockKeyhole size={12} /> Дати змінюються лише локально; зовнішня синхронізація заблокована.
            </p>
          </div>
        )}
      />

      <AdminTabs<UnitShippingTab>
        items={[
          { id: "remaining", label: "Залишок до відвантаження", count: remainingFiltered.length, panelId: "unit-shipping-remaining-panel" },
          { id: "shipped", label: "Відвантажені замовлення", count: shippedFiltered.length, panelId: "unit-shipping-shipped-panel" },
        ]}
        value={activeTab}
        onValueChange={selectTab}
        label="Стан відвантаження"
        mobileSelectLabel="Стан відвантаження"
      />

      <section
        id={activePanelId}
        role="tabpanel"
        aria-labelledby={`${activePanelId}-tab`}
        className="grid gap-4"
      >
        <AdminToolbar
          search={(
            <AdminSearchField
              value={query}
              onValueChange={setQuery}
              label="Пошук замовлення або моделі"
              placeholder="Пошук замовлення, моделі..."
            />
          )}
          filters={(
            <div className={`flex min-w-0 flex-wrap items-center gap-2 ${styles.unitShippingFilters}`}>
              <select
                className="select !w-auto min-w-[150px] max-w-full"
                aria-label="Тип техніки"
                value={category}
                onChange={(event) => selectCategory(event.target.value as UnitShippingCategory)}
              >
                {UNIT_SHIPPING_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item === "Всі" ? "Усі типи" : item}
                  </option>
                ))}
              </select>
              <select
                className="select !w-auto min-w-[140px]"
                aria-label="Період доставки"
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value);
                }}
              >
                <option value="">Всі періоди</option>
                {periods.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select
                className="select !w-auto min-w-[180px] max-w-[260px]"
                aria-label="Модель"
                value={modelNumber}
                onChange={(event) => {
                  setModelNumber(event.target.value);
                }}
              >
                <option value="">Всі моделі</option>
                {models.map((model) => <option key={model.number} value={model.number}>{model.number} · {model.description}</option>)}
              </select>
              {activeTab === "shipped" ? (
                <>
                  <label>
                    <span className="sr-only">Дата відвантаження з</span>
                    <input
                      className="input w-[150px]"
                      aria-label="Дата відвантаження з"
                      type="date"
                      value={shippedFrom}
                      onChange={(event) => {
                        setShippedFrom(event.target.value);
                      }}
                    />
                  </label>
                  <label>
                    <span className="sr-only">Дата відвантаження по</span>
                    <input
                      className="input w-[150px]"
                      aria-label="Дата відвантаження по"
                      type="date"
                      value={shippedTo}
                      onChange={(event) => {
                        setShippedTo(event.target.value);
                      }}
                    />
                  </label>
                </>
              ) : null}
            </div>
          )}
          actions={(
            <button type="button" className="button button-ghost whitespace-nowrap" onClick={resetFilters}>
              <X size={14} /> Скинути
            </button>
          )}
          meta={<span aria-live="polite">Показано {filteredRecords.length} з {activeRecords.length}</span>}
          mobileDisclosure={{ sections: ["filters", "actions"], activeCount: activeFilterCount }}
        />

        <Panel className="overflow-hidden">
          <div className="data-table-wrap" role="region" aria-label="Таблиця відвантажень" tabIndex={0}>
            <table className="data-table min-w-[1120px] table-fixed text-[13px]">
              <colgroup>
                <col className="w-[86px]" />
                <col className="w-[92px]" />
                <col className="w-[150px]" />
                <col className="w-[92px]" />
                <col className="w-[196px]" />
                <col className="w-[148px]" />
                <col className="w-[58px]" />
                <col className="w-[94px]" />
                <col className="w-[142px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="normal-case">Статус</th>
                  <th className="normal-case">{activeTab === "shipped" ? "Дата відвантаження" : "Дата/тиждень"}</th>
                  <th className="normal-case">BRP Замовлення №</th>
                  <th className="normal-case">Модель №</th>
                  <th className="normal-case">Опис моделі</th>
                  <th className="normal-case">Колір</th>
                  <th className="normal-case text-right">К-сть</th>
                  <th className="normal-case">Період доставки</th>
                  <th className="normal-case">Програма продажу</th>
                  <th className="normal-case">Куди</th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="!p-0">
                      <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                        <SearchX size={26} className="text-[var(--muted-foreground)]" />
                        <strong className="text-sm">Записи відвантаження не знайдено</strong>
                        <span className="text-xs text-[var(--muted-foreground)]">Змініть пошуковий запит або скиньте фільтри.</span>
                      </div>
                    </td>
                  </tr>
                ) : pageRecords.map((record) => {
                  const orderNumber = bossWebOrderNumber(record);
                  const expanded = expandedOrderId === record.id;
                  const canExpand = activeTab === "shipped" && record.vins.length > 0;
                  return (
                    <Fragment key={record.id}>
                      <tr>
                        <td>
                          {activeTab === "shipped" ? <StatusBadge tone="green">Load shipped</StatusBadge> : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted-foreground)]">–</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">{activeTab === "shipped" ? record.shippedAt : record.dateOrWeek}</td>
                        <td>
                          {canExpand ? (
                            <button
                              type="button"
                              className="inline-flex max-w-full items-center gap-1 font-mono text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                              aria-expanded={expanded}
                              aria-label={`Показати або приховати VIN за замовленням ${orderNumber}`}
                              onClick={() => toggleOrder(record.id)}
                            >
                              <span>{orderNumber}</span>{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          ) : <span className="font-mono text-[11px]">{orderNumber}</span>}
                        </td>
                        <td className="font-mono text-[11px]">{record.model.number}</td>
                        <td title={record.model.description}><div className="truncate font-medium">{record.model.description}</div></td>
                        <td title={record.model.color}><div className="truncate">{record.model.color}</div></td>
                        <td className="text-right font-semibold">{record.order.quantity}</td>
                        <td>{record.order.deliveryPeriod}</td>
                        <td title={record.order.salesProgram}><div className="truncate">{record.order.salesProgram}</div></td>
                        <td title={record.order.destination}><div className="truncate">{record.order.destination}</div></td>
                      </tr>
                      {expanded ? (
                        <tr>
                          <td colSpan={10} className="!p-0">
                            <div className="border-y border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                              <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
                                <span><strong className="text-[var(--foreground)]">Замовлення:</strong> {orderNumber}</span>
                                <span><strong className="text-[var(--foreground)]">Сегмент:</strong> {record.order.number} - {record.order.segment}</span>
                                <span><strong className="text-[var(--foreground)]">Модель №:</strong> {record.model.number}</span>
                                <span><strong className="text-[var(--foreground)]">Опис:</strong> {record.model.description}</span>
                              </div>
                              <div className={`overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)] ${styles.unitSerialScroller}`} role="region" aria-label={`Серійні номери замовлення ${orderNumber}`} tabIndex={0}>
                                <table className="w-full min-w-[620px] border-collapse text-[11px]">
                                  <thead className="bg-[var(--surface-subtle)] text-left text-[var(--muted-foreground)]">
                                    <tr><th className="px-3 py-2 font-medium">Серійний номер (VIN)</th><th className="px-3 py-2 font-medium">Дата відвантаження</th><th className="px-3 py-2 font-medium">#</th></tr>
                                  </thead>
                                  <tbody>
                                    {record.vins.map((vin) => (
                                      <tr key={vin.serialNumber} className="border-t border-[var(--border)]">
                                        <td className="px-3 py-2 font-mono">{vin.serialNumber}</td>
                                        <td className="px-3 py-2 font-mono">{vin.shippedAt}</td>
                                        <td className="px-3 py-2">{vin.index}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <p className="mb-0 mt-2 text-[11px] text-[var(--muted-foreground)]">{record.vins.length} серійних номерів</p>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
            <span>{filteredRecords.length} записів загалом</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2">
                <span>На сторінці</span>
                <select
                  className="select !min-h-11 !w-[76px] !py-1 md:!min-h-8"
                  aria-label="Записів на сторінці"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                  }}
                >
                  {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <button
                type="button"
                className="button button-outline !min-h-11 !min-w-11 !px-2 md:!min-h-8 md:!min-w-0"
                aria-label="Попередня сторінка"
                disabled={currentPage === 1}
                onClick={() => {
                  setPage(currentPage - 1);
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-14 text-center font-medium text-[var(--foreground)]">{currentPage} / {totalPages}</span>
              <button
                type="button"
                className="button button-outline !min-h-11 !min-w-11 !px-2 md:!min-h-8 md:!min-w-0"
                aria-label="Наступна сторінка"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setPage(currentPage + 1);
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        </Panel>
      </section>
    </AdminPage>
    </div>
  );
}

export function AdminUnitShippingPage() {
  const model = useAdminUnitShippingController();
  return (
    <RendererViewSwitch
      slotId="admin-unit-shipping"
      currentView={<CurrentAdminUnitShippingView model={model} />}
      loadAstryxView={loadAstryxAdminUnitShippingView}
      astryxViewProps={{model}}
    />
  );
}
