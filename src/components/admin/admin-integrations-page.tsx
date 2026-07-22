"use client";

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePause,
  Clock3,
  Database,
  Download,
  Globe2,
  KeyRound,
  Link2,
  LockKeyhole,
  Network,
  Package,
  PlugZap,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Unplug,
  X,
} from "lucide-react";
import { EmptyState, ReadOnlyButton, StatusBadge } from "@/components/shared/ui";
import {CurrentBrpUiProvider} from "@/components/brp-ui/current-brp-ui-provider";
import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
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
  type BossWebIntegrationTab,
  type BossWebOrderRow,
  type OneCIntegrationTab,
  type UnitMappingFilter,
} from "@/lib/admin-integrations-data";
import styles from "./admin-integrations.module.css";

const INTEGRATION_ACTION_REASON = "Операція потребує активного підключення до зовнішнього сервісу.";

const loadAstryxIntegrationsOverviewView = () => import("./astryx-admin-integrations-overview-view");
const loadAstryxOneCIntegrationsView = () => import("./astryx-admin-onec-integrations-view");
const loadAstryxUnitMappingView = () => import("./astryx-admin-unit-mapping-view");
const loadAstryxDealerMappingView = () => import("./astryx-admin-dealer-mapping-view");
const loadAstryxBossWebIntegrationsView = () => import("./astryx-admin-bossweb-integrations-view");

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value).replace(/[\u00a0\u202f]/g, " ");
}

function PageTitle({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>{icon}</span>
          <h1 className="page-title page-title-admin">{title}</h1>
        </div>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </header>
  );
}

function ImmediateSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`${styles.search} ${className ?? ""}`}>
      <Search size={15} aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value ? (
        <button type="button" className={styles.clearSearch} aria-label="Очистити пошук" onClick={() => onChange("")}>
          <X size={15} />
        </button>
      ) : null}
    </label>
  );
}

function IntegrationBadge({ id, children }: { id: "one-c" | "bossweb"; children: ReactNode }) {
  return <StatusBadge tone={id === "one-c" ? "red" : "blue"}>{children}</StatusBadge>;
}

export interface AdminIntegrationsOverviewViewProps {
  query: string;
  setQuery: (value: string) => void;
}

function CurrentAdminIntegrationsView({query, setQuery}: AdminIntegrationsOverviewViewProps) {
  const visibleIntegrations = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return integrationOverviewFixtures;
    return integrationOverviewFixtures.filter((item) => normalize([item.title, ...item.searchTerms].join(" ")).includes(normalizedQuery));
  }, [query]);

  return (
    <main className="page" data-admin-integrations-renderer="shadcn">
      <div className={styles.stack}>
        <PageTitle
          icon={<PlugZap size={22} />}
          title="Інтеграції"
          description="Керування підключеннями до зовнішніх систем"
          action={<ImmediateSearch value={query} onChange={setQuery} placeholder="Пошук інтеграцій, 1С, BossWeb..." />}
        />

        {visibleIntegrations.length ? (
          <section className={styles.overviewGrid} aria-label="Доступні інтеграції">
            {visibleIntegrations.map((integration) => (
              <article className={styles.overviewCard} key={integration.id}>
                <div className={styles.overviewCardTop}>
                  <span className={`${styles.overviewIcon} ${integration.id === "bossweb" ? styles.overviewIconBoss : ""}`}>
                    {integration.id === "one-c" ? <Database size={24} /> : <Globe2 size={24} />}
                  </span>
                  <IntegrationBadge id={integration.id}>{integration.badge}</IntegrationBadge>
                </div>
                <h2>{integration.title}</h2>
                <p>{integration.description}</p>

                {"telemetry" in integration ? (
                  <div className={styles.telemetry} aria-label="Зафіксована телеметрія 1С">
                    <div className={styles.telemetryRow}><span>Режим</span><strong>{integration.telemetry.mode}</strong></div>
                    <div className={styles.telemetryRow}><span>Відповідь</span><strong>{integration.telemetry.response}</strong></div>
                    <div className={styles.telemetryRow}><span>Фонове опитування</span><strong>{integration.telemetry.poller}</strong></div>
                    <div className={styles.errorStrip}><AlertTriangle size={13} /><span>{integration.telemetry.error}</span></div>
                  </div>
                ) : (
                  <div className={styles.telemetry} aria-label="Зафіксований стан BossWeb">
                    <div className={styles.telemetryRow}><span>Сесія</span><strong>активна</strong></div>
                    <div className={styles.telemetryRow}><span>Остання синхронізація</span><strong>8 год тому</strong></div>
                    <div className={styles.telemetryRow}><span>Зібрано у джерелі</span><strong>232 замовлення</strong></div>
                  </div>
                )}

                <Link className={styles.overviewLink} href={integration.href}>Налаштувати</Link>
              </article>
            ))}
          </section>
        ) : (
          <section className={`${styles.panel} max-w-[740px]`}>
            <EmptyState
              icon={<Search size={25} />}
              title="Нічого не знайдено"
              description="Пошук інтеграцій, 1С, BossWeb..."
            />
          </section>
        )}
      </div>
    </main>
  );
}

export function AdminIntegrationsPage() {
  const [query, setQuery] = useState("");
  const viewProps = {query, setQuery};
  return (
    <RendererViewSwitch
      slotId="admin-integrations-overview"
      currentView={<CurrentBrpUiProvider><CurrentAdminIntegrationsView {...viewProps} /></CurrentBrpUiProvider>}
      loadAstryxView={loadAstryxIntegrationsOverviewView}
      astryxViewProps={viewProps}
    />
  );
}

function OneCKpis() {
  return (
    <section className={styles.kpiGrid} aria-label="Показники експорту 1С">
      {oneCIntegrationKpis.map((kpi) => (
        <article className={styles.kpiCard} key={kpi.id}>
          <small>{kpi.label}</small>
          <strong>{formatInteger(kpi.value)}</strong>
          <span>{kpi.helper}</span>
        </article>
      ))}
    </section>
  );
}

function OneCSyncPanel() {
  return (
    <div className={styles.modeStack} role="tabpanel" aria-label="Синхронізація складу">
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div><h2>Режим синхронізації</h2><p>Поточний стан підключення до 1С</p></div>
          <StatusBadge tone="red">1С недоступна</StatusBadge>
        </header>
        <div className={`${styles.panelBody} grid gap-3`}>
          <div className={styles.noticeRed}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <strong className="flex items-center gap-2"><Unplug size={16} /> 1С недоступна</strong>
              <span className="text-[11px]">5001 мс · HTTP невідомо</span>
            </div>
            <p className="mb-0 mt-2 text-[11px]">The operation was aborted due to timeout</p>
            <p className="mb-0 mt-1 text-[10px]">Перевірено о 16:10:05</p>
          </div>
          <div className={styles.noticeAmber}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong className="flex items-center gap-2"><CirclePause size={16} /> Фонові OData-запити на паузі</strong>
                <p className="mb-0 mt-1 text-[11px]">Автоматичне опитування не виконується.</p>
              </div>
              <ReadOnlyButton><RefreshCw size={14} /> Відновити</ReadOnlyButton>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}><div><h2>Джерело даних</h2><p>Зміна режиму у джерелі застосовується одразу</p></div></header>
        <div className={`${styles.panelBody} ${styles.modeStack}`}>
          <button className={styles.modeButton} type="button" disabled title={INTEGRATION_ACTION_REASON}>
            <strong>FTP / CSV</strong>
            <span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">Legacy-режим: ручний або плановий імпорт SKU CSV.</span>
          </button>
          <button className={`${styles.modeButton} ${styles.modeButtonActive}`} type="button" disabled title={INTEGRATION_ACTION_REASON}>
            <strong>OData Polling</strong>
            <span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">Активний режим; автоматичне опитування призупинено.</span>
          </button>
          <div className={styles.noticeNeutral}>
            <strong className="flex items-center gap-2"><AlertTriangle size={15} /> Лише перегляд</strong>
            <p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">Перемикання режиму є негайною операційною дією, тому обидва контролери вимкнені.</p>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}><div><h2>Зіставлення та звіти</h2><p>Перехід до пов’язаних розділів інтеграції</p></div></header>
        <div className={`${styles.panelBody} ${styles.navigationStack}`}>
          <Link className={styles.navigationCard} href="/admin/integrations/1c/unit-mapping">
            <div><strong>Одиниця → Номенклатура 1С</strong><p>53 коди · 600 одиниць · 324 пов&apos;язано</p></div><ChevronRight size={17} />
          </Link>
          <Link className={styles.navigationCard} href="/admin/settlements/mapping">
            <div><strong>Дилер → Контрагент 1С</strong><p>20 дилерів · 19 зіставлено · 72 зв&apos;язки</p></div><ChevronRight size={17} />
          </Link>
          <Link className={styles.navigationCard} href="/admin/settlements">
            <div><strong>Взаєморозрахунки</strong><p>Звіт дилерських балансів та рухів</p></div><ChevronRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function OneCTokensPanel() {
  return (
    <section className={styles.panel} role="tabpanel" aria-label="API-токени">
      <header className={styles.panelHeader}><div><h2>API-токени</h2><p>Значення токена приховано з міркувань безпеки</p></div></header>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.table860}`}>
          <thead><tr><th>Назва</th><th>Токен</th><th>Стан</th><th>Останнє використання</th><th>Створено</th><th>Дії</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>Інтеграційний токен</strong></td>
              <td><code>••••••••••••••••••••••••</code></td>
              <td><button type="button" className="button button-outline !min-h-7 px-2 text-[10px]" disabled title={INTEGRATION_ACTION_REASON}>Активний</button></td>
              <td>не зафіксовано</td>
              <td>зафіксована дата прихована</td>
              <td>
                <div className="flex gap-1">
                  <ReadOnlyButton className="!min-h-7 !px-2" aria-label="Копіювати токен">Копіювати</ReadOnlyButton>
                  <ReadOnlyButton className="!min-h-7 !px-2">Оновити</ReadOnlyButton>
                  <button type="button" className="icon-button" disabled title={INTEGRATION_ACTION_REASON} aria-label="Видалити токен"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OneCHistoryPanel({page, setPage}: {page: number; setPage: Dispatch<SetStateAction<number>>}) {
  const start = (page - 1) * ONE_C_EXPORT_PAGE_SIZE;
  const rows = oneCExportHistory.slice(start, start + ONE_C_EXPORT_PAGE_SIZE);

  return (
    <section className={styles.panel} role="tabpanel" aria-label="Історія експорту">
      <header className={styles.panelHeader}><div><h2>Історія експорту</h2><p>262 позиції в журналі експорту</p></div></header>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.table860}`}>
          <thead><tr><th>Замовлення</th><th>Запчастина</th><th>Кількість</th><th>Дилер</th><th>Статус</th><th>Створено</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.orderCode}</strong></td><td>{row.partNumber}</td><td>{row.quantity}</td><td>{row.dealer}</td>
                <td><span className={styles.statusWaiting}>{row.status}</span></td><td>{row.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className={styles.pagination}>
        <span>Показано {start + 1}–{start + rows.length} з 262 позицій</span>
        <div className="flex items-center gap-2">
          <button type="button" className="button button-outline !min-h-8" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Назад</button>
          <strong className="text-[var(--foreground)]">{page} / {ONE_C_EXPORT_PAGE_COUNT}</strong>
          <button type="button" className="button button-outline !min-h-8" disabled={page === ONE_C_EXPORT_PAGE_COUNT} onClick={() => setPage((current) => Math.min(ONE_C_EXPORT_PAGE_COUNT, current + 1))}>Далі</button>
        </div>
      </footer>
    </section>
  );
}

function OneCDocsPanel() {
  return (
    <section className={styles.panel} role="tabpanel" aria-label="Документація API">
      <header className={styles.panelHeader}><div><h2>Документація API</h2><p>Приклади запитів із безпечними умовними значеннями</p></div></header>
      <div className={`${styles.panelBody} ${styles.docs}`}>
        <section>
          <h3>Авторизація</h3>
          <p>Базовий webhook URL:</p>
          <code className={styles.codeBlock}>https://integration.example.invalid/api/webhook/1c</code>
          <p>Передавайте токен лише через HTTP-заголовок. Авторизація через query string не підтримується.</p>
          <code className={styles.codeBlock}>Authorization: Bearer &lt;token&gt;</code>
        </section>
        <section>
          <h3>Phase 1 · Отримання замовлень</h3>
          <code className={styles.codeBlock}>{`GET /api/webhook/1c/orders?limit=20\nAuthorization: Bearer <token>\n\n{\n  "items": [{ "order": "ORDER-001", "status": "pending" }]\n}`}</code>
        </section>
        <section>
          <h3>Phase 2 · Підтвердження</h3>
          <code className={styles.codeBlock}>{`POST /api/webhook/1c/orders/ORDER-001/confirm\nAuthorization: Bearer <token>\nContent-Type: application/json\n\n{ "externalReference": "EXTERNAL-REFERENCE" }`}</code>
          <div className={`${styles.noticeRed} mt-3`}><AlertTriangle size={15} /><strong className="ml-2">Підтвердження змінює стан.</strong> Виконуйте запит лише з чинним токеном та перевіреним ідентифікатором замовлення.</div>
        </section>
      </div>
    </section>
  );
}

export interface AdminOneCIntegrationsViewProps {
  tab: OneCIntegrationTab;
  setTab: (value: OneCIntegrationTab) => void;
  historyPage: number;
  setHistoryPage: Dispatch<SetStateAction<number>>;
}

function CurrentAdminOneCIntegrationsView({tab, setTab, historyPage, setHistoryPage}: AdminOneCIntegrationsViewProps) {

  return (
    <main className="page" data-admin-onec-integrations-renderer="shadcn">
      <div className={styles.stack}>
        <PageTitle
          icon={<Database size={22} />}
          title="Інтеграції"
          description="Керування токенами вебхуків та налаштування експорту для синхронізації з 1С"
          action={<ReadOnlyButton><KeyRound size={14} /> Новий токен</ReadOnlyButton>}
        />
        <OneCKpis />
        <div className={styles.tabs} role="tablist" aria-label="Розділи інтеграції 1С">
          {oneCIntegrationTabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>
          ))}
        </div>
        {tab === "sync" ? <OneCSyncPanel /> : null}
        {tab === "tokens" ? <OneCTokensPanel /> : null}
        {tab === "history" ? <OneCHistoryPanel page={historyPage} setPage={setHistoryPage} /> : null}
        {tab === "docs" ? <OneCDocsPanel /> : null}
      </div>
    </main>
  );
}

export function AdminOneCIntegrationsPage() {
  const [tab, setTab] = useState<OneCIntegrationTab>("sync");
  const [historyPage, setHistoryPage] = useState(1);
  const viewProps = {tab, setTab, historyPage, setHistoryPage};
  return (
    <RendererViewSwitch
      slotId="admin-integrations-onec"
      currentView={<CurrentBrpUiProvider><CurrentAdminOneCIntegrationsView {...viewProps} /></CurrentBrpUiProvider>}
      loadAstryxView={loadAstryxOneCIntegrationsView}
      astryxViewProps={viewProps}
    />
  );
}

const unitFilters: readonly { id: UnitMappingFilter; label: string; count: number }[] = [
  { id: "all", label: "Усі", count: 53 },
  { id: "linked", label: "Пов'язані", count: 17 },
  { id: "pending", label: "Очікують", count: 36 },
];

export interface AdminUnitMappingViewProps {
  filter: UnitMappingFilter;
  setFilter: (value: UnitMappingFilter) => void;
  expandedCode: string | null;
  setExpandedCode: (value: string | null) => void;
}

function CurrentAdminUnitMappingView({filter, setFilter, expandedCode, setExpandedCode}: AdminUnitMappingViewProps) {
  const visibleCodes = useMemo(() => unitMappingCodes.filter((row) => filter === "all" || row.state === filter), [filter]);

  return (
    <main className="page" data-admin-unit-mapping-renderer="shadcn">
      <div className={styles.stack}>
        <Link href="/admin/integrations/1c" className="flex w-fit items-center gap-2 text-[12px] text-[var(--muted-foreground)]"><ArrowLeft size={14} /> До інтеграції 1С</Link>
        <PageTitle
          icon={<Boxes size={22} />}
          title="Одиниця → Номенклатура 1С"
          description="Зіставлення VIN і кодів моделей із номенклатурою 1С"
          action={<ReadOnlyButton><LockKeyhole size={14} /> Автоматично за VIN</ReadOnlyButton>}
        />

        <section className={`${styles.kpiGrid} ${styles.mappingKpis}`} aria-label="Показники зіставлення одиниць">
          <article className={styles.kpiCard}><small>Усього одиниць</small><strong>600</strong><span>53 коди моделей</span></article>
          <article className={styles.kpiCard}><small>Пов&apos;язано</small><strong>324</strong><span>17 кодів повністю</span></article>
          <article className={styles.kpiCard}><small>Очікують</small><strong>276</strong><span>36 кодів потребують уваги</span></article>
          <article className={styles.kpiCard}><small>Покриття</small><strong>54%</strong><span>324 з 600 одиниць</span><div className={styles.coverageTrack}><span /></div></article>
        </section>

        <div className={styles.filterRow} aria-label="Фільтр зіставлень">
          {unitFilters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setExpandedCode(null); }}>{item.label} ({item.count})</button>)}
        </div>

        <section className={styles.panel}>
          <header className={styles.panelHeader}><div><h2>Коди моделей</h2><p>{visibleCodes.length} записів у вибраному стані</p></div></header>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.table900}`}>
              <thead><tr><th aria-label="Розгорнути" /><th>Код</th><th>Категорія</th><th>Сімейство</th><th>Одиниць</th><th>Пов&apos;язано</th><th>Очікує</th><th>Статус</th></tr></thead>
              <tbody>
                {visibleCodes.map((row) => {
                  const isRepresentative = row.code === "4WTJ";
                  const expanded = expandedCode === row.id;
                  return [
                    <tr key={row.id}>
                      <td>
                        {isRepresentative ? (
                          <button type="button" className="icon-button" aria-label={expanded ? "Згорнути одиниці 4WTJ" : "Розгорнути одиниці 4WTJ"} aria-expanded={expanded} onClick={() => setExpandedCode(expanded ? null : row.id)}>
                            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        ) : <ChevronRight size={15} className="text-[var(--faint)]" aria-hidden="true" />}
                      </td>
                      <td><strong>{row.code}</strong></td><td>{row.category}</td><td>{row.family}</td><td>{row.units}</td><td>{row.linked}</td><td>{row.pending}</td>
                      <td><StatusBadge tone={row.state === "linked" ? "green" : "amber"}>{row.state === "linked" ? "Пов'язано" : "Очікує"}</StatusBadge></td>
                    </tr>,
                    ...(expanded ? representative4WTJUnits.map((unit) => (
                      <tr className={styles.childRow} key={unit.id}>
                        <td /><td><code>{unit.vin}</code></td><td>{unit.engineCode}</td><td>{unit.nomenclature ?? "Не зіставлено"}</td><td>1</td><td>{unit.state === "linked" ? 1 : 0}</td><td>{unit.state === "pending" ? 1 : 0}</td>
                        <td><ReadOnlyButton className="!min-h-7 !px-2">{unit.state === "linked" ? "Переглянути" : "Зв'язати"}</ReadOnlyButton></td>
                      </tr>
                    )) : []),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AdminUnitMappingPage() {
  const [filter, setFilter] = useState<UnitMappingFilter>("all");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const viewProps = {filter, setFilter, expandedCode, setExpandedCode};
  return (
    <RendererViewSwitch
      slotId="admin-integrations-unit-mapping"
      currentView={<CurrentBrpUiProvider><CurrentAdminUnitMappingView {...viewProps} /></CurrentBrpUiProvider>}
      loadAstryxView={loadAstryxUnitMappingView}
      astryxViewProps={viewProps}
    />
  );
}

export interface AdminDealerMappingViewProps {
  query: string;
  setQuery: (value: string) => void;
}

function CurrentAdminDealerMappingView({query, setQuery}: AdminDealerMappingViewProps) {
  const visibleDealers = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return dealerMappingRows;
    return dealerMappingRows.filter((row) => normalize(row.dealer).includes(normalizedQuery));
  }, [query]);

  return (
    <main className="page" data-admin-dealer-mapping-renderer="shadcn">
      <div className={styles.stack}>
        <Link href="/admin/integrations/1c" className="flex w-fit items-center gap-2 text-[12px] text-[var(--muted-foreground)]"><ArrowLeft size={14} /> До інтеграції 1С</Link>
        <PageTitle icon={<Network size={22} />} title="Дилер → Контрагент 1С" description="Зіставлення дилерів із контрагентами 1С" />
        <section className={styles.kpiGrid} aria-label="Показники зіставлення дилерів">
          <article className={styles.kpiCard}><small>Дилерів</small><strong>20</strong><span>Усього в системі</span></article>
          <article className={styles.kpiCard}><small>Зіставлено</small><strong>19</strong><span>Мають щонайменше один зв&apos;язок</span></article>
          <article className={styles.kpiCard}><small>Зв&apos;язків</small><strong>72</strong><span>Контрагенти різних категорій</span></article>
        </section>
        <ImmediateSearch value={query} onChange={setQuery} placeholder="Пошук дилера..." className={styles.dealerSearch} />

        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div><h2>Зіставлення дилерів</h2><p>Контрагенти та категорії зв’язків для кожного дилера</p></div>
            <ReadOnlyButton><Link2 size={14} /> Додати зв&apos;язок</ReadOnlyButton>
          </header>
          {visibleDealers.length ? (
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.table820}`}>
                <thead><tr><th>Дилер</th><th>Зв&apos;язки</th><th>Кількість</th><th>Дії</th></tr></thead>
                <tbody>
                  {visibleDealers.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.dealer}</strong></td>
                      <td>
                        {row.connections.length ? <div className="flex max-w-[620px] flex-wrap gap-1.5">{row.connections.map((connection) => <span className={styles.summaryPill} key={connection.id}>{connection.category} · {connection.label}</span>)}</div> : <span className="text-[var(--muted-foreground)]">Немає зв&apos;язків</span>}
                      </td>
                      <td>{row.connections.length}</td>
                      <td><div className="flex gap-1"><ReadOnlyButton className="!min-h-7 !px-2">Змінити</ReadOnlyButton><button type="button" className="icon-button" disabled title={INTEGRATION_ACTION_REASON} aria-label="Видалити зіставлення"><Trash2 size={14} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<Search size={25} />} title="Немає збігів" description="Спробуйте інше ім’я дилера." />}
        </section>
      </div>
    </main>
  );
}

export function AdminDealerMappingPage() {
  const [query, setQuery] = useState("");
  const viewProps = {query, setQuery};
  return (
    <RendererViewSwitch
      slotId="admin-integrations-dealer-mapping"
      currentView={<CurrentBrpUiProvider><CurrentAdminDealerMappingView {...viewProps} /></CurrentBrpUiProvider>}
      loadAstryxView={loadAstryxDealerMappingView}
      astryxViewProps={viewProps}
    />
  );
}

function BossStatus({ status }: { status: BossWebDeliveryStatus }) {
  return <span className={status === "Totally Delivered" ? styles.statusDelivered : styles.statusNotDelivered}>{status}</span>;
}

function BossSettingsPanel() {
  return (
    <div className={styles.settingsGrid} role="tabpanel" aria-label="Налаштування BossWeb">
      <section className={styles.panel}>
        <header className={styles.panelHeader}><div><h2>Сесія BossWeb</h2><p>Автентифікаційний стан без показу облікових даних</p></div><StatusBadge tone="green">Активна</StatusBadge></header>
        <div className={styles.settingRow}>
          <div><strong>Cookies / сесія</strong><p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">Збережена сесія використовується джерелом для читання.</p></div>
          <div className={styles.settingControls}><span className={styles.summaryPill}><ShieldCheck size={13} /> активна сесія</span><ReadOnlyButton>Оновити сесію</ReadOnlyButton></div>
        </div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}><div><h2>Період автоматичного збору</h2><p>Ці контролери можуть негайно запустити синхронізацію у джерелі</p></div></header>
        <div className={styles.settingRow}>
          <div><strong>Глибина, днів</strong><p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">Вихідне значення: 30.</p></div>
          <div className={styles.settingControls}>
            <input className="select max-w-[110px]" type="number" value={30} disabled readOnly aria-label="Глибина автоматичного збору" />
            {[30, 90, 180].map((value) => <button key={value} type="button" className="button button-outline" disabled title={INTEGRATION_ACTION_REASON}>{value} днів</button>)}
          </div>
        </div>
        <div className={`${styles.settingRow} border-t border-[var(--border)]`}>
          <div><strong>Збирати від дати</strong><p className="mb-0 mt-1 text-[11px] text-[var(--muted-foreground)]">Зафіксоване значення без запуску збору.</p></div>
          <div className={styles.settingControls}>
            <input className="select" type="date" value="2026-07-18" disabled readOnly aria-label="Початкова дата збору" />
            {["30d", "90d", "180d", "360d", "720d"].map((value) => <button key={value} type="button" className="button button-outline" disabled title={INTEGRATION_ACTION_REASON}>{value}</button>)}
          </div>
        </div>
        <div className="flex justify-end border-t border-[var(--border)] p-4"><ReadOnlyButton><Settings size={14} /> Зберегти</ReadOnlyButton></div>
      </section>
    </div>
  );
}

function BossOrderPositions({ order }: { order: BossWebOrderRow }) {
  return (
    <div className="grid gap-3 p-4">
      <div className="flex items-center justify-between gap-3"><strong>Позиції замовлення ({order.positions.length})</strong><span className={styles.summaryPill}>Деталі</span></div>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.table820}`}>
          <thead><tr><th>Позиція</th><th>Запчастина</th><th>Опис</th><th>Замовлено</th><th>Backorder</th><th>Відвантажено</th><th>ETA</th></tr></thead>
          <tbody>{order.positions.map((position) => <tr key={position.id}><td>{position.position}</td><td><strong>{position.partNumber}</strong></td><td>{position.description}</td><td>{position.ordered}</td><td>{position.backordered}</td><td>{position.shipped}</td><td>{position.eta}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function BossOrdersPanel({expandedOrder, setExpandedOrder}: {expandedOrder: string | null; setExpandedOrder: (value: string | null) => void}) {
  return (
    <section className={styles.panel} role="tabpanel" aria-label="Замовлення BossWeb">
      <header className={styles.panelHeader}>
        <div><h2>Замовлення BossWeb</h2><p>200 рядків показано з 232 · 25 Not Delivered · 175 Totally Delivered</p></div>
        <span className={styles.summaryPill}><Clock3 size={13} /> зібрано 8 год тому</span>
      </header>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.table1100}`}>
          <thead><tr><th aria-label="Розгорнути" /><th>BossWeb order</th><th>Дата</th><th>Customer order</th><th>Тип</th><th>Статус</th><th>Sales order</th><th>Зібрано</th></tr></thead>
          <tbody>
            {bossWebOrders.map((order) => {
              const expanded = expandedOrder === order.id;
              return [
                <tr key={order.id}>
                  <td>{order.positions.length ? <button type="button" className="icon-button" aria-expanded={expanded} aria-label={expanded ? "Згорнути позиції" : "Розгорнути позиції"} onClick={() => setExpandedOrder(expanded ? null : order.id)}>{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button> : <ChevronRight size={15} className="text-[var(--faint)]" />}</td>
                  <td><strong>{order.orderNumber}</strong></td><td>{order.date}</td><td>{order.customerOrder}</td><td>{order.type}</td><td><BossStatus status={order.status} /></td>
                  <td><ReadOnlyButton className="!min-h-7 !px-2"><Link2 size={12} /> Прив&apos;язати</ReadOnlyButton></td><td>{order.collectedAge}</td>
                </tr>,
                ...(expanded ? [<tr className={styles.childRow} key={`${order.id}-positions`}><td colSpan={8}><BossOrderPositions order={order} /></td></tr>] : []),
              ];
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BossPriceListsPanel() {
  return (
    <section className={styles.panel} role="tabpanel" aria-label="Прайс-листи BossWeb">
      <header className={styles.panelHeader}><div><h2>Прайс-листи</h2><p>П&apos;ять зафіксованих документів BossWeb</p></div><ReadOnlyButton><RefreshCw size={14} /> Синхронізувати</ReadOnlyButton></header>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.table900}`}>
          <thead><tr><th>Сімейство</th><th>Документ</th><th>Дата</th><th>Розмір</th><th>Імпортовано</th><th>Дія</th></tr></thead>
          <tbody>{bossWebPriceLists.map((price) => <tr key={price.id}><td><strong>{price.family}</strong></td><td>{price.document}</td><td>{price.documentDate}</td><td>{price.fileSize}</td><td>{price.synchronizedAge}</td><td><ReadOnlyButton className="!min-h-7 !px-2"><Download size={12} /> Завантажити</ReadOnlyButton></td></tr>)}</tbody>
        </table>
      </div>
      <div className={styles.priceTelemetry}>
        <span>Остання автоматична синхронізація: <strong>{BOSSWEB_PRICE_TELEMETRY.lastAutomaticSync}</strong></span>
        <span>Останній збережений імпорт: <strong>{BOSSWEB_PRICE_TELEMETRY.lastSavedImport}</strong></span>
        <span>Нових записів: <strong>{formatInteger(BOSSWEB_PRICE_TELEMETRY.newRecords)}</strong> · цін: <strong>{formatInteger(BOSSWEB_PRICE_TELEMETRY.prices)}</strong> · тривалість: <strong>{BOSSWEB_PRICE_TELEMETRY.durationSeconds} с</strong></span>
      </div>
    </section>
  );
}

function BossMatchingPanel() {
  return (
    <section className={styles.panel} role="tabpanel" aria-label="Зіставлення BossWeb">
      <header className={styles.panelHeader}><div><h2>Незіставлені замовлення</h2><p>232 окремі записи · 25 Not Delivered · 207 Totally Delivered</p></div><ReadOnlyButton><RefreshCw size={14} /> Повторно зіставити</ReadOnlyButton></header>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.table820}`}>
          <thead><tr><th>BossWeb order</th><th>Customer order</th><th>Статус</th><th>Дія</th></tr></thead>
          <tbody>{bossWebMatchingRows.map((row) => <tr key={row.id}><td><strong>{row.orderNumber}</strong></td><td>{row.customerOrder}</td><td><BossStatus status={row.status} /></td><td><ReadOnlyButton className="!min-h-7 !px-2"><Link2 size={12} /> Прив&apos;язати</ReadOnlyButton></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export interface AdminBossWebIntegrationsViewProps {
  tab: BossWebIntegrationTab;
  setTab: (value: BossWebIntegrationTab) => void;
  expandedOrder: string | null;
  setExpandedOrder: (value: string | null) => void;
}

function CurrentAdminBossWebIntegrationsView({tab, setTab, expandedOrder, setExpandedOrder}: AdminBossWebIntegrationsViewProps) {
  return (
    <main className="page" data-admin-bossweb-integrations-renderer="shadcn">
      <div className={styles.stack}>
        <Link href="/admin/integrations" className="flex w-fit items-center gap-2 text-[12px] text-[var(--muted-foreground)]"><ArrowLeft size={14} /> До інтеграцій</Link>
        <PageTitle
          icon={<Globe2 size={22} />}
          title="BossWeb"
          description="Замовлення, статуси доставки та прайс-листи BossWeb"
          action={<div className={styles.bossHeaderMeta}><span className={styles.summaryPill}><CheckCircle2 size={12} /> cookies активні</span><span className={styles.summaryPill}><Clock3 size={12} /> sync 8 год тому</span><span className={styles.summaryPill}><Package size={12} /> 232 замовлення</span></div>}
        />
        <div className={`${styles.tabs} ${styles.bossTabs}`} role="tablist" aria-label="Розділи BossWeb">
          {bossWebIntegrationTabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} key={item.id} onClick={() => setTab(item.id)}>{item.label}{"count" in item ? ` (${item.count})` : ""}</button>)}
        </div>
        {tab === "settings" ? <BossSettingsPanel /> : null}
        {tab === "orders" ? <BossOrdersPanel expandedOrder={expandedOrder} setExpandedOrder={setExpandedOrder} /> : null}
        {tab === "price-lists" ? <BossPriceListsPanel /> : null}
        {tab === "matching" ? <BossMatchingPanel /> : null}
      </div>
    </main>
  );
}

export function AdminBossWebIntegrationsPage() {
  const [tab, setTab] = useState<BossWebIntegrationTab>("settings");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const viewProps = {tab, setTab, expandedOrder, setExpandedOrder};
  return (
    <RendererViewSwitch
      slotId="admin-integrations-bossweb"
      currentView={<CurrentBrpUiProvider><CurrentAdminBossWebIntegrationsView {...viewProps} /></CurrentBrpUiProvider>}
      loadAstryxView={loadAstryxBossWebIntegrationsView}
      astryxViewProps={viewProps}
    />
  );
}
