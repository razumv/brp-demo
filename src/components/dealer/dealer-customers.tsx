"use client";

import Link from "next/link";
import {
  CarFront,
  Edit3,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  Star,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, Modal, PageHeader, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import type { CustomerInput, EquipmentInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Initials, Metric, SectionHeading } from "./common";
import styles from "./dealer.module.css";

const emptyCustomer: CustomerInput = { name: "", phone: "", email: "", address: "", notes: "" };

function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: CustomerInput;
  submitLabel: string;
  onSubmit: (input: CustomerInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CustomerInput>(initial);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Вкажіть ім’я клієнта.");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError("Вкажіть телефон або email.");
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Перевірте формат email.");
      return;
    }
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    });
  };

  return (
    <form id="customer-form" className={styles.modalForm} onSubmit={submit}>
      <label className="field"><span>Ім’я *</span><input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ім’я або назва компанії" /></label>
      <div className={styles.formGrid}>
        <label className="field"><span>Телефон</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+380..." /></label>
        <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
      </div>
      <label className="field"><span>Адреса</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Місто, вулиця" /></label>
      <label className="field"><span>Нотатки</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Важливі деталі про клієнта" /></label>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <button type="button" className="button button-outline" onClick={onCancel}>Скасувати</button>
        <button type="submit" className="button button-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

function EquipmentForm({ customerId, onDone, onCancel }: { customerId: string; onDone: (input: EquipmentInput) => void; onCancel: () => void }) {
  const [form, setForm] = useState<EquipmentInput>({
    customerId,
    model: "",
    vin: "",
    year: String(new Date().getFullYear()),
    engineNumber: "",
    purchasedAt: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.model.trim()) {
      setError("Вкажіть модель техніки.");
      return;
    }
    onDone({ ...form, model: form.model.trim(), vin: form.vin.trim(), engineNumber: form.engineNumber.trim(), notes: form.notes.trim() });
  };

  return (
    <form className={styles.modalForm} onSubmit={submit}>
      <label className="field"><span>Модель *</span><input autoFocus value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="Напр. Outlander 500" /></label>
      <label className="field"><span>VIN</span><input value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value.toUpperCase() })} maxLength={17} placeholder="17 символів" /></label>
      <div className={styles.formGrid}>
        <label className="field"><span>Рік</span><input type="number" min="1980" max="2100" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} /></label>
        <label className="field"><span>Номер двигуна</span><input value={form.engineNumber} onChange={(event) => setForm({ ...form, engineNumber: event.target.value })} /></label>
      </div>
      <label className="field"><span>Дата придбання</span><input type="date" value={form.purchasedAt} onChange={(event) => setForm({ ...form, purchasedAt: event.target.value })} /></label>
      <label className="field"><span>Нотатки</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      <div className={styles.formActions}>
        <button type="button" className="button button-outline" onClick={onCancel}>Скасувати</button>
        <button type="submit" className="button button-primary">Додати техніку</button>
      </div>
    </form>
  );
}

export function CustomersPage() {
  const { state, addCustomer, updateCustomer, addEquipment } = useDemoStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "retail" | "service" | "fleet" | "vip">("all");
  const [selectedId, setSelectedId] = useState(state.customers[0]?.id || "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.customers.filter((customer) => {
      const matchesText = !normalized || [customer.name, customer.phone, customer.email, customer.address].join(" ").toLowerCase().includes(normalized);
      return matchesText && (filter === "all" || filter === "retail");
    });
  }, [filter, query, state.customers]);

  const selected = state.customers.find((customer) => customer.id === selectedId) || filtered[0];
  const selectedEquipment = selected ? state.equipment.filter((item) => item.customerId === selected.id) : [];
  const selectedOrders = selected ? state.orders.filter((order) => order.customerId === selected.id) : [];
  const selectedSpend = selectedOrders.reduce((sum, order) => sum + orderTotal(order.lines), 0);

  return (
    <main className="page page-narrow">
      <PageHeader
        icon={<UsersRound size={21} />}
        title="Клієнти"
        description={`${state.customers.length} загалом`}
        action={<button type="button" className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={15} /> Додати клієнта</button>}
      />

      <section className={styles.statsGrid} aria-label="Показники клієнтів">
        <StatCard label="Загалом" value={state.customers.length} icon={<UsersRound size={18} />} />
        <StatCard label="З технікою" value={new Set(state.equipment.map((item) => item.customerId)).size} icon={<CarFront size={18} />} tone="blue" />
        <StatCard label="VIP" value="0" icon={<Star size={18} />} tone="amber" />
        <StatCard label="Опт" value="0" icon={<Package size={18} />} tone="orange" />
      </section>

      <div className={styles.customerToolbar}>
        <div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук за ім’ям, телефоном, email..." aria-label="Пошук клієнтів" /></div>
        <div className="segmented">
          {(["all", "retail", "service", "fleet", "vip"] as const).map((value) => (
            <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {{ all: "Всі", retail: "Роздріб", service: "Автопарк", fleet: "Опт", vip: "VIP" }[value]}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.customerLayout}>
        <Panel className={styles.customerListPanel}>
          {filtered.length ? filtered.map((customer) => (
            <button type="button" className={cn(styles.customerListItem, selected?.id === customer.id && styles.customerListItemActive)} key={customer.id} onClick={() => setSelectedId(customer.id)}>
              <Initials name={customer.name} />
              <span><strong>{customer.name}</strong><small><Phone size={11} /> {customer.phone || customer.email}</small></span>
              <StatusBadge tone="neutral">Роздріб</StatusBadge>
            </button>
          )) : <EmptyState compact title="Клієнтів не знайдено" description="Змініть пошуковий запит або фільтр." />}
        </Panel>

        <Panel className={styles.customerDetail}>
          {selected ? (
            <>
              <header className={styles.customerDetailHeader}>
                <Initials name={selected.name} large />
                <div className={styles.customerIdentity}>
                  <div><h2>{selected.name}</h2><StatusBadge tone="neutral">Роздріб</StatusBadge></div>
                  <p><Phone size={13} /> {selected.phone || "—"} <Mail size={13} /> {selected.email || "—"}</p>
                  {selected.address ? <p><MapPin size={13} /> {selected.address}</p> : null}
                  {selected.notes ? <em>{selected.notes}</em> : null}
                </div>
                <button type="button" className="icon-button" aria-label="Редагувати клієнта" onClick={() => setEditOpen(true)}><Edit3 size={17} /></button>
              </header>

              <div className={styles.customerMetrics}>
                <Metric label="Замовлень" value={selectedOrders.length} />
                <Metric label="Витрачено" value={formatMoney(selectedSpend)} />
                <Metric label="Техніки" value={selectedEquipment.length} />
                <Metric label="Активність" value={selectedOrders.length ? "Активний" : "—"} />
              </div>

              <section className={styles.customerSection}>
                <SectionHeading title={`Техніка (${selectedEquipment.length})`} action={<button type="button" className="button button-outline" onClick={() => setEquipmentOpen(true)}><Plus size={14} /> Додати</button>} />
                {selectedEquipment.length ? (
                  <div className={styles.equipmentGrid}>{selectedEquipment.map((item) => <article key={item.id}><span><CarFront size={18} /></span><div><strong>{item.model}</strong><small>{item.year}{item.vin ? ` · VIN ${item.vin}` : ""}</small>{item.engineNumber ? <small>Двигун: {item.engineNumber}</small> : null}</div></article>)}</div>
                ) : <p className={styles.mutedRow}>Немає зареєстрованої техніки</p>}
              </section>

              <section className={styles.customerSection}>
                <SectionHeading title={`Замовлення запчастин (${selectedOrders.length})`} />
                {selectedOrders.length ? selectedOrders.map((order) => <Link href={dealerOrderHref(order.id)} className={styles.customerOrder} key={order.id}><Package size={15} /><span><strong>{order.code}</strong><small>{order.lines.length} позицій</small></span><strong>{formatMoney(orderTotal(order.lines))}</strong></Link>) : <p className={styles.mutedRow}>Поки немає замовлень</p>}
              </section>

              <section className={styles.customerSection}>
                <SectionHeading title="Продана техніка (0)" />
                <p className={styles.mutedRow}>Немає продажів техніки</p>
              </section>
            </>
          ) : (
            <EmptyState title="Оберіть клієнта" description="Картка клієнта з’явиться тут." />
          )}
        </Panel>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Додати клієнта" description="Запис зберігається лише у локальній демо-версії.">
        <CustomerForm initial={emptyCustomer} submitLabel="Додати клієнта" onCancel={() => setCreateOpen(false)} onSubmit={(input) => {
          const customer = addCustomer(input);
          setSelectedId(customer.id);
          setCreateOpen(false);
        }} />
      </Modal>

      <Modal open={editOpen && Boolean(selected)} onClose={() => setEditOpen(false)} title="Редагувати клієнта">
        {selected ? <CustomerForm key={selected.id} initial={selected} submitLabel="Зберегти" onCancel={() => setEditOpen(false)} onSubmit={(input) => {
          updateCustomer(selected.id, input);
          setEditOpen(false);
        }} /> : null}
      </Modal>

      <Modal open={equipmentOpen && Boolean(selected)} onClose={() => setEquipmentOpen(false)} title="Додати техніку" description={selected?.name}>
        {selected ? <EquipmentForm key={selected.id} customerId={selected.id} onCancel={() => setEquipmentOpen(false)} onDone={(input) => {
          addEquipment(input);
          setEquipmentOpen(false);
        }} /> : null}
      </Modal>
    </main>
  );
}
