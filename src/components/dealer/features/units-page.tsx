"use client";

import {
  BarChart3,
  Box,
  Check,
  ChevronDown,
  Clock3,
  Download,
  ShoppingCart,
  Search,
  Warehouse,
} from "lucide-react";
import { Fragment, useState } from "react";
import { EmptyState, Panel, StatCard, StatusBadge } from "@/components/shared/ui";
import styles from "../dealer.module.css";
import { FeatureFrame } from "./feature-frame";

const unitRows = [
  { container: "HAMU4124410", bl: "260101582", units: "1/4", eta: "May 11", wait: 0 },
  { container: "FANU1099065", bl: "262101511", units: "1/10", eta: "May 25", wait: 0 },
  { container: "CAAU9339653", bl: "262102090", units: "1/10", eta: "May 25", wait: 0 },
  { container: "FANU1882023", bl: "262102090", units: "1/6", eta: "May 25", wait: 0 },
  { container: "FFAU6292730", bl: "262101576", units: "2/12", eta: "May 25", wait: 2 },
];

const unitModels = [
  ["RD SPYDER F3 LTD 1330 SE6 RD S", "H7TD"],
  ["RD CANYON REDR 1330 SE6 GN EU", "J3TB"],
  ["RD SPYDER RT LTD 1330 SE6 BK D", "G1TC"],
  ["RD SPYDER F3 LTD 1330 SE6 WH E", "H9TC"],
];

export function UnitsPage() {
  const [tab, setTab] = useState("incoming");
  const [expanded, setExpanded] = useState("HAMU4124410");
  const [query, setQuery] = useState("");
  const rows = unitRows.filter((row) => `${row.container} ${row.bl}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <FeatureFrame feature="units">
      <div className={styles.featureTabs} role="tablist">
        {[{ id: "summary", label: "Зведення", icon: BarChart3 }, { id: "incoming", label: "Вхідні", icon: Download }, { id: "stock", label: "Мій склад", icon: Warehouse }, { id: "sold", label: "Продані", icon: ShoppingCart }].map(({ id, label, icon: Icon }) => <button type="button" key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}><Icon size={15} /> {label}</button>)}
      </div>
      <section className={styles.statsGrid}>
        <StatCard label="Готово прийняти" value="0" helper="VIN + двигун отримані" icon={<Check size={18} />} tone="green" />
        <StatCard label="Очікує РН" value="13" helper="Немає VIN або двигуна" icon={<Clock3 size={18} />} tone="amber" />
        <StatCard label="Прийнято" value="0" helper="Уже на складі" icon={<Warehouse size={18} />} tone="green" />
        <StatCard label="Мої одиниці" value="13" helper="15 контейнерів" icon={<Box size={18} />} tone="blue" />
      </section>
      {tab === "incoming" ? <Panel className={styles.unitsPanel}>
        <div className={styles.unitsToolbar}><div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук контейнера, BL, моделі, VIN..." /></div><span>15 відправок · 13 одиниць</span></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th /><th>Контейнер</th><th>Номер BL</th><th>Одиниці</th><th>ETA</th><th>Маршрут</th><th>Статус</th><th>Дія</th></tr></thead><tbody>
          {rows.map((row) => <Fragment key={row.container}>
            <tr className={styles.clickableRow} onClick={() => setExpanded(expanded === row.container ? "" : row.container)}><td><ChevronDown size={15} className={expanded === row.container ? styles.chevronOpen : undefined} /></td><td><strong className={styles.mono}>{row.container}</strong></td><td className={styles.mono}>{row.bl}</td><td><strong>{row.units}</strong></td><td>{row.eta}</td><td>—</td><td><StatusBadge tone="blue">● В дорозі</StatusBadge></td><td><StatusBadge tone={row.wait ? "amber" : "blue"}>{row.wait ? `${row.wait} чекає РН` : "● Вільний склад"}</StatusBadge></td></tr>
            {expanded === row.container ? <tr><td colSpan={8} className={styles.expandedCell}><p>Проформа: <strong className={styles.mono}>1032132118</strong></p><table className={styles.nestedTable}><thead><tr><th>#</th><th>Модель</th><th>Артикул</th><th>Рік</th><th>VIN</th><th>Статус</th></tr></thead><tbody>{unitModels.map(([model, sku], index) => <tr key={model}><td>{index + 1}</td><td>{model}</td><td className={styles.mono}>{sku}</td><td>2026</td><td>—</td><td><StatusBadge tone="blue">● Вільний склад</StatusBadge></td></tr>)}</tbody></table></td></tr> : null}
          </Fragment>)}
        </tbody></table></div>
      </Panel> : <Panel><EmptyState title={tab === "stock" ? "Склад поки порожній" : tab === "sold" ? "Продажів поки немає" : "Оберіть вкладку «Вхідні»"} description="Демонстраційні контейнери доступні у вкладці вхідних поставок." /></Panel>}
    </FeatureFrame>
  );
}
