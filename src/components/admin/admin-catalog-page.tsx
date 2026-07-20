"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
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
      Репрезентативна source-вибірка: показано {shown} з {formatInteger(total)} {noun}. Загальний лічильник збережено точно.
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
  openMenuId,
  onToggle,
  menuRootRefs,
  menuTriggerRefs,
}: {
  productId: string;
  sku: string;
  surface: "desktop" | "mobile";
  openMenuId: string | null;
  onToggle: (menuId: string) => void;
  menuRootRefs: MutableRefObject<Map<string, HTMLElement>>;
  menuTriggerRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
}) {
  const menuId = `${surface}-${productId}`;
  const actionsId = `catalog-product-actions-${menuId}`;
  const isOpen = openMenuId === menuId;

  return (
    <div
      ref={(node) => {
        if (node) menuRootRefs.current.set(menuId, node);
        else menuRootRefs.current.delete(menuId);
      }}
      className="relative"
    >
      <button
        ref={(node) => {
          if (node) menuTriggerRefs.current.set(menuId, node);
          else menuTriggerRefs.current.delete(menuId);
        }}
        type="button"
        className={`inline-flex items-center justify-center rounded-md border border-transparent text-[var(--muted-foreground)] transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] ${surface === "mobile" ? "size-11 min-h-11 min-w-11" : "size-7"}`}
        aria-label={`Меню продукту ${sku}`}
        aria-expanded={isOpen}
        aria-controls={actionsId}
        onClick={() => onToggle(menuId)}
      >
        <EllipsisVertical size={16} />
      </button>
      {isOpen ? (
        <div id={actionsId} role="group" aria-label={`Дії продукту ${sku}`} className="absolute right-0 top-full z-20 mt-1 grid min-w-36 gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 text-left shadow-[var(--shadow-menu)]">
          <button type="button" disabled className="button button-ghost justify-start text-[12px]" title="Редагування вимкнене у read-only клоні"><LockKeyhole size={13} /> Редагувати</button>
          <button type="button" disabled className="button button-ghost justify-start text-[12px] text-[var(--red)]" title="Видалення вимкнене у read-only клоні"><Trash2 size={13} /> Видалити</button>
        </div>
      ) : null}
    </div>
  );
}

function VehicleCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VehicleCategoryFilter>("all");
  const [columnCategory, setColumnCategory] = useState<VehicleCategoryFilter>("all");
  const [skuFilter, setSkuFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [engineFilter, setEngineFilter] = useState("");
  const [modelYearFilter, setModelYearFilter] = useState("");
  const [productionYearFilter, setProductionYearFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const menuRootRefs = useRef(new Map<string, HTMLElement>());
  const menuTriggerRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!openMenuId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenMenuId(null);
      menuTriggerRefs.current.get(openMenuId)?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const root = menuRootRefs.current.get(openMenuId);
      if (event.target instanceof Node && !root?.contains(event.target)) setOpenMenuId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openMenuId]);

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
    setOpenMenuId(null);
  };

  const clearAdvancedFilters = () => {
    setColumnCategory("all");
    setSkuFilter("");
    setNameFilter("");
    setColorFilter("");
    setEngineFilter("");
    setModelYearFilter("");
    setProductionYearFilter("");
    setOpenMenuId(null);
  };

  return (
    <section
      id="catalog-vehicles-panel"
      role="tabpanel"
      aria-labelledby="catalog-vehicles-panel-tab"
      className="grid gap-5"
    >
      <p className="m-0 text-[15px] text-[var(--muted-foreground)]">
        Управління каталогом транспортних засобів для інвойсів та ціноутворення
      </p>
      <VehicleKpis counts={counts} />

      <AdminToolbar
        search={<SearchField value={query} onChange={(value) => { setQuery(value); setOpenMenuId(null); }} placeholder="Пошук за SKU або назвою..." label="Пошук транспортних засобів" />}
        filters={(
          <AdminSegmentedControl
            items={vehicleCategoryTabs.map((item) => ({ id: item, label: item === "all" ? "All" : item }))}
            value={category}
            onValueChange={updateCategory}
            label="Категорії транспортних засобів"
          />
        )}
        actions={(
          <button
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
      />

      {advancedFiltersOpen ? (
        <div id="catalog-vehicle-advanced-filters">
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

      <Panel className="overflow-visible shadow-none">
        <RepresentativeNotice shown={visibleProducts.length} total={sourceTotalForCurrentCategory} noun="продуктів у source" />
        <ul className="grid list-none gap-3 p-3 md:hidden" aria-label="Товари каталогу">
          {visibleProducts.map((product) => (
            <li key={product.id} data-record-id={product.id} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge>{product.category}</StatusBadge><StatusBadge tone="green">Активний</StatusBadge></div>
                  <strong className="mt-2 block font-mono text-[13px] text-[var(--blue)]">{product.sku}</strong>
                  <span className="mt-1 block text-[12px] font-medium leading-snug">{product.name}</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">{product.nameUa}</span>
                </div>
                <VehicleActions productId={product.id} sku={product.sku} surface="mobile" openMenuId={openMenuId} onToggle={(menuId) => setOpenMenuId((current) => current === menuId ? null : menuId)} menuRootRefs={menuRootRefs} menuTriggerRefs={menuTriggerRefs} />
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
          {!isTrueNoResult && visibleProducts.length === 0 ? <li className="px-3 py-8 text-center text-[11px] text-[var(--muted-foreground)]">У репрезентативній source-вибірці немає рядків цієї категорії. Точний загальний лічильник показано вище.</li> : null}
        </ul>
        <div className="data-table-wrap hidden md:block" role="region" aria-label="Таблиця товарів каталогу" tabIndex={0}>
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
                  <td className="text-right"><VehicleActions productId={product.id} sku={product.sku} surface="desktop" openMenuId={openMenuId} onToggle={(menuId) => setOpenMenuId((current) => current === menuId ? null : menuId)} menuRootRefs={menuRootRefs} menuTriggerRefs={menuTriggerRefs} /></td>
                </tr>
              ))}
              {isTrueNoResult ? (
                <tr><td colSpan={11}><EmptyState compact icon={<Package size={22} />} title="Продуктів ще немає" description="Товари з'являться тут, коли дані каталогу будуть доступні." /></td></tr>
              ) : null}
              {!isTrueNoResult && visibleProducts.length === 0 ? (
                <tr><td colSpan={11} className="py-10 text-center text-[var(--muted-foreground)]">У репрезентативній source-вибірці немає рядків цієї категорії. Точний загальний лічильник показано вище.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function DistributorPrices() {
  const [category, setCategory] = useState<DistributorPriceCategory>("ATV");
  const [query, setQuery] = useState("");

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
      className="grid gap-5"
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

      <Panel className="overflow-hidden shadow-none">
        <RepresentativeNotice shown={visibleRows.length} total={distributorSourceCounts[category]} noun={`цін категорії ${category} у source`} />
        <ul className="grid list-none gap-3 p-3 md:hidden" aria-label="Ціни дистриб’ютора">
          {visibleRows.map((row) => (
            <li key={row.id} data-record-id={row.id} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><strong className="block font-mono text-[13px] text-[var(--blue)]">{row.sku}</strong><span className="mt-1 block text-[12px] font-medium">{row.family} · {row.trim}</span><span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">{row.engine} · MY {row.modelYear}</span></div>
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
          {visibleRows.length === 0 ? <li className="px-3 py-8 text-center text-[11px] text-[var(--muted-foreground)]">У репрезентативній source-вибірці немає відповідних рядків. Точний загальний лічильник збережено.</li> : null}
        </ul>
        <div className="data-table-wrap hidden md:block" role="region" aria-label="Таблиця цін дистриб’ютора" tabIndex={0}>
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
                <tr><td colSpan={12} className="py-10 text-center text-[var(--muted-foreground)]">У репрезентативній source-вибірці немає відповідних рядків. Точний загальний лічильник збережено.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function DebugPricing() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const hasObservedResult = normalize(submittedQuery ?? "") === normalize(catalogPricingDebugResult.sku);

  return (
    <Panel className="overflow-hidden shadow-none">
      <button type="button" className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-[13px] font-medium" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />} <Bug size={15} /> Debug Pricing
        <span className="ml-1 text-[11px] font-normal text-[var(--muted-foreground)]">— explain how a SKU&apos;s price is calculated</span>
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="input min-w-0 flex-1 font-mono" aria-label="SKU для Debug Pricing" value={query} onChange={(event) => { setQuery(event.target.value); setSubmittedQuery(null); }} placeholder="SKU" />
            <button type="button" disabled={!normalize(query)} className="button button-primary sm:min-w-24" onClick={() => setSubmittedQuery(query)}>Debug</button>
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
              Для цього SKU немає source-observed debug fixture. Зовнішній запит не виконувався.
            </p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function CatalogHealth() {
  const [open, setOpen] = useState(true);
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
  const [open, setOpen] = useState(false);
  return (
    <Panel className="overflow-hidden shadow-none">
      <button type="button" className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-[13px] font-medium" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <History size={15} /> Import History <span className="text-[var(--muted-foreground)]">(20)</span>
        {open ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
      </button>
      {open ? (
        <>
          <RepresentativeNotice shown={catalogImportHistory.length} total={20} noun="імпортів у source" />
          <div className="data-table-wrap" role="region" aria-label="Історія імпорту" tabIndex={0}>
            <table className="data-table min-w-[900px]">
              <thead><tr><th>Date</th><th>Mode</th><th>SKUs</th><th>New/Upd</th><th>Changes</th><th>Chains</th><th>Duration</th><th>Статус</th></tr></thead>
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PartStatusFilter>("all");
  const [line, setLine] = useState<PartLineFilter>("all");
  const [type, setType] = useState<PartTypeFilter>("all");
  const [page, setPage] = useState(1);

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
      className="grid gap-4"
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

      <Panel className="overflow-hidden shadow-none">
        <RepresentativeNotice shown={visibleRows.length} total={hasFilters ? visibleRows.length : catalogPartsSourceTotal} noun="рядків каталогу" />
        <ul className="grid list-none gap-3 p-3 md:hidden" aria-label="Каталог запчастин">
          {visibleRows.map((part) => (
            <li key={part.id} data-record-id={part.id} className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><strong className="block font-mono text-[13px] text-[var(--blue)]">{part.sku}</strong><span className="mt-1 block text-[12px] font-medium">{part.description}</span></div><div className="flex flex-wrap justify-end gap-1"><StatusBadge tone={part.fullType === "Sea-Doo Parts" ? "blue" : part.fullType === "SSV Parts" ? "green" : part.fullType === "Spyder Parts" ? "purple" : "neutral"}>{part.fullType}</StatusBadge><StatusBadge tone={part.status === "active" ? "green" : part.status === "obsolete" ? "red" : "amber"}>{part.status === "active" ? "Active" : part.status === "obsolete" ? "Obsolete" : "Substituted"}</StatusBadge></div></div>
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
          {!hasFilters && !fixturePageCovered ? <li className="px-3 py-10 text-center text-[11px] text-[var(--muted-foreground)]">Сторінку {page} можна переглянути у локальній пагінації, але її рядки не входять до репрезентативного source fixture.</li> : null}
        </ul>
        <div className="data-table-wrap hidden md:block" role="region" aria-label="Таблиця каталогу запчастин" tabIndex={0}>
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
              {!hasFilters && !fixturePageCovered ? <tr><td colSpan={10} className="py-12 text-center text-[var(--muted-foreground)]">Сторінку {page} можна переглянути у локальній пагінації, але її рядки не входять до репрезентативного source fixture.</td></tr> : null}
            </tbody>
          </table>
        </div>
        {!hasFilters ? (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3">
            <button type="button" className="button button-outline" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /> Prev</button>
            <span className="text-[11px] text-[var(--muted-foreground)]">Page {page} of {catalogPartsSourcePages}</span>
            <button type="button" className="button button-outline" disabled={page === catalogPartsSourcePages} onClick={() => setPage((current) => Math.min(catalogPartsSourcePages, current + 1))}>Next <ChevronRight size={14} /></button>
          </div>
        ) : null}
      </Panel>
    </section>
  );
}

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogPrimaryTab>("vehicles");

  return (
    <AdminPage>
      <AdminPageHeader icon={<Database size={20} />} title="Керування каталогом" description="Товари, ціни дистриб'ютора та каталог запчастин" />
      <GlobalKpis />
      <PrimaryTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "vehicles" ? <VehicleCatalog /> : null}
      {activeTab === "distributor" ? <DistributorPrices /> : null}
      {activeTab === "parts" ? <PartsCatalog /> : null}
    </AdminPage>
  );
}
