"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Bug,
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Database,
  EllipsisVertical,
  History,
  Link2,
  ListFilter,
  LockKeyhole,
  Monitor,
  Package,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  AdminKpiCard,
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminSegmentedControl,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import { EmptyState, Panel, StatusBadge } from "@/components/shared/ui";
import {
  catalogGlobalMetrics,
  catalogHealthMetrics,
  catalogImportHistory,
  catalogParts,
  catalogPartsSourcePages,
  catalogPartsSourceTotal,
  catalogPricingDebugResult,
  catalogSourceComposition,
  catalogVehicleProducts,
  catalogVehicleSourceCounts,
  distributorPriceRows,
  distributorSourceCounts,
  type CatalogPartStatus,
  type CatalogPrimaryTab,
  type CatalogVehicleCategory,
  type DistributorPriceCategory,
} from "@/lib/admin-catalog-data";

type VehicleCategoryFilter = CatalogVehicleCategory | "all";
type PartStatusFilter = CatalogPartStatus | "all";
type PartLineFilter = "all" | "SKI" | "Sea-Doo" | "SSV" | "Spyder";
type PartTypeFilter = "all" | "SKI Parts" | "Sea-Doo Parts" | "SSV Parts" | "Spyder Parts";

const primaryTabs: ReadonlyArray<{ id: CatalogPrimaryTab; label: string; icon: typeof Box }> = [
  { id: "vehicles", label: "Каталог", icon: Monitor },
  { id: "distributor", label: "Ціни дистриб'ютора", icon: CircleDollarSign },
  { id: "parts", label: "Каталог запчастин", icon: Package },
];

const vehicleCategoryTabs = ["all", "ATV", "SSV", "PWC"] as const;
const distributorCategoryTabs = ["ATV", "SSV", "3WV", "PWC"] as const;

const loadAstryxAdminCatalogView = () => import("./astryx-admin-catalog-view");

function useCatalogPageViewState() {
  const [activeTab, setActiveTab] = useState<CatalogPrimaryTab>("vehicles");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategoryFilter>("all");
  const [columnCategory, setColumnCategory] = useState<VehicleCategoryFilter>("all");
  const [skuFilter, setSkuFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [engineFilter, setEngineFilter] = useState("");
  const [modelYearFilter, setModelYearFilter] = useState("");
  const [productionYearFilter, setProductionYearFilter] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [distributorCategory, setDistributorCategory] = useState<DistributorPriceCategory>("ATV");
  const [distributorQuery, setDistributorQuery] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [submittedDebugQuery, setSubmittedDebugQuery] = useState<string | null>(null);
  const [healthOpen, setHealthOpen] = useState(true);
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  const [partsQuery, setPartsQuery] = useState("");
  const [partStatus, setPartStatus] = useState<PartStatusFilter>("all");
  const [partLine, setPartLine] = useState<PartLineFilter>("all");
  const [partType, setPartType] = useState<PartTypeFilter>("all");
  const [partsPage, setPartsPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({sku: 132, name: 320, color: 180, prices: 132});
  return {activeTab, setActiveTab, vehicleQuery, setVehicleQuery, vehicleCategory, setVehicleCategory, columnCategory, setColumnCategory, skuFilter, setSkuFilter, nameFilter, setNameFilter, colorFilter, setColorFilter, engineFilter, setEngineFilter, modelYearFilter, setModelYearFilter, productionYearFilter, setProductionYearFilter, advancedFiltersOpen, setAdvancedFiltersOpen, activeMenu, setActiveMenu, distributorCategory, setDistributorCategory, distributorQuery, setDistributorQuery, debugOpen, setDebugOpen, debugQuery, setDebugQuery, submittedDebugQuery, setSubmittedDebugQuery, healthOpen, setHealthOpen, importHistoryOpen, setImportHistoryOpen, partsQuery, setPartsQuery, partStatus, setPartStatus, partLine, setPartLine, partType, setPartType, partsPage, setPartsPage, columnWidths, setColumnWidths};
}

export type CatalogPageViewProps = ReturnType<typeof useCatalogPageViewState>;
const CatalogViewStateContext = createContext<CatalogPageViewProps | null>(null);
function useCatalogViewState() {
  const value = useContext(CatalogViewStateContext);
  if (!value) throw new Error("Catalog view state must be provided by AdminCatalogPage.");
  return value;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function formatDecimal(value: number | null, currency: "EUR" | "USD") {
  if (value === null) return "—";
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${value.toFixed(2)}`;
}

function formatVehiclePrice(value: number, currency: "EUR" | "USD") {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${formatInteger(value)}`;
}

function LockedButton({ children, title, className = "" }: {
  children: ReactNode;
  title: string;
  className?: string;
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

function SearchField({ value, onChange, placeholder, label }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <AdminSearchField
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      label={label}
    />
  );
}

function RepresentativeNotice({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <p className="m-0 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
      {formatInteger(total)} {noun} · у поточному перегляді {shown}
    </p>
  );
}

function GlobalKpis() {
  return (
    <div className="hidden md:block">
      <AdminKpiGrid
        label="Загальні показники каталогу"
        items={catalogGlobalMetrics.map((metric) => ({
          id: metric.id,
          label: metric.label,
          value: formatInteger(metric.value),
          icon: <Box size={17} />,
          tone: metric.tone,
        }))}
      />
    </div>
  );
}

function PrimaryTabs({ active, onChange }: { active: CatalogPrimaryTab; onChange: (tab: CatalogPrimaryTab) => void }) {
  return (
    <AdminTabs
      items={primaryTabs.map((tab) => {
        const Icon = tab.icon;
        return {
          id: tab.id,
          label: tab.label,
          icon: <Icon size={14} />,
          panelId: `catalog-${tab.id}-panel`,
        };
      })}
      value={active}
      onValueChange={onChange}
      label="Розділи каталогу"
      mobileSelectLabel="Розділ каталогу"
    />
  );
}

function VehicleKpis({ counts }: { counts: { total: number; ATV: number; SSV: number; PWC: number } }) {
  const items = [
    { id: "total", label: "Усього продуктів", value: counts.total, tone: "blue" },
    { id: "atv", label: "ATV", value: counts.ATV, tone: "amber" },
    { id: "ssv", label: "SSV", value: counts.SSV, tone: "green" },
    { id: "pwc", label: "PWC", value: counts.PWC, tone: "blue" },
  ] as const;

  return (
    <div className="hidden md:block">
      <AdminKpiGrid label="Показники транспортних засобів" items={items} />
    </div>
  );
}

function VehicleActions({
  productId,
  sku,
  surface,
}: {
  productId: string;
  sku: string;
  surface: "desktop" | "mobile";
}) {
  const { activeMenu, setActiveMenu } = useCatalogViewState();
  const menuKey = `${surface}-${productId}`;
  const open = activeMenu === menuKey;
  const setOpen = useCallback((next: boolean) => setActiveMenu(next ? menuKey : null), [menuKey, setActiveMenu]);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = `${surface}-${productId}`;
  const actionsId = `catalog-product-actions-${menuId}`;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, setOpen]);

  const triggerClassName = surface === "desktop"
    ? "icon-button icon-button-small"
    : "inline-flex size-11 min-h-11 min-w-11 items-center justify-center rounded-md border border-transparent text-[var(--muted-foreground)] transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]";
  const menuClassName = surface === "desktop"
    ? "absolute right-2 top-10 z-20 grid min-w-36 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 text-left shadow-[var(--shadow-menu)]"
    : "absolute right-0 top-full z-20 mt-1 grid min-w-36 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 text-left shadow-[var(--shadow-menu)]";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label={`Меню продукту ${sku}`}
        aria-expanded={open}
        aria-controls={actionsId}
        onClick={() => setOpen(!open)}
      >
        <EllipsisVertical size={16} />
      </button>
      {open ? (
        <div id={actionsId} role="group" aria-label={`Дії продукту ${sku}`} className={menuClassName}>
          <button type="button" disabled className="button button-ghost justify-start text-[12px]" title="Редагування потребує підключення сервісу каталогу"><LockKeyhole size={13} /> Редагувати</button>
          <button type="button" disabled className="button button-ghost justify-start text-[12px] text-[var(--red)]" title="Видалення потребує підключення сервісу каталогу"><Trash2 size={13} /> Видалити</button>
        </div>
      ) : null}
    </div>
  );
}

function VehicleCatalog() {
  const { vehicleQuery: query, setVehicleQuery: setQuery, vehicleCategory: category, setVehicleCategory: setCategory, columnCategory, setColumnCategory, skuFilter, setSkuFilter, nameFilter, setNameFilter, colorFilter, setColorFilter, engineFilter, setEngineFilter, modelYearFilter, setModelYearFilter, productionYearFilter, setProductionYearFilter, advancedFiltersOpen, setAdvancedFiltersOpen } = useCatalogViewState();
  const advancedFiltersPanelRef = useRef<HTMLDivElement>(null);
  const advancedFiltersTriggerRef = useRef<HTMLButtonElement>(null);

  const visibleProducts = useMemo(() => catalogVehicleProducts.filter((product) => {
    if (category !== "all" && product.category !== category) return false;
    if (columnCategory !== "all" && product.category !== columnCategory) return false;
    if (normalize(query) && !normalize(`${product.sku} ${product.name} ${product.nameUa}`).includes(normalize(query))) return false;
    if (normalize(skuFilter) && !normalize(product.sku).includes(normalize(skuFilter))) return false;
    if (normalize(nameFilter) && !normalize(`${product.name} ${product.nameUa}`).includes(normalize(nameFilter))) return false;
    if (normalize(colorFilter) && !normalize(`${product.color} ${product.colorUa}`).includes(normalize(colorFilter))) return false;
    if (normalize(engineFilter) && !normalize(product.engine).includes(normalize(engineFilter))) return false;
    if (modelYearFilter && String(product.modelYear) !== modelYearFilter) return false;
    if (productionYearFilter && String(product.productionYear) !== productionYearFilter) return false;
    return true;
  }), [category, colorFilter, columnCategory, engineFilter, modelYearFilter, nameFilter, productionYearFilter, query, skuFilter]);

  const hasFineFilter = Boolean(
    normalize(query) || normalize(skuFilter) || normalize(nameFilter) || normalize(colorFilter) ||
    normalize(engineFilter) || modelYearFilter || productionYearFilter,
  );
  const effectiveCategory = category !== "all" ? category : columnCategory;
  const exactCategoryOnly = !hasFineFilter && (category === "all" || columnCategory === "all");

  const counts = useMemo(() => {
    if (exactCategoryOnly && effectiveCategory === "all") {
      return {
        total: catalogVehicleSourceCounts.total,
        ATV: catalogVehicleSourceCounts.ATV,
        SSV: catalogVehicleSourceCounts.SSV,
        PWC: catalogVehicleSourceCounts.PWC,
      };
    }
    if (exactCategoryOnly && effectiveCategory !== "all") {
      return {
        total: catalogVehicleSourceCounts[effectiveCategory],
        ATV: effectiveCategory === "ATV" ? catalogVehicleSourceCounts.ATV : 0,
        SSV: effectiveCategory === "SSV" ? catalogVehicleSourceCounts.SSV : 0,
        PWC: effectiveCategory === "PWC" ? catalogVehicleSourceCounts.PWC : 0,
      };
    }
    return {
      total: visibleProducts.length,
      ATV: visibleProducts.filter((product) => product.category === "ATV").length,
      SSV: visibleProducts.filter((product) => product.category === "SSV").length,
      PWC: visibleProducts.filter((product) => product.category === "PWC").length,
    };
  }, [effectiveCategory, exactCategoryOnly, visibleProducts]);

  const sourceTotalForCurrentCategory = effectiveCategory === "all"
    ? catalogVehicleSourceCounts.total
    : catalogVehicleSourceCounts[effectiveCategory];
  const isTrueNoResult = hasFineFilter && visibleProducts.length === 0;
  const advancedFilterCount = [
    columnCategory !== "all",
    Boolean(normalize(skuFilter)),
    Boolean(normalize(nameFilter)),
    Boolean(normalize(colorFilter)),
    Boolean(normalize(engineFilter)),
    Boolean(modelYearFilter),
    Boolean(productionYearFilter),
  ].filter(Boolean).length;

  const updateCategory = (next: VehicleCategoryFilter) => {
    setCategory(next);
  };

  const clearAdvancedFilters = () => {
    setColumnCategory("all");
    setSkuFilter("");
    setNameFilter("");
    setColorFilter("");
    setEngineFilter("");
    setModelYearFilter("");
    setProductionYearFilter("");
  };

  return (
    <section
      id="catalog-vehicles-panel"
      role="tabpanel"
      aria-labelledby="catalog-vehicles-panel-tab"
      className="grid min-w-0 gap-5"
    >
      <p className="m-0 text-[15px] text-[var(--muted-foreground)]">
        Управління каталогом транспортних засобів для інвойсів та ціноутворення
      </p>
      <VehicleKpis counts={counts} />

      <AdminToolbar
        search={<SearchField value={query} onChange={setQuery} placeholder="Пошук за SKU або назвою..." label="Пошук транспортних засобів" />}
        filters={(
          <AdminSegmentedControl
            items={vehicleCategoryTabs.map((item) => ({ id: item, label: item === "all" ? "All" : item }))}
            value={category}
            onValueChange={updateCategory}
            label="Категорії транспортних засобів"
            mobileFullWidth
          />
        )}
        actions={(
          <button
            ref={advancedFiltersTriggerRef}
            type="button"
            className="button button-outline"
            aria-expanded={advancedFiltersOpen}
            aria-controls="catalog-vehicle-advanced-filters"
            onClick={() => setAdvancedFiltersOpen((current) => !current)}
          >
            <ListFilter size={14} />
            Детальні фільтри
            {advancedFilterCount ? <StatusBadge tone="orange">{advancedFilterCount}</StatusBadge> : null}
            {advancedFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        mobileDisclosure={{
          sections: ["actions"],
          label: "Детальні фільтри",
          activeCount: advancedFilterCount,
          iconOnly: true,
          expanded: advancedFiltersOpen,
          controlsId: "catalog-vehicle-advanced-filters",
          onExpandedChange: setAdvancedFiltersOpen,
          panelRef: advancedFiltersPanelRef,
          triggerRef: advancedFiltersTriggerRef,
        }}
      />

      {advancedFiltersOpen ? (
        <div ref={advancedFiltersPanelRef} id="catalog-vehicle-advanced-filters">
          <Panel className="grid gap-3 p-4 shadow-none">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="m-0 text-[12px] font-semibold">Детальні фільтри каталогу</h2>
                <p className="mb-0 mt-1 text-[10px] text-[var(--muted-foreground)]">Фільтри винесені з шапки таблиці та комбінуються з пошуком і категоріями вище.</p>
              </div>
              <button type="button" className="button button-ghost self-start" disabled={!advancedFilterCount} onClick={clearAdvancedFilters}>
                Скинути детальні
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <label className="field">
                <span>Категорія таблиці</span>
                <select value={columnCategory} onChange={(event) => setColumnCategory(event.target.value as VehicleCategoryFilter)}>
                  <option value="all">All</option><option value="3WV">3WV</option><option value="ATV">ATV</option><option value="SSV">SSV</option><option value="PWC">PWC</option>
                </select>
              </label>
              <label className="field"><span>SKU</span><input placeholder="SKU..." value={skuFilter} onChange={(event) => setSkuFilter(event.target.value)} /></label>
              <label className="field"><span>Назва</span><input placeholder="Назва..." value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} /></label>
              <label className="field"><span>Колір</span><input placeholder="Колір..." value={colorFilter} onChange={(event) => setColorFilter(event.target.value)} /></label>
              <label className="field"><span>Двигун</span><input placeholder="Двигун..." value={engineFilter} onChange={(event) => setEngineFilter(event.target.value)} /></label>
              <label className="field">
                <span>Модельний рік</span>
                <select value={modelYearFilter} onChange={(event) => setModelYearFilter(event.target.value)}><option value="">All</option><option value="2025">2025</option><option value="2026">2026</option></select>
              </label>
              <label className="field">
                <span>Рік виробництва</span>
                <select value={productionYearFilter} onChange={(event) => setProductionYearFilter(event.target.value)}><option value="">All</option><option value="2025">2025</option><option value="2026">2026</option></select>
              </label>
            </div>
          </Panel>
        </div>
      ) : null}

      <Panel className="min-w-0 overflow-visible shadow-none">
        <RepresentativeNotice shown={visibleProducts.length} total={sourceTotalForCurrentCategory} noun="продуктів" />
        <ul className="grid list-none gap-3 p-3 md:hidden" aria-label="Товари каталогу">
          {visibleProducts.map((product) => (
            <li key={product.id} data-record-id={product.id} aria-labelledby={`catalog-vehicles-${product.id}-title`} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <div id={`catalog-vehicles-${product.id}-title`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge>{product.category}</StatusBadge><StatusBadge tone="green">Активний</StatusBadge></div>
                  <strong className="mt-2 block font-mono text-[13px] text-[var(--blue)]">{product.sku}</strong>
                  <span className="mt-1 block text-[12px] font-medium leading-snug">{product.name}</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">{product.nameUa}</span>
                </div>
                <VehicleActions productId={product.id} sku={product.sku} surface="mobile" />
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Колір</dt><dd className="m-0">{product.color}<span className="block text-[10px] text-[var(--muted-foreground)]">{product.colorUa}</span></dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Двигун</dt><dd className="m-0">{product.engine}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Роки</dt><dd className="m-0 tabular-nums">MY {product.modelYear} · {product.productionYear}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Ціни</dt><dd className="m-0 font-mono tabular-nums">{formatVehiclePrice(product.priceUsd, "USD")} · {formatVehiclePrice(product.priceEur, "EUR")}</dd></div>
              </dl>
            </li>
          ))}
          {isTrueNoResult ? <li><EmptyState compact icon={<Package size={22} />} title="Продуктів ще немає" description="Товари з'являться тут, коли дані каталогу будуть доступні." /></li> : null}
          {!isTrueNoResult && visibleProducts.length === 0 ? <li className="px-3 py-8 text-center text-[11px] text-[var(--muted-foreground)]">Для цієї категорії немає доступних рядків. Загальний лічильник показано вище.</li> : null}
        </ul>
        <div className="data-table-wrap hidden [contain:paint] md:block" role="region" aria-label="Таблиця товарів каталогу" tabIndex={0}>
          <table className="data-table min-w-[1120px]">
            <thead>
              <tr>
                <th>Категорія</th><th>SKU</th><th>Назва</th><th>Колір</th><th>Двигун</th><th>Модельний рік</th><th>Рік вир.</th><th>Ціна USD</th><th>Ціна EUR</th><th>Статус</th><th><span className="sr-only">Дії</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id} data-record-id={product.id}>
                  <td><StatusBadge>{product.category}</StatusBadge></td>
                  <td className="font-mono font-semibold">{product.sku}</td>
                  <td><strong className="block font-medium">{product.name}</strong><span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">{product.nameUa}</span></td>
                  <td>{product.color}<span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">{product.colorUa}</span></td>
                  <td>{product.engine}</td>
                  <td className="tabular-nums">{product.modelYear}</td>
                  <td className="tabular-nums">{product.productionYear}</td>
                  <td className="font-mono tabular-nums">{formatVehiclePrice(product.priceUsd, "USD")}</td>
                  <td className="font-mono tabular-nums">{formatVehiclePrice(product.priceEur, "EUR")}</td>
                  <td><StatusBadge tone="green">Активний</StatusBadge></td>
                  <td className="relative text-right"><VehicleActions productId={product.id} sku={product.sku} surface="desktop" /></td>
                </tr>
              ))}
              {isTrueNoResult ? (
                <tr><td colSpan={11}><EmptyState compact icon={<Package size={22} />} title="Продуктів ще немає" description="Товари з'являться тут, коли дані каталогу будуть доступні." /></td></tr>
              ) : null}
              {!isTrueNoResult && visibleProducts.length === 0 ? (
                <tr><td colSpan={11} className="py-10 text-center text-[var(--muted-foreground)]">Для цієї категорії немає доступних рядків. Загальний лічильник показано вище.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function DistributorPrices() {
  const { distributorCategory: category, setDistributorCategory: setCategory, distributorQuery: query, setDistributorQuery: setQuery } = useCatalogViewState();

  const visibleRows = useMemo(() => distributorPriceRows.filter((row) => {
    if (row.category !== category) return false;
    const needle = normalize(query);
    return !needle || normalize(`${row.sku} ${row.family} ${row.trim} ${row.color} ${row.colorUa}`).includes(needle);
  }), [category, query]);

  const countCards = [
    ["Total", distributorSourceCounts.total, "blue"],
    ["3WV", distributorSourceCounts["3WV"], "blue"],
    ["ATV", distributorSourceCounts.ATV, "amber"],
    ["PWC", distributorSourceCounts.PWC, "blue"],
    ["SSV", distributorSourceCounts.SSV, "green"],
  ] as const;

  return (
    <section
      id="catalog-distributor-panel"
      role="tabpanel"
      aria-labelledby="catalog-distributor-panel-tab"
      className="grid min-w-0 gap-5"
    >
      <div className="hidden md:block">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Показники цін дистриб'ютора">
          {countCards.map(([label, value, tone]) => (
            <AdminKpiCard key={label} item={{ id: label, label, value, tone }} />
          ))}
        </section>
      </div>

      <AdminToolbar
        search={<SearchField value={query} onChange={setQuery} placeholder="Пошук SKU, модель, колір..." label="Пошук цін дистриб'ютора" />}
        filters={(
          <AdminSegmentedControl
            items={distributorCategoryTabs.map((item) => ({ id: item, label: item }))}
            value={category}
            onValueChange={setCategory}
            label="Категорії цін дистриб'ютора"
          />
        )}
      />

      <Panel className="min-w-0 overflow-hidden shadow-none">
        <RepresentativeNotice shown={visibleRows.length} total={distributorSourceCounts[category]} noun={`цін категорії ${category}`} />
        <ul className="grid list-none gap-3 p-3 md:hidden" aria-label="Ціни дистриб’ютора">
          {visibleRows.map((row) => (
            <li key={row.id} data-record-id={row.id} aria-labelledby={`catalog-distributor-${row.id}-title`} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <div id={`catalog-distributor-${row.id}-title`} className="min-w-0"><strong className="block font-mono text-[13px] text-[var(--blue)]">{row.sku}</strong><span className="mt-1 block text-[12px] font-medium">{row.family} · {row.trim}</span><span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">{row.engine} · MY {row.modelYear}</span></div>
                <StatusBadge>{row.homologation}</StatusBadge>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Колір</dt><dd className="m-0">{row.color}<span className="block text-[10px] text-[var(--muted-foreground)]">{row.colorUa}</span></dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Доступність</dt><dd className="m-0">Display: {row.display ? "так" : "—"}<span className="block">Service: {row.service ? "так" : "—"}</span></dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Ex-Works EUR</dt><dd className="m-0 font-mono tabular-nums">€{row.exWorksEur.toFixed(2)}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Ex-DC EUR</dt><dd className="m-0 font-mono tabular-nums">€{row.exDcEur.toFixed(2)}</dd></div>
              </dl>
            </li>
          ))}
          {visibleRows.length === 0 ? <li className="px-3 py-8 text-center text-[11px] text-[var(--muted-foreground)]">Відповідних рядків немає. Загальний лічильник збережено.</li> : null}
        </ul>
        <div className="data-table-wrap hidden [contain:paint] md:block" role="region" aria-label="Таблиця цін дистриб’ютора" tabIndex={0}>
          <table className="data-table min-w-[1160px]">
            <thead><tr><th>SKU</th><th>Сімейство</th><th>Комплектація</th><th>Двигун</th><th>Колір</th><th>Колір UA</th><th aria-label="Display"><Monitor size={13} /></th><th aria-label="Service"><Wrench size={13} /></th><th>Омологація</th><th>MY</th><th>Ex-Works EUR</th><th>Ex-DC EUR</th></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} data-record-id={row.id}>
                  <td className="font-mono font-semibold">{row.sku}</td><td className="font-medium">{row.family}</td><td>{row.trim}</td><td>{row.engine}</td><td>{row.color}</td><td>{row.colorUa}</td>
                  <td className="text-center text-[var(--green)]">{row.display ? <Check size={14} /> : "—"}</td><td className="text-center text-[var(--green)]">{row.service ? <Check size={14} /> : "—"}</td>
                  <td><StatusBadge>{row.homologation}</StatusBadge></td><td>{row.modelYear}</td><td className="tabular-nums">{row.exWorksEur.toFixed(2)}</td><td className="tabular-nums">{row.exDcEur.toFixed(2)}</td>
                </tr>
              ))}
              {visibleRows.length === 0 ? (
                <tr><td colSpan={12} className="py-10 text-center text-[var(--muted-foreground)]">Відповідних рядків немає. Загальний лічильник збережено.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function DebugPricing() {
  const { debugOpen: open, setDebugOpen: setOpen, debugQuery: query, setDebugQuery: setQuery, submittedDebugQuery: submittedQuery, setSubmittedDebugQuery: setSubmittedQuery } = useCatalogViewState();
  const hasObservedResult = normalize(submittedQuery ?? "") === normalize(catalogPricingDebugResult.sku);

  return (
    <Panel className="overflow-hidden shadow-none">
      <button type="button" className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-[13px] font-medium" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />} <Bug size={15} /> Перевірка ціни
        <span className="ml-1 text-[11px] font-normal text-[var(--muted-foreground)]">— деталі розрахунку ціни SKU</span>
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="input min-w-0 flex-1 font-mono" aria-label="SKU для перевірки ціни" value={query} onChange={(event) => { setQuery(event.target.value); setSubmittedQuery(null); }} placeholder="SKU" />
            <button type="button" disabled={!normalize(query)} className="button button-primary sm:min-w-24" onClick={() => setSubmittedQuery(query)}>Перевірити</button>
          </div>

          {submittedQuery && hasObservedResult ? (
            <div className="grid gap-2">
              <div className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div><strong className="font-mono text-[15px] text-[var(--blue)]">{catalogPricingDebugResult.sku}</strong><span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">{catalogPricingDebugResult.description}</span></div>
                <div className="flex flex-wrap gap-2"><StatusBadge>{catalogPricingDebugResult.fullType}</StatusBadge><StatusBadge>1</StatusBadge><StatusBadge>{catalogPricingDebugResult.source}</StatusBadge></div>
              </div>

              <details open className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                <summary className="cursor-pointer text-[12px] font-semibold">📊 Data (part catalog)</summary>
                <dl className="mt-3 grid grid-cols-[minmax(130px,1fr)_minmax(150px,1fr)] gap-x-4 gap-y-1 font-mono text-[11px]">
                  <dt>dist_price:</dt><dd>€{catalogPricingDebugResult.distributorEur.toFixed(2)}</dd>
                  <dt>dealer_price:</dt><dd>${catalogPricingDebugResult.dealerUsd.toFixed(2)}</dd>
                  <dt>retail_price:</dt><dd>${catalogPricingDebugResult.retailUsd.toFixed(2)}</dd>
                  <dt>price_cat:</dt><dd>{catalogPricingDebugResult.priceCategory}</dd>
                  <dt>product_line:</dt><dd>SKI (SKI)</dd>
                  <dt>quantity:</dt><dd>{catalogPricingDebugResult.quantity} (reserved: {catalogPricingDebugResult.reserved})</dd>
                  <dt>updated_at:</dt><dd>{catalogPricingDebugResult.updatedAt}</dd>
                </dl>
              </details>

              <details open className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                <summary className="cursor-pointer text-[12px] font-semibold">🧮 Calculation (step-by-step)</summary>
                <div className="mt-3 grid gap-1 font-mono text-[11px]">
                  <p className="m-0 text-[var(--muted-foreground)]">
                    Settings: eur_usd = {catalogPricingDebugResult.settings.eurUsd}, expense_pct = {catalogPricingDebugResult.settings.expensePercent} ({catalogPricingDebugResult.settings.expensePercent * 100}%)
                  </p>
                  {catalogPricingDebugResult.calculationSteps.map((step) => <p key={step} className="m-0">{step}</p>)}
                </div>
              </details>

              <details className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"><summary className="cursor-pointer text-[12px] font-semibold">🌐 BossWeb (informational only — not used in pricing)</summary></details>
              <details className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"><summary className="cursor-pointer text-[12px] font-semibold"><Link2 size={13} className="mr-1 inline" />Substitution chain</summary></details>
            </div>
          ) : null}

          {submittedQuery && !hasObservedResult ? (
            <p className="m-0 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-center text-[11px] text-[var(--muted-foreground)]">
              Для цього SKU немає даних для розрахунку. Підключення до сервісу ціноутворення недоступне.
            </p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function CatalogHealth() {
  const { healthOpen: open, setHealthOpen: setOpen } = useCatalogViewState();
  return (
    <Panel className="overflow-hidden shadow-none">
      <button type="button" className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-[13px] font-semibold" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="text-[var(--blue)]">〽</span> Catalog Health
        {open ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {catalogHealthMetrics.map((metric) => (
              <div key={metric.id} className={`rounded-md border p-3 text-center ${metric.tone === "amber" ? "border-[color-mix(in_srgb,var(--amber)_24%,var(--border))] bg-[color-mix(in_srgb,var(--amber-soft)_28%,var(--surface))]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}>
                <strong className={`block text-[22px] leading-none ${metric.tone === "amber" ? "text-[var(--amber)]" : ""}`}>{metric.value}</strong>
                <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--muted-foreground)]">
            {catalogSourceComposition.map((source) => (
              <span key={source.id} className="inline-flex items-center gap-1"><span className={`size-1.5 rounded-full ${source.tone === "blue" ? "bg-[var(--blue)]" : source.tone === "amber" ? "bg-[var(--amber)]" : "bg-[var(--faint)]"}`} />{source.label}: {formatInteger(source.value)}</span>
            ))}
            <span className="ml-auto">Last import: 12 июл., 03:06</span><span>Last 1C sync: 10 мая, 15:00</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-[var(--muted-foreground)]"><span>Assembly parts: 117 842</span><span>Priced: <strong className="text-[var(--amber)]">72%</strong></span><span>In stock: <strong>2%</strong></span><span className="ml-auto">Orphans: <strong className="text-[var(--amber)]">2 921</strong></span></div>
        </div>
      ) : null}
    </Panel>
  );
}

function ImportHistory() {
  const { importHistoryOpen: open, setImportHistoryOpen: setOpen } = useCatalogViewState();
  return (
    <Panel className="overflow-hidden shadow-none">
      <button type="button" className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-[13px] font-medium" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <History size={15} /> Історія імпорту <span className="text-[var(--muted-foreground)]">(20)</span>
        {open ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
      </button>
      {open ? (
        <>
          <RepresentativeNotice shown={catalogImportHistory.length} total={20} noun="імпортів" />
          <div className="data-table-wrap" role="region" aria-label="Історія імпорту" tabIndex={0}>
            <table className="data-table min-w-[900px]">
              <thead><tr><th>Дата</th><th>Режим</th><th>SKU</th><th>Нові/оновлені</th><th>Зміни</th><th>Ланцюжки</th><th>Тривалість</th><th>Статус</th></tr></thead>
              <tbody>{catalogImportHistory.map((row) => (
                <tr key={row.id}><td>{row.date}</td><td><StatusBadge tone={row.mode === "1C" ? "blue" : "amber"}>{row.mode}</StatusBadge></td><td>{row.skus === null ? "—" : formatInteger(row.skus)}</td><td className="font-mono text-[10px] text-[var(--green)]">{row.newUpdated}</td><td className="text-[10px]">{row.changes}</td><td>{row.chains}</td><td>{row.durationSeconds.toFixed(1)}s</td><td><StatusBadge tone={row.status === "OK" ? "green" : "red"}>{row.status}</StatusBadge></td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      ) : null}
    </Panel>
  );
}

function PartsCatalog() {
  const { partsQuery: query, setPartsQuery: setQuery, partStatus: status, setPartStatus: setStatus, partLine: line, setPartLine: setLine, partType: type, setPartType: setType, partsPage: page, setPartsPage: setPage } = useCatalogViewState();

  const hasFilters = Boolean(normalize(query) || status !== "all" || line !== "all" || type !== "all");
  const visibleRows = useMemo(() => catalogParts.filter((part) => {
    if (!hasFilters && part.fixturePage !== page) return false;
    if (status !== "all" && part.status !== status) return false;
    if (type !== "all" && part.fullType !== type) return false;
    if (line !== "all" && !part.fullType.startsWith(line)) return false;
    const needle = normalize(query);
    return !needle || normalize(`${part.sku} ${part.description} ${part.fullType}`).includes(needle);
  }), [hasFilters, line, page, query, status, type]);

  const sourceResultsLabel = hasFilters ? visibleRows.length : catalogPartsSourceTotal;
  const exactNoResult = hasFilters && visibleRows.length === 0;
  const fixturePageCovered = page <= 2;

  const changeQuery = (value: string) => { setQuery(value); setPage(1); };

  return (
    <section
      id="catalog-parts-panel"
      role="tabpanel"
      aria-labelledby="catalog-parts-panel-tab"
      className="grid min-w-0 gap-4"
    >
      <DebugPricing />

      <Panel className="flex flex-col gap-3 p-4 shadow-none lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-2 text-[13px]"><Calculator size={15} /> Pricing:</span>
          <label className="inline-flex items-center gap-2 text-[var(--muted-foreground)]">EUR/USD <input className="input h-9 w-20 text-center text-[var(--foreground)]" value={catalogPricingDebugResult.settings.eurUsd.toFixed(2)} readOnly aria-readonly="true" /></label>
          <label className="inline-flex items-center gap-2 text-[var(--muted-foreground)]">Expense % <input className="input h-9 w-20 text-center text-[var(--foreground)]" value={catalogPricingDebugResult.settings.expensePercent.toFixed(2)} readOnly aria-readonly="true" /></label>
          <LockedButton title="Перерахунок цін є операційною дією і вимкнений" className="!border-[color-mix(in_srgb,var(--green)_24%,var(--border))] !bg-[var(--green-soft)] !text-[var(--green)]"><Calculator size={14} /> Перерахувати ціни</LockedButton>
        </div>
        <span className="text-[11px] text-[var(--muted-foreground)] lg:ml-auto">148 671 parts with prices</span>
      </Panel>

      <CatalogHealth />
      <ImportHistory />

      <AdminToolbar
        search={<SearchField value={query} onChange={changeQuery} placeholder="SKU або опис..." label="Пошук у каталозі запчастин" />}
        filters={(
          <>
            <select className="input h-10 bg-[var(--surface)]" aria-label="Фільтр статусу запчастини" value={status} onChange={(event) => { setStatus(event.target.value as PartStatusFilter); setPage(1); }}>
              <option value="all">Усі статуси</option><option value="active">Active</option><option value="substituted">Substituted</option><option value="obsolete">Obsolete</option>
            </select>
            <select className="input h-10 bg-[var(--surface)]" aria-label="Фільтр лінійки запчастини" value={line} onChange={(event) => { setLine(event.target.value as PartLineFilter); setPage(1); }}>
              <option value="all">Усі лінійки</option><option value="SKI">SKI</option><option value="Sea-Doo">Sea-Doo</option><option value="SSV">SSV</option><option value="Spyder">Spyder</option>
            </select>
            <select className="input h-10 bg-[var(--surface)]" aria-label="Фільтр повного типу запчастини" value={type} onChange={(event) => { setType(event.target.value as PartTypeFilter); setPage(1); }}>
              <option value="all">Усі типи</option><option value="SKI Parts">SKI Parts</option><option value="Sea-Doo Parts">Sea-Doo Parts</option><option value="SSV Parts">SSV Parts</option><option value="Spyder Parts">Spyder Parts</option>
            </select>
          </>
        )}
        meta={`${formatInteger(sourceResultsLabel)} результатів`}
      />

      <Panel className="min-w-0 overflow-hidden shadow-none">
        <RepresentativeNotice shown={visibleRows.length} total={hasFilters ? visibleRows.length : catalogPartsSourceTotal} noun="рядків каталогу" />
        <ul className="grid list-none gap-3 p-3 md:hidden" aria-label="Каталог запчастин">
          {visibleRows.map((part) => (
            <li key={part.id} data-record-id={part.id} aria-labelledby={`catalog-parts-${part.id}-title`} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-2"><div id={`catalog-parts-${part.id}-title`} className="min-w-0"><strong className="block font-mono text-[13px] text-[var(--blue)]">{part.sku}</strong><span className="mt-1 block text-[12px] font-medium">{part.description}</span></div><div className="flex flex-wrap justify-end gap-1"><StatusBadge tone={part.fullType === "Sea-Doo Parts" ? "blue" : part.fullType === "SSV Parts" ? "green" : part.fullType === "Spyder Parts" ? "purple" : "neutral"}>{part.fullType}</StatusBadge><StatusBadge tone={part.status === "active" ? "green" : part.status === "obsolete" ? "red" : "amber"}>{part.status === "active" ? "Active" : part.status === "obsolete" ? "Obsolete" : "Substituted"}</StatusBadge></div></div>
              <dl className="grid grid-cols-3 gap-x-2 gap-y-2 text-[11px]">
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Дист. EUR</dt><dd className="m-0 font-mono tabular-nums">{formatDecimal(part.distributorEur, "EUR")}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Дилер USD</dt><dd className="m-0 font-mono tabular-nums text-[var(--amber)]">{formatDecimal(part.dealerUsd, "USD")}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Розд. USD</dt><dd className="m-0 font-mono tabular-nums text-[var(--blue)]">{formatDecimal(part.retailUsd, "USD")}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">МОЗ</dt><dd className="m-0">{part.moq ?? "—"}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">К-ть</dt><dd className="m-0">{part.quantity ?? "—"}</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.03em] text-[var(--muted-foreground)]">Активна</dt><dd className="m-0 font-mono text-[10px] text-[var(--green)]">{part.replacement ? `${part.replacement.activeSku}${part.replacement.priceUsd === null ? "" : ` $${part.replacement.priceUsd.toFixed(2)}`}` : "—"}</dd></div>
              </dl>
            </li>
          ))}
          {exactNoResult ? <li className="px-3 py-10 text-center text-[var(--muted-foreground)]">Нічого не знайдено.</li> : null}
          {!hasFilters && !fixturePageCovered ? <li className="px-3 py-10 text-center text-[11px] text-[var(--muted-foreground)]">Для сторінки {page} немає доступних рядків каталогу.</li> : null}
        </ul>
        <div className="data-table-wrap hidden [contain:paint] md:block" role="region" aria-label="Таблиця каталогу запчастин" tabIndex={0}>
          <table className="data-table min-w-[1040px]">
            <thead><tr><th>SKU</th><th>Опис</th><th>Повний тип</th><th>Дист. EUR</th><th>Дилер USD</th><th>Розд. USD</th><th>МОЗ</th><th>К-ть</th><th>Статус</th><th>→ Активна запчастина</th></tr></thead>
            <tbody>
              {visibleRows.map((part) => (
                <tr key={part.id} data-record-id={part.id}>
                  <td className="font-mono font-semibold text-[var(--blue)]">{part.sku}</td><td>{part.description}</td><td><StatusBadge tone={part.fullType === "Sea-Doo Parts" ? "blue" : part.fullType === "SSV Parts" ? "green" : part.fullType === "Spyder Parts" ? "purple" : "neutral"}>{part.fullType}</StatusBadge></td>
                  <td className="font-mono tabular-nums">{formatDecimal(part.distributorEur, "EUR")}</td><td className="font-mono tabular-nums text-[var(--amber)]">{formatDecimal(part.dealerUsd, "USD")}</td><td className="font-mono tabular-nums text-[var(--blue)]">{formatDecimal(part.retailUsd, "USD")}</td><td>{part.moq ?? "—"}</td><td>{part.quantity ?? "—"}</td>
                  <td><StatusBadge tone={part.status === "active" ? "green" : part.status === "obsolete" ? "red" : "amber"}>{part.status === "active" ? "Active" : part.status === "obsolete" ? "Obsolete" : "Substituted"}</StatusBadge></td>
                  <td>{part.replacement ? <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--green)]"><Link2 size={12} />{part.replacement.activeSku}{part.replacement.priceUsd === null ? "" : ` $${part.replacement.priceUsd.toFixed(2)}`}</span> : ""}</td>
                </tr>
              ))}
              {exactNoResult ? <tr><td colSpan={10} className="py-12 text-center text-[var(--muted-foreground)]">Нічого не знайдено.</td></tr> : null}
              {!hasFilters && !fixturePageCovered ? <tr><td colSpan={10} className="py-12 text-center text-[var(--muted-foreground)]">Для сторінки {page} немає доступних рядків каталогу.</td></tr> : null}
            </tbody>
          </table>
        </div>
        {!hasFilters ? (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
            <button type="button" className="button button-outline" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /> Prev</button>
            <span className="text-[11px] text-[var(--muted-foreground)]">Сторінка {page} з {catalogPartsSourcePages}</span>
            <button type="button" className="button button-outline" disabled={page === catalogPartsSourcePages} onClick={() => setPage((current) => Math.min(catalogPartsSourcePages, current + 1))}>Далі <ChevronRight size={14} /></button>
          </div>
        ) : null}
      </Panel>
    </section>
  );
}

function CurrentAdminCatalogView() {
  const { activeTab, setActiveTab } = useCatalogViewState();
  return (
    <div data-admin-catalog-renderer="current">
      <AdminPage>
      <AdminPageHeader icon={<Database size={20} />} title="Керування каталогом" description="Товари, ціни дистриб'ютора та каталог запчастин" />
      <GlobalKpis />
      <PrimaryTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "vehicles" ? <VehicleCatalog /> : null}
      {activeTab === "distributor" ? <DistributorPrices /> : null}
      {activeTab === "parts" ? <PartsCatalog /> : null}
      </AdminPage>
    </div>
  );
}

export function AdminCatalogPage() {
  const viewProps = useCatalogPageViewState();
  return (
    <CatalogViewStateContext.Provider value={viewProps}>
      <RendererViewSwitch
        slotId="admin-catalog"
        currentView={<CurrentAdminCatalogView />}
        loadAstryxView={loadAstryxAdminCatalogView}
        astryxViewProps={viewProps}
      />
    </CatalogViewStateContext.Provider>
  );
}
