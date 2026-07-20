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
  readonly headingId?: string;
  readonly headingLevel?: CollapsibleHeadingLevel;
  readonly icon?: ReactNode;
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
  readonly onOpenChange?: (open: boolean) => void;
}

export function PersistedCollapsibleSection({
  persistenceId,
  title,
  children,
  defaultOpen = true,
  headingId,
  headingLevel = "h2",
  icon,
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
  onOpenChange,
}: PersistedCollapsibleSectionProps) {
  const generatedId = useId().replaceAll(":", "");
  const resolvedHeadingId = headingId ?? `collapsible-heading-${generatedId}`;
  const panelId = `collapsible-panel-${generatedId}`;
  const Heading = headingLevel;
  const { value: open, setValue: setOpen } = usePersistedBoolean(persistenceId, defaultOpen);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const canCollapse = collapseMode === "always" || isMobile;
  const effectiveOpen = canCollapse ? open : true;

  return (
    <Collapsible.Root
      open={effectiveOpen}
      disabled={disabled || !canCollapse}
      onOpenChange={(nextOpen) => {
        if (!canCollapse) return;
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);
      }}
      className={cn(styles.root, className)}
      data-collapse-mode={collapseMode}
      data-can-collapse={canCollapse}
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
                <span>{title}</span>
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
