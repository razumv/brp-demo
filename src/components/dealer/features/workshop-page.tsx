"use client";

import { CalendarDays, Check, FileClock, Plus, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { EmptyState, Modal, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import type { WorkshopOrderInput } from "@/lib/types";
import styles from "../dealer.module.css";
import { FeatureFrame } from "./feature-frame";

export function WorkshopPage() {
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
