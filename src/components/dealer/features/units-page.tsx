"use client";

import {
  BarChart3,
  Box,
  Check,
  ChevronDown,
  Clock3,
  Search,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { EmptyState, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import {
  dealerUnitRecords,
  filterDealerUnitRecords,
  formatDealerUnitDate,
  getDealerUnitCounts,
  groupDealerUnitRecords,
  type DealerUnitRecord,
  type DealerUnitShipment,
  type DealerUnitStage,
  type DealerUnitTab,
} from "@/lib/dealer/units-data";
import dealerStyles from "../dealer.module.css";
import operationalStyles from "./operational-features.module.css";
import { FeatureFrame } from "./feature-frame";

const unitCounts = getDealerUnitCounts(dealerUnitRecords);

const unitTabs = [
  { id: "summary", label: "Зведення", icon: BarChart3, count: unitCounts.all },
  { id: "incoming", label: "Вхідні", icon: Box, count: unitCounts.incoming },
  { id: "stock", label: "Мій склад", icon: Warehouse, count: unitCounts.stock },
  { id: "sold", label: "Продані", icon: ShoppingCart, count: unitCounts.sold },
] as const satisfies readonly {
  id: DealerUnitTab;
  label: string;
  icon: typeof Box;
  count: number;
}[];

const stageLabels = {
  incoming: "В дорозі",
  stock: "На складі",
  sold: "Продано",
} as const satisfies Record<DealerUnitStage, string>;

function ukrainianCount(value: number, forms: readonly [string, string, string]) {
  const remainder100 = value % 100;
  const remainder10 = value % 10;
  if (remainder100 >= 11 && remainder100 <= 14) return `${value} ${forms[2]}`;
  if (remainder10 === 1) return `${value} ${forms[0]}`;
  if (remainder10 >= 2 && remainder10 <= 4) return `${value} ${forms[1]}`;
  return `${value} ${forms[2]}`;
}

function resultCountLabel(unitCount: number, containerCount: number) {
  return `${ukrainianCount(unitCount, ["одиниця", "одиниці", "одиниць"])} · ${ukrainianCount(containerCount, ["контейнер", "контейнери", "контейнерів"])}`;
}

function UnitStageBadge({ unit }: { unit: DealerUnitRecord }) {
  if (unit.stage === "incoming") {
    const ready = Boolean(unit.vin && unit.engineNumber);
    return (
      <StatusBadge tone={ready ? "green" : "amber"}>
        {ready ? "Готово прийняти" : "Очікує VIN/двигун"}
      </StatusBadge>
    );
  }

  return <StatusBadge tone={unit.stage === "stock" ? "green" : "neutral"}>{stageLabels[unit.stage]}</StatusBadge>;
}

function ShipmentStageBadge({ shipment }: { shipment: DealerUnitShipment }) {
  const stages = new Set(shipment.units.map((unit) => unit.stage));
  if (stages.size !== 1) return <StatusBadge tone="neutral">Кілька етапів</StatusBadge>;
  const stage = shipment.units[0]?.stage;
  if (!stage) return null;
  return (
    <StatusBadge tone={stage === "incoming" ? "blue" : stage === "stock" ? "green" : "neutral"}>
      {stageLabels[stage]}
    </StatusBadge>
  );
}

function ShipmentUnitList({ shipment }: { shipment: DealerUnitShipment }) {
  return (
    <ul className={operationalStyles.unitList}>
      {shipment.units.map((unit) => (
        <li key={unit.id}>
          <div>
            <strong>{unit.model}</strong>
            <span className={dealerStyles.mono}>{unit.sku} · {unit.year}</span>
          </div>
          <dl>
            <div><dt>VIN</dt><dd className={dealerStyles.mono}>{unit.vin ?? "Не вказано"}</dd></div>
            <div><dt>Двигун</dt><dd className={dealerStyles.mono}>{unit.engineNumber ?? "Не вказано"}</dd></div>
          </dl>
          <UnitStageBadge unit={unit} />
        </li>
      ))}
    </ul>
  );
}

export function UnitsPage() {
  const [tab, setTab] = useState<DealerUnitTab>("incoming");
  const [expanded, setExpanded] = useState("HAMU4124410");
  const [query, setQuery] = useState("");
  const filteredUnits = useMemo(
    () => filterDealerUnitRecords(dealerUnitRecords, tab, query),
    [query, tab],
  );
  const shipments = useMemo(() => groupDealerUnitRecords(filteredUnits), [filteredUnits]);
  const resultLabel = resultCountLabel(filteredUnits.length, shipments.length);

  return (
    <FeatureFrame feature="units">
      <div className={dealerStyles.featureTabs} role="tablist" aria-label="Розділи техніки">
        {unitTabs.map(({ id, label, icon: Icon, count }) => (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls="dealer-units-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
          >
            <Icon size={15} /> {label} <span className={operationalStyles.tabCount}>{count}</span>
          </button>
        ))}
      </div>

      <section className={dealerStyles.statsGrid} aria-label="Зведення техніки">
        <StatCard
          label="Готово прийняти"
          value={unitCounts.readyToReceive}
          helper="VIN і двигун вказані"
          icon={<Check size={18} />}
          tone="green"
        />
        <StatCard
          label="Очікує дані"
          value={unitCounts.awaitingIdentifiers}
          helper="Немає VIN або двигуна"
          icon={<Clock3 size={18} />}
          tone="amber"
        />
        <StatCard
          label="На складі"
          value={unitCounts.stock}
          helper="Прийняті одиниці"
          icon={<Warehouse size={18} />}
          tone="green"
        />
        <StatCard
          label="Усього техніки"
          value={unitCounts.all}
          helper={ukrainianCount(unitCounts.containers, ["контейнер", "контейнери", "контейнерів"])}
          icon={<Box size={18} />}
          tone="blue"
        />
      </section>

      <Panel className={dealerStyles.unitsPanel}>
        <div className={dealerStyles.unitsToolbar}>
          <div className="toolbar-search">
            <Search size={15} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Пошук техніки"
              placeholder="Контейнер, BL, модель, VIN або двигун…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <span data-testid="unit-result-count" aria-live="polite">{resultLabel}</span>
        </div>

        <div id="dealer-units-panel" role="tabpanel">
          {shipments.length ? (
            <>
              <div className={`data-table-wrap ${operationalStyles.unitTable}`} data-testid="unit-desktop-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th><span className="sr-only">Розгорнути</span></th>
                      <th>Контейнер</th>
                      <th>Номер BL</th>
                      <th>Одиниці</th>
                      <th>Дата</th>
                      <th>Маршрут</th>
                      <th>Етап</th>
                      <th>Дані приймання</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => {
                      const isExpanded = expanded === shipment.container;
                      const ready = shipment.units.filter((unit) => unit.vin && unit.engineNumber).length;
                      return (
                        <Fragment key={`${shipment.container}:${shipment.bl}`}>
                          <tr>
                            <td>
                              <button
                                type="button"
                                className={operationalStyles.expandButton}
                                aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} контейнер ${shipment.container}`}
                                aria-expanded={isExpanded}
                                aria-controls={`unit-shipment-${shipment.container}`}
                                onClick={() => setExpanded(isExpanded ? "" : shipment.container)}
                              >
                                <ChevronDown size={15} className={isExpanded ? dealerStyles.chevronOpen : undefined} />
                              </button>
                            </td>
                            <td><strong className={dealerStyles.mono}>{shipment.container}</strong></td>
                            <td className={dealerStyles.mono}>{shipment.bl}</td>
                            <td><strong>{shipment.units.length}</strong></td>
                            <td>{formatDealerUnitDate(shipment.arrivalDate)}</td>
                            <td>{shipment.route}</td>
                            <td><ShipmentStageBadge shipment={shipment} /></td>
                            <td>{ready} з {shipment.units.length}</td>
                          </tr>
                          {isExpanded ? (
                            <tr id={`unit-shipment-${shipment.container}`}>
                              <td colSpan={8} className={dealerStyles.expandedCell}>
                                <p>Проформа: <strong className={dealerStyles.mono}>{shipment.proforma}</strong></p>
                                <table className={dealerStyles.nestedTable}>
                                  <thead>
                                    <tr><th>Модель</th><th>Артикул</th><th>Рік</th><th>VIN</th><th>Двигун</th><th>Статус</th></tr>
                                  </thead>
                                  <tbody>
                                    {shipment.units.map((unit) => (
                                      <tr key={unit.id}>
                                        <td>{unit.model}</td>
                                        <td className={dealerStyles.mono}>{unit.sku}</td>
                                        <td>{unit.year}</td>
                                        <td className={dealerStyles.mono}>{unit.vin ?? "Не вказано"}</td>
                                        <td className={dealerStyles.mono}>{unit.engineNumber ?? "Не вказано"}</td>
                                        <td><UnitStageBadge unit={unit} /></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={operationalStyles.unitMobileList} data-testid="unit-mobile-list">
                {shipments.map((shipment) => {
                  const isExpanded = expanded === shipment.container;
                  return (
                    <article className={operationalStyles.unitMobileCard} key={`${shipment.container}:${shipment.bl}`}>
                      <button
                        type="button"
                        className={operationalStyles.unitMobileToggle}
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded(isExpanded ? "" : shipment.container)}
                      >
                        <span><strong className={dealerStyles.mono}>{shipment.container}</strong><small>Номер BL: {shipment.bl}</small></span>
                        <span><ShipmentStageBadge shipment={shipment} /><ChevronDown size={15} className={isExpanded ? dealerStyles.chevronOpen : undefined} /></span>
                      </button>
                      <dl className={operationalStyles.unitMobileMeta}>
                        <div><dt>Одиниці</dt><dd>{shipment.units.length}</dd></div>
                        <div><dt>Дата</dt><dd>{formatDealerUnitDate(shipment.arrivalDate)}</dd></div>
                        <div><dt>Маршрут</dt><dd>{shipment.route}</dd></div>
                      </dl>
                      {isExpanded ? <ShipmentUnitList shipment={shipment} /> : null}
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              title={query ? "За цим запитом техніки немає" : "У цьому розділі техніки немає"}
              description={query ? "Перевірте номер контейнера, BL, модель або VIN." : "Колекція не містить одиниць для вибраного етапу."}
            />
          )}
        </div>
      </Panel>
    </FeatureFrame>
  );
}
