"use client";

import {useLayoutEffect, useMemo} from "react";
import {Archive, Download, Eye, FileText, Landmark, LockKeyhole, Pencil, Plus, Upload} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Dialog} from "@astryxdesign/core/Dialog";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {MultiSelector} from "@astryxdesign/core/MultiSelector";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  formedInvoices,
  invoiceAppendices,
  invoiceAppendixSourceTotals,
  invoiceContracts,
  invoiceCostCards,
  invoiceCostKpis,
  invoiceCostMonths,
  invoicePageKpis,
  invoiceShipmentGroups,
  type FormedInvoice,
  type InvoiceAppendix,
  type InvoiceContract,
  type InvoiceCostCard,
  type InvoiceShipmentGroup,
} from "@/lib/admin-invoices-data";
import type {AdminInvoicesViewProps} from "./admin-invoices-page";
import styles from "./astryx-admin-invoices.module.css";

type ContractRow = Record<string, unknown> & InvoiceContract;
type AppendixRow = Record<string, unknown> & InvoiceAppendix;
type ShipmentRow = Record<string, unknown> & InvoiceShipmentGroup;
type FormedInvoiceRow = Record<string, unknown> & FormedInvoice;
type CostRow = Record<string, unknown> & InvoiceCostCard;

const tabLabels = {
  contracts: "Контракти",
  appendices: "Додатки",
  invoices: "Інвойси",
  cost: "Собівартість",
} as const;

const uploadLabels = {
  appendices: "Завантажити проформи",
  invoices: "Завантажити VIN",
  cost: "Завантажити документи",
} as const;

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function Kpis() {
  return (
    <section className={styles.kpis} aria-label="Показники інвойсів">
      {invoicePageKpis.map((item) => <Card key={item.id} padding={3}><span>{item.label}</span><strong>{item.value}</strong></Card>)}
    </section>
  );
}

function InvoiceDialog({title, open, onOpenChange, children}: {title: string; open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode}) {
  return <Dialog isOpen={open} onOpenChange={onOpenChange} width="min(680px, calc(100vw - 32px))" purpose="info"><div className={styles.dialog}><header><h2>{title}</h2><Button label="Закрити" variant="ghost" size="sm" onClick={() => onOpenChange(false)} /></header>{children}</div></Dialog>;
}

function Contracts(props: AdminInvoicesViewProps) {
  const rows = useMemo(() => {
    const query = normalize(props.contractsQuery);
    return !query ? invoiceContracts : invoiceContracts.filter((row) => normalize(`${row.shortNumber} ${row.supplier} ${row.buyer}`).includes(query));
  }, [props.contractsQuery]);
  const columns = useMemo<TableColumn<ContractRow>[]>(() => [
    {key: "shortNumber", header: "Контракт", width: pixel(126), renderCell: (row) => <Button label={row.shortNumber} variant="ghost" size="sm" onClick={() => props.onSelectedContractChange(row)} />},
    {key: "supplier", header: "Постачальник", width: proportional(2)},
    {key: "buyer", header: "Покупець", width: proportional(2)},
    {key: "id", header: "Дії", width: pixel(172), renderCell: (row) => <div className={styles.actions}><Button label={`Переглянути контракт ${row.shortNumber}`} icon={<Eye size={14} />} isIconOnly variant="ghost" onClick={() => props.onSelectedContractChange(row)} /><Button label={`Редагувати контракт ${row.shortNumber}`} icon={<Pencil size={14} />} isIconOnly variant="ghost" isDisabled tooltip="Редагування вимкнене у read-only клоні" /></div>},
  ], [props]);
  return <section className={styles.panel} role="tabpanel" aria-label="Контракти">
    <div className={styles.toolbar}><TextInput label="Пошук контрактів" isLabelHidden value={props.contractsQuery} onChange={props.onContractsQueryChange} placeholder="Пошук номера, постачальника або покупця..." hasClear width="100%" /><Button label="Новий контракт" icon={<Plus size={15} />} onClick={() => props.onContractsCreatingChange(true)} /></div>
    {rows.length ? <div className={styles.tableScroller} role="region" aria-label="Контракти" tabIndex={0}><Table aria-label="Контракти" data={rows.map((row) => ({...row}))} columns={columns} idKey="id" density="compact" dividers="rows" /></div> : <EmptyState isCompact title="Контрактів не знайдено" description="Змініть номер, постачальника або покупця у пошуку." />}
    <InvoiceDialog title="Новий контракт" open={props.contractsCreating} onOpenChange={props.onContractsCreatingChange}><p>Перевірте реквізити контракту перед створенням.</p><div className={styles.dialogActions}><Button label="Скасувати" variant="secondary" onClick={() => props.onContractsCreatingChange(false)} /><Button label="Створити контракт" icon={<LockKeyhole size={14} />} isDisabled tooltip="Створення контракту вимкнене у read-only клоні" /></div></InvoiceDialog>
    <InvoiceDialog title={props.selectedContract ? `Контракт ${props.selectedContract.shortNumber}` : "Контракт"} open={Boolean(props.selectedContract)} onOpenChange={(open) => !open && props.onSelectedContractChange(null)}><dl className={styles.details}>{props.selectedContract ? <><dt>Постачальник</dt><dd>{props.selectedContract.supplier}</dd><dt>Покупець</dt><dd>{props.selectedContract.buyer}</dd><dt>Повний номер</dt><dd>{props.selectedContract.detail.fullNumber}</dd></> : null}</dl></InvoiceDialog>
  </section>;
}

function Appendices(props: AdminInvoicesViewProps) {
  const rows = useMemo(() => {
    const query = normalize(props.appendicesQuery);
    return !query ? invoiceAppendices : invoiceAppendices.filter((row) => normalize(`${row.name} ${row.shipment} ${row.contractNumber}`).includes(query));
  }, [props.appendicesQuery]);
  const columns = useMemo<TableColumn<AppendixRow>[]>(() => [
    {key: "name", header: "Додаток", width: pixel(150), renderCell: (row) => <Button label={row.name} variant="ghost" size="sm" isDisabled={!row.preview} tooltip={row.preview ? undefined : "Повний preview не зафіксовано у source"} onClick={() => props.onSelectedAppendixChange(row)} />},
    {key: "shipment", header: "Відправка", width: proportional(1)}, {key: "eta", header: "ETA", width: pixel(94)}, {key: "contractNumber", header: "Контракт", width: pixel(120)}, {key: "amount", header: "Сума", width: pixel(118)},
    {key: "id", header: "Дії", width: pixel(180), renderCell: (row) => <div className={styles.actions}><Button label={`Переглянути ${row.name}`} icon={<Eye size={14} />} isIconOnly variant="ghost" isDisabled={!row.preview} tooltip={row.preview ? "Відкрити підтверджений документ" : "Повний preview не зафіксовано у source"} onClick={() => props.onSelectedAppendixChange(row)} /><Button label={`Митний документ ${row.name}`} icon={<Download size={14} />} isIconOnly variant="ghost" isDisabled tooltip="Генерація митного документа вимкнена" /><Button label={`Банківський документ ${row.name}`} icon={<Landmark size={14} />} isIconOnly variant="ghost" isDisabled tooltip="Генерація банківського документа вимкнена" /></div>},
  ], [props]);
  return <section className={styles.panel} role="tabpanel" aria-label="Додатки"><section className={styles.kpis} aria-label="Показники додатків"><Card padding={3}><span>Додатки</span><strong>{invoiceAppendixSourceTotals.appendices}</strong></Card><Card padding={3}><span>Проформи</span><strong>{invoiceAppendixSourceTotals.proformas}</strong></Card><Card padding={3}><span>Контейнери</span><strong>{invoiceAppendixSourceTotals.containers}</strong></Card><Card padding={3}><span>Найближчий ETA</span><strong>{invoiceAppendixSourceTotals.nearestEta}</strong></Card></section><div className={styles.toolbar}><TextInput label="Пошук додатків" isLabelHidden value={props.appendicesQuery} onChange={props.onAppendicesQueryChange} placeholder="Пошук додатка, відправки або контракту..." hasClear width="100%" /></div>{rows.length ? <div className={styles.tableScroller} role="region" aria-label="Додатки" tabIndex={0}><Table aria-label="Додатки" data={rows.map((row) => ({...row}))} columns={columns} idKey="id" density="compact" dividers="rows" /></div> : <EmptyState isCompact title="Додатків не знайдено" description="Змініть пошуковий запит." />}<InvoiceDialog title="Попередній перегляд документа" open={Boolean(props.selectedAppendix)} onOpenChange={(open) => !open && props.onSelectedAppendixChange(null)}>{props.selectedAppendix?.preview ? <><p>{props.selectedAppendix.name} · {props.selectedAppendix.contractNumber}</p><div className={styles.dialogActions}><Button label="Таможня DOCX" icon={<LockKeyhole size={14} />} isDisabled tooltip="Генерація митного DOCX вимкнена" /><Button label="Банк DOCX" icon={<LockKeyhole size={14} />} isDisabled tooltip="Генерація банківського DOCX вимкнена" /></div></> : null}</InvoiceDialog></section>;
}

function Invoices(props: AdminInvoicesViewProps) {
  const query = normalize(props.invoiceQuery);
  const shipments = useMemo(() => invoiceShipmentGroups.filter((row) => (props.invoiceFilter === "all" || row.filterState === props.invoiceFilter) && (!query || row.billOfLading.toLowerCase().includes(query))), [props.invoiceFilter, query]);
  const formed = useMemo(() => formedInvoices.filter((row) => !query || normalize(`${row.invoiceNumber} ${row.containerNumber}`).includes(query)), [query]);
  const columns = useMemo<TableColumn<ShipmentRow>[]>(() => [{key: "billOfLading", header: "Контейнер", width: pixel(136), renderCell: (row) => <Button label={`BL ${row.billOfLading}`} variant="ghost" size="sm" onClick={() => props.onInvoicePreviewChange({kind: "shipment", item: row})} />}, {key: "unitCount", header: "Одиниці", width: pixel(90)}, {key: "readiness", header: "Готовність", width: proportional(1), renderCell: (row) => <Badge label={row.readiness} variant="warning" />}, {key: "eta", header: "ETA", width: pixel(110)}, {key: "id", header: "Дії", width: pixel(154), renderCell: (row) => <div className={styles.actions}><Button label={`Переглянути BL ${row.billOfLading}`} icon={<Eye size={14} />} isIconOnly variant="ghost" onClick={() => props.onInvoicePreviewChange({kind: "shipment", item: row})} /><Button label="Сформувати BL" isDisabled tooltip="Формування BL вимкнене" size="sm" /></div>}], [props]);
  const formedColumns = useMemo<TableColumn<FormedInvoiceRow>[]>(() => [{key: "invoiceNumber", header: "Інвойс", width: proportional(1), renderCell: (row) => <Button label={row.invoiceNumber} variant="ghost" size="sm" onClick={() => props.onInvoicePreviewChange({kind: "formed", item: row})} />}, {key: "containerNumber", header: "Контейнер", width: pixel(130)}, {key: "total", header: "Сума", width: pixel(124)}, {key: "date", header: "Дата", width: pixel(110)}, {key: "id", header: "Дії", width: pixel(74), renderCell: (row) => <Button label={`Завантажити DOCX ${row.invoiceNumber}`} icon={<Download size={14} />} isIconOnly variant="ghost" isDisabled tooltip="Завантаження DOCX вимкнене" />}], [props]);
  return <section className={styles.panel} role="tabpanel" aria-label="Інвойси"><div className={styles.toolbar}><TextInput label="Пошук інвойсів" isLabelHidden value={props.invoiceQuery} onChange={props.onInvoiceQueryChange} placeholder="Пошук інвойсів..." hasClear width="100%" /><SegmentedControl label="Статус відвантажень" value={props.invoiceFilter} onChange={(value) => props.onInvoiceFilterChange(value as AdminInvoicesViewProps["invoiceFilter"])}>{[["all", "Всі"], ["in-transit", "В дорозі"], ["arrived", "Прибув"]].map(([value, label]) => <SegmentedControlItem key={value} value={value} label={label} />)}</SegmentedControl></div>{shipments.length ? <div className={styles.tableScroller} role="region" aria-label="Відвантаження для інвойсів" tabIndex={0}><Table aria-label="Відвантаження для інвойсів" data={shipments.map((row) => ({...row}))} columns={columns} idKey="id" density="compact" dividers="rows" /></div> : <EmptyState isCompact title="Відвантажень не знайдено" description="Змініть пошук або статус." />}<h2 className={styles.sectionTitle}>Сформовані інвойси</h2>{formed.length ? <div className={styles.tableScroller} role="region" aria-label="Сформовані інвойси" tabIndex={0}><Table aria-label="Сформовані інвойси" data={formed.map((row) => ({...row}))} columns={formedColumns} idKey="id" density="compact" dividers="rows" /></div> : <EmptyState isCompact title="Сформованих інвойсів не знайдено" description="Змініть пошуковий запит." />}<InvoiceDialog title={props.invoicePreview ? (props.invoicePreview.kind === "shipment" ? `BL ${props.invoicePreview.item.billOfLading}` : `Інвойс ${props.invoicePreview.item.invoiceNumber}`) : "Інвойс"} open={Boolean(props.invoicePreview)} onOpenChange={(open) => !open && props.onInvoicePreviewChange(null)}>{props.invoicePreview ? <p>Перегляд показує підтверджені дані документа без створення або завантаження файлу.</p> : null}</InvoiceDialog></section>;
}

function Cost(props: AdminInvoicesViewProps) {
  const rows = useMemo(() => invoiceCostCards.filter((row) => (props.costView === "archive" ? row.archived : props.costView === "incomplete" ? !row.archived && row.incomplete : !row.archived) && (row.month ? props.selectedMonths.includes(row.month) : props.selectedMonths.length === invoiceCostMonths.length) && (!normalize(props.costQuery) || normalize(`${row.billOfLading} ${row.shipmentLabel}`).includes(normalize(props.costQuery)))), [props.costQuery, props.costView, props.selectedMonths]);
  const columns = useMemo<TableColumn<CostRow>[]>(() => [{key: "billOfLading", header: "BL", width: pixel(110), renderCell: (row) => <Button label={`BL ${row.billOfLading}`} variant="ghost" size="sm" onClick={() => props.onSelectedCostCardChange(row)} />}, {key: "shipmentLabel", header: "Відправка", width: proportional(1)}, {key: "freight", header: "Фрахт", width: pixel(110)}, {key: "total", header: "Всього", width: pixel(118)}, {key: "id", header: "Дії", width: pixel(140), renderCell: (row) => <div className={styles.actions}><Button label={`Переглянути BL ${row.billOfLading}`} icon={<Eye size={14} />} isIconOnly variant="ghost" onClick={() => props.onSelectedCostCardChange(row)} /><Button label={row.archived ? `Відновити BL ${row.billOfLading}` : `Архівувати BL ${row.billOfLading}`} icon={<Archive size={14} />} isIconOnly variant="ghost" isDisabled tooltip={row.archived ? "Відновлення BL вимкнене" : "Архівація BL вимкнена"} /></div>}], [props]);
  const costKpis = props.costView === "archive" ? invoiceCostKpis.archive : invoiceCostKpis.active;
  return <section className={styles.panel} role="tabpanel" aria-label="Собівартість"><section className={styles.kpis} aria-label="Підсумки собівартості"><Card padding={3}><span>Всього фрахт</span><strong>{costKpis.freight}</strong></Card><Card padding={3}><span>Всього митниця</span><strong>{costKpis.customs}</strong></Card><Card padding={3}><span>Всього брокер</span><strong>{costKpis.broker}</strong></Card><Card padding={3}><span>Всього витрати</span><strong>{costKpis.total}</strong></Card></section><div className={styles.toolbar}><TextInput label="Пошук собівартості" isLabelHidden value={props.costQuery} onChange={props.onCostQueryChange} placeholder="Пошук BL або відправки..." hasClear width="100%" /><MultiSelector label="Фільтр за місяцем" isLabelHidden value={[...props.selectedMonths]} onChange={(values) => props.onSelectedMonthsChange(values as AdminInvoicesViewProps["selectedMonths"])} options={invoiceCostMonths.map((month) => ({value: month.id, label: month.label}))} hasSelectAll width="100%" /></div><SegmentedControl label="Стан даних собівартості" value={props.costView} onChange={(value) => props.onCostViewChange(value as AdminInvoicesViewProps["costView"])}>{[["active", "Активні"], ["archive", "Архів"], ["incomplete", "Незаповнені"]].map(([value, label]) => <SegmentedControlItem key={value} value={value} label={label} />)}</SegmentedControl>{rows.length ? <div className={styles.tableScroller} role="region" aria-label="Дані собівартості за коносаментом" tabIndex={0}><Table aria-label="Дані собівартості за коносаментом" data={rows.map((row) => ({...row}))} columns={columns} idKey="id" density="compact" dividers="rows" /></div> : <EmptyState isCompact title="Даних за обраними місяцями немає" description="Оберіть інший місяць або поверніть усі місяці." />}<InvoiceDialog title={props.selectedCostCard ? `Собівартість · BL ${props.selectedCostCard.billOfLading}` : "Собівартість"} open={Boolean(props.selectedCostCard)} onOpenChange={(open) => !open && props.onSelectedCostCardChange(null)}>{props.selectedCostCard ? <dl className={styles.details}><dt>Відправка</dt><dd>{props.selectedCostCard.shipmentLabel}</dd><dt>Всього витрат</dt><dd>{props.selectedCostCard.total}</dd><dt>Собівартість</dt><dd>{props.selectedCostCard.costPercent}</dd></dl> : null}</InvoiceDialog></section>;
}

export default function AstryxAdminInvoicesView(props: AdminInvoicesViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(props.onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [props.onReady]);

  const upload = props.tab === "contracts" ? null : uploadLabels[props.tab];
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-invoices-renderer="astryx"><header className={styles.header}><span><FileText size={20} /></span><div><h1>Інвойси та документи</h1><p>Керування інвойсами, контрактами та митними документами</p></div>{upload ? <Button label={upload} icon={<Upload size={14} />} isDisabled tooltip={`${upload} вимкнене у read-only клоні`} /> : null}</header><Kpis /><TabList aria-label="Інвойси та документи" value={props.tab} onChange={(value) => props.onTabChange(value as AdminInvoicesViewProps["tab"])} hasDivider>{Object.entries(tabLabels).map(([value, label]) => <Tab key={value} value={value} label={label} />)}</TabList>{props.tab === "contracts" ? <Contracts {...props} /> : null}{props.tab === "appendices" ? <Appendices {...props} /> : null}{props.tab === "invoices" ? <Invoices {...props} /> : null}{props.tab === "cost" ? <Cost {...props} /> : null}</main></AstryxBrpUiProvider>;
}
