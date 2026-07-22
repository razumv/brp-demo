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
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Table, pixel, proportional, type TableColumn} from "@astryxdesign/core/Table";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {Building2, CheckCircle2, CircleX, Clock3, LockKeyhole, Pencil, ShieldCheck, Trash2, UserRound, UsersRound} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {useMediaQuery} from "@/hooks/use-media-query";
import {useResponsiveFocusBridge} from "@/hooks/use-responsive-focus-bridge";
import {adminUserCompanyOptions, adminUserRoleLabels, adminUserRoleOptions, adminUserTabs, dealerCompanyRoleOptions, managerPermissionRows, type AdminUserRecord} from "@/lib/admin-users-data";
import type {AdminUsersModel} from "./admin-users-page";
import {useAdminViewPreference} from "./use-admin-view-preference";
import styles from "./astryx-admin-users-view.module.css";

type Props = {model: AdminUsersModel} & AstryxRendererViewProps;
type UserTableRow = AdminUserRecord & Record<string, unknown>;

function publicName(value: string) {
  return value.replace(/^Демо-користувач/, "Користувач");
}

function permissionLabel(state: string) {
  if (state === "na") return "—";
  return state === "on" ? "Увімк." : "Вимк.";
}

function UserBadges({user}: {user: AdminUserRecord}) {
  const roleVariant = user.role === "admin" ? "error" : user.role === "manager" ? "warning" : "success";
  return (
    <div className={styles.userBadges}>
      <Badge label={adminUserRoleLabels[user.role]} icon={user.role === "admin" ? <ShieldCheck size={12} /> : <UserRound size={12} />} variant={roleVariant} />
      <Badge label="Активний" icon={<CheckCircle2 size={12} />} variant="success" />
    </div>
  );
}

function UserActionSet({user, model}: {user: AdminUserRecord; model: AdminUsersModel}) {
  return (
    <>
      <span data-focus-key={`${user.id}:edit`}><IconButton label={`Редагувати ${publicName(user.displayName)}`} icon={<Pencil size={15} />} variant="ghost" tooltip="Редагувати користувача" onClick={() => model.setSelectedUser(user)} /></span>
      <span data-focus-key={`${user.id}:deactivate`}><IconButton label={`Деактивувати ${publicName(user.displayName)} — заблоковано`} icon={<CircleX size={15} />} variant="destructive" isDisabled tooltip="Деактивація користувача потребує підключення сервісу облікових записів." /></span>
      <span data-focus-key={`${user.id}:delete`}><IconButton label={`Видалити ${publicName(user.displayName)} — заблоковано`} icon={<Trash2 size={15} />} variant="destructive" isDisabled tooltip="Видалення користувача потребує підключення сервісу облікових записів." /></span>
    </>
  );
}

function UserCard({user, model}: {user: AdminUserRecord; model: AdminUsersModel}) {
  return (
    <Card padding={2} className={styles.userCard} data-record-id={user.id}>
      <div className={styles.userIdentity}>
        <span className={styles.avatar}>{publicName(user.displayName).slice(-2)}</span>
        <div><Text weight="semibold" display="block">{publicName(user.displayName)}</Text><Text type="supporting" color="secondary">{user.email}</Text></div>
      </div>
      <div className={styles.userMeta}><Building2 size={14} /><Text>{user.company}</Text><Text type="supporting" color="secondary">{user.registrationAge}</Text></div>
      <UserBadges user={user} />
      <div className={styles.userActions}>
        <UserActionSet user={user} model={model} />
      </div>
    </Card>
  );
}

function UserCards({users, model}: {users: readonly AdminUserRecord[]; model: AdminUsersModel}) {
  return <section className={styles.userGrid} aria-label="Активні користувачі">{users.map((user) => <UserCard key={user.id} user={user} model={model} />)}</section>;
}

function UserList({users, model}: {users: readonly AdminUserRecord[]; model: AdminUsersModel}) {
  const isDesktopViewport = useMediaQuery("(min-width: 768px)");
  const [focusBridgeRef, onFocusCapture] = useResponsiveFocusBridge(isDesktopViewport);
  const columns = useMemo<TableColumn<UserTableRow>[]>(() => [
    {key: "displayName", header: "Користувач", width: proportional(1.2), renderCell: (user) => <div className={styles.tableIdentity}><span className={styles.avatar}>{publicName(user.displayName).slice(-2)}</span><span><strong>{publicName(user.displayName)}</strong><Text type="supporting" color="secondary" display="block">{user.email}</Text></span></div>},
    {key: "company", header: "Компанія", width: proportional(1), renderCell: (user) => <div className={styles.userMeta}><Building2 size={14} /><Text>{user.company}</Text></div>},
    {key: "role", header: "Роль і стан", width: pixel(170), renderCell: (user) => <UserBadges user={user} />},
    {key: "registrationAge", header: "Реєстрація", width: pixel(130), renderCell: (user) => <Text type="supporting" color="secondary">{user.registrationAge}</Text>},
    {key: "id", header: "Дії", width: pixel(120), renderCell: (user) => <div className={styles.tableActions}><UserActionSet user={user} model={model} /></div>},
  ], [model]);
  const rows: UserTableRow[] = users.map((user) => ({...user}));

  return <div ref={focusBridgeRef} onFocusCapture={onFocusCapture}>{isDesktopViewport ? (
      <Card padding={0} className={styles.desktopList}>
        <div className={styles.tableScroller}>
          <Table aria-label="Список користувачів" data={rows} columns={columns} idKey="id" density="compact" dividers="rows" hasHover />
        </div>
      </Card>
  ) : (
      <section className={styles.mobileList} aria-label="Список користувачів">
        {users.map((user) => <article key={user.id} className={styles.mobileListRow} data-record-id={user.id}>
          <div className={styles.userIdentity}><span className={styles.avatar}>{publicName(user.displayName).slice(-2)}</span><div><Text weight="semibold" display="block">{publicName(user.displayName)}</Text><Text type="supporting" color="secondary">{user.email}</Text></div></div>
          <div className={styles.userMeta}><Building2 size={14} /><Text>{user.company}</Text><Text type="supporting" color="secondary">{user.registrationAge}</Text></div>
          <UserBadges user={user} />
          <div className={styles.userActions}><UserActionSet user={user} model={model} /></div>
        </article>)}
      </section>
  )}</div>;
}

function EditUserDialog({model}: {model: AdminUsersModel}) {
  const user = model.selectedUser;
  const [roleOpen, setRoleOpen] = useState(false);
  if (!user) return null;
  const dealerRole = user.dealerCompanyRole === "member" ? "Учасник" : "Головний дилер";
  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) model.setSelectedUser(null); }} purpose="form" width="min(760px, calc(100vw - 24px))" maxHeight="calc(100vh - 24px)" aria-label="Редагувати користувача">
      <Layout
        defaultHasDividers
        header={<DialogHeader title="Редагувати користувача" subtitle={`Оновити роль та компанію для ${publicName(user.displayName)}`} onOpenChange={() => model.setSelectedUser(null)} />}
        content={(
          <LayoutContent padding={4}>
            <div className={styles.dialogFields}>
              <Selector label="Роль" value={adminUserRoleLabels[user.role]} options={adminUserRoleOptions.map((option) => ({value: option.label, label: option.label}))} onChange={() => undefined} isDisabled disabledMessage="Зміна ролі потребує адміністративного доступу." width="100%" />
              <Selector label="Компанія" value={user.company} options={adminUserCompanyOptions.map((option) => ({value: option.label, label: option.label}))} onChange={() => undefined} isDisabled disabledMessage="Зміна компанії потребує адміністративного доступу." width="100%" />
              {user.role === "dealer" ? <Selector label="Роль у дилерській компанії" value={dealerRole} options={dealerCompanyRoleOptions.map((option) => ({value: option.label, label: option.label}))} onChange={() => undefined} isDisabled disabledMessage="Зміна ролі потребує підключення сервісу облікових записів." width="100%" /> : null}
            </div>
            {user.role === "manager" ? (
              <section className={styles.permissions} aria-label="Налаштування доступу">
                <div><Heading level={3}>Налаштування доступу</Heading><Button label="Скинути до ролі за замовчуванням" variant="ghost" size="sm" isDisabled tooltip="Скидання дозволів потребує підключення сервісу контролю доступу." /></div>
                <div className={styles.permissionsScroll} role="region" aria-label="Матриця дозволів" tabIndex={0}>
                  <table><thead><tr><th>Сутність</th><th>Чит.</th><th>Створ.</th><th>Оновл.</th><th>Видал.</th></tr></thead><tbody>{managerPermissionRows.map((row) => <tr key={row.id}><th scope="row">{row.entity}</th><td>{permissionLabel(row.read)}</td><td>{permissionLabel(row.create)}</td><td>{permissionLabel(row.update)}</td><td>{permissionLabel(row.delete)}</td></tr>)}</tbody></table>
                </div>
              </section>
            ) : null}
            <Button label="Параметри перегляду" variant="ghost" size="sm" aria-expanded={roleOpen} onClick={() => setRoleOpen((open) => !open)} />
          </LayoutContent>
        )}
        footer={<LayoutFooter hasDivider padding={3}><div className={styles.dialogActions}><Button label="Скасувати" variant="secondary" onClick={() => model.setSelectedUser(null)} /><Button label="Зберегти зміни" icon={<LockKeyhole size={14} />} variant="primary" isDisabled tooltip="Збереження змін потребує підключення сервісу облікових записів." /></div></LayoutFooter>}
      />
    </Dialog>
  );
}

export default function AstryxAdminUsersView({model, onReady}: Props) {
  const [viewMode, setViewMode] = useAdminViewPreference("users");
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
    <main className={styles.page} data-admin-users-renderer="astryx" data-admin-users-view={viewMode}>
      <header className={styles.header}><div className={styles.headerCopy}><span className={styles.headerIcon}><UsersRound size={20} /></span><div><Heading level={1}>Модерація користувачів</Heading><Text color="secondary">Керування обліковими записами, затвердження та дозволи.</Text></div></div></header>
      <section className={styles.kpis} aria-label="Показники користувачів"><Card padding={3}><Clock3 size={16} /><Text type="supporting" color="secondary">Очікують затвердження</Text><Heading level={2}>0</Heading></Card><Card padding={3}><CheckCircle2 size={16} /><Text type="supporting" color="secondary">Активні користувачі</Text><Heading level={2}>102</Heading></Card><Card padding={3}><UsersRound size={16} /><Text type="supporting" color="secondary">Всього користувачів</Text><Heading level={2}>102</Heading></Card></section>
      <Card padding={3} className={styles.toolbar}><TextInput label="Пошук користувачів" isLabelHidden startIcon={<UsersRound size={15} />} value={model.query} onChange={model.setQuery} placeholder="Пошук за ім’ям, email, логіном або компанією..." hasClear width="100%" /><TabList aria-label="Стани користувачів" value={model.tab} onChange={(value) => model.setTab(value as typeof model.tab)} size="sm" layout="fill">{adminUserTabs.map((tab) => <Tab key={tab.id} value={tab.id} label={tab.label} icon={tab.id === "pending" ? <Clock3 size={13} /> : tab.id === "active" ? <CheckCircle2 size={13} /> : <CircleX size={13} />} />)}</TabList><div className={styles.viewControl}><SegmentedControl label="Вигляд користувачів" value={viewMode} onChange={(value) => setViewMode(value as typeof viewMode)} size="sm"><SegmentedControlItem value="cards" label="Картки" /><SegmentedControlItem value="list" label="Список" /></SegmentedControl></div></Card>
      {model.visibleUsers.length ? (viewMode === "cards" ? <UserCards users={model.visibleUsers} model={model} /> : <UserList users={model.visibleUsers} model={model} />) : <Card padding={6}><EmptyState title="Користувачів не знайдено" description={model.tab === "active" ? "Змініть пошуковий запит." : "У цій категорії немає користувачів."} /></Card>}
      <Text type="supporting" color="secondary">Показано {model.resultCount} користувачів</Text>
      <EditUserDialog model={model} />
    </main>
    </AstryxBrpUiProvider>
  );
}
