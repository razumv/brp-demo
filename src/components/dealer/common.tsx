import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/shared/ui";
import styles from "./dealer.module.css";

export const orderStatusMeta: Record<OrderStatus, {
  label: string;
  tone: "neutral" | "green" | "blue" | "amber" | "red" | "orange" | "purple";
}> = {
  new: { label: "Новий", tone: "neutral" },
  waiting: { label: "Очікування", tone: "amber" },
  supplier: { label: "У постачальника", tone: "purple" },
  ready: { label: "Готово", tone: "green" },
  sent: { label: "Відправлено", tone: "blue" },
  done: { label: "Виконано", tone: "green" },
  cancelled: { label: "Скасовано", tone: "red" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = orderStatusMeta[status];
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function Initials({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return <span className={large ? styles.avatarLarge : styles.avatar}>{initials || "—"}</span>;
}

export function SectionHeading({
  title,
  helper,
  action,
}: {
  title: string;
  helper?: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.sectionHeading}>
      <div>
        <h2>{title}</h2>
        {helper ? <p>{helper}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Metric({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

export function InlineArrow() {
  return <ChevronRight size={16} aria-hidden="true" />;
}
