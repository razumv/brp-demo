"use client";

import {useLayoutEffect, useMemo, useState} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Dialog, DialogHeader} from "@astryxdesign/core/Dialog";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {IconButton} from "@astryxdesign/core/IconButton";
import {Layout, LayoutContent, LayoutFooter} from "@astryxdesign/core/Layout";
import {Selector} from "@astryxdesign/core/Selector";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {Building2, Filter, LockKeyhole, Pencil, Plus, Trash2, UserPlus, Users} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {adminCompanies, emptyCompanyForm, type AdminCompany, type CompanyFormFixture} from "@/lib/admin-companies-data";
import type {AdminCompaniesModel} from "./admin-companies-page";
import {useAdminViewPreference} from "./use-admin-view-preference";
import styles from "./astryx-admin-companies-view.module.css";

type Props = {model: AdminCompaniesModel} & AstryxRendererViewProps;

const lockedCreateReason = "Створення компанії потребує підключення сервісу компаній.";
type CompanyTableRow = AdminCompany & Record<string, unknown>;

function companyProfileLabel(status: AdminCompany["profileStatus"]) {
  return status === "complete" ? "Профіль заповнений" : "Профіль неповний";
}

function CompanyDialog({model}: {model: AdminCompaniesModel}) {
  const dialog = model.dialog;
  const company = dialog && dialog.mode !== "create"
    ? adminCompanies.find((item) => item.id === dialog.companyId) ?? null
    : null;
  const [form, setForm] = useState<CompanyFormFixture>(emptyCompanyForm);

  if (!dialog) return null;

  const isAssign = dialog.mode === "assign";
  const isEdit = dialog.mode === "edit";
  const title = isAssign ? "Призначити працівника" : isEdit ? "Редагувати компанію" : "Створити нову компанію";
  const saveLabel = isAssign ? "Призначити працівника" : isEdit ? "Оновити компанію" : "Створити компанію";
  const reason = isAssign
    ? "Призначення працівника потребує підключення сервісу облікових записів."
    : isEdit
      ? "Оновлення компанії потребує підключення сервісу компаній."
      : lockedCreateReason;

  const update = (key: keyof CompanyFormFixture, value: string) => setForm((current) => ({...current, [key]: value}));
  const seed = isEdit && company ? company.editFixture : form;

  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) model.closeDialog(); }} purpose="form" width="min(720px, calc(100vw - 24px))" maxHeight="calc(100vh - 24px)" aria-label={title}>
      <Layout
        defaultHasDividers
        header={<DialogHeader title={title} subtitle={company ? company.name : "Заповніть дані компанії."} onOpenChange={() => model.closeDialog()} />}
        content={(
          <LayoutContent padding={4}>
            {isAssign ? (
              <Selector
                label="Оберіть працівника"
                options={[{value: "", label: "Працівник недоступний"}]}
                value=""
                onChange={() => undefined}
                isDisabled
                disabledMessage="Призначення працівника потребує доступу до облікових записів."
                width="100%"
              />
            ) : (
              <div className={styles.dialogFields}>
                <TextInput label="Назва компанії" isRequired value={seed.companyName} onChange={(value) => update("companyName", value)} width="100%" />
                <TextInput label="Ім’я менеджера" value={seed.managerName.replace(/^Демо /, "")} onChange={(value) => update("managerName", value)} width="100%" />
                <TextInput label="Телефон менеджера" value={seed.managerPhone.replace(/^Демо /, "")} onChange={(value) => update("managerPhone", value)} width="100%" />
                <TextInput label="Місто" value={seed.city.replace(/^Демо /, "")} onChange={(value) => update("city", value)} width="100%" />
              </div>
            )}
          </LayoutContent>
        )}
        footer={(
          <LayoutFooter hasDivider padding={3}>
            <div className={styles.dialogActions}>
              <Button label="Скасувати" variant="secondary" onClick={() => model.closeDialog()} />
              <Button label={saveLabel} icon={<LockKeyhole size={14} />} variant="primary" isDisabled tooltip={reason} />
            </div>
          </LayoutFooter>
        )}
      />
    </Dialog>
  );
}

function CompanyEmployees({company, model}: {company: AdminCompany; model: AdminCompaniesModel}) {
  const employeeOpen = model.openEmployeesId === company.id;
  return (
    <>
      <Button label={`Працівники ${company.name}`} icon={<Users size={14} />} endContent={company.employeeCount} variant="secondary" size="sm" onClick={() => model.toggleEmployees(company.id)} aria-expanded={employeeOpen} />
      {employeeOpen ? (
        <div className={styles.employeeList} role="region" aria-label={`Працівники ${company.name}`}>
          {company.employees.map((employee) => <Text key={employee.id} type="supporting" display="block">{employee.displayLabel} · {employee.role}</Text>)}
        </div>
      ) : null}
    </>
  );
}

function CompanyActionSet({company, model}: {company: AdminCompany; model: AdminCompaniesModel}) {
  return (
    <>
      <IconButton label={`Редагувати ${company.name}`} icon={<Pencil size={15} />} variant="ghost" tooltip="Редагувати компанію" onClick={() => model.openDialog({mode: "edit", companyId: company.id})} />
      <IconButton label={`Призначити працівника в ${company.name}`} icon={<UserPlus size={15} />} variant="ghost" tooltip="Призначити працівника" onClick={() => model.openDialog({mode: "assign", companyId: company.id})} />
      <IconButton label={`Видалити ${company.name} — недоступно`} icon={<Trash2 size={15} />} variant="destructive" isDisabled tooltip="Видалення компанії потребує підключення сервісу компаній." />
    </>
  );
}

function CompanyCard({company, model}: {company: AdminCompany; model: AdminCompaniesModel}) {
  return (
    <Card padding={2} className={styles.companyCard} data-record-id={company.id}>
      <div className={styles.companyTitle}>
        <span className={styles.companyIcon}><Building2 size={18} /></span>
        <div>
          <Text weight="semibold" display="block">{company.name}</Text>
          <Text type="supporting" color="secondary">{company.managerSummary ?? "Менеджера не призначено"}</Text>
        </div>
      </div>
      <div className={styles.companyMeta}>
        <Badge label={companyProfileLabel(company.profileStatus)} variant={company.profileStatus === "complete" ? "success" : "warning"} />
        <Text type="supporting" color="secondary">Створена {company.createdAt}</Text>
      </div>
      <div className={styles.cardActions}>
        <CompanyEmployees company={company} model={model} />
        <CompanyActionSet company={company} model={model} />
      </div>
    </Card>
  );
}

function CompanyCards({companies, model}: {companies: readonly AdminCompany[]; model: AdminCompaniesModel}) {
  return <section className={styles.companyGrid} aria-label="Компанії">{companies.map((company) => <CompanyCard key={company.id} company={company} model={model} />)}</section>;
}

function CompanyList({companies, model}: {companies: readonly AdminCompany[]; model: AdminCompaniesModel}) {
  const columns = useMemo<TableColumn<CompanyTableRow>[]>(() => [
    {key: "name", header: "Компанія", width: proportional(1.4), renderCell: (company) => <div className={styles.tableIdentity}><span className={styles.companyIcon}><Building2 size={15} /></span><span><strong>{company.name}</strong><Text type="supporting" color="secondary" display="block">{company.managerSummary ?? "Менеджера не призначено"}</Text></span></div>},
    {key: "profileStatus", header: "Профіль", width: pixel(150), renderCell: (company) => <Badge label={companyProfileLabel(company.profileStatus)} variant={company.profileStatus === "complete" ? "success" : "warning"} />},
    {key: "createdAt", header: "Створено", width: pixel(126), renderCell: (company) => <Text type="supporting" color="secondary">Створена {company.createdAt}</Text>},
    {key: "employeeCount", header: "Працівники", width: pixel(144), renderCell: (company) => <CompanyEmployees company={company} model={model} />},
    {key: "id", header: "Дії", width: pixel(150), renderCell: (company) => <div className={styles.tableActions}><CompanyActionSet company={company} model={model} /></div>},
  ], [model]);
  const rows: CompanyTableRow[] = companies.map((company) => ({...company}));

  return (
    <>
      <Card padding={0} className={styles.desktopList}>
        <div className={styles.tableScroller}>
          <Table aria-label="Список компаній" data={rows} columns={columns} idKey="id" density="compact" dividers="rows" hasHover />
        </div>
      </Card>
      <section className={styles.mobileList} aria-label="Список компаній">
        {companies.map((company) => <article key={company.id} className={styles.mobileListRow} data-record-id={company.id}>
          <div className={styles.companyTitle}><span className={styles.companyIcon}><Building2 size={16} /></span><div><Text weight="semibold" display="block">{company.name}</Text><Text type="supporting" color="secondary">{company.managerSummary ?? "Менеджера не призначено"}</Text></div></div>
          <div className={styles.companyMeta}><Badge label={companyProfileLabel(company.profileStatus)} variant={company.profileStatus === "complete" ? "success" : "warning"} /><Text type="supporting" color="secondary">Створена {company.createdAt}</Text></div>
          <div className={styles.cardActions}><CompanyEmployees company={company} model={model} /><CompanyActionSet company={company} model={model} /></div>
        </article>)}
      </section>
    </>
  );
}

export default function AstryxAdminCompaniesView({model, onReady}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useAdminViewPreference("companies");
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
    <main className={styles.page} data-admin-companies-renderer="astryx" data-admin-companies-view={viewMode}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.headerIcon}><Building2 size={20} /></span>
          <div><Heading level={1}>Управління компаніями</Heading><Text color="secondary">Створюйте компанії та призначайте працівників.</Text></div>
        </div>
        <Button label="Нова компанія" icon={<Plus size={15} />} variant="primary" onClick={() => model.openDialog({mode: "create"})} />
      </header>

      <Card padding={3} className={styles.toolbar}>
        <TextInput label="Пошук компаній" isLabelHidden startIcon={<Building2 size={15} />} value={model.query} onChange={model.setQuery} placeholder="Пошук компаній..." hasClear width="100%" />
        <IconButton label="Фільтри компаній" icon={<Filter size={16} />} variant="secondary" className={styles.mobileFilterButton} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)} />
        <div className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`}>
          <Selector label="Стан профілю компанії" isLabelHidden value={model.profileStatus} onChange={(value) => model.setProfileStatus(value as typeof model.profileStatus)} options={[{value: "all", label: "Усі профілі"}, {value: "complete", label: "Профіль заповнений"}, {value: "incomplete", label: "Профіль неповний"}]} width="100%" />
          <Selector label="Стан менеджера компанії" isLabelHidden value={model.managerState} onChange={(value) => model.setManagerState(value as typeof model.managerState)} options={[{value: "all", label: "Усі менеджери"}, {value: "assigned", label: "Менеджер призначений"}, {value: "unassigned", label: "Менеджер не призначений"}]} width="100%" />
        </div>
        <div className={styles.viewControl}>
          <SegmentedControl label="Вигляд компаній" value={viewMode} onChange={(value) => setViewMode(value as typeof viewMode)} size="sm">
            <SegmentedControlItem value="cards" label="Картки" />
            <SegmentedControlItem value="list" label="Список" />
          </SegmentedControl>
        </div>
      </Card>

      {model.visibleCompanies.length ? (viewMode === "cards" ? <CompanyCards companies={model.visibleCompanies} model={model} /> : <CompanyList companies={model.visibleCompanies} model={model} />) : <Card padding={6}><EmptyState title="Компаній не знайдено" /></Card>}
      <section className={styles.kpis} aria-label="Показники компаній">
        <Card padding={3}><Text type="supporting" color="secondary">Всього компаній</Text><Heading level={2}>{adminCompanies.length}</Heading></Card>
        <Card padding={3}><Text type="supporting" color="secondary">Профілі заповнені</Text><Heading level={2}>{adminCompanies.filter((item) => item.profileStatus === "complete").length}</Heading></Card>
        <Card padding={3}><Text type="supporting" color="secondary">Працівники</Text><Heading level={2}>{adminCompanies.reduce((total, item) => total + item.employeeCount, 0)}</Heading></Card>
      </section>
      <CompanyDialog model={model} />
    </main>
    </AstryxBrpUiProvider>
  );
}
