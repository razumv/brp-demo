"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePersistedBoolean } from "@/hooks/use-persisted-boolean";
import { cn } from "@/lib/utils";
import styles from "./persisted-collapsible-section.module.css";

type CollapsibleHeadingLevel = "h2" | "h3" | "h4";
type CollapseMode = "always" | "mobile";

export interface PersistedCollapsibleSectionProps {
  readonly persistenceId: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
  readonly open?: boolean;
  readonly headingId?: string;
  readonly headingLevel?: CollapsibleHeadingLevel;
  readonly icon?: ReactNode;
  readonly titleContent?: ReactNode;
  readonly titleAccessory?: ReactNode;
  readonly summary?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly headerClassName?: string;
  readonly contentClassName?: string;
  readonly disabled?: boolean;
  readonly hiddenUntilFound?: boolean;
  readonly keepMounted?: boolean;
  readonly collapseMode?: CollapseMode;
  readonly hideActionsWhenMobileClosed?: boolean;
  readonly dataComponent?: string;
  readonly onOpenChange?: (open: boolean) => void;
}

export function PersistedCollapsibleSection({
  persistenceId,
  title,
  children,
  defaultOpen = true,
  open: controlledOpen,
  headingId,
  headingLevel = "h2",
  icon,
  titleContent,
  titleAccessory,
  summary,
  actions,
  className,
  headerClassName,
  contentClassName,
  disabled = false,
  hiddenUntilFound = true,
  keepMounted = false,
  collapseMode = "always",
  hideActionsWhenMobileClosed = false,
  dataComponent,
  onOpenChange,
}: PersistedCollapsibleSectionProps) {
  const generatedId = useId().replaceAll(":", "");
  const resolvedHeadingId = headingId ?? `collapsible-heading-${generatedId}`;
  const panelId = `collapsible-panel-${generatedId}`;
  const Heading = headingLevel;
  const { value: storedOpen, setValue: setStoredOpen } = usePersistedBoolean(persistenceId, defaultOpen);
  const open = controlledOpen ?? storedOpen;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const canCollapse = collapseMode === "always" || isMobile;
  const effectiveOpen = canCollapse ? open : true;

  return (
    <Collapsible.Root
      open={effectiveOpen}
      disabled={disabled || !canCollapse}
      onOpenChange={(nextOpen) => {
        if (!canCollapse) return;
        if (controlledOpen === undefined) setStoredOpen(nextOpen);
        onOpenChange?.(nextOpen);
      }}
      className={cn(styles.root, className)}
      data-collapse-mode={collapseMode}
      data-can-collapse={canCollapse}
      data-effective-open={effectiveOpen}
      data-hide-actions-mobile-when-closed={hideActionsWhenMobileClosed}
      data-component={dataComponent}
    >
      <div className={cn(styles.header, headerClassName)}>
        <div className={styles.headingBlock}>
          <div className={styles.titleRow}>
            <Heading id={resolvedHeadingId} className={styles.heading}>
              <Collapsible.Trigger
                className={styles.trigger}
                aria-label={title}
              >
                {icon ? <span className={styles.icon} aria-hidden="true">{icon}</span> : null}
                <span>{titleContent ?? title}</span>
                <ChevronDown className={styles.chevron} size={14} aria-hidden="true" />
              </Collapsible.Trigger>
            </Heading>
            {titleAccessory ? <div className={styles.titleAccessory}>{titleAccessory}</div> : null}
          </div>
          {summary ? <div className={styles.summary}>{summary}</div> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <Collapsible.Panel
        id={panelId}
        role="region"
        aria-labelledby={resolvedHeadingId}
        hiddenUntilFound={hiddenUntilFound}
        keepMounted={hiddenUntilFound ? undefined : keepMounted}
        className={styles.panel}
      >
        <div className={cn(styles.panelInner, contentClassName)}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
