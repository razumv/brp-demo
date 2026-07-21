"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { Modal, Panel, StatusBadge } from "@/components/shared/ui";
import {
  ACCESSORY_COMPATIBILITY_OPTIONS,
  ACCESSORY_FAMILY_CARDS,
  ACCESSORY_FAMILY_OPTIONS,
  ACCESSORY_PRODUCTS,
  ACCESSORY_PURPOSE_OPTIONS,
  ACCESSORY_YEAR_OPTIONS,
  filterAccessories,
  type AccessoryCompatibility,
  type AccessoryFamily,
  type AccessoryFilters,
  type AccessoryPurpose,
  type AccessorySort,
  type AccessoryStockFilter,
} from "@/lib/dealer/accessories-data";
import type { DealerCommandResult } from "@/lib/dealer/contracts";
import { formatMoney, getPart } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FeatureFrame } from "./feature-frame";
import styles from "./accessories-page.module.css";

const defaultFilters: AccessoryFilters = {
  family: "all",
  year: "all",
  compatibility: [],
  purposes: [],
  query: "",
  stock: "all",
  sort: "featured",
};

function commandFailureMessage(result: DealerCommandResult<void>) {
  if (result.ok) return "";
  if (result.kind === "validation-error") {
    return result.issues[0]?.message ?? "Не вдалося додати аксесуар у кошик.";
  }
  if (result.kind === "local-error") return result.message;
  return "Ця дія зараз недоступна.";
}

export function AccessoriesPage() {
  const { commands } = useDealerWorkflow();
  const [filters, setFilters] = useState<AccessoryFilters>(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const selected = ACCESSORY_PRODUCTS.find((product) => product.id === selectedId);
  const selectedCartPart = selected ? getPart(selected.sku) : undefined;
  const products = useMemo(
    () => filterAccessories(ACCESSORY_PRODUCTS, filters),
    [filters],
  );

  const updateCompatibility = (value: AccessoryCompatibility, checked: boolean) => {
    setFilters((current) => ({
      ...current,
      compatibility: checked
        ? [...current.compatibility, value]
        : current.compatibility.filter((item) => item !== value),
    }));
  };

  const updatePurpose = (value: AccessoryPurpose, checked: boolean) => {
    setFilters((current) => ({
      ...current,
      purposes: checked
        ? [...current.purposes, value]
        : current.purposes.filter((item) => item !== value),
    }));
  };

  const openProduct = (id: string) => {
    setSelectedId(id);
    setAdded(false);
    setAddError("");
  };

  const addSelectedProduct = async () => {
    if (!selected || !selectedCartPart || adding) return;
    setAdding(true);
    setAdded(false);
    setAddError("");
    try {
      const result = await commands.addCartLine({
        partNumber: selected.sku,
        quantity: 1,
      });
      if (result.ok) setAdded(true);
      else setAddError(commandFailureMessage(result));
    } catch {
      setAddError("Не вдалося додати аксесуар у кошик.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <FeatureFrame feature="accessories">
      <section className={styles.familyGrid} aria-label="Сімейства аксесуарів">
        {ACCESSORY_FAMILY_CARDS.map((item) => (
          <button
            type="button"
            className={cn(styles.familyCard, filters.family === item.label && styles.familyCardActive)}
            aria-pressed={filters.family === item.label}
            key={item.label}
            onClick={() => setFilters((current) => ({
              ...current,
              family: current.family === item.label ? "all" : item.label,
            }))}
          >
            <span className={cn(
              styles.familyIcon,
              styles[`familyIcon${item.tone[0].toUpperCase()}${item.tone.slice(1)}`],
            )}><ImageIcon size={19} /></span>
            <span className={styles.familyCopy}>
              <strong>{item.label}</strong>
              <small>{item.count} товарів · {item.photos} фото</small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </section>

      <div className={styles.accessoryLayout}>
        <Panel className={styles.filterRail}>
          <header className={styles.filterHeader}>
            <button
              type="button"
              className={styles.filterToggle}
              aria-expanded={filtersExpanded}
              onClick={() => setFiltersExpanded((current) => !current)}
            >
              <SlidersHorizontal size={16} /><strong>Фільтри</strong><ChevronDown size={14} />
            </button>
            <button type="button" onClick={() => setFilters(defaultFilters)}>
              <RotateCcw size={13} /> Очистити
            </button>
          </header>

          <div className={cn(styles.filterBody, filtersExpanded && styles.filterBodyExpanded)}>
            <div className={styles.filterSelects}>
              <label className="field">
                <span>Категорія</span>
                <select
                  aria-label="Категорія"
                  value={filters.family}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    family: event.target.value as AccessoryFamily | "all",
                  }))}
                >
                  <option value="all">Усі категорії</option>
                  {ACCESSORY_FAMILY_OPTIONS.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Рік</span>
                <select
                  aria-label="Рік"
                  value={filters.year}
                  onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
                >
                  <option value="all">Усі роки</option>
                  {ACCESSORY_YEAR_OPTIONS.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Наявність</span>
                <select
                  aria-label="Наявність"
                  value={filters.stock}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    stock: event.target.value as AccessoryStockFilter,
                  }))}
                >
                  <option value="all">Усі</option>
                  <option value="in-stock">В наявності</option>
                  <option value="under-order">Під замовлення</option>
                </select>
              </label>
            </div>
            <details className={styles.filterGroup} open>
              <summary>Сумісність <span>{ACCESSORY_COMPATIBILITY_OPTIONS.length}</span></summary>
              <div>
                {ACCESSORY_COMPATIBILITY_OPTIONS.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={filters.compatibility.includes(item)}
                      onChange={(event) => updateCompatibility(item, event.target.checked)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </details>
            <details className={styles.filterGroup} open>
              <summary>Призначення <span>{ACCESSORY_PURPOSE_OPTIONS.length}</span></summary>
              <div>
                {ACCESSORY_PURPOSE_OPTIONS.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={filters.purposes.includes(item)}
                      onChange={(event) => updatePurpose(item, event.target.checked)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </Panel>

        <section className={styles.productsSection} aria-label="Аксесуари">
          <div className={styles.productToolbar}>
            <label className={styles.productSearch}>
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                aria-label="Пошук аксесуарів"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Назва або артикул..."
              />
            </label>
            <select
              className="select"
              aria-label="Сортування"
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({
                ...current,
                sort: event.target.value as AccessorySort,
              }))}
            >
              <option value="featured">Рекомендовані</option>
              <option value="price-asc">Ціна: від нижчої</option>
              <option value="price-desc">Ціна: від вищої</option>
            </select>
          </div>

          <p className={styles.resultCount} aria-live="polite">
            Знайдено: {products.length}
          </p>

          {products.length ? (
            <div className={styles.productGrid}>
              {products.map((product, index) => (
                <button
                  type="button"
                  className={styles.productCard}
                  key={product.id}
                  onClick={() => openProduct(product.id)}
                >
                  <span className={cn(styles.productBadge, product.stock === 0 && styles.productBadgeOrder)}>
                    {product.stock ? "Готово до замовлення" : "Під замовлення"}
                  </span>
                  <span className={cn(styles.productVisual, styles[`productVisual${(index % 3) + 1}`])}>
                    <Sparkles size={38} />
                  </span>
                  <span className={styles.productCopy}>
                    <small>{product.family}</small>
                    <strong>{product.title}</strong>
                    <span className={styles.productSku}>{product.sku}</span>
                    <span className={styles.productFooter}>
                      <strong>{formatMoney(product.price)}</strong>
                      <span>Детальніше <ChevronRight size={13} /></span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Panel className={styles.emptyState}>
              <Sparkles size={24} />
              <strong>Аксесуарів за цими фільтрами не знайдено.</strong>
              <button type="button" className="button button-outline" onClick={() => setFilters(defaultFilters)}>
                Очистити фільтри
              </button>
            </Panel>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.title || "Аксесуар"}
        description={selected ? `${selected.family} · ${selected.sku}` : undefined}
        className={styles.accessoryModal}
      >
        {selected ? (
          <div className={styles.accessoryDetail}>
            <div className={styles.accessoryHero}>
              <Sparkles size={58} />
              <span>BRP Genuine Accessories</span>
            </div>
            <div className={styles.accessoryInfo}>
              <div className={styles.chipRow}>
                <StatusBadge tone="orange">{selected.family}</StatusBadge>
                <StatusBadge tone="neutral">Accessories</StatusBadge>
                <StatusBadge tone={selected.stock ? "green" : "amber"}>
                  {selected.stock ? "Готово до замовлення" : "Під замовлення"}
                </StatusBadge>
              </div>
              <p>Оригінальний аксесуар BRP для надійної роботи та точного встановлення.</p>
              <dl className={styles.metadataList}>
                <div><dt>Сумісність</dt><dd>{selected.compatibility.join(", ")}</dd></div>
                <div><dt>Призначення</dt><dd>{selected.purposes.join(", ")}</dd></div>
                <div><dt>Модельні роки</dt><dd>{selected.years.join(", ")}</dd></div>
              </dl>
              <div className={styles.accessorySku}>
                <span>
                  <strong>{selected.sku}</strong>
                  <small>Актуальний артикул: {selected.activeReplacementNumber}</small>
                  <small>{selected.stock} в наявності</small>
                </span>
                <span>
                  <strong>{formatMoney(selected.price)}</strong>
                  <small>{selected.stock ? "Готово до замовлення" : "Під замовлення"}</small>
                </span>
              </div>
              <button
                type="button"
                className="button button-primary button-wide"
                disabled={!selectedCartPart || adding}
                onClick={() => void addSelectedProduct()}
              >
                {added ? <><Check size={15} /> Додано</> : <><ShoppingCart size={15} /> {adding ? "Додаємо…" : "Додати в кошик"}</>}
              </button>
              {!selectedCartPart ? (
                <p className={styles.unavailableReason} role="note">
                  Додавання цього артикулу потребує підключення каталогу.
                </p>
              ) : null}
              {addError ? <p className={styles.addError} role="alert">{addError}</p> : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </FeatureFrame>
  );
}
