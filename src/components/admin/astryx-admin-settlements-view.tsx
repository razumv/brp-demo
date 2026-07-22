"use client";

import {useLayoutEffect} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Database,
  RefreshCw,
  Search,
} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {CheckboxInput} from "@astryxdesign/core/CheckboxInput";
import {Collapsible} from "@astryxdesign/core/Collapsible";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Selector} from "@astryxdesign/core/Selector";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {
  settlementDealers,
  settlementPeriodPresets,
  settlementSyncDiagnostic,
  type SettlementDealer,
  type SettlementPeriodPresetId,
} from "@/lib/admin-settlements-data";
import type {AdminSettlementsModel, SettlementSort} from "./admin-settlements-page";
import styles from "./astryx-admin-settlements.module.css";

function formatInteger(value: number) {
  return new Intl.NumberFormat("uk-UA").format(value).replace(/[\u00a0\u202f]/g, " ");
}

function KpiGrid({model}: {model: AdminSettlementsModel}) {
  const items = [
    {id: "dealers", label: "Дилерів", value: model.visibleKpis.dealers, icon: <Building2 size={18} />, tone: "blue"},
    {id: "mapped", label: "З маппінгом", value: model.visibleKpis.mappedDealers, icon: <CheckCircle2 size={18} />, tone: "green"},
    {id: "movements", label: "Всього рухів", value: formatInteger(model.visibleKpis.movements), icon: <ArrowLeftRight size={18} />, tone: "neutral"},
  ] as const;

  return (
    <section className={styles.kpiGrid} aria-label="Показники взаєморозрахунків">
      {items.map((item) => (
        <Card key={item.id} className={styles.kpiCard} padding={3}>
          <span className={styles.kpiIcon} data-tone={item.tone}>{item.icon}</span>
          <span><small>{item.label}</small><strong>{item.value}</strong></span>
        </Card>
      ))}
    </section>
  );
}

function SyncDiagnostic({model}: {model: AdminSettlementsModel}) {
  const diagnostic = settlementSyncDiagnostic;
  const reason = "Синхронізація з 1С недоступна: доступ лише для читання.";

  return (
    <Card className={styles.diagnosticCard} padding={0}>
      <Collapsible
        isOpen={model.diagnosticOpen}
        onOpenChange={model.setDiagnosticOpen}
        trigger={(
          <span className={styles.diagnosticTrigger}>
            <StatusDot variant="warning" label="Синхронізація виконується" isPulsing />
            <strong>Оновлюється</strong>
          </span>
        )}
      >
        <div className={styles.diagnosticContent}>
          <div className={styles.diagnosticFacts}>
            <p>Остання успішна синхронізація: <strong>{diagnostic.lastSuccessfulSync}</strong></p>
            <p>Рухи синхронізовано: <strong>{diagnostic.movementsSyncedAt}</strong></p>
            <p>{diagnostic.daytimeSchedule} · {diagnostic.nighttimeSchedule}</p>
            <p>{diagnostic.liveBalanceNote}</p>
          </div>
          <div className={styles.diagnosticAside}>
            <Badge label={`${diagnostic.synchronizedMovementCount} рухів / ${diagnostic.mappingCount} маппінгів / ${diagnostic.errorCount} помилок`} variant="neutral" />
            <Banner status="error" title="Остання помилка" description={<code>{diagnostic.lastError}</code>} container="card" />
          </div>
          <div className={styles.diagnosticAction}>
            <Button
              label="Оновити з 1С (30 днів)"
              icon={<RefreshCw size={15} />}
              variant="secondary"
              isDisabled
              tooltip={reason}
            />
          </div>
        </div>
      </Collapsible>
    </Card>
  );
}

function PeriodControls({dealerId, model}: {dealerId: string; model: AdminSettlementsModel}) {
  return (
    <div className={styles.periodShell} id={`astryx-settlement-${dealerId}-detail`}>
      <div className={styles.periodControls}>
        <label className={styles.dateField}>
          <span>Дата початку періоду</span>
          <input type="date" value={model.startDate} max={model.endDate} onChange={(event) => model.setStartDate(event.target.value)} />
        </label>
        <label className={styles.dateField}>
          <span>Дата завершення періоду</span>
          <input type="date" value={model.endDate} min={model.startDate} onChange={(event) => model.setEndDate(event.target.value)} />
        </label>
        <SegmentedControl
          label="Швидкий вибір періоду"
          value={model.activePreset ?? "custom"}
          onChange={(value) => {
            if (value !== "custom") model.applyPreset(value as SettlementPeriodPresetId);
          }}
          layout="fill"
        >
          {settlementPeriodPresets.map((preset) => <SegmentedControlItem key={preset.id} value={preset.id} label={preset.label} />)}
        </SegmentedControl>
        <Button
          label="Оновити"
          icon={<RefreshCw size={15} />}
          variant="secondary"
          isDisabled
          tooltip="Оновлення балансу недоступне: доступ лише для читання."
        />
      </div>
      <Banner
        status="error"
        title={<code>{settlementSyncDiagnostic.lastError}</code>}
        description={settlementSyncDiagnostic.liveBalanceNote}
        icon={<Database size={17} />}
        container="card"
      />
    </div>
  );
}

function DealerRow({dealer, model}: {dealer: SettlementDealer; model: AdminSettlementsModel}) {
  const expanded = model.expandedDealerId === dealer.id;
  const detailId = `astryx-settlement-${dealer.id}-detail`;

  return (
    <Card className={styles.dealerCard} padding={0}>
      <button
        type="button"
        className={styles.dealerTrigger}
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={`${expanded ? "Закрити" : "Відкрити"} баланси ${dealer.name}`}
        onClick={() => model.toggleDealer(dealer.id)}
      >
        <span className={styles.dealerName}><strong>{dealer.name}</strong><small>Останній рух {dealer.movements.lastMovementDate}</small></span>
        <span className={styles.dealerMetric}><strong>{dealer.mapping.linkedCounterparties}</strong><small>балансів</small></span>
        <span className={styles.dealerMetric}><strong>{formatInteger(dealer.movements.total)}</strong><small>рухів</small></span>
        <span className={styles.dealerDate}><strong>{dealer.movements.lastMovementDate}</strong><small>останній рух</small></span>
        <span className={styles.chevron} aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      {expanded ? <PeriodControls dealerId={dealer.id} model={model} /> : null}
    </Card>
  );
}

export default function AstryxAdminSettlementsView({
  model,
  onReady,
}: {model: AdminSettlementsModel} & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-brp-admin-fulfillment-renderer="astryx">
        <Link href="/admin" className={styles.backLink}><ArrowLeft size={14} /> Назад</Link>
        <header className={styles.pageHeader}>
          <span className={styles.pageIcon}><ArrowLeftRight size={21} /></span>
          <div><h1>Взаєморозрахунки з дилерами</h1><p>Баланси дилерів з розбивкою по контрагентах в 1С (Bombardier / Bombardier СД / Sea Doo СД)</p></div>
        </header>

        <SyncDiagnostic model={model} />
        <KpiGrid model={model} />

        <Card className={styles.toolbarCard} padding={3}>
          <div className={styles.toolbar}>
            <TextInput
              label="Фільтр за дилером або 1С контрагентом"
              isLabelHidden
              value={model.query}
              onChange={model.setQuery}
              placeholder="Фільтр за дилером або 1С контрагентом…"
              hasClear
              width="100%"
              startIcon={<Search size={15} />}
            />
            <Selector
              label="Сортування дилерів"
              isLabelHidden
              value={model.sort}
              onChange={(value) => model.setSort(value as SettlementSort)}
              options={[
                {value: "name", label: "За назвою дилера"},
                {value: "movements", label: "За кількістю рухів"},
                {value: "last-movement", label: "За датою останнього руху"},
              ]}
            />
            <CheckboxInput
              label="Лише дилери з останнім рухом"
              description="09.06.2026"
              value={model.recentOnly}
              onChange={model.setRecentOnly}
              size="sm"
            />
            <span className={styles.resultCount}>{model.visibleDealers.length} з {settlementDealers.length} дилерів</span>
          </div>
        </Card>

        <section className={styles.dealerList} aria-label="Дилери">
          {model.visibleDealers.map((dealer) => <DealerRow key={dealer.id} dealer={dealer} model={model} />)}
          {model.visibleDealers.length === 0 ? (
            <Card className={styles.emptyCard} padding={4}><EmptyState title="Немає збігів" description="Змініть пошук або фільтри дилерів." icon={<Search size={34} />} /></Card>
          ) : null}
        </section>
      </main>
    </AstryxBrpUiProvider>
  );
}
