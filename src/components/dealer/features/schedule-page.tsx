"use client";

import {
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, InlineNotice, Modal, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import {
  dealerScheduleAsOfDate,
  dealerScheduleCategoryLabels,
  dealerScheduleSlots,
  dealerScheduleStatusLabels,
  filterDealerScheduleSlots,
  formatDealerScheduleDate,
  formatDealerScheduleTimeframe,
  getDealerScheduleMetrics,
  getDealerScheduleSlotTotals,
  getDealerScheduleTimeframe,
  type DealerScheduleCategoryFilter,
  type DealerScheduleMetrics,
  type DealerScheduleSlot,
} from "@/lib/dealer/schedule-data";
import { ukrainianCount } from "@/lib/dealer/format";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../common";
import dealerStyles from "../dealer.module.css";
import operationalStyles from "./operational-features.module.css";
import { FeatureFrame } from "./feature-frame";

const scheduleCategoryOptions = [
  { id: "all", label: "Усі категорії" },
  ...Array.from(new Set(dealerScheduleSlots.map((slot) => slot.category)), (category) => ({
    id: category,
    label: dealerScheduleCategoryLabels[category],
  })),
] as const satisfies readonly { id: DealerScheduleCategoryFilter; label: string }[];

function scheduleResultLabel(metrics: DealerScheduleMetrics) {
  return `${ukrainianCount(metrics.slots, ["слот", "слоти", "слотів"])} · ${ukrainianCount(metrics.totalUnits, ["одиниця", "одиниці", "одиниць"])} · ${metrics.availableUnits} вільно`;
}

function ScheduleSlotContent({ slot }: { slot: DealerScheduleSlot }) {
  return (
    <>
      <div className={dealerStyles.slotDates}>
        <span><CalendarDays size={15} /> Прибуття: <strong>{formatDealerScheduleDate(slot.arrivalDate)}</strong></span>
        <span><CircleDollarSign size={15} /> Оплата до: <strong>{formatDealerScheduleDate(slot.paymentDueDate)}</strong></span>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>SKU</th><th>Модель</th><th>Усього</th><th>Вільно</th></tr></thead>
          <tbody>
            {slot.models.map((model) => (
              <tr key={model.sku}>
                <td className={dealerStyles.mono}>{model.sku}</td>
                <td>{model.model}</td>
                <td>{model.total}</td>
                <td>{model.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SchedulePage() {
  const [category, setCategory] = useState<DealerScheduleCategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(dealerScheduleSlots[0]?.id ?? "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const filteredSlots = useMemo(
    () => filterDealerScheduleSlots(dealerScheduleSlots, category, query),
    [category, query],
  );
  const metrics = useMemo(() => getDealerScheduleMetrics(filteredSlots), [filteredSlots]);
  const timeframe = useMemo(() => getDealerScheduleTimeframe(filteredSlots), [filteredSlots]);
  const timeframeLabel = useMemo(() => formatDealerScheduleTimeframe(filteredSlots), [filteredSlots]);
  const selected = filteredSlots.find((slot) => slot.id === selectedId) ?? filteredSlots[0];

  return (
    <FeatureFrame feature="schedule">
      {metrics.overduePayments ? (
        <InlineNotice tone="warning">
          <strong>{ukrainianCount(metrics.overduePayments, ["поставка", "поставки", "поставок"])}</strong> має прострочену дату оплати станом на {formatDealerScheduleDate(dealerScheduleAsOfDate)}.
        </InlineNotice>
      ) : null}

      <section className={dealerStyles.scheduleStats} aria-label="Зведення графіка поставки">
        <StatCard label="Слотів у періоді" value={metrics.slots} icon={<Truck size={18} />} tone="blue" />
        <StatCard label="Доступно" value={metrics.availableUnits} helper="Вільні одиниці у слотах" icon={<PackageCheck size={18} />} tone="green" />
        <StatCard label="Одиниць у плані" value={metrics.totalUnits} icon={<Warehouse size={18} />} tone="orange" />
      </section>

      <Panel className={dealerStyles.timelineOverview}>
        <SectionHeading
          title="Хронологія прибуття"
          action={<span className={operationalStyles.timeframe} data-testid="schedule-timeframe">{timeframeLabel}</span>}
        />
        {timeframe.length ? (
          <ol className={operationalStyles.scheduleTimeline} aria-label="Місяці поставок">
            {timeframe.map((month) => (
              <li key={month.key}>
                <span aria-hidden="true" />
                <strong>{month.label}</strong>
                <small>{month.key.slice(0, 4)} · {ukrainianCount(month.slotCount, ["слот", "слоти", "слотів"])}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p className={operationalStyles.timelineEmpty}>Для поточного фільтра немає дат прибуття.</p>
        )}
      </Panel>

      <div className={dealerStyles.scheduleFilters}>
        <div className="segmented" role="group" aria-label="Категорія техніки">
          {scheduleCategoryOptions.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="toolbar-search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Пошук у графіку поставки"
            placeholder="SKU, модель або слот…"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <p className={operationalStyles.resultCount} data-testid="schedule-result-count" aria-live="polite">
        {scheduleResultLabel(metrics)}
      </p>

      <section className={dealerStyles.scheduleColumns}>
        <Panel className={dealerStyles.slotList}>
          <SectionHeading title={`Слоти доставки (${filteredSlots.length})`} />
          {filteredSlots.length ? filteredSlots.map((slot) => {
            const totals = getDealerScheduleSlotTotals(slot);
            return (
              <button
                type="button"
                className={cn(
                  dealerStyles.slotRow,
                  operationalStyles.slotRow,
                  selected?.id === slot.id && dealerStyles.slotRowActive,
                )}
                onClick={() => {
                  setSelectedId(slot.id);
                  setDetailsOpen(true);
                }}
                key={slot.id}
                aria-pressed={selected?.id === slot.id}
              >
                <StatusBadge tone="neutral">{slot.category}</StatusBadge>
                <span>
                  <strong>{slot.title}</strong>
                  <small>Прибуття {formatDealerScheduleDate(slot.arrivalDate)} · Оплата до {formatDealerScheduleDate(slot.paymentDueDate)}</small>
                </span>
                <span>
                  <span><i className={cn(operationalStyles.statusDot, slot.status === "in_transit" && operationalStyles.statusDotBlue)} /> {dealerScheduleStatusLabels[slot.status]}</span>
                  <small>Вільно {totals.availableUnits} з {totals.totalUnits}</small>
                </span>
              </button>
            );
          }) : (
            <EmptyState compact title="Слотів не знайдено" description="Змініть категорію або пошуковий запит." />
          )}
        </Panel>

        <Panel className={dealerStyles.slotDetail}>
          {selected ? (
            <>
              <SectionHeading title={selected.title} action={<StatusBadge tone="neutral">{selected.category}</StatusBadge>} />
              <ScheduleSlotContent slot={selected} />
            </>
          ) : (
            <EmptyState title="Слот не вибрано" description="Оберіть доступний слот у списку." />
          )}
        </Panel>
      </section>

      <Modal
        open={detailsOpen && Boolean(selected)}
        onClose={() => setDetailsOpen(false)}
        title={selected?.title ?? "Слот доставки"}
        description="Моделі, дати та вільні одиниці у вибраному слоті"
      >
        {selected ? <ScheduleSlotContent slot={selected} /> : null}
      </Modal>
    </FeatureFrame>
  );
}
