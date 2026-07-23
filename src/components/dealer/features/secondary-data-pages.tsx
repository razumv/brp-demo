"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Box,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Download,
  FileClock,
  FileText,
  Globe2,
  PackageCheck,
  PackageOpen,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { DealerDataToolbar } from "@/components/dealer/dealer-data-toolbar";
import { BrpSelect, BrpTabs } from "@/components/brp-ui";
import { EmptyState, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { formatDate } from "@/components/dealer/common";
import { formatMoney } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import {
  consignmentNetwork,
  consignmentRequests,
  consignmentStock,
  dealerSettlementReferenceDate,
  dealerDocuments,
  filterConsignmentRows,
  filterDocuments,
  filterInventoryRows,
  isDateInCurrentMonth,
  filterNetworkRows,
  filterSettlementRows,
  getNetworkDealers,
  projectDealerPartsReport,
  type ConsignmentStatusFilter,
  type DocumentStatus,
  type DocumentType,
  type StockFilter,
} from "@/lib/dealer/secondary-data";
import legacyStyles from "../dealer.module.css";
import secondaryStyles from "./secondary-data-pages.module.css";
import { FeatureFrame } from "./feature-frame";

const styles = { ...legacyStyles, ...secondaryStyles };

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function TableRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.tableRegion} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}

function documentStatusLabel(status: DocumentStatus) {
  return ({ paid: "Сплачено", open: "Очікує оплату", overdue: "Прострочено" } as const)[status];
}

function documentTone(status: DocumentStatus) {
  return ({ paid: "green", open: "amber", overdue: "red" } as const)[status];
}

export function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | DocumentType>("all");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const documents = useMemo(() => filterDocuments({ query, type, status }), [query, status, type]);
  const openAmount = sum(dealerDocuments.filter((document) => document.status !== "paid").map((document) => document.amount));

  return (
    <FeatureFrame feature="documents">
      <section className={styles.statsGrid} aria-label="Показники документів">
        <StatCard label="Документів" value={dealerDocuments.length} icon={<FileText size={18} />} />
        <StatCard label="Неоплачені" value={dealerDocuments.filter((document) => document.status !== "paid").length} icon={<Clock3 size={18} />} tone="amber" />
        <StatCard label="Цього місяця" value={dealerDocuments.filter((document) => isDateInCurrentMonth(document.issuedAt)).length} icon={<CalendarDays size={18} />} tone="blue" />
        <StatCard label="До сплати" value={formatMoney(openAmount)} icon={<CircleDollarSign size={18} />} tone="orange" />
      </section>
      <Panel>
        <DealerDataToolbar search={{ value: query, onValueChange: setQuery, label: "Пошук документів", placeholder: "Номер документа або замовлення..." }} filters={{ label: "Фільтри", activeCount: Number(type !== "all") + Number(status !== "all"), open: filtersOpen, onOpenChange: setFiltersOpen, panelId: "documents-filters", onClear: () => { setType("all"); setStatus("all"); }, content: <><BrpSelect label="Тип документа" value={type} onValueChange={(value) => setType(value as "all" | DocumentType)} options={[{ value: "all", label: "Усі типи" }, { value: "invoice", label: "Рахунок" }, { value: "waybill", label: "Накладна" }]} /><BrpSelect label="Статус документа" value={status} onValueChange={(value) => setStatus(value as "all" | DocumentStatus)} options={[{ value: "all", label: "Усі статуси" }, { value: "paid", label: "Сплачено" }, { value: "open", label: "Очікує оплату" }, { value: "overdue", label: "Прострочено" }]} /></> }} />
        {documents.length ? <TableRegion label="Документи"><table className="data-table"><thead><tr><th>Документ</th><th>Замовлення</th><th>Дата</th><th>Статус</th><th>Сума</th></tr></thead><tbody>{documents.map((document) => <tr key={document.id}><td><strong>{document.code}</strong><small>{document.type === "invoice" ? "Рахунок" : "Накладна"}</small></td><td>{document.orderCode}</td><td>{formatDate(document.issuedAt)}</td><td><StatusBadge tone={documentTone(document.status)}>{documentStatusLabel(document.status)}</StatusBadge></td><td><strong>{formatMoney(document.amount)}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState title="Документів не знайдено" description="Змініть запит або фільтри." />}
      </Panel>
    </FeatureFrame>
  );
}

type ConsignmentTab = "stock" | "network" | "requests";

function consignmentTabLabel(tab: ConsignmentTab) {
  return ({ stock: "Мій залишок", network: "Мережа", requests: "Запити" } as const)[tab];
}

export function ConsignmentPage() {
  const [tab, setTab] = useState<ConsignmentTab>("stock");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ConsignmentStatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rows = useMemo(() => filterConsignmentRows(tab, { query, status }), [query, status, tab]);

  return (
    <FeatureFrame feature="consignment">
      <section className={styles.statsGrid} aria-label="Показники консигнації">
        <StatCard label="На консигнації" value={sum(consignmentStock.map((row) => row.quantity))} icon={<PackageOpen size={18} />} />
        <StatCard label="У мережі" value={sum(consignmentNetwork.map((row) => row.quantity))} icon={<Globe2 size={18} />} tone="blue" />
        <StatCard label="Активні запити" value={consignmentRequests.length} icon={<FileClock size={18} />} tone="amber" />
        <StatCard label="Відвантажено" value={consignmentStock.filter((row) => row.status === "reserved").length} icon={<Truck size={18} />} tone="green" />
      </section>
      <Panel>
        <div className={styles.tabs}><BrpTabs label="Розділи консигнації" value={tab} onValueChange={(value) => setTab(value as ConsignmentTab)} options={(["stock", "network", "requests"] as const).map((item) => ({ value: item, label: consignmentTabLabel(item) }))} fill /></div>
        <DealerDataToolbar search={{ value: query, onValueChange: setQuery, label: "Пошук консигнації", placeholder: "Номер, опис або дилер..." }} filters={{ label: "Фільтри", activeCount: Number(status !== "all"), open: filtersOpen, onOpenChange: setFiltersOpen, panelId: "consignment-filters", onClear: () => setStatus("all"), content: <BrpSelect label="Фільтр консигнації" value={status} onValueChange={(value) => setStatus(value as ConsignmentStatusFilter)} options={[{ value: "all", label: "Усі стани" }, { value: "available", label: "Доступно" }, { value: "reserved", label: "Резерв" }, { value: "requested", label: "Запит" }]} /> }} />
        {rows.length ? <TableRegion label={consignmentTabLabel(tab)}><table className="data-table"><thead><tr><th>Запчастина</th><th>Дилер</th><th>Кількість</th><th>Стан</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.partNumber}</strong><small>{row.description}</small></td><td>{row.dealer}</td><td>{row.quantity}</td><td><StatusBadge tone={row.status === "available" ? "green" : row.status === "requested" ? "amber" : "blue"}>{row.status === "available" ? "Доступно" : row.status === "requested" ? "Запит" : "Резерв"}</StatusBadge></td></tr>)}</tbody></table></TableRegion> : <EmptyState title="Позицій не знайдено" description="Змініть запит або фільтр стану." />}
      </Panel>
    </FeatureFrame>
  );
}

export function SettlementsPage() {
  const [period, setPeriod] = useState(30);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rows = useMemo(() => filterSettlementRows({ period, query }, dealerSettlementReferenceDate), [period, query]);
  const accrual = sum(rows.filter((row) => row.kind === "accrual").map((row) => row.amount));
  const paid = -sum(rows.filter((row) => row.kind === "payment").map((row) => row.amount));
  const overdue = sum(rows.filter((row) => row.status === "overdue").map((row) => row.amount));

  return (
    <FeatureFrame feature="settlements">
      <section className={styles.statsGrid} aria-label="Показники взаєморозрахунків"><StatCard label="Поточний баланс" value={formatMoney(accrual - paid)} icon={<CircleDollarSign size={18} />} tone="green" /><StatCard label="Нараховано" value={formatMoney(accrual)} icon={<Download size={18} />} tone="blue" /><StatCard label="Сплачено" value={formatMoney(paid)} icon={<Check size={18} />} tone="green" /><StatCard label="Прострочено" value={formatMoney(overdue)} icon={<AlertTriangle size={18} />} tone="amber" /></section>
      <Panel>
        <DealerDataToolbar search={{ value: query, onValueChange: setQuery, label: "Пошук взаєморозрахунків", placeholder: "Номер документа..." }} filters={{ label: "Фільтри", activeCount: Number(period !== 30), open: filtersOpen, onOpenChange: setFiltersOpen, panelId: "settlements-filters", onClear: () => setPeriod(30), content: <BrpSelect label="Період взаєморозрахунків" value={String(period)} onValueChange={(value) => setPeriod(Number(value))} options={[30, 60, 90, 180, 360].map((value) => ({ value: String(value), label: `${value} днів` }))} /> }} />
        {rows.length ? <TableRegion label="Рух коштів"><table className="data-table"><thead><tr><th>Дата</th><th>Документ</th><th>Операція</th><th>Статус</th><th>Сума</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.date)}</td><td><strong>{row.code}</strong></td><td>{row.kind === "accrual" ? "Нарахування" : "Оплата"}</td><td><StatusBadge tone={row.status === "overdue" ? "red" : "green"}>{documentStatusLabel(row.status)}</StatusBadge></td><td className={row.amount < 0 ? styles.negativeAmount : undefined}><strong>{formatMoney(row.amount)}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState title={`Рухів за ${period} днів немає`} description="Змініть період або запит." />}
      </Panel>
    </FeatureFrame>
  );
}

export function InventoryPage() {
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rows = useMemo(() => filterInventoryRows({ query, stock }), [query, stock]);
  const stockValue = sum(rows.map((row) => row.stock * row.dealerPrice));
  return (
    <FeatureFrame feature="parts-inventory">
      <section className={styles.statsGrid} aria-label="Показники складу"><StatCard label="Позицій" value={rows.length} icon={<Wrench size={18} />} /><StatCard label="В наявності" value={rows.filter((row) => row.stock > 0).length} icon={<PackageCheck size={18} />} tone="green" /><StatCard label="Низький залишок" value={rows.filter((row) => row.stock > 0 && row.stock <= row.reorderPoint).length} icon={<AlertTriangle size={18} />} tone="amber" /><StatCard label="Вартість" value={formatMoney(stockValue)} icon={<CircleDollarSign size={18} />} tone="orange" /></section>
      <Panel><DealerDataToolbar search={{ value: query, onValueChange: setQuery, label: "Пошук складу", placeholder: "Номер або опис запчастини..." }} filters={{ label: "Фільтри", activeCount: Number(stock !== "all"), open: filtersOpen, onOpenChange: setFiltersOpen, panelId: "inventory-filters", onClear: () => setStock("all"), content: <BrpSelect label="Фільтр запасу" value={stock} onValueChange={(value) => setStock(value as StockFilter)} options={[{ value: "all", label: "Усі позиції" }, { value: "in-stock", label: "В наявності" }, { value: "low", label: "Низький залишок" }, { value: "out", label: "Немає в наявності" }]} /> }} />{rows.length ? <TableRegion label="Склад дилера"><table className="data-table"><thead><tr><th>Запчастина</th><th>Залишок</th><th>Мінімум</th><th>Вартість</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.partNumber}</strong><small>{row.description}</small></td><td>{row.stock}</td><td>{row.reorderPoint}</td><td><strong>{formatMoney(row.stock * row.dealerPrice)}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState icon={<Warehouse size={26} />} title="Позицій не знайдено" description="Змініть запит або фільтр запасу." />}</Panel>
    </FeatureFrame>
  );
}

export function NetworkPage() {
  const [tab, setTab] = useState<"parts" | "units">("parts");
  const [query, setQuery] = useState("");
  const [dealer, setDealer] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rows = useMemo(() => filterNetworkRows(tab, { dealer, query }), [dealer, query, tab]);
  const dealers = getNetworkDealers(tab);
  const changeTab = (nextTab: "parts" | "units") => { setTab(nextTab); setDealer("all"); };
  return <FeatureFrame feature="network"><Panel><div className={styles.tabs}><BrpTabs label="Ресурси дилерської мережі" value={tab} onValueChange={(value) => changeTab(value as "parts" | "units")} options={[{ value: "parts", label: "Запчастини", icon: <Wrench size={14} /> }, { value: "units", label: "Техніка", icon: <Box size={14} /> }]} fill /></div><DealerDataToolbar search={{ value: query, onValueChange: setQuery, label: "Пошук мережі", placeholder: tab === "parts" ? "Номер або опис запчастини..." : "Модель або VIN..." }} filters={{ label: "Фільтри", activeCount: Number(dealer !== "all"), open: filtersOpen, onOpenChange: setFiltersOpen, panelId: "network-filters", onClear: () => setDealer("all"), content: <BrpSelect label="Дилер мережі" value={dealer} onValueChange={setDealer} options={[{ value: "all", label: "Усі дилери" }, ...dealers.map((name) => ({ value: name, label: name }))]} /> }} />{rows.length ? <TableRegion label={tab === "parts" ? "Запчастини мережі" : "Техніка мережі"}>{tab === "parts" ? <table className="data-table"><thead><tr><th>Запчастина</th><th>Дилер</th><th>Кількість</th></tr></thead><tbody>{rows.map((row) => "partNumber" in row ? <tr key={row.id}><td><strong>{row.partNumber}</strong><small>{row.description}</small></td><td>{row.dealer}</td><td>{row.quantity}</td></tr> : null)}</tbody></table> : <table className="data-table"><thead><tr><th>Модель</th><th>VIN</th><th>Дилер</th><th>Рік</th></tr></thead><tbody>{rows.map((row) => "model" in row ? <tr key={row.id}><td><strong>{row.model}</strong></td><td>{row.vin}</td><td>{row.dealer}</td><td>{row.year}</td></tr> : null)}</tbody></table>}</TableRegion> : <EmptyState icon={<Globe2 size={26} />} title={tab === "parts" ? "Запчастин у мережі не знайдено" : "Техніки у мережі не знайдено"} description="Спробуйте змінити запит або дилера." />}</Panel></FeatureFrame>;
}

export function PartsReportPage() {
  const { snapshot } = useDealerWorkflow();
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rows = useMemo(() => projectDealerPartsReport(snapshot.orders, { query, from, to }), [from, query, snapshot.orders, to]);
  return <FeatureFrame feature="parts-report"><Panel><DealerDataToolbar search={{ value: query, onValueChange: setQuery, label: "Пошук звіту запчастин", placeholder: "Номер замовлення..." }} filters={{ label: "Фільтри", activeCount: Number(Boolean(from)) + Number(Boolean(to)), open: filtersOpen, onOpenChange: setFiltersOpen, panelId: "parts-report-filters", onClear: () => { setFrom(""); setTo(""); }, content: <><label className={styles.selectField}><span>Дата від</span><input aria-label="Дата звіту від" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label><label className={styles.selectField}><span>Дата до</span><input aria-label="Дата звіту до" type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label></> }} />{rows.length ? <TableRegion label="Замовлення у звіті запчастин"><table className="data-table"><thead><tr><th>Замовлення</th><th>Дата</th><th>Позицій</th><th>Сума</th></tr></thead><tbody>{rows.map((row) => <tr key={row.orderId}><td><Link className={styles.linkCode} href={dealerOrderHref(row.orderId)}>{row.orderCode}</Link></td><td>{formatDate(row.createdAt)}</td><td>{row.itemCount}</td><td><strong>{formatMoney(row.total.amount)}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState title="Замовлень не знайдено" description="Змініть запит або діапазон дат." />}</Panel></FeatureFrame>;
}

export function UnknownFeature({ feature }: { feature: string }) {
  return <FeatureFrame feature={feature}><Panel><EmptyState title="Розділ у підготовці" description="Для цього маршруту ще немає даних." /></Panel></FeatureFrame>;
}
