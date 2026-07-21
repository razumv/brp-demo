"use client";

import {
  forwardRef,
  useId,
  useRef,
  type KeyboardEvent,
  type Ref,
} from "react";
import {useMergedRefs} from "@base-ui/utils/useMergedRefs";
import {AlertDialog} from "@base-ui/react/alert-dialog";
import {Combobox} from "@base-ui/react/combobox";
import {Dialog} from "@base-ui/react/dialog";
import {Menu} from "@base-ui/react/menu";
import {Popover} from "@base-ui/react/popover";
import {Check, ChevronDown, MoreHorizontal, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import type {
  BrpActionVariant,
  BrpAlertDialogProps,
  BrpButtonProps,
  BrpCardProps,
  BrpControlSize,
  BrpDialogProps,
  BrpIconButtonProps,
  BrpMoreMenuProps,
  BrpPopoverProps,
  BrpPopoverTriggerProps,
  BrpSegmentedControlProps,
  BrpSelectOption,
  BrpSelectProps,
  BrpSemanticTone,
  BrpSwitchProps,
  BrpTableColumn,
  BrpTableProps,
  BrpTabsProps,
  BrpTextInputProps,
  BrpToolbarProps,
  BrpUiAdapter,
} from "./contracts";

const actionVariants: Readonly<Record<BrpActionVariant, "default" | "outline" | "ghost" | "destructive">> = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
};

const buttonSizes: Readonly<Record<BrpControlSize, "sm" | "default" | "lg">> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

const controlSizeClasses: Readonly<Record<BrpControlSize, string>> = {
  sm: "h-7 text-xs",
  md: "h-8 text-sm",
  lg: "h-9 text-sm",
};

const choiceSizeClasses: Readonly<Record<BrpControlSize, string>> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-sm",
};

const toolbarGapClasses: Readonly<Record<BrpControlSize, string>> = {
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-3",
};

const cardClasses: Readonly<Record<NonNullable<BrpCardProps["tone"]>, string>> = {
  default: "border-border bg-card",
  muted: "border-border bg-muted/45",
  transparent: "border-transparent bg-transparent shadow-none",
  info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/35",
  success: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/35",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/35",
};

const cardPaddingClasses: Readonly<Record<NonNullable<BrpCardProps["padding"]>, string>> = {
  none: "p-0",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

const badgeClasses: Readonly<Record<BrpSemanticTone, string>> = {
  neutral: "border-border bg-muted text-foreground",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/45 dark:text-blue-300",
  success: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/45 dark:text-green-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/45 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/45 dark:text-red-300",
};

const statusClasses = {
  neutral: "bg-slate-400",
  accent: "bg-blue-500",
  success: "bg-green-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
} as const;

const skeletonClasses = {
  line: "h-3 w-full rounded",
  control: "h-8 w-full rounded-lg",
  card: "h-28 w-full rounded-xl",
  circle: "size-9 rounded-full",
} as const;

const skeletonDelayClasses = [
  "[animation-delay:0ms]",
  "[animation-delay:80ms]",
  "[animation-delay:160ms]",
  "[animation-delay:240ms]",
  "[animation-delay:320ms]",
  "[animation-delay:400ms]",
] as const;

const tableAlignClasses: Readonly<Record<NonNullable<BrpTableColumn["align"]>, string>> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

const tableWidthClasses: Readonly<Record<NonNullable<BrpTableColumn["width"]>, string>> = {
  compact: "w-24",
  normal: "w-auto",
  wide: "w-64",
};

const dialogWidthClasses: Readonly<Record<NonNullable<BrpDialogProps["width"]>, string>> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
  fullscreen: "h-[calc(100dvh-2rem)] max-w-none",
};

const popoverSides = {
  above: "top",
  below: "bottom",
  before: "left",
  after: "right",
} as const;

function dividerClasses(dividers: NonNullable<BrpTableProps["dividers"]>, isLastColumn: boolean) {
  const row = dividers === "rows" || dividers === "grid" ? "border-b border-border" : "";
  const column = !isLastColumn && (dividers === "columns" || dividers === "grid")
    ? "border-r border-border"
    : "";
  return `${row} ${column}`;
}

const CurrentButton = forwardRef<HTMLButtonElement, BrpButtonProps>(function CurrentButton({
  label,
  content,
  variant = "secondary",
  size = "md",
  disabled,
  busy,
  icon,
  endContent,
  fullWidth,
  onPress,
  type = "button",
}, ref) {
  return (
    <Button
      ref={ref}
      type={type}
      variant={actionVariants[variant]}
      size={buttonSizes[size]}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={fullWidth ? "w-full" : undefined}
      onClick={() => void onPress?.()}
    >
      {icon}
      {content ?? label}
      {endContent}
    </Button>
  );
});

const CurrentIconButton = forwardRef<HTMLButtonElement, BrpIconButtonProps>(function CurrentIconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  disabled,
  busy,
  onPress,
}, ref) {
  return (
    <Button
      ref={ref}
      type="button"
      variant={actionVariants[variant]}
      size={size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon"}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => void onPress?.()}
    >
      {icon}
    </Button>
  );
});

const CurrentTextInput = forwardRef<HTMLInputElement, BrpTextInputProps>(function CurrentTextInput({
  label,
  value,
  onValueChange,
  placeholder,
  type = "text",
  error,
  disabled,
  required,
  hideLabel,
  leadingIcon,
  clearable,
  size = "md",
}, ref) {
  const errorId = useId();
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className={hideLabel ? "sr-only" : "font-medium"}>{label}</span>
      <span className="relative flex items-center">
        {leadingIcon ? <span className="pointer-events-none absolute left-2 text-muted-foreground">{leadingIcon}</span> : null}
        <input
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          required={required}
          type={type}
          value={value}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-input bg-background px-3 ${leadingIcon ? "pl-8" : ""} ${clearable && value ? "pr-8" : ""} ${controlSizeClasses[size]}`}
          onChange={(event) => onValueChange(event.target.value)}
        />
        {clearable && value ? (
          <button
            type="button"
            aria-label={`Очистити ${label}`}
            className="absolute right-1 grid size-6 place-items-center disabled:pointer-events-none disabled:opacity-50"
            disabled={disabled}
            onClick={() => onValueChange("")}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </span>
      {error ? <span id={errorId} role="alert" className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
});

function CurrentSearchableSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  disabled,
  required,
  hideLabel,
  size = "md",
}: BrpSelectProps) {
  const inputId = useId();
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div className="grid min-w-0 gap-1 text-sm">
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "font-medium"}>{label}</label>
      <Combobox.Root<BrpSelectOption>
        items={[...options]}
        value={selected}
        isItemEqualToValue={(option, candidate) => option.value === candidate.value}
        onValueChange={(option) => {
          if (option) onValueChange(option.value);
        }}
      >
        <div className="relative flex items-center">
          <Combobox.Input
            id={inputId}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={`w-full rounded-lg border border-input bg-background px-3 pr-8 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${controlSizeClasses[size]}`}
          />
          <Combobox.Trigger
            disabled={disabled}
            aria-label={`Відкрити ${label}`}
            className="absolute right-1 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <ChevronDown size={14} aria-hidden="true" />
          </Combobox.Trigger>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="z-50 outline-none">
            <Combobox.Popup className="max-h-64 min-w-[var(--anchor-width)] overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
              <Combobox.Empty className="px-2 py-1.5 text-sm text-muted-foreground">Нічого не знайдено</Combobox.Empty>
              <Combobox.List>
                {options.map((option) => (
                  <Combobox.Item
                    key={option.value}
                    value={option}
                    disabled={option.disabled}
                    className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:opacity-50"
                  >
                    {option.icon}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <Combobox.ItemIndicator><Check size={14} aria-hidden="true" /></Combobox.ItemIndicator>
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

function CurrentSelect(props: BrpSelectProps) {
  if (props.searchable) return <CurrentSearchableSelect {...props} />;
  const {label, value, options, onValueChange, placeholder, disabled, required, hideLabel, size = "md"} = props;
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className={hideLabel ? "sr-only" : "font-medium"}>{label}</span>
      <select
        aria-label={hideLabel ? label : undefined}
        value={value}
        disabled={disabled}
        required={required}
        className={`w-full rounded-lg border border-input bg-background px-2 ${controlSizeClasses[size]}`}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
    </label>
  );
}

const CurrentSwitch = forwardRef<HTMLInputElement, BrpSwitchProps>(function CurrentSwitch({
  label,
  checked,
  onCheckedChange,
  description,
  disabled,
  busy,
  hideLabel,
}, ref) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className={hideLabel ? "sr-only" : "grid gap-0.5"}>
        <span className="font-medium">{label}</span>
        {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      </span>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        aria-label={hideLabel ? label : undefined}
        aria-busy={busy || undefined}
        checked={checked}
        disabled={disabled || busy}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </label>
  );
});

const CurrentTabs = forwardRef<HTMLElement, BrpTabsProps>(function CurrentTabs({
  label,
  value,
  options,
  onValueChange,
  size = "md",
  fill,
  divider,
}, ref) {
  const selectedEnabledOption = options.find((option) => option.value === value && !option.disabled);
  const tabbableValue = selectedEnabledOption?.value ?? options.find((option) => !option.disabled)?.value;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    if (tabs.length === 0) {
      return;
    }

    const activeIndex = Math.max(0, tabs.indexOf(document.activeElement as HTMLButtonElement));
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    let nextIndex: number | undefined;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (activeIndex + (isRtl ? -1 : 1) + tabs.length) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (activeIndex + (isRtl ? 1 : -1) + tabs.length) % tabs.length;
        break;
      case "ArrowDown":
        nextIndex = (activeIndex + 1) % tabs.length;
        break;
      case "ArrowUp":
        nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    tabs.forEach((tab, index) => {
      tab.tabIndex = index === nextIndex ? 0 : -1;
    });
    tabs[nextIndex].focus();
  };

  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      className={`flex items-center gap-1 ${fill ? "w-full" : "w-fit"} ${divider ? "border-b border-border" : ""}`}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          tabIndex={tabbableValue === option.value ? 0 : -1}
          disabled={option.disabled}
          className={`${fill ? "flex-1" : ""} rounded-md ${choiceSizeClasses[size]} aria-selected:bg-muted aria-selected:font-semibold`}
          onClick={() => onValueChange(option.value)}
        >
          {option.icon}{option.label}{option.endContent}
        </button>
      ))}
    </div>
  );
});

const CurrentSegmentedControl = forwardRef<HTMLDivElement, BrpSegmentedControlProps>(function CurrentSegmentedControl({
  label,
  value,
  options,
  onValueChange,
  size = "md",
  fill,
  disabled,
}, ref) {
  const groupName = useId();

  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={`flex rounded-lg border border-border bg-muted/40 p-0.5 ${fill ? "w-full" : "w-fit"}`}>
      {options.map((option) => (
        <label key={option.value} className={`relative rounded-md has-[:checked]:bg-background has-[:checked]:shadow-sm ${choiceSizeClasses[size]} ${fill ? "flex-1 text-center" : ""}`}>
          <input className="sr-only" type="radio" name={groupName} value={option.value} checked={value === option.value} disabled={disabled || option.disabled} onChange={() => onValueChange(option.value)} />
          <span className="inline-flex items-center justify-center gap-1">{option.icon}{option.label}</span>
        </label>
      ))}
    </div>
  );
});

const CurrentToolbar = forwardRef<HTMLDivElement, BrpToolbarProps>(function CurrentToolbar({
  label,
  start,
  center,
  end,
  size = "md",
  orientation = "horizontal",
  divided,
}, ref) {
  const gap = toolbarGapClasses[size];
  return (
    <div ref={ref} role="toolbar" aria-label={label} aria-orientation={orientation} className={`${orientation === "vertical" ? "flex-col items-stretch" : "items-center"} flex ${gap} ${divided ? "border-y border-border py-2" : ""}`}>
      <div className={`flex min-w-0 flex-1 items-center ${gap}`}>{start}</div>
      {center ? <div className={`flex items-center justify-center ${gap}`}>{center}</div> : null}
      <div className={`ml-auto flex items-center ${gap}`}>{end}</div>
    </div>
  );
});

const CurrentMoreMenu = forwardRef<HTMLButtonElement, BrpMoreMenuProps>(function CurrentMoreMenu({
  label,
  items,
  icon,
  disabled,
  open,
  onOpenChange,
}, ref) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mergedTriggerRef = useMergedRefs(ref, triggerRef);
  const restoreFocusAfterCloseRef = useRef(false);

  return (
    <Menu.Root
      open={open}
      disabled={disabled}
      onOpenChange={(nextOpen, details) => {
        if (nextOpen) {
          restoreFocusAfterCloseRef.current = false;
        } else if (details.reason === "escape-key") {
          restoreFocusAfterCloseRef.current = true;
        }
        onOpenChange?.(nextOpen);
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen && restoreFocusAfterCloseRef.current) {
          triggerRef.current?.focus();
        }
        restoreFocusAfterCloseRef.current = false;
      }}
    >
      <Menu.Trigger
        ref={mergedTriggerRef}
        disabled={disabled}
        render={<Button type="button" variant="ghost" size="icon" aria-label={label} />}
      >
        {icon ?? <MoreHorizontal aria-hidden="true" />}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50 outline-none">
          <Menu.Popup finalFocus={triggerRef} aria-label={label} className="min-w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            {items.map((item) => (
              <Menu.Item
                key={item.id}
                disabled={item.disabled}
                label={item.label}
                className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:opacity-50"
                onClick={item.onSelect}
              >
                {item.icon}
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
});

function CurrentPopover({
  label,
  renderTrigger,
  content,
  open,
  onOpenChange,
  disabled,
  placement = "below",
}: BrpPopoverProps) {
  return (
    <Popover.Root modal="trap-focus" open={open} onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}>
      <Popover.Trigger
        disabled={disabled}
        render={(props) => renderTrigger(props as BrpPopoverTriggerProps)}
      />
      <Popover.Portal>
        <Popover.Positioner side={popoverSides[placement]} align="start" sideOffset={4} className="z-50 outline-none">
          <Popover.Popup aria-label={label} initialFocus finalFocus className="min-w-52 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md outline-none">
            {content}
            <Popover.Close className="sr-only">Закрити {label}</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CurrentDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  purpose = "info",
  width = "md",
}: BrpDialogProps) {
  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal={purpose !== "info"}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen && purpose === "required" && details.reason !== "imperative-action") return;
        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <Dialog.Popup role={purpose === "required" ? "alertdialog" : "dialog"} initialFocus finalFocus className={`max-h-[75vh] w-full overflow-auto rounded-xl border border-border bg-background shadow-xl outline-none ${dialogWidthClasses[width]}`}>
            <header className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <Dialog.Title className="font-semibold">{title}</Dialog.Title>
                {description ? <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description> : null}
              </div>
              {purpose !== "required" ? (
                <Dialog.Close render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Закрити" />}>
                  <X aria-hidden="true" />
                </Dialog.Close>
              ) : null}
            </header>
            <div className="p-4">{children}</div>
            {footer ? <footer className="border-t border-border p-4">{footer}</footer> : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CurrentAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Скасувати",
  actionLabel,
  actionTone = "danger",
  actionBusy,
  onAction,
}: BrpAlertDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <AlertDialog.Popup initialFocus finalFocus className="w-full max-w-sm rounded-xl border border-border bg-background p-4 shadow-xl outline-none">
            <AlertDialog.Title className="font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">{description}</AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Close render={<Button type="button" variant="ghost" />}>{cancelLabel}</AlertDialog.Close>
              <Button
                type="button"
                variant={actionTone === "danger" ? "destructive" : "default"}
                disabled={actionBusy}
                aria-busy={actionBusy || undefined}
                onClick={() => void onAction()}
              >
                {actionLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export const currentAdapter: BrpUiAdapter = {
  BrpButton: CurrentButton,
  BrpIconButton: CurrentIconButton,
  BrpTextInput: CurrentTextInput,
  BrpSelect: CurrentSelect,
  BrpSwitch: CurrentSwitch,
  BrpTabs: CurrentTabs,
  BrpSegmentedControl: CurrentSegmentedControl,
  BrpToolbar: CurrentToolbar,
  BrpCard: ({children, tone = "default", padding = "md"}) => (
    <div className={`rounded-xl border shadow-sm ${cardClasses[tone]} ${cardPaddingClasses[padding]}`}>{children}</div>
  ),
  BrpBadge: ({label, tone = "neutral", icon}) => (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClasses[tone]}`}>{icon}{label}</span>
  ),
  BrpStatusDot: ({label, tone, pulsing, tooltip}) => (
    <span role="img" aria-label={label} title={tooltip} className={`inline-block size-2 rounded-full ${statusClasses[tone]} ${pulsing ? "animate-pulse" : ""}`} />
  ),
  BrpTable: ({label, columns, rows, density = "balanced", dividers = "rows", striped, hover, emptyState}) => (
    <div className="overflow-x-auto">
      <table aria-label={label} className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((column, columnIndex) => (
              <th
                key={column.key}
                scope="col"
                className={`bg-muted/50 px-3 py-2 ${tableAlignClasses[column.align ?? "start"]} ${tableWidthClasses[column.width ?? "normal"]} ${dividerClasses(dividers, columnIndex === columns.length - 1)}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={row.id} className={`${striped && index % 2 ? "bg-muted/30" : ""} ${hover ? "hover:bg-muted/50" : ""}`}>
              {columns.map((column, columnIndex) => (
                <td
                  key={column.key}
                  className={`${dividerClasses(dividers, columnIndex === columns.length - 1)} ${tableAlignClasses[column.align ?? "start"]} ${density === "compact" ? "px-2 py-1" : density === "spacious" ? "px-4 py-3" : "px-3 py-2"}`}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr><td colSpan={columns.length} className="text-center">{emptyState}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  ),
  BrpDialog: CurrentDialog,
  BrpAlertDialog: CurrentAlertDialog,
  BrpMoreMenu: CurrentMoreMenu,
  BrpPopover: CurrentPopover,
  BrpEmptyState: ({title, description, icon, actions, compact, headingLevel = 3}) => {
    const Heading = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return <div role="status" className={`grid place-items-center text-center ${compact ? "gap-1 p-3" : "gap-2 p-8"}`}>{icon}<Heading className="font-semibold">{title}</Heading>{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}{actions}</div>;
  },
  BrpSkeleton: ({shape = "line", delayIndex = 0}) => (
    <span aria-hidden="true" className={`block animate-pulse bg-muted ${skeletonClasses[shape]} ${skeletonDelayClasses[Math.abs(delayIndex) % skeletonDelayClasses.length]}`} />
  ),
};
