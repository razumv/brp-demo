"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Box,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileClock,
  FileSpreadsheet,
  FileText,
  Globe2,
  Image as ImageIcon,
  ListFilter,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import { Fragment, useState, type FormEvent, type ReactNode } from "react";
import { EmptyState, InlineNotice, Modal, PageHeader, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { formatMoney, getPart, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import type { WorkshopOrderInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./common";
import styles from "./dealer.module.css";

type FeatureDefinition = {
  title: string;
  description: string;
  icon: typeof Box;
};

const featureDefinitions: Record<string, FeatureDefinition> = {
  accessories: { title: "Каталог аксесуарів", description: "Оригінальні аксесуари BRP за сімейством і моделлю.", icon: BookOpen },
  documents: { title: "Документи", description: "Рахунки, накладні та документи до замовлень.", icon: FileText },
  "order-drafts": { title: "Чернетки", description: "Незавершені замовлення, збережені для подальшої роботи.", icon: FileClock },
  consignment: { title: "Консигнація", description: "Залишки, мережа та запити на відвантаження.", icon: PackageOpen },
  settlements: { title: "Взаєморозрахунки", description: "Баланс та історія руху коштів з дистриб’ютором.", icon: CircleDollarSign },
  "parts-inventory": { title: "Запчастини", description: "Поточні локальні залишки та контроль дефіциту.", icon: Wrench },
  units: { title: "Техніка", description: "Вхідні контейнери, склад і продана техніка.", icon: Box },
  network: { title: "Дилерська мережа", description: "Доступні запчастини й техніка в дилерській мережі.", icon: Globe2 },
  workshop: { title: "Майстерня", description: "Локальна дошка сервісних робіт та планування.", icon: Wrench },
  "parts-report": { title: "Звіт ЗЧ", description: "Аналітика замовлень запчастин за обраний період.", icon: BarChart3 },
  bossweb: { title: "Пошук запчастин", description: "Перевіряйте наявність BRP, заміни, ETA і локальний склад перед створенням замовлення.", icon: Search },
  schedule: { title: "Графік поставки", description: "Майбутні поставки техніки, слоти та вільні залишки.", icon: CalendarDays },
};

function FeatureFrame({ feature, action, children }: { feature: string; action?: ReactNode; children: ReactNode }) {
  const definition = featureDefinitions[feature] || { title: "Розділ", description: "Дилерський робочий розділ.", icon: Box };
  const Icon = definition.icon;
  return (
    <main className="page page-narrow">
      <PageHeader icon={<Icon size={21} />} title={definition.title} description={definition.description} action={action} />
      {children}
    </main>
  );
}

const accessoryFamilies = [
  { label: "Can-Am Off-Road", count: 1556, photos: 1431, tone: "orange" as const },
  { label: "Can-Am On-Road", count: 385, photos: 354, tone: "blue" as const },
  { label: "Sea-Doo", count: 393, photos: 385, tone: "green" as const },
];

const accessoryProducts = [
  { id: "advex", title: "Advex Helmet LED Utility Light", sku: "929085", current: "9290850090", price: 92.59, stock: 1, family: "Can-Am Off-Road" },
  { id: "linq", title: "LinQ Adventure Tunnel Bag", sku: "860202447", current: "860202447", price: 179.99, stock: 8, family: "Ski-Doo" },
  { id: "coolant", title: "XPS Extended Life Coolant", sku: "9779150", current: "9779150", price: 13.09, stock: 240, family: "Can-Am Off-Road" },
  { id: "holder", title: "LinQ Tool Holder", sku: "715007358", current: "715007358", price: 45.65, stock: 4, family: "Can-Am Off-Road" },
  { id: "cover", title: "Sea-Doo Storage Bin Organizer", sku: "295100835", current: "295100835", price: 79.99, stock: 2, family: "Sea-Doo" },
  { id: "rack", title: "LinQ Rear Cargo Rack", sku: "715001734", current: "715001734", price: 218.5, stock: 0, family: "Can-Am Off-Road" },
];

function AccessoriesPage() {
  const { addToCart } = useDemoStore();
  const [family, setFamily] = useState("Усі категорії");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const selected = accessoryProducts.find((product) => product.id === selectedId);
  const products = accessoryProducts.filter((product) => {
    const matchesFamily = family === "Усі категорії" || product.family === family;
    const normalized = query.trim().toLowerCase();
    return matchesFamily && (!normalized || `${product.title} ${product.sku}`.toLowerCase().includes(normalized));
  });

  const addRepresentativePart = () => {
    addToCart("9779150", 1);
    setAdded(true);
  };

  return (
    <FeatureFrame feature="accessories">
      <section className={styles.familyGrid}>
        {accessoryFamilies.map((item) => <Panel className={styles.familyCard} key={item.label}><span className={cn(styles.familyIcon, styles[`familyIcon${item.tone[0].toUpperCase()}${item.tone.slice(1)}`])}><ImageIcon size={19} /></span><div><strong>{item.label}</strong><small>{item.count} товарів · {item.photos} фото</small></div><ChevronRight size={16} /></Panel>)}
      </section>
      <div className={styles.accessoryLayout}>
        <Panel className={styles.filterRail}>
          <SectionHeading title="Фільтри" action={<SlidersHorizontal size={16} />} />
          <label className="field"><span>Категорія</span><select value={family} onChange={(event) => setFamily(event.target.value)}>{["Усі категорії", ...accessoryFamilies.map((item) => item.label)].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Рік</span><select defaultValue="2026"><option>2026</option><option>2025</option><option>2024</option></select></label>
          <details><summary>Сумісність <span>9</span></summary><label><input type="checkbox" /> Outlander</label><label><input type="checkbox" /> Defender</label><label><input type="checkbox" /> Maverick</label></details>
          <details><summary>Призначення <span>4</span></summary><label><input type="checkbox" /> Utility</label><label><input type="checkbox" /> Touring</label></details>
        </Panel>
        <div>
          <div className={styles.productToolbar}><div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Назва або артикул..." /></div><select className="select" defaultValue="featured"><option value="featured">Рекомендовані</option><option value="price">За ціною</option></select></div>
          <div className={styles.productGrid}>
            {products.map((product, index) => (
              <button type="button" className={styles.productCard} key={product.id} onClick={() => { setSelectedId(product.id); setAdded(false); }}>
                <span className={styles.productBadge}>{product.stock ? "Готово до замовлення" : "Під замовлення"}</span>
                <div className={cn(styles.productVisual, styles[`productVisual${(index % 3) + 1}`])}><Sparkles size={38} /></div>
                <div><small>{product.family}</small><h3>{product.title}</h3><p>{product.sku}</p><footer><strong>{formatMoney(product.price)}</strong><span>Детальніше <ChevronRight size={13} /></span></footer></div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.title || "Аксесуар"} description={selected ? `${selected.family} · ${selected.sku}` : undefined} className={styles.accessoryModal}>
        {selected ? <div className={styles.accessoryDetail}>
          <div className={styles.accessoryHero}><Sparkles size={58} /><span>BRP Genuine Accessories</span></div>
          <div>
            <div className={styles.chipRow}><StatusBadge tone="orange">{selected.family}</StatusBadge><StatusBadge tone="neutral">Accessories</StatusBadge><StatusBadge tone="green">Готово до замовлення</StatusBadge></div>
            <p>Оригінальний аксесуар BRP, створений для точної сумісності, надійної роботи та швидкого встановлення.</p>
            <div className={styles.accessorySku}><span><strong>{selected.sku}</strong><small>Актуальний артикул: {selected.current}</small><small>{selected.stock} в наявності</small></span><span><strong>{formatMoney(selected.price)}</strong><small>Готово до замовлення</small></span></div>
            <button type="button" className="button button-primary button-wide" onClick={addRepresentativePart}>{added ? <><Check size={15} /> Додано тестову позицію</> : <><ShoppingCart size={15} /> Додати в кошик</>}</button>
            <p className={styles.accessoryHint}>У локальному кошику використовується доступна тестова позиція 9779150.</p>
          </div>
        </div> : null}
      </Modal>
    </FeatureFrame>
  );
}

const unitRows = [
  { container: "HAMU4124410", bl: "260101582", units: "1/4", eta: "May 11", wait: 0 },
  { container: "FANU1099065", bl: "262101511", units: "1/10", eta: "May 25", wait: 0 },
  { container: "CAAU9339653", bl: "262102090", units: "1/10", eta: "May 25", wait: 0 },
  { container: "FANU1882023", bl: "262102090", units: "1/6", eta: "May 25", wait: 0 },
  { container: "FFAU6292730", bl: "262101576", units: "2/12", eta: "May 25", wait: 2 },
];

const unitModels = [
  ["RD SPYDER F3 LTD 1330 SE6 RD S", "H7TD"],
  ["RD CANYON REDR 1330 SE6 GN EU", "J3TB"],
  ["RD SPYDER RT LTD 1330 SE6 BK D", "G1TC"],
  ["RD SPYDER F3 LTD 1330 SE6 WH E", "H9TC"],
];

function UnitsPage() {
  const [tab, setTab] = useState("incoming");
  const [expanded, setExpanded] = useState("HAMU4124410");
  const [query, setQuery] = useState("");
  const rows = unitRows.filter((row) => `${row.container} ${row.bl}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <FeatureFrame feature="units">
      <div className={styles.featureTabs} role="tablist">
        {[{ id: "summary", label: "Зведення", icon: BarChart3 }, { id: "incoming", label: "Вхідні", icon: Download }, { id: "stock", label: "Мій склад", icon: Warehouse }, { id: "sold", label: "Продані", icon: ShoppingCart }].map(({ id, label, icon: Icon }) => <button type="button" key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}><Icon size={15} /> {label}</button>)}
      </div>
      <section className={styles.statsGrid}>
        <StatCard label="Готово прийняти" value="0" helper="VIN + двигун отримані" icon={<Check size={18} />} tone="green" />
        <StatCard label="Очікує РН" value="13" helper="Немає VIN або двигуна" icon={<Clock3 size={18} />} tone="amber" />
        <StatCard label="Прийнято" value="0" helper="Уже на складі" icon={<Warehouse size={18} />} tone="green" />
        <StatCard label="Мої одиниці" value="13" helper="15 контейнерів" icon={<Box size={18} />} tone="blue" />
      </section>
      {tab === "incoming" ? <Panel className={styles.unitsPanel}>
        <div className={styles.unitsToolbar}><div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук контейнера, BL, моделі, VIN..." /></div><span>15 відправок · 13 одиниць</span></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th /><th>Контейнер</th><th>Номер BL</th><th>Одиниці</th><th>ETA</th><th>Маршрут</th><th>Статус</th><th>Дія</th></tr></thead><tbody>
          {rows.map((row) => <Fragment key={row.container}>
            <tr className={styles.clickableRow} onClick={() => setExpanded(expanded === row.container ? "" : row.container)}><td><ChevronDown size={15} className={expanded === row.container ? styles.chevronOpen : undefined} /></td><td><strong className={styles.mono}>{row.container}</strong></td><td className={styles.mono}>{row.bl}</td><td><strong>{row.units}</strong></td><td>{row.eta}</td><td>—</td><td><StatusBadge tone="blue">● В дорозі</StatusBadge></td><td><StatusBadge tone={row.wait ? "amber" : "blue"}>{row.wait ? `${row.wait} чекає РН` : "● Вільний склад"}</StatusBadge></td></tr>
            {expanded === row.container ? <tr><td colSpan={8} className={styles.expandedCell}><p>Проформа: <strong className={styles.mono}>1032132118</strong></p><table className={styles.nestedTable}><thead><tr><th>#</th><th>Модель</th><th>Артикул</th><th>Рік</th><th>VIN</th><th>Статус</th></tr></thead><tbody>{unitModels.map(([model, sku], index) => <tr key={model}><td>{index + 1}</td><td>{model}</td><td className={styles.mono}>{sku}</td><td>2026</td><td>—</td><td><StatusBadge tone="blue">● Вільний склад</StatusBadge></td></tr>)}</tbody></table></td></tr> : null}
          </Fragment>)}
        </tbody></table></div>
      </Panel> : <Panel><EmptyState title={tab === "stock" ? "Склад поки порожній" : tab === "sold" ? "Продажів поки немає" : "Оберіть вкладку «Вхідні»"} description="Демонстраційні контейнери доступні у вкладці вхідних поставок." /></Panel>}
    </FeatureFrame>
  );
}

const scheduleSlots = [
  { category: "PWC", title: "PWC март 2026 #1", arrive: "12.06.2026", pay: "20.02.2026", status: "Прибуло", available: "0/24" },
  { category: "ATV", title: "февраль 2026 #1", arrive: "03.06.2026", pay: "20.02.2026", status: "Прибуло", available: "1/33" },
  { category: "PWC", title: "март 2026 #2", arrive: "05.06.2026", pay: "20.02.2026", status: "Прибуло", available: "0/36" },
  { category: "ATV", title: "февраль 2026 #2", arrive: "05.06.2026", pay: "20.02.2026", status: "Прибуло", available: "0/16" },
  { category: "SSV", title: "март 2026", arrive: "03.06.2026", pay: "20.03.2026", status: "Прибуло", available: "0/2" },
];

const scheduleModels: Array<[string, string, number]> = [
  ["23TB", "RXP X 325 - Gulfstream Blue Premium", 5],
  ["22TF", "RXT X 325 - Ice Metal / Manta Green", 2],
  ["25TB", "GTX PRO 130 (Rental) - White / Neo Mint", 1],
  ["26TR", "GTX Limited 325 - Teal Metallic", 2],
  ["13TB", "Wake PRO 230 - Sand / Dazzling Blue", 1],
];

function ScheduleSlotContent({ slot }: { slot: (typeof scheduleSlots)[number] }) {
  return <><div className={styles.slotDates}><span><CalendarDays size={15} /> Прибуття: <strong>{slot.arrive}</strong></span><span><CircleDollarSign size={15} /> Оплата: <strong>{slot.pay}</strong></span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>SKU</th><th>Модель</th><th>Усього</th><th>Вільно</th></tr></thead><tbody>{scheduleModels.map(([sku, model, total]) => <tr key={sku}><td className={styles.mono}>{sku}</td><td>{model}</td><td>{total}</td><td>0</td></tr>)}</tbody></table></div></>;
}

function SchedulePage() {
  const [category, setCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const filtered = scheduleSlots.filter((slot) => category === "all" || slot.category === category);
  const selected = selectedIndex === null ? undefined : filtered[selectedIndex];
  return (
    <FeatureFrame feature="schedule">
      <InlineNotice tone="warning"><strong>20 поставок</strong> з простроченою оплатою — PWC март 2026, ATV февраль 2026.</InlineNotice>
      <section className={styles.scheduleStats}><StatCard label="Прибуває у липні" value="0" icon={<Truck size={18} />} tone="blue" /><StatCard label="Доступно до замовлення" value="14" icon={<PackageCheck size={18} />} tone="green" /><StatCard label="Одиниць на складі" value="33" icon={<Warehouse size={18} />} tone="orange" /></section>
      <Panel className={styles.timelineOverview}><SectionHeading title="Хронологія прибуття" /><div className={styles.timelineTrack}><span /><i /><i /><i /><i /></div><div className={styles.months}>{["JAN ’26", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP"].map((month) => <span key={month}>{month}</span>)}</div></Panel>
      <div className={styles.scheduleTabs}><button type="button" className={styles.activeTextTab}>Майбутні поставки</button><button type="button">Вільні запаси</button></div>
      <div className={styles.scheduleFilters}><div className="segmented">{[{ id: "all", label: "Усі категорії" }, { id: "PWC", label: "Sea-Doo" }, { id: "ATV", label: "ATV" }, { id: "SSV", label: "SSV" }].map((item) => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setSelectedIndex(0); }}>{item.label}</button>)}</div><div className="toolbar-search"><Search size={15} /><input placeholder="Пошук SKU або моделі..." /></div></div>
      <section className={styles.scheduleColumns}>
        <Panel className={styles.slotList}><SectionHeading title={`Слоти доставки (${filtered.length ? 23 : 0})`} />{filtered.map((slot, index) => <button type="button" className={cn(styles.slotRow, selectedIndex === index && styles.slotRowActive)} onClick={() => { setSelectedIndex(index); setDetailsOpen(true); }} key={slot.title}><StatusBadge tone="neutral">{slot.category}</StatusBadge><span><strong>{slot.title}</strong><small>{slot.arrive} · <em>Оплата до: {slot.pay}</em></small></span><span><i className="dot dot-green" /> {slot.status}<small>{slot.available}</small></span></button>)}</Panel>
        <Panel className={styles.slotDetail}>{selected ? <><SectionHeading title={selected.title} action={<StatusBadge tone="neutral">{selected.category}</StatusBadge>} /><ScheduleSlotContent slot={selected} /></> : <EmptyState title="Оберіть слот" description="Детальна інформація з’явиться тут." />}</Panel>
      </section>
      <Modal open={detailsOpen && Boolean(selected)} onClose={() => setDetailsOpen(false)} title={selected?.title || "Слот доставки"} description="Деталі доступності у вибраній поставці">
        {selected ? <ScheduleSlotContent slot={selected} /> : null}
      </Modal>
    </FeatureFrame>
  );
}

function BossWebPage() {
  const [input, setInput] = useState("9779150");
  const [query, setQuery] = useState("9779150");
  const part = query === "9779150" ? getPart("9779150") : undefined;
  return (
    <FeatureFrame feature="bossweb">
      <form className={styles.bossSearch} onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()); }}><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Номер запчастини" placeholder="Введіть номер запчастини" /><button className="button button-primary" type="submit"><Search size={16} /> Пошук</button></form>
      {part ? <section className={styles.bossGrid}>
        <Panel><SectionHeading title="Наявність BossWeb" action={<RefreshCw size={15} />} /><div className={styles.bossContent}><div><StatusBadge tone="amber"><Clock3 size={11} /> Бекордер</StatusBadge><small>ATV</small></div><strong className={styles.mono}>{part.number}</strong><p>{part.description}</p><InlineNotice tone="warning">Contact PAA Support Quantity : 12</InlineNotice><footer><span>В наявності: <strong>0</strong></span><span>Бекордер: <strong>12</strong></span></footer></div></Panel>
        <Panel><SectionHeading title="Локальний каталог" /><dl className={styles.catalogStock}><div><dt>На складі:</dt><dd>{part.stock}</dd></div><div><dt>Статус:</dt><dd><StatusBadge tone="neutral">1</StatusBadge></dd></div><div><dt>Дилерська ціна:</dt><dd>{formatMoney(part.dealerPrice)}</dd></div><div><dt>Роздрібна ціна:</dt><dd>{formatMoney(part.retailPrice)}</dd></div></dl></Panel>
      </section> : <Panel><EmptyState icon={<Search size={25} />} title="Запчастину не знайдено" description="Для демонстрації введіть номер 9779150." /></Panel>}
    </FeatureFrame>
  );
}

function WorkshopPage() {
  const { state, addWorkshopOrder } = useDemoStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WorkshopOrderInput>({ type: "maintenance", customerId: state.customers[0]?.id || "", description: "", mechanic: "", scheduledAt: "", notes: "" });
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.customerId || !form.description.trim()) { setError("Оберіть клієнта та опишіть роботу."); return; }
    addWorkshopOrder({ ...form, description: form.description.trim(), mechanic: form.mechanic.trim(), notes: form.notes.trim() });
    setOpen(false);
    setError("");
  };
  const columns = ["Нові", "Заплановані", "В роботі", "Готові"];
  return (
    <FeatureFrame feature="workshop" action={<button type="button" className="button button-primary" onClick={() => setOpen(true)}><Plus size={15} /> Нове замовлення-наряд</button>}>
      <section className={styles.workshopStats}><StatCard label="Нові" value={state.workshopOrders.filter((item) => item.status === "new").length} icon={<FileClock size={18} />} tone="orange" /><StatCard label="Заплановані" value="0" icon={<CalendarDays size={18} />} tone="blue" /><StatCard label="В роботі" value="0" icon={<Wrench size={18} />} tone="amber" /><StatCard label="Готові" value="0" icon={<Check size={18} />} tone="green" /></section>
      <div className={styles.workshopBoard}>{columns.map((column, columnIndex) => <Panel className={styles.workshopColumn} key={column}><header><span>{column}</span><strong>{columnIndex === 0 ? state.workshopOrders.length : 0}</strong></header>{columnIndex === 0 && state.workshopOrders.length ? state.workshopOrders.map((order) => <article key={order.id}><StatusBadge tone="orange">{({ maintenance: "ТО", repair: "Ремонт", warranty: "Гарантія", inspection: "Огляд", recall: "Recall" } as const)[order.type]}</StatusBadge><h3>{order.description}</h3><p>{state.customers.find((customer) => customer.id === order.customerId)?.name || "Клієнт"}</p>{order.mechanic ? <small>Механік: {order.mechanic}</small> : null}</article>) : <EmptyState compact title="Поки порожньо" description="Роботи з’являться у цій колонці." />}</Panel>)}</div>
      <Modal open={open} onClose={() => setOpen(false)} title="Нове замовлення-наряд" description="Локальна демонстраційна робота">
        <form className={styles.modalForm} onSubmit={submit}>
          <label className="field"><span>Тип роботи</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as WorkshopOrderInput["type"] })}><option value="maintenance">ТО</option><option value="repair">Ремонт</option><option value="warranty">Гарантія</option><option value="inspection">Огляд</option><option value="recall">Recall</option></select></label>
          <label className="field"><span>Клієнт *</span><select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}><option value="">Оберіть клієнта</option>{state.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>
          <label className="field"><span>Опис *</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className={styles.formGrid}><label className="field"><span>Механік</span><input value={form.mechanic} onChange={(event) => setForm({ ...form, mechanic: event.target.value })} /></label><label className="field"><span>Заплановано</span><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label></div>
          <label className="field"><span>Нотатки</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          <div className={styles.formActions}><button type="button" className="button button-outline" onClick={() => setOpen(false)}>Скасувати</button><button type="submit" className="button button-primary">Створити</button></div>
        </form>
      </Modal>
    </FeatureFrame>
  );
}

function DocumentsPage() {
  const [query, setQuery] = useState("");
  return <FeatureFrame feature="documents"><section className={styles.statsGrid}><StatCard label="Документів" value="0" icon={<FileText size={18} />} /><StatCard label="Неоплачені" value="0" icon={<Clock3 size={18} />} tone="amber" /><StatCard label="Цього місяця" value="0" icon={<CalendarDays size={18} />} tone="blue" /><StatCard label="До сплати" value="$0.00" icon={<CircleDollarSign size={18} />} tone="orange" /></section><Panel><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Номер документа або замовлення..." /></div><select className="select"><option>Усі типи</option><option>Рахунок</option><option>Накладна</option></select><button type="button" className="button button-outline" disabled><Download size={14} /> Експорт</button></div><EmptyState icon={<FileText size={26} />} title="Документів поки немає" description="Рахунки й накладні з’являться після обробки замовлень." /></Panel></FeatureFrame>;
}

function DraftsPage() {
  return <FeatureFrame feature="order-drafts" action={<button type="button" className="button button-primary"><Plus size={15} /> Нова чернетка</button>}><Panel><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder="Пошук чернетки..." /></div><button type="button" className="button button-outline"><RefreshCw size={14} /> Оновити</button><button type="button" className="button button-outline" disabled><FileSpreadsheet size={14} /> Excel</button></div><EmptyState icon={<FileClock size={26} />} title="Чернеток немає" description="Незавершені замовлення та імпортовані файли з’являться тут." /></Panel></FeatureFrame>;
}

function ConsignmentPage() {
  const [tab, setTab] = useState("stock");
  const [requestOpen, setRequestOpen] = useState(false);
  return <FeatureFrame feature="consignment" action={<button type="button" className="button button-primary" onClick={() => setRequestOpen(true)}><Plus size={15} /> Створити запит</button>}><section className={styles.statsGrid}><StatCard label="На консигнації" value="0" icon={<PackageOpen size={18} />} /><StatCard label="У мережі" value="0" icon={<Globe2 size={18} />} tone="blue" /><StatCard label="Активні запити" value="0" icon={<FileClock size={18} />} tone="amber" /><StatCard label="Відвантажено" value="0" icon={<Truck size={18} />} tone="green" /></section><Panel><div className={styles.featureTabs}>{[{ id: "stock", label: "Мій залишок" }, { id: "network", label: "Мережа" }, { id: "requests", label: "Запити" }].map((item) => <button type="button" role="tab" aria-selected={tab === item.id} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder="Номер або опис запчастини..." /></div><button type="button" className="button button-outline"><ListFilter size={14} /> Фільтри</button></div><EmptyState icon={<PackageOpen size={26} />} title={tab === "requests" ? "Запитів поки немає" : "Запчастин не знайдено"} description="Дані консигнації з’являться після синхронізації з дистриб’ютором." /></Panel><Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Запит на консигнацію" description="Перегляд форми без зовнішнього відправлення"><div className={styles.modalForm}><label className="field"><span>Запчастина</span><div className="input-with-icon"><Search size={15} /><input placeholder="Пошук за номером..." /></div></label><label className="field"><span>Коментар</span><textarea placeholder="Обґрунтування запиту" /></label><div className={styles.requestSummary}><span>Позицій</span><strong>0</strong></div><div className={styles.formActions}><button type="button" className="button button-outline" onClick={() => setRequestOpen(false)}>Скасувати</button><button type="button" className="button button-primary" disabled>Надіслати запит</button></div></div></Modal></FeatureFrame>;
}

function SettlementsPage() {
  const [period, setPeriod] = useState(30);
  return <FeatureFrame feature="settlements" action={<button type="button" className="button button-outline" disabled><FileSpreadsheet size={14} /> Excel</button>}><section className={styles.statsGrid}><StatCard label="Поточний баланс" value="$0.00" icon={<CircleDollarSign size={18} />} tone="green" /><StatCard label="Нараховано" value="$0.00" icon={<Download size={18} />} tone="blue" /><StatCard label="Сплачено" value="$0.00" icon={<Check size={18} />} tone="green" /><StatCard label="Прострочено" value="$0.00" icon={<AlertTriangle size={18} />} tone="amber" /></section><Panel><div className={styles.simpleToolbar}><div className="segmented">{[30, 60, 90, 180, 360].map((value) => <button type="button" aria-pressed={period === value} key={value} onClick={() => setPeriod(value)}>{value} днів</button>)}</div><button type="button" className="button button-outline"><RefreshCw size={14} /> Оновити баланс</button></div><EmptyState icon={<CircleDollarSign size={26} />} title={`Рухів за ${period} днів немає`} description="Нарахування та оплати будуть показані у хронологічному порядку." /></Panel></FeatureFrame>;
}

function InventoryPage() {
  const [lowOnly, setLowOnly] = useState(false);
  return <FeatureFrame feature="parts-inventory"><section className={styles.statsGrid}><StatCard label="Позицій" value="0" icon={<Wrench size={18} />} /><StatCard label="В наявності" value="0" icon={<PackageCheck size={18} />} tone="green" /><StatCard label="Низький залишок" value="0" icon={<AlertTriangle size={18} />} tone="amber" /><StatCard label="Вартість" value="$0.00" icon={<CircleDollarSign size={18} />} tone="orange" /></section><Panel><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder="Номер або опис запчастини..." /></div><label className={styles.checkboxLabel}><input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} /> Тільки низький залишок</label></div><EmptyState icon={<Warehouse size={26} />} title="Локальний склад порожній" description={lowOnly ? "Немає позицій із низьким залишком." : "Завантажені залишки з’являться тут."} /></Panel></FeatureFrame>;
}

function NetworkPage() {
  const [tab, setTab] = useState("parts");
  return <FeatureFrame feature="network"><Panel><div className={styles.featureTabs} role="tablist"><button type="button" role="tab" aria-selected={tab === "parts"} onClick={() => setTab("parts")}><Wrench size={14} /> Запчастини</button><button type="button" role="tab" aria-selected={tab === "units"} onClick={() => setTab("units")}><Box size={14} /> Техніка</button></div><div className={styles.simpleToolbar}><div className="toolbar-search"><Search size={15} /><input placeholder={tab === "parts" ? "Номер запчастини..." : "Модель, VIN або SKU..."} /></div><select className="select"><option>Усі дилери</option><option>Logos</option></select></div><EmptyState icon={<Globe2 size={26} />} title={tab === "parts" ? "Запчастин у мережі не знайдено" : "Техніки у мережі не знайдено"} description="Спробуйте змінити запит або дилера." /></Panel></FeatureFrame>;
}

function PartsReportPage() {
  const { state } = useDemoStore();
  const total = state.orders.reduce((sum, order) => sum + orderTotal(order.lines), 0);
  return <FeatureFrame feature="parts-report" action={<button type="button" className="button button-outline" disabled><FileSpreadsheet size={14} /> Excel</button>}><section className={styles.statsGrid}><StatCard label="Замовлень" value={state.orders.length} icon={<Package size={18} />} /><StatCard label="Позицій" value={state.orders.reduce((sum, order) => sum + order.lines.length, 0)} icon={<Boxes size={18} />} tone="blue" /><StatCard label="Сума" value={formatMoney(total)} icon={<CircleDollarSign size={18} />} tone="orange" /><StatCard label="Середній чек" value={formatMoney(state.orders.length ? total / state.orders.length : 0)} icon={<BarChart3 size={18} />} tone="green" /></section><Panel><div className={styles.simpleToolbar}><label className="field"><span>Період</span><select><option>Поточний місяць</option><option>30 днів</option><option>90 днів</option></select></label><label className="field"><span>Менеджер</span><select><option>Усі</option><option>Финансы</option></select></label></div>{state.orders.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Замовлення</th><th>Клієнт</th><th>Позицій</th><th>Статус</th><th>Сума</th></tr></thead><tbody>{state.orders.map((order) => <tr key={order.id}><td><Link className={styles.linkCode} href={dealerOrderHref(order.id)}>{order.code}</Link></td><td>{state.customers.find((customer) => customer.id === order.customerId)?.name || order.company}</td><td>{order.lines.length}</td><td><StatusBadge tone="neutral">Новий</StatusBadge></td><td><strong>{formatMoney(orderTotal(order.lines))}</strong></td></tr>)}</tbody></table></div> : <EmptyState title="Даних за період немає" description="Замовлення з’являться у звіті автоматично." />}</Panel></FeatureFrame>;
}

function UnknownFeature({ feature }: { feature: string }) {
  return <FeatureFrame feature={feature}><Panel><EmptyState title="Розділ у підготовці" description="Для цього демонстраційного маршруту ще немає даних." /></Panel></FeatureFrame>;
}

export function DealerFeaturePage({ feature }: { feature: string }) {
  switch (feature) {
    case "accessories": return <AccessoriesPage />;
    case "units": return <UnitsPage />;
    case "schedule": return <SchedulePage />;
    case "bossweb": return <BossWebPage />;
    case "workshop": return <WorkshopPage />;
    case "documents": return <DocumentsPage />;
    case "order-drafts": return <DraftsPage />;
    case "consignment": return <ConsignmentPage />;
    case "settlements": return <SettlementsPage />;
    case "parts-inventory": return <InventoryPage />;
    case "network": return <NetworkPage />;
    case "parts-report": return <PartsReportPage />;
    default: return <UnknownFeature feature={feature} />;
  }
}
