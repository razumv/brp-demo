"use client";

import {useLayoutEffect, useState} from "react";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {IconButton} from "@astryxdesign/core/IconButton";
import {Selector} from "@astryxdesign/core/Selector";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {Eye, Filter, Plus, ShieldCheck, Trash2} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {AdminPermissionMatrix} from "./admin-permission-matrix";
import {matrixActions, matrixRows, type AdminPermissionsViewProps} from "./admin-permissions-page";
import {adminPermissionRoles, adminPermissionSummaries, type AdminPermissionRole} from "@/lib/admin-permissions-data";
import styles from "./astryx-admin-governance.module.css";

type Props = AdminPermissionsViewProps & AstryxRendererViewProps;
const lockReason = "Зміна дозволів потребує підключення сервісу керування доступом.";

export default function AstryxAdminPermissionsView(props: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  useLayoutEffect(() => { const frame = requestAnimationFrame(props.onReady); return () => cancelAnimationFrame(frame); }, [props.onReady]);
  return <AstryxBrpUiProvider><main className={styles.page} data-admin-permissions-renderer="astryx">
    <header className={styles.header}><div className={styles.headerCopy}><span className={styles.headerIcon}><ShieldCheck size={20}/></span><div><Heading level={1}>Контроль доступу</Heading><Text color="secondary">Налаштуйте, що може робити кожна роль. Адміністратор завжди має повний доступ.</Text><Text type="supporting" color="secondary" display="block">Роль адміністратора завжди має повний доступ і не показана тут.</Text></div></div></header>
    <Card padding={3} className={styles.toolbar}>
      <TextInput label="Пошук за правами, об'єктом або дією" isLabelHidden value={props.query} onChange={props.setQuery} placeholder="Пошук за правами, об'єктом, дією..." hasClear width="100%"/>
      <IconButton label="Фільтри дозволів" icon={<Filter size={16}/>} variant="secondary" className={styles.filterButton} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}/>
      <div className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`}>
        <Selector label="Роль доступу" isLabelHidden value={props.activeRole} onChange={(value) => props.setActiveRole(value as AdminPermissionRole)} options={adminPermissionRoles.map((role) => ({value: role.id, label: `${role.label} (${adminPermissionSummaries[role.id].checked}/${adminPermissionSummaries[role.id].total})`}))} width="100%"/>
        <Selector label="Стан дозволів" isLabelHidden value={props.permissionState} onChange={(value) => props.setPermissionState(value as typeof props.permissionState)} options={[{value:"all",label:"Усі об'єкти"},{value:"on",label:"Є увімкнені дії"},{value:"off",label:"Є вимкнені дії"}]} width="100%"/>
      </div>
    </Card>
    <div className="hidden md:block"><TabList aria-label="Ролі доступу" value={props.activeRole} onChange={(value) => props.setActiveRole(value as AdminPermissionRole)} hasDivider>{adminPermissionRoles.map((role) => <Tab key={role.id} value={role.id} label={`${role.label} ${adminPermissionSummaries[role.id].checked}/${adminPermissionSummaries[role.id].total}`}/>)}</TabList></div>
    <div className={styles.permissionHeader}><div><Heading level={2}>Дозволи ролі {props.role.label}</Heading><Text type="supporting" color="secondary">Доступні дії залежать від об&apos;єкта та ролі.</Text></div><div className={styles.bulkActions}><Button label="Дати читання" icon={<Eye size={14}/>} variant="secondary" isDisabled tooltip={lockReason}/><Button label="Дати все" icon={<Plus size={14}/>} variant="secondary" isDisabled tooltip={lockReason}/><Button label="Відкликати все" icon={<Trash2 size={14}/>} variant="destructive" isDisabled tooltip={lockReason}/></div></div>
    <AdminPermissionMatrix actions={matrixActions(props.role)} rows={matrixRows(props.filteredEntities)} ariaLabel={`Дозволи ролі ${props.role.label}`}/>
  </main></AstryxBrpUiProvider>;
}
