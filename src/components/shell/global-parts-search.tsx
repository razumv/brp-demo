"use client";

import { Check, PackageCheck, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import {
  GLOBAL_PARTS_SEARCH_FIXTURES,
  GLOBAL_PARTS_SEARCH_TABS,
  type GlobalPartsSearchFixture,
  type GlobalPartsSearchTab,
} from "@/lib/global-parts-search-data";
import { formatMoney } from "@/lib/mock-data";

type SearchSurface = "desktop" | "mobile";

type DealerGlobalPartsSearchControllerOptions = {
  query: string;
  onQueryChange: (query: string) => void;
};

export type DealerGlobalPartsSearchController = {
  query: string;
  trimmedQuery: string;
  desktopOpen: boolean;
  activeTab: GlobalPartsSearchTab;
  quantities: Record<string, number>;
  addedParts: Record<string, boolean>;
  addingParts: Record<string, boolean>;
  failedParts: Record<string, boolean>;
  matchingParts: readonly GlobalPartsSearchFixture[];
  visibleParts: readonly GlobalPartsSearchFixture[];
  setDesktopOpen: (open: boolean) => void;
  updateQuery: (nextQuery: string, surface: SearchSurface) => void;
  clearQuery: (surface: SearchSurface) => void;
  setActiveTab: (tab: GlobalPartsSearchTab) => void;
  quantityFor: (partNumber: string) => number;
  changeQuantity: (partNumber: string, delta: number) => void;
  addPart: (partNumber: string) => Promise<void>;
};

type DealerGlobalPartsSearchProps = {
  controller: DealerGlobalPartsSearchController;
  mobileOpen: boolean;
  onMobileClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

const mobileFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDealerGlobalPartsSearchController({
  query,
  onQueryChange,
}: DealerGlobalPartsSearchControllerOptions): DealerGlobalPartsSearchController {
  const { commands } = useDealerWorkflow();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GlobalPartsSearchTab>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedParts, setAddedParts] = useState<Record<string, boolean>>({});
  const [addingParts, setAddingParts] = useState<Record<string, boolean>>({});
  const [failedParts, setFailedParts] = useState<Record<string, boolean>>({});
  const trimmedQuery = query.trim();

  const matchingParts = useMemo(() => {
    const normalizedQuery = trimmedQuery.toLocaleUpperCase("uk-UA");
    if (!normalizedQuery) return [];
    return GLOBAL_PARTS_SEARCH_FIXTURES.filter((part) => (
      part.number.includes(normalizedQuery)
      || part.description?.toLocaleUpperCase("uk-UA").includes(normalizedQuery)
    ));
  }, [trimmedQuery]);

  const visibleParts = useMemo(() => (
    activeTab === "all"
      ? matchingParts
      : matchingParts.filter((part) => part.status === activeTab)
  ), [activeTab, matchingParts]);

  const updateQuery = useCallback((nextQuery: string, surface: SearchSurface) => {
    onQueryChange(nextQuery);
    setAddedParts({});
    setFailedParts({});
    if (surface === "desktop") setDesktopOpen(Boolean(nextQuery.trim()));
  }, [onQueryChange]);

  const clearQuery = useCallback((surface: SearchSurface) => {
    onQueryChange("");
    setActiveTab("all");
    setAddedParts({});
    setFailedParts({});
    if (surface === "desktop") setDesktopOpen(false);
  }, [onQueryChange]);

  const quantityFor = useCallback((partNumber: string) => quantities[partNumber] ?? 1, [quantities]);

  const changeQuantity = useCallback((partNumber: string, delta: number) => {
    setQuantities((current) => ({
      ...current,
      [partNumber]: Math.min(99, Math.max(1, (current[partNumber] ?? 1) + delta)),
    }));
    setAddedParts((current) => ({ ...current, [partNumber]: false }));
    setFailedParts((current) => ({ ...current, [partNumber]: false }));
  }, []);

  const addPart = useCallback(async (partNumber: string) => {
    if (addingParts[partNumber]) return;
    setAddingParts((current) => ({ ...current, [partNumber]: true }));
    setAddedParts((current) => ({ ...current, [partNumber]: false }));
    setFailedParts((current) => ({ ...current, [partNumber]: false }));
    try {
      const result = await commands.addCartLine({
        partNumber,
        quantity: quantityFor(partNumber),
      });
      if (result.ok) {
        setAddedParts((current) => ({ ...current, [partNumber]: true }));
      } else {
        setFailedParts((current) => ({ ...current, [partNumber]: true }));
      }
    } catch {
      setFailedParts((current) => ({ ...current, [partNumber]: true }));
    } finally {
      setAddingParts((current) => ({ ...current, [partNumber]: false }));
    }
  }, [addingParts, commands, quantityFor]);

  return {
    query,
    trimmedQuery,
    desktopOpen,
    activeTab,
    quantities,
    addedParts,
    addingParts,
    failedParts,
    matchingParts,
    visibleParts,
    setDesktopOpen,
    updateQuery,
    clearQuery,
    setActiveTab,
    quantityFor,
    changeQuantity,
    addPart,
  };
}

export function DealerGlobalPartsSearch({
  controller,
  mobileOpen,
  onMobileClose,
  returnFocusRef,
}: DealerGlobalPartsSearchProps) {
  const desktopRef = useRef<HTMLFormElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const {
    activeTab,
    addedParts,
    addingParts,
    changeQuantity,
    clearQuery,
    desktopOpen,
    failedParts,
    quantityFor,
    setActiveTab,
    setDesktopOpen,
    trimmedQuery,
    updateQuery,
    visibleParts,
    addPart,
    query,
  } = controller;

  useEffect(() => {
    if (!desktopOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !desktopRef.current?.contains(event.target)) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [desktopOpen, setDesktopOpen]);

  useEffect(() => {
    if (!desktopOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDesktopOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [desktopOpen, setDesktopOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const appShell = document.querySelector<HTMLElement>(".app-shell");
    const appShellHadInert = appShell?.hasAttribute("inert") ?? false;
    const previousAppShellAriaHidden = appShell?.getAttribute("aria-hidden") ?? null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const returnTarget = returnFocusRef.current;

    mobileInputRef.current?.focus({ preventScroll: true });
    if (document.activeElement !== mobileInputRef.current) {
      mobileDialogRef.current?.focus({ preventScroll: true });
    }

    appShell?.setAttribute("inert", "");
    appShell?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const keepFocusInsideDialog = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onMobileClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = mobileDialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(mobileFocusableSelector))
        .filter((element) => element.tabIndex >= 0 && element.offsetParent !== null && !element.hasAttribute("hidden"));

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", keepFocusInsideDialog);
    return () => {
      document.removeEventListener("keydown", keepFocusInsideDialog);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;

      if (appShell) {
        if (!appShellHadInert) appShell.removeAttribute("inert");
        if (previousAppShellAriaHidden === null) appShell.removeAttribute("aria-hidden");
        else appShell.setAttribute("aria-hidden", previousAppShellAriaHidden);
      }

      returnTarget?.focus({ preventScroll: true });
    };
  }, [mobileOpen, onMobileClose, returnFocusRef]);

  const renderResults = (panelId: string) => {
    return (
      <div className="global-parts-results">
        <div className="global-parts-tabs" role="tablist" aria-label="Фільтр доступності">
          {GLOBAL_PARTS_SEARCH_TABS.map((tab, tabIndex) => (
            <button
              type="button"
              role="tab"
              id={`${panelId}-${tab.id}-tab`}
              aria-selected={activeTab === tab.id}
              aria-controls={panelId}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={activeTab === tab.id ? "global-parts-tab-active" : undefined}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                let nextIndex: number | null = null;
                if (event.key === "ArrowRight") nextIndex = (tabIndex + 1) % GLOBAL_PARTS_SEARCH_TABS.length;
                else if (event.key === "ArrowLeft") nextIndex = (tabIndex - 1 + GLOBAL_PARTS_SEARCH_TABS.length) % GLOBAL_PARTS_SEARCH_TABS.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = GLOBAL_PARTS_SEARCH_TABS.length - 1;
                if (nextIndex === null) return;

                event.preventDefault();
                setActiveTab(GLOBAL_PARTS_SEARCH_TABS[nextIndex].id);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>("[role='tab']")
                  .item(nextIndex)
                  .focus();
              }}
            >
              {tab.label} ({tab.sourceCount})
            </button>
          ))}
        </div>
        <div
          id={panelId}
          className="global-parts-panel"
          role="tabpanel"
          aria-labelledby={`${panelId}-${activeTab}-tab`}
          aria-live="polite"
        >
          {visibleParts.length ? (
            <div className="global-parts-list">
              {visibleParts.map((part) => (
                <article className="global-parts-row" key={part.number}>
                  <div className="global-parts-copy">
                    <div className="global-parts-identity">
                      <strong>{part.number}</strong>
                      <span>АКТИВНО</span>
                    </div>
                    {part.description ? <p>{part.description}</p> : null}
                    {part.availabilityLabel ? (
                      <small><PackageCheck size={12} /> {part.availabilityLabel}</small>
                    ) : null}
                  </div>
                  <div className="global-parts-price">
                    <strong>{formatMoney(part.dealerPrice)}</strong>
                    {part.comparePrice !== null ? <del>{formatMoney(part.comparePrice)}</del> : null}
                  </div>
                  <div className="global-parts-quantity" aria-label={`Кількість ${part.number}`}>
                    <button type="button" aria-label={`Зменшити кількість ${part.number}`} onClick={() => changeQuantity(part.number, -1)}>−</button>
                    <span>{quantityFor(part.number)}</span>
                    <button type="button" aria-label={`Збільшити кількість ${part.number}`} onClick={() => changeQuantity(part.number, 1)}>+</button>
                  </div>
                  <button
                    type="button"
                    className="global-parts-add"
                    disabled={addingParts[part.number]}
                    onClick={() => void addPart(part.number)}
                    aria-label={`Додати ${part.number} до кошика`}
                  >
                    {addedParts[part.number]
                      ? <><Check size={13} /> Додано</>
                      : addingParts[part.number]
                        ? "Додаємо…"
                        : failedParts[part.number] ? "Повторити" : "+ Кошик"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="global-parts-empty">
              Немає результатів для цього фільтра.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <form
        className="global-search dealer-global-search"
        ref={desktopRef}
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmedQuery) setDesktopOpen(true);
        }}
      >
        <span className="global-search-submit" aria-hidden="true"><Search size={17} /></span>
        <input
          aria-label="Глобальний пошук запчастин"
          aria-autocomplete="list"
          aria-controls="dealer-global-parts-results"
          aria-expanded={desktopOpen && Boolean(trimmedQuery)}
          aria-haspopup="dialog"
          autoComplete="off"
          placeholder="напр. 507032473, brake..."
          role="combobox"
          value={query}
          onFocus={() => {
            if (trimmedQuery) setDesktopOpen(true);
          }}
          onChange={(event) => updateQuery(event.target.value, "desktop")}
        />
        {query ? (
          <button type="button" className="global-search-clear" aria-label="Очистити пошук" onClick={() => clearQuery("desktop")}>
            <X size={15} />
          </button>
        ) : null}
        {desktopOpen && trimmedQuery ? (
          <div id="dealer-global-parts-results" className="global-search-dropdown" role="dialog" aria-label="Результати пошуку запчастин">
            {renderResults("dealer-global-parts-panel")}
          </div>
        ) : null}
      </form>

      {mobileOpen && typeof document !== "undefined" ? createPortal((
        <div
          ref={mobileDialogRef}
          className="mobile-parts-search"
          role="dialog"
          aria-modal="true"
          aria-label="Пошук запчастин"
          tabIndex={-1}
        >
          <div className="mobile-parts-search-header">
            <strong>Пошук запчастин</strong>
            <button type="button" className="icon-button" aria-label="Закрити пошук" onClick={onMobileClose}><X size={19} /></button>
          </div>
          <form className="mobile-parts-search-form" onSubmit={(event) => event.preventDefault()}>
            <Search size={17} aria-hidden="true" />
            <input
              ref={mobileInputRef}
              aria-label="Глобальний пошук запчастин"
              aria-autocomplete="list"
              aria-controls="dealer-mobile-parts-results"
              aria-expanded={Boolean(trimmedQuery)}
              aria-haspopup="dialog"
              autoComplete="off"
              placeholder="напр. 507032473, brake..."
              role="combobox"
              value={query}
              onChange={(event) => updateQuery(event.target.value, "mobile")}
            />
            {query ? (
              <button
                type="button"
                aria-label="Очистити пошук"
                onClick={() => {
                  clearQuery("mobile");
                  mobileInputRef.current?.focus();
                }}
              ><X size={16} /></button>
            ) : null}
          </form>
          <div id="dealer-mobile-parts-results" className="mobile-parts-search-body">
            {trimmedQuery ? renderResults("dealer-mobile-parts-panel") : (
              <div className="mobile-parts-search-prompt">Почніть вводити номер або назву запчастини.</div>
            )}
          </div>
        </div>
      ), document.body) : null}
    </>
  );
}
