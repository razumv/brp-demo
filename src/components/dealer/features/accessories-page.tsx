"use client";

import {
  Check,
  ChevronRight,
  Image as ImageIcon,
  RotateCcw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { BrpIconButton, BrpSelect, BrpTextInput } from "@/components/brp-ui";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { Modal, Panel, StatusBadge } from "@/components/shared/ui";
import {
  ACCESSORY_CATEGORY_OPTIONS,
  ACCESSORY_COMPATIBILITY_OPTIONS,
  ACCESSORY_FAMILY_CARDS,
  ACCESSORY_PRODUCTS,
  ACCESSORY_PURPOSE_OPTIONS,
  accessoryVehicleOptions,
  filterAccessories,
  updateAccessoryVehicleFilter,
  type AccessoryCategory,
  type AccessoryCompatibility,
  type AccessoryEngine,
  type AccessoryFilters,
  type AccessoryModel,
  type AccessoryPurpose,
  type AccessorySort,
  type AccessoryStockFilter,
  type AccessoryTrim,
} from "@/lib/dealer/accessories-data";
import type { DealerCommandResult } from "@/lib/dealer/contracts";
import { formatMoney, getPart } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FeatureFrame } from "./feature-frame";
import styles from "./accessories-page.module.css";

const defaultFilters: AccessoryFilters = {
  family: "all",
  category: "all",
  year: "all",
  model: "all",
  trim: "all",
  engine: "all",
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
  const vehicleYearRef = useRef<HTMLSelectElement>(null);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const selected = ACCESSORY_PRODUCTS.find((product) => product.id === selectedId);
  const selectedCartPart = selected ? getPart(selected.sku) : undefined;
  const products = useMemo(
    () => filterAccessories(ACCESSORY_PRODUCTS, filters),
    [filters],
  );
  const vehicleOptions = useMemo(
    () => accessoryVehicleOptions(ACCESSORY_PRODUCTS, filters),
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

  const updateVehicleFilter = (
    update: Parameters<typeof updateAccessoryVehicleFilter>[1],
  ) => {
    setFilters((current) => updateAccessoryVehicleFilter(current, update));
  };

  const toggleFilters = () => {
    setFiltersExpanded((current) => {
      const next = !current;
      if (next) {
        window.requestAnimationFrame(() => vehicleYearRef.current?.focus());
      }
      return next;
    });
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
        <div
          className={cn(styles.filterControls, filtersExpanded && styles.filterControlsExpanded)}
          id="accessory-filter-panel"
        >
          <section className={styles.vehicleSelector} aria-label="Підбір техніки">
            <div className={styles.vehicleMode} role="tablist" aria-label="Спосіб підбору техніки">
              <button type="button" role="tab" aria-selected="true">За моделлю</button>
              <button type="button" role="tab" aria-selected="false" disabled>За VIN</button>
            </div>
            <div className={styles.vehicleFields}>
              <label className="field">
                <span>Рік техніки</span>
                <select
                  aria-label="Рік техніки"
                  ref={vehicleYearRef}
                  value={filters.year}
                  onChange={(event) => updateVehicleFilter({ year: event.target.value })}
                >
                  <option value="all">Усі роки</option>
                  {vehicleOptions.years.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Модель техніки</span>
                <select
                  aria-label="Модель техніки"
                  value={filters.model}
                  disabled={filters.year === "all" || vehicleOptions.models.length === 0}
                  onChange={(event) => updateVehicleFilter({ model: event.target.value as AccessoryModel | "all" })}
                >
                  <option value="all">Усі моделі</option>
                  {vehicleOptions.models.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Комплектація техніки</span>
                <select
                  aria-label="Комплектація техніки"
                  value={filters.trim}
                  disabled={filters.model === "all" || vehicleOptions.trims.length === 0}
                  onChange={(event) => updateVehicleFilter({ trim: event.target.value as AccessoryTrim | "all" })}
                >
                  <option value="all">Усі комплектації</option>
                  {vehicleOptions.trims.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Двигун техніки</span>
                <select
                  aria-label="Двигун техніки"
                  value={filters.engine}
                  disabled={filters.trim === "all" || vehicleOptions.engines.length === 0}
                  onChange={(event) => updateVehicleFilter({ engine: event.target.value as AccessoryEngine | "all" })}
                >
                  <option value="all">Усі двигуни</option>
                  {vehicleOptions.engines.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.vinNotice} role="note">
              Підбір за VIN поки недоступний. Використовуйте модель, комплектацію та двигун.
            </p>
          </section>

          <Panel className={styles.filterRail}>
            <header className={styles.filterHeader}>
              <span><SlidersHorizontal size={16} /><strong>Фільтри</strong></span>
              <button type="button" onClick={() => setFilters(defaultFilters)}>
                <RotateCcw size={13} /> Очистити
              </button>
            </header>

            <div className={styles.filterBody}>
              <div className={styles.filterSelects}>
                <label className="field">
                  <span>Категорія товару</span>
                  <select
                    aria-label="Категорія товару"
                    value={filters.category}
                    onChange={(event) => setFilters((current) => ({
                      ...current,
                      category: event.target.value as AccessoryCategory | "all",
                    }))}
                  >
                    <option value="all">Усі категорії</option>
                    {ACCESSORY_CATEGORY_OPTIONS.map((item) => <option value={item} key={item}>{item}</option>)}
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

          <label className={styles.mobileSort}>
            <span>Сортування</span>
            <select
              className="select"
              aria-label="Сортування фільтрів"
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
          </label>
        </div>

        <section className={styles.productsSection} aria-label="Аксесуари">
          <div className={styles.productToolbar}>
            <div className={styles.productSearch}>
              <BrpTextInput
                type="search"
                label="Пошук аксесуарів"
                hideLabel
                leadingIcon={<Search size={15} aria-hidden="true" />}
                clearable
                value={filters.query}
                onValueChange={(value) => setFilters((current) => ({ ...current, query: value }))}
                placeholder="Назва або артикул..."
              />
            </div>
            <div className={styles.mobileFilterTrigger}>
              <BrpIconButton
                label="Фільтри аксесуарів"
                icon={<SlidersHorizontal size={18} />}
                variant="secondary"
                expanded={filtersExpanded}
                ariaControls="accessory-filter-panel"
                onPress={toggleFilters}
              />
            </div>
            <div className={styles.toolbarSort}>
              <BrpSelect
              label="Сортування"
              hideLabel
              value={filters.sort}
              onValueChange={(value) => setFilters((current) => ({
                ...current,
                sort: value as AccessorySort,
              }))}
              options={[
                { value: "featured", label: "Рекомендовані" },
                { value: "price-asc", label: "Ціна: від нижчої" },
                { value: "price-desc", label: "Ціна: від вищої" },
              ]}
              />
            </div>
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
