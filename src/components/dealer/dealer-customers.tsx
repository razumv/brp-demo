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
  Trash2,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, Modal, PageHeader, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import type {
  DealerCommandResult,
  DealerCustomerCategory,
  DealerCustomerInput,
} from "@/lib/dealer/contracts";
import { formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerOrderHref } from "@/lib/order-route-hrefs";
import type { EquipmentInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDealerWorkflow } from "./dealer-workflow-provider";
import { Initials, Metric, SectionHeading } from "./common";
import styles from "./dealer.module.css";

const categories = ["all", "retail", "fleet", "vip", "wholesale"] as const;
const categoryLabels: Record<DealerCustomerCategory, string> = {
  retail: "Роздріб",
  fleet: "Автопарк",
  vip: "VIP",
  wholesale: "Опт",
};
const emptyCustomer: DealerCustomerInput = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  category: "retail",
};

function commandError(result: DealerCommandResult<unknown>) {
  if (result.ok) return "";
  if (result.kind === "validation-error") return result.issues[0]?.message ?? "Не вдалося зберегти зміни.";
  if (result.kind === "local-error") return result.message;
  return "Ця дія поки недоступна.";
}

function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: DealerCustomerInput;
  submitLabel: string;
  onSubmit: (input: DealerCustomerInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DealerCustomerInput>(initial);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Вкажіть ім’я клієнта.");
    if (!form.phone.trim() && !form.email.trim()) return setError("Вкажіть телефон або email.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError("Перевірте формат email.");
    try {
      await onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        category: form.category ?? "retail",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не вдалося зберегти зміни.");
    }
  };

  return (
    <form className={styles.modalForm} onSubmit={submit}>
      <label className="field"><span>Ім’я *</span><input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ім’я або назва компанії" /></label>
      <div className={styles.formGrid}>
        <label className="field"><span>Телефон</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+380..." /></label>
        <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
      </div>
      <label className="field"><span>Категорія</span><select value={form.category ?? "retail"} onChange={(event) => setForm({ ...form, category: event.target.value as DealerCustomerCategory })}>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
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

function EquipmentForm({
  customerId,
  initial,
  submitLabel,
  onDone,
  onCancel,
}: {
  customerId: string;
  initial?: EquipmentInput;
  submitLabel: string;
  onDone: (input: EquipmentInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EquipmentInput>(initial ?? {
    customerId,
    model: "",
    vin: "",
    year: String(new Date().getFullYear()),
    engineNumber: "",
    purchasedAt: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.model.trim()) return setError("Вкажіть модель техніки.");
    try {
      await onDone({
        ...form,
        customerId,
        model: form.model.trim(),
        vin: form.vin.trim(),
        engineNumber: form.engineNumber.trim(),
        notes: form.notes.trim(),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не вдалося зберегти зміни.");
    }
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
        <button type="submit" className="button button-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

export function CustomersPage() {
  const { snapshot: state, commands } = useDealerWorkflow();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof categories)[number]>("all");
  const [selectedId, setSelectedId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deleteEquipmentId, setDeleteEquipmentId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk-UA");
    return state.customers.filter((customer) => {
      const matchesText = !normalized || [customer.name, customer.phone, customer.email, customer.address, customer.notes]
        .join(" ")
        .toLocaleLowerCase("uk-UA")
        .includes(normalized);
      return matchesText && (filter === "all" || customer.category === filter);
    });
  }, [filter, query, state.customers]);

  const selected = filtered.find((customer) => customer.id === selectedId) ?? filtered[0];
  const selectedEquipment = selected ? state.equipment.filter((item) => item.customerId === selected.id) : [];
  const selectedOrders = selected ? state.orders.filter((order) => order.customerId === selected.id) : [];
  const selectedSpend = selectedOrders.reduce((sum, order) => sum + orderTotal(order.lines), 0);
  const editingEquipment = selectedEquipment.find((item) => item.id === editingEquipmentId);
  const equipmentToDelete = selectedEquipment.find((item) => item.id === deleteEquipmentId);
  const categoryCount = (category: DealerCustomerCategory) => state.customers.filter((customer) => customer.category === category).length;

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
        <StatCard label="VIP" value={categoryCount("vip")} icon={<Star size={18} />} tone="amber" />
        <StatCard label="Опт" value={categoryCount("wholesale")} icon={<Package size={18} />} tone="orange" />
      </section>

      <div className={styles.customerToolbar}>
        <div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук за ім’ям, телефоном, email..." aria-label="Пошук клієнтів" /></div>
        <div className="segmented" aria-label="Категорії клієнтів">
          {categories.map((value) => (
            <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {value === "all" ? "Всі" : categoryLabels[value]}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.customerLayout}>
        <Panel className={styles.customerListPanel}>
          {filtered.length ? filtered.map((customer) => (
            <button type="button" aria-label={customer.name} className={cn(styles.customerListItem, selected?.id === customer.id && styles.customerListItemActive)} key={customer.id} onClick={() => setSelectedId(customer.id)}>
              <Initials name={customer.name} />
              <span><strong>{customer.name}</strong><small><Phone size={11} /> {customer.phone || customer.email}</small></span>
              <StatusBadge tone="neutral">{categoryLabels[customer.category]}</StatusBadge>
            </button>
          )) : <EmptyState compact title="Клієнтів не знайдено" description="Змініть пошуковий запит або фільтр." />}
        </Panel>

        <Panel className={styles.customerDetail}>
          {selected ? (
            <>
              <header className={styles.customerDetailHeader}>
                <Initials name={selected.name} large />
                <div className={styles.customerIdentity}>
                  <div><h2>{selected.name}</h2><StatusBadge tone="neutral">{categoryLabels[selected.category]}</StatusBadge></div>
                  <p><Phone size={13} /> {selected.phone || "—"} <Mail size={13} /> {selected.email || "—"}</p>
                  {selected.address ? <p><MapPin size={13} /> {selected.address}</p> : null}
                  {selected.notes ? <em>{selected.notes}</em> : null}
                </div>
                <div className={styles.customerHeaderActions}>
                  <button type="button" className="icon-button" aria-label="Редагувати клієнта" onClick={() => setEditOpen(true)}><Edit3 size={17} /></button>
                  <button type="button" className="icon-button" aria-label="Видалити клієнта" onClick={() => { setDeleteError(""); setDeleteCustomerOpen(true); }}><Trash2 size={17} /></button>
                </div>
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
                  <div className={styles.equipmentGrid}>{selectedEquipment.map((item) => <article key={item.id}><span><CarFront size={18} /></span><div><strong>{item.model}</strong><small>{item.year}{item.vin ? ` · VIN ${item.vin}` : ""}</small>{item.engineNumber ? <small>Двигун: {item.engineNumber}</small> : null}</div><div className={styles.equipmentActions}><button type="button" className="icon-button" aria-label={`Редагувати техніку ${item.model}`} onClick={() => setEditingEquipmentId(item.id)}><Edit3 size={16} /></button><button type="button" className="icon-button" aria-label={`Видалити техніку ${item.model}`} onClick={() => { setDeleteError(""); setDeleteEquipmentId(item.id); }}><Trash2 size={16} /></button></div></article>)}</div>
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
          ) : <EmptyState title="Оберіть клієнта" description="Картка клієнта з’явиться тут." />}
        </Panel>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Додати клієнта">
        <CustomerForm initial={emptyCustomer} submitLabel="Додати клієнта" onCancel={() => setCreateOpen(false)} onSubmit={async (input) => {
          const result = await commands.createCustomer(input);
          if (!result.ok) throw new Error(commandError(result));
          setSelectedId(result.value.id);
          setCreateOpen(false);
        }} />
      </Modal>

      <Modal open={editOpen && Boolean(selected)} onClose={() => setEditOpen(false)} title="Редагувати клієнта">
        {selected ? <CustomerForm key={selected.id} initial={selected} submitLabel="Зберегти" onCancel={() => setEditOpen(false)} onSubmit={async (input) => {
          const result = await commands.updateCustomer({ id: selected.id, customer: input });
          if (!result.ok) throw new Error(commandError(result));
          setEditOpen(false);
        }} /> : null}
      </Modal>

      <Modal open={equipmentOpen && Boolean(selected)} onClose={() => setEquipmentOpen(false)} title="Додати техніку" description={selected?.name}>
        {selected ? <EquipmentForm key={selected.id} customerId={selected.id} submitLabel="Додати техніку" onCancel={() => setEquipmentOpen(false)} onDone={async (input) => {
          const result = await commands.createEquipment(input);
          if (!result.ok) throw new Error(commandError(result));
          setEquipmentOpen(false);
        }} /> : null}
      </Modal>

      <Modal open={Boolean(editingEquipment && selected)} onClose={() => setEditingEquipmentId(null)} title="Редагувати техніку" description={selected?.name}>
        {editingEquipment && selected ? <EquipmentForm key={editingEquipment.id} customerId={selected.id} initial={editingEquipment} submitLabel="Зберегти техніку" onCancel={() => setEditingEquipmentId(null)} onDone={async (input) => {
          const result = await commands.updateEquipment({ id: editingEquipment.id, customerId: selected.id, equipment: input });
          if (!result.ok) throw new Error(commandError(result));
          setEditingEquipmentId(null);
        }} /> : null}
      </Modal>

      <Modal open={deleteCustomerOpen && Boolean(selected)} onClose={() => setDeleteCustomerOpen(false)} title="Видалити клієнта" description={selected ? `Видалити ${selected.name}?` : undefined}>
        <div className={styles.deleteConfirm}>{deleteError ? <p className={styles.formError} role="alert">{deleteError}</p> : null}<p>Дію неможливо скасувати.</p><div className={styles.formActions}><button type="button" className="button button-outline" onClick={() => setDeleteCustomerOpen(false)}>Скасувати</button><button type="button" className="button button-danger" onClick={async () => {
          if (!selected) return;
          const result = await commands.deleteCustomer({ id: selected.id });
          if (!result.ok) return setDeleteError(commandError(result));
          setSelectedId("");
          setDeleteCustomerOpen(false);
        }}>Видалити</button></div></div>
      </Modal>

      <Modal open={Boolean(equipmentToDelete && selected)} onClose={() => setDeleteEquipmentId(null)} title="Видалити техніку" description={equipmentToDelete?.model}>
        <div className={styles.deleteConfirm}>{deleteError ? <p className={styles.formError} role="alert">{deleteError}</p> : null}<p>Дію неможливо скасувати.</p><div className={styles.formActions}><button type="button" className="button button-outline" onClick={() => setDeleteEquipmentId(null)}>Скасувати</button><button type="button" className="button button-danger" onClick={async () => {
          if (!equipmentToDelete || !selected) return;
          const result = await commands.deleteEquipment({ id: equipmentToDelete.id, customerId: selected.id });
          if (!result.ok) return setDeleteError(commandError(result));
          setDeleteEquipmentId(null);
        }}>Видалити</button></div></div>
      </Modal>
    </main>
  );
}
