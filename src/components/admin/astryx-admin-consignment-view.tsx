"use client";

import {useLayoutEffect, useMemo} from "react";
import {Download, RefreshCw} from "lucide-react";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {TextInput} from "@astryxdesign/core/TextInput";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {
  CONSIGNMENT_SOURCE_TOTALS,
  consignmentHolders,
  consignmentRequestFilters,
  consignmentRequests,
} from "@/lib/admin-consignment-data";
import type {ConsignmentPageViewProps} from "./admin-consignment-page";
import styles from "./astryx-admin-consignment.module.css";

const views = [
  {id: "warehouse", label: "Весь склад"},
  {id: "network", label: "Мережа"},
  {id: "requests", label: "Заявки"},
] as const;

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

function holderQuantity(position: ConsignmentPageViewProps["filteredPositions"][number], holderId: string) {
  return position.quantities[holderId as keyof typeof position.quantities] ?? 0;
}

function MobilePositionCards({positions}: {positions: ConsignmentPageViewProps["filteredPositions"]}) {
  return <div className={styles.mobileCards}>{positions.map((position) => (
    <Card key={position.partNumber} padding={3}>
      <strong>{position.partNumber}</strong><p>{position.description}</p><b>{position.total} од.</b>
    </Card>
  ))}</div>;
}

function WarehouseMatrix({positions}: {positions: ConsignmentPageViewProps["filteredPositions"]}) {
  return (
    <>
      <Card className={styles.matrixCard} padding={0}>
        <div className={styles.matrixScroll} role="region" aria-label="Залишки по 16 дилерах" tabIndex={0}>
          <table className={styles.matrix}>
            <caption className="sr-only">Матриця складських залишків по дилерській мережі</caption>
            <colgroup><col /><col /><col />{consignmentHolders.map((holder) => <col key={holder.id} />)}</colgroup>
            <thead><tr><th scope="col">Артикул</th><th scope="col">Опис</th><th scope="col">Разом</th>{consignmentHolders.map((holder) => <th key={holder.id} scope="col">{holder.name}</th>)}</tr></thead>
            <tbody>{positions.map((position) => <tr key={position.partNumber}><th scope="row">{position.partNumber}</th><td>{position.description}</td><td>{position.total}</td>{consignmentHolders.map((holder) => { const quantity = holderQuantity(position, holder.id); return <td key={holder.id}>{quantity || <span>—</span>}</td>; })}</tr>)}</tbody>
          </table>
        </div>
      </Card>
      <MobilePositionCards positions={positions} />
    </>
  );
}

function NetworkTable({positions}: {positions: ConsignmentPageViewProps["filteredPositions"]}) {
  return (
    <>
      <Card className={styles.networkCard} padding={0}>
        <div className={styles.networkScroll} role="region" aria-label="Залишки мережі" tabIndex={0}>
          <table className={styles.networkTable}>
            <caption className="sr-only">Мережеві залишки та їхні держателі</caption>
            <thead><tr><th scope="col">Артикул</th><th scope="col">Опис</th><th scope="col">Разом</th><th scope="col">Тримачі</th></tr></thead>
            <tbody>{positions.map((position) => <tr key={position.partNumber}><th scope="row">{position.partNumber}</th><td>{position.description}</td><td>{position.total}</td><td>{consignmentHolders.flatMap((holder) => { const quantity = holderQuantity(position, holder.id); return quantity ? [<span key={holder.id} className={styles.holder}>{holder.name} <b>{quantity}</b></span>] : []; })}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <MobilePositionCards positions={positions} />
    </>
  );
}

export default function AstryxAdminConsignmentView({
  activeView,
  query,
  requestStatus,
  holder,
  filteredPositions,
  hasQuery,
  warehouseCount,
  networkCount,
  networkUnits,
  searchPlaceholder,
  onActiveViewChange,
  onQueryChange,
  onRequestStatusChange,
  onHolderChange,
  onReady,
}: ConsignmentPageViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  const requests = useMemo(() => {
    const statusRequests = requestStatus === "all" ? consignmentRequests : consignmentRequests.filter((request) => request.status === requestStatus);
    const normalizedQuery = normalize(query);
    return normalizedQuery ? statusRequests.filter((request) => normalize(`${request.id} ${request.dealer} ${request.partNumber} ${request.oneCReference ?? ""}`).includes(normalizedQuery)) : statusRequests;
  }, [query, requestStatus]);

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-brp-admin-renderer="astryx">
        <header className={styles.header}><div><h1>Консигнація</h1><p>Складські залишки по мережі, заявки дилерів, переміщення 1С</p></div></header>
        <section className={styles.toolbar} aria-label="Пошук і фільтри консигнації">
          <TextInput label={searchPlaceholder} isLabelHidden value={query} onChange={onQueryChange} placeholder={searchPlaceholder} hasClear width="100%" />
          <TabList aria-label="Розділи консигнації" value={activeView} onChange={(value) => onActiveViewChange(value as ConsignmentPageViewProps["activeView"])} hasDivider>
            {views.map((view) => <Tab key={view.id} value={view.id} label={view.label} />)}
          </TabList>
          {activeView === "requests" ? (
            <SegmentedControl label="Статус заявки" value={requestStatus} onChange={(value) => onRequestStatusChange(value as ConsignmentPageViewProps["requestStatus"])} layout="fill">
              {consignmentRequestFilters.map((filter) => <SegmentedControlItem key={filter.id} value={filter.id} label={filter.label} />)}
            </SegmentedControl>
          ) : (
            <Selector label="Тримач консигнації" isLabelHidden value={holder} onChange={(value) => onHolderChange(value as ConsignmentPageViewProps["holder"])} options={[{value: "all", label: "Усі тримачі"}, ...consignmentHolders.map((item) => ({value: item.id, label: item.name}))]} />
          )}
        </section>

        {activeView === "warehouse" ? <section id="consignment-warehouse-panel" role="tabpanel" aria-label="Весь склад" className={styles.panel}>
          <div className={styles.summary}><div><strong>{warehouseCount} запчастин · {CONSIGNMENT_SOURCE_TOTALS.dealers} дилерів</strong><p>Репрезентативна вибірка: {filteredPositions.length} з {hasQuery ? "результатів локальної вибірки" : CONSIGNMENT_SOURCE_TOTALS.parts}.</p></div><Button label="Експорт CSV" icon={<Download size={15} />} variant="secondary" isDisabled tooltip="Експорт потребує підключення до облікової системи." /></div>
          <WarehouseMatrix positions={filteredPositions} />
        </section> : null}
        {activeView === "network" ? <section id="consignment-network-panel" role="tabpanel" aria-label="Мережа" className={styles.panel}>
          <div className={styles.summary}><div><strong>{networkCount} позицій · {networkUnits} од.</strong><p>Показано {networkCount} з {CONSIGNMENT_SOURCE_TOTALS.parts}. Репрезентативна локальна вибірка: {filteredPositions.length} рядків.</p></div></div>
          <NetworkTable positions={filteredPositions} />
        </section> : null}
        {activeView === "requests" ? <section id="consignment-requests-panel" role="tabpanel" aria-label="Заявки" className={styles.panel}>
          <Card padding={4}><div className={styles.requestsHeader}><span>Статус заявки обирається у фільтрах.</span><Button label="Оновити" icon={<RefreshCw size={15} />} variant="secondary" isDisabled tooltip="Оновлення потребує підключення до облікової системи." /></div><div className={styles.requestEmpty} aria-live="polite">{requests.length === 0 ? <p>{normalize(query) ? "Заявок за пошуком не знайдено." : "Немає заявок з цим статусом."}</p> : null}</div></Card>
        </section> : null}
      </main>
    </AstryxBrpUiProvider>
  );
}
