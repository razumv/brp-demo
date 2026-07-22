"use client";

import {useLayoutEffect} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {Selector} from "@astryxdesign/core/Selector";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {AlertTriangle, Check, Clock3, Pause, Play, Terminal, Trash2} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AdminTasksViewProps} from "./admin-tasks-page";
import {adminQueueSummary, adminTaskCards, adminTasksIntegrationNote, catalogBrands, catalogSyncModes, catalogSyncPresets, catalogSyncTargets, SAFE_UPDATE_ORDER_HELPER, SAFE_UPDATE_ORDER_TITLE, type CatalogBrandId, type CatalogSyncModeId} from "@/lib/admin-tasks-data";
import styles from "./astryx-admin-governance.module.css";

type Props = AdminTasksViewProps & AstryxRendererViewProps;
const taskReason = "Операція потребує підключення сервісу фонових завдань.";

export default function AstryxAdminTasksView(props: Props) {
  useLayoutEffect(() => { const frame = requestAnimationFrame(props.onReady); return () => cancelAnimationFrame(frame); }, [props.onReady]);
  const empty = !props.showQueue && !props.showCatalog && !props.showSku && !props.showDanger;
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-tasks-renderer="astryx">
    <header className={styles.header}><div className={styles.headerCopy}><span className={styles.headerIcon}><Terminal size={20}/></span><div><Heading level={1}>Фонові завдання</Heading><Text color="secondary">Запуск адміністративних завдань та операцій обслуговування</Text></div></div></header>
    <TextInput label="Пошук за завданнями, чергою, синхронізаціями" isLabelHidden value={props.query} onChange={props.setQuery} placeholder="Пошук за завданнями, чергою, синхронізаціями..." hasClear width="100%"/>
    <div className={styles.taskGrid}>
      {props.showQueue ? <Card padding={4} className={styles.taskCard}><div className={styles.taskHeader}><div><Heading level={2}>Статус черги</Heading><div className={styles.queueMeta}><Badge label={`Workers ${adminQueueSummary.workers}`} variant="success"/><Badge label={`Active ${adminQueueSummary.active}`} variant="neutral"/><Badge label={`Waiting ${adminQueueSummary.waiting}`} variant="neutral"/><Badge label={`Done ${adminQueueSummary.done}`} variant="neutral"/><Badge label={`Failed ${adminQueueSummary.failed}`} variant="neutral"/></div></div><div className={styles.bulkActions}><Button label="Пауза" icon={<Pause size={14}/>} variant="secondary" isDisabled tooltip={taskReason}/><Button label="Очистити" icon={<Trash2 size={14}/>} variant="destructive" isDisabled tooltip={taskReason}/></div></div></Card> : null}
      {props.showCatalog ? <Card padding={4} className={styles.taskCard}><div className={styles.taskHeader}><div className={styles.taskTitle}><Terminal size={20}/><div><Heading level={2}>{adminTaskCards.catalogSync.title}</Heading><Text color="secondary">{adminTaskCards.catalogSync.description}</Text></div></div><Button label={adminTaskCards.catalogSync.actionLabel} icon={<Play size={14}/>} variant="primary" isDisabled tooltip={taskReason}/></div><div className={styles.targetGrid}>{catalogSyncTargets.map((target) => <Button key={target.id} label={target.label} icon={props.selection[target.id] ? <Check size={14}/> : undefined} variant={props.selection[target.id] ? "primary" : "secondary"} className={styles.targetButton} aria-pressed={props.selection[target.id]} onClick={() => props.setSelection((current) => ({...current, [target.id]: !current[target.id]}))}/>)}</div><div className={styles.selectGrid}><Selector label="Бренд" value={props.selection.brand} onChange={(value) => props.setSelection((current) => ({...current, brand: value as CatalogBrandId}))} options={catalogBrands.map((item) => ({value:item.id,label:item.label}))} width="100%"/><Selector label="Режим" value={props.selection.mode} onChange={(value) => props.setSelection((current) => ({...current, mode: value as CatalogSyncModeId}))} options={catalogSyncModes.map((item) => ({value:item.id,label:item.label}))} width="100%"/></div><Text type="supporting" color="secondary">{catalogSyncModes.find((item) => item.id === props.selection.mode)?.helper}</Text><div><Text weight="semibold" display="block">{SAFE_UPDATE_ORDER_TITLE}</Text><Text type="supporting" color="secondary">{SAFE_UPDATE_ORDER_HELPER}</Text></div><div className={styles.presetGrid}>{catalogSyncPresets.map((preset) => <Card key={preset.id} padding={3} className={styles.preset}><div><Text weight="semibold" display="block">{preset.step}. {preset.title}</Text><Text type="supporting" color="secondary">{preset.helper}</Text></div><Button label="Обрати" variant="secondary" size="sm" onClick={() => props.setSelection({...preset.selection})}/></Card>)}</div><Card padding={3}><div className={styles.taskTitle}><AlertTriangle size={17}/><div><Text weight="semibold" display="block">{adminTasksIntegrationNote.title}</Text>{adminTasksIntegrationNote.lines.map((line) => <Text key={line} type="supporting" color="secondary" display="block">{line}</Text>)}</div></div></Card></Card> : null}
      {props.showSku ? <Card padding={4} className={styles.taskCard}><div className={styles.taskHeader}><div className={styles.taskTitle}><Clock3 size={20}/><div><Heading level={2}>{adminTaskCards.skuSync.title}</Heading><Text color="secondary">{adminTaskCards.skuSync.description}</Text></div></div><Button label={adminTaskCards.skuSync.actionLabel} icon={<Play size={14}/>} variant="primary" isDisabled tooltip={taskReason}/></div></Card> : null}
      {props.showDanger ? <Card padding={4} className={`${styles.taskCard} ${styles.danger}`}><div className={styles.taskHeader}><div className={styles.taskTitle}><AlertTriangle size={20}/><div><Heading level={2}>{adminTaskCards.resetAll.title}</Heading><Text color="secondary">{adminTaskCards.resetAll.description}</Text></div></div><Button label={adminTaskCards.resetAll.actionLabel} icon={<Trash2 size={14}/>} variant="destructive" isDisabled tooltip={taskReason}/></div></Card> : null}
      {empty ? <Card padding={5} className={styles.empty}><Heading level={2}>Завдань не знайдено</Heading><Text color="secondary">Змініть пошуковий запит.</Text></Card> : null}
    </div>
  </main></AstryxBrpUiProvider>;
}
