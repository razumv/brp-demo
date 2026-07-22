"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock3,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Modal, Panel } from "@/components/shared/ui";
import { RendererViewSwitch } from "@/components/appearance/renderer-view-switch";
import {
  AdminIconAction,
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminTableShell,
  AdminTabs,
  AdminToolbar,
} from "./admin-ui";
import {
  activeAdminUsers,
  adminUserCompanyOptions,
  adminUserKpis,
  adminUserRoleLabels,
  adminUserRoleOptions,
  adminUserTabs,
  adminUserTotals,
  dealerCompanyRoleOptions,
  managerPermissionRows,
  type AdminUserRecord,
  type AdminUserRole,
  type AdminUserTab,
  type PermissionState,
  type ReadOnlySelectOption,
} from "@/lib/admin-users-data";

type PreviewMenu = "role" | "company" | "dealer-role" | null;

export interface AdminUsersModel {
  tab: AdminUserTab;
  setTab(value: AdminUserTab): void;
  query: string;
  setQuery(value: string): void;
  selectedUser: AdminUserRecord | null;
  setSelectedUser(user: AdminUserRecord | null): void;
  visibleUsers: readonly AdminUserRecord[];
  resultCount: number;
}

const loadAstryxAdminUsersView = () => import("./astryx-admin-users-view");

const userGrid = "grid min-w-[1080px] grid-cols-[minmax(230px,2fr)_minmax(220px,1.8fr)_minmax(155px,1.3fr)_100px_100px_110px_125px]";

const roleToneClasses: Record<AdminUserRole, string> = {
  dealer: "border-[#b7dfbf] bg-[var(--green-soft)] text-[var(--green)]",
  manager: "border-[#e3d694] bg-[var(--amber-soft)] text-[var(--amber)]",
  admin: "border-[#efb7bc] bg-[var(--red-soft)] text-[var(--red)]",
};

const permissionKeys = ["read", "create", "update", "delete", "request", "approve", "ship"] as const;

const permissionLabels: Record<(typeof permissionKeys)[number], string> = {
  read: "Читання",
  create: "Створення",
  update: "Оновлення",
  delete: "Видалення",
  request: "Запит",
  approve: "Схвалення",
  ship: "Відвантаження",
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function publicUserName(user: AdminUserRecord) {
  return user.displayName.replace(/^Демо-користувач/, "Користувач");
}

function publicAccountLabel(user: AdminUserRecord) {
  return user.accountLabel.replace(/^demo-account/, "account");
}

function userKpiItems() {
  const icons = {
    pending: Clock3,
    active: CircleCheck,
    total: UsersRound,
  } as const;

  return adminUserKpis.map((kpi) => {
    const Icon = icons[kpi.id];
    return {
      id: kpi.id,
      label: kpi.label,
      value: kpi.value,
      tone: kpi.tone,
      icon: <Icon size={17} />,
    };
  });
}

function userTabItems() {
  const icons = {
    pending: Clock3,
    active: CircleCheck,
    deactivated: CircleX,
  } as const;

  return adminUserTabs.map((tab) => {
    const Icon = icons[tab.id];
    return { id: tab.id, label: tab.label, icon: <Icon size={14} />, panelId: `admin-users-${tab.id}-panel` };
  });
}

function RoleBadge({ role }: { role: AdminUserRole }) {
  return (
    <span className={`inline-flex min-h-[21px] items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold whitespace-nowrap ${roleToneClasses[role]}`}>
      {role === "admin" ? <ShieldCheck size={12} /> : <UserRound size={12} />}
      {adminUserRoleLabels[role]}
    </span>
  );
}

function UserIdentity({ user, titleId }: { user: AdminUserRecord; titleId?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] text-[10px] font-semibold text-[var(--muted-foreground)]" aria-hidden="true">
        {publicUserName(user).slice(-2)}
      </span>
      <span className="min-w-0">
        <strong id={titleId} className="block truncate text-[12px] font-semibold">{publicUserName(user)}</strong>
        <span className="mt-0.5 block truncate text-[9px] text-[var(--muted-foreground)]">{publicAccountLabel(user)}</span>
      </span>
    </div>
  );
}

function Contact({ user }: { user: AdminUserRecord }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-[11px]">{user.email}</span>
      <span className="mt-0.5 block truncate text-[9px] text-[var(--muted-foreground)]">@{publicAccountLabel(user)}</span>
    </span>
  );
}

function UserRowActions({ user, onEdit, compact = false }: { user: AdminUserRecord; onEdit: () => void; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap items-center gap-1 [&>button]:!size-11 md:[&>button]:!size-8" : "flex items-center justify-end gap-1"}>
      <AdminIconAction
        label={`Деактивувати ${user.displayName} — заблоковано`}
        tooltip="Деактивація користувача потребує підключення сервісу облікових записів."
        icon={<CircleX size={15} />}
        tone="danger"
        disabled
      />
      <AdminIconAction
        label={`Редагувати ${publicUserName(user)}`}
        tooltip="Редагувати користувача"
        icon={<Pencil size={15} />}
        tone="primary"
        onClick={onEdit}
      />
      <AdminIconAction
        label={`Видалити ${user.displayName} — заблоковано`}
        tooltip="Видалення користувача потребує підключення сервісу облікових записів."
        icon={<Trash2 size={15} />}
        tone="danger"
        disabled
      />
    </div>
  );
}

function ActiveUsersGrid({ users, resultCount, onEdit }: {
  users: readonly AdminUserRecord[];
  resultCount: number;
  onEdit: (user: AdminUserRecord) => void;
}) {
  return (
    <div role="grid" aria-label="Активні користувачі" className="min-w-0 max-md:hidden">
      <AdminTableShell
        scrollLabel="Активні користувачі"
        footer={<span className="text-[11px] text-[var(--muted-foreground)]">Показано {resultCount} користувачів</span>}
      >
        <div className={userGrid} role="row">
          {["КОРИСТУВАЧ", "КОНТАКТ", "КОМПАНІЯ", "РОЛЬ", "СТАТУС", "РЕЄСТРАЦІЯ", "ДІЇ"].map((column) => (
            <span key={column} role="columnheader" className="flex min-h-10 items-center bg-[var(--surface-subtle)] px-4 text-[9px] font-bold tracking-[0.03em] text-[var(--muted-foreground)]">
              {column}
            </span>
          ))}
        </div>
        <div className="max-h-[600px] min-w-[1080px] overflow-y-auto border-t border-[var(--border)]" role="rowgroup">
          {users.map((user) => (
            <div key={user.id} data-record-id={user.id} className={`${userGrid} min-h-[80px] items-center border-b border-[var(--border)] last:border-b-0`} role="row">
              <div className="min-w-0 px-4 py-3" role="cell"><UserIdentity user={user} /></div>
              <div className="min-w-0 px-4 py-3" role="cell"><Contact user={user} /></div>
              <div className="flex min-w-0 items-center gap-1.5 px-4 py-3 text-[11px]" role="cell">
                <Building2 size={13} className="shrink-0 text-[var(--muted-foreground)]" />
                <span className="truncate font-medium">{user.company}</span>
              </div>
              <div className="px-4 py-3" role="cell"><RoleBadge role={user.role} /></div>
              <div className="px-4 py-3" role="cell"><UserStatus /></div>
              <div className="px-4 py-3 text-[11px] leading-[1.2] text-[var(--muted-foreground)]" role="cell">{user.registrationAge}</div>
              <div className="px-4 py-2" role="cell"><UserRowActions user={user} onEdit={() => onEdit(user)} /></div>
            </div>
          ))}
        </div>
      </AdminTableShell>
    </div>
  );
}

function UserStatus() {
  return (
    <span className="inline-flex min-h-[21px] items-center gap-1.5 rounded-full border border-[#b7dfbf] bg-[var(--green-soft)] px-2 text-[10px] font-semibold text-[var(--green)] whitespace-nowrap">
      <CheckCircle2 size={12} /> Активний
    </span>
  );
}

function ActiveUsersCards({ users, resultCount, onEdit }: {
  users: readonly AdminUserRecord[];
  resultCount: number;
  onEdit: (user: AdminUserRecord) => void;
}) {
  return (
    <div className="grid gap-3 md:hidden">
      <ul aria-label="Активні користувачі" className="grid gap-3 p-0 md:hidden">
        {users.map((user) => (
          <li key={user.id} data-record-id={user.id} aria-labelledby={`admin-user-${user.id}-title`} className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]">
            <UserIdentity user={user} titleId={`admin-user-${user.id}-title`} />
            <Contact user={user} />
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
              <div><dt className="text-[var(--muted-foreground)]">Компанія</dt><dd className="mt-0.5 font-medium"><Building2 size={12} className="mr-1 inline text-[var(--muted-foreground)]" />{user.company}</dd></div>
              <div><dt className="text-[var(--muted-foreground)]">Роль</dt><dd className="mt-0.5"><RoleBadge role={user.role} /></dd></div>
              <div><dt className="text-[var(--muted-foreground)]">Статус</dt><dd className="mt-0.5"><UserStatus /></dd></div>
              <div><dt className="text-[var(--muted-foreground)]">Реєстрація</dt><dd className="mt-0.5 font-medium text-[var(--muted-foreground)]">{user.registrationAge}</dd></div>
            </dl>
            <UserRowActions user={user} onEdit={() => onEdit(user)} compact />
          </li>
        ))}
      </ul>
      <p className="m-0 text-[11px] text-[var(--muted-foreground)]">Показано {resultCount} користувачів</p>
    </div>
  );
}

function EmptyUsersState({ category }: { category: boolean }) {
  return (
    <Panel className="grid min-h-[218px] place-items-center px-6 py-10 text-center shadow-none">
      <div>
        <UsersRound size={44} className="mx-auto text-[var(--faint)]" />
        <h2 className="mt-4 text-[17px] font-semibold">Користувачів не знайдено</h2>
        {category ? <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">Немає користувачів у цій категорії</p> : null}
      </div>
    </Panel>
  );
}

function ReadOnlyCombobox({
  id,
  label,
  value,
  options,
  open,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly ReadOnlySelectOption[];
  open: boolean;
  onToggle: () => void;
}) {
  const listboxId = `${id}-options`;

  return (
    <div className="relative grid min-w-0 gap-1.5">
      <span className="text-[12px] font-medium">{label}</span>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[#eaeef2] px-3 text-left text-[12px] text-[var(--foreground)] outline-none hover:border-[var(--faint)] focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] dark:bg-[#010409]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        title="Вибір доступний лише для перегляду"
        onClick={onToggle}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={14} className={`shrink-0 text-[var(--muted-foreground)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+5px)] z-30 max-h-52 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-menu)]"
        >
          {options.map((option) => {
            const selected = option.label === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                aria-disabled="true"
                disabled
                className={`flex min-h-8 w-full cursor-not-allowed items-center rounded px-2.5 py-1.5 text-left text-[11px] opacity-100 ${selected ? "bg-[var(--orange-soft)] text-[var(--orange)]" : "text-[var(--foreground)]"}`}
                title="Зміна значення заблокована"
              >
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PermissionSwitch({ state, label }: { state: Exclude<PermissionState, "na">; label: string }) {
  const enabled = state === "on";
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-pressed={enabled}
      aria-label={`${label}: ${enabled ? "увімкнено" : "вимкнено"}; зміна заблокована`}
      title="Зміна дозволу потребує підключення сервісу контролю доступу."
      className={`relative mx-auto block h-5 w-9 cursor-not-allowed rounded-full border opacity-100 ${enabled ? "border-[#1a7f37] bg-[#1a7f37] dark:border-[#3fb950] dark:bg-[#238636]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}
    >
      <span className={`absolute top-[2px] size-3 rounded-full bg-white shadow-sm dark:bg-[#f0f6fc] ${enabled ? "right-[2px]" : "left-[2px]"}`} aria-hidden="true" />
    </button>
  );
}

function PermissionCell({ state, label }: { state: PermissionState; label: string }) {
  if (state === "na") {
    return <span className="text-[11px] text-[var(--faint)]">—</span>;
  }
  return <PermissionSwitch state={state} label={label} />;
}

function PermissionLegendItem({ children, tone }: { children: ReactNode; tone: "default" | "on" | "off" }) {
  const marker = tone === "on"
    ? "border-[#1a7f37] bg-[#1a7f37]"
    : tone === "off"
      ? "border-[var(--red)] bg-[var(--red-soft)]"
      : "border-[var(--border)] bg-[var(--surface-subtle)]";
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] text-[var(--muted-foreground)]">
      <span className={`size-2.5 rounded-full border ${marker}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function ManagerPermissionMatrix() {
  return (
    <section className="mt-5 overflow-hidden rounded-md border border-[var(--border)]">
      <header className="flex flex-col gap-2 border-b border-[var(--border)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[13px] font-semibold">Налаштування доступу</h3>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="cursor-not-allowed text-left text-[10px] text-[var(--muted-foreground)] opacity-70 sm:text-right"
          title="Скидання дозволів потребує підключення сервісу контролю доступу."
        >
          Скинути до ролі за замовчуванням
        </button>
      </header>
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-[10px]">
          <thead className="sticky top-0 z-10 bg-[var(--surface-subtle)]">
            <tr>
              <th className="w-[155px] border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-[var(--muted-foreground)]">Сутність</th>
              {permissionKeys.map((key) => (
                <th key={key} className="min-w-[78px] border-b border-[var(--border)] px-2 py-2 text-center font-medium text-[var(--muted-foreground)]">
                  {permissionLabels[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managerPermissionRows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-b-0">
                <th scope="row" className="px-3 py-2 text-left text-[10px] font-medium">{row.entity}</th>
                {permissionKeys.map((key) => (
                  <td key={key} className="px-2 py-2 text-center">
                    <PermissionCell state={row[key]} label={`${row.entity}: ${permissionLabels[key]}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5">
        <PermissionLegendItem tone="default">За замовчуванням</PermissionLegendItem>
        <PermissionLegendItem tone="on">Override ON</PermissionLegendItem>
        <PermissionLegendItem tone="off">Override OFF</PermissionLegendItem>
      </footer>
    </section>
  );
}

function EditUserPreview({ user, onClose }: { user: AdminUserRecord | null; onClose: () => void }) {
  const [openMenu, setOpenMenu] = useState<PreviewMenu>(null);

  if (!user) return null;

  const dealerRole = user.dealerCompanyRole === "member" ? "Учасник" : "Головний дилер";

  return (
    <Modal
      open
      onClose={onClose}
      title="Редагувати користувача"
      description={`Оновити роль та компанію для ${publicUserName(user)}`}
      className="!w-[min(760px,100%)]"
      footer={(
        <>
          <button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="button button-primary"
            title="Збереження змін потребує підключення сервісу облікових записів."
          >
            Зберегти зміни
          </button>
        </>
      )}
    >
      <div
        className="grid gap-4"
        onKeyDown={(event) => {
          if (event.key === "Escape" && openMenu) {
            event.stopPropagation();
            setOpenMenu(null);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyCombobox
            id="admin-user-role"
            label="Роль"
            value={adminUserRoleLabels[user.role]}
            options={adminUserRoleOptions}
            open={openMenu === "role"}
            onToggle={() => setOpenMenu((current) => current === "role" ? null : "role")}
          />
          <ReadOnlyCombobox
            id="admin-user-company"
            label="Компанія"
            value={user.company}
            options={adminUserCompanyOptions}
            open={openMenu === "company"}
            onToggle={() => setOpenMenu((current) => current === "company" ? null : "company")}
          />
        </div>

        <p className="m-0 text-[9px] text-[var(--muted-foreground)]">Тільки адміністратори можуть змінювати ролі</p>

        {user.role === "dealer" ? (
          <>
            <ReadOnlyCombobox
              id="admin-user-dealer-role"
              label="Роль у дилерській компанії"
              value={dealerRole}
              options={dealerCompanyRoleOptions}
              open={openMenu === "dealer-role"}
              onToggle={() => setOpenMenu((current) => current === "dealer-role" ? null : "dealer-role")}
            />
            <p className="m-0 text-[10px] leading-relaxed text-[var(--muted-foreground)]">
              Only the main dealer can manage Team &amp; Access for their company.
            </p>
          </>
        ) : null}

        {user.role === "manager" ? <ManagerPermissionMatrix /> : null}
      </div>
    </Modal>
  );
}

export function AdminUsersPage() {
  const [tab, setTab] = useState<AdminUserTab>("active");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const deferredQuery = useDeferredValue(query);

  const visibleUsers = useMemo(() => {
    if (tab !== "active") return [];
    const needle = normalize(deferredQuery);
    if (!needle) return activeAdminUsers;
    return activeAdminUsers.filter((user) => normalize([
      user.displayName,
      user.email,
      user.accountLabel,
      user.company,
      adminUserRoleLabels[user.role],
    ].join(" ")).includes(needle));
  }, [deferredQuery, tab]);

  const resultCount = normalize(deferredQuery) ? visibleUsers.length : adminUserTotals.active;

  const setUserTab = (nextTab: AdminUserTab) => {
    setSelectedUser(null);
    setTab(nextTab);
  };

  const model: AdminUsersModel = {
    tab,
    setTab: setUserTab,
    query,
    setQuery,
    selectedUser,
    setSelectedUser,
    visibleUsers,
    resultCount,
  };

  const currentView = (
    <div data-admin-users-renderer="shadcn">
    <AdminPage>
      <AdminPageHeader
        icon={<UsersRound size={20} />}
        title="Модерація користувачів"
        description="Керування обліковими записами, затвердження та дозволи"
      />

      <AdminKpiGrid items={userKpiItems()} columns={3} label="Показники користувачів" hideOnMobile />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук користувачів"
            placeholder="Пошук за ім'ям, email, логіном або компанією..."
          />
        )}
        filters={(
          <AdminTabs
            items={userTabItems()}
            value={tab}
            onValueChange={setUserTab}
            label="Стани користувачів"
            mobileSelectLabel="Стани користувачів"
            size="compact"
          />
        )}
      />

      <section id={`admin-users-${tab}-panel`} role="tabpanel" aria-labelledby={`admin-users-${tab}-panel-tab`} className="min-w-0">
        {tab === "active" && visibleUsers.length ? (
          <>
            <ActiveUsersGrid users={visibleUsers} resultCount={resultCount} onEdit={setSelectedUser} />
            <ActiveUsersCards users={visibleUsers} resultCount={resultCount} onEdit={setSelectedUser} />
          </>
        ) : (
          <EmptyUsersState category={tab !== "active"} />
        )}
      </section>

      <EditUserPreview key={selectedUser?.id ?? "closed"} user={selectedUser} onClose={() => setSelectedUser(null)} />
    </AdminPage>
    </div>
  );

  return (
    <RendererViewSwitch
      slotId="admin-users"
      currentView={currentView}
      loadAstryxView={loadAstryxAdminUsersView}
      astryxViewProps={{ model }}
    />
  );
}
