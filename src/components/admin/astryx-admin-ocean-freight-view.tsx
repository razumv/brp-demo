"use client";

import {useLayoutEffect} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Dialog, DialogHeader} from "@astryxdesign/core/Dialog";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {ToggleButton} from "@astryxdesign/core/ToggleButton";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Grid2X2,
  List,
  PackageCheck,
  Search,
  Ship,
  Truck,
  Upload,
} from "lucide-react";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {useAppearance} from "@/components/appearance/use-appearance";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {
  dealerNames,
  oceanBillsOfLading,
  partsReceipt,
  type DealerEquipmentStatus,
  type DealerEquipmentType,
  type OceanBillOfLading,
  type OceanStatus,
} from "@/lib/admin-ocean-freight-data";
import {
  dealerStatuses,
  dealerTypes,
  formatOceanEur,
  oceanTabs,
  receiptStateLabel,
  statusMeta,
  statusOptions,
  type AdminOceanFreightModel,
  type OceanPageTab,
  type OceanPartsTab,
  type OceanStatusFilter,
  type OceanViewMode,
} from "./admin-ocean-freight-page";
import styles from "./astryx-admin-ocean-unit.module.css";

const oceanMetricItems = [
  {label: "Total BLs", value: 32, icon: <FileText size={18} aria-hidden="true" />},
  {label: "In transit", value: 36, icon: <Ship size={18} aria-hidden="true" />},
  {label: "Containers", value: 71, icon: <Truck size={18} aria-hidden="true" />},
  {label: "Arrived", value: 35, icon: <CheckCircle2 size={18} aria-hidden="true" />},
] as const;

const pageTabOptions = oceanTabs.map((item) => ({value: item.id, label: item.label}));
const oceanStatusOptions = statusOptions.map((item) => ({value: item.id, label: item.label}));
const equipmentStatusOptions = dealerStatuses.map((status) => ({value: status, label: status}));
const equipmentTypeOptions = dealerTypes.map((type) => ({value: type, label: type === "all" ? "Усі типи" : type}));

function isPageTab(value: string): value is OceanPageTab {
  return pageTabOptions.some((item) => item.value === value);
}

function isOceanStatusFilter(value: string): value is OceanStatusFilter {
  return oceanStatusOptions.some((item) => item.value === value);
}

function isOceanViewMode(value: string): value is OceanViewMode {
  return value === "table" || value === "cards";
}

function isDealerType(value: string): value is "all" | DealerEquipmentType {
  return dealerTypes.some((item) => item === value);
}

function isDealerStatus(value: string): value is DealerEquipmentStatus {
  return dealerStatuses.some((item) => item === value);
}

function statusVariant(status: OceanStatus) {
  if (status === "arrived" || status === "delivered") return "success" as const;
  if (status === "soon") return "warning" as const;
  if (status === "transit") return "info" as const;
  return "neutral" as const;
}

function statusLabel(status: OceanStatus) {
  return status === "mixed" ? "Змішаний" : statusMeta[status].label;
}

function MetricGrid() {
  return (
    <section className={styles.metrics} aria-label="Показники морських перевезень">
      {oceanMetricItems.map((item) => (
        <Card key={item.label} className={styles.metricCard} padding={4} width="100%">
          <span className={styles.metricIcon}>{item.icon}</span>
          <span>
            <Text type="label" color="secondary" display="block">{item.label}</Text>
            <strong className={styles.metricValue}>{item.value}</strong>
          </span>
        </Card>
      ))}
    </section>
  );
}

function ReceiptAction({bill, model}: {bill: OceanBillOfLading; model: AdminOceanFreightModel}) {
  if (bill.receipt.state === "posted") {
    return <Badge variant="success" label="Техніка · проведена" icon={<CheckCircle2 size={12} />} />;
  }
  return (
    <Button
      label={bill.receipt.state === "created-unposted" ? "Провести ПН" : "Створити прибуткову"}
      variant="secondary"
      size="sm"
      icon={<PackageCheck size={14} />}
      tooltip={receiptStateLabel(bill)}
      onClick={() => model.openReceipt(bill.id, bill.receipt.kind)}
    />
  );
}

function ContainerRows({model}: {model: AdminOceanFreightModel}) {
  if (model.filteredBills.length === 0) {
    return <EmptyState title="Контейнери не знайдено" description="Змініть пошук або статус перевезення." icon={<Ship size={26} />} />;
  }

  return (
    <Card className={styles.tableCard} padding={0} width="100%" data-operational-surface="ocean-card">
      <div className={styles.tableScroller} role="region" aria-label="Контейнери морських перевезень" tabIndex={0}>
        <table className={styles.table}>
          <thead data-operational-surface="ocean-table-header">
            <tr>
              <th>Назва</th><th>Контейнер</th><th>Тип</th><th>Проформа</th><th>EUR</th><th>Одиниці</th><th>Прихід</th><th>ETA</th><th>Статус</th>
            </tr>
          </thead>
          <tbody data-operational-surface="ocean-table-body">
          {model.filteredBills.flatMap((bill) => {
            const group = model.grouped ? (
              <tr key={`bill-${bill.id}`} className={styles.billRow} data-operational-surface="ocean-bl-group">
                <td colSpan={9}>
                  <div className={styles.billSummary}>
                    <Button label={`Деталі BL ${bill.id}`} variant="ghost" size="sm" icon={<FileText size={14} />} onClick={() => model.openBillDetail(bill.id)} />
                    <Badge variant={statusVariant(bill.status)} label={statusLabel(bill.status)} />
                    <Text color="secondary">{bill.containers.length} container · ETA {bill.eta}</Text>
                    <span className={styles.rowPush}><ReceiptAction bill={bill} model={model} /></span>
                  </div>
                </td>
              </tr>
            ) : null;
            const rows = bill.containers.map((container) => {
              const expanded = model.expandedContainerId === container.id;
              return [
                <tr key={container.id} data-operational-surface="ocean-table-hover">
                  <td>
                    <button className={styles.disclosureButton} type="button" aria-expanded={expanded} onClick={() => model.toggleContainer(container.id)}>
                      <ChevronDown size={13} aria-hidden="true" /> {container.name}
                    </button>
                  </td>
                  <td className={styles.mono}>{container.number}</td>
                  <td><Badge variant="info" label={container.cargoType === "units" ? "Одиниці" : "Запчастини"} /></td>
                  <td className={styles.mono}>{container.proforma}</td>
                  <td>{formatOceanEur(container.eur)}</td>
                  <td>{container.assigned}/{container.total}</td>
                  <td><ReceiptAction bill={bill} model={model} /></td>
                  <td>
                    <Button label={container.arrivalLabel} variant="ghost" size="sm" icon={<CalendarDays size={13} />} onClick={model.openEta} />
                  </td>
                  <td><Badge variant={statusVariant(container.status)} label={statusLabel(container.status)} /></td>
                </tr>,
                expanded ? (
                  <tr key={`${container.id}-detail`} className={styles.detailRow}>
                    <td colSpan={9}>
                      <div className={styles.containerFacts}>
                        <span><b>BL:</b> {bill.id}</span>
                        <span><b>Маршрут:</b> {bill.route ?? "—"}</span>
                        <span><b>ISO:</b> {container.detail?.isoType ?? "—"}</span>
                        <span><b>Пломба:</b> {container.detail?.seal ?? "—"}</span>
                        <span><b>Вага:</b> {container.detail ? `${container.detail.weightKg.toLocaleString("uk-UA")} кг` : "—"}</span>
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            });
            return [group, ...rows.flat()].filter(Boolean);
          })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ContainerCards({model}: {model: AdminOceanFreightModel}) {
  return (
    <div className={styles.cardGrid} role="region" aria-label="Контейнери морських перевезень" data-operational-surface="ocean-card">
      {model.filteredBills.flatMap((bill) => bill.containers.map((container) => (
        <Card key={container.id} className={styles.containerCard} padding={4} width="100%">
          <div className={styles.cardHeader}>
            <span><Text type="label" color="secondary" display="block">BL {bill.id}</Text><strong>{container.name}</strong></span>
            <Badge variant={statusVariant(container.status)} label={statusLabel(container.status)} />
          </div>
          <dl className={styles.cardFacts}>
            <dt>Контейнер</dt><dd className={styles.mono}>{container.number}</dd>
            <dt>Проформа</dt><dd className={styles.mono}>{container.proforma}</dd>
            <dt>Вартість</dt><dd>{formatOceanEur(container.eur)}</dd>
            <dt>Одиниці</dt><dd>{container.assigned}/{container.total}</dd>
          </dl>
          <div className={styles.cardActions}>
            <Button label={`Деталі BL ${bill.id}`} variant="secondary" size="sm" onClick={() => model.openBillDetail(bill.id)} />
            <Button label={container.arrivalLabel} variant="ghost" size="sm" icon={<CalendarDays size={13} />} onClick={model.openEta} />
          </div>
        </Card>
      )))}
    </div>
  );
}

function OceanPanel({model}: {model: AdminOceanFreightModel}) {
  return (
    <div className={styles.stack}>
      <MetricGrid />
      <Card className={styles.toolbarCard} padding={3} width="100%">
        <div className={styles.toolbar}>
          <div className={styles.searchGrow}>
            <TextInput label="Пошук контейнера, BL, проформи" value={model.search} onChange={model.setSearch} placeholder="Пошук контейнера, BL, проформи..." isLabelHidden startIcon={<Search size={15} />} width="100%" />
          </div>
          <Selector label="Статус морського перевезення" options={oceanStatusOptions} value={model.status} onChange={(value) => { if (isOceanStatusFilter(value)) model.setStatus(value); }} isLabelHidden width={190} />
          <div className={styles.mobileFullControl}>
            <SegmentedControl label="Вигляд контейнерів" value={model.view} onChange={(value) => { if (isOceanViewMode(value)) model.setView(value); }} layout="fill">
              <SegmentedControlItem value="table" label="Таблиця" icon={<List size={14} />} />
              <SegmentedControlItem value="cards" label="Картки" icon={<Grid2X2 size={14} />} />
            </SegmentedControl>
          </div>
          <ToggleButton label="Групувати за BL" isPressed={model.grouped} onPressedChange={model.setGrouped} size="md" />
        </div>
        <Text className={styles.toolbarMeta} color="secondary" display="block">{model.visibleBillCount} BL · {model.visibleCount} контейнерів</Text>
      </Card>
      {model.view === "table" ? <ContainerRows model={model} /> : <ContainerCards model={model} />}
    </div>
  );
}

function GroundPanel({model}: {model: AdminOceanFreightModel}) {
  return (
    <Card padding={4} width="100%">
      <div className={styles.sectionHeader}>
        <span><Heading level={2}>Наземна доставка</Heading><Text color="secondary">Пошук та локальний перегляд рейсів.</Text></span>
        <Button label="Додати перевезення" variant="primary" onClick={model.openGround} />
      </div>
      <TextInput label="Пошук наземної доставки" value={model.groundQuery} onChange={model.setGroundQuery} placeholder="Номер рейсу, перевізник або маршрут..." isLabelHidden startIcon={<Search size={15} />} width="100%" />
      <EmptyState title={model.groundQuery ? "Рейси не знайдено" : "Наземних рейсів поки немає"} description="Новий запис відкривається у безпечному локальному перегляді." icon={<Truck size={26} />} />
    </Card>
  );
}

function EquipmentPanel({model}: {model: AdminOceanFreightModel}) {
  return (
    <div className={styles.stack}>
      <Card padding={3} width="100%">
        <div className={styles.toolbar}>
          <div className={styles.searchGrow}><TextInput label="Пошук техніки дилера" value={model.dealerQuery} onChange={model.setDealerQuery} placeholder="VIN, двигун, модель або код..." isLabelHidden startIcon={<Search size={15} />} width="100%" /></div>
          <Selector label="Дилер" options={dealerNames.map((dealer) => ({value: dealer, label: dealer}))} value={model.dealer} onChange={(value) => model.setDealer(value as (typeof dealerNames)[number])} isLabelHidden width={190} hasSearch />
          <Selector label="Рік техніки" options={[{value: "all", label: "Усі роки"}, {value: "2026", label: "2026"}]} value={model.dealerYear} onChange={(value) => model.setDealerYear(value === "2026" ? "2026" : "all")} isLabelHidden width={130} />
          <Selector label="Тип техніки дилера" options={equipmentTypeOptions} value={model.dealerType} onChange={(value) => { if (isDealerType(value)) model.setDealerType(value); }} isLabelHidden width={145} />
          <Selector label="Статус техніки дилера" options={equipmentStatusOptions} value={model.dealerStatus} onChange={(value) => { if (isDealerStatus(value)) model.setDealerStatus(value); }} isLabelHidden width={145} />
        </div>
      </Card>
      <Card padding={0} width="100%">
        <div className={styles.tableScroller} role="region" aria-label="Техніка дилерів" tabIndex={0}>
          <table className={styles.table}>
            <thead><tr><th>VIN</th><th>Код</th><th>Модель</th><th>Тип</th><th>Рік</th><th>Статус</th><th>Відправка</th><th>EUR</th></tr></thead>
            <tbody>
              {model.dealerRows.map((row) => <tr key={row.id}><td className={styles.mono}>{row.vin}</td><td>{row.code}</td><td>{row.model}</td><td>{row.type}</td><td>{row.year}</td><td><Badge variant="info" label={row.status} /></td><td>{row.shipment}</td><td>{formatOceanEur(row.eur)}</td></tr>)}
            </tbody>
          </table>
        </div>
        {model.dealerRows.length === 0 ? <EmptyState title="Техніку не знайдено" description="Змініть дилера або фільтри." /> : null}
      </Card>
    </div>
  );
}

function InfoDialog({open, title, subtitle, onClose, children}: {open: boolean; title: string; subtitle?: string; onClose(): void; children: React.ReactNode}) {
  return (
    <Dialog isOpen={open} onOpenChange={(next) => { if (!next) onClose(); }} width="min(720px, calc(100vw - 32px))" maxHeight="85vh" purpose="info" padding={0} aria-label={title}>
      <div className={styles.dialog}>
        <DialogHeader title={title} subtitle={subtitle} onOpenChange={(next) => { if (!next) onClose(); }} hasDivider />
        <div className={styles.dialogBody}>{children}</div>
        <footer className={styles.dialogFooter}><Button label="Закрити" variant="secondary" onClick={onClose} /></footer>
      </div>
    </Dialog>
  );
}

function BillDetailDialog({model, bill, open}: {model: AdminOceanFreightModel; bill: OceanBillOfLading | null; open: boolean}) {
  if (!bill) return null;
  const total = bill.containers.reduce((sum, container) => sum + container.total, 0);
  const totalEur = bill.containers.reduce((sum, container) => sum + container.eur, 0);
  return (
    <Dialog isOpen={open} onOpenChange={(next) => { if (!next) model.closePreview(); }} width="min(1120px, calc(100vw - 32px))" maxHeight="90vh" purpose="info" padding={0} aria-label={`BL ${bill.id}`}>
      <div className={styles.dialog}>
        <DialogHeader
          title={`BL ${bill.id}`}
          subtitle={`${bill.route ?? "Маршрут не зафіксовано"} · ETA ${bill.detail?.modalEtaLabel ?? bill.eta}`}
          onOpenChange={(next) => { if (!next) model.closePreview(); }}
          endContent={<div className={styles.dialogHeaderActions}><Button label="Оновити ETA для цього коносамента" variant="secondary" size="sm" isDisabled tooltip="Зовнішнє оновлення ETA недоступне для поточного доступу." /><Button label="Завантажити документи цього коносамента" variant="secondary" size="sm" isDisabled tooltip="Завантаження документів недоступне для поточного доступу." /></div>}
          hasDivider
        />
        <div className={styles.billDialogBody}>
          <main className={styles.billDialogMain}>
            <div className={styles.billMetrics}><Card padding={3}><Text type="label" color="secondary">Контейнери</Text><strong>{bill.containers.length}</strong></Card><Card padding={3}><Text type="label" color="secondary">Одиниці</Text><strong>{total}</strong></Card><Card padding={3}><Text type="label" color="secondary">Вартість</Text><strong>{formatOceanEur(totalEur)}</strong></Card></div>
            <section className={styles.dialogSection}>
              <Heading level={3}>Контейнери</Heading>
              {bill.containers.map((container) => {
                const expanded = model.detailExpandedContainerId === container.id;
                return <article key={container.id} className={styles.dialogDisclosure}><button type="button" aria-expanded={expanded} onClick={() => model.toggleDetailContainer(container.id)}><ChevronDown size={14} /> <strong>{container.number}</strong><span>{container.name} · {container.total} од. · {formatOceanEur(container.eur)}</span></button>{expanded ? <div className={styles.containerFacts}><span><b>Проформа:</b> {container.proforma}</span><span><b>ISO:</b> {container.detail?.isoType ?? "—"}</span><span><b>Пломба:</b> {container.detail?.seal ?? "—"}</span><span><b>Вага:</b> {container.detail ? `${container.detail.weightKg.toLocaleString("uk-UA")} кг` : "—"}</span>{container.detail?.units.slice(0, 3).map((unit) => <span key={unit.id}><b>{unit.code}</b> · {unit.vin}</span>)}</div> : null}</article>;
              })}
            </section>
            <section className={styles.dialogSection}><Heading level={3}>Пов’язані проформи</Heading>{bill.containers.map((container) => <div className={styles.listRow} key={container.proforma}><span className={styles.mono}>{container.proforma}</span><span>{container.total} од.</span><strong>{formatOceanEur(container.eur)}</strong></div>)}</section>
          </main>
          <aside className={styles.billDialogRail}>
            <section><Heading level={3}>Інформація про BL</Heading><dl className={styles.railFacts}><dt>Номер</dt><dd>{bill.id}</dd><dt>Судно</dt><dd>{bill.detail?.vessel ?? "—"}</dd><dt>ETD</dt><dd>{bill.detail?.etd ?? "—"}</dd><dt>ETA</dt><dd>{bill.detail?.modalEtaLabel ?? bill.eta}</dd><dt>Статус</dt><dd><Badge variant={statusVariant(bill.status)} label={statusLabel(bill.status)} /></dd></dl></section>
            <section><Heading level={3}>Документи</Heading>{bill.detail?.documents.map((document) => <div className={styles.listRow} key={document.id}><span>{document.label}</span><Badge variant={document.state === "uploaded" ? "success" : document.state === "awaiting" ? "warning" : "error"} label={document.state === "uploaded" ? "Завантажено" : document.state === "awaiting" ? "Очікується" : "Відсутній"} /></div>) ?? <Text color="secondary">Дані документів відсутні.</Text>}</section>
            <section><Heading level={3}>Хронологія</Heading><ol className={styles.timeline}>{bill.detail?.milestones.map((milestone) => <li key={milestone.id} data-state={milestone.state}><span>{milestone.label}</span>{milestone.date ? <small>{milestone.date}</small> : null}</li>)}</ol></section>
          </aside>
        </div>
      </div>
    </Dialog>
  );
}

function PreviewDialogs({model, committed}: {model: AdminOceanFreightModel; committed: boolean}) {
  const billDetailPreview = model.preview?.type === "bill-detail" ? model.preview : null;
  const receiptPreview = model.preview?.type === "receipt" ? model.preview : null;
  const billDetail = billDetailPreview ? oceanBillsOfLading.find((bill) => bill.id === billDetailPreview.billId) ?? null : null;
  const receiptBill = receiptPreview ? oceanBillsOfLading.find((bill) => bill.id === receiptPreview.billId) ?? null : null;
  return (
    <>
      <InfoDialog open={committed && model.preview?.type === "upload"} title="Завантаження документів" subtitle="Локальний перегляд пакета документів" onClose={model.closePreview}><Banner status="info" title="Пакет підготовлено до перевірки" description="Оберіть документи та перевірте їх перед передаванням у підключений workflow." /><div className={styles.dropZone}><Upload size={28} /><strong>Перетягніть файли сюди</strong><Text color="secondary">PDF, XLSX або зображення</Text></div></InfoDialog>
      <InfoDialog open={committed && model.preview?.type === "ground"} title="Нове наземне перевезення" subtitle="Інформаційний перегляд форми" onClose={model.closePreview}><div className={styles.formGrid}><TextInput label="Номер рейсу" value="" onChange={() => undefined} placeholder="Наприклад, LAND-026" width="100%" /><TextInput label="Перевізник" value="" onChange={() => undefined} placeholder="Назва перевізника" width="100%" /><TextInput label="Маршрут" value="" onChange={() => undefined} placeholder="Пункт відправлення — пункт прибуття" width="100%" /></div></InfoDialog>
      <InfoDialog open={committed && model.preview?.type === "eta"} title="ETA — лише перегляд" subtitle="Дата та статус контейнера не змінюються" onClose={model.closePreview}><Banner status="warning" title="Зовнішнє оновлення недоступне" description="Можна переглянути поточну ETA, але збереження й застосування нової дати вимкнені для поточного доступу." /></InfoDialog>
      <InfoDialog open={committed && Boolean(receiptBill)} title={receiptBill?.receipt.kind === "parts" ? "Прибуткова запчастин" : "Прибуткова техніки"} subtitle={receiptBill ? `BL ${receiptBill.id} · ${receiptStateLabel(receiptBill)}` : undefined} onClose={model.closePreview}>{receiptBill?.receipt.kind === "parts" ? <PartsReceiptContent model={model} /> : <ReceiptContent bill={receiptBill} />}</InfoDialog>
      <BillDetailDialog model={model} bill={billDetail} open={committed && Boolean(billDetail)} />
    </>
  );
}

function ReceiptContent({bill}: {bill: OceanBillOfLading | null}) {
  if (!bill) return null;
  return <div className={styles.stack}><Banner status="info" title={receiptStateLabel(bill)} description="Дані згруповано за контейнерами та проформами." />{bill.containers.map((container) => <Card key={container.id} padding={3} width="100%"><div className={styles.listRow}><span><b>{container.number}</b><Text color="secondary" display="block">{container.proforma}</Text></span><span>{container.total} од.</span><strong>{formatOceanEur(container.eur)}</strong></div></Card>)}</div>;
}

const partsTabs: Array<{value: OceanPartsTab; label: string}> = [
  {value: "composition", label: "Склад"},
  {value: "blocked", label: "Заблоковані"},
  {value: "link", label: "Зв’язати"},
  {value: "create", label: "Створити"},
  {value: "transfer", label: "Перемістити"},
  {value: "check", label: "Перевірити"},
  {value: "price", label: "Ціна"},
];

function PartsReceiptContent({model}: {model: AdminOceanFreightModel}) {
  return <div className={styles.stack}><SegmentedControl label="Розділ прибуткової запчастин" value={model.partsTab} onChange={(value) => model.setPartsTab(value as OceanPartsTab)} layout="fill">{partsTabs.map((tab) => <SegmentedControlItem key={tab.value} value={tab.value} label={tab.label} />)}</SegmentedControl>{model.partsTab === "composition" ? <div className={styles.tableScroller} role="region" aria-label="Склад прибуткової запчастин"><table className={styles.table}><thead><tr><th>Артикул</th><th>Назва</th><th>К-сть</th><th>EUR</th></tr></thead><tbody>{partsReceipt.lines.map((line) => <tr key={line.article}><td className={styles.mono}>{line.article}</td><td>{line.name}</td><td>{line.quantity}</td><td>{formatOceanEur(line.eur)}</td></tr>)}</tbody></table></div> : <EmptyState title="Проблем не знайдено" description="Для цього розділу немає позицій, що потребують уваги." isCompact />}</div>;
}

export function AstryxAdminOceanFreightView({model, onReady}: {model: AdminOceanFreightModel} & AstryxRendererViewProps) {
  const {renderedDesignSystem} = useAppearance();
  const committed = renderedDesignSystem === "astryx";
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
      <div className={styles.page} data-admin-ocean-renderer="astryx" data-brp-admin-fulfillment-renderer="astryx" data-operational-surface="ocean-canvas">
        <header className={styles.pageHeader}>
          <span className={styles.pageIcon}><Ship size={22} aria-hidden="true" /></span>
          <div className={styles.pageTitle}><Heading level={1}>Морські перевезення</Heading><Text color="secondary">Відстеження контейнерів та розподіл техніки</Text></div>
          <div className={styles.pageActions}><Button label="Завантажити документи" variant="primary" icon={<Upload size={15} />} onClick={model.openUpload} /><Button label="Оновити ETA" variant="secondary" isDisabled tooltip="Зовнішнє оновлення ETA недоступне для поточного доступу." /></div>
        </header>
        <SegmentedControl label="Розділи морських перевезень" value={model.tab} onChange={(value) => { if (isPageTab(value)) model.setTab(value); }} layout="hug">{pageTabOptions.map((item) => <SegmentedControlItem key={item.value} value={item.value} label={item.label} />)}</SegmentedControl>
        {model.tab === "ocean" ? <OceanPanel model={model} /> : model.tab === "ground" ? <GroundPanel model={model} /> : <EquipmentPanel model={model} />}
        <PreviewDialogs model={model} committed={committed} />
      </div>
    </AstryxBrpUiProvider>
  );
}
