"use client";

import {Fragment, useLayoutEffect} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {DateInput} from "@astryxdesign/core/DateInput";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {Pagination} from "@astryxdesign/core/Pagination";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {ISODateString} from "@astryxdesign/core/Calendar";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  LockKeyhole,
  RefreshCw,
  Search,
  SearchX,
  Truck,
  X,
} from "lucide-react";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {
  UNIT_SHIPPING_CATEGORIES,
  bossWebOrderNumber,
  type UnitShippingCategory,
  type UnitShippingTab,
} from "@/lib/admin-unit-shipping-data";
import type {AdminUnitShippingModel} from "./admin-unit-shipping-page";
import styles from "./astryx-admin-ocean-unit.module.css";

const categoryOptions = UNIT_SHIPPING_CATEGORIES.map((category) => ({
  value: category,
  label: category === "Всі" ? "Усі типи" : category,
}));

function isCategory(value: string): value is UnitShippingCategory {
  return UNIT_SHIPPING_CATEGORIES.some((category) => category === value);
}

function isTab(value: string): value is UnitShippingTab {
  return value === "remaining" || value === "shipped";
}

function UnitShippingTable({model}: {model: AdminUnitShippingModel}) {
  return (
    <Card padding={0} width="100%">
      <div className={styles.tableScroller} role="region" aria-label="Таблиця відвантажень" tabIndex={0}>
        <table className={`${styles.table} ${styles.unitTable}`}>
          <thead>
            <tr>
              <th>Статус</th>
              <th>{model.activeTab === "shipped" ? "Дата відвантаження" : "Дата/тиждень"}</th>
              <th>BRP Замовлення №</th>
              <th>Модель №</th>
              <th>Опис моделі</th>
              <th>Колір</th>
              <th>К-сть</th>
              <th>Період доставки</th>
              <th>Програма продажу</th>
              <th>Куди</th>
            </tr>
          </thead>
          <tbody>
            {model.pageRecords.map((record) => {
              const orderNumber = bossWebOrderNumber(record);
              const expanded = model.expandedOrderId === record.id;
              const canExpand = model.activeTab === "shipped" && record.vins.length > 0;
              return (
                <Fragment key={record.id}>
                  <tr>
                    <td>{model.activeTab === "shipped" ? <Badge variant="success" label="Load shipped" /> : <Badge variant="neutral" label="Очікує" />}</td>
                    <td>{model.activeTab === "shipped" ? record.shippedAt : record.dateOrWeek}</td>
                    <td>
                      {canExpand ? (
                        <button type="button" className={styles.disclosureButton} aria-expanded={expanded} aria-label={`Показати або приховати VIN за замовленням ${orderNumber}`} onClick={() => model.toggleOrder(record.id)}>
                          <span className={styles.mono}>{orderNumber}</span>{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      ) : <span className={styles.mono}>{orderNumber}</span>}
                    </td>
                    <td className={styles.mono}>{record.model.number}</td>
                    <td>{record.model.description}</td>
                    <td>{record.model.color}</td>
                    <td>{record.order.quantity}</td>
                    <td>{record.order.deliveryPeriod}</td>
                    <td>{record.order.salesProgram}</td>
                    <td>{record.order.destination}</td>
                  </tr>
                  {expanded ? (
                    <tr className={styles.detailRow}>
                      <td colSpan={10}>
                        <section className={styles.vinPanel}>
                          <div className={styles.containerFacts}>
                            <span><b>Замовлення:</b> {orderNumber}</span>
                            <span><b>Сегмент:</b> {record.order.number} - {record.order.segment}</span>
                            <span><b>Модель:</b> {record.model.number}</span>
                            <span><b>Опис:</b> {record.model.description}</span>
                          </div>
                          <div className={styles.tableScroller} role="region" aria-label={`Серійні номери замовлення ${orderNumber}`} tabIndex={0}>
                            <table className={`${styles.table} ${styles.vinTable}`}>
                              <thead><tr><th>Серійний номер (VIN)</th><th>Дата відвантаження</th><th>#</th></tr></thead>
                              <tbody>{record.vins.map((vin) => <tr key={vin.serialNumber}><td className={styles.mono}>{vin.serialNumber}</td><td className={styles.mono}>{vin.shippedAt}</td><td>{vin.index}</td></tr>)}</tbody>
                            </table>
                          </div>
                          <Text color="secondary">{record.vins.length} серійних номерів</Text>
                        </section>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {model.pageRecords.length === 0 ? <EmptyState title="Записи відвантаження не знайдено" description="Змініть пошуковий запит або скиньте фільтри." icon={<SearchX size={26} />} /> : null}
      </div>
      <footer className={styles.paginationFooter}>
        <Text color="secondary">{model.filteredRecords.length} записів загалом</Text>
        <Pagination
          page={model.currentPage}
          onChange={model.setPage}
          totalItems={model.filteredRecords.length}
          pageSize={model.pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageSizeChange={model.setPageSize}
          variant="compact"
          label="Пагінація відвантажень"
        />
      </footer>
    </Card>
  );
}

function Filters({model}: {model: AdminUnitShippingModel}) {
  return (
    <Card padding={3} width="100%">
      <div className={styles.toolbar}>
        <div className={styles.searchGrow}>
          <TextInput label="Пошук замовлення або моделі" value={model.query} onChange={model.setQuery} placeholder="Пошук замовлення, моделі..." isLabelHidden startIcon={<Search size={15} />} width="100%" />
        </div>
        <Selector label="Тип техніки" options={categoryOptions} value={model.category} onChange={(value) => { if (isCategory(value)) model.selectCategory(value); }} isLabelHidden width={170} />
        <Selector label="Період доставки" options={[{value: "", label: "Всі періоди"}, ...model.periods.map((period) => ({value: period, label: period}))]} value={model.period} onChange={model.setPeriod} isLabelHidden width={160} />
        <Selector label="Модель" options={[{value: "", label: "Всі моделі"}, ...model.models.map((item) => ({value: item.number, label: `${item.number} · ${item.description}`}))]} value={model.modelNumber} onChange={model.setModelNumber} isLabelHidden width={220} hasSearch />
        {model.activeTab === "shipped" ? <><DateInput label="Дата відвантаження з" value={(model.shippedFrom || undefined) as ISODateString | undefined} onChange={(value) => model.setShippedFrom(value ?? "")} isLabelHidden width={155} hasClear /><DateInput label="Дата відвантаження по" value={(model.shippedTo || undefined) as ISODateString | undefined} onChange={(value) => model.setShippedTo(value ?? "")} isLabelHidden width={155} hasClear /></> : null}
        <Button label="Скинути фільтри" variant="ghost" icon={<X size={14} />} isIconOnly onClick={model.resetFilters} />
      </div>
      <Text className={styles.toolbarMeta} color="secondary" display="block">Показано {model.filteredRecords.length} з {model.activeRecords.length}</Text>
    </Card>
  );
}

export function AstryxAdminUnitShippingView({model, onReady}: {model: AdminUnitShippingModel} & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
      <div className={styles.page} data-admin-unit-shipping-renderer="astryx" data-brp-admin-fulfillment-renderer="astryx">
        <header className={styles.pageHeader}>
          <span className={styles.pageIcon}><Truck size={22} aria-hidden="true" /></span>
          <div className={styles.pageTitle}>
            <Heading level={1}>Відвантаження техніки</Heading>
            <Text color="secondary">Інформація про відвантаження з BossWeb</Text>
            <div className={styles.headerMeta}><Text color="secondary"><Clock3 size={13} aria-hidden="true" /> Остання синхр.: 28 May 2026, 15:36</Text><Badge variant="neutral" label="До відвантаження: 34 / Відвантажено: 84" /></div>
          </div>
          <div className={styles.syncPanel}>
            <DateInput label="Shipped: з" value={model.syncFrom as ISODateString} onChange={(value) => model.setSyncFrom(value ?? "")} width={150} />
            <DateInput label="Shipped: по" value={model.syncTo as ISODateString} onChange={(value) => model.setSyncTo(value ?? "")} width={150} />
            <Button label="Синхр. з BossWeb" variant="primary" icon={<RefreshCw size={14} />} isDisabled tooltip="Зовнішня синхронізація недоступна: доступ лише для читання." />
          </div>
        </header>
        <Banner status="info" title="Локальний діапазон дат" description={<span className={styles.inlineCopy}><LockKeyhole size={13} aria-hidden="true" /> Дати змінюються лише локально; зовнішня синхронізація заблокована.</span>} />
        <SegmentedControl label="Стан відвантаження" value={model.activeTab} onChange={(value) => { if (isTab(value)) model.selectTab(value); }} layout="hug">
          <SegmentedControlItem value="remaining" label={`Залишок до відвантаження (${model.remainingFiltered.length})`} />
          <SegmentedControlItem value="shipped" label={`Відвантажені замовлення (${model.shippedFiltered.length})`} />
        </SegmentedControl>
        <Filters model={model} />
        <UnitShippingTable model={model} />
      </div>
    </AstryxBrpUiProvider>
  );
}

