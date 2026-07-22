"use client";

import {useLayoutEffect, useState} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {IconButton} from "@astryxdesign/core/IconButton";
import {Selector} from "@astryxdesign/core/Selector";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {Filter, ShieldCheck, Users} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {AdminPermissionMatrix} from "./admin-permission-matrix";
import {dealerPermissionActions, policyRows, type AdminDealerAccessViewProps} from "./admin-dealer-access-page";
import {dealerCompanyOptions, dealerPermissionSummary} from "@/lib/admin-dealer-access-data";
import styles from "./astryx-admin-governance.module.css";

type Props = AdminDealerAccessViewProps & AstryxRendererViewProps;

export default function AstryxAdminDealerAccessView(props: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  useLayoutEffect(() => { const frame = requestAnimationFrame(props.onReady); return () => cancelAnimationFrame(frame); }, [props.onReady]);
  const visibleCount = props.visiblePermissionGroups.reduce((total, group) => total + group.permissions.length, 0);

  return <AstryxBrpUiProvider><main className={styles.page} data-admin-dealer-access-renderer="astryx">
    <header className={styles.header}>
      <div className={styles.headerCopy}><span className={styles.headerIcon}><ShieldCheck size={20}/></span><div><Heading level={1}>Доступи дилерської компанії</Heading><Text color="secondary">Задайте максимальний набір функцій для дилерської компанії.</Text></div></div>
      <div className={styles.companySelector}><Selector label="Дилерська компанія" isLabelHidden value={props.selectedCompany.slug} onChange={(value) => { const company = dealerCompanyOptions.find((item) => item.slug === value); if (company) props.onCompanySelect(company); }} options={dealerCompanyOptions.map((company) => ({value: company.slug, label: company.label}))} width="100%"/></div>
    </header>
    <Card padding={3} className={styles.toolbar}>
      <TextInput label="Пошук за командою, профілем або правом" isLabelHidden value={props.query} onChange={props.setQuery} placeholder="Пошук за командою, профілем, правом..." hasClear width="100%"/>
      <IconButton label="Фільтри доступу" icon={<Filter size={16}/>} variant="secondary" className={styles.filterButton} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}/>
      <div className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`}>
        <Selector label="Стан доступу команди" isLabelHidden value={props.teamAccess} onChange={(value) => props.setTeamAccess(value as typeof props.teamAccess)} options={[{value:"all",label:"Уся команда"},{value:"with-access",label:"Профіль Full Access"},{value:"without-access",label:"Без доступу"}]} width="100%"/>
        <Selector label="Стан політики компанії" isLabelHidden value={props.policyState} onChange={(value) => props.setPolicyState(value as typeof props.policyState)} options={[{value:"all",label:"Усі об'єкти політики"},{value:"on",label:"Є увімкнені права"},{value:"off",label:"Є вимкнені права"}]} width="100%"/>
      </div>
    </Card>
    <section aria-label="Команда дилера"><div className={styles.permissionHeader}><div><Heading level={2}>Команда дилера</Heading><Text type="supporting" color="secondary">Імена, акаунти та призначені профілі, які бачить дилер.</Text></div><Users size={18}/></div><div className={styles.teamGrid}>{props.visibleMembers.map((member) => <Card key={member.id} padding={3} className={styles.teamCard}><div className={styles.teamTitle}><div><Text weight="semibold" display="block">{member.displayName}</Text><Text type="supporting" color="secondary">{member.accountLabel}</Text></div><Badge label={member.role} variant={member.role === "Головний дилер" ? "success" : "neutral"}/></div><div className={styles.teamMeta}><Text type="supporting">Профіль: {member.profile}</Text><Badge label={member.accessStatus} variant={member.accessStatus === "Потрібно призначити доступ" ? "warning" : "success"}/></div></Card>)}</div></section>
    <section><div className={styles.permissionHeader}><div><Heading level={2}>Політика компанії</Heading><Text type="supporting" color="secondary">Показано {visibleCount} з {dealerPermissionSummary.total} прав · {dealerPermissionSummary.checked} увімкнено · {dealerPermissionSummary.unchecked} вимкнено</Text></div></div><AdminPermissionMatrix actions={dealerPermissionActions} rows={policyRows(props.visiblePermissionGroups)} ariaLabel="Політика компанії" emptyCopy="Немає доступних дилерських прав"/></section>
  </main></AstryxBrpUiProvider>;
}
