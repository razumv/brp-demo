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
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { LockedOperation } from "@/components/dealer/locked-operation";
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
  const filterPanelId = "draft-filters";

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
      action={<button type="button" className="button button-primary" onClick={() => void startDraft()}><Plus size={15} /> Нова чернетка</button>}
    >
      <Panel>
        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <Search size={15} aria-hidden="true" />
            <input aria-label="Пошук чернеток" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Назва, клієнт, PO або запчастина..." />
          </label>
          <button
            type="button"
            className={styles.filterTrigger}
            aria-label="Фільтри чернеток"
            aria-controls={filterPanelId}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span className={styles.filterTriggerLabel}>Фільтри чернеток</span>
            {activeFilterCount ? <span className={styles.filterCount}>{activeFilterCount}</span> : null}
          </button>
          <LockedOperation label="Excel" icon={<FileSpreadsheet size={14} />} reason="Імпорт і експорт файлів недоступні." />
        </div>
        <div id={filterPanelId} className={styles.filterPanel} hidden={!filtersOpen}>
          <label>
            Вміст чернетки
            <select value={content} onChange={(event) => setContent(event.target.value as DraftContentFilter)}>
              <option value="all">Усі</option>
              <option value="with-items">З позиціями</option>
              <option value="empty">Порожні</option>
            </select>
          </label>
          <label>
            Покупець чернетки
            <select value={buyer} onChange={(event) => setBuyer(event.target.value as DraftBuyerFilter)}>
              <option value="all">Усі</option>
              <option value="assigned">Призначений</option>
              <option value="unassigned">Не призначений</option>
            </select>
          </label>
          <button type="button" className="button button-outline" onClick={resetFilters} disabled={!activeFilterCount}>Скинути фільтри</button>
        </div>
        <p className={styles.resultCount}>Показано {filtered.length} з {snapshot.drafts.length}</p>
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
