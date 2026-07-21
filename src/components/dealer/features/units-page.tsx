"use client";

import {
  BarChart3,
  Box,
  Check,
  ChevronDown,
  Clock3,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { DealerDataToolbar } from "@/components/dealer/dealer-data-toolbar";
import { EmptyState, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import {
  dealerUnitShipments,
  filterDealerUnitShipments,
  getDealerUnitCounts,
  type DealerUnitActionFilter,
  type DealerUnitRecord,
  type DealerUnitShipment,
  type DealerUnitTab,
} from "@/lib/dealer/units-data";
import { ukrainianCount } from "@/lib/dealer/format";
import dealerStyles from "../dealer.module.css";
import operationalStyles from "./operational-features.module.css";
import { FeatureFrame } from "./feature-frame";

const unitCounts = getDealerUnitCounts(dealerUnitShipments);

const unitTabs = [
  { id: "summary", label: "Зведення", icon: BarChart3 },
  { id: "incoming", label: "Вхідні", icon: Box },
  { id: "stock", label: "Мій склад", icon: Warehouse },
  { id: "sold", label: "Продані", icon: ShoppingCart },
] as const satisfies readonly {
  id: DealerUnitTab;
  label: string;
  icon: typeof Box;
}[];

function shipmentCountLabel(shipments: readonly DealerUnitShipment[]) {
  const units = shipments.reduce((total, shipment) => total + shipment.assignedUnits, 0);
  return `${ukrainianCount(shipments.length, ["відправка", "відправки", "відправок"])} · ${ukrainianCount(units, ["одиниця", "одиниці", "одиниць"])}`;
}

function ShipmentStatusBadge({ shipment }: { shipment: DealerUnitShipment }) {
  const label = shipment.status === "in_transit"
    ? "В дорозі"
    : shipment.status === "at_warehouse"
      ? "На складі"
      : "Продано";
  const tone = shipment.status === "in_transit" ? "blue" : shipment.status === "at_warehouse" ? "green" : "neutral";
  return <StatusBadge tone={tone}>● {label}</StatusBadge>;
}

function ShipmentActionBadge({ shipment }: { shipment: DealerUnitShipment }) {
  return shipment.action === "free_stock"
    ? <StatusBadge tone="blue">● Вільний склад</StatusBadge>
    : <StatusBadge tone="amber">● {shipment.assignedUnits} чекає РН</StatusBadge>;
}

function UnitStatusBadge({ unit }: { unit: DealerUnitRecord }) {
  return unit.status === "free_stock"
    ? <StatusBadge tone="blue">● Вільний склад</StatusBadge>
    : <StatusBadge tone="amber">● Чекає РН</StatusBadge>;
}

function ShipmentUnitList({ shipment }: { shipment: DealerUnitShipment }) {
  return (
    <ul className={operationalStyles.unitList}>
      {shipment.units.map((unit) => (
        <li key={unit.id}>
          <div>
            <strong>{unit.number}. {unit.model}</strong>
            <span className={dealerStyles.mono}>{unit.sku} · {unit.year}</span>
          </div>
          <dl>
            <div><dt>VIN</dt><dd className={dealerStyles.mono}>{unit.vin ?? "—"}</dd></div>
            <div><dt>Статус</dt><dd><UnitStatusBadge unit={unit} /></dd></div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function UnitsPage() {
  const [tab, setTab] = useState<DealerUnitTab>("incoming");
  const [expanded, setExpanded] = useState("HAMU4124410");
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<DealerUnitActionFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const shipments = useMemo(
    () => filterDealerUnitShipments(dealerUnitShipments, { tab, query, action: actionFilter }),
    [actionFilter, query, tab],
  );
  const resultLabel = shipmentCountLabel(shipments);
  const changeQuery = (value: string) => {
    setQuery(value);
    if (!value.trim()) return;
    const [firstMatch] = filterDealerUnitShipments(dealerUnitShipments, {
      tab,
      query: value,
      action: actionFilter,
    });
    if (firstMatch) setExpanded(firstMatch.container);
  };

  return (
    <FeatureFrame feature="units">
      <div className={dealerStyles.featureTabs} role="tablist" aria-label="Розділи техніки">
        {unitTabs.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls="dealer-units-panel"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <section className={dealerStyles.statsGrid} aria-label="Зведення техніки">
        <StatCard label="Готово прийняти" value={unitCounts.readyToReceive} icon={<Check size={18} />} tone="green" />
        <StatCard label="Очікує РН" value={unitCounts.awaitingRegistration} icon={<Clock3 size={18} />} tone="amber" />
        <StatCard label="Прийнято" value={unitCounts.accepted} icon={<Warehouse size={18} />} tone="green" />
        <StatCard
          label="Мої одиниці"
          value={unitCounts.owned}
          helper={ukrainianCount(unitCounts.shipments, ["контейнер", "контейнери", "контейнерів"])}
          icon={<Box size={18} />}
          tone="blue"
        />
      </section>

      <Panel className={dealerStyles.unitsPanel}>
        <div className={operationalStyles.dataToolbarWrap}>
          <DealerDataToolbar
            search={{
              value: query,
              onValueChange: changeQuery,
              label: "Пошук техніки",
              placeholder: "Контейнер, BL, модель, SKU або VIN…",
            }}
            filters={{
              label: "Фільтри техніки",
              activeCount: actionFilter === "all" ? 0 : 1,
              open: filtersOpen,
              onOpenChange: setFiltersOpen,
              panelId: "dealer-unit-filters",
              content: (
                <label className="field">
                  <span>Дія</span>
                  <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value as DealerUnitActionFilter)}>
                    <option value="all">Усі</option>
                    <option value="free_stock">Вільний склад</option>
                    <option value="awaiting_registration">Очікує РН</option>
                  </select>
                </label>
              ),
              onClear: () => setActionFilter("all"),
            }}
            resultMeta={<span data-testid="unit-result-count">{resultLabel}</span>}
          />
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
                      <th>ETA</th>
                      <th>Маршрут</th>
                      <th>Статус</th>
                      <th>Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((shipment) => {
                      const isExpanded = expanded === shipment.container;
                      return (
                        <Fragment key={shipment.id}>
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
                            <td><strong>{shipment.assignedUnits}/{shipment.totalUnits}</strong></td>
                            <td>{shipment.eta}</td>
                            <td>{shipment.route}</td>
                            <td><ShipmentStatusBadge shipment={shipment} /></td>
                            <td><ShipmentActionBadge shipment={shipment} /></td>
                          </tr>
                          {isExpanded ? (
                            <tr id={`unit-shipment-${shipment.container}`}>
                              <td colSpan={8} className={dealerStyles.expandedCell}>
                                <p>Проформа: <strong className={dealerStyles.mono}>{shipment.proforma}</strong></p>
                                <table className={dealerStyles.nestedTable}>
                                  <thead>
                                    <tr><th>#</th><th>Модель</th><th>Артикул</th><th>Рік</th><th>VIN</th><th>Статус</th><th>Дія</th></tr>
                                  </thead>
                                  <tbody>
                                    {shipment.units.map((unit) => (
                                      <tr key={unit.id}>
                                        <td>{unit.number}</td>
                                        <td>{unit.model}</td>
                                        <td className={dealerStyles.mono}>{unit.sku}</td>
                                        <td>{unit.year}</td>
                                        <td className={dealerStyles.mono}>{unit.vin ?? "—"}</td>
                                        <td><UnitStatusBadge unit={unit} /></td>
                                        <td>—</td>
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
                    <article className={operationalStyles.unitMobileCard} key={shipment.id}>
                      <button
                        type="button"
                        className={operationalStyles.unitMobileToggle}
                        aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} контейнер ${shipment.container}`}
                        aria-expanded={isExpanded}
                        onClick={() => setExpanded(isExpanded ? "" : shipment.container)}
                      >
                        <span><strong className={dealerStyles.mono}>{shipment.container}</strong><small>Номер BL: {shipment.bl}</small></span>
                        <span><ShipmentStatusBadge shipment={shipment} /><ChevronDown size={15} className={isExpanded ? dealerStyles.chevronOpen : undefined} /></span>
                      </button>
                      <dl className={operationalStyles.unitMobileMeta}>
                        <div><dt>Одиниці</dt><dd>{shipment.assignedUnits}/{shipment.totalUnits}</dd></div>
                        <div><dt>ETA</dt><dd>{shipment.eta}</dd></div>
                        <div><dt>Дія</dt><dd><ShipmentActionBadge shipment={shipment} /></dd></div>
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
              description={query ? "Перевірте номер контейнера, BL, модель, SKU або VIN." : "Змініть вкладку або скиньте фільтри."}
            />
          )}
        </div>
      </Panel>
    </FeatureFrame>
  );
}
