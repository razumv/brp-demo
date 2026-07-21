"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Box,
  Boxes,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  Download,
  FileClock,
  FileText,
  Globe2,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  Search,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { EmptyState, Modal, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { OrderStatusBadge, formatDate } from "@/components/dealer/common";
import { LockedOperation } from "@/components/dealer/locked-operation";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import {
  consignmentNetwork,
  consignmentRequests,
  consignmentStock,
  dealerDocuments,
  filterConsignmentRows,
  filterDocuments,
  filterInventoryRows,
  filterNetworkRows,
  filterPartsReportOrders,
  filterSettlementRows,
  networkParts,
  type DocumentStatus,
  type DocumentType,
  type ReportPeriod,
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

function LockedExport() {
  return <LockedOperation label="Експорт" icon={<Download size={14} />} reason="Експорт у зовнішній файл недоступний." />;
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
  const documents = useMemo(() => filterDocuments({ query, type, status }), [query, status, type]);
  const openAmount = sum(dealerDocuments.filter((document) => document.status !== "paid").map((document) => document.amount));

  return (
    <FeatureFrame feature="documents" action={<LockedExport />}>
      <section className={styles.statsGrid} aria-label="Показники документів">
        <StatCard label="Документів" value={dealerDocuments.length} icon={<FileText size={18} />} />
        <StatCard label="Неоплачені" value={dealerDocuments.filter((document) => document.status !== "paid").length} icon={<Clock3 size={18} />} tone="amber" />
        <StatCard label="Цього місяця" value={dealerDocuments.filter((document) => document.issuedAt.startsWith("2026-07")).length} icon={<CalendarDays size={18} />} tone="blue" />
        <StatCard label="До сплати" value={formatMoney(openAmount)} icon={<CircleDollarSign size={18} />} tone="orange" />
      </section>
      <Panel>
        <div className={styles.toolbar}>
          <label className={styles.searchField}><Search size={15} aria-hidden="true" /><span className="sr-only">Пошук документів</span><input aria-label="Пошук документів" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер документа або замовлення..." /></label>
          <label className={styles.selectField}><span>Тип</span><select aria-label="Тип документа" value={type} onChange={(event) => setType(event.target.value as "all" | DocumentType)}><option value="all">Усі типи</option><option value="invoice">Рахунок</option><option value="waybill">Накладна</option></select></label>
          <label className={styles.selectField}><span>Статус</span><select aria-label="Статус документа" value={status} onChange={(event) => setStatus(event.target.value as "all" | DocumentStatus)}><option value="all">Усі статуси</option><option value="paid">Сплачено</option><option value="open">Очікує оплату</option><option value="overdue">Прострочено</option></select></label>
        </div>
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
  const [availability, setAvailability] = useState<"all" | "in-stock" | "requested">("all");
  const [requestOpen, setRequestOpen] = useState(false);
  const rows = useMemo(() => filterConsignmentRows(tab, { query, availability }), [availability, query, tab]);

  return (
    <FeatureFrame feature="consignment" action={<button type="button" className="button button-primary" onClick={() => setRequestOpen(true)}><Plus size={15} /> Створити запит</button>}>
      <section className={styles.statsGrid} aria-label="Показники консигнації">
        <StatCard label="На консигнації" value={sum(consignmentStock.map((row) => row.quantity))} icon={<PackageOpen size={18} />} />
        <StatCard label="У мережі" value={sum(consignmentNetwork.map((row) => row.quantity))} icon={<Globe2 size={18} />} tone="blue" />
        <StatCard label="Активні запити" value={consignmentRequests.length} icon={<FileClock size={18} />} tone="amber" />
        <StatCard label="Відвантажено" value={consignmentStock.filter((row) => row.status === "reserved").length} icon={<Truck size={18} />} tone="green" />
      </section>
      <Panel>
        <div className={styles.tabs} role="tablist" aria-label="Розділи консигнації">{(["stock", "network", "requests"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{consignmentTabLabel(item)}</button>)}</div>
        <div className={styles.toolbar}>
          <label className={styles.searchField}><Search size={15} aria-hidden="true" /><span className="sr-only">Пошук консигнації</span><input aria-label="Пошук консигнації" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер або опис запчастини..." /></label>
          <label className={styles.selectField}><span>Наявність</span><select aria-label="Фільтр консигнації" value={availability} onChange={(event) => setAvailability(event.target.value as "all" | "in-stock" | "requested")}><option value="all">Усі позиції</option><option value="in-stock">Є в наявності</option><option value="requested">Запитані</option></select></label>
        </div>
        {rows.length ? <TableRegion label={consignmentTabLabel(tab)}><table className="data-table"><thead><tr><th>Запчастина</th><th>Дилер</th><th>Кількість</th><th>Стан</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.partNumber}</strong><small>{row.description}</small></td><td>{row.dealer}</td><td>{row.quantity}</td><td><StatusBadge tone={row.status === "available" ? "green" : row.status === "requested" ? "amber" : "blue"}>{row.status === "available" ? "Доступно" : row.status === "requested" ? "Запит" : "Резерв"}</StatusBadge></td></tr>)}</tbody></table></TableRegion> : <EmptyState title="Позицій не знайдено" description="Змініть запит або фільтр наявності." />}
      </Panel>
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Запит на консигнацію" description="Локальний перегляд форми без відправлення">
        <div className={styles.modalForm}><label className="field"><span>Запчастина</span><select defaultValue=""><option value="" disabled>Оберіть позицію</option>{consignmentStock.map((row) => <option key={row.id} value={row.partNumber}>{row.partNumber} — {row.description}</option>)}</select></label><label className="field"><span>Коментар</span><textarea placeholder="Обґрунтування запиту" /></label><div className={styles.formActions}><button type="button" className="button button-outline" onClick={() => setRequestOpen(false)}>Скасувати</button><LockedOperation label="Надіслати запит" reason="Відправлення запиту недоступне." className="button button-primary" /></div></div>
      </Modal>
    </FeatureFrame>
  );
}

export function SettlementsPage() {
  const [period, setPeriod] = useState(30);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => filterSettlementRows({ period, query }), [period, query]);
  const accrual = sum(rows.filter((row) => row.kind === "accrual").map((row) => row.amount));
  const paid = -sum(rows.filter((row) => row.kind === "payment").map((row) => row.amount));
  const overdue = sum(rows.filter((row) => row.status === "overdue").map((row) => row.amount));

  return (
    <FeatureFrame feature="settlements" action={<LockedExport />}>
      <section className={styles.statsGrid} aria-label="Показники взаєморозрахунків"><StatCard label="Поточний баланс" value={formatMoney(accrual - paid)} icon={<CircleDollarSign size={18} />} tone="green" /><StatCard label="Нараховано" value={formatMoney(accrual)} icon={<Download size={18} />} tone="blue" /><StatCard label="Сплачено" value={formatMoney(paid)} icon={<Check size={18} />} tone="green" /><StatCard label="Прострочено" value={formatMoney(overdue)} icon={<AlertTriangle size={18} />} tone="amber" /></section>
      <Panel>
        <div className={styles.toolbar}><div className={styles.tabs} aria-label="Період взаєморозрахунків">{[30, 60, 90, 180, 360].map((value) => <button type="button" aria-pressed={period === value} key={value} onClick={() => setPeriod(value)}>{value} днів</button>)}</div><label className={styles.searchField}><Search size={15} aria-hidden="true" /><span className="sr-only">Пошук взаєморозрахунків</span><input aria-label="Пошук взаєморозрахунків" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер документа..." /></label><LockedOperation label="Оновити баланс" icon={<Clock3 size={14} />} reason="Оновлення балансу недоступне." /></div>
        {rows.length ? <TableRegion label="Рух коштів"><table className="data-table"><thead><tr><th>Дата</th><th>Документ</th><th>Операція</th><th>Статус</th><th>Сума</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.date)}</td><td><strong>{row.code}</strong></td><td>{row.kind === "accrual" ? "Нарахування" : "Оплата"}</td><td><StatusBadge tone={row.status === "overdue" ? "red" : "green"}>{documentStatusLabel(row.status)}</StatusBadge></td><td className={row.amount < 0 ? styles.negativeAmount : undefined}><strong>{formatMoney(row.amount)}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState title={`Рухів за ${period} днів немає`} description="Змініть період або запит." />}
      </Panel>
    </FeatureFrame>
  );
}

export function InventoryPage() {
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const rows = useMemo(() => filterInventoryRows({ query, stock }), [query, stock]);
  const stockValue = sum(rows.map((row) => row.stock * row.dealerPrice));
  return (
    <FeatureFrame feature="parts-inventory">
      <section className={styles.statsGrid} aria-label="Показники складу"><StatCard label="Позицій" value={rows.length} icon={<Wrench size={18} />} /><StatCard label="В наявності" value={rows.filter((row) => row.stock > 0).length} icon={<PackageCheck size={18} />} tone="green" /><StatCard label="Низький залишок" value={rows.filter((row) => row.stock > 0 && row.stock <= row.reorderPoint).length} icon={<AlertTriangle size={18} />} tone="amber" /><StatCard label="Вартість" value={formatMoney(stockValue)} icon={<CircleDollarSign size={18} />} tone="orange" /></section>
      <Panel><div className={styles.toolbar}><label className={styles.searchField}><Search size={15} aria-hidden="true" /><span className="sr-only">Пошук складу</span><input aria-label="Пошук складу" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер або опис запчастини..." /></label><label className={styles.selectField}><span>Запас</span><select aria-label="Фільтр запасу" value={stock} onChange={(event) => setStock(event.target.value as StockFilter)}><option value="all">Усі позиції</option><option value="in-stock">В наявності</option><option value="low">Низький залишок</option><option value="out">Немає в наявності</option></select></label></div>{rows.length ? <TableRegion label="Локальний склад"><table className="data-table"><thead><tr><th>Запчастина</th><th>Залишок</th><th>Мінімум</th><th>Вартість</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.partNumber}</strong><small>{row.description}</small></td><td>{row.stock}</td><td>{row.reorderPoint}</td><td><strong>{formatMoney(row.stock * row.dealerPrice)}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState icon={<Warehouse size={26} />} title="Позицій не знайдено" description="Змініть запит або фільтр запасу." />}</Panel>
    </FeatureFrame>
  );
}

export function NetworkPage() {
  const [tab, setTab] = useState<"parts" | "units">("parts");
  const [query, setQuery] = useState("");
  const [dealer, setDealer] = useState("all");
  const rows = useMemo(() => filterNetworkRows(tab, { dealer, query }), [dealer, query, tab]);
  const dealers = [...new Set([...networkParts.map((row) => row.dealer), "Logos", "BRP Київ"])];
  return <FeatureFrame feature="network"><Panel><div className={styles.tabs} role="tablist" aria-label="Ресурси дилерської мережі"><button type="button" role="tab" aria-selected={tab === "parts"} onClick={() => setTab("parts")}><Wrench size={14} /> Запчастини</button><button type="button" role="tab" aria-selected={tab === "units"} onClick={() => setTab("units")}><Box size={14} /> Техніка</button></div><div className={styles.toolbar}><label className={styles.searchField}><Search size={15} aria-hidden="true" /><span className="sr-only">Пошук мережі</span><input aria-label="Пошук мережі" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "parts" ? "Номер запчастини..." : "Модель, VIN або SKU..."} /></label><label className={styles.selectField}><span>Дилер</span><select aria-label="Дилер мережі" value={dealer} onChange={(event) => setDealer(event.target.value)}><option value="all">Усі дилери</option>{dealers.map((name) => <option key={name} value={name}>{name}</option>)}</select></label></div>{rows.length ? <TableRegion label={tab === "parts" ? "Запчастини мережі" : "Техніка мережі"}>{tab === "parts" ? <table className="data-table"><thead><tr><th>Запчастина</th><th>Дилер</th><th>Кількість</th></tr></thead><tbody>{rows.map((row) => "partNumber" in row ? <tr key={row.id}><td><strong>{row.partNumber}</strong><small>{row.description}</small></td><td>{row.dealer}</td><td>{row.quantity}</td></tr> : null)}</tbody></table> : <table className="data-table"><thead><tr><th>Модель</th><th>VIN</th><th>Дилер</th><th>Рік</th></tr></thead><tbody>{rows.map((row) => "model" in row ? <tr key={row.id}><td><strong>{row.model}</strong></td><td>{row.vin}</td><td>{row.dealer}</td><td>{row.year}</td></tr> : null)}</tbody></table>}</TableRegion> : <EmptyState icon={<Globe2 size={26} />} title={tab === "parts" ? "Запчастин у мережі не знайдено" : "Техніки у мережі не знайдено"} description="Спробуйте змінити запит або дилера." />}</Panel></FeatureFrame>;
}

export function PartsReportPage() {
  const { snapshot } = useDealerWorkflow();
  const [period, setPeriod] = useState<ReportPeriod>("all");
  const [manager, setManager] = useState("all");
  const [status, setStatus] = useState<"all" | import("@/lib/types").OrderStatus>("all");
  const orders = useMemo(() => filterPartsReportOrders(snapshot.orders, { period, manager, status }), [manager, period, snapshot.orders, status]);
  const total = sum(orders.map((order) => orderTotal(order.lines)));
  const managers = [...new Set(snapshot.orders.map((order) => order.creator))];
  return <FeatureFrame feature="parts-report" action={<LockedExport />}><section className={styles.statsGrid} aria-label="Показники звіту запчастин"><StatCard label="Замовлень" value={orders.length} icon={<Package size={18} />} /><StatCard label="Позицій" value={sum(orders.map((order) => order.lines.length))} icon={<Boxes size={18} />} tone="blue" /><StatCard label="Сума" value={formatMoney(total)} icon={<CircleDollarSign size={18} />} tone="orange" /><StatCard label="Середній чек" value={formatMoney(orders.length ? total / orders.length : 0)} icon={<BarChart3 size={18} />} tone="green" /></section><Panel><div className={styles.filterGrid}><label className={styles.selectField}><span>Період</span><select aria-label="Період звіту" value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)}><option value="all">За весь час</option><option value="month">Поточний місяць</option><option value="30">30 днів</option><option value="90">90 днів</option></select></label><label className={styles.selectField}><span>Менеджер</span><select aria-label="Менеджер звіту" value={manager} onChange={(event) => setManager(event.target.value)}><option value="all">Усі</option>{managers.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label className={styles.selectField}><span>Статус</span><select aria-label="Статус замовлення" value={status} onChange={(event) => setStatus(event.target.value as "all" | import("@/lib/types").OrderStatus)}><option value="all">Усі статуси</option><option value="new">Новий</option><option value="waiting">Очікування</option><option value="supplier">У постачальника</option><option value="ready">Готово</option><option value="sent">Відправлено</option><option value="done">Виконано</option><option value="cancelled">Скасовано</option></select></label></div>{orders.length ? <TableRegion label="Замовлення у звіті запчастин"><table className="data-table"><thead><tr><th>Замовлення</th><th>Дата</th><th>Позицій</th><th>Статус</th><th>Сума</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link className={styles.linkCode} href={dealerOrderHref(order.id)}>{order.code}</Link><small>{order.creator}</small></td><td>{formatDate(order.createdAt)}</td><td>{order.lines.length}</td><td><OrderStatusBadge status={order.status} /></td><td><strong>{formatMoney(orderTotal(order.lines))}</strong></td></tr>)}</tbody></table></TableRegion> : <EmptyState title="Даних за період немає" description="Змініть період, менеджера або статус." />}</Panel></FeatureFrame>;
}

export function UnknownFeature({ feature }: { feature: string }) {
  return <FeatureFrame feature={feature}><Panel><EmptyState title="Розділ у підготовці" description="Для цього маршруту ще немає даних." /></Panel></FeatureFrame>;
}
