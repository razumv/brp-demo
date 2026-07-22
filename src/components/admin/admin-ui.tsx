"use client";

import {
  ChevronDown,
  Filter,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { BrpButton } from "@/components/brp-ui";
import {
  type DataToolbarFilterContract,
  useDismissibleDataToolbarFilter,
} from "@/components/brp-ui/data-toolbar-contract";
import { cn } from "@/lib/utils";
import {
  getDisclosedToolbarSections,
  type AdminToolbarMobileDisclosure,
  type AdminToolbarSection,
} from "./admin-toolbar-disclosure";
import styles from "./admin-ui.module.css";

export type { AdminToolbarMobileDisclosure } from "./admin-toolbar-disclosure";

export type AdminTone = "neutral" | "orange" | "green" | "blue" | "amber" | "red";

export function AdminPage({
  children,
  width = "standard",
  className,
}: {
  children: ReactNode;
  width?: "standard" | "wide";
  className?: string;
}) {
  return (
    <div className={cn("page", styles.adminPage, styles.page, width === "wide" && styles.pageWide, className)}>
      {children}
    </div>
  );
}

export function AdminPageHeader({
  icon,
  title,
  description,
  meta,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn(styles.pageHeader, className)}>
      <div className={styles.pageHeaderCopy}>
        <div className={styles.pageTitleRow}>
          {icon ? <span className="page-header-icon shrink-0" aria-hidden="true">{icon}</span> : null}
          <h1 className="page-title page-title-admin">{title}</h1>
        </div>
        {description ? <div className={styles.pageDescription}>{description}</div> : null}
      </div>
      {meta ? <div className={styles.pageHeaderMeta}>{meta}</div> : null}
      {actions ? <div className={styles.pageHeaderActions}>{actions}</div> : null}
    </header>
  );
}

export type AdminTabItem<T extends string> = {
  id: T;
  label: ReactNode;
  mobileLabel?: string;
  count?: number | string;
  icon?: ReactNode;
  disabled?: boolean;
  panelId?: string;
};

export function AdminTabs<T extends string>({
  items,
  value,
  onValueChange,
  label,
  mobileSelectLabel,
  size = "default",
  mobileFullWidth = false,
  className,
}: {
  items: readonly AdminTabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  mobileSelectLabel?: string;
  size?: "compact" | "default";
  mobileFullWidth?: boolean;
  className?: string;
}) {
  const selected = items.find((item) => item.id === value);

  const moveFocus = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    const enabled = items
      .map((item, itemIndex) => ({ item, itemIndex }))
      .filter(({ item }) => !item.disabled);
    if (!enabled.length) return;

    const currentEnabledIndex = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    let nextEnabledIndex = currentEnabledIndex;
    if (event.key === "Home") nextEnabledIndex = 0;
    if (event.key === "End") nextEnabledIndex = enabled.length - 1;
    if (event.key === "ArrowRight") nextEnabledIndex = (currentEnabledIndex + 1) % enabled.length;
    if (event.key === "ArrowLeft") nextEnabledIndex = (currentEnabledIndex - 1 + enabled.length) % enabled.length;

    const next = enabled[nextEnabledIndex];
    const tabList = event.currentTarget.closest('[role="tablist"]');
    const target = tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next.itemIndex];
    target?.focus();
    onValueChange(next.item.id);
  };

  return (
    <div
      className={cn(
        styles.tabsRoot,
        mobileSelectLabel && styles.tabsWithMobileSelect,
        mobileFullWidth && styles.tabsRootMobileFullWidth,
        className,
      )}
    >
      {mobileSelectLabel ? (
        <label className={styles.mobileTabSelect}>
          <span>{mobileSelectLabel}</span>
          <select value={value} onChange={(event) => onValueChange(event.target.value as T)}>
            {items.map((item) => (
              <option key={item.id} value={item.id} disabled={item.disabled}>
                {item.mobileLabel ?? (typeof item.label === "string" ? item.label : item.id)}
                {item.count === undefined ? "" : ` (${item.count})`}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div
        className={cn(styles.tabs, size === "compact" && styles.tabsCompact, mobileFullWidth && styles.tabsMobileFullWidth)}
        role="tablist"
        aria-label={label}
        data-active-tab={selected?.id}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={item.panelId ? `${item.panelId}-tab` : undefined}
            aria-selected={value === item.id}
            aria-controls={item.panelId}
            tabIndex={value === item.id ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.id)}
            onKeyDown={(event) => moveFocus(event, index)}
            className={styles.tab}
          >
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
            <span>{item.label}</span>
            {item.count === undefined ? null : <span className={styles.tabCount}>{item.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminSegmentedControl<T extends string>({
  items,
  value,
  onValueChange,
  label,
  mobileFullWidth = false,
  className,
}: {
  items: readonly AdminTabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  mobileFullWidth?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(styles.segmented, mobileFullWidth && styles.segmentedMobileFullWidth, className)} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={value === item.id}
          disabled={item.disabled}
          onClick={() => onValueChange(item.id)}
        >
          {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
          <span>{item.label}</span>
          {item.count === undefined ? null : <span className={styles.tabCount}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function AdminToolbar({
  search,
  filters,
  filterContract,
  view,
  actions,
  meta,
  mobileDisclosure,
  contained = true,
  className,
}: {
  search?: ReactNode;
  filters?: ReactNode;
  filterContract?: DataToolbarFilterContract;
  view?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  mobileDisclosure?: AdminToolbarMobileDisclosure;
  contained?: boolean;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDisclosureTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDisclosurePanelRef = useRef<HTMLDivElement>(null);
  const disclosureId = `admin-toolbar-${useId().replaceAll(":", "")}`;
  const resolvedFilters = filterContract ? (
    <>
      <div className={styles.toolbarFilterContent}>{filterContract.content}</div>
      {filterContract.onClear ? (
        <div className={styles.toolbarFilterReset}>
          <BrpButton
            label="Скинути фільтри"
            icon={<X size={14} aria-hidden="true" />}
            disabled={filterContract.activeCount === 0}
            onPress={filterContract.onClear}
          />
        </div>
      ) : null}
    </>
  ) : filters;
  const resolvedMobileDisclosure = filterContract
    ? {
      ...mobileDisclosure,
      sections: mobileDisclosure?.sections ?? ["filters"],
      label: filterContract.label,
      activeCount: filterContract.activeCount,
      expanded: filterContract.open,
      controlsId: filterContract.panelId,
      onExpandedChange: filterContract.onOpenChange,
    }
    : mobileDisclosure;
  const disclosedSections = getDisclosedToolbarSections(
    { filters: Boolean(resolvedFilters), view: Boolean(view), actions: Boolean(actions) },
    resolvedMobileDisclosure,
  );
  const hasDisclosedControls = Boolean(resolvedMobileDisclosure && disclosedSections.length);
  const firstDisclosedSection = disclosedSections[0];
  const mobileDisclosureLabel = resolvedMobileDisclosure?.label ?? "Фільтри";
  const isIconOnlyMobileDisclosure = resolvedMobileDisclosure?.iconOnly !== false;
  const isControlledMobileDisclosure = Boolean(
    resolvedMobileDisclosure?.controlsId && resolvedMobileDisclosure.onExpandedChange,
  );
  const mobileExpanded = isControlledMobileDisclosure
    ? Boolean(resolvedMobileDisclosure?.expanded)
    : mobileOpen;
  const mobileControlsId = isControlledMobileDisclosure
    ? resolvedMobileDisclosure?.controlsId
    : disclosureId;

  const onMobileExpandedChange = (expanded: boolean) => {
    if (isControlledMobileDisclosure) {
      resolvedMobileDisclosure?.onExpandedChange?.(expanded);
      return;
    }
    setMobileOpen(expanded);
  };

  useDismissibleDataToolbarFilter({
    open: mobileExpanded,
    onOpenChange: onMobileExpandedChange,
    triggerRef: mobileDisclosureTriggerRef,
    panelRef: mobileDisclosurePanelRef,
  });

  const renderToolbarControl = (section: AdminToolbarSection, control: ReactNode, className: string) => {
    if (!control || disclosedSections.includes(section)) return null;
    return <div className={className}>{control}</div>;
  };

  const disclosurePanel = resolvedMobileDisclosure && hasDisclosedControls ? (
    <div
      ref={mobileDisclosurePanelRef}
      id={filterContract ? filterContract.panelId : isControlledMobileDisclosure ? undefined : disclosureId}
      className={cn(
        styles.mobileDisclosurePanel,
        isControlledMobileDisclosure && !filterContract && styles.mobileDisclosurePanelControlled,
      )}
      data-mobile-disclosure-panel
      data-mobile-open={mobileExpanded}
    >
      {disclosedSections.includes("filters") ? <div className={styles.toolbarFilters}>{resolvedFilters}</div> : null}
      {disclosedSections.includes("view") ? <div className={styles.toolbarView}>{view}</div> : null}
      {disclosedSections.includes("actions") ? <div className={styles.toolbarActions}>{actions}</div> : null}
    </div>
  ) : null;

  return (
    <section className={cn(styles.toolbar, resolvedMobileDisclosure && styles.toolbarWithMobileDisclosure, contained && styles.toolbarContained, className)}>
      {search ? <div className={styles.toolbarSearch}>{search}</div> : null}
      {resolvedMobileDisclosure && hasDisclosedControls ? (
        <button
          ref={mobileDisclosureTriggerRef}
          type="button"
          className={cn(styles.mobileDisclosureTrigger, isIconOnlyMobileDisclosure && styles.mobileDisclosureTriggerIconOnly)}
          aria-expanded={mobileExpanded}
          aria-controls={mobileControlsId}
          aria-label={isIconOnlyMobileDisclosure ? mobileDisclosureLabel : undefined}
          onClick={() => onMobileExpandedChange(!mobileExpanded)}
        >
          <Filter size={16} aria-hidden="true" />
          {isIconOnlyMobileDisclosure ? null : <span className={styles.mobileDisclosureText}>{mobileDisclosureLabel}</span>}
          {resolvedMobileDisclosure.activeCount ? <span className={styles.mobileDisclosureCount}>{resolvedMobileDisclosure.activeCount}</span> : null}
          {isIconOnlyMobileDisclosure ? null : <ChevronDown className={styles.mobileDisclosureChevron} size={14} aria-hidden="true" />}
        </button>
      ) : null}
      {firstDisclosedSection === "filters" ? disclosurePanel : null}
      {renderToolbarControl("filters", resolvedFilters, styles.toolbarFilters)}
      {!search ? <div className={styles.toolbarSpacer} aria-hidden="true" /> : null}
      {firstDisclosedSection === "view" ? disclosurePanel : null}
      {renderToolbarControl("view", view, styles.toolbarView)}
      {firstDisclosedSection === "actions" ? disclosurePanel : null}
      {renderToolbarControl("actions", actions, styles.toolbarActions)}
      {meta ? <div className={styles.toolbarMeta}>{meta}</div> : null}
    </section>
  );
}

export function AdminSearchField({
  value,
  onValueChange,
  label,
  placeholder,
  clearLabel = "Очистити пошук",
  size = "default",
  maxWidth,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder: string;
  clearLabel?: string;
  size?: "compact" | "default";
  maxWidth?: number | string;
  className?: string;
}) {
  const style = maxWidth === undefined
    ? undefined
    : ({ "--admin-search-max-width": typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } as CSSProperties);

  return (
    <label
      className={cn(styles.searchField, size === "compact" && styles.searchFieldCompact, className)}
      style={style}
    >
      <span className="sr-only">{label}</span>
      <Search className={styles.searchIcon} size={16} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
      />
      {value ? (
        <button type="button" className={styles.searchClear} aria-label={clearLabel} onClick={() => onValueChange("")}>
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

export type AdminKpi = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: AdminTone;
};

export function AdminKpiGrid({
  items,
  label = "Ключові показники",
  columns = 4,
  hideOnMobile = false,
  className,
}: {
  items: readonly AdminKpi[];
  label?: string;
  columns?: 3 | 4;
  hideOnMobile?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(styles.kpiGrid, columns === 3 && styles.kpiGridThree, hideOnMobile && styles.kpiGridHideOnMobile, className)}
      aria-label={label}
    >
      {items.map((item) => <AdminKpiCard key={item.id} item={item} />)}
    </section>
  );
}

export function AdminKpiCard({ item, className }: { item: AdminKpi; className?: string }) {
  return (
    <article className={cn(styles.kpiCard, className)}>
      {item.icon ? (
        <span className={cn(styles.kpiIcon, styles[`tone${capitalize(item.tone ?? "neutral")}`])} aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span className={styles.kpiCopy}>
        <span className={styles.kpiLabel}>{item.label}</span>
        <strong className={styles.kpiValue}>{item.value}</strong>
        {item.helper ? <span className={styles.kpiHelper}>{item.helper}</span> : null}
      </span>
    </article>
  );
}

export function AdminTableShell({
  children,
  title,
  description,
  actions,
  notice,
  footer,
  scrollLabel,
  className,
}: {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
  footer?: ReactNode;
  scrollLabel?: string;
  className?: string;
}) {
  const header = title || description || actions;

  return (
    <section className={cn(styles.tableShell, className)}>
      {header ? (
        <header className={styles.tableHeader}>
          <div className={styles.tableHeaderCopy}>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.tableHeaderActions}>{actions}</div> : null}
        </header>
      ) : null}
      {notice ? <div className={styles.tableNotice}>{notice}</div> : null}
      <div
        className={styles.tableScroll}
        role={scrollLabel ? "region" : undefined}
        aria-label={scrollLabel}
        tabIndex={scrollLabel ? 0 : undefined}
      >
        {children}
      </div>
      {footer ? <footer className={styles.tableFooter}>{footer}</footer> : null}
    </section>
  );
}

export function AdminIconAction({
  label,
  icon,
  tone = "neutral",
  tooltip,
  className,
  disabled,
  onClick,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "primary" | "danger";
  tooltip?: string;
}) {
  const tooltipText = tooltip ?? label;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        {...props}
        type="button"
        delay={450}
        closeDelay={80}
        className={cn(styles.iconAction, styles[`iconAction${capitalize(tone)}`], className)}
        aria-label={label}
        title={disabled ? tooltipText : undefined}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
      >
        {icon}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={7} className={styles.tooltipPositioner}>
          <Tooltip.Popup className={styles.tooltipPopup}>{tooltipText}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function AdminModalSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(styles.modalSection, className)}>
      <header className={styles.modalSectionHeader}>
        {Icon ? <Icon size={16} aria-hidden="true" /> : null}
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className={styles.modalSectionBody}>{children}</div>
    </section>
  );
}

export function AdminFormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.formGrid, className)}>{children}</div>;
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}` as Capitalize<T>;
}
