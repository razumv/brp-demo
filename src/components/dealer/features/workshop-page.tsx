"use client";

import {
  CalendarDays,
  Check,
  FileClock,
  Plus,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { DealerDataToolbar } from "@/components/dealer/dealer-data-toolbar";
import { BrpButton, BrpSelect } from "@/components/brp-ui";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { EmptyState, Modal, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import { ukrainianCount } from "@/lib/dealer/format";
import {
  filterWorkshopOrders,
  getWorkshopColumnCounts,
  groupWorkshopOrders,
  workshopStages,
  workshopTypeLabels,
} from "@/lib/dealer/workshop-data";
import type { WorkshopOrder, WorkshopOrderInput } from "@/lib/types";
import { formatDateTime } from "../common";
import dealerStyles from "../dealer.module.css";
import operationalStyles from "./operational-features.module.css";
import { FeatureFrame } from "./feature-frame";

const stageIcons = {
  new: FileClock,
  scheduled: CalendarDays,
  in_progress: Wrench,
  done: Check,
} as const;

function emptyWorkshopForm(customerId: string): WorkshopOrderInput {
  return {
    type: "maintenance",
    customerId,
    description: "",
    mechanic: "",
    scheduledAt: "",
    notes: "",
  };
}

export function WorkshopPage() {
  const { snapshot, commands } = useDealerWorkflow();
  const firstCustomerId = snapshot.customers[0]?.id ?? "";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WorkshopOrderInput>(() => emptyWorkshopForm(firstCustomerId));
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | WorkshopOrder["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | WorkshopOrder["type"]>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filteredOrders = useMemo(() => filterWorkshopOrders(
    snapshot.workshopOrders,
    snapshot.customers,
    {
      query,
      stages: stageFilter === "all" ? [] : [stageFilter],
      types: typeFilter === "all" ? [] : [typeFilter],
    },
  ), [query, snapshot.customers, snapshot.workshopOrders, stageFilter, typeFilter]);
  const counts = useMemo(() => getWorkshopColumnCounts(filteredOrders), [filteredOrders]);
  const groups = useMemo(() => groupWorkshopOrders(filteredOrders), [filteredOrders]);
  const customerById = useMemo(
    () => new Map(snapshot.customers.map((customer) => [customer.id, customer])),
    [snapshot.customers],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.customerId || !form.description.trim()) {
      setError("Оберіть клієнта та опишіть роботу.");
      return;
    }

    const result = await commands.createWorkshopOrder({
      ...form,
      description: form.description.trim(),
      mechanic: form.mechanic.trim(),
      notes: form.notes.trim(),
    });
    if (!result.ok) {
      if (result.kind === "validation-error") {
        setError(result.issues[0]?.message ?? "Не вдалося створити замовлення-наряд.");
      } else if (result.kind === "local-error") {
        setError(result.message);
      } else {
        setError("Не вдалося створити замовлення-наряд.");
      }
      return;
    }
    setForm(emptyWorkshopForm(form.customerId));
    setOpen(false);
    setError("");
    setConfirmation("Замовлення-наряд створено.");
  };

  return (
    <FeatureFrame
      feature="workshop"
      action={(
        <BrpButton
          label="Нове замовлення-наряд"
          icon={<Plus size={15} />}
          disabled={!snapshot.customers.length}
          onPress={() => {
            setForm((current) => ({ ...current, customerId: current.customerId || firstCustomerId }));
            setError("");
            setConfirmation("");
            setOpen(true);
          }}
        />
      )}
    >
      {confirmation ? <p className={operationalStyles.successMessage} role="status">{confirmation}</p> : null}

      <section className={dealerStyles.workshopStats} aria-label="Зведення майстерні">
        {workshopStages.map((stage) => {
          const Icon = stageIcons[stage.id];
          return (
            <StatCard
              key={stage.id}
              label={stage.label}
              value={counts[stage.id]}
              icon={<Icon size={18} />}
              tone={stage.tone}
            />
          );
        })}
      </section>

      <div className={operationalStyles.workshopToolbar}>
        <DealerDataToolbar
          search={{
            value: query,
            onValueChange: setQuery,
            label: "Пошук у майстерні",
            placeholder: "Опис, клієнт, механік або нотатки…",
          }}
          filters={{
            label: "Фільтри майстерні",
            activeCount: Number(stageFilter !== "all") + Number(typeFilter !== "all"),
            open: filtersOpen,
            onOpenChange: setFiltersOpen,
            panelId: "workshop-filters",
            content: (
              <>
                <BrpSelect
                  label="Етап"
                  value={stageFilter}
                  onValueChange={(value) => setStageFilter(value as "all" | WorkshopOrder["status"])}
                  options={[{ value: "all", label: "Усі етапи" }, ...workshopStages.map((stage) => ({ value: stage.id, label: stage.label }))]}
                />
                <BrpSelect
                  label="Тип роботи"
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as "all" | WorkshopOrder["type"])}
                  options={[{ value: "all", label: "Усі типи" }, ...Object.entries(workshopTypeLabels).map(([value, label]) => ({ value, label }))]}
                />
              </>
            ),
            onClear: () => {
              setStageFilter("all");
              setTypeFilter("all");
            },
          }}
          resultMeta={(
            <span data-testid="workshop-result-count">
              {ukrainianCount(filteredOrders.length, ["замовлення", "замовлення", "замовлень"])}
            </span>
          )}
        />
      </div>

      <div className={`${dealerStyles.workshopBoard} ${operationalStyles.workshopBoard}`}>
        {groups.map(({ stage, orders }) => (
          <Panel
            className={`${dealerStyles.workshopColumn} ${operationalStyles.workshopColumn}`}
            key={stage.id}
          >
            <div data-testid="workshop-column">
              <header className={operationalStyles.workshopColumnHeader}>
                <span>{stage.label}</span>
                <strong>{orders.length}</strong>
              </header>
              {orders.length ? (
                <div className={operationalStyles.workshopOrderList}>
                  {orders.map((order) => (
                    <article className={operationalStyles.workshopOrder} draggable={false} key={order.id}>
                      <StatusBadge tone={stage.tone}>{workshopTypeLabels[order.type]}</StatusBadge>
                      <h3>{order.description}</h3>
                      <p>{customerById.get(order.customerId)?.name ?? "Клієнта не знайдено"}</p>
                      {order.mechanic ? <small>Механік: {order.mechanic}</small> : null}
                      {order.scheduledAt ? <small>Заплановано: {formatDateTime(order.scheduledAt)}</small> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="Поки порожньо" description="Замовлень на цьому етапі немає." />
              )}
            </div>
          </Panel>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setError("");
        }}
        title="Нове замовлення-наряд"
        description="Заповніть дані нового сервісного замовлення"
      >
        <form className={dealerStyles.modalForm} onSubmit={submit}>
          <label className="field">
            <span>Тип роботи</span>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as WorkshopOrderInput["type"] })}
            >
              {Object.entries(workshopTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Клієнт *</span>
            <select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
              <option value="">Оберіть клієнта</option>
              {snapshot.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Опис *</span>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className={dealerStyles.formGrid}>
            <label className="field">
              <span>Механік</span>
              <input value={form.mechanic} onChange={(event) => setForm({ ...form, mechanic: event.target.value })} autoComplete="off" />
            </label>
            <label className="field">
              <span>Заплановано</span>
              <input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>Нотатки</span>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          {error ? <p className={dealerStyles.formError} role="alert">{error}</p> : null}
          <div className={dealerStyles.formActions}>
            <button type="button" className="button button-outline" onClick={() => setOpen(false)}>Скасувати</button>
            <button type="submit" className="button button-primary">Створити замовлення-наряд</button>
          </div>
        </form>
      </Modal>
    </FeatureFrame>
  );
}
