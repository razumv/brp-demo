"use client";

import {Fragment, useLayoutEffect, useMemo} from "react";
import Link from "next/link";
import {AlertTriangle, ArrowLeft, Boxes, ChevronDown, ChevronRight, Database, Download, Globe2, KeyRound, Link2, Network, Package, PlugZap, RefreshCw, Search, ShieldCheck, Trash2, Unplug} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {IconButton} from "@astryxdesign/core/IconButton";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  BOSSWEB_PRICE_TELEMETRY,
  ONE_C_EXPORT_PAGE_COUNT,
  ONE_C_EXPORT_PAGE_SIZE,
  bossWebIntegrationTabs,
  bossWebMatchingRows,
  bossWebOrders,
  bossWebPriceLists,
  dealerMappingRows,
  integrationOverviewFixtures,
  oneCExportHistory,
  oneCIntegrationKpis,
  oneCIntegrationTabs,
  representative4WTJUnits,
  unitMappingCodes,
  type BossWebDeliveryStatus,
  type BossWebOrderRow,
  type UnitMappingFilter,
} from "@/lib/admin-integrations-data";
import type {
  AdminBossWebIntegrationsViewProps,
  AdminDealerMappingViewProps,
  AdminIntegrationsOverviewViewProps,
  AdminOneCIntegrationsViewProps,
  AdminUnitMappingViewProps,
} from "./admin-integrations-page";
import styles from "./astryx-admin-integrations.module.css";

const unavailableReason = "Операція потребує активного підключення до зовнішнього сервісу.";

function normalize(value: string) { return value.trim().toLocaleLowerCase("uk-UA"); }
function formatInteger(value: number) { return new Intl.NumberFormat("uk-UA").format(value).replace(/[\u00a0\u202f]/g, " "); }
function cleanLabel(value: string) { return value.replaceAll("DEMO-", "").replaceAll("Демо-", "").replaceAll("Демо ", ""); }

function useReady(onReady: () => void) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);
}

function Header({icon, title, description, action}: {icon: React.ReactNode; title: string; description: string; action?: React.ReactNode}) {
  return <header className={styles.header}><div className={styles.headerCopy}><span className={styles.headerIcon}>{icon}</span><div><Heading level={1}>{title}</Heading><Text color="secondary">{description}</Text></div></div>{action}</header>;
}

function BackLink({href, children}: {href: string; children: React.ReactNode}) { return <Link href={href} className={styles.back}><ArrowLeft size={14}/>{children}</Link>; }

function Kpis({items, label}: {items: readonly {id: string; label: string; value: string | number; helper: string}[]; label: string}) {
  return <section className={styles.kpis} aria-label={label}>{items.map((item) => <Card key={item.id} padding={3} className={styles.kpi}><Text type="supporting" color="secondary">{item.label}</Text><strong>{item.value}</strong><Text type="supporting" color="secondary">{item.helper}</Text></Card>)}</section>;
}

export function AstryxIntegrationsOverviewView({query, setQuery, onReady}: AdminIntegrationsOverviewViewProps & AstryxRendererViewProps) {
  useReady(onReady);
  const rows = useMemo(() => {
    const value = normalize(query);
    return value ? integrationOverviewFixtures.filter((item) => normalize(`${item.title} ${item.searchTerms.join(" ")}`).includes(value)) : integrationOverviewFixtures;
  }, [query]);
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-integrations-renderer="astryx">
    <Header icon={<PlugZap size={21}/>} title="Інтеграції" description="Керування підключеннями до зовнішніх систем" />
    <Card padding={3}><TextInput label="Пошук інтеграцій" isLabelHidden startIcon={<Search size={15}/>} value={query} onChange={setQuery} placeholder="Пошук інтеграцій, 1С, BossWeb..." hasClear width="100%"/></Card>
    {rows.length ? <section className={styles.overviewGrid} aria-label="Доступні інтеграції">{rows.map((integration) => <Card key={integration.id} padding={4} className={styles.integrationCard}>
      <div className={styles.cardTop}><span className={styles.cardIcon}>{integration.id === "one-c" ? <Database size={21}/> : <Globe2 size={21}/>}</span><Badge label={integration.badge} variant={integration.id === "one-c" ? "error" : "info"}/></div>
      <div><Heading level={2}>{integration.title}</Heading><Text color="secondary">{integration.description}</Text></div>
      <div className={styles.facts}>{"telemetry" in integration ? <><div className={styles.fact}><span>Режим</span><strong>{integration.telemetry.mode}</strong></div><div className={styles.fact}><span>Відповідь</span><strong>{integration.telemetry.response}</strong></div><div className={styles.fact}><span>Фонове опитування</span><strong>{integration.telemetry.poller}</strong></div><Text type="supporting"><AlertTriangle size={12}/> {integration.telemetry.error}</Text></> : <><div className={styles.fact}><span>Сесія</span><strong>активна</strong></div><div className={styles.fact}><span>Остання синхронізація</span><strong>8 год тому</strong></div><div className={styles.fact}><span>Замовлення</span><strong>232</strong></div></>}</div>
      <Button label="Налаштувати" variant="primary" onClick={() => { window.location.href = integration.href; }}/>
    </Card>)}</section> : <Card padding={6}><EmptyState title="Нічого не знайдено" description="Змініть пошуковий запит." icon={<Search size={32}/>} /></Card>}
  </main></AstryxBrpUiProvider>;
}

function OneCSync() {
  return <div className={styles.stack} role="tabpanel" aria-label="Синхронізація складу">
    <div className={styles.panelGrid}>
      <Card padding={4} className={styles.panel}><div className={styles.panelHeader}><div><Heading level={2}>Режим синхронізації</Heading><Text color="secondary">Поточний стан підключення до 1С</Text></div><Badge label="1С недоступна" variant="error"/></div><div className={styles.notice}><Text weight="semibold"><Unplug size={15}/> 1С недоступна</Text><Text type="supporting">The operation was aborted due to timeout · 5001 мс</Text></div><div className={`${styles.notice} ${styles.noticeWarning}`}><Text weight="semibold">Фонові OData-запити на паузі</Text><Button label="Відновити" icon={<RefreshCw size={14}/>} variant="secondary" isDisabled tooltip={unavailableReason}/></div></Card>
      <Card padding={4} className={styles.panel}><Heading level={2}>Джерело даних</Heading><Text color="secondary">OData Polling — активний режим</Text><SegmentedControl label="Джерело даних" value="odata" onChange={() => undefined} isDisabled layout="fill"><SegmentedControlItem value="ftp" label="FTP / CSV"/><SegmentedControlItem value="odata" label="OData Polling"/></SegmentedControl><Text type="supporting" color="secondary">Перемикання режиму стане доступним після відновлення підключення.</Text></Card>
    </div>
    <Card padding={4} className={styles.panel}><Heading level={2}>Зіставлення та звіти</Heading><div className={styles.navList}><Link className={styles.navCard} href="/admin/integrations/1c/unit-mapping"><span><strong>Одиниця → Номенклатура 1С</strong><Text type="supporting" color="secondary" display="block">53 коди · 600 одиниць · 324 пов’язано</Text></span><ChevronRight size={17}/></Link><Link className={styles.navCard} href="/admin/settlements/mapping"><span><strong>Дилер → Контрагент 1С</strong><Text type="supporting" color="secondary" display="block">20 дилерів · 19 зіставлено · 72 зв’язки</Text></span><ChevronRight size={17}/></Link><Link className={styles.navCard} href="/admin/settlements"><span><strong>Взаєморозрахунки</strong><Text type="supporting" color="secondary" display="block">Звіт дилерських балансів та рухів</Text></span><ChevronRight size={17}/></Link></div></Card>
  </div>;
}

function OneCTokens() {
  return <Card padding={4} className={styles.panel} role="tabpanel" aria-label="API-токени"><div className={styles.panelHeader}><div><Heading level={2}>API-токени</Heading><Text color="secondary">Значення токена приховано з міркувань безпеки</Text></div></div><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>Назва</th><th>Токен</th><th>Стан</th><th>Останнє використання</th><th>Дії</th></tr></thead><tbody><tr><td><strong>Інтеграційний токен</strong></td><td><code>••••••••••••••••</code></td><td><Badge label="Активний" variant="success"/></td><td>не зафіксовано</td><td><div className={styles.actions}><Button label="Копіювати" size="sm" variant="secondary" isDisabled tooltip={unavailableReason}/><IconButton label="Видалити токен" icon={<Trash2 size={14}/>} variant="destructive" isDisabled tooltip={unavailableReason}/></div></td></tr></tbody></table></div></Card>;
}

function OneCHistory({page, setPage}: {page: number; setPage: AdminOneCIntegrationsViewProps["setHistoryPage"]}) {
  const start = (page - 1) * ONE_C_EXPORT_PAGE_SIZE;
  const rows = oneCExportHistory.slice(start, start + ONE_C_EXPORT_PAGE_SIZE);
  return <Card padding={0} className={styles.panel} role="tabpanel" aria-label="Історія експорту"><div className={styles.panelHeader} style={{padding: 16}}><div><Heading level={2}>Історія експорту</Heading><Text color="secondary">262 позиції в журналі експорту</Text></div></div><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>Замовлення</th><th>Запчастина</th><th>Кількість</th><th>Дилер</th><th>Статус</th><th>Створено</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{cleanLabel(row.orderCode)}</strong></td><td>{cleanLabel(row.partNumber)}</td><td>{row.quantity}</td><td>{cleanLabel(row.dealer)}</td><td><Badge label={row.status} variant="warning"/></td><td>{row.createdAt}</td></tr>)}</tbody></table></div><footer className={styles.pagination} style={{padding: 16}}><Text type="supporting" color="secondary">Показано {start + 1}–{start + rows.length} з 262</Text><div className={styles.actions}><Button label="Назад" variant="secondary" isDisabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}/><Badge label={`${page} / ${ONE_C_EXPORT_PAGE_COUNT}`} variant="neutral"/><Button label="Далі" variant="secondary" isDisabled={page === ONE_C_EXPORT_PAGE_COUNT} onClick={() => setPage((value) => Math.min(ONE_C_EXPORT_PAGE_COUNT, value + 1))}/></div></footer></Card>;
}

function OneCDocs() {
  return <Card padding={4} className={styles.panel} role="tabpanel" aria-label="Документація API"><Heading level={2}>Документація API</Heading><Text color="secondary">Приклади запитів із безпечними умовними значеннями</Text><Heading level={3}>Авторизація</Heading><code className={styles.code}>Authorization: Bearer &lt;token&gt;</code><Heading level={3}>Отримання замовлень</Heading><code className={styles.code}>{`GET /api/webhook/1c/orders?limit=20\n\n{ "items": [{ "order": "ORDER-001", "status": "pending" }] }`}</code><Heading level={3}>Підтвердження</Heading><code className={styles.code}>{`POST /api/webhook/1c/orders/ORDER-001/confirm\n\n{ "externalReference": "EXTERNAL-REFERENCE" }`}</code><div className={styles.notice}><Text weight="semibold">Підтвердження змінює стан</Text><Text type="supporting">Виконуйте запит лише з чинним токеном та перевіреним ідентифікатором замовлення.</Text></div></Card>;
}

export function AstryxOneCIntegrationsView(props: AdminOneCIntegrationsViewProps & AstryxRendererViewProps) {
  useReady(props.onReady);
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-onec-integrations-renderer="astryx"><Header icon={<Database size={21}/>} title="Інтеграції" description="Керування токенами вебхуків та налаштування експорту для синхронізації з 1С" action={<Button label="Новий токен" icon={<KeyRound size={14}/>} isDisabled tooltip={unavailableReason}/>}/><Kpis label="Показники експорту 1С" items={oneCIntegrationKpis.map((item) => ({...item, value: formatInteger(item.value)}))}/><div className={styles.tabs}><TabList aria-label="Розділи інтеграції 1С" value={props.tab} onChange={(value) => props.setTab(value as typeof props.tab)} hasDivider>{oneCIntegrationTabs.map((item) => <Tab key={item.id} value={item.id} label={item.label}/>)}</TabList></div>{props.tab === "sync" ? <OneCSync/> : null}{props.tab === "tokens" ? <OneCTokens/> : null}{props.tab === "history" ? <OneCHistory page={props.historyPage} setPage={props.setHistoryPage}/> : null}{props.tab === "docs" ? <OneCDocs/> : null}</main></AstryxBrpUiProvider>;
}

const unitFilters: readonly {id: UnitMappingFilter; label: string}[] = [{id:"all",label:"Усі (53)"},{id:"linked",label:"Пов’язані (17)"},{id:"pending",label:"Очікують (36)"}];

export function AstryxUnitMappingView(props: AdminUnitMappingViewProps & AstryxRendererViewProps) {
  useReady(props.onReady);
  const rows = unitMappingCodes.filter((row) => props.filter === "all" || row.state === props.filter);
  const changeFilter = (value: string) => { props.setFilter(value as UnitMappingFilter); props.setExpandedCode(null); };
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-unit-mapping-renderer="astryx"><BackLink href="/admin/integrations/1c">До інтеграції 1С</BackLink><Header icon={<Boxes size={21}/>} title="Одиниця → Номенклатура 1С" description="Зіставлення VIN і кодів моделей із номенклатурою 1С" action={<Button label="Автоматично за VIN" isDisabled tooltip={unavailableReason}/>}/><Kpis label="Показники зіставлення одиниць" items={[{id:"all",label:"Усього одиниць",value:600,helper:"53 коди моделей"},{id:"linked",label:"Пов’язано",value:324,helper:"17 кодів повністю"},{id:"pending",label:"Очікують",value:276,helper:"36 кодів потребують уваги"},{id:"coverage",label:"Покриття",value:"54%",helper:"324 з 600 одиниць"}]}/><div className={styles.desktopOnly}><SegmentedControl label="Фільтр зіставлень" value={props.filter} onChange={changeFilter} layout="fill">{unitFilters.map((item) => <SegmentedControlItem key={item.id} value={item.id} label={item.label}/>)}</SegmentedControl></div><div className={styles.mobileOnly}><Selector label="Фільтр зіставлень" isLabelHidden value={props.filter} onChange={changeFilter} options={unitFilters.map((item) => ({value:item.id,label:item.label}))} width="100%"/></div><Card padding={0}><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th/><th>Код</th><th>Категорія</th><th>Сімейство</th><th>Одиниць</th><th>Пов’язано</th><th>Очікує</th><th>Статус</th></tr></thead><tbody>{rows.map((row) => <Fragment key={row.id}><tr><td>{row.code === "4WTJ" ? <IconButton label={props.expandedCode === row.id ? "Згорнути одиниці 4WTJ" : "Розгорнути одиниці 4WTJ"} icon={props.expandedCode === row.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} variant="ghost" onClick={() => props.setExpandedCode(props.expandedCode === row.id ? null : row.id)}/> : null}</td><td><strong>{row.code}</strong></td><td>{row.category}</td><td>{row.family}</td><td>{row.units}</td><td>{row.linked}</td><td>{row.pending}</td><td><Badge label={row.state === "linked" ? "Пов’язано" : "Очікує"} variant={row.state === "linked" ? "success" : "warning"}/></td></tr>{props.expandedCode === row.id ? <tr><td colSpan={8}><div className={styles.details}>{representative4WTJUnits.slice(0, 12).map((unit) => <div className={styles.rowHeader} key={unit.id}><code>{cleanLabel(unit.vin)}</code><Text type="supporting">{cleanLabel(unit.engineCode)} · {unit.nomenclature ? cleanLabel(unit.nomenclature) : "Не зіставлено"}</Text><Badge label={unit.state === "linked" ? "Пов’язано" : "Очікує"} variant={unit.state === "linked" ? "success" : "warning"}/></div>)}</div></td></tr> : null}</Fragment>)}</tbody></table></div></Card></main></AstryxBrpUiProvider>;
}

export function AstryxDealerMappingView(props: AdminDealerMappingViewProps & AstryxRendererViewProps) {
  useReady(props.onReady);
  const rows = dealerMappingRows.filter((row) => !normalize(props.query) || normalize(row.dealer).includes(normalize(props.query)));
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-dealer-mapping-renderer="astryx"><BackLink href="/admin/integrations/1c">До інтеграції 1С</BackLink><Header icon={<Network size={21}/>} title="Дилер → Контрагент 1С" description="Зіставлення дилерів із контрагентами 1С"/><Kpis label="Показники зіставлення дилерів" items={[{id:"dealers",label:"Дилерів",value:20,helper:"Усього в системі"},{id:"mapped",label:"Зіставлено",value:19,helper:"Мають щонайменше один зв’язок"},{id:"links",label:"Зв’язків",value:72,helper:"Контрагенти різних категорій"}]}/><Card padding={3}><TextInput label="Пошук дилера" isLabelHidden value={props.query} onChange={props.setQuery} placeholder="Пошук дилера..." startIcon={<Search size={15}/>} hasClear width="100%"/></Card><Card padding={0}><div className={styles.panelHeader} style={{padding:16}}><div><Heading level={2}>Зіставлення дилерів</Heading><Text color="secondary">Контрагенти та категорії зв’язків для кожного дилера</Text></div><Button label="Додати зв’язок" icon={<Link2 size={14}/>} isDisabled tooltip={unavailableReason}/></div>{rows.length ? <div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>Дилер</th><th>Зв’язки</th><th>Кількість</th><th>Дії</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.dealer}</strong></td><td><div className={styles.connections}>{row.connections.length ? row.connections.map((connection) => <Badge key={connection.id} label={`${connection.category} · ${cleanLabel(connection.label)}`} variant="neutral"/>) : <Text color="secondary">Немає зв’язків</Text>}</div></td><td>{row.connections.length}</td><td><Button label="Змінити" size="sm" variant="secondary" isDisabled tooltip={unavailableReason}/></td></tr>)}</tbody></table></div> : <EmptyState title="Немає збігів" description="Спробуйте інше ім’я дилера."/>}</Card></main></AstryxBrpUiProvider>;
}

function BossStatus({status}: {status: BossWebDeliveryStatus}) { return <Badge label={status} variant={status === "Totally Delivered" ? "success" : "warning"}/>; }

function BossSettings() { return <div className={styles.panelGrid} role="tabpanel" aria-label="Налаштування BossWeb"><Card padding={4} className={styles.panel}><div className={styles.panelHeader}><div><Heading level={2}>Сесія BossWeb</Heading><Text color="secondary">Автентифікаційний стан</Text></div><Badge label="Активна" variant="success"/></div><div className={styles.settingsRow}><Text weight="semibold"><ShieldCheck size={14}/> Cookies / сесія</Text><Button label="Оновити сесію" variant="secondary" isDisabled tooltip={unavailableReason}/></div></Card><Card padding={4} className={styles.panel}><Heading level={2}>Період автоматичного збору</Heading><Text color="secondary">Глибина: 30 днів · від 18.07.2026</Text><SegmentedControl label="Глибина збору" value="30" onChange={() => undefined} isDisabled layout="fill"><SegmentedControlItem value="30" label="30 днів"/><SegmentedControlItem value="90" label="90 днів"/><SegmentedControlItem value="180" label="180 днів"/></SegmentedControl><Button label="Зберегти" isDisabled tooltip={unavailableReason}/></Card></div>; }

function BossPositions({order}: {order: BossWebOrderRow}) { return <div className={styles.details}><Text weight="semibold">Позиції замовлення ({order.positions.length})</Text>{order.positions.map((position) => <div className={styles.rowHeader} key={position.id}><strong>{position.position}. {cleanLabel(position.partNumber)}</strong><Text type="supporting" color="secondary">{position.description}</Text><Badge label={`${position.ordered} замовлено`} variant="neutral"/></div>)}</div>; }

function BossOrders({props}: {props: AdminBossWebIntegrationsViewProps}) { return <Card padding={0} role="tabpanel" aria-label="Замовлення BossWeb"><div className={styles.panelHeader} style={{padding:16}}><div><Heading level={2}>Замовлення BossWeb</Heading><Text color="secondary">200 рядків показано з 232</Text></div><Badge label="зібрано 8 год тому" variant="neutral"/></div><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th/><th>BossWeb order</th><th>Дата</th><th>Customer order</th><th>Статус</th><th>Sales order</th></tr></thead><tbody>{bossWebOrders.map((order) => <><tr key={order.id}><td>{order.positions.length ? <IconButton label={props.expandedOrder === order.id ? "Згорнути позиції" : "Розгорнути позиції"} icon={props.expandedOrder === order.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} variant="ghost" onClick={() => props.setExpandedOrder(props.expandedOrder === order.id ? null : order.id)}/> : null}</td><td><strong>{cleanLabel(order.orderNumber)}</strong></td><td>{order.date}</td><td>{cleanLabel(order.customerOrder)}</td><td><BossStatus status={order.status}/></td><td><Button label="Прив’язати" size="sm" variant="secondary" isDisabled tooltip={unavailableReason}/></td></tr>{props.expandedOrder === order.id ? <tr key={`${order.id}-positions`}><td colSpan={6}><BossPositions order={order}/></td></tr> : null}</>)}</tbody></table></div></Card>; }

function BossPrices() { return <Card padding={0} role="tabpanel" aria-label="Прайс-листи BossWeb"><div className={styles.panelHeader} style={{padding:16}}><div><Heading level={2}>Прайс-листи</Heading><Text color="secondary">Актуальні документи за сімействами техніки</Text></div><Button label="Синхронізувати" icon={<RefreshCw size={14}/>} isDisabled tooltip={unavailableReason}/></div><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>Сімейство</th><th>Документ</th><th>Дата</th><th>Розмір</th><th>Імпортовано</th><th>Дія</th></tr></thead><tbody>{bossWebPriceLists.map((row) => <tr key={row.id}><td><strong>{row.family}</strong></td><td>{row.document}</td><td>{row.documentDate}</td><td>{row.fileSize}</td><td>{row.synchronizedAge}</td><td><Button label="Завантажити" icon={<Download size={12}/>} size="sm" variant="secondary" isDisabled tooltip={unavailableReason}/></td></tr>)}</tbody></table></div><div className={styles.settingsRow} style={{padding:16}}><Text type="supporting">Остання синхронізація: <strong>{BOSSWEB_PRICE_TELEMETRY.lastAutomaticSync}</strong></Text><Text type="supporting">Нових записів: <strong>{formatInteger(BOSSWEB_PRICE_TELEMETRY.newRecords)}</strong></Text></div></Card>; }

function BossMatching() { return <Card padding={0} role="tabpanel" aria-label="Зіставлення BossWeb"><div className={styles.panelHeader} style={{padding:16}}><div><Heading level={2}>Незіставлені замовлення</Heading><Text color="secondary">232 записи · 25 Not Delivered · 207 Totally Delivered</Text></div><Button label="Повторно зіставити" icon={<RefreshCw size={14}/>} isDisabled tooltip={unavailableReason}/></div><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>BossWeb order</th><th>Customer order</th><th>Статус</th><th>Дія</th></tr></thead><tbody>{bossWebMatchingRows.map((row) => <tr key={row.id}><td><strong>{cleanLabel(row.orderNumber)}</strong></td><td>{cleanLabel(row.customerOrder)}</td><td><BossStatus status={row.status}/></td><td><Button label="Прив’язати" icon={<Link2 size={12}/>} size="sm" variant="secondary" isDisabled tooltip={unavailableReason}/></td></tr>)}</tbody></table></div></Card>; }

export function AstryxBossWebIntegrationsView(props: AdminBossWebIntegrationsViewProps & AstryxRendererViewProps) {
  useReady(props.onReady);
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-bossweb-integrations-renderer="astryx"><BackLink href="/admin/integrations">До інтеграцій</BackLink><Header icon={<Globe2 size={21}/>} title="BossWeb" description="Замовлення, статуси доставки та прайс-листи BossWeb" action={<div className={styles.actions}><Badge label="cookies активні" variant="success"/><Badge label="sync 8 год тому" variant="neutral"/><Badge label="232 замовлення" variant="info" icon={<Package size={12}/>}/></div>}/><div className={styles.tabs}><TabList aria-label="Розділи BossWeb" value={props.tab} onChange={(value) => props.setTab(value as typeof props.tab)} hasDivider>{bossWebIntegrationTabs.map((item) => <Tab key={item.id} value={item.id} label={item.label}/>)}</TabList></div>{props.tab === "settings" ? <BossSettings/> : null}{props.tab === "orders" ? <BossOrders props={props}/> : null}{props.tab === "price-lists" ? <BossPrices/> : null}{props.tab === "matching" ? <BossMatching/> : null}</main></AstryxBrpUiProvider>;
}
