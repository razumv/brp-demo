"use client";

import {useLayoutEffect, useMemo, useState} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  Ship,
  SlidersHorizontal,
  Warehouse,
} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Collapsible} from "@astryxdesign/core/Collapsible";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Popover} from "@astryxdesign/core/Popover";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {useAppearance} from "@/components/appearance/use-appearance";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  scheduleKpis,
  scheduleSourceTotals,
  scheduleStockRows,
  type ScheduleSlot,
  type ScheduleSlotStatus,
} from "@/lib/admin-schedule-data";
import {
  buildScheduleTimelineModel,
  filterScheduleSearchResults,
  filterScheduleSlots,
  findScheduleSlot,
  formatScheduleTimelineDate,
  normalizeScheduleSearch,
  scheduleCategoryFilters,
  scheduleTimelineDefaults,
  scheduleTimelineGroupLabel,
  scheduleTimelineSlotLabel,
  scheduleTimelineStatusLabel,
} from "@/lib/admin-schedule-view-model";
import type {ScheduleViewProps} from "./admin-schedule-page";
import styles from "./astryx-admin-schedule.module.css";

type SlotRow = Record<string, unknown> & {
  id: string;
  category: string;
  name: string;
  paymentDue: string;
  status: ScheduleSlotStatus;
  arrival: string;
  free: number;
  total: number;
};

type DetailRow = Record<string, unknown> & {
  id: string;
  sku: string;
  model: string;
  total: number;
  free: number;
};

type SearchRow = Record<string, unknown> & {
  id: string;
  sku: string;
  model: string;
  slotName: string;
  arrival: string;
  total: number;
  free: number;
};

type StockRow = Record<string, unknown> & {
  id: string;
  model: string;
  category: string;
  location: string;
  total: number;
  reserved: number;
  free: number;
};

function badgeVariant(status: ScheduleSlotStatus): "success" | "info" | "neutral" {
  if (status === "in-transit") return "info";
  if (status === "future") return "neutral";
  return "success";
}

function statusDotVariant(status: ScheduleSlotStatus): "success" | "accent" | "neutral" {
  if (status === "in-transit") return "accent";
  if (status === "future") return "neutral";
  return "success";
}

function TimelinePeriodControls({
  pastMonths,
  futureMonths,
  onPastMonthsChange,
  onFutureMonthsChange,
}: Pick<ScheduleViewProps, "pastMonths" | "futureMonths" | "onPastMonthsChange" | "onFutureMonthsChange">) {
  return (
    <div className={styles.periodControls}>
      <div>
        <Text type="supporting" color="secondary">Місяців назад</Text>
        <div className={styles.stepper}>
          <Button label="Зменшити кількість минулих місяців" variant="secondary" size="sm" isDisabled={pastMonths === 0} onClick={() => onPastMonthsChange(Math.max(0, pastMonths - 1))}>−</Button>
          <output aria-live="polite">{pastMonths}</output>
          <Button label="Збільшити кількість минулих місяців" variant="secondary" size="sm" isDisabled={pastMonths === scheduleTimelineDefaults.maxPastMonths} onClick={() => onPastMonthsChange(Math.min(scheduleTimelineDefaults.maxPastMonths, pastMonths + 1))}>+</Button>
        </div>
      </div>
      <div>
        <Text type="supporting" color="secondary">Місяців уперед</Text>
        <div className={styles.stepper}>
          <Button label="Зменшити кількість майбутніх місяців" variant="secondary" size="sm" isDisabled={futureMonths === 0} onClick={() => onFutureMonthsChange(Math.max(0, futureMonths - 1))}>−</Button>
          <output aria-live="polite">{futureMonths}</output>
          <Button label="Збільшити кількість майбутніх місяців" variant="secondary" size="sm" isDisabled={futureMonths === scheduleTimelineDefaults.maxFutureMonths} onClick={() => onFutureMonthsChange(Math.min(scheduleTimelineDefaults.maxFutureMonths, futureMonths + 1))}>+</Button>
        </div>
      </div>
    </div>
  );
}

function Timeline(props: ScheduleViewProps & {isRendererActive: boolean}) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const timeline = useMemo(
    () => buildScheduleTimelineModel(props.pastMonths, props.futureMonths),
    [props.futureMonths, props.pastMonths],
  );

  return (
    <Card className={styles.timelineCard} padding={0}>
      <div className={styles.timelinePopover}>
        <Popover
          label="Налаштування видимого періоду"
          isOpen={props.isRendererActive && periodOpen}
          onOpenChange={setPeriodOpen}
          placement="below"
          width={320}
          content={<TimelinePeriodControls {...props} />}
        >
          <Button label="Період" icon={<SlidersHorizontal size={14} />} variant="secondary" size="sm" />
        </Popover>
      </div>
      <Collapsible
        trigger={<span className={styles.timelineTrigger}><CalendarDays size={16} aria-hidden="true" /><span>Хронологія доставок</span></span>}
        isOpen={props.chronologyOpen}
        onOpenChange={props.onChronologyOpenChange}
      >
        <div className={styles.timelineContent}>
          <div className={styles.timelineMeta}>
            <span>{timeline.visibleEvents.length} з 13 груп · {timeline.rangeLabel}</span>
            <div aria-label="Легенда хронології">
              <StatusDot label="Прибуло" variant="success" />
              <StatusDot label="В дорозі" variant="accent" />
              <StatusDot label="Майбутні" variant="neutral" />
            </div>
          </div>
          <div className={styles.monthScroller} role="region" aria-label={`Хронологія доставок: ${timeline.rangeLabel}`} tabIndex={0}>
            <ol className={styles.monthGrid}>
              {timeline.months.map((month) => (
                <li key={month.id} className={month.current ? styles.currentMonth : undefined}>
                  <div><strong>{month.label}</strong>{month.current ? <Badge label="Сьогодні" variant="warning" /> : null}</div>
                  <span className={styles.monthAxis} aria-hidden="true">
                    {month.groups.map((group) => <i key={group.arrivalDate} data-status={group.status} />)}
                  </span>
                  <small>{month.eventCount ? `${scheduleTimelineGroupLabel(month.eventCount)} · ${month.quantity} од.` : "—"}</small>
                </li>
              ))}
            </ol>
          </div>
          {timeline.dateGroups.length ? (
            <div className={styles.timelineAgenda}>
              <div className={styles.sectionHeading}><strong>Доставки за датами</strong><small>{timeline.dateGroups.length} дат · {scheduleTimelineGroupLabel(timeline.visibleEvents.length)}</small></div>
              <ol aria-label="Доставки, згруповані за датами">
                {timeline.dateGroups.map((group) => (
                  <li key={group.arrivalDate}>
                    <header><time dateTime={group.arrivalDate}>{formatScheduleTimelineDate(group.arrivalDate).slice(0, 5)}</time><small>{scheduleTimelineGroupLabel(group.events.length)}</small></header>
                    <ul>
                      {group.events.map((event) => (
                        <li key={event.id}>
                          <StatusDot label={scheduleTimelineStatusLabel(event.status)} variant={statusDotVariant(event.status)} />
                          <strong>{event.category}{event.slotCount > 1 ? ` ×${event.slotCount}` : ""}</strong>
                          <small>{scheduleTimelineSlotLabel(event.slotCount)} · {event.free} вільно</small>
                          <b>{event.quantity} од.</b>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          ) : <EmptyState isCompact title="У цьому періоді немає доставок" description="Збільште кількість місяців назад або вперед." />}
        </div>
      </Collapsible>
    </Card>
  );
}

const detailColumns: TableColumn<DetailRow>[] = [
  {key: "sku", header: "SKU", width: pixel(110)},
  {key: "model", header: "Модель", width: proportional(2)},
  {key: "total", header: "Усього", align: "end", width: pixel(86)},
  {key: "free", header: "Вільно", align: "end", width: pixel(86)},
];

const searchColumns: TableColumn<SearchRow>[] = [
  {key: "model", header: "Модель", width: proportional(2), renderCell: (row) => <div><Text weight="semibold">{row.model}</Text><Text type="supporting" color="secondary" display="block">{row.sku}</Text></div>},
  {key: "slotName", header: "Слот", width: proportional(1), renderCell: (row) => <div>{row.slotName}<Text type="supporting" color="secondary" display="block">{row.arrival}</Text></div>},
  {key: "total", header: "Усього", align: "end", width: pixel(86)},
  {key: "free", header: "Вільно", align: "end", width: pixel(86)},
];

const stockColumns: TableColumn<StockRow>[] = [
  {key: "model", header: "Модель", width: proportional(2)},
  {key: "category", header: "Категорія", width: pixel(110), renderCell: (row) => <Badge label={row.category} variant="neutral" />},
  {key: "location", header: "Розташування", width: proportional(1)},
  {key: "total", header: "Усього", align: "end", width: pixel(80)},
  {key: "reserved", header: "Резерв", align: "end", width: pixel(80)},
  {key: "free", header: "Вільно", align: "end", width: pixel(80)},
];

function SlotDetail({slot, detailPage, onDetailPageChange}: {slot: ScheduleSlot | null; detailPage: number; onDetailPageChange: (page: number) => void}) {
  if (!slot) return <Card className={styles.detailCard} padding={4}><EmptyState title="Оберіть слот доставки" description="Деталі та склад вибраного слоту з’являться тут." icon={<CalendarDays size={24} />} /></Card>;
  const hasPages = slot.id === "pwc-march-2026-1";
  const lines = hasPages ? (detailPage === 1 ? slot.lines.slice(0, 9) : slot.lines.slice(9)) : slot.lines;
  const rows: DetailRow[] = lines.map((line) => ({...line}));
  const pageCount = hasPages ? 2 : 1;
  return (
    <Card className={styles.detailCard} padding={4}>
      <div className={styles.sectionHeading}><div><Badge label={slot.category} variant="neutral" /><h2>{slot.detailTitle}</h2></div><Text type="supporting" color="secondary">Прибуття {slot.arrival} · оплата {slot.paymentDue}</Text></div>
      {rows.length ? <Table aria-label={`Склад слоту ${slot.name}`} data={[...rows]} columns={detailColumns} idKey="id" density="compact" dividers="rows" /> : <EmptyState isCompact title="Детальних позицій поки немає" description="Основні дані слоту доступні у списку." />}
      {rows.length ? <div className={styles.pagination}><Button label="Попередня сторінка складу слоту" variant="secondary" size="sm" icon={<ChevronLeft size={14} />} isDisabled={detailPage === 1} onClick={() => onDetailPageChange(Math.max(1, detailPage - 1))} /><span>{detailPage} / {pageCount}</span><Button label="Наступна сторінка складу слоту" variant="secondary" size="sm" icon={<ChevronRight size={14} />} isDisabled={detailPage === pageCount} onClick={() => onDetailPageChange(Math.min(pageCount, detailPage + 1))} /></div> : null}
    </Card>
  );
}

function Deliveries(props: ScheduleViewProps) {
  const {onSelectedIdChange} = props;
  const visibleSlots = useMemo(() => filterScheduleSlots(props.page, props.category), [props.category, props.page]);
  const selectedSlot = findScheduleSlot(props.selectedId);
  const results = useMemo(() => filterScheduleSearchResults(props.query, props.category), [props.category, props.query]);
  const slotRows: SlotRow[] = visibleSlots.map((slot) => ({...slot}));
  const searchRows: SearchRow[] = results.map((result) => ({...result}));
  const slotColumns = useMemo<TableColumn<SlotRow>[]>(() => [
    {key: "name", header: "Назва", width: proportional(2), renderCell: (row) => <div><Button label={row.name} variant="ghost" size="sm" onClick={() => onSelectedIdChange(row.id)}>{row.name}</Button><Text type="supporting" color="secondary" display="block">Оплата до: {row.paymentDue}</Text></div>},
    {key: "status", header: "Статус", width: pixel(120), renderCell: (row) => <Badge label={scheduleTimelineStatusLabel(row.status)} variant={badgeVariant(row.status)} />},
    {key: "arrival", header: "Прибуття", width: pixel(112)},
    {key: "free", header: "Вільно", align: "end", width: pixel(80), renderCell: (row) => `${row.free}/${row.total}`},
  ], [onSelectedIdChange]);

  return (
    <section id="astryx-schedule-deliveries" role="tabpanel" className={styles.deliveryStack}>
      <div className={styles.toolbar}>
        <TextInput label="Пошук SKU або моделі" isLabelHidden value={props.query} onChange={props.onQueryChange} placeholder="Пошук SKU або моделі..." hasClear width="100%" />
        <div className={styles.categoryWide}>
          <SegmentedControl label="Категорії слотів доставки" value={props.category} onChange={(value) => props.onCategoryChange(value as ScheduleViewProps["category"])} layout="fill">
            {scheduleCategoryFilters.map((filter) => <SegmentedControlItem key={filter.id} value={filter.id} label={filter.label} />)}
          </SegmentedControl>
        </div>
        <div className={styles.categoryCompact}>
          <Selector label="Категорії слотів доставки" isLabelHidden value={props.category} onChange={(value) => props.onCategoryChange((value ?? "all") as ScheduleViewProps["category"])} options={scheduleCategoryFilters.map((filter) => ({value: filter.id, label: filter.label}))} />
        </div>
      </div>

      {normalizeScheduleSearch(props.query) ? (
        <Card padding={4}>
          <div className={styles.sectionHeading}><h2>Результати пошуку</h2><small>{searchRows.length} позицій</small></div>
          {searchRows.length ? <Table aria-label="Результати пошуку у графіку доставки" data={searchRows} columns={searchColumns} idKey="id" density="compact" dividers="rows" /> : <EmptyState title="Позиції не знайдено" description="Змініть запит або категорію." />}
        </Card>
      ) : (
        <div className={styles.deliveryGrid}>
          <Card padding={4}>
            <div className={styles.sectionHeading}><div><Ship size={18} aria-hidden="true" /><h2>Слоти доставки</h2></div><Badge label="23" variant="info" /></div>
            {slotRows.length ? <Table aria-label="Слоти доставки" data={slotRows} columns={slotColumns} idKey="id" density="compact" dividers="rows" /> : <EmptyState title="Для цієї сторінки немає рядків" description="Скористайтеся пагінацією або змініть категорію." />}
            <div className={styles.pagination}><Button label="Попередня сторінка слотів" variant="secondary" size="sm" icon={<ChevronLeft size={14} />} isDisabled={props.page === 1} onClick={() => props.onPageChange(Math.max(1, props.page - 1))} /><span>{props.page} / {scheduleSourceTotals.pages}</span><Button label="Наступна сторінка слотів" variant="secondary" size="sm" icon={<ChevronRight size={14} />} isDisabled={props.page === scheduleSourceTotals.pages} onClick={() => props.onPageChange(Math.min(scheduleSourceTotals.pages, props.page + 1))} /></div>
          </Card>
          <SlotDetail slot={selectedSlot} detailPage={props.detailPage} onDetailPageChange={props.onDetailPageChange} />
        </div>
      )}
    </section>
  );
}

function Stock() {
  const rows: StockRow[] = scheduleStockRows.map((row) => ({...row}));
  return (
    <section id="astryx-schedule-stock" role="tabpanel">
      <Card padding={4}>
        <div className={styles.sectionHeading}><div><Warehouse size={18} aria-hidden="true" /><h2>Складські запаси</h2></div><Text type="supporting" color="secondary">5 категорій · 33 од.</Text></div>
        <Table aria-label="Складські запаси" data={rows} columns={stockColumns} idKey="id" density="compact" dividers="rows" />
      </Card>
    </section>
  );
}

export default function AstryxAdminScheduleView(props: ScheduleViewProps & AstryxRendererViewProps) {
  const {renderedDesignSystem} = useAppearance();
  const isRendererActive = renderedDesignSystem === "astryx";
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(props.onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [props.onReady]);

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-admin-schedule-renderer="astryx">
        <header className={styles.header}>
          <div className={styles.headerCopy}><span aria-hidden="true"><CalendarDays size={20} /></span><div><h1>Графік доставки</h1><p>План прибуття техніки, доступні слоти та складські залишки.</p></div></div>
          <div className={styles.actions} data-schedule-actions>
            <Button label="Відкрити Excel" icon={<ExternalLink size={14} />} variant="secondary" isDisabled tooltip="Потрібне підключення робочої книги" aria-describedby="schedule-actions-safety" />
            <Button label="Синхронізувати" icon={<RefreshCw size={14} />} variant="primary" isDisabled tooltip="Потрібне підключення інтеграції 1С" aria-describedby="schedule-actions-safety" />
          </div>
          <p id="schedule-actions-safety" className={styles.actionHelp}><LockKeyhole size={13} /> Дії стануть доступні після підключення Excel та інтеграції 1С.</p>
        </header>

        <section className={styles.kpiGrid} aria-label="Показники графіка доставки">
          {scheduleKpis.map((kpi) => <Card key={kpi.id} padding={4} variant={kpi.id === "overdue" ? "red" : kpi.id === "stock" ? "orange" : kpi.id === "units" ? "green" : "blue"}><Text type="supporting" color="secondary" display="block">{kpi.label}</Text><strong>{kpi.value}</strong>{kpi.helper ? <small>{kpi.helper}</small> : null}</Card>)}
        </section>

        <Timeline {...props} isRendererActive={isRendererActive} />

        <TabList aria-label="Графік доставки" value={props.activeTab} onChange={(value) => props.onActiveTabChange(value as ScheduleViewProps["activeTab"])} layout="fill" hasDivider>
          <Tab value="deliveries" label="Доставки" />
          <Tab value="stock" label="Складські запаси" />
        </TabList>
        {props.activeTab === "deliveries" ? <Deliveries {...props} /> : <Stock />}

        <footer className={styles.footer}><span>Остання перевірка: <strong>{scheduleSourceTotals.lastChecked}</strong></span><span>Остання синхр.: <strong>{scheduleSourceTotals.lastSynced}</strong></span><span>{scheduleSourceTotals.slots} слотів · {scheduleSourceTotals.positions} позицій · {scheduleSourceTotals.stock} на складі</span></footer>
      </main>
    </AstryxBrpUiProvider>
  );
}
