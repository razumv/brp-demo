"use client";

import { Filter, Search, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import {BrpButton, BrpIconButton, BrpTextInput} from "@/components/brp-ui";
import {
  type DataToolbarFilterContract,
  useDismissibleDataToolbarFilter,
} from "@/components/brp-ui/data-toolbar-contract";
import {useAppearance} from "@/components/appearance/use-appearance";
import styles from "./dealer-data-toolbar.module.css";

export type DealerDataToolbarProps = Readonly<{
  search: Readonly<{
    value: string;
    onValueChange: (value: string) => void;
    label: string;
    placeholder: string;
  }>;
  filters?: DataToolbarFilterContract;
  resultMeta?: ReactNode;
}>;

export function DealerDataToolbar({ search, filters, resultMeta }: DealerDataToolbarProps) {
  const {renderedDesignSystem} = useAppearance();
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [queryState, setQueryState] = useState({draft: search.value, external: search.value});
  const notifySearchChange = useEffectEvent((value: string) => search.onValueChange(value));

  if (queryState.external !== search.value) {
    setQueryState({draft: search.value, external: search.value});
  }

  useEffect(() => {
    if (queryState.draft === search.value) return;

    const timeoutId = window.setTimeout(() => notifySearchChange(queryState.draft), 300);
    return () => window.clearTimeout(timeoutId);
  }, [queryState.draft, search.value]);

  useDismissibleDataToolbarFilter({
    open: filters?.open ?? false,
    onOpenChange: filters?.onOpenChange ?? (() => undefined),
    triggerRef: filterTriggerRef,
    panelRef: filterPanelRef,
  });

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
            value={queryState.draft}
            onValueChange={(draft) => setQueryState((current) => ({...current, draft}))}
          />
        </div>
        {filters ? (
          <div className={styles.filterTrigger}>
            <BrpIconButton
              ref={filterTriggerRef}
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
        <div ref={filterPanelRef} id={filters.panelId} className={styles.filterPanel} role="region" aria-label={filters.label} hidden={!filters.open}>
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
