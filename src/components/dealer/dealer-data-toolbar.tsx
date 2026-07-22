"use client";

import { Filter, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import {BrpButton, BrpIconButton, BrpTextInput} from "@/components/brp-ui";
import {useAppearance} from "@/components/appearance/use-appearance";
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
  const {renderedDesignSystem} = useAppearance();

  return (
    <section className={styles.root} data-dealer-data-toolbar data-renderer={renderedDesignSystem}>
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <BrpTextInput
            type="search"
            label={search.label}
            hideLabel
            leadingIcon={<Search size={16} aria-hidden="true" />}
            clearable
            placeholder={search.placeholder}
            value={search.value}
            onValueChange={search.onValueChange}
          />
        </div>
        {filters ? (
          <div className={styles.filterTrigger}>
            <BrpIconButton
              label={filters.label}
              icon={<><Filter size={17} aria-hidden="true" />{filters.activeCount > 0 ? <span className={styles.activeCount}>{filters.activeCount}</span> : null}</>}
              variant="secondary"
              ariaControls={filters.panelId}
              expanded={filters.open}
              onPress={() => filters.onOpenChange(!filters.open)}
            />
          </div>
        ) : null}
      </div>
      {filters ? (
        <div id={filters.panelId} className={styles.filterPanel} hidden={!filters.open}>
          <div className={styles.filterContent}>{filters.content}</div>
          {filters.onClear ? (
            <div className={styles.resetButton}>
              <BrpButton label="Скинути фільтри" icon={<X size={14} aria-hidden="true" />} disabled={filters.activeCount === 0} onPress={filters.onClear} />
            </div>
          ) : null}
        </div>
      ) : null}
      {resultMeta ? <p className={styles.resultMeta} aria-live="polite">{resultMeta}</p> : null}
    </section>
  );
}
