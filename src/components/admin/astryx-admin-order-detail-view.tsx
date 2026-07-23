"use client";

import {useLayoutEffect} from "react";
import Link from "next/link";
import {Ban, ChevronDown, ChevronRight, ClipboardCheck, Download, Expand, FileText, LockKeyhole, PackageCheck, Paperclip, RefreshCcw, Send, Truck, Warehouse} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Dialog, DialogHeader} from "@astryxdesign/core/Dialog";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {IconButton} from "@astryxdesign/core/IconButton";
import {Layout, LayoutContent, LayoutFooter} from "@astryxdesign/core/Layout";
import {NumberInput} from "@astryxdesign/core/NumberInput";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {useAppearance} from "@/components/appearance/use-appearance";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {formatMoney} from "@/lib/mock-data";
import type {AdminLineStatus, AdminTone} from "@/lib/admin-order-data";
import type {AdminOrderDetailViewModel, DeliveryChannel} from "./admin-order-detail-types";
import styles from "./admin-order-detail-astryx.module.css";

type Props = {model: AdminOrderDetailViewModel | null} & AstryxRendererViewProps;
type Row = Record<string, React.ReactNode> & {id: string};
type OrderLineRow = Record<string, unknown> & {
  id: string;
  part: string;
  description: string;
  note: string | undefined;
  statusLabel: string;
  statusTone: AdminTone;
  supplier: string;
  stock: string;
  quantity: number;
  price: string;
  total: string;
  cancelled: boolean;
};

const unavailable = "Дія недоступна в поточному стані";
const preflightUnavailableReason = "Source preflight зафіксовано лише для LOG-01 і KHA-08";
const legacyCheckUnavailableReason = "POST check-legacy вимкнено: кнопка не виконує запит.";
const lineLabels: Record<AdminLineStatus, string> = {pending: "Очікування", waiting: "Очікує замовлення", ready: "Готово до відправки", sent: "Відправлено", delivered: "Доставлено", cancelled: "Скасовано"};
const lineTones: Record<AdminLineStatus, AdminTone> = {pending: "amber", waiting: "amber", ready: "green", sent: "purple", delivered: "green", cancelled: "red"};

function badgeVariant(tone: AdminTone): "neutral" | "info" | "success" | "warning" | "error" {
  if (tone === "green") return "success";
  if (tone === "red") return "error";
  if (tone === "amber" || tone === "orange") return "warning";
  if (tone === "blue") return "info";
  return "neutral";
}

function DisabledAction({children, label, reason = unavailable, variant = "secondary"}: {children: React.ReactNode; label: string; reason?: string; variant?: "secondary" | "destructive"}) {
  return <Button label={label} variant={variant} isDisabled aria-description={reason}>{children}</Button>;
}

function DetailRow({label, children}: {label: string; children: React.ReactNode}) {
  return <div className={styles.detailRow}><dt>{label}</dt><dd>{children}</dd></div>;
}

function OrderLines({model}: {model: AdminOrderDetailViewModel}) {
  const {order, lineFilter, setLineFilter} = model;
  const statuses = (Object.keys(lineLabels) as AdminLineStatus[]).filter((status) => order.lines.some((line) => line.status === status));
  const effective = lineFilter === "all" || statuses.includes(lineFilter) ? lineFilter : "all";
  const visible = effective === "all" ? order.lines : order.lines.filter((line) => line.status === effective);
  const totalUnits = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const data = visible.map<OrderLineRow>((line) => {
    const cancelled = line.status === "cancelled";
    return {
      id: line.id,
      part: line.partNumber,
      description: line.description,
      note: line.note,
      statusLabel: line.statusLabel,
      statusTone: lineTones[line.status],
      supplier: line.bossWebOrSupplier,
      stock: line.stockSource,
      quantity: line.quantity,
      price: formatMoney(line.unitPrice),
      total: formatMoney(line.unitPrice * line.quantity),
      cancelled,
    };
  });
  const columns: TableColumn<OrderLineRow>[] = [
    {key: "part", header: "Артикул", width: pixel(132), renderCell: (line) => <Text weight="semibold" color={line.cancelled ? "secondary" : undefined} hasStrikethrough={line.cancelled}>{line.part}</Text>},
    {key: "description", header: "Опис", width: proportional(2), renderCell: (line) => <div><Text weight="semibold" color={line.cancelled ? "secondary" : undefined} hasStrikethrough={line.cancelled}>{line.description}</Text>{line.note ? <Text type="supporting" color="secondary" display="block">{line.note}</Text> : null}</div>},
    {key: "statusLabel", header: "CRM статус", width: pixel(156), renderCell: (line) => <Badge label={line.statusLabel} variant={badgeVariant(line.statusTone)} />},
    {key: "supplier", header: "BossWeb / постачальник", width: pixel(168), renderCell: (line) => <Text color={line.cancelled ? "secondary" : undefined}>{line.supplier}</Text>},
    {key: "stock", header: "Склад / джерело", width: pixel(146), renderCell: (line) => line.stock === "—" ? <Text color={line.cancelled ? "secondary" : undefined}>—</Text> : <span><StatusDot label="У наявності" variant="success" /> <Text color={line.cancelled ? "secondary" : undefined}>{line.stock}</Text></span>},
    {key: "quantity", header: "К-сть", width: pixel(78), renderCell: (line) => <Text color={line.cancelled ? "secondary" : undefined} hasStrikethrough={line.cancelled}>{line.quantity}</Text>},
    {key: "price", header: "Ціна", width: pixel(112), renderCell: (line) => <Text color={line.cancelled ? "secondary" : undefined} hasStrikethrough={line.cancelled}>{line.price}</Text>},
    {key: "total", header: "Сума", width: pixel(118), renderCell: (line) => <Text weight="semibold" color={line.cancelled ? "secondary" : undefined} hasStrikethrough={line.cancelled}>{line.total}</Text>},
  ];
  return <Card padding={4} className={styles.panel}>
    <div className={styles.filters} aria-label="Фільтр статусів позицій">
      <Button label={`Усі ${totalUnits}`} size="sm" variant={effective === "all" ? "primary" : "secondary"} aria-pressed={effective === "all"} onClick={() => setLineFilter("all")}>Усі {totalUnits}</Button>
      {statuses.map((status) => {
        const count = order.lines.filter((line) => line.status === status).reduce((sum, line) => sum + line.quantity, 0);
        return <Button key={status} label={`${lineLabels[status]} ${count}`} size="sm" variant={effective === status ? "primary" : "secondary"} aria-pressed={effective === status} onClick={() => setLineFilter(status)}>{lineLabels[status]} {count}</Button>;
      })}
    </div>
    {!order.evidenceComplete ? <EmptyState title="Склад позицій не зафіксовано" description={`Для ${order.code} доступні лише факти пайплайна: ${order.activeParts} позицій, ${formatMoney(order.total)}.`} /> : <Table aria-label="Позиції замовлення" data={data} columns={columns} idKey="id" density="compact" textOverflow="wrap" />}
  </Card>;
}

function PreflightDialog({model, isRendererActive}: {model: AdminOrderDetailViewModel; isRendererActive: boolean}) {
  const {order} = model;
  const active = order.lines.filter((line) => line.status !== "cancelled");
  const data = active.map<Row>((line) => {
    const stock = Number.parseInt(line.stockSource, 10) || 0;
    const fromStock = Math.min(stock, line.quantity);
    const toOrder = Math.max(0, line.quantity - fromStock) + model.replenishment;
    return {
      id: line.id,
      part: line.partNumber,
      requested: line.quantity,
      stock,
      fromStock,
      afterConfirmation: Math.max(0, stock - fromStock),
      turnover: "—",
      openLogos: line.status === "waiting" ? line.quantity : 0,
      toOrder,
      channel: model.delivery,
      decision: toOrder ? "Замовити" : "Зі складу",
    };
  });
  const columns: TableColumn<Row>[] = [
    {key: "part", header: "Артикул", width: pixel(130)}, {key: "requested", header: "Запитано", width: pixel(90)}, {key: "stock", header: "Склад зараз", width: pixel(104)}, {key: "fromStock", header: "Зі складу", width: pixel(104)}, {key: "afterConfirmation", header: "Після підтвердження", width: pixel(158)}, {key: "turnover", header: "Оборот", width: pixel(86)}, {key: "openLogos", header: "Відкрито Logos", width: pixel(132)}, {key: "toOrder", header: "До замовлення", width: pixel(130)}, {key: "channel", header: "Канал", width: pixel(90)}, {key: "decision", header: "Рішення Logos", width: proportional(1)},
  ];
  return <Dialog isOpen={isRendererActive && model.preflightOpen} onOpenChange={model.setPreflightOpen} purpose="info" width={1180} aria-label="Перевірка перед підтвердженням">
    <Layout header={<DialogHeader title="Перевірка перед підтвердженням" subtitle={`${order.code} · замовлення ще не підтверджено`} onOpenChange={model.setPreflightOpen} />} content={<LayoutContent><div className={styles.dialogContent}>
      <SegmentedControl label="Вигляд перевірки" value={model.preflightView} onChange={(value) => model.setPreflightView(value as "error" | "representative")}>
        <SegmentedControlItem value="error" label="Зафіксована відповідь" /><SegmentedControlItem value="representative" label="Структура preview" />
      </SegmentedControl>
      {model.preflightView === "error" ? <div className={styles.dangerBox}><Text weight="semibold">Failed to build confirm preview</Text><Text display="block" type="supporting">Це точний результат безпечного source preflight для LOG-01 і KHA-08. Статус замовлення не змінився.</Text></div> : active.length ? <><Banner title="Параметри preview" status="info" description="Значення використовуються лише для перегляду та не змінюють замовлення." /><div className={styles.previewFields}><Selector label="Канал доставки" value={model.delivery} options={[{value: "air", label: "air"}, {value: "ocean", label: "ocean"}]} onChange={(value) => model.setDelivery((value ?? "air") as DeliveryChannel)} /><NumberInput min={0} isIntegerOnly label="Поповнення, к-сть" value={model.replenishment} onChange={(value) => model.setReplenishment(Math.max(0, value))} /></div><Table aria-label="Розрахунок перед підтвердженням" data={data} columns={columns} idKey="id" density="compact" /><DisabledAction label="Оновити розрахунок"><RefreshCcw size={14} /> Оновити розрахунок</DisabledAction></> : <EmptyState title="Немає підтверджених позицій" description="Для цього рядка немає зафіксованого складу позицій." />}
    </div></LayoutContent>} footer={<LayoutFooter hasDivider><Button label="Скасувати" variant="secondary" onClick={() => model.setPreflightOpen(false)}>Скасувати</Button><DisabledAction label="Підтвердити замовлення">Підтвердити замовлення</DisabledAction></LayoutFooter>} />
  </Dialog>;
}

function ChatDialog({model, isRendererActive}: {model: AdminOrderDetailViewModel; isRendererActive: boolean}) {
  return <Dialog isOpen={isRendererActive && model.chatOpen} onOpenChange={model.setChatOpen} purpose="info" width={640} aria-label="Чат замовлення">
    <Layout header={<DialogHeader title="Чат" subtitle={`${model.order.code} · повна історія`} onOpenChange={model.setChatOpen} />} content={<LayoutContent><div className={styles.dialogContent}>{model.order.messages.length ? model.order.messages.map((message) => <article key={message.id} className={styles.chatMessage}><div className={styles.chatHeader}><Text weight="semibold">{message.author}</Text><Badge label={message.role} variant={message.role === "dealer" ? "info" : "warning"} /><Text color="secondary">{message.time}</Text></div><Text display="block">{message.body}</Text></article>) : <EmptyState title="Повідомлень поки немає" description="Надсилання повідомлень і вкладень недоступне у поточному стані." />}</div></LayoutContent>} footer={<LayoutFooter hasDivider><IconButton label="Додати вкладення" icon={<Paperclip size={16} />} isDisabled aria-description={unavailable} /><TextInput label="Повідомлення" isLabelHidden value="" placeholder="Введіть повідомлення..." isDisabled disabledMessage={unavailable} onChange={() => {}} /><DisabledAction label="Надіслати"><Send size={15} /> Надіслати</DisabledAction></LayoutFooter>} />
  </Dialog>;
}

export function AstryxAdminOrderDetailView({model, onReady}: Props) {
  const {renderedDesignSystem} = useAppearance();
  const isRendererActive = renderedDesignSystem === "astryx";
  useLayoutEffect(() => { const frame = window.requestAnimationFrame(onReady); return () => window.cancelAnimationFrame(frame); }, [onReady]);
  if (!model) {
    return <main className={styles.page} data-admin-order-detail-renderer="astryx">
      <Card padding={5} className={styles.panel}>
        <EmptyState headingLevel={1} title="Замовлення не знайдено" description="Немає зафіксованого замовлення або рядка пайплайна з таким id." />
        <Button label="До пайплайна" href="/admin/order-pipeline" as={Link} variant="secondary" />
      </Card>
    </main>;
  }
  const {order} = model;
  const summaryBadges = [order.po ? `PO: ${order.po}` : null, order.delivery, order.stage].filter(Boolean) as string[];
  return <main className={styles.page} data-admin-order-detail-renderer="astryx">
    <div className={styles.stack}>
      <nav className={styles.breadcrumb} aria-label="Навігаційний ланцюжок"><Link href="/admin/order-pipeline">Пайплайн замовлень</Link><ChevronRight size={14} /><Text weight="semibold">{order.code}</Text></nav>
      <Banner title="Адміністративні дії недоступні" status="warning" icon={<LockKeyhole size={16} />} description="Доступні фільтри, розкриття панелей і перевірка без підтвердження. Для виконання дії потрібне підключення сервісу." />
      <div className={styles.grid}>
        <div className={styles.stack}>
          <Card padding={5} className={styles.summary}><div><div className={styles.badgeRow}><h1>{order.code}</h1><Badge label={order.statusLabel} variant={badgeVariant(order.status === "cancelled" ? "red" : order.status === "done" || order.status === "ready" ? "green" : "amber")} />{order.age ? <Text type="supporting">{order.age}</Text> : null}</div><p><Text weight="semibold">{order.company}</Text> · {order.contact}</p><Text type="supporting" display="block">Створено {order.created}{order.confirmed ? ` · Підтверджено ${order.confirmed}` : ""}{order.cancelled ? ` · Скасовано ${order.cancelled}` : ""}</Text><div className={styles.summaryMeta}>{summaryBadges.map((badge, index) => <Badge key={`${badge}-${index}`} label={badge} variant={index === 1 ? "info" : "neutral"} />)}</div>{order.progress ? <Text type="supporting" display="block">{order.progress}</Text> : null}</div><div className={styles.summaryTotal}><Text weight="semibold">{formatMoney(order.total)}</Text><Text type="supporting">{order.activeParts} активних · {order.totalUnits} одиниць</Text></div></Card>
          <OrderLines model={model} />
          <Card padding={4} className={styles.badgeRow}><Text weight="semibold">РАЗОМ</Text>{order.totals.map((total) => <Badge key={total.label} label={`${total.label}: ${formatMoney(total.value)}`} variant={badgeVariant(total.tone)} />)}{!order.evidenceComplete ? <Text type="supporting">Тільки сума рядка пайплайна</Text> : null}<Text weight="semibold">{formatMoney(order.total)}</Text></Card>
          <Card padding={4} className={styles.panel}><div className={styles.panelHeader}><div><h2>Документи 1C</h2><Text type="supporting">Перегляд зафіксованих документів.</Text></div><FileText size={17} /></div>{order.documents.length ? order.documents.map((document) => <Card key={document.id} padding={3}><Text weight="semibold">{document.kind} · {document.reference}</Text><Text type="supporting" display="block">{document.source} · {document.lines}</Text><div className={styles.actions}><Badge label={document.sync} variant={document.sync === "синхр." ? "success" : "warning"} /><Badge label={document.posting} variant={document.posting === "проведено" ? "success" : "warning"} /><DisabledAction label="Завантажити"><Download size={14} /> Завантажити</DisabledAction><DisabledAction label="Повторити синхронізацію"><RefreshCcw size={14} /> Повторити / sync 1C</DisabledAction></div></Card>) : <EmptyState title="Документів немає" description="Для цього стану документи 1C не зафіксовані." />}</Card>
          <Card padding={4} className={styles.panel}><div className={styles.panelHeader}><div><h2>Відправлення дилеру</h2><Text type="supporting">Лише зафіксовані деталі доставки.</Text></div><Truck size={17} /></div>{order.shipments.length ? order.shipments.map((shipment) => <Card key={shipment.id} padding={3}><div className={styles.panelHeader}><div><Text weight="semibold">{shipment.carrier}</Text><Text type="supporting" display="block">{shipment.method} · {shipment.shippedAt}</Text></div><Badge label={shipment.status} variant="info" /></div><Text display="block">{shipment.destination}</Text>{shipment.tracking ? <Text type="supporting" display="block">ТТН: {shipment.tracking}</Text> : null}<div className={styles.actions}><DisabledAction label="Редагувати">Редагувати</DisabledAction><DisabledAction label="Позначити доставленим">Позначити доставленим</DisabledAction><DisabledAction label="Завантажити"><Download size={14} /> Завантажити</DisabledAction></div></Card>) : <EmptyState title="Відправлень немає" description="Для цього стану відправлення відсутні." />}</Card>
        </div>
        <aside className={`${styles.stack} ${styles.sideRail}`}><Card padding={4} className={styles.panel}><div className={styles.panelHeader}><h2>Дії</h2><LockKeyhole size={16} /></div><div className={styles.stack}>{model.hasCapturedPreflight ? <Button label="Перевірити перед підтвердженням" variant="secondary" onClick={() => model.setPreflightOpen(true)}><PackageCheck size={15} /> Перевірити перед підтвердженням</Button> : <Button label="Preflight не зафіксовано" variant="secondary" isDisabled aria-description={preflightUnavailableReason}><LockKeyhole size={15} /> Preflight не зафіксовано</Button>}<DisabledAction label="Відправити дилеру"><Send size={15} /> Відправити дилеру ({order.shipments.length})</DisabledAction><DisabledAction label="Перевірити старий склад" reason={legacyCheckUnavailableReason}><Warehouse size={15} /> Перевірити старий склад</DisabledAction><Text type="supporting">{legacyCheckUnavailableReason}</Text><DisabledAction label="Скасувати замовлення" variant="destructive"><Ban size={15} /> Скасувати замовлення</DisabledAction></div></Card>
          <Card padding={4} className={styles.panel}><h2>Інформація про замовлення</h2><dl className={styles.detailList}><DetailRow label="Замовлення №">{order.code}</DetailRow><DetailRow label="Статус"><Badge label={order.statusLabel} variant="neutral" /></DetailRow><DetailRow label="Етап">{order.stage}</DetailRow><DetailRow label="Компанія">{order.company}</DetailRow>{order.dealer ? <DetailRow label="Дилер">{order.dealer}</DetailRow> : null}<DetailRow label="Відправив">{order.contact}</DetailRow><DetailRow label="Створено">{order.created}</DetailRow><DetailRow label="PO">{order.po || "—"}</DetailRow></dl><p className={styles.note}><Text weight="semibold">Нотатки</Text><br />{order.notes || "Нотаток немає"}</p></Card>
          <Card padding={4} className={styles.panel}><div className={styles.panelHeader}><h2>Чат</h2><IconButton label="Розгорнути чат" icon={<Expand size={16} />} variant="ghost" onClick={() => model.setChatOpen(true)} /></div>{order.messages.slice(-2).map((message) => <article key={message.id} className={styles.chatMessage}><div className={styles.chatHeader}><Text weight="semibold">{message.author}</Text><Badge label={message.role} variant={message.role === "dealer" ? "info" : "warning"} /><Text type="supporting">{message.time}</Text></div><Text display="block">{message.body}</Text></article>)}{!order.messages.length ? <EmptyState title="Повідомлень поки немає" description="Розпочніть спілкування у робочому середовищі." /> : null}<div className={styles.actions}><IconButton label="Додати вкладення" icon={<Paperclip size={15} />} isDisabled aria-description={unavailable} /><TextInput label="Повідомлення" isLabelHidden value="" placeholder="Введіть повідомлення..." isDisabled disabledMessage={unavailable} onChange={() => {}} /><IconButton label="Надіслати" icon={<Send size={15} />} isDisabled aria-description={unavailable} /></div></Card>
          <Card padding={4} className={styles.panel}><Button label={`Хронологія ${order.timeline.length}`} variant="ghost" aria-expanded={model.timelineOpen} onClick={model.toggleTimeline}>{model.timelineOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}<ClipboardCheck size={16} /> Хронологія {order.timeline.length}</Button>{model.timelineOpen ? order.timeline.length ? <ol className={styles.timeline}>{order.timeline.map((event) => <li key={event.id}><Text weight="semibold">{event.time}</Text><Text>{event.text}</Text></li>)}</ol> : <Text type="supporting">Хронологія не зафіксована для цього рядка пайплайна.</Text> : null}</Card>
        </aside>
      </div>
    </div>
    <ChatDialog model={model} isRendererActive={isRendererActive} /><PreflightDialog model={model} isRendererActive={isRendererActive} />
  </main>;
}
