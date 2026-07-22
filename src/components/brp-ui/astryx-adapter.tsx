"use client";

import {useId, type Ref} from "react";
import {Button as AstryxButton} from "@astryxdesign/core/Button";
import {IconButton as AstryxIconButton} from "@astryxdesign/core/IconButton";
import {TextInput as AstryxTextInput} from "@astryxdesign/core/TextInput";
import {Selector as AstryxSelector} from "@astryxdesign/core/Selector";
import {Switch as AstryxSwitch} from "@astryxdesign/core/Switch";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Toolbar as AstryxToolbar} from "@astryxdesign/core/Toolbar";
import {Card as AstryxCard} from "@astryxdesign/core/Card";
import {Badge as AstryxBadge} from "@astryxdesign/core/Badge";
import {StatusDot as AstryxStatusDot} from "@astryxdesign/core/StatusDot";
import {pixel, proportional, Table as AstryxTable, type TableColumn} from "@astryxdesign/core/Table";
import {Dialog as AstryxDialog} from "@astryxdesign/core/Dialog";
import {AlertDialog as AstryxAlertDialog} from "@astryxdesign/core/AlertDialog";
import {MoreMenu as AstryxMoreMenu} from "@astryxdesign/core/MoreMenu";
import {
  Popover as AstryxPopover,
  type PopoverTriggerRenderProps,
} from "@astryxdesign/core/Popover";
import {EmptyState as AstryxEmptyState} from "@astryxdesign/core/EmptyState";
import {Skeleton as AstryxSkeleton} from "@astryxdesign/core/Skeleton";
import type {
  BrpCardProps,
  BrpDialogProps,
  BrpPopoverProps,
  BrpPopoverTriggerProps,
  BrpSemanticTone,
  BrpTableProps,
  BrpUiAdapter,
} from "./contracts";

const cardVariants: Readonly<Record<NonNullable<BrpCardProps["tone"]>, "default" | "muted" | "transparent" | "blue" | "green" | "yellow">> = {
  default: "default",
  muted: "muted",
  transparent: "transparent",
  info: "blue",
  success: "green",
  warning: "yellow",
};

const cardPadding: Readonly<Record<NonNullable<BrpCardProps["padding"]>, 0 | 2 | 4 | 6>> = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
};

const badgeVariants: Readonly<Record<BrpSemanticTone, "neutral" | "info" | "success" | "warning" | "error">> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
};

const dialogWidths = {sm: 360, md: 520, lg: 760} as const;
const popoverPlacements = {
  above: "above",
  below: "below",
  before: "start",
  after: "end",
} as const;

type AstryxFacadeTableRow = Record<string, unknown> & {__brpInternalRowId: string | number};

function toAstryxColumns({columns}: Pick<BrpTableProps, "columns">): TableColumn<AstryxFacadeTableRow>[] {
  return columns.map((column) => ({
    key: column.key,
    header: column.label,
    align: column.align,
    width: column.width === "compact"
      ? pixel(96)
      : proportional(column.width === "wide" ? 2 : 1),
    renderCell: (row) => row[column.key] as React.ReactNode,
  }));
}

function AstryxFacadeDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  purpose = "info",
  width = "md",
}: BrpDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <AstryxDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      purpose={purpose}
      variant={width === "fullscreen" ? "fullscreen" : "standard"}
      width={width === "fullscreen" ? undefined : dialogWidths[width]}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div>
        <header>
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </header>
        <div>{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </AstryxDialog>
  );
}

function AstryxFacadePopover({
  label,
  renderTrigger,
  content,
  open,
  onOpenChange,
  disabled,
  placement,
}: BrpPopoverProps) {
  return (
    <AstryxPopover
      label={label}
      content={content}
      isOpen={open}
      onOpenChange={onOpenChange}
      isEnabled={!disabled}
      placement={placement ? popoverPlacements[placement] : undefined}
      hasAutoFocus
      hasLightDismiss
      hasEscapeDismiss
    >
      {(triggerProps: PopoverTriggerRenderProps) => renderTrigger({
        ref: triggerProps.ref as Ref<HTMLElement>,
        onClick: () => triggerProps.onClick(),
        "aria-haspopup": triggerProps["aria-haspopup"],
        "aria-expanded": triggerProps["aria-expanded"],
        "aria-controls": triggerProps["aria-controls"],
      } satisfies BrpPopoverTriggerProps)}
    </AstryxPopover>
  );
}

export const astryxAdapter: BrpUiAdapter = {
  BrpButton: ({label, content, variant = "secondary", size = "md", disabled, busy, icon, endContent, fullWidth, onPress, type = "button", ref}) => (
    <AstryxButton
      ref={ref}
      label={label}
      variant={variant === "danger" ? "destructive" : variant}
      size={size}
      type={type}
      isDisabled={disabled}
      isLoading={busy}
      icon={icon}
      endContent={endContent}
      width={fullWidth ? "100%" : undefined}
      onClick={() => void onPress?.()}
    >
      {content}
    </AstryxButton>
  ),
  BrpIconButton: ({label, icon, variant = "ghost", size = "md", disabled, busy, ariaControls, expanded, type = "button", onPress, ref}) => (
    <AstryxIconButton ref={ref} label={label} icon={icon} variant={variant === "danger" ? "destructive" : variant} size={size} type={type} isDisabled={disabled} isLoading={busy} aria-controls={ariaControls} aria-expanded={expanded} onClick={() => void onPress?.()} />
  ),
  BrpTextInput: ({label, value, onValueChange, placeholder, type = "text", error, disabled, required, hideLabel, leadingIcon, clearable, size = "md", onKeyDown, ref}) => (
    <AstryxTextInput ref={ref} label={label} value={value} onChange={onValueChange} onKeyDown={onKeyDown} placeholder={placeholder} type={type === "search" ? "text" : type} status={error ? {type: "error", message: error} : undefined} isDisabled={disabled} isRequired={required} isLabelHidden={hideLabel} startIcon={leadingIcon} hasClear={clearable} size={size} width="100%" />
  ),
  BrpSelect: ({label, value, options, onValueChange, placeholder, disabled, required, hideLabel, searchable, size = "md"}) => (
    <AstryxSelector label={label} value={value} options={options.map((option) => ({value: option.value, label: option.label, disabled: option.disabled, icon: option.icon}))} onChange={onValueChange} placeholder={placeholder} isDisabled={disabled} isRequired={required} isLabelHidden={hideLabel} hasSearch={searchable} size={size} width="100%" />
  ),
  BrpSwitch: ({label, checked, onCheckedChange, description, disabled, busy, hideLabel, ref}) => (
    <AstryxSwitch ref={ref} label={label} value={checked} onChange={onCheckedChange} description={description} isDisabled={disabled} isLoading={busy} isLabelHidden={hideLabel} />
  ),
  BrpTabs: ({label, value, options, onValueChange, size = "md", fill, divider, ref}) => (
    <TabList ref={ref} value={value} onChange={onValueChange} size={size} layout={fill ? "fill" : "hug"} hasDivider={divider} aria-label={label}>
      {options.map((option) => (
        <Tab
          key={option.value}
          value={option.value}
          label={option.label}
          icon={option.icon}
          endContent={option.endContent}
          {...(option.disabled ? {
            "aria-disabled": true,
            tabIndex: -1,
            onClick: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
          } : {})}
        />
      ))}
    </TabList>
  ),
  BrpSegmentedControl: ({label, value, options, onValueChange, size = "md", fill, disabled, ref}) => (
    <SegmentedControl ref={ref} label={label} value={value} onChange={onValueChange} size={size} layout={fill ? "fill" : "hug"} isDisabled={disabled}>
      {options.map((option) => <SegmentedControlItem key={option.value} value={option.value} label={option.label} icon={option.icon} isDisabled={option.disabled} />)}
    </SegmentedControl>
  ),
  BrpToolbar: ({label, start, center, end, size = "md", orientation = "horizontal", divided, ref}) => (
    <AstryxToolbar ref={ref} label={label} startContent={start} centerContent={center} endContent={end} size={size} orientation={orientation} dividers={divided ? ["top", "bottom"] : undefined} />
  ),
  BrpCard: ({children, tone = "default", padding = "md"}) => <AstryxCard variant={cardVariants[tone]} padding={cardPadding[padding]}>{children}</AstryxCard>,
  BrpBadge: ({label, tone = "neutral", icon}) => <AstryxBadge label={label} variant={badgeVariants[tone]} icon={icon} />,
  BrpStatusDot: ({label, tone, pulsing, tooltip}) => <AstryxStatusDot label={label} variant={tone === "danger" ? "error" : tone} isPulsing={pulsing} tooltip={tooltip} />,
  BrpTable: ({label, columns, rows, density = "balanced", dividers = "rows", striped, hover, emptyState}) => {
    const data: AstryxFacadeTableRow[] = rows.map((row) => ({...row.cells, __brpInternalRowId: row.id}));
    return <AstryxTable aria-label={label} data={data} columns={toAstryxColumns({columns})} idKey="__brpInternalRowId" density={density} dividers={dividers} isStriped={striped} hasHover={hover} emptyState={emptyState} />;
  },
  BrpDialog: AstryxFacadeDialog,
  BrpAlertDialog: ({open, onOpenChange, title, description, cancelLabel = "Скасувати", actionLabel, actionTone = "danger", actionBusy, onAction}) => (
    <AstryxAlertDialog isOpen={open} onOpenChange={onOpenChange} title={title} description={description} cancelLabel={cancelLabel} actionLabel={actionLabel} actionVariant={actionTone === "danger" ? "destructive" : "primary"} isActionLoading={actionBusy} onAction={onAction} />
  ),
  BrpMoreMenu: ({label, items, icon, disabled, open, onOpenChange, ref}) => (
    <AstryxMoreMenu ref={ref} label={label} icon={icon} isDisabled={disabled} isMenuOpen={open} onOpenChange={onOpenChange} items={items.map((item) => ({label: item.label, icon: item.icon, isDisabled: item.disabled, onClick: item.onSelect}))} />
  ),
  BrpPopover: AstryxFacadePopover,
  BrpEmptyState: ({title, description, icon, actions, compact, headingLevel}) => <AstryxEmptyState title={title} description={description} icon={icon} actions={actions} isCompact={compact} headingLevel={headingLevel} />,
  BrpSkeleton: ({shape = "line", delayIndex}) => <AstryxSkeleton width={shape === "circle" ? 36 : "100%"} height={shape === "line" ? 12 : shape === "control" ? 32 : shape === "circle" ? 36 : 112} radius={shape === "circle" ? "rounded" : shape === "line" ? 1 : 3} index={delayIndex} />,
};
