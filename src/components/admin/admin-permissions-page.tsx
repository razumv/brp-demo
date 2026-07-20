"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Database,
  Download,
  Eye,
  FileText,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Package,
  PackageSearch,
  Pencil,
  Plane,
  Plus,
  ReceiptText,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Ship,
  Trash2,
  TrendingUp,
  Undo2,
  Users,
  UsersRound,
  WalletCards,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminTabs,
  AdminToolbar,
} from "./admin-ui";
import {
  AdminPermissionMatrix,
  type PermissionMatrixAction,
  type PermissionMatrixRow,
} from "./admin-permission-matrix";
import {
  adminPermissionActionLabels,
  adminPermissionRoles,
  adminPermissionSummaries,
  type AdminPermissionAction,
  type AdminPermissionEntity,
  type AdminPermissionIcon,
  type AdminPermissionRole,
  type AdminPermissionRoleDefinition,
} from "@/lib/admin-permissions-data";

const actionIcons: Readonly<Record<AdminPermissionAction, LucideIcon>> = {
  read: Eye,
  create: Plus,
  update: Pencil,
  delete: Trash2,
  request: Send,
  approve: CircleCheck,
  export: Download,
  ship: Ship,
};

const actionTones: Readonly<Record<AdminPermissionAction, PermissionMatrixAction<AdminPermissionAction>["tone"]>> = {
  read: "blue",
  create: "green",
  update: "amber",
  delete: "red",
  request: "blue",
  approve: "green",
  export: "blue",
  ship: "blue",
};

const entityIcons: Readonly<Record<AdminPermissionIcon, LucideIcon>> = {
  package: Package,
  pipeline: ListChecks,
  consignment: Boxes,
  return: Undo2,
  plane: Plane,
  receipt: ScanLine,
  ship: Ship,
  company: Building2,
  users: Users,
  invoice: ReceiptText,
  settlements: WalletCards,
  catalog: Database,
  calendar: CalendarDays,
  tasks: ClipboardList,
  reports: TrendingUp,
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  warehouse: Wrench,
  unit: Box,
  network: Globe2,
  workshop: Wrench,
  search: Search,
  prices: PackageSearch,
  documents: FileText,
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

type PermissionStateFilter = "all" | "on" | "off";

function PermissionStateFilterControl({
  value,
  onValueChange,
}: {
  value: PermissionStateFilter;
  onValueChange: (value: PermissionStateFilter) => void;
}) {
  return (
    <label className="grid min-w-0 flex-1 gap-1 md:hidden">
      <span className="text-[10px] font-[680] uppercase tracking-[.035em] text-[var(--muted-foreground)]">Стан дозволів</span>
      <select
        className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] text-[var(--foreground)] outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)]"
        aria-label="Стан дозволів"
        value={value}
        onChange={(event) => onValueChange(event.target.value as PermissionStateFilter)}
      >
        <option value="all">Усі об&apos;єкти</option>
        <option value="on">Є увімкнені дії</option>
        <option value="off">Є вимкнені дії</option>
      </select>
    </label>
  );
}

function roleDefinition(role: AdminPermissionRole): AdminPermissionRoleDefinition {
  return adminPermissionRoles.find((item) => item.id === role) ?? adminPermissionRoles[0];
}

function matrixActions(role: AdminPermissionRoleDefinition): readonly PermissionMatrixAction<AdminPermissionAction>[] {
  return role.actions.map((action) => {
    const Icon = actionIcons[action];
    return {
      id: action,
      label: adminPermissionActionLabels[action],
      icon: <Icon size={14} />,
      tone: actionTones[action],
    };
  });
}

function matrixRows(entities: readonly AdminPermissionEntity[]): readonly PermissionMatrixRow<AdminPermissionAction>[] {
  return entities.map((entity) => {
    const Icon = entityIcons[entity.icon];
    return {
      id: entity.id,
      label: entity.label,
      icon: <Icon size={14} />,
      sectionBefore: entity.sectionBefore,
      permissions: entity.permissions,
    };
  });
}

function ReadOnlyQuickButton({ children, tone = "neutral" }: {
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Зміна дозволів заблокована у read-only демонстрації"
      className={`button button-outline ${tone === "danger" ? "button-danger" : ""}`}
    >
      {children}
    </button>
  );
}

export function AdminPermissionsPage() {
  const [activeRole, setActiveRole] = useState<AdminPermissionRole>("manager");
  const [query, setQuery] = useState("");
  const [permissionState, setPermissionState] = useState<PermissionStateFilter>("all");
  const role = roleDefinition(activeRole);
  const normalizedQuery = normalize(query);

  const filteredEntities = useMemo(() => {
    return role.entities.filter((entity) => {
      const searchableActions = role.actions
        .filter((action) => entity.permissions[action] !== undefined)
        .map((action) => adminPermissionActionLabels[action]);
      const matchesQuery = !normalizedQuery || [entity.label, ...searchableActions]
        .some((value) => normalize(value).includes(normalizedQuery));
      const permissionStates = Object.values(entity.permissions);
      const matchesState = permissionState === "all" || permissionStates.includes(permissionState);
      return matchesQuery && matchesState;
    });
  }, [normalizedQuery, permissionState, role]);

  const roleTabs = adminPermissionRoles.map((item) => ({
    id: item.id,
    label: item.label,
    count: `${adminPermissionSummaries[item.id].checked}/${adminPermissionSummaries[item.id].total}`,
    icon: item.id === "manager" ? <BriefcaseBusiness size={14} /> : <UsersRound size={14} />,
    panelId: `admin-permissions-${item.id}-panel`,
  }));

  return (
    <AdminPage>
      <AdminPageHeader
        icon={<ShieldCheck size={20} />}
        title="Контроль доступу"
        description="Налаштуйте, що може робити кожна роль. Адміністратор завжди має повний доступ."
        meta="Роль адміністратора завжди має повний доступ і не показана тут."
      />

      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук за правами, об'єктом або дією"
            placeholder="Пошук за правами, об'єктом, дією..."
            clearLabel="Очистити пошук дозволів"
          />
        )}
        filters={(
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
            <AdminTabs
              items={roleTabs}
              value={activeRole}
              onValueChange={setActiveRole}
              label="Ролі доступу"
              mobileSelectLabel="Роль доступу"
              size="compact"
            />
            <PermissionStateFilterControl value={permissionState} onValueChange={setPermissionState} />
          </div>
        )}
        actions={(
          <>
            <ReadOnlyQuickButton><Eye size={14} /> Дати читання</ReadOnlyQuickButton>
            <ReadOnlyQuickButton><Plus size={14} /> Дати все</ReadOnlyQuickButton>
            <ReadOnlyQuickButton tone="danger"><Trash2 size={14} /> Відкликати все</ReadOnlyQuickButton>
          </>
        )}
        mobileDisclosure={{ sections: ["filters", "actions"], label: "Фільтри дозволів" }}
      />

      <section
        id={`admin-permissions-${activeRole}-panel`}
        role="tabpanel"
        aria-labelledby={`admin-permissions-${activeRole}-panel-tab`}
        className="min-w-0"
      >
        <AdminPermissionMatrix
          actions={matrixActions(role)}
          rows={matrixRows(filteredEntities)}
          ariaLabel={`Дозволи ролі ${role.label}`}
        />
      </section>
    </AdminPage>
  );
}
