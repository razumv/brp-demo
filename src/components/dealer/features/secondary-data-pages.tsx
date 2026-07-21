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
  FileSpreadsheet,
  FileText,
  Globe2,
  ListFilter,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { EmptyState, Modal, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import styles from "../dealer.module.css";
import { FeatureFrame } from "./feature-frame";

export function DocumentsPage() {
  const [query, setQuery] = useState("");
  return <FeatureFrame feature="documents"><section className={styles.statsGrid}><StatCard label="Документів" value="0" icon={<FileText size={18} />} /><StatCard label="Неоплачені" value="0" icon={<Clock3 size={18} />} tone="amber" /><StatCard label="Цього місяця" value="0" icon={<CalendarDays size={18} />} tone="blue" /><StatCard label="До сплати" value="$0.00" icon={<CircleDollarSign size={18} />} tone="orange" /></section><Panel><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер документа або замовлення..." /></div><select className="select"><option>Усі типи</option><option>Рахунок</option><option>Накладна</option></select><button type="button" className="button button-outline" disabled><Download size={14} /> Експорт</button></div><EmptyState icon={<FileText size={26} />} title="Документів поки немає" description="Рахунки й накладні з’являться після обробки замовлень." /></Panel></FeatureFrame>;
}

export function DraftsPage() {
  return <FeatureFrame feature="order-drafts" action={<button type="button" className="button button-primary"><Plus size={15} /> Нова чернетка</button>}><Panel><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder="Пошук чернетки..." /></div><button type="button" className="button button-outline"><RefreshCw size={14} /> Оновити</button><button type="button" className="button button-outline" disabled><FileSpreadsheet size={14} /> Excel</button></div><EmptyState icon={<FileClock size={26} />} title="Чернеток немає" description="Незавершені замовлення та імпортовані файли з’являться тут." /></Panel></FeatureFrame>;
}

export function ConsignmentPage() {
  const [tab, setTab] = useState("stock");
  const [requestOpen, setRequestOpen] = useState(false);
  return <FeatureFrame feature="consignment" action={<button type="button" className="button button-primary" onClick={() => setRequestOpen(true)}><Plus size={15} /> Створити запит</button>}><section className={styles.statsGrid}><StatCard label="На консигнації" value="0" icon={<PackageOpen size={18} />} /><StatCard label="У мережі" value="0" icon={<Globe2 size={18} />} tone="blue" /><StatCard label="Активні запити" value="0" icon={<FileClock size={18} />} tone="amber" /><StatCard label="Відвантажено" value="0" icon={<Truck size={18} />} tone="green" /></section><Panel><div className={styles.featureTabs}>{[{ id: "stock", label: "Мій залишок" }, { id: "network", label: "Мережа" }, { id: "requests", label: "Запити" }].map((item) => <button type="button" role="tab" aria-selected={tab === item.id} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder="Номер або опис запчастини..." /></div><button type="button" className="button button-outline"><ListFilter size={14} /> Фільтри</button></div><EmptyState icon={<PackageOpen size={26} />} title={tab === "requests" ? "Запитів поки немає" : "Запчастин не знайдено"} description="Дані консигнації з’являться після синхронізації з дистриб’ютором." /></Panel><Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Запит на консигнацію" description="Перегляд форми без зовнішнього відправлення"><div className={styles.modalForm}><label className="field"><span>Запчастина</span><div className="input-with-icon"><Search size={15} /><input placeholder="Пошук за номером..." /></div></label><label className="field"><span>Коментар</span><textarea placeholder="Обґрунтування запиту" /></label><div className={styles.requestSummary}><span>Позицій</span><strong>0</strong></div><div className={styles.formActions}><button type="button" className="button button-outline" onClick={() => setRequestOpen(false)}>Скасувати</button><button type="button" className="button button-primary" disabled>Надіслати запит</button></div></div></Modal></FeatureFrame>;
}

export function SettlementsPage() {
  const [period, setPeriod] = useState(30);
  return <FeatureFrame feature="settlements" action={<button type="button" className="button button-outline" disabled><FileSpreadsheet size={14} /> Excel</button>}><section className={styles.statsGrid}><StatCard label="Поточний баланс" value="$0.00" icon={<CircleDollarSign size={18} />} tone="green" /><StatCard label="Нараховано" value="$0.00" icon={<Download size={18} />} tone="blue" /><StatCard label="Сплачено" value="$0.00" icon={<Check size={18} />} tone="green" /><StatCard label="Прострочено" value="$0.00" icon={<AlertTriangle size={18} />} tone="amber" /></section><Panel><div className={styles.simpleToolbar}><div className="segmented">{[30, 60, 90, 180, 360].map((value) => <button type="button" aria-pressed={period === value} key={value} onClick={() => setPeriod(value)}>{value} днів</button>)}</div><button type="button" className="button button-outline"><RefreshCw size={14} /> Оновити баланс</button></div><EmptyState icon={<CircleDollarSign size={26} />} title={`Рухів за ${period} днів немає`} description="Нарахування та оплати будуть показані у хронологічному порядку." /></Panel></FeatureFrame>;
}

export function InventoryPage() {
  const [lowOnly, setLowOnly] = useState(false);
  return <FeatureFrame feature="parts-inventory"><section className={styles.statsGrid}><StatCard label="Позицій" value="0" icon={<Wrench size={18} />} /><StatCard label="В наявності" value="0" icon={<PackageCheck size={18} />} tone="green" /><StatCard label="Низький залишок" value="0" icon={<AlertTriangle size={18} />} tone="amber" /><StatCard label="Вартість" value="$0.00" icon={<CircleDollarSign size={18} />} tone="orange" /></section><Panel><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder="Номер або опис запчастини..." /></div><label className={styles.checkboxLabel}><input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} /> Тільки низький залишок</label></div><EmptyState icon={<Warehouse size={26} />} title="Локальний склад порожній" description={lowOnly ? "Немає позицій із низьким залишком." : "Завантажені залишки з’являться тут."} /></Panel></FeatureFrame>;
}

export function NetworkPage() {
  const [tab, setTab] = useState("parts");
  return <FeatureFrame feature="network"><Panel><div className={styles.featureTabs} role="tablist"><button type="button" role="tab" aria-selected={tab === "parts"} onClick={() => setTab("parts")}><Wrench size={14} /> Запчастини</button><button type="button" role="tab" aria-selected={tab === "units"} onClick={() => setTab("units")}><Box size={14} /> Техніка</button></div><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder={tab === "parts" ? "Номер запчастини..." : "Модель, VIN або SKU..."} /></div><select className="select"><option>Усі дилери</option><option>Logos</option></select></div><EmptyState icon={<Globe2 size={26} />} title={tab === "parts" ? "Запчастин у мережі не знайдено" : "Техніки у мережі не знайдено"} description="Спробуйте змінити запит або дилера." /></Panel></FeatureFrame>;
}

export function PartsReportPage() {
  const { state } = useDemoStore();
  const total = state.orders.reduce((sum, order) => sum + orderTotal(order.lines), 0);
  return <FeatureFrame feature="parts-report" action={<button type="button" className="button button-outline" disabled><FileSpreadsheet size={14} /> Excel</button>}><section className={styles.statsGrid}><StatCard label="Замовлень" value={state.orders.length} icon={<Package size={18} />} /><StatCard label="Позицій" value={state.orders.reduce((sum, order) => sum + order.lines.length, 0)} icon={<Boxes size={18} />} tone="blue" /><StatCard label="Сума" value={formatMoney(total)} icon={<CircleDollarSign size={18} />} tone="orange" /><StatCard label="Середній чек" value={formatMoney(state.orders.length ? total / state.orders.length : 0)} icon={<BarChart3 size={18} />} tone="green" /></section><Panel><div className={styles.simpleToolbar}><label className="field"><span>Період</span><select><option>Поточний місяць</option><option>30 днів</option><option>90 днів</option></select></label><label className="field"><span>Менеджер</span><select><option>Усі</option><option>Финансы</option></select></label></div>{state.orders.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Замовлення</th><th>Клієнт</th><th>Позицій</th><th>Статус</th><th>Сума</th></tr></thead><tbody>{state.orders.map((order) => <tr key={order.id}><td><Link className={styles.linkCode} href={dealerOrderHref(order.id)}>{order.code}</Link></td><td>{state.customers.find((customer) => customer.id === order.customerId)?.name || order.company}</td><td>{order.lines.length}</td><td><StatusBadge tone="neutral">Новий</StatusBadge></td><td><strong>{formatMoney(orderTotal(order.lines))}</strong></td></tr>)}</tbody></table></div> : <EmptyState title="Даних за період немає" description="Замовлення з’являться у звіті автоматично." />}</Panel></FeatureFrame>;
}

export function UnknownFeature({ feature }: { feature: string }) {
  return <FeatureFrame feature={feature}><Panel><EmptyState title="Розділ у підготовці" description="Для цього демонстраційного маршруту ще немає даних." /></Panel></FeatureFrame>;
}
