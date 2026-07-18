"use client";

import { useMemo, useState } from "react";
import {
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Modal, Panel } from "@/components/shared/ui";
import {
  adminReturnStatusFilters,
  representativeEligibleReturnLines,
  returnConditions,
  returnDealers,
  sourceAdminReturns,
  type AdminReturnStatusFilter,
  type EligibleReturnLine,
  type ReturnCondition,
  type ReturnDealerId,
} from "@/lib/admin-returns-data";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function matchesLine(line: EligibleReturnLine, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return normalize(`${line.orderNumber} ${line.partNumber} ${line.description}`).includes(normalizedQuery);
}

type ReturnPreviewState = {
  selectedLineIds: readonly string[];
  quantities: Readonly<Record<string, number>>;
  conditions: Readonly<Record<string, ReturnCondition>>;
};

const emptyPreviewState: ReturnPreviewState = {
  selectedLineIds: [],
  quantities: {},
  conditions: {},
};

function CreateReturnDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dealerId, setDealerId] = useState<ReturnDealerId | "">("");
  const [note, setNote] = useState("");
  const [lineQuery, setLineQuery] = useState("");
  const [preview, setPreview] = useState<ReturnPreviewState>(emptyPreviewState);

  const dealer = returnDealers.find((item) => item.id === dealerId) ?? null;
  const dealerLines = useMemo(
    () => representativeEligibleReturnLines.filter((line) => line.dealerId === dealerId),
    [dealerId],
  );
  const visibleLines = useMemo(
    () => dealerLines.filter((line) => matchesLine(line, lineQuery)),
    [dealerLines, lineQuery],
  );
  const selectedUnitCount = preview.selectedLineIds.reduce(
    (total, lineId) => total + (preview.quantities[lineId] ?? 0),
    0,
  );

  const resetPreview = () => {
    setDealerId("");
    setNote("");
    setLineQuery("");
    setPreview(emptyPreviewState);
  };

  const closeDialog = () => {
    resetPreview();
    onClose();
  };

  const selectDealer = (nextDealerId: ReturnDealerId | "") => {
    setDealerId(nextDealerId);
    setLineQuery("");
    setPreview(emptyPreviewState);
  };

  const toggleLine = (line: EligibleReturnLine) => {
    const selected = preview.selectedLineIds.includes(line.id);
    if (selected) {
      const quantities = Object.fromEntries(
        Object.entries(preview.quantities).filter(([lineId]) => lineId !== line.id),
      );
      const conditions = Object.fromEntries(
        Object.entries(preview.conditions).filter(([lineId]) => lineId !== line.id),
      );
      setPreview({
        selectedLineIds: preview.selectedLineIds.filter((lineId) => lineId !== line.id),
        quantities,
        conditions,
      });
      return;
    }

    setPreview({
      selectedLineIds: [...preview.selectedLineIds, line.id],
      quantities: { ...preview.quantities, [line.id]: line.availableQuantity },
      conditions: { ...preview.conditions, [line.id]: "unused" },
    });
  };

  const updateQuantity = (line: EligibleReturnLine, rawValue: string) => {
    const numericValue = Number.parseInt(rawValue, 10);
    const quantity = Number.isNaN(numericValue)
      ? 1
      : Math.min(line.availableQuantity, Math.max(1, numericValue));
    setPreview((current) => ({
      ...current,
      quantities: { ...current.quantities, [line.id]: quantity },
    }));
  };

  const updateCondition = (lineId: string, condition: ReturnCondition) => {
    setPreview((current) => ({
      ...current,
      conditions: { ...current.conditions, [lineId]: condition },
    }));
  };

  return (
    <Modal
      open={open}
      onClose={closeDialog}
      title="Оформити повернення від дилера"
      description="Оберіть дилера, відмітьте позиції до повернення, вкажіть стан та кількість."
      className="!w-[min(1120px,100%)]"
      footer={(
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-[12px] font-medium tabular-nums text-[var(--muted-foreground)]" aria-live="polite">
            {preview.selectedLineIds.length} позицій · {selectedUnitCount} шт
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" className="button button-outline" onClick={closeDialog}>
              Скасувати
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled
              aria-disabled="true"
              title="Створення чернетки заблоковано у read-only демонстрації"
            >
              <LockKeyhole size={14} />
              Створити чернетку
            </button>
          </div>
        </div>
      )}
    >
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(320px,1.2fr)]">
          <label className="field">
            <span>Дилер</span>
            <select
              value={dealerId}
              onChange={(event) => selectDealer(event.target.value as ReturnDealerId | "")}
              autoComplete="off"
            >
              <option value="">— оберіть дилера —</option>
              {returnDealers.map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Примітка (опційно)</span>
            <textarea
              className="!min-h-20"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Що менеджеру варто знати про це повернення."
              autoComplete="off"
            />
          </label>
        </div>

        {dealer ? (
          <section aria-labelledby="return-lines-title" className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 id="return-lines-title" className="m-0 text-[14px] font-semibold">Позиції до повернення</h3>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  {dealer.eligibleLineCount} доступно · {dealer.name} ({dealer.code})
                </p>
              </div>
              {dealer.eligibleLineCount > 0 ? (
                <label className="input-with-icon w-full sm:max-w-[360px]">
                  <span className="sr-only">Пошук позицій до повернення</span>
                  <Search size={15} />
                  <input
                    className="input h-9 pr-9"
                    value={lineQuery}
                    onChange={(event) => setLineQuery(event.target.value)}
                    placeholder="Пошук за замовленням, артикулом або описом..."
                    autoComplete="off"
                  />
                  {lineQuery ? (
                    <button
                      type="button"
                      className="input-trailing"
                      aria-label="Очистити пошук позицій"
                      onClick={() => setLineQuery("")}
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </label>
              ) : null}
            </div>

            {dealer.eligibleLineCount === 0 ? (
              <Panel className="grid min-h-32 place-items-center px-5 py-8 text-center shadow-none">
                <p className="m-0 text-[13px] text-[var(--muted-foreground)]">
                  Немає складських позицій, доступних для повернення цим дилером.
                </p>
              </Panel>
            ) : dealerLines.length === 0 ? (
              <Panel className="grid min-h-32 place-items-center px-5 py-8 text-center shadow-none">
                <div>
                  <p className="m-0 text-[13px] font-medium">У джерелі підтверджено {dealer.eligibleLineCount} доступних позицій.</p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    Детальний склад рядків для цього дилера не був зафіксований.
                  </p>
                </div>
              </Panel>
            ) : (
              <Panel className="overflow-hidden shadow-none">
                <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5 text-[11px] text-[var(--muted-foreground)]">
                  Показано {dealerLines.length} доказово зафіксованих позицій із {dealer.eligibleLineCount}.
                </div>
                <div
                  className="max-w-full overflow-x-auto overscroll-contain"
                  role="region"
                  aria-label="Доступні позиції дилера"
                  tabIndex={0}
                >
                  <table className="data-table min-w-[940px]">
                    <caption className="sr-only">Позиції, доступні для повернення дилером</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="w-12"><span className="sr-only">Обрати</span></th>
                        <th scope="col">Замовлення</th>
                        <th scope="col">Запчастина</th>
                        <th scope="col" className="text-center">Доступ.</th>
                        <th scope="col" className="text-right">Ціна ($)</th>
                        <th scope="col" className="w-24">К-сть</th>
                        <th scope="col" className="w-44">Стан</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLines.map((line) => {
                        const selected = preview.selectedLineIds.includes(line.id);
                        return (
                          <tr key={line.id} className={selected ? "bg-[var(--orange-soft)]" : undefined}>
                            <td>
                              <label className="grid min-h-8 min-w-8 cursor-pointer place-items-center">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleLine(line)}
                                  aria-label={`Обрати ${line.orderNumber}, ${line.partNumber}`}
                                  className="size-4 accent-[var(--orange)]"
                                />
                              </label>
                            </td>
                            <td className="font-mono text-[11px] font-semibold">{line.orderNumber}</td>
                            <td>
                              <strong className="block font-mono text-[11px]">{line.partNumber}</strong>
                              <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">{line.description}</span>
                            </td>
                            <td className="text-center font-semibold tabular-nums">{line.availableQuantity}</td>
                            <td className="text-right tabular-nums">{formatUsd(line.unitPriceUsd)}</td>
                            <td>
                              {selected ? (
                                <input
                                  className="input !min-h-8 !py-1 text-center tabular-nums"
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  max={line.availableQuantity}
                                  value={preview.quantities[line.id] ?? line.availableQuantity}
                                  onChange={(event) => updateQuantity(line, event.target.value)}
                                  aria-label={`Кількість для ${line.partNumber}`}
                                />
                              ) : <span className="text-[var(--faint)]">—</span>}
                            </td>
                            <td>
                              {selected ? (
                                <select
                                  className="select !min-h-8 !py-1 text-[11px]"
                                  value={preview.conditions[line.id] ?? "unused"}
                                  onChange={(event) => updateCondition(line.id, event.target.value as ReturnCondition)}
                                  aria-label={`Стан для ${line.partNumber}`}
                                >
                                  {returnConditions.map((condition) => (
                                    <option key={condition.id} value={condition.id}>{condition.label}</option>
                                  ))}
                                </select>
                              ) : <span className="text-[var(--faint)]">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {visibleLines.length === 0 ? (
                  <p className="m-0 border-t border-[var(--border)] px-4 py-8 text-center text-[13px] text-[var(--muted-foreground)]" role="status">
                    Позицій за пошуком не знайдено.
                  </p>
                ) : null}
              </Panel>
            )}
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

export function AdminReturnsPage() {
  const [status, setStatus] = useState<AdminReturnStatusFilter>("draft");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const visibleReturns = useMemo(() => {
    const normalizedQuery = normalize(query);
    return sourceAdminReturns.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!normalizedQuery) return true;
      return normalize(`${item.number} ${item.orderNumber} ${item.note ?? ""}`).includes(normalizedQuery);
    });
  }, [query, status]);

  return (
    <main className="page page-narrow">
      <div className="space-y-6">
        <header className="page-header !mb-0">
          <div className="min-w-0">
            <h1 className="m-0 text-[28px] font-bold leading-[33.6px] tracking-[-0.02em]">Повернення</h1>
            <p className="page-description">
              Товар, який дилери фізично повернули — оформлення, затвердження, синхронізація з 1С.
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              className="button button-primary !min-h-8 px-4 text-xs font-medium max-sm:w-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={14} />
              Оформити повернення
            </button>
          </div>
        </header>

        <Panel className="overflow-hidden shadow-none">
          <div className="space-y-3 border-b border-[var(--border)] p-4">
            <label className="input-with-icon w-full lg:max-w-[520px]">
              <span className="sr-only">Пошук повернень</span>
              <Search size={15} />
              <input
                className="input h-9 pr-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Пошук за поверненням, дилером, замовленням, нотаткою..."
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  className="input-trailing"
                  aria-label="Очистити пошук повернень"
                  onClick={() => setQuery("")}
                >
                  <X size={14} />
                </button>
              ) : null}
            </label>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Статус повернення">
                {adminReturnStatusFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={status === filter.id}
                    onClick={() => setStatus(filter.id)}
                    className={`button !min-h-8 shrink-0 px-3 text-[11px] ${status === filter.id ? "button-primary" : "button-outline"}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="button button-outline shrink-0"
                disabled
                title="Оновлення вимкнено у read-only демонстрації"
              >
                <LockKeyhole size={13} />
                <RefreshCw size={14} />
                Оновити
              </button>
            </div>
          </div>

          <div className="grid min-h-[270px] place-items-center px-5 py-12 text-center" aria-live="polite">
            {visibleReturns.length === 0 ? (
              <div>
                <RotateCcw size={46} strokeWidth={1.6} className="mx-auto text-[var(--faint)]" />
                <p className="mt-4 text-[14px] text-[var(--muted-foreground)]">Повернень не знайдено.</p>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      <CreateReturnDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
