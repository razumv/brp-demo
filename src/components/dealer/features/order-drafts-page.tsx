"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileClock,
  FolderOpen,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { DealerDataToolbar } from "@/components/dealer/dealer-data-toolbar";
import { BrpButton, BrpSelect } from "@/components/brp-ui";
import { formatDateTime } from "@/components/dealer/common";
import { EmptyState, Modal, Panel } from "@/components/shared/ui";
import type { DealerSnapshot } from "@/lib/dealer/contracts";
import { normalizeDealerSearch } from "@/lib/dealer/format";
import { FeatureFrame } from "./feature-frame";
import styles from "./order-drafts-page.module.css";

export type DraftContentFilter = "all" | "with-items" | "empty";
export type DraftBuyerFilter = "all" | "assigned" | "unassigned";

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
  const [content, setContent] = useState<DraftContentFilter>("all");
  const [buyer, setBuyer] = useState<DraftBuyerFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DealerSnapshot["drafts"][number] | null>(null);
  const customerById = useMemo(
    () => new Map(snapshot.customers.map((customer) => [customer.id, customer])),
    [snapshot.customers],
  );

  const filtered = useMemo(() => {
    const needle = normalizeDealerSearch(query);
    return snapshot.drafts.filter((draft) => {
      const contentMatches = content === "all"
        || (content === "with-items" ? draft.lines.length > 0 : draft.lines.length === 0);
      const buyerMatches = buyer === "all"
        || (buyer === "assigned" ? Boolean(draft.customerId) : !draft.customerId);
      const customer = customerById.get(draft.customerId);
      const haystack = [
        draft.title,
        draft.po,
        customer?.name ?? "",
        ...draft.lines.map((line) => line.partNumber),
      ].join(" ").toLocaleLowerCase("uk-UA");
      return contentMatches && buyerMatches && (!needle || haystack.includes(needle));
    });
  }, [buyer, content, customerById, query, snapshot.drafts]);

  const activeFilterCount = Number(content !== "all") + Number(buyer !== "all");
  const resetFilters = () => {
    setContent("all");
    setBuyer("all");
  };

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
      action={<BrpButton label="Нова чернетка" icon={<Plus size={15} />} onPress={startDraft} />}
    >
      <Panel>
        <DealerDataToolbar
          search={{ value: query, onValueChange: setQuery, label: "Пошук чернеток", placeholder: "Назва, клієнт, PO або запчастина..." }}
          filters={{
            label: "Фільтри",
            activeCount: activeFilterCount,
            open: filtersOpen,
            onOpenChange: setFiltersOpen,
            panelId: "draft-filters",
            onClear: resetFilters,
            content: <><BrpSelect label="Вміст чернетки" value={content} onValueChange={(value) => setContent(value as DraftContentFilter)} options={[{ value: "all", label: "Усі" }, { value: "with-items", label: "З позиціями" }, { value: "empty", label: "Порожні" }]} /><BrpSelect label="Покупець чернетки" value={buyer} onValueChange={(value) => setBuyer(value as DraftBuyerFilter)} options={[{ value: "all", label: "Усі" }, { value: "assigned", label: "Призначений" }, { value: "unassigned", label: "Не призначений" }]} /></>,
          }}
        />
        {feedback ? <p className={styles.feedback} role="status">{feedback}</p> : null}

        {filtered.length ? (
          <div className={styles.draftList}>
            {filtered.map((draft) => {
              const customer = customerById.get(draft.customerId);
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
            description={snapshot.drafts.length ? "Змініть пошуковий запит або фільтри." : "Збережіть незавершене замовлення, щоб продовжити пізніше."}
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
