"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Building2,
  LockKeyhole,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Modal, Panel, StatusBadge } from "@/components/shared/ui";
import { RendererViewSwitch } from "@/components/appearance/renderer-view-switch";
import {
  AdminFormGrid,
  AdminIconAction,
  AdminKpiGrid,
  AdminModalSection,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminTableShell,
  AdminToolbar,
} from "./admin-ui";
import styles from "./admin-companies.module.css";
import {
  adminCompanies,
  companyKpis,
  emptyCompanyForm,
  type AdminCompany,
  type CompanyFormFixture,
  type CompanyProfileStatus,
} from "@/lib/admin-companies-data";

type CompanyDialog =
  | { readonly mode: "create" }
  | { readonly mode: "edit"; readonly companyId: string }
  | { readonly mode: "assign"; readonly companyId: string }
  | null;

const kpiIcons = {
  companies: Building2,
  employees: Users,
  staffed: UserPlus,
  completed: ShieldCheck,
} as const;

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function LockedButton({ children, title, className = "" }: {
  children: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={title}
      className={`button ${className}`}
    >
      <LockKeyhole size={13} />
      {children}
    </button>
  );
}

function CompanyKpis() {
  const items = companyKpis.map((metric) => {
    const Icon = kpiIcons[metric.id];
    return {
      id: metric.id,
      label: metric.label,
      value: metric.value,
      tone: metric.tone,
      icon: <Icon size={17} />,
    };
  });

  return (
    <AdminKpiGrid items={items} label="Показники компаній" />
  );
}

type CompanyProfileFilter = "all" | CompanyProfileStatus;
type CompanyManagerFilter = "all" | "assigned" | "unassigned";

export interface AdminCompaniesModel {
  query: string;
  setQuery(value: string): void;
  profileStatus: CompanyProfileFilter;
  setProfileStatus(value: CompanyProfileFilter): void;
  managerState: CompanyManagerFilter;
  setManagerState(value: CompanyManagerFilter): void;
  visibleCompanies: readonly AdminCompany[];
  openEmployeesId: string | null;
  toggleEmployees(companyId: string): void;
  closeEmployees(): void;
  dialog: CompanyDialog;
  openDialog(next: Exclude<CompanyDialog, null>): void;
  closeDialog(): void;
}

const loadAstryxAdminCompaniesView = () => import("./astryx-admin-companies-view");

function SearchToolbar({ query, onQueryChange, onCreate, profileStatus, managerState, onProfileStatusChange, onManagerStateChange }: {
  query: string;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  profileStatus: CompanyProfileFilter;
  managerState: CompanyManagerFilter;
  onProfileStatusChange: (value: CompanyProfileFilter) => void;
  onManagerStateChange: (value: CompanyManagerFilter) => void;
}) {
  return (
    <AdminToolbar
      search={(
        <AdminSearchField
          value={query}
          onValueChange={onQueryChange}
          label="Пошук компаній"
          placeholder="Пошук компаній..."
          clearLabel="Очистити пошук компаній"
        />
      )}
      filters={(
        <>
          <label className="field min-w-0">
            <span className="sr-only">Стан профілю компанії</span>
            <select value={profileStatus} onChange={(event) => onProfileStatusChange(event.target.value as CompanyProfileFilter)} aria-label="Стан профілю компанії">
              <option value="all">Усі профілі</option>
              <option value="complete">Профіль заповнений</option>
              <option value="incomplete">Профіль неповний</option>
            </select>
          </label>
          <label className="field min-w-0">
            <span className="sr-only">Стан менеджера компанії</span>
            <select value={managerState} onChange={(event) => onManagerStateChange(event.target.value as CompanyManagerFilter)} aria-label="Стан менеджера компанії">
              <option value="all">Усі менеджери</option>
              <option value="assigned">Менеджер призначений</option>
              <option value="unassigned">Менеджер не призначений</option>
            </select>
          </label>
        </>
      )}
      actions={(
        <button type="button" className="button button-primary min-h-10 px-5" onClick={onCreate}>
          <Plus size={15} />
          Нова компанія
        </button>
      )}
      mobileDisclosure={{ sections: ["filters"], activeCount: Number(profileStatus !== "all") + Number(managerState !== "all"), iconOnly: true }}
    />
  );
}

function EmployeePopover({ company, open, onToggle, onClose }: {
  company: AdminCompany;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const popoverId = `${company.id}-employees`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPosition(null);
        return;
      }
      const width = popoverRef.current?.offsetWidth ?? 272;
      const height = popoverRef.current?.offsetHeight ?? 260;
      const gutter = 12;
      const x = Math.max(gutter, Math.min(window.innerWidth - width - gutter, rect.right - width));
      const below = rect.bottom + 6;
      const y = below + height <= window.innerHeight - gutter
        ? below
        : Math.max(gutter, rect.top - height - 6);
      setPosition({ x, y });
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      onClose();
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  const popoverStyle = position
    ? ({ "--company-popover-x": `${position.x}px`, "--company-popover-y": `${position.y}px` } as CSSProperties)
    : undefined;

  return (
    <div className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#b6d6f6] bg-[var(--blue-soft)] px-3 text-[11px] font-medium text-[var(--blue)] ${styles.employeeTrigger}`}
        aria-label={`Працівники ${company.name}`}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={onToggle}
      >
        <Users size={14} />
        {company.employeeCount}
      </button>
      {open && position && typeof document !== "undefined" ? createPortal(
        <section
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={`Працівники ${company.name}`}
          className={styles.employeePopover}
          style={popoverStyle}
          data-positioned={position ? "true" : "false"}
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-3 py-2.5">
            <div className="min-w-0">
              <strong className="block text-[12px]">Працівники</strong>
              <span className="mt-0.5 block truncate text-[10px] text-[var(--muted-foreground)]">{company.name}</span>
            </div>
            <AdminIconAction label="Закрити список працівників" icon={<X size={14} />} onClick={onClose} />
          </header>
          <div className="grid max-h-64 gap-1 overflow-y-auto p-2">
            {company.employees.map((employee) => (
              <article key={employee.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-[var(--surface-subtle)]">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--blue-soft)] text-[10px] font-semibold text-[var(--blue)]" aria-hidden="true">
                  {employee.displayLabel.slice(0, 1)}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-[11px]">{employee.displayLabel}</strong>
                  <span className="block text-[9px] text-[var(--muted-foreground)]">{employee.role}</span>
                </span>
              </article>
            ))}
          </div>
        </section>,
        document.body,
      ) : null}
    </div>
  );
}

function ProfileBadge({ status, compact = false }: { status: CompanyProfileStatus; compact?: boolean }) {
  const complete = status === "complete";

  if (compact) {
    return (
      <span
        className={`grid h-10 w-7 shrink-0 place-items-center rounded-full border ${complete ? "border-[#b7dfbf] bg-[var(--green-soft)] text-[var(--green)]" : "border-[#e3d694] bg-[var(--amber-soft)] text-[var(--amber)]"}`}
        title={complete ? "Заповнений" : "Не заповнений"}
      >
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        <span className="sr-only">{complete ? "Заповнений" : "Не заповнений"}</span>
      </span>
    );
  }

  return (
    <StatusBadge tone={complete ? "green" : "amber"}>
      <span className="mr-1 size-1.5 rounded-full bg-current" aria-hidden="true" />
      {complete ? "Заповнений" : "Не заповнений"}
    </StatusBadge>
  );
}

function CompanyIdentity({ company, titleId }: { company: AdminCompany; titleId?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted-foreground)]">
        <Building2 size={18} />
      </span>
      <span className="min-w-0">
        <strong id={titleId} className="block text-[13px] leading-snug">{company.name}</strong>
        {company.managerSummary ? (
          <span className="mt-0.5 block text-[10px] text-[var(--muted-foreground)]">Менеджер призначений</span>
        ) : null}
      </span>
    </div>
  );
}

function RowActions({ company, onEdit, onAssign }: {
  company: AdminCompany;
  onEdit: () => void;
  onAssign: () => void;
}) {
  return (
    <div className={styles.rowActions}>
      <Link
        href={`/admin/dealer-access?company=${company.policySlug}`}
        className={styles.actionLink}
        aria-label={`Політика доступу ${company.name}`}
        title="Політика доступу"
      >
        <ShieldCheck size={15} />
      </Link>
      <AdminIconAction
        label={`Редагувати ${company.name}`}
        tooltip="Редагувати компанію"
        icon={<Pencil size={15} />}
        tone="primary"
        onClick={onEdit}
      />
      <AdminIconAction
        label={`Призначити працівника в ${company.name}`}
        tooltip="Призначити працівника"
        icon={<UserPlus size={15} />}
        onClick={onAssign}
      />
      <AdminIconAction
        label={`Видалити ${company.name} — заблоковано`}
        tooltip="Видалення компанії недоступне: доступ лише для читання."
        icon={<Trash2 size={15} />}
        tone="danger"
        disabled
      />
    </div>
  );
}

function CompanyTable({ companies, openEmployeesId, onToggleEmployees, onCloseEmployees, onEdit, onAssign }: {
  companies: readonly AdminCompany[];
  openEmployeesId: string | null;
  onToggleEmployees: (companyId: string) => void;
  onCloseEmployees: () => void;
  onEdit: (companyId: string) => void;
  onAssign: (companyId: string) => void;
}) {
  return (
    <AdminTableShell className="hidden md:block" scrollLabel="Компанії">
      <table className="data-table min-w-[690px]">
        <thead>
          <tr>
            <th>Компанія</th>
            <th className="text-center">Працівники</th>
            <th className="text-center">Профіль</th>
            <th>Створена</th>
            <th className="text-right">Дії</th>
          </tr>
        </thead>
        <tbody>
          {companies.length ? companies.map((company) => (
            <tr key={company.id}>
              <td><CompanyIdentity company={company} /></td>
              <td className="text-center">
                <EmployeePopover
                  company={company}
                  open={openEmployeesId === company.id}
                  onToggle={() => onToggleEmployees(company.id)}
                  onClose={onCloseEmployees}
                />
              </td>
              <td className="text-center"><ProfileBadge status={company.profileStatus} /></td>
              <td className="whitespace-nowrap text-[11px] text-[var(--muted-foreground)]">{company.createdAt}</td>
              <td><RowActions company={company} onEdit={() => onEdit(company.id)} onAssign={() => onAssign(company.id)} /></td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="h-24 text-center text-[13px] text-[var(--muted-foreground)]">Компаній не знайдено</td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}

function CompanyCards({ companies, openEmployeesId, onToggleEmployees, onCloseEmployees, onEdit, onAssign }: {
  companies: readonly AdminCompany[];
  openEmployeesId: string | null;
  onToggleEmployees: (companyId: string) => void;
  onCloseEmployees: () => void;
  onEdit: (companyId: string) => void;
  onAssign: (companyId: string) => void;
}) {
  if (!companies.length) {
    return (
      <Panel className="grid min-h-28 place-items-center px-5 py-8 text-center text-[13px] text-[var(--muted-foreground)] shadow-none md:hidden">
        Компаній не знайдено
      </Panel>
    );
  }

  return (
    <Panel className={`divide-y divide-[var(--border)] overflow-visible shadow-none md:hidden ${styles.companyCards}`}>
      {companies.map((company) => (
        <article key={company.id} aria-labelledby={`admin-company-${company.id.replace(/^company-/, "")}-title`} className={styles.companyCard}>
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1"><CompanyIdentity company={company} titleId={`admin-company-${company.id.replace(/^company-/, "")}-title`} /></div>
            <EmployeePopover
              company={company}
              open={openEmployeesId === company.id}
              onToggle={() => onToggleEmployees(company.id)}
              onClose={onCloseEmployees}
            />
          </div>
          <div className={styles.companyMetadata}>
            <p className="m-0 text-[10px] text-[var(--muted-foreground)]">Створена {company.createdAt}</p>
            <ProfileBadge status={company.profileStatus} compact />
          </div>
          <RowActions company={company} onEdit={() => onEdit(company.id)} onAssign={() => onAssign(company.id)} />
        </article>
      ))}
    </Panel>
  );
}

function TextField({ label, placeholder, value, onChange, helper, className = "" }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  className?: string;
}) {
  return (
    <label className={`grid min-w-0 gap-1.5 ${className}`}>
      <span className="text-[12px] font-medium text-[var(--foreground)]">{label}</span>
      <input
        type="text"
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {helper ? <span className="text-[9px] text-[var(--muted-foreground)]">{helper}</span> : null}
    </label>
  );
}

function CompanyFormPreview({ initial }: { initial: CompanyFormFixture }) {
  const [form, setForm] = useState<CompanyFormFixture>(initial);

  const updateField = (field: keyof CompanyFormFixture, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div>
      <AdminModalSection title="Компанія" description="Основні дані дилерської компанії" icon={Building2}>
        <TextField label="Назва компанії *" placeholder="Введіть назву компанії" value={form.companyName} onChange={(value) => updateField("companyName", value)} />
      </AdminModalSection>

      <AdminModalSection title="Інформація про менеджера" icon={UserRound}>
        <AdminFormGrid>
          <TextField label="Ім'я менеджера" placeholder="Введіть повне ім'я менеджера" value={form.managerName} onChange={(value) => updateField("managerName", value)} />
          <TextField
            label="Телефон менеджера"
            placeholder="0XXXXXXXXX"
            value={form.managerPhone}
            onChange={(value) => updateField("managerPhone", value)}
            helper="Український формат: 0XXXXXXXXX (10 цифр)"
          />
        </AdminFormGrid>
      </AdminModalSection>

      <AdminModalSection title="Адреса доставки" icon={MapPin}>
        <AdminFormGrid>
          <TextField label="Область" placeholder="напр., Київська" value={form.region} onChange={(value) => updateField("region", value)} />
          <TextField label="Місто" placeholder="напр., Київ" value={form.city} onChange={(value) => updateField("city", value)} />
          <TextField
            className={styles.fullWidthField}
            label="Склад/Поштомат"
            placeholder="напр., Відділення №5 або Поштомат №12"
            value={form.warehouse}
            onChange={(value) => updateField("warehouse", value)}
          />
          <TextField label="Ім'я отримувача" placeholder="Повне ім'я отримувача" value={form.recipientName} onChange={(value) => updateField("recipientName", value)} />
          <TextField
            label="Телефон отримувача"
            placeholder="0XXXXXXXXX"
            value={form.recipientPhone}
            onChange={(value) => updateField("recipientPhone", value)}
            helper="Український формат: 0XXXXXXXXX (10 цифр)"
          />
        </AdminFormGrid>
      </AdminModalSection>
    </div>
  );
}

function PreviewDialogs({ dialog, onClose }: { dialog: CompanyDialog; onClose: () => void }) {
  const company = dialog && dialog.mode !== "create"
    ? adminCompanies.find((item) => item.id === dialog.companyId) ?? null
    : null;

  if (!dialog) return null;

  if (dialog.mode === "assign") {
    return (
      <Modal
        open
        onClose={onClose}
        title="Призначити працівника"
        description={`Призначте працівника в ${company?.name ?? "компанію"}. Він заповнить дані профілю компанії.`}
        footer={(
          <>
            <button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>
            <LockedButton title="Призначення працівника недоступне: доступ лише для читання." className="button-primary">
              Призначити працівника
            </LockedButton>
          </>
        )}
      >
        <label className="grid gap-1.5">
          <span className="text-[12px] font-medium">Оберіть працівника *</span>
          <select className="input" value="" disabled aria-disabled="true" aria-label="Оберіть працівника — список заблоковано">
            <option value="">Оберіть працівника</option>
          </select>
          <span className="text-[9px] text-[var(--muted-foreground)]">Для призначення потрібен доступ до облікових записів.</span>
        </label>
      </Modal>
    );
  }

  const editing = dialog.mode === "edit";
  const initial = editing && company ? company.editFixture : emptyCompanyForm;
  const title = editing ? "Редагувати компанію" : "Створити нову компанію";
  const description = editing && company
    ? `Оновіть дані компанії ${company.name}`
    : "Заповніть дані компанії. Усі поля, крім назви, необов'язкові.";

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      className="!w-[min(720px,100%)]"
      footer={(
        <>
          <button type="button" className="button button-outline" onClick={onClose}>Скасувати</button>
          <LockedButton
            title={`${editing ? "Оновлення" : "Створення"} компанії недоступне: доступ лише для читання.`}
            className="button-primary"
          >
            {editing ? "Оновити компанію" : "Створити компанію"}
          </LockedButton>
        </>
      )}
    >
      <CompanyFormPreview key={`${dialog.mode}-${company?.id ?? "new"}`} initial={initial} />
    </Modal>
  );
}

export function AdminCompaniesPage() {
  const [query, setQuery] = useState("");
  const [openEmployeesId, setOpenEmployeesId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<CompanyDialog>(null);
  const [profileStatus, setProfileStatus] = useState<CompanyProfileFilter>("all");
  const [managerState, setManagerState] = useState<CompanyManagerFilter>("all");

  const visibleCompanies = useMemo(() => {
    const needle = normalize(query);
    return adminCompanies.filter((company) => (
      (!needle || normalize(company.name).includes(needle))
      && (profileStatus === "all" || company.profileStatus === profileStatus)
      && (managerState === "all" || (managerState === "assigned" ? Boolean(company.managerSummary) : !company.managerSummary))
    ));
  }, [managerState, profileStatus, query]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setOpenEmployeesId(null);
  };

  const toggleEmployees = (companyId: string) => {
    setOpenEmployeesId((current) => current === companyId ? null : companyId);
  };

  const openDialog = (next: Exclude<CompanyDialog, null>) => {
    setOpenEmployeesId(null);
    setDialog(next);
  };

  const model: AdminCompaniesModel = {
    query,
    setQuery: updateQuery,
    profileStatus,
    setProfileStatus,
    managerState,
    setManagerState,
    visibleCompanies,
    openEmployeesId,
    toggleEmployees,
    closeEmployees: () => setOpenEmployeesId(null),
    dialog,
    openDialog,
    closeDialog: () => setDialog(null),
  };

  const currentView = (
    <div data-admin-companies-renderer="shadcn">
    <AdminPage>
      <AdminPageHeader
        icon={<Building2 size={20} />}
        title="Управління компаніями"
        description="Створюйте компанії та призначайте працівників. Працівники заповнюють дані профілю у своєму порталі."
      />

      <SearchToolbar
        query={query}
        onQueryChange={updateQuery}
        onCreate={() => openDialog({ mode: "create" })}
        profileStatus={profileStatus}
        managerState={managerState}
        onProfileStatusChange={setProfileStatus}
        onManagerStateChange={setManagerState}
      />

      <CompanyTable
        companies={visibleCompanies}
        openEmployeesId={openEmployeesId}
        onToggleEmployees={toggleEmployees}
        onCloseEmployees={() => setOpenEmployeesId(null)}
        onEdit={(companyId) => openDialog({ mode: "edit", companyId })}
        onAssign={(companyId) => openDialog({ mode: "assign", companyId })}
      />
      <CompanyCards
        companies={visibleCompanies}
        openEmployeesId={openEmployeesId}
        onToggleEmployees={toggleEmployees}
        onCloseEmployees={() => setOpenEmployeesId(null)}
        onEdit={(companyId) => openDialog({ mode: "edit", companyId })}
        onAssign={(companyId) => openDialog({ mode: "assign", companyId })}
      />

      <CompanyKpis />

      <PreviewDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </AdminPage>
    </div>
  );

  return (
    <RendererViewSwitch
      slotId="admin-companies"
      currentView={currentView}
      loadAstryxView={loadAstryxAdminCompaniesView}
      astryxViewProps={{ model }}
    />
  );
}
