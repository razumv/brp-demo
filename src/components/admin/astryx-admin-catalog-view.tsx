"use client";

import {useLayoutEffect, useMemo, useRef} from "react";
import {Bug, Calculator, LockKeyhole} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Collapsible} from "@astryxdesign/core/Collapsible";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {MoreMenu} from "@astryxdesign/core/MoreMenu";
import {Pagination} from "@astryxdesign/core/Pagination";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {TextInput} from "@astryxdesign/core/TextInput";
import {useAppearance} from "@/components/appearance/use-appearance";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  catalogImportHistory, catalogParts, catalogPartsSourcePages, catalogPartsSourceTotal, catalogPricingDebugResult,
  catalogVehicleProducts, catalogVehicleSourceCounts, distributorPriceRows, distributorSourceCounts,
} from "@/lib/admin-catalog-data";
import type {CatalogPageViewProps} from "./admin-catalog-page";
import styles from "./astryx-admin-catalog.module.css";

const sections = [
  {id: "vehicles", label: "Каталог"},
  {id: "distributor", label: "Ціни дистриб'ютора"},
  {id: "parts", label: "Каталог запчастин"},
] as const;

function normalize(value: string) { return value.trim().toLocaleLowerCase("uk-UA"); }
function currency(value: number | null, symbol: "$" | "€") { return value === null ? "—" : `${symbol}${value.toFixed(2)}`; }
function tone(status: string): "success" | "warning" | "error" | "neutral" { return status === "active" || status === "OK" ? "success" : status === "obsolete" || status === "Error" ? "error" : status === "substituted" ? "warning" : "neutral"; }

function ProductMenu({id, sku, state, active}: {id: string; sku: string; state: CatalogPageViewProps; active: boolean}) {
  const menuKey = `astryx-${id}`;
  return <MoreMenu
    label={`Меню продукту ${sku}`}
    isMenuOpen={active && state.activeMenu === menuKey}
    onOpenChange={(open) => state.setActiveMenu(open ? menuKey : null)}
    items={[
      {label: "Редагувати — потрібне підключення сервісу каталогу", icon: <LockKeyhole size={14}/>, isDisabled: true},
      {label: "Видалити — потрібне підключення сервісу каталогу", icon: <LockKeyhole size={14}/>, isDisabled: true},
    ]}
  />;
}

function ResizeHandle({column, state}: {column: string; state: CatalogPageViewProps}) {
  const start = useRef<{x: number; width: number} | null>(null);
  return <span className={styles.resizeHandle} role="separator" aria-label={`Змінити ширину колонки ${column}`} tabIndex={0}
    onPointerDown={(event) => {
      start.current = {x: event.clientX, width: state.columnWidths[column] ?? 160};
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => {
      if (!start.current) return;
      state.setColumnWidths((current) => ({...current, [column]: Math.max(96, Math.min(520, start.current!.width + event.clientX - start.current!.x))}));
    }}
    onPointerUp={() => { start.current = null; }}
  />;
}

function Vehicles({state, active}: {state: CatalogPageViewProps; active: boolean}) {
  const rows = useMemo(() => catalogVehicleProducts.filter((product) => {
    const query = normalize(state.vehicleQuery);
    return (state.vehicleCategory === "all" || product.category === state.vehicleCategory)
      && (state.columnCategory === "all" || product.category === state.columnCategory)
      && (!query || normalize(`${product.sku} ${product.name} ${product.nameUa}`).includes(query))
      && (!normalize(state.skuFilter) || normalize(product.sku).includes(normalize(state.skuFilter)))
      && (!normalize(state.nameFilter) || normalize(`${product.name} ${product.nameUa}`).includes(normalize(state.nameFilter)))
      && (!normalize(state.colorFilter) || normalize(`${product.color} ${product.colorUa}`).includes(normalize(state.colorFilter)))
      && (!normalize(state.engineFilter) || normalize(product.engine).includes(normalize(state.engineFilter)))
      && (!state.modelYearFilter || String(product.modelYear) === state.modelYearFilter)
      && (!state.productionYearFilter || String(product.productionYear) === state.productionYearFilter);
  }), [state]);
  const hasFineFilters = Boolean(normalize(state.vehicleQuery) || normalize(state.skuFilter) || normalize(state.nameFilter) || normalize(state.colorFilter) || normalize(state.engineFilter) || state.modelYearFilter || state.productionYearFilter);
  const total = state.vehicleCategory === "all" && state.columnCategory === "all" && !hasFineFilters ? catalogVehicleSourceCounts.total : rows.length;
  return <section className={styles.stack} role="tabpanel" aria-label="Каталог транспортних засобів">
    <p className={styles.muted}>Управління каталогом транспортних засобів для інвойсів та ціноутворення.</p>
    <Card className={styles.toolbar} padding={3}>
      <TextInput label="Пошук транспортних засобів" isLabelHidden value={state.vehicleQuery} onChange={state.setVehicleQuery} placeholder="Пошук за SKU або назвою…" hasClear width="100%" />
      <SegmentedControl label="Категорії транспортних засобів" value={state.vehicleCategory} onChange={(value) => state.setVehicleCategory(value as typeof state.vehicleCategory)} layout="fill">
        {["all", "ATV", "SSV", "PWC"].map((value) => <SegmentedControlItem key={value} value={value} label={value === "all" ? "All" : value}/>)}</SegmentedControl>
      <Collapsible trigger="Детальні фільтри" isOpen={state.advancedFiltersOpen} onOpenChange={state.setAdvancedFiltersOpen}>
        <div className={styles.filters}>
          <Selector label="Категорія таблиці" value={state.columnCategory} onChange={(value) => state.setColumnCategory(value as typeof state.columnCategory)} options={["all", "3WV", "ATV", "SSV", "PWC"]}/>
          <TextInput label="SKU" value={state.skuFilter} onChange={state.setSkuFilter} placeholder="SKU…" />
          <TextInput label="Назва" value={state.nameFilter} onChange={state.setNameFilter} placeholder="Назва…" />
          <TextInput label="Колір" value={state.colorFilter} onChange={state.setColorFilter} placeholder="Колір…" />
          <TextInput label="Двигун" value={state.engineFilter} onChange={state.setEngineFilter} placeholder="Двигун…" />
          <Selector label="Модельний рік" value={state.modelYearFilter || undefined} onChange={(value) => state.setModelYearFilter(value ?? "")} options={[{value: "", label: "All"}, "2025", "2026"]}/>
          <Selector label="Рік виробництва" value={state.productionYearFilter || undefined} onChange={(value) => state.setProductionYearFilter(value ?? "")} options={[{value: "", label: "All"}, "2025", "2026"]}/>
        </div>
      </Collapsible>
    </Card>
    <Card padding={0}><header className={styles.tableMeta}><strong>{total} продуктів</strong><span>Показано {rows.length} репрезентативних записів.</span></header>
      <div className={styles.tableScroller} role="region" aria-label="Таблиця товарів каталогу" tabIndex={0}>
        <table className={styles.table}><thead><tr><th>Категорія</th><th style={{width: state.columnWidths.sku}}>SKU<ResizeHandle column="sku" state={state}/></th><th style={{width: state.columnWidths.name}}>Назва<ResizeHandle column="name" state={state}/></th><th style={{width: state.columnWidths.color}}>Колір<ResizeHandle column="color" state={state}/></th><th>Двигун</th><th>MY</th><th>Ціна USD</th><th>Ціна EUR</th><th>Статус</th><th><span className="sr-only">Дії</span></th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} data-record-id={row.id}><td><Badge label={row.category} variant="neutral"/></td><td><strong className={styles.code}>{row.sku}</strong></td><td><strong>{row.name}</strong><small>{row.nameUa}</small></td><td>{row.color}<small>{row.colorUa}</small></td><td>{row.engine}</td><td>{row.modelYear}/{row.productionYear}</td><td>{currency(row.priceUsd, "$")}</td><td>{currency(row.priceEur, "€")}</td><td><Badge label="Активний" variant="success"/></td><td><ProductMenu id={row.id} sku={row.sku} state={state} active={active}/></td></tr>)}</tbody>
        </table>
      </div>
      <ul className={styles.cards} aria-label="Товари каталогу">{rows.map((row) => <li key={row.id} data-record-id={row.id}><div><Badge label={row.category} variant="neutral"/><strong id={`astryx-catalog-${row.id}`}>{row.sku}</strong><span>{row.name}</span><small>{row.nameUa}</small></div><ProductMenu id={row.id} sku={row.sku} state={state} active={active}/><dl><div><dt>Колір</dt><dd>{row.color}</dd></div><div><dt>Ціни</dt><dd>{currency(row.priceUsd, "$")} · {currency(row.priceEur, "€")}</dd></div></dl></li>)}</ul>
      {!rows.length ? <EmptyState isCompact title="Продуктів не знайдено" description="Змініть пошук або фільтри."/> : null}
    </Card>
  </section>;
}

function Distributor({state}: {state: CatalogPageViewProps}) {
  const rows = useMemo(() => distributorPriceRows.filter((row) => row.category === state.distributorCategory && (!normalize(state.distributorQuery) || normalize(`${row.sku} ${row.family} ${row.trim} ${row.color}`).includes(normalize(state.distributorQuery)))), [state.distributorCategory, state.distributorQuery]);
  return <section className={styles.stack} role="tabpanel" aria-label="Ціни дистриб'ютора"><Card className={styles.toolbar} padding={3}><TextInput label="Пошук цін дистриб'ютора" isLabelHidden value={state.distributorQuery} onChange={state.setDistributorQuery} placeholder="Пошук SKU, модель, колір…" hasClear width="100%"/><SegmentedControl label="Категорії цін дистриб'ютора" value={state.distributorCategory} onChange={(value) => state.setDistributorCategory(value as typeof state.distributorCategory)} layout="fill">{["ATV", "SSV", "3WV", "PWC"].map((value) => <SegmentedControlItem key={value} value={value} label={value}/>)}</SegmentedControl></Card><Card padding={0}><header className={styles.tableMeta}><strong>{distributorSourceCounts[state.distributorCategory]} цін</strong><span>Показано {rows.length} репрезентативних записів.</span></header><div className={styles.tableScroller} role="region" aria-label="Таблиця цін дистриб’ютора" tabIndex={0}><table className={styles.table}><thead><tr><th>SKU</th><th>Сімейство</th><th>Комплектація</th><th>Колір</th><th>MY</th><th>Ex-Works EUR</th><th>Ex-DC EUR</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} data-record-id={row.id}><td><strong className={styles.code}>{row.sku}</strong></td><td>{row.family}</td><td>{row.trim}</td><td>{row.color}</td><td>{row.modelYear}</td><td>{currency(row.exWorksEur, "€")}</td><td>{currency(row.exDcEur, "€")}</td></tr>)}</tbody></table></div></Card></section>;
}

function Parts({state}: {state: CatalogPageViewProps}) {
  const hasFilters = Boolean(normalize(state.partsQuery) || state.partStatus !== "all" || state.partLine !== "all" || state.partType !== "all");
  const rows = useMemo(() => catalogParts.filter((part) => (!hasFilters ? part.fixturePage === state.partsPage : true) && (state.partStatus === "all" || part.status === state.partStatus) && (state.partType === "all" || part.fullType === state.partType) && (state.partLine === "all" || part.fullType.startsWith(state.partLine)) && (!normalize(state.partsQuery) || normalize(`${part.sku} ${part.description} ${part.fullType}`).includes(normalize(state.partsQuery)))), [hasFilters, state.partLine, state.partStatus, state.partType, state.partsPage, state.partsQuery]);
  const observed = normalize(state.submittedDebugQuery ?? "") === normalize(catalogPricingDebugResult.sku);
  return <section className={styles.stack} role="tabpanel" aria-label="Каталог запчастин"><Card padding={0}><Collapsible trigger={<span><Bug size={15}/> Debug Pricing</span>} isOpen={state.debugOpen} onOpenChange={state.setDebugOpen}><div className={styles.debug}><TextInput label="SKU для Debug Pricing" value={state.debugQuery} onChange={(value) => {state.setDebugQuery(value); state.setSubmittedDebugQuery(null);}} placeholder="SKU"/><Button label="Debug" variant="primary" isDisabled={!normalize(state.debugQuery)} onClick={() => state.setSubmittedDebugQuery(state.debugQuery)}/>{observed ? <p><strong>{catalogPricingDebugResult.sku}</strong> · {catalogPricingDebugResult.description} · {currency(catalogPricingDebugResult.retailUsd, "$")}</p> : state.submittedDebugQuery ? <p>Для цього SKU немає даних для розрахунку. Підключення до сервісу ціноутворення недоступне.</p> : null}</div></Collapsible></Card><Card className={styles.pricing} padding={3}><span><Calculator size={15}/> Pricing</span><TextInput label="EUR/USD" value={catalogPricingDebugResult.settings.eurUsd.toFixed(2)} onChange={() => {}} isDisabled/><TextInput label="Expense %" value={catalogPricingDebugResult.settings.expensePercent.toFixed(2)} onChange={() => {}} isDisabled/><Button label="Перерахувати ціни" icon={<LockKeyhole size={14}/>} isDisabled tooltip="Перерахунок цін потребує підключення сервісу ціноутворення"/></Card><Card className={styles.toolbar} padding={3}><TextInput label="Пошук у каталозі запчастин" isLabelHidden value={state.partsQuery} onChange={(value) => {state.setPartsQuery(value); state.setPartsPage(1);}} placeholder="SKU або опис…" hasClear width="100%"/><Selector label="Фільтр статусу запчастини" value={state.partStatus} onChange={(value) => {state.setPartStatus(value as typeof state.partStatus); state.setPartsPage(1);}} options={["all", "active", "substituted", "obsolete"]}/><Selector label="Фільтр лінійки запчастини" value={state.partLine} onChange={(value) => {state.setPartLine(value as typeof state.partLine); state.setPartsPage(1);}} options={["all", "SKI", "Sea-Doo", "SSV", "Spyder"]}/></Card><Card padding={0}><header className={styles.tableMeta}><strong>{hasFilters ? rows.length : catalogPartsSourceTotal} результатів</strong><span>Показано {rows.length} репрезентативних записів.</span></header><div className={styles.tableScroller} role="region" aria-label="Таблиця каталогу запчастин" tabIndex={0}><table className={styles.table}><thead><tr><th>SKU</th><th>Опис</th><th>Тип</th><th>Дист. EUR</th><th>Дилер USD</th><th>Розд. USD</th><th>Статус</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} data-record-id={row.id}><td><strong className={styles.code}>{row.sku}</strong></td><td>{row.description}</td><td>{row.fullType}</td><td>{currency(row.distributorEur, "€")}</td><td>{currency(row.dealerUsd, "$")}</td><td>{currency(row.retailUsd, "$")}</td><td><Badge label={row.status} variant={tone(row.status)}/></td></tr>)}</tbody></table></div>{!rows.length ? <EmptyState isCompact title="Нічого не знайдено" description="Змініть пошук або фільтри."/> : null}{!hasFilters ? <div className={styles.pagination}><Pagination label="Пагінація каталогу запчастин" page={state.partsPage} totalPages={catalogPartsSourcePages} variant="compact" onChange={state.setPartsPage}/><span>Page {state.partsPage} of {catalogPartsSourcePages}</span></div> : null}</Card><Card padding={0}><Collapsible trigger={`Історія імпорту (${catalogImportHistory.length})`} isOpen={state.importHistoryOpen} onOpenChange={state.setImportHistoryOpen}><div className={styles.tableScroller} role="region" aria-label="Історія імпорту" tabIndex={0}><table className={styles.table}><thead><tr><th>Date</th><th>Mode</th><th>SKUs</th><th>Статус</th></tr></thead><tbody>{catalogImportHistory.map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.mode}</td><td>{row.skus ?? "—"}</td><td><Badge label={row.status} variant={tone(row.status)}/></td></tr>)}</tbody></table></div></Collapsible></Card></section>;
}

export default function AstryxAdminCatalogView(props: CatalogPageViewProps & AstryxRendererViewProps) {
  const {renderedDesignSystem} = useAppearance();
  const active = renderedDesignSystem === "astryx";
  useLayoutEffect(() => { const frame = window.requestAnimationFrame(props.onReady); return () => window.cancelAnimationFrame(frame); }, [props.onReady]);
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-catalog-renderer="astryx"><header className={styles.header}><h1>Керування каталогом</h1><p>Товари, ціни дистриб&apos;ютора та каталог запчастин.</p></header><div className={styles.sections}><TabList aria-label="Розділи каталогу" value={props.activeTab} onChange={(value) => props.setActiveTab(value as typeof props.activeTab)} layout="hug" hasDivider>{sections.map((section) => <Tab key={section.id} value={section.id} label={section.label}/>)}</TabList></div><div className={styles.mobileSections}><Selector label="Розділ каталогу" value={props.activeTab} onChange={(value) => props.setActiveTab(value as typeof props.activeTab)} options={sections.map((section) => ({value: section.id, label: section.label}))}/></div>{props.activeTab === "vehicles" ? <Vehicles state={props} active={active}/> : null}{props.activeTab === "distributor" ? <Distributor state={props}/> : null}{props.activeTab === "parts" ? <Parts state={props}/> : null}</main></AstryxBrpUiProvider>;
}
