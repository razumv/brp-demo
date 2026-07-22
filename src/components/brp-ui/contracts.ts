import type {
  ComponentType,
  HTMLAttributes,
  KeyboardEventHandler,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";

export type BrpControlSize = "sm" | "md" | "lg";
export type BrpActionVariant = "primary" | "secondary" | "ghost" | "danger";
export type BrpSemanticTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface BrpButtonProps {
  label: string;
  content?: ReactNode;
  variant?: BrpActionVariant;
  size?: BrpControlSize;
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
  endContent?: ReactNode;
  fullWidth?: boolean;
  onPress?: () => void | Promise<void>;
  type?: "button" | "submit" | "reset";
  ariaDescribedBy?: string;
}

export interface BrpIconButtonProps {
  label: string;
  icon: ReactNode;
  variant?: BrpActionVariant;
  size?: BrpControlSize;
  disabled?: boolean;
  busy?: boolean;
  ariaControls?: string;
  expanded?: boolean;
  type?: "button" | "submit" | "reset";
  onPress?: () => void | Promise<void>;
}

export interface BrpTextInputProps {
  label: string;
  value: string;
  onValueChange(value: string): void;
  placeholder?: string;
  type?: "text" | "search" | "password" | "email";
  error?: string;
  disabled?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  leadingIcon?: ReactNode;
  clearable?: boolean;
  size?: BrpControlSize;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  ariaDescribedBy?: string;
}

export interface BrpSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface BrpSelectProps {
  label: string;
  value: string;
  options: readonly BrpSelectOption[];
  onValueChange(value: string): void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  searchable?: boolean;
  size?: BrpControlSize;
}

export interface BrpSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange(checked: boolean): void;
  description?: string;
  disabled?: boolean;
  busy?: boolean;
  hideLabel?: boolean;
  ariaDescribedBy?: string;
}

export interface BrpChoiceOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  endContent?: ReactNode;
}

export interface BrpTabsProps {
  label: string;
  value: string;
  options: readonly BrpChoiceOption[];
  onValueChange(value: string): void;
  size?: BrpControlSize;
  fill?: boolean;
  divider?: boolean;
}

export interface BrpSegmentedControlProps {
  label: string;
  value: string;
  options: readonly BrpChoiceOption[];
  onValueChange(value: string): void;
  size?: BrpControlSize;
  fill?: boolean;
  disabled?: boolean;
}

export interface BrpToolbarProps {
  label: string;
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  size?: BrpControlSize;
  orientation?: "horizontal" | "vertical";
  divided?: boolean;
}

export interface BrpCardProps {
  children: ReactNode;
  tone?: "default" | "muted" | "transparent" | "info" | "success" | "warning";
  padding?: "none" | "sm" | "md" | "lg";
}

export interface BrpBadgeProps {
  label: ReactNode;
  tone?: BrpSemanticTone;
  icon?: ReactNode;
}

export interface BrpStatusDotProps {
  label: string;
  tone: "neutral" | "accent" | "success" | "warning" | "danger";
  pulsing?: boolean;
  tooltip?: string;
}

export interface BrpTableColumn {
  key: string;
  label: ReactNode;
  align?: "start" | "center" | "end";
  width?: "compact" | "normal" | "wide";
}

export interface BrpTableRow {
  id: string | number;
  cells: Readonly<Record<string, ReactNode>>;
}

export interface BrpTableProps {
  label: string;
  columns: readonly BrpTableColumn[];
  rows: readonly BrpTableRow[];
  density?: "compact" | "balanced" | "spacious";
  dividers?: "rows" | "columns" | "grid" | "none";
  striped?: boolean;
  hover?: boolean;
  emptyState?: ReactNode;
}

export interface BrpDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  purpose?: "required" | "form" | "info";
  width?: "sm" | "md" | "lg" | "fullscreen";
}

export interface BrpAlertDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description: string;
  cancelLabel?: string;
  actionLabel: string;
  actionTone?: "primary" | "danger";
  actionBusy?: boolean;
  onAction(): void | Promise<void>;
}

export interface BrpMoreMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onSelect(): void;
}

export interface BrpMoreMenuProps {
  label: string;
  items: readonly BrpMoreMenuItem[];
  icon?: ReactNode;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?(open: boolean): void;
}

export interface BrpPopoverProps {
  label: string;
  renderTrigger(props: BrpPopoverTriggerProps): ReactElement;
  content: ReactNode;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  disabled?: boolean;
  placement?: "above" | "below" | "before" | "after";
}

export type BrpPopoverTriggerProps = Pick<
  HTMLAttributes<HTMLElement>,
  "onClick" | "onKeyDown" | "aria-controls" | "aria-expanded" | "aria-haspopup"
> & RefAttributes<HTMLElement>;

export interface BrpEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface BrpSkeletonProps {
  shape?: "line" | "control" | "card" | "circle";
  delayIndex?: number;
}

type BrpRefComponent<Props, Element extends HTMLElement> = ComponentType<
  Props & RefAttributes<Element>
>;

export interface BrpUiAdapter {
  BrpButton: BrpRefComponent<BrpButtonProps, HTMLButtonElement>;
  BrpIconButton: BrpRefComponent<BrpIconButtonProps, HTMLButtonElement>;
  BrpTextInput: BrpRefComponent<BrpTextInputProps, HTMLInputElement>;
  BrpSelect: ComponentType<BrpSelectProps>;
  BrpSwitch: BrpRefComponent<BrpSwitchProps, HTMLInputElement>;
  BrpTabs: BrpRefComponent<BrpTabsProps, HTMLElement>;
  BrpSegmentedControl: BrpRefComponent<BrpSegmentedControlProps, HTMLDivElement>;
  BrpToolbar: BrpRefComponent<BrpToolbarProps, HTMLDivElement>;
  BrpCard: ComponentType<BrpCardProps>;
  BrpBadge: ComponentType<BrpBadgeProps>;
  BrpStatusDot: ComponentType<BrpStatusDotProps>;
  BrpTable: ComponentType<BrpTableProps>;
  BrpDialog: ComponentType<BrpDialogProps>;
  BrpAlertDialog: ComponentType<BrpAlertDialogProps>;
  BrpMoreMenu: BrpRefComponent<BrpMoreMenuProps, HTMLButtonElement>;
  BrpPopover: ComponentType<BrpPopoverProps>;
  BrpEmptyState: ComponentType<BrpEmptyStateProps>;
  BrpSkeleton: ComponentType<BrpSkeletonProps>;
}
