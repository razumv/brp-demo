"use client";

import {
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { EmptyState, InlineNotice, Modal, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../common";
import styles from "../dealer.module.css";
import { FeatureFrame } from "./feature-frame";

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

export function SchedulePage() {
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
