"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { AdminTableShell } from "./admin-ui";
import styles from "./admin-permission-matrix.module.css";

export type PermissionMatrixState = "on" | "off";

export type PermissionMatrixAction<TAction extends string> = {
  readonly id: TAction;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly tone?: "neutral" | "blue" | "green" | "amber" | "red";
};

export type PermissionMatrixRow<TAction extends string> = {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly sectionBefore?: string;
  readonly permissions: Readonly<Partial<Record<TAction, PermissionMatrixState>>>;
};

function PermissionSwitch({
  state,
  rowLabel,
  actionLabel,
  labelledBy,
}: {
  state: PermissionMatrixState;
  rowLabel: string;
  actionLabel: string;
  labelledBy?: string;
}) {
  const checked = state === "on";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : `${rowLabel}: ${actionLabel} — ${checked ? "увімкнено" : "вимкнено"}, лише перегляд`}
      aria-labelledby={labelledBy}
      aria-disabled="true"
      disabled
      title="Зміна дозволу потребує підключення сервісу керування доступом"
      className={styles.permissionSwitch}
      data-state={checked ? "checked" : "unchecked"}
    >
      <span aria-hidden="true" className={styles.permissionSwitchTrack}><span /></span>
    </button>
  );
}

function ActionLabel<TAction extends string>({
  action,
  id,
}: {
  action: PermissionMatrixAction<TAction>;
  id?: string;
}) {
  return (
    <span id={id} className={styles.actionLabel} data-tone={action.tone ?? "neutral"}>
      {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
      <span>{action.label}</span>
    </span>
  );
}

function RowLabel<TAction extends string>({ row }: { row: PermissionMatrixRow<TAction> }) {
  return (
    <span className={styles.rowLabel}>
      {row.icon ? <span className={styles.rowIcon} aria-hidden="true">{row.icon}</span> : null}
      <strong>{row.label}</strong>
    </span>
  );
}

export function AdminPermissionMatrix<TAction extends string>({
  actions,
  rows,
  ariaLabel,
  title,
  description,
  emptyCopy,
}: {
  actions: readonly PermissionMatrixAction<TAction>[];
  rows: readonly PermissionMatrixRow<TAction>[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  emptyCopy?: string;
}) {
  const [expandedRowIds, setExpandedRowIds] = useState<ReadonlySet<string>>(() => new Set());
  const idPrefix = useId().replaceAll(":", "");

  return (
    <AdminTableShell title={title} description={description} scrollLabel={ariaLabel}>
      <table className={styles.desktopTable} aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Об&apos;єкт</th>
            {actions.map((action) => (
              <th key={action.id} scope="col"><ActionLabel action={action} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <MatrixRows key={row.id} row={row} actions={actions} />
          ))}
        </tbody>
      </table>

      <div className={styles.mobileList} aria-label={ariaLabel}>
        {rows.map((row) => (
          <MobileMatrixRow
            key={row.id}
            row={row}
            actions={actions}
            expanded={expandedRowIds.has(row.id)}
            summaryButtonId={`permission-summary-${idPrefix}-${row.id}`}
            regionId={`permission-actions-${idPrefix}-${row.id}`}
            onToggle={() => {
              setExpandedRowIds((current) => {
                const next = new Set(current);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
              });
            }}
          />
        ))}
      </div>

      {!rows.length && emptyCopy ? <div className={styles.emptyState}>{emptyCopy}</div> : null}
    </AdminTableShell>
  );
}

function MobileMatrixRow<TAction extends string>({
  row,
  actions,
  expanded,
  summaryButtonId,
  regionId,
  onToggle,
}: {
  row: PermissionMatrixRow<TAction>;
  actions: readonly PermissionMatrixAction<TAction>[];
  expanded: boolean;
  summaryButtonId: string;
  regionId: string;
  onToggle: () => void;
}) {
  const applicableActions = actions.filter((action) => row.permissions[action.id] !== undefined);
  const enabledCount = applicableActions.filter((action) => row.permissions[action.id] === "on").length;
  const summary = `${enabledCount}/${applicableActions.length} увімкнено`;

  return (
    <div className={styles.mobileGroup}>
      {row.sectionBefore ? <div className={styles.sectionLabel}>{row.sectionBefore}</div> : null}
      <article className={styles.mobileCard}>
        <button
          id={summaryButtonId}
          type="button"
          className={styles.mobileSummary}
          aria-label={`${row.label} — ${summary}`}
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={onToggle}
        >
          <RowLabel row={row} />
          <span className={styles.mobileSummaryCount}>{summary}</span>
          <ChevronDown className={styles.mobileSummaryChevron} size={16} aria-hidden="true" />
        </button>
        {expanded ? (
          <div id={regionId} role="region" aria-labelledby={summaryButtonId} className={styles.mobilePermissions}>
            {applicableActions.map((action) => {
              const state = row.permissions[action.id];
              if (!state) return null;
              const actionLabelId = `${summaryButtonId}-action-${action.id}`;
              return (
                <div key={action.id} className={styles.mobilePermissionRow}>
                  <ActionLabel action={action} id={actionLabelId} />
                  <PermissionSwitch state={state} rowLabel={row.label} actionLabel={action.label} labelledBy={actionLabelId} />
                </div>
              );
            })}
          </div>
        ) : null}
      </article>
    </div>
  );
}

function MatrixRows<TAction extends string>({
  row,
  actions,
}: {
  row: PermissionMatrixRow<TAction>;
  actions: readonly PermissionMatrixAction<TAction>[];
}) {
  return (
    <>
      {row.sectionBefore ? (
        <tr className={styles.sectionRow}>
          <th colSpan={actions.length + 1} scope="rowgroup">{row.sectionBefore}</th>
        </tr>
      ) : null}
      <tr>
        <th scope="row"><RowLabel row={row} /></th>
        {actions.map((action) => {
          const state = row.permissions[action.id];
          return (
            <td key={action.id}>
              {state ? (
                <PermissionSwitch state={state} rowLabel={row.label} actionLabel={action.label} />
              ) : (
                <span className={styles.notApplicable} aria-label="Не застосовується">—</span>
              )}
            </td>
          );
        })}
      </tr>
    </>
  );
}
