"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CircleCheck,
  Download,
  Eye,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Ship,
  Trash2,
  Users,
} from "lucide-react";
import { Panel, StatusBadge } from "@/components/shared/ui";
import { RendererViewSwitch } from "@/components/appearance/renderer-view-switch";
import {
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminTableShell,
  AdminToolbar,
} from "./admin-ui";
import {
  AdminPermissionMatrix,
  type PermissionMatrixAction,
  type PermissionMatrixRow,
} from "./admin-permission-matrix";
import {
  dealerCompanyOptions,
  dealerPermissionGroups,
  dealerTeamSummaries,
  type DealerCompanyOption,
  type DealerPermissionEntry,
  type DealerTeamSummary,
} from "@/lib/admin-dealer-access-data";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

export type TeamAccessFilter = "all" | "with-access" | "without-access";
export type PolicyStateFilter = "all" | "on" | "off";

function DealerAccessFilterControls({
  teamAccess,
  policyState,
  onTeamAccessChange,
  onPolicyStateChange,
}: {
  teamAccess: TeamAccessFilter;
  policyState: PolicyStateFilter;
  onTeamAccessChange: (value: TeamAccessFilter) => void;
  onPolicyStateChange: (value: PolicyStateFilter) => void;
}) {
  return (
    <div className="grid w-full min-w-0 gap-2 md:grid-cols-2">
      <label className="grid gap-1">
        <span className="text-[10px] font-[680] uppercase tracking-[.035em] text-[var(--muted-foreground)]">Стан доступу команди</span>
        <select
          className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] text-[var(--foreground)] outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)]"
          aria-label="Стан доступу команди"
          value={teamAccess}
          onChange={(event) => onTeamAccessChange(event.target.value as TeamAccessFilter)}
        >
          <option value="all">Уся команда</option>
          <option value="with-access">Профіль Full Access</option>
          <option value="without-access">Без доступу</option>
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-[10px] font-[680] uppercase tracking-[.035em] text-[var(--muted-foreground)]">Стан політики компанії</span>
        <select
          className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] text-[var(--foreground)] outline-none focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)]"
          aria-label="Стан політики компанії"
          value={policyState}
          onChange={(event) => onPolicyStateChange(event.target.value as PolicyStateFilter)}
        >
          <option value="all">Усі об&apos;єкти політики</option>
          <option value="on">Є увімкнені права</option>
          <option value="off">Є вимкнені права</option>
        </select>
      </label>
    </div>
  );
}

function CompanySelector({
  selectedCompany,
  onSelect,
}: {
  selectedCompany: DealerCompanyOption;
  onSelect: (company: DealerCompanyOption) => void;
}) {
  return (
    <label className="min-w-0 sm:justify-self-end">
      <span className="sr-only">Дилерська компанія</span>
      <select
        className="h-9 w-full rounded-md border border-[var(--border)] bg-[#eaeef2] px-3 text-[13px] text-[var(--foreground)] outline-none transition-colors hover:border-[var(--faint)] focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] sm:w-[320px] dark:bg-[#010409] dark:text-[12px]"
        value={selectedCompany.slug}
        onChange={(event) => {
          const nextCompany = dealerCompanyOptions.find((company) => company.slug === event.target.value);
          if (nextCompany) onSelect(nextCompany);
        }}
      >
        {dealerCompanyOptions.map((company) => (
          <option key={company.id} value={company.slug}>{company.label}</option>
        ))}
      </select>
    </label>
  );
}

function TeamAccessBadge({ member }: { member: DealerTeamSummary }) {
  return (
    <StatusBadge tone={member.accessStatus === "Потрібно призначити доступ" ? "amber" : "green"}>
      {member.accessStatus}
    </StatusBadge>
  );
}

function DealerTeamPanel({ members }: { members: readonly DealerTeamSummary[] }) {
  return (
    <AdminTableShell
      title={<span className="inline-flex items-center gap-2"><Users size={15} /> Команда дилера</span>}
      description="Імена, акаунти та призначені профілі, які бачить дилер."
      scrollLabel="Команда дилера"
    >
      {members.length ? (
        <>
          <div className="hidden sm:block">
            <table className="data-table min-w-[680px]">
              <thead>
                <tr>
                  <th className="w-[26%]">Назва</th>
                  <th className="w-[26%]">Email</th>
                  <th className="w-[14%]">Роль</th>
                  <th className="w-[13%]">Профіль</th>
                  <th>Статус доступу</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="font-medium">{member.displayName}</td>
                    <td className="text-[var(--muted-foreground)]">{member.accountLabel}</td>
                    <td>{member.role}</td>
                    <td>{member.profile}</td>
                    <td><TeamAccessBadge member={member} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-0 sm:hidden" aria-label="Команда дилера">
            {members.map((member) => (
              <article key={member.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-3 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-[12px]">{member.displayName}</strong>
                    <span className="mt-1 block truncate text-[10px] text-[var(--muted-foreground)]">{member.accountLabel}</span>
                  </div>
                  <StatusBadge tone={member.role === "Головний дилер" ? "green" : "neutral"}>{member.role}</StatusBadge>
                </div>
                <p className="mb-0 mt-2 text-[10px] text-[var(--muted-foreground)]">Профіль: <span className="text-[var(--foreground)]">{member.profile}</span></p>
                <p className={`mb-0 mt-1 text-[10px] ${member.accessStatus === "Потрібно призначити доступ" ? "text-[var(--amber)]" : "text-[var(--muted-foreground)]"}`}>
                  {member.accessStatus}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="grid min-h-28 place-items-center px-4 py-8 text-center text-[11px] text-[var(--muted-foreground)]">
          Немає користувачів дилера
        </div>
      )}
    </AdminTableShell>
  );
}

type DealerPermissionActionId = "read" | "create" | "update" | "delete" | "request" | "approve" | "export" | "ship";

const dealerPermissionActionIds: Readonly<Record<string, DealerPermissionActionId>> = {
  Читання: "read",
  Створення: "create",
  Оновлення: "update",
  Видалення: "delete",
  Запит: "request",
  Схвалення: "approve",
  Експорт: "export",
  Відвантаження: "ship",
};

export const dealerPermissionActions = [
  { id: "read", label: "Читання", icon: <Eye size={14} />, tone: "blue" },
  { id: "create", label: "Створення", icon: <Plus size={14} />, tone: "green" },
  { id: "update", label: "Оновлення", icon: <Pencil size={14} />, tone: "amber" },
  { id: "delete", label: "Видалення", icon: <Trash2 size={14} />, tone: "red" },
  { id: "request", label: "Запит", icon: <Send size={14} />, tone: "blue" },
  { id: "approve", label: "Схвалення", icon: <CircleCheck size={14} />, tone: "green" },
  { id: "export", label: "Експорт", icon: <Download size={14} />, tone: "blue" },
  { id: "ship", label: "Відвантаження", icon: <Ship size={14} />, tone: "blue" },
] as const satisfies readonly PermissionMatrixAction<DealerPermissionActionId>[];

export function policyRows(groups: ReadonlyArray<{
  readonly id: string;
  readonly command: string;
  readonly sectionLabel?: "ДОКУМЕНТИ";
  readonly permissions: readonly DealerPermissionEntry[];
}>): readonly PermissionMatrixRow<DealerPermissionActionId>[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.command,
    sectionBefore: group.sectionLabel,
    permissions: Object.fromEntries(group.permissions.map((permission) => [
      dealerPermissionActionIds[permission.action],
      permission.enabled ? "on" : "off",
    ])) as Readonly<Partial<Record<DealerPermissionActionId, "on" | "off">>>,
  }));
}

function PolicyPanel({ groups }: {
  groups: ReadonlyArray<{
    readonly id: string;
    readonly command: string;
    readonly sectionLabel?: "ДОКУМЕНТИ";
    readonly permissions: readonly DealerPermissionEntry[];
  }>;
}) {
  return (
    <AdminPermissionMatrix
      actions={dealerPermissionActions}
      rows={policyRows(groups)}
      ariaLabel="Політика компанії"
      title="Політика компанії"
      emptyCopy="Немає доступних дилерських прав"
    />
  );
}

export interface AdminDealerAccessViewProps {
  selectedCompany: DealerCompanyOption;
  onCompanySelect(company: DealerCompanyOption): void;
  query: string;
  setQuery(value: string): void;
  teamAccess: TeamAccessFilter;
  setTeamAccess(value: TeamAccessFilter): void;
  policyState: PolicyStateFilter;
  setPolicyState(value: PolicyStateFilter): void;
  visibleMembers: readonly DealerTeamSummary[];
  visiblePermissionGroups: ReadonlyArray<{
    readonly id: string;
    readonly command: string;
    readonly sectionLabel?: "ДОКУМЕНТИ";
    readonly permissions: readonly DealerPermissionEntry[];
  }>;
  activeFilterCount: number;
}

const loadAstryxAdminDealerAccessView = () => import("./astryx-admin-dealer-access-view");

function CurrentAdminDealerAccessView(props: AdminDealerAccessViewProps) {
  return (
    <div data-admin-dealer-access-renderer="shadcn">
      <AdminPage>
        <AdminPageHeader
          icon={<ShieldCheck size={20} />}
          title="Доступи дилерської компанії"
          description="Задайте максимальний набір функцій для дилерської компанії."
          actions={<CompanySelector selectedCompany={props.selectedCompany} onSelect={props.onCompanySelect} />}
        />

        <AdminToolbar
          search={(
            <AdminSearchField
              value={props.query}
              onValueChange={props.setQuery}
              label="Пошук за командою, профілем або правом"
              placeholder="Пошук за командою, профілем, правом..."
              clearLabel="Очистити пошук доступів"
            />
          )}
          filters={(
            <DealerAccessFilterControls
              teamAccess={props.teamAccess}
              policyState={props.policyState}
              onTeamAccessChange={props.setTeamAccess}
              onPolicyStateChange={props.setPolicyState}
            />
          )}
          mobileDisclosure={{ sections: ["filters"], label: "Фільтри доступу", activeCount: props.activeFilterCount }}
        />

        <DealerTeamPanel members={props.visibleMembers} />
        <PolicyPanel groups={props.visiblePermissionGroups} />
      </AdminPage>
    </div>
  );
}

function DealerAccessContent({
  selectedCompany,
  onCompanySelect,
}: {
  selectedCompany: DealerCompanyOption;
  onCompanySelect: (company: DealerCompanyOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [teamAccess, setTeamAccess] = useState<TeamAccessFilter>("all");
  const [policyState, setPolicyState] = useState<PolicyStateFilter>("all");

  const visibleMembers = useMemo(() => {
    const needle = normalize(query);
    return dealerTeamSummaries.filter((member) => {
      const matchesQuery = !needle || normalize([
      member.displayName,
      member.accountLabel,
      member.role,
      member.profile,
      member.accessStatus,
      ].join(" ")).includes(needle);
      const matchesAccess = teamAccess === "all"
        || (teamAccess === "with-access" && member.profile === "Full Access")
        || (teamAccess === "without-access" && member.profile === "Без доступу");
      return matchesQuery && matchesAccess;
    });
  }, [query, teamAccess]);

  const visiblePermissionGroups = useMemo(() => {
    const needle = normalize(query);
    const matchingGroups = !needle ? dealerPermissionGroups : dealerPermissionGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => normalize(`${group.command} ${permission.action}`).includes(needle)),
      }))
      .filter((group) => group.permissions.length > 0);
    if (policyState === "all") return matchingGroups;
    return matchingGroups.filter((group) => group.permissions.some((permission) => (
      policyState === "on" ? permission.enabled : !permission.enabled
    )));
  }, [policyState, query]);

  const activeFilterCount = Number(teamAccess !== "all") + Number(policyState !== "all");

  const viewProps: AdminDealerAccessViewProps = {
    selectedCompany,
    onCompanySelect,
    query,
    setQuery,
    teamAccess,
    setTeamAccess,
    policyState,
    setPolicyState,
    visibleMembers,
    visiblePermissionGroups,
    activeFilterCount,
  };

  return (
    <RendererViewSwitch
      slotId="admin-dealer-access"
      currentView={<CurrentAdminDealerAccessView {...viewProps} />}
      loadAstryxView={loadAstryxAdminDealerAccessView}
      astryxViewProps={viewProps}
    />
  );
}

function DealerAccessRouteState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("company");
  const selectedCompany = dealerCompanyOptions.find((company) => company.slug === selectedSlug) ?? dealerCompanyOptions[0];

  return (
    <DealerAccessContent
      selectedCompany={selectedCompany}
      onCompanySelect={(company) => {
        router.replace(`/admin/dealer-access?company=${encodeURIComponent(company.slug)}`, { scroll: false });
      }}
    />
  );
}

function DealerAccessFallback() {
  return (
    <AdminPage className="min-h-40">
      <div aria-busy="true">
        <Panel className="grid min-h-40 place-items-center p-6 text-[11px] text-[var(--muted-foreground)] shadow-none">
          Завантаження політики доступу…
        </Panel>
      </div>
    </AdminPage>
  );
}

export function AdminDealerAccessPage() {
  return (
    <Suspense fallback={<DealerAccessFallback />}>
      <DealerAccessRouteState />
    </Suspense>
  );
}
