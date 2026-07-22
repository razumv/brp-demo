"use client";

import {useLayoutEffect} from "react";
import {Activity, Check, CheckCircle2, Clock3, Database, RefreshCw, Server, Settings, Trash2, TriangleAlert, XCircle} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {Selector} from "@astryxdesign/core/Selector";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {AppearanceSettingsSection} from "@/components/appearance/appearance-settings-section";
import {databaseSettings, queueActions, queueMetrics, selectedWorkerCount, SETTINGS_EMPTY_COPY, workerExplanation, workerOptions} from "@/lib/admin-settings-data";
import type {AdminSettingsViewProps} from "./admin-settings-page";
import styles from "./astryx-admin-settings.module.css";

const actionReason = "Операція потребує підключення сервісу фонових завдань.";
const metricIcons = {pending: Clock3, active: Activity, completed: CheckCircle2, failed: XCircle} as const;
const actionIcons = {"clear-completed": Check, "clear-failed": Trash2, "reset-counters": RefreshCw, "clear-pending": TriangleAlert} as const;

function PanelHeader({icon, title, description}: {icon: React.ReactNode; title: string; description?: string}) {
  return <div className={styles.panelHeader}><span className={styles.panelIcon}>{icon}</span><div><Heading level={2}>{title}</Heading>{description ? <Text color="secondary">{description}</Text> : null}</div></div>;
}

function Workers() {
  return <Card padding={4} className={styles.panel}><PanelHeader icon={<Server size={17}/>} title="Налаштування воркерів"/><div className={styles.workerGrid}><Text color="secondary">{workerExplanation}</Text><Selector label="Паралельність воркерів" value={String(selectedWorkerCount)} onChange={() => undefined} options={workerOptions.map((item) => ({value:String(item.value),label:item.label}))} isDisabled disabledMessage="Кількість воркерів керується конфігурацією середовища." width="100%"/></div></Card>;
}

function Queue() {
  return <Card padding={4} className={styles.panel}><PanelHeader icon={<Database size={17}/>} title="Керування чергою" description="Поточні показники фонових завдань"/><section className={styles.metrics} aria-label="Показники черги">{queueMetrics.map((metric) => {const Icon = metricIcons[metric.id]; return <Card key={metric.id} padding={3} className={styles.metric}><Icon size={17}/><Text type="supporting" color="secondary">{metric.label}</Text><strong>{metric.value}</strong></Card>;})}</section><div className={styles.actions} aria-label="Дії з чергою">{queueActions.map((action) => {const Icon = actionIcons[action.id]; return <Button key={action.id} label={action.label} icon={<Icon size={14}/>} variant={action.tone === "danger" ? "destructive" : "secondary"} isDisabled tooltip={actionReason}/>;})}</div></Card>;
}

function DatabasePanel() {
  return <Card padding={4} className={styles.panel}><PanelHeader icon={<Database size={17}/>} title="База даних"/><dl className={styles.databaseRows}>{databaseSettings.map((setting) => <div key={setting.id} className={styles.databaseRow}><dt>{setting.label}</dt><dd>{setting.connected ? <Badge label={setting.value} variant="success"/> : setting.value}</dd></div>)}</dl></Card>;
}

export default function AstryxAdminSettingsView({query, setQuery, visibleSections, onReady}: AdminSettingsViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => { const frame = window.requestAnimationFrame(onReady); return () => window.cancelAnimationFrame(frame); }, [onReady]);
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-settings-renderer="astryx"><header className={styles.header}><div className={styles.headerCopy}><span className={styles.headerIcon}><Settings size={20}/></span><div><Heading level={1}>Налаштування</Heading><Text color="secondary">Конфігурація системних налаштувань та керування фоновими завданнями</Text></div></div><Button label="Оновити" icon={<RefreshCw size={15}/>} variant="secondary" isDisabled tooltip={actionReason}/></header><Card padding={3}><TextInput label="Пошук за налаштуваннями" isLabelHidden value={query} onChange={setQuery} placeholder="Пошук за налаштуваннями, чергою, воркерами, базою..." hasClear width="100%"/></Card>{visibleSections.length ? <div className={styles.panels}>{visibleSections.includes("appearance") ? <AppearanceSettingsSection/> : null}{visibleSections.includes("workers") ? <Workers/> : null}{visibleSections.includes("queue") ? <Queue/> : null}{visibleSections.includes("database") ? <DatabasePanel/> : null}</div> : <Card padding={6} className={styles.empty}><EmptyState title="Налаштувань не знайдено" description={SETTINGS_EMPTY_COPY}/></Card>}</main></AstryxBrpUiProvider>;
}
