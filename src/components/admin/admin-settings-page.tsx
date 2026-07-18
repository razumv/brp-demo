"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Server,
  Settings,
  Trash2,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useMemo, useState, type ComponentType, type SVGProps } from "react";
import {
  AdminKpiGrid,
  AdminPage,
  AdminPageHeader,
  AdminSearchField,
  AdminToolbar,
} from "@/components/admin/admin-ui";
import {
  databaseSettings,
  filterSettingsSections,
  queueActions,
  queueMetrics,
  selectedWorkerCount,
  SETTINGS_EMPTY_COPY,
  workerExplanation,
  workerOptions,
  type QueueAction,
  type QueueMetric,
  type SettingsSectionId,
} from "@/lib/admin-settings-data";
import styles from "./admin-settings.module.css";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

const queueMetricIcons: Readonly<Record<QueueMetric["id"], LucideIcon>> = {
  pending: Clock3,
  active: Activity,
  completed: CheckCircle2,
  failed: XCircle,
};

const queueActionIcons: Readonly<Record<QueueAction["id"], LucideIcon>> = {
  "clear-completed": Check,
  "clear-failed": Trash2,
  "reset-counters": RefreshCw,
  "clear-pending": TriangleAlert,
};

function SectionHeading({ icon: Icon, title, tone }: { icon: LucideIcon; title: string; tone: "orange" | "blue" }) {
  return (
    <header className={styles.panelHeader}>
      <span className={tone === "orange" ? styles.orangeIcon : styles.blueIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
    </header>
  );
}

function WorkerPanel() {
  return (
    <section className={styles.panel} aria-labelledby="settings-workers-title">
      <div id="settings-workers-title">
        <SectionHeading icon={Server} title="Налаштування воркерів" tone="orange" />
      </div>
      <div className={styles.workerBody}>
        <label className={styles.workerLabel} htmlFor="settings-worker-count">Паралельність воркерів</label>
        <p>{workerExplanation}</p>
        <select
          id="settings-worker-count"
          value={selectedWorkerCount}
          disabled
          aria-disabled="true"
          className={styles.workerSelect}
        >
          {workerOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </section>
  );
}

function QueuePanel() {
  return (
    <section className={styles.panel} aria-labelledby="settings-queue-title">
      <div id="settings-queue-title">
        <SectionHeading icon={Database} title="Керування чергою" tone="blue" />
      </div>
      <div className={styles.queueBody}>
        <AdminKpiGrid
          label="Показники черги"
          items={queueMetrics.map((metric) => {
            const Icon = queueMetricIcons[metric.id];
            return {
              id: metric.id,
              label: metric.label,
              value: metric.value,
              tone: metric.tone,
              icon: <Icon size={18} />,
            };
          })}
        />
        <div className={styles.queueActions} aria-label="Дії з чергою">
          {queueActions.map((action) => {
            const Icon = queueActionIcons[action.id];
            return (
              <button
                key={action.id}
                type="button"
                disabled
                aria-disabled="true"
                className={action.tone === "danger" ? styles.dangerAction : styles.queueAction}
              >
                <Icon size={15} aria-hidden="true" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DatabasePanel() {
  return (
    <section className={styles.panel} aria-labelledby="settings-database-title">
      <div id="settings-database-title">
        <SectionHeading icon={Database} title="База даних" tone="blue" />
      </div>
      <dl className={styles.databaseRows}>
        {databaseSettings.map((setting) => (
          <div key={setting.id} className={styles.databaseRow}>
            <dt>{setting.label}</dt>
            <dd>
              {setting.connected ? (
                <span className={styles.connectedBadge}><span aria-hidden="true" />{setting.value}</span>
              ) : setting.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const sectionRenderers: Readonly<Record<SettingsSectionId, () => React.ReactNode>> = {
  workers: () => <WorkerPanel />,
  queue: () => <QueuePanel />,
  database: () => <DatabasePanel />,
};

export function AdminSettingsPage() {
  const [query, setQuery] = useState("");
  const visibleSections = useMemo(() => filterSettingsSections(query), [query]);

  return (
    <AdminPage>
      <AdminPageHeader
        icon={<Settings size={20} />}
        title="Налаштування"
        description="Конфігурація системних налаштувань та керування фоновими завданнями"
        actions={(
          <button type="button" disabled aria-disabled="true" className={styles.refreshButton}>
            <RefreshCw size={16} aria-hidden="true" />
            Оновити
          </button>
        )}
      />
      <AdminToolbar
        search={(
          <AdminSearchField
            value={query}
            onValueChange={setQuery}
            label="Пошук за налаштуваннями"
            placeholder="Пошук за налаштуваннями, чергою, воркерами, базою..."
          />
        )}
      />
      {visibleSections.length ? (
        <div className={styles.panels}>
          {visibleSections.map((section) => <div key={section}>{sectionRenderers[section]()}</div>)}
        </div>
      ) : (
        <div className={styles.emptyState}>{SETTINGS_EMPTY_COPY}</div>
      )}
    </AdminPage>
  );
}
