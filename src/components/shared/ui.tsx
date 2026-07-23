"use client";

import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle, Inbox, LockKeyhole, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  icon,
  title,
  description,
  action,
  admin = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  admin?: boolean;
}) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {icon ? <span className="page-header-icon">{icon}</span> : null}
          <h1 className={cn("page-title", admin && "page-title-admin")}>{title}</h1>
        </div>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  as: Component = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <Component className={cn("panel", className)}>{children}</Component>;
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "orange" | "green" | "blue" | "amber";
}) {
  return (
    <Panel className="stat-card">
      <div className={cn("stat-icon", "stat-icon-" + tone)}>{icon}</div>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        <div className={cn("stat-value", tone === "orange" && "text-orange-600")}>{value}</div>
        {helper ? <div className="stat-helper">{helper}</div> : null}
      </div>
    </Panel>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red" | "orange" | "purple";
}) {
  return <span className={cn("status-badge", "status-" + tone)}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("empty-state", compact && "empty-state-compact")}>
      <div className="empty-state-icon">{icon || <Inbox size={26} />}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
  headerMeta,
  headerActions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      window.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section
        ref={dialogRef}
        className={cn("modal modal-surface-frame", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="modal-header modal-surface-header">
          <div className="modal-header-heading">
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          {headerMeta ? <div className="modal-header-meta">{headerMeta}</div> : null}
          <div className="modal-header-actions">
            {headerActions}
            <button ref={closeRef} type="button" className="icon-button modal-surface-close" aria-label="Закрити" onClick={onClose}><X size={18} /></button>
          </div>
        </header>
        <div className={cn("modal-body modal-surface-body", bodyClassName)}>{children}</div>
        {footer ? <footer className="modal-footer modal-surface-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

export function ReadOnlyButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type="button"
      disabled
      title="Демо: лише перегляд"
      className={cn("button button-outline button-readonly", className)}
    >
      <LockKeyhole size={14} />
      {children}
    </button>
  );
}

export function InlineNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
}) {
  return (
    <div className={cn("inline-notice", "notice-" + tone)}>
      <AlertCircle size={16} />
      <span>{children}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton", className)} aria-hidden="true" />;
}
