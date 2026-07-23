import {useId, type ReactNode} from "react";
import {cn} from "@/lib/utils";

export type DialogSectionTone =
  | "default"
  | "muted"
  | "info"
  | "warning"
  | "danger";

export function DialogSection({
  title,
  description,
  action,
  tone = "default",
  inset = false,
  children,
  className,
  sectionKey,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: DialogSectionTone;
  inset?: boolean;
  children: ReactNode;
  className?: string;
  sectionKey?: string;
}) {
  const titleId = useId();

  return (
    <section
      className={cn(
        "dialog-section",
        `dialog-section-${tone}`,
        inset && "dialog-section-inset",
        className,
      )}
      data-dialog-section={sectionKey}
      aria-labelledby={titleId}
    >
      <header className="dialog-section-header">
        <div className="dialog-section-heading">
          <h3 id={titleId}>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="dialog-section-action">{action}</div> : null}
      </header>
      <div className="dialog-section-content">{children}</div>
    </section>
  );
}

export function DialogSectionRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("dialog-section-row", className)}>{children}</div>;
}
