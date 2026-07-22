"use client";

import {useLayoutEffect, useMemo} from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Grid2X2,
  History,
  LayoutList,
  Package,
  PackageCheck,
  RefreshCw,
  ScanLine,
  Search,
  Truck,
  Upload,
  Warehouse,
  X,
} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Pagination} from "@astryxdesign/core/Pagination";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {TextInput} from "@astryxdesign/core/TextInput";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {
  receiptSummaryMetrics,
  receiptSummaryRows,
  warehouseFulfillmentMetrics,
  warehouseFulfillmentOrders,
  warehouseInventoryPartRows,
  warehouseInventoryShipmentRows,
  warehouseInventoryTotals,
  warehousePartsShipmentFilters,
  warehousePlacementRows,
  warehousePlacementSummary,
  warehouseProcessTabs,
  warehouseShipments,
  warehouseShortageMetrics,
  warehouseShortages,
  type ReceiptSummaryFilter,
  type ReceiptSummaryView,
  type WarehouseFulfillmentFilter,
  type WarehouseFulfillmentView,
  type WarehousePartsShipmentFilter,
  type WarehouseProcessId,
  type WarehouseShortageView,
} from "@/lib/admin-warehouse-data";
import type {AdminWarehouseModel, InventorySummaryView} from "./admin-warehouse-page";
import styles from "./astryx-admin-warehouse.module.css";

type KpiTone = "neutral" | "blue" | "green" | "amber" | "orange";

const receiptFilters: ReadonlyArray<{value: ReceiptSummaryFilter; label: string}> = [
  {value: "all", label: "Усі"},
  {value: "crm", label: "CRM"},
  {value: "legacy", label: "Legacy"},
];

const shortageViews: ReadonlyArray<{
  value: WarehouseShortageView;
  label: string;
  heading: string;
  empty: string;
}> = [
  {value: "active", label: "Активні", heading: "Очікують перевірки", empty: "Немає активних нестач"},
  {value: "history", label: "Історія", heading: "Додано до консолідації", empty: "Поки немає позицій в історії"},
  {value: "surplus", label: "Надлишок", heading: "Надлишки при прийманні", empty: "Немає невирішених надлишків"},
];

const fulfillmentFilters: ReadonlyArray<{value: WarehouseFulfillmentFilter; label: string}> = [
  {value: "all", label: "Всі"},
  {value: "in-progress", label: "В роботі"},
  {value: "completed", label: "Завершені"},
  {value: "backorder", label: "Бекордер"},
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function formatEur(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function KpiGrid({items}: {
  items: ReadonlyArray<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    tone?: KpiTone;
    helper?: string;
  }>;
}) {
  return (
    <section className={styles.kpiGrid} aria-label="Показники складу">
      {items.map((item) => (
        <Card key={item.label} className={styles.kpiCard} padding={3}>
          <span className={styles.kpiIcon} data-tone={item.tone ?? "neutral"}>{item.icon}</span>
          <span className={styles.kpiCopy}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.helper ? <small>{item.helper}</small> : null}
          </span>
        </Card>
      ))}
    </section>
  );
}

function ProcessNavigation({model}: {model: AdminWarehouseModel}) {
  const options = warehouseProcessTabs.map((tab) => ({value: tab.id, label: tab.label}));
  return (
    <nav aria-label="Процеси складу">
      <div className={styles.processTabs}>
        <TabList
          aria-label="Процеси складу"
          value={model.activeProcess}
          onChange={(value) => model.setActiveProcess(value as WarehouseProcessId)}
          layout="fill"
          hasDivider
        >
          {warehouseProcessTabs.map((tab) => <Tab key={tab.id} value={tab.id} label={tab.label} />)}
        </TabList>
      </div>
      <div className={styles.processSelect}>
        <Selector
          label="Процес складу"
          value={model.activeProcess}
          onChange={(value) => model.setActiveProcess(value as WarehouseProcessId)}
          options={options}
          width="100%"
        />
      </div>
    </nav>
  );
}

function LockedButton({label, reason, icon, isIconOnly = false}: {
  label: string;
  reason: string;
  icon?: React.ReactNode;
  isIconOnly?: boolean;
}) {
  return (
    <Button
      label={label}
      icon={icon}
      isIconOnly={isIconOnly}
      isDisabled
      tooltip={reason}
      variant="secondary"
    />
  );
}

function DataNotice({shown, total, noun = "рядків"}: {shown: number; total: number; noun?: string}) {
  return <p className={styles.dataNotice}>Показано {shown} з {total} {noun}.</p>;
}

function ReceivingView({model}: {model: AdminWarehouseModel["receiving"]}) {
  const shipment = warehouseShipments.find((item) => item.id === model.shipmentId) ?? warehouseShipments[0];
  const receivingReason = "Запуск приймання недоступний: доступ лише для читання.";

  return (
    <section className={styles.section} aria-label="Приймання">
      <Card className={styles.toolbarCard} padding={3}>
        <div className={styles.receivingToolbar}>
          <Selector
            label="Постачання"
            isLabelHidden
            value={model.shipmentId}
            onChange={(value) => model.setShipmentId(value as AdminWarehouseModel["receiving"]["shipmentId"])}
            options={warehouseShipments.map((item) => ({
              value: item.id,
              label: `${item.proforma} · ${item.shipmentNumber} · ${item.status}`,
            }))}
            width="100%"
          />
          <div className={styles.actionRow}>
            <LockedButton label="Прийняти все" reason="Приймання всіх позицій недоступне: доступ лише для читання." icon={<PackageCheck size={15} />} />
            <LockedButton label="Почати приймання" reason={receivingReason} icon={<ScanLine size={15} />} />
            <LockedButton label="Прийняти (вже в 1С)" reason="Приймання в 1С недоступне: доступ лише для читання." icon={<CheckCircle2 size={15} />} />
          </div>
          <p className={styles.mobileReadOnly}>Операції приймання доступні лише для читання.</p>
        </div>
      </Card>

      <header className={styles.sectionHeader}>
        <div>
          <div className={styles.headingRow}>
            <h2>{shipment.proforma} · {shipment.shipmentNumber}</h2>
            <Badge label={shipment.status} variant="blue" />
          </div>
          <p>Маніфест {shipment.manifest.id} · {shipment.manifest.sourceLineCount} позицій packing list</p>
        </div>
      </header>

      <KpiGrid items={[
        {label: "Очікується", value: shipment.metrics.expectedUnits, icon: <Boxes size={17} />, tone: "blue"},
        {label: "Відскановано", value: shipment.metrics.scannedUnits, icon: <ScanLine size={17} />},
        {label: "Повністю", value: shipment.metrics.fullyReceivedUnits, icon: <PackageCheck size={17} />, tone: "green"},
        {label: "Відсутні / розбіжності", value: shipment.metrics.discrepancyCount, icon: <AlertTriangle size={17} />, tone: "orange"},
      ]} />

      <div className={styles.receivingGrid}>
        <Card className={styles.tableCard} padding={0}>
          <header className={styles.cardHeader}>
            <div><h3>Packing list</h3><p>{shipment.proforma} · склад маніфесту</p></div>
            <Badge label={`${shipment.manifest.sourceLineCount} позицій`} variant="neutral" />
          </header>
          <DataNotice shown={shipment.manifest.representativeLines.length} total={shipment.manifest.sourceLineCount} />
          <div className={styles.tableScroll} role="region" aria-label="Packing list" tabIndex={0}>
            <table className={styles.table}>
              <thead><tr><th>Артикул</th><th>Опис</th><th>К-ть</th><th>Скан</th></tr></thead>
              <tbody>{shipment.manifest.representativeLines.map((line) => (
                <tr key={line.id}><th scope="row">{line.partNumber}</th><td>{line.description}</td><td>{line.quantity}</td><td>{line.scannedQuantity ?? "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>

        <div className={styles.sideStack}>
          <Card className={styles.linkedCard} padding={4}>
            <span className={styles.sideIcon}><ClipboardList size={17} /></span>
            <div><span>Зв’язані замовлення</span><strong>{shipment.linkedSupplierOrderCount}</strong><p>Немає зв&apos;язаних замовлень</p></div>
          </Card>
          <Card className={styles.scanCard} padding={4}>
            <h3>Сканування</h3>
            <TextInput
              label="Сканування артикулу"
              isLabelHidden
              value=""
              isDisabled
              disabledMessage={receivingReason}
              placeholder="Спочатку почніть приймання..."
              width="100%"
            />
            <div className={styles.scanActions}>
              <LockedButton label="OK" reason={receivingReason} />
              <LockedButton label="Пошкоджено" reason={receivingReason} />
              <LockedButton label="Не той" reason={receivingReason} />
            </div>
            <p>Натисніть «Почати приймання» для початку</p>
            <div className={styles.emptyBox}>Немає сканів</div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function ReceiptSummaryView({model}: {model: AdminWarehouseModel["receiptSummary"]}) {
  const rows = useMemo(() => receiptSummaryRows.filter((row) => {
    if (model.shipment !== "all" && row.shipmentNumber !== model.shipment) return false;
    if (model.filter !== "all" && row.source !== model.filter) return false;
    const needle = normalize(model.query);
    return !needle || normalize(`${row.partNumber} ${row.shipmentNumber}`).includes(needle);
  }), [model.filter, model.query, model.shipment]);

  return (
    <section className={styles.section} aria-label="Зведення приймання">
      <KpiGrid items={[
        {label: "Артикулів", value: receiptSummaryMetrics.parts, icon: <Package size={17} />, tone: "blue"},
        {label: "CRM", value: receiptSummaryMetrics.crm, icon: <ClipboardList size={17} />, tone: "green"},
        {label: "Legacy поза CRM", value: receiptSummaryMetrics.legacyOutsideCrm, icon: <History size={17} />, tone: "amber"},
        {label: "Недоотримано", value: receiptSummaryMetrics.missing, icon: <AlertTriangle size={17} />, tone: "orange"},
      ]} />
      <Card className={styles.toolbarCard} padding={3}>
        <div className={styles.toolbar}>
          <TextInput label="Пошук за артикулом" isLabelHidden value={model.query} onChange={model.setQuery} placeholder="Пошук за артикулом…" hasClear width="100%" />
          <Selector
            label="Постачання"
            isLabelHidden
            value={model.shipment}
            onChange={model.setShipment}
            options={[
              {value: "all", label: "Усі відвантаження"},
              ...warehouseShipments.map((item) => ({value: item.shipmentNumber, label: `${item.proforma} · ${item.shipmentNumber}`})),
            ]}
          />
          <SegmentedControl label="Джерело приймання" value={model.filter} onChange={(value) => model.setFilter(value as ReceiptSummaryFilter)} layout="fill">
            {receiptFilters.map((item) => <SegmentedControlItem key={item.value} value={item.value} label={item.label} />)}
          </SegmentedControl>
          <SegmentedControl label="Вигляд зведення приймання" value={model.view} onChange={(value) => model.setView(value as ReceiptSummaryView)} layout="fill">
            <SegmentedControlItem value="parts" label="За артикулами" />
            <SegmentedControlItem value="shipments" label="До відвантаження" />
          </SegmentedControl>
          <div className={styles.actionRow}>
            <LockedButton label="Оновити" reason="Оновлення недоступне: доступ лише для читання." icon={<RefreshCw size={15} />} />
            <LockedButton label="Експорт" reason="Експорт недоступний: доступ лише для читання." icon={<Download size={15} />} />
          </div>
        </div>
      </Card>
      <Card className={styles.emptyCard} padding={4}>
        {rows.length === 0 ? <EmptyState isCompact title="Поки немає прийнятого товару" description="Приймання ще не запускалося; усі показники дорівнюють нулю." icon={<PackageCheck size={28} />} /> : null}
      </Card>
    </section>
  );
}

function ShortagesView({model}: {model: AdminWarehouseModel["shortages"]}) {
  const activeView = shortageViews.find((item) => item.value === model.view) ?? shortageViews[0];
  const rows = useMemo(() => {
    const needle = normalize(model.query);
    return warehouseShortages.filter((item) => {
      if (model.view === "surplus" && item.kind !== "surplus") return false;
      if (model.view !== "surplus" && item.kind === "surplus") return false;
      return !needle || normalize(`${item.partNumber} ${item.shipmentNumber}`).includes(needle);
    });
  }, [model.query, model.view]);

  return (
    <section className={styles.section} aria-label="Нестачі">
      <KpiGrid items={[
        {label: "Очікують", value: warehouseShortageMetrics.waiting, icon: <History size={17} />, tone: "amber"},
        {label: "Пошкоджені", value: warehouseShortageMetrics.damaged, icon: <AlertTriangle size={17} />, tone: "orange"},
        {label: "Не та деталь", value: warehouseShortageMetrics.wrongPart, icon: <X size={17} />, tone: "orange"},
        {label: "Надлишок", value: warehouseShortageMetrics.surplus, icon: <Boxes size={17} />, tone: "blue"},
      ]} />
      <Card className={styles.toolbarCard} padding={3}>
        <div className={styles.toolbarCompact}>
          <TextInput label="Пошук за артикулом або постачанням" isLabelHidden value={model.query} onChange={model.setQuery} placeholder="Пошук за артикулом або постачанням..." hasClear width="100%" />
          <SegmentedControl label="Стани нестач" value={model.view} onChange={(value) => model.setView(value as WarehouseShortageView)} layout="fill">
            {shortageViews.map((item) => <SegmentedControlItem key={item.value} value={item.value} label={item.label} />)}
          </SegmentedControl>
          <LockedButton label="Оновити" reason="Оновлення нестач недоступне: доступ лише для читання." icon={<RefreshCw size={15} />} />
        </div>
      </Card>
      <Card className={styles.emptyCard} padding={0}>
        <h3 className={styles.cardTitle}>{activeView.heading}</h3>
        {rows.length === 0 ? <EmptyState isCompact title={activeView.empty} description={model.query ? "Пошук у поточному стані не дав результатів." : "Позицій у цьому стані немає."} icon={<AlertTriangle size={28} />} /> : null}
      </Card>
    </section>
  );
}

function FulfillmentView({model}: {model: AdminWarehouseModel["fulfillment"]}) {
  const orders = useMemo(() => {
    const needle = normalize(model.query);
    return warehouseFulfillmentOrders.filter((order) => {
      if (model.filter !== "all" && order.status !== model.filter) return false;
      return !needle || normalize(`${order.orderNumber} ${order.supplier}`).includes(needle);
    });
  }, [model.filter, model.query]);

  return (
    <section className={styles.section} aria-label="Виконання">
      <KpiGrid items={[
        {label: "Всього замовлень", value: warehouseFulfillmentMetrics.totalOrders, icon: <ClipboardList size={17} />, tone: "blue"},
        {label: "Відправлено", value: warehouseFulfillmentMetrics.shipped, icon: <Truck size={17} />},
        {label: "Отримано", value: warehouseFulfillmentMetrics.received, icon: <PackageCheck size={17} />, tone: "green"},
        {label: "Бекордер", value: warehouseFulfillmentMetrics.backorder, icon: <History size={17} />, tone: "amber"},
      ]} />
      <Card className={styles.toolbarCard} padding={3}>
        <div className={styles.toolbar}>
          <TextInput label="Пошук замовлень" isLabelHidden value={model.query} onChange={model.setQuery} placeholder="Пошук замовлень..." hasClear width="100%" />
          <SegmentedControl label="Статус виконання" value={model.filter} onChange={(value) => model.setFilter(value as WarehouseFulfillmentFilter)} layout="fill">
            {fulfillmentFilters.map((item) => <SegmentedControlItem key={item.value} value={item.value} label={item.label} />)}
          </SegmentedControl>
          <SegmentedControl label="Вигляд виконання" value={model.view} onChange={(value) => model.setView(value as WarehouseFulfillmentView)} layout="fill">
            <SegmentedControlItem value="list" label="Список" icon={<LayoutList size={15} />} />
            <SegmentedControlItem value="kanban" label="Kanban" icon={<Grid2X2 size={15} />} />
          </SegmentedControl>
          <LockedButton label="Перезіставити" reason="Перезіставлення недоступне: доступ лише для читання." icon={<RefreshCw size={15} />} />
        </div>
      </Card>
      <Card className={styles.emptyCard} padding={4}>
        {model.view === "list" ? (
          orders.length === 0 ? <EmptyState isCompact title="Немає замовлень постачальнику" description="Список виконання порожній." icon={<ClipboardList size={28} />} /> : null
        ) : (
          <div className={styles.kanban} aria-label="Kanban виконання">
            {["Очікують", "В роботі", "Завершені"].map((label) => (
              <Card key={label} variant="muted" padding={3}><header><strong>{label}</strong><Badge label="0" /></header><p>Немає замовлень</p></Card>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

function InventoryParts({model}: {model: AdminWarehouseModel["inventory"]}) {
  const rows = useMemo(() => {
    const needle = normalize(model.query);
    return warehouseInventoryPartRows.filter((row) => {
      if (model.shipmentFilter !== "all" && row.shipment !== model.shipmentFilter) return false;
      return !needle || normalize(`${row.partNumber} ${row.description} ${row.shipment}`).includes(needle);
    });
  }, [model.query, model.shipmentFilter]);

  if (!rows.length) return <Card padding={4}><EmptyState isCompact title="Нічого не знайдено" description="Змініть пошук або фільтр постачання." icon={<Search size={28} />} /></Card>;

  return (
    <Card className={styles.tableCard} padding={0}>
      <DataNotice shown={rows.length} total={warehouseInventoryTotals.parts} noun="деталей" />
      <div className={styles.tableScroll} role="region" aria-label="Зведення за деталями" tabIndex={0}>
        <table className={`${styles.table} ${styles.inventoryTable}`}>
          <thead><tr><th>Артикул</th><th>Опис</th><th>Постачання</th><th>Відправлено</th><th>Отримано</th><th>€ шт.</th><th>€ всього</th><th>Стан</th><th>Розподіл</th></tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id}><th scope="row">{row.partNumber}</th><td>{row.description}</td><td>{row.shipment}</td><td>{row.shipped}</td><td>{row.received}</td><td>{formatEur(row.unitEur)}</td><td>{formatEur(row.totalEur)}</td><td><Badge label={row.status} variant="error" /></td><td><Badge label={row.allocation} /></td></tr>
          ))}</tbody>
          <tfoot><tr><th colSpan={2}>{warehouseInventoryTotals.parts} деталей</th><td>Всього</td><td>{warehouseInventoryTotals.shipped}</td><td>{warehouseInventoryTotals.received}</td><td>—</td><td>{formatEur(warehouseInventoryTotals.totalEur)}</td><td colSpan={2}>—</td></tr></tfoot>
        </table>
      </div>
    </Card>
  );
}

function InventoryShipments({model}: {model: AdminWarehouseModel["inventory"]}) {
  const rows = useMemo(() => {
    const needle = normalize(model.query);
    return warehouseInventoryShipmentRows.filter((row) => {
      if (model.shipmentFilter !== "all" && row.proforma !== model.shipmentFilter) return false;
      return !needle || normalize(`${row.shipmentNumber} ${row.proforma}`).includes(needle);
    });
  }, [model.query, model.shipmentFilter]);

  if (!rows.length) return <Card padding={4}><EmptyState isCompact title="Нічого не знайдено" description="Змініть пошук або фільтр постачання." icon={<Search size={28} />} /></Card>;

  return (
    <Card className={styles.tableCard} padding={0}>
      <div className={styles.tableScroll} role="region" aria-label="Зведення за постачаннями" tabIndex={0}>
        <table className={styles.table}>
          <thead><tr><th>Постачання</th><th>Проформа</th><th>Позицій</th><th>Відправлено</th><th>EUR</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}><th scope="row">{row.shipmentNumber}</th><td>{row.proforma}</td><td>{row.positions}</td><td>{row.shipped}</td><td>{formatEur(row.totalEur)}</td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}

function InventoryView({model}: {model: AdminWarehouseModel["inventory"]}) {
  return (
    <section className={styles.section} aria-label="Зведення складу">
      <KpiGrid items={[
        {label: "Всього деталей", value: warehouseInventoryTotals.parts, icon: <Package size={17} />, tone: "blue"},
        {label: "Відправлено", value: warehouseInventoryTotals.shipped, icon: <Truck size={17} />},
        {label: "Отримано", value: warehouseInventoryTotals.received, icon: <PackageCheck size={17} />, tone: "green"},
        {label: "Всього EUR", value: formatEur(warehouseInventoryTotals.totalEur), icon: <FileSpreadsheet size={17} />, tone: "amber"},
      ]} />
      <Card className={styles.toolbarCard} padding={3}>
        <div className={styles.toolbar}>
          <TextInput label="Пошук артикулу" isLabelHidden value={model.query} onChange={model.setQuery} placeholder="Пошук артикулу..." hasClear width="100%" />
          <Selector
            label="Постачання"
            isLabelHidden
            value={model.shipmentFilter}
            onChange={(value) => model.setShipmentFilter(value as WarehousePartsShipmentFilter)}
            options={warehousePartsShipmentFilters.map((item) => ({value: item, label: item === "all" ? "Всі постачання" : item}))}
          />
          <Selector label="Дилер" isLabelHidden value={model.dealerFilter} onChange={model.setDealerFilter} options={[{value: "all", label: "Всі дилери"}]} />
          <SegmentedControl label="Вигляд складського зведення" value={model.view} onChange={(value) => model.setView(value as InventorySummaryView)} layout="fill">
            <SegmentedControlItem value="parts" label="За деталями" />
            <SegmentedControlItem value="shipments" label="За постачаннями" />
          </SegmentedControl>
          <LockedButton label="Експорт Excel" reason="Excel-експорт недоступний: доступ лише для читання." icon={<Download size={15} />} />
        </div>
      </Card>
      <p className={styles.helper}>Фільтри застосовуються до показаних позицій; підсумки відображають повний обсяг.</p>
      {model.view === "parts" ? <InventoryParts model={model} /> : <InventoryShipments model={model} />}
    </section>
  );
}

function PlacementView({model}: {model: AdminWarehouseModel["placement"]}) {
  const totalPages = Math.ceil(warehousePlacementSummary.total / warehousePlacementSummary.pageSize);
  const needle = normalize(model.query);
  const filteredRows = useMemo(() => warehousePlacementRows.filter((row) => (
    !needle || normalize(`${row.partNumber} ${row.description} ${row.cell} ${row.zone ?? ""}`).includes(needle)
  )), [needle]);
  const rows = needle ? filteredRows : model.page === 1 ? warehousePlacementRows : [];

  const changeQuery = (value: string) => {
    model.setQuery(value);
    model.setPage(1);
    model.setEditingId(null);
    model.setDraftCell("");
  };

  return (
    <section className={styles.section} aria-label="Розміщення на складі">
      <header className={styles.sectionHeader}><div><h2>Розміщення на складі</h2><p>{warehousePlacementSummary.total} позицій · складський реєстр</p></div></header>
      <Card className={styles.toolbarCard} padding={3}>
        <div className={styles.placementToolbar}>
          <TextInput label="Пошук за артикулом, коміркою або зоною" isLabelHidden value={model.query} onChange={changeQuery} placeholder="Пошук: артикул, комірка, зона…" hasClear width="100%" />
          <div className={styles.actionRow}>
            <LockedButton label="Оновити" reason="Оновлення складських даних недоступне: доступ лише для читання." icon={<RefreshCw size={15} />} />
            <LockedButton label="Експорт" reason="Експорт складських даних недоступний: доступ лише для читання." icon={<Download size={15} />} />
            <LockedButton label="Завантажити Excel" reason="Імпорт Excel недоступний: доступ лише для читання." icon={<Upload size={15} />} />
          </div>
        </div>
      </Card>
      <Card className={styles.tableCard} padding={0}>
        <DataNotice shown={rows.length} total={warehousePlacementSummary.total} noun="позицій" />
        {rows.length ? (
          <div className={styles.tableScroll} role="region" aria-label="Розміщення на складі" tabIndex={0}>
            <table className={`${styles.table} ${styles.placementTable}`}>
              <thead><tr><th>Артикул</th><th>Опис</th><th>Комірка</th><th>Зона</th><th>Залишок 1С</th><th>Джерело</th><th>Оновлено</th></tr></thead>
              <tbody>{rows.map((row) => {
                const editing = model.editingId === row.id;
                return (
                  <tr key={row.id}>
                    <th scope="row">{row.partNumber}</th><td>{row.description}</td>
                    <td>{editing ? (
                      <div className={styles.cellEditor}>
                        <TextInput label={`Комірка для ${row.partNumber}`} isLabelHidden value={model.draftCell} onChange={model.setDraftCell} hasAutoFocus />
                        <LockedButton label="Зберегти комірку" reason="Збереження комірки недоступне: доступ лише для читання." icon={<Check size={14} />} isIconOnly />
                        <Button label="Скасувати редагування комірки" icon={<X size={14} />} isIconOnly variant="ghost" onClick={() => { model.setEditingId(null); model.setDraftCell(""); }} />
                      </div>
                    ) : (
                      <Button label={`Переглянути редагування комірки ${row.cell} для ${row.partNumber}`} variant="secondary" onClick={() => { model.setEditingId(row.id); model.setDraftCell(row.cell); }}>{row.cell}</Button>
                    )}</td>
                    <td>{row.zone ?? "—"}</td><td>{row.oneCStock}</td><td>{row.source}</td><td>{row.updatedAt}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <EmptyState isCompact title="Для цієї сторінки немає позицій" description="Скористайтеся навігацією або змініть пошук." icon={<Package size={28} />} />}
        <div className={styles.pagination}>
          <Pagination
            page={model.page}
            onChange={(page) => { model.setPage(page); model.setEditingId(null); model.setDraftCell(""); }}
            totalItems={warehousePlacementSummary.total}
            pageSize={warehousePlacementSummary.pageSize}
            variant="count"
            isDisabled={Boolean(needle)}
            label="Пагінація розміщення"
          />
          <span>{model.page} з {totalPages}</span>
        </div>
      </Card>
    </section>
  );
}

export default function AstryxAdminWarehouseView({
  model,
  onReady,
}: {model: AdminWarehouseModel} & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  const panelId = `astryx-warehouse-${model.activeProcess}-panel`;

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-brp-admin-fulfillment-renderer="astryx">
        <header className={styles.pageHeader}>
          <span className={styles.pageIcon}><Warehouse size={21} /></span>
          <div><h1>Склад</h1><p>Приймайте постачання, розбирайте нестачі, керуйте виконанням і контролюйте готовність складу в одному процесі.</p></div>
        </header>
        <ProcessNavigation model={model} />
        <div id={panelId} role="tabpanel" className={styles.panel}>
          {model.activeProcess === "receiving" ? <ReceivingView model={model.receiving} /> : null}
          {model.activeProcess === "receipt-summary" ? <ReceiptSummaryView model={model.receiptSummary} /> : null}
          {model.activeProcess === "shortages" ? <ShortagesView model={model.shortages} /> : null}
          {model.activeProcess === "fulfillment" ? <FulfillmentView model={model.fulfillment} /> : null}
          {model.activeProcess === "inventory-summary" ? <InventoryView model={model.inventory} /> : null}
          {model.activeProcess === "placement" ? <PlacementView model={model.placement} /> : null}
        </div>
      </main>
    </AstryxBrpUiProvider>
  );
}
