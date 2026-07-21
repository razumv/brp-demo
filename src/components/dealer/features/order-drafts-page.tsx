"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileClock,
  FileSpreadsheet,
  FolderOpen,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { LockedOperation } from "@/components/dealer/locked-operation";
import { formatDateTime } from "@/components/dealer/common";
import { EmptyState, Modal, Panel } from "@/components/shared/ui";
import type { DealerSnapshot } from "@/lib/dealer/contracts";
import { FeatureFrame } from "./feature-frame";
import styles from "./order-drafts-page.module.css";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function commandError(
  result: { readonly kind: string; readonly issues?: readonly { readonly message: string }[] },
  fallback: string,
) {
  return result.kind === "validation-error"
    ? result.issues?.[0]?.message ?? fallback
    : fallback;
}

export function OrderDraftsPage() {
  const router = useRouter();
  const { snapshot, commands } = useDealerWorkflow();
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DealerSnapshot["drafts"][number] | null>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return snapshot.drafts.filter((draft) => {
      const customer = snapshot.customers.find((item) => item.id === draft.customerId);
      const haystack = [
        draft.title,
        draft.po,
        customer?.name ?? "",
        ...draft.lines.map((line) => line.partNumber),
      ].join(" ").toLocaleLowerCase("uk-UA");
      return !needle || haystack.includes(needle);
    });
  }, [query, snapshot.customers, snapshot.drafts]);

  const startDraft = async () => {
    const result = await commands.startOrderDraft();
    if (result.ok) {
      setFeedback("");
      router.push("/cart");
    } else {
      setFeedback(commandError(result, "Не вдалося створити чернетку."));
    }
  };

  const openDraft = async (draftId: string) => {
    const result = await commands.openOrderDraft({ draftId });
    if (result.ok) {
      setFeedback("");
      router.push("/cart");
    } else {
      setFeedback(commandError(result, "Не вдалося відкрити чернетку."));
    }
  };

  const removeDraft = async () => {
    if (!pendingDelete) return;
    const result = await commands.deleteOrderDraft({ draftId: pendingDelete.id });
    if (result.ok) {
      setFeedback(`Чернетку «${pendingDelete.title}» видалено.`);
      setPendingDelete(null);
    } else {
      setFeedback("Не вдалося видалити чернетку.");
    }
  };

  return (
    <FeatureFrame
      feature="order-drafts"
      action={<button type="button" className="button button-primary" onClick={() => void startDraft()}><Plus size={15} /> Нова чернетка</button>}
    >
      <Panel>
        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <Search size={15} aria-hidden="true" />
            <input aria-label="Пошук чернеток" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Назва, клієнт, PO або запчастина..." />
          </label>
          <LockedOperation label="Excel" icon={<FileSpreadsheet size={14} />} reason="Імпорт і експорт файлів недоступні." />
        </div>
        <p className={styles.resultCount}>Показано {filtered.length} з {snapshot.drafts.length}</p>
        {feedback ? <p className={styles.feedback} role="status">{feedback}</p> : null}

        {filtered.length ? (
          <div className={styles.draftList}>
            {filtered.map((draft) => {
              const customer = snapshot.customers.find((item) => item.id === draft.customerId);
              const units = draft.lines.reduce((total, line) => total + line.quantity, 0);
              return (
                <article className={styles.draftCard} key={draft.id}>
                  <span className={styles.draftIcon}><FileClock size={20} /></span>
                  <div className={styles.draftBody}>
                    <strong>{draft.title}</strong>
                    <p>{customer?.name || "Клієнта не обрано"}{draft.po ? ` · ${draft.po}` : ""}</p>
                    <small>Оновлено {formatDateTime(draft.updatedAt)}</small>
                  </div>
                  <div className={styles.draftCount}><ShoppingCart size={14} /><strong>{draft.lines.length}</strong><small>{units} од.</small></div>
                  <div className={styles.draftActions}>
                    <button type="button" className="button button-outline" onClick={() => void openDraft(draft.id)}><FolderOpen size={14} /> Відкрити</button>
                    <button type="button" className={styles.deleteButton} aria-label={`Видалити чернетку ${draft.title}`} onClick={() => setPendingDelete(draft)}><Trash2 size={15} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileClock size={26} />}
            title={snapshot.drafts.length ? "Чернеток не знайдено" : "Чернеток поки немає"}
            description={snapshot.drafts.length ? "Змініть пошуковий запит." : "Збережіть незавершене замовлення, щоб продовжити пізніше."}
            action={<button type="button" className="button button-outline" onClick={() => void startDraft()}>Створити чернетку</button>}
          />
        )}
      </Panel>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Видалити чернетку?"
        description={pendingDelete ? `«${pendingDelete.title}» буде видалено.` : undefined}
        footer={<><button type="button" className="button button-outline" onClick={() => setPendingDelete(null)}>Скасувати</button><button type="button" className="button button-primary" onClick={() => void removeDraft()}><Trash2 size={14} /> Видалити</button></>}
      >
        <p>Цю дію неможливо скасувати.</p>
      </Modal>
    </FeatureFrame>
  );
}
