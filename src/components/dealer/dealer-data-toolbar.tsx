"use client";

import { Filter, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./dealer-data-toolbar.module.css";

export type DealerDataToolbarProps = Readonly<{
  search: Readonly<{
    value: string;
    onValueChange: (value: string) => void;
    label: string;
    placeholder: string;
  }>;
  filters?: Readonly<{
    label: string;
    activeCount: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    panelId: string;
    content: ReactNode;
    onClear?: () => void;
  }>;
  resultMeta?: ReactNode;
}>;

export function DealerDataToolbar({ search, filters, resultMeta }: DealerDataToolbarProps) {
  return (
    <section className={styles.root} data-dealer-data-toolbar>
      <div className={styles.searchRow}>
        <label className={styles.searchField}>
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">{search.label}</span>
          <input
            type="search"
            aria-label={search.label}
            autoComplete="off"
            spellCheck={false}
            placeholder={search.placeholder}
            value={search.value}
            onChange={(event) => search.onValueChange(event.target.value)}
          />
        </label>
        {filters ? (
          <button
            type="button"
            className={styles.filterTrigger}
            aria-label={filters.label}
            aria-controls={filters.panelId}
            aria-expanded={filters.open}
            onClick={() => filters.onOpenChange(!filters.open)}
          >
            <Filter size={17} aria-hidden="true" />
            {filters.activeCount > 0 ? <span className={styles.activeCount}>{filters.activeCount}</span> : null}
          </button>
        ) : null}
      </div>
      {filters ? (
        <div id={filters.panelId} className={styles.filterPanel} hidden={!filters.open}>
          <div className={styles.filterContent}>{filters.content}</div>
          {filters.onClear ? (
            <button type="button" className={styles.resetButton} disabled={filters.activeCount === 0} onClick={filters.onClear}>
              <X size={14} aria-hidden="true" />
              Скинути фільтри
            </button>
          ) : null}
        </div>
      ) : null}
      {resultMeta ? <p className={styles.resultMeta} aria-live="polite">{resultMeta}</p> : null}
    </section>
  );
}
