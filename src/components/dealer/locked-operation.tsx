"use client";

import { useId, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import styles from "./locked-operation.module.css";

type LockedOperationProps = {
  label: string;
  reason: string;
  icon?: ReactNode;
  className?: string;
};

export function LockedOperation({
  label,
  reason,
  icon,
  className = "button button-outline",
}: LockedOperationProps) {
  const reasonId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={styles.root}>
      <button
        type="button"
        className={className}
        disabled
        aria-describedby={reasonId}
      >
        {icon}
        {label}
      </button>
      <button
        type="button"
        className={styles.reasonButton}
        aria-label={`Чому недоступно: ${label}`}
        aria-controls={reasonId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Info size={15} aria-hidden="true" />
      </button>
      <span
        id={reasonId}
        className={open ? styles.reasonOpen : styles.reasonClosed}
        role="note"
      >
        {reason}
      </span>
    </span>
  );
}
