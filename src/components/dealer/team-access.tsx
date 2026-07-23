"use client";

import {
  BookOpen,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  PackageOpen,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
import { useAppearance } from "@/components/appearance/use-appearance";
import { BrpButton, BrpSwitch, BrpTextInput } from "@/components/brp-ui";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import styles from "./dealer.module.css";

const accessReasonId = "team-access-lock-reason";

const permissions = [
  { label: "Каталог", helper: "Читання", icon: BookOpen, enabled: true },
  { label: "Консигнація", helper: "Відвантаження", icon: PackageOpen, enabled: false },
  { label: "Консигнація", helper: "Читання", icon: PackageOpen, enabled: true },
  { label: "Консигнація", helper: "Запит", icon: PackageOpen, enabled: false },
  { label: "Пошук запчастини", helper: "Читання", icon: Search, enabled: true },
];

export function TeamAccessPage() {
  const { renderedDesignSystem } = useAppearance();
  const { identity } = useDealerWorkflow();
  if (!identity) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="skeleton" />
        <p>Завантажуємо дані облікового запису…</p>
      </main>
    );
  }
  const { displayName: name, email } = identity;

  return (
    <main className="page page-narrow" data-dealer-team-access-renderer={renderedDesignSystem}>
      <PageHeader
        icon={<UsersRound size={21} />}
        title="Команда і доступи"
        description="Налаштуйте користувачів компанії та профілі доступу."
      />

      <span id={accessReasonId} className="sr-only">
        Зміна складу команди та профілів прав доступна адміністратору.
      </span>

      <Panel className={styles.teamUsersPanel}>
        <header><h2>Користувачі</h2><p>Профіль обирається окремо для кожного користувача.</p></header>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Назва</th><th>Email</th><th>Роль</th><th>Статус доступу</th><th>Профіль</th></tr></thead>
            <tbody><tr><td><strong>{name}</strong></td><td>{email}</td><td>Головний дилер</td><td><StatusBadge tone="green">Основний акаунт</StatusBadge></td><td><BrpButton label="Оберіть профіль" disabled ariaDescribedBy={accessReasonId} /></td></tr></tbody>
          </table>
        </div>
      </Panel>

      <Panel className={styles.selectedAccount}>
        <header>
          <span><UserRound size={19} /></span>
          <div><small>Обраний акаунт</small><h2>{name}</h2><p>{email}</p></div>
        </header>
        <div className={styles.accountBadges}><StatusBadge tone="neutral">Головний дилер</StatusBadge><StatusBadge tone="green">Основний акаунт</StatusBadge><StatusBadge tone="neutral">Оберіть профіль</StatusBadge></div>
        <div className={styles.accountControls}>
          <BrpTextInput label="Ім'я акаунта" value={name} onValueChange={() => undefined} disabled ariaDescribedBy={accessReasonId} />
          <BrpButton label="Зберегти ім'я" disabled ariaDescribedBy={accessReasonId} />
          <span className={styles.quickLabel}>Швидкий доступ</span>
          <BrpButton label="Дати Full Access" icon={<ShieldCheck size={15} />} disabled ariaDescribedBy={accessReasonId} />
          <BrpButton label="Без доступу" icon={<LockKeyhole size={15} />} disabled ariaDescribedBy={accessReasonId} />
        </div>
      </Panel>

      <Panel className={styles.permissionsPanel}>
        <header><div><h2>Права профілю</h2><p>Показані лише функції, доступні вашій компанії.</p></div><BrpButton label="Зберегти" icon={<Save size={14} />} disabled ariaDescribedBy={accessReasonId} /></header>
        <div>
          {permissions.map(({ label, helper, icon: Icon, enabled }, index) => (
            <div className={styles.permissionRow} key={`${label}-${helper}-${index}`}>
              <span className={styles.permissionIcon}>{enabled ? <CheckCircle2 size={17} /> : <Icon size={17} />}</span>
              <span><strong>{label}</strong><small>{helper}</small></span>
              <BrpSwitch label={`${label}: ${helper}`} checked={enabled} onCheckedChange={() => undefined} disabled hideLabel ariaDescribedBy={accessReasonId} />
            </div>
          ))}
        </div>
        <footer><KeyRound size={15} /> Щоб змінити права або додати співробітника, зверніться до адміністратора.</footer>
      </Panel>
    </main>
  );
}
