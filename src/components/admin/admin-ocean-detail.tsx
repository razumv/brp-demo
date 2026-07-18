"use client";

import { useState } from "react";
import {
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Link2,
  Maximize2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { InlineNotice, Modal, ReadOnlyButton, StatusBadge } from "@/components/shared/ui";
import type {
  OceanBillDocumentItem,
  OceanBillOfLading,
  OceanContainer,
  OceanContainerUnit,
  OceanTrackingMilestone,
} from "@/lib/admin-ocean-freight-data";
import styles from "./admin-ocean-freight-page.module.css";

const statusMeta = {
  arrived: { label: "Прибув", tone: "green" },
  transit: { label: "В дорозі", tone: "blue" },
  soon: { label: "Скоро прибуття", tone: "amber" },
  delivered: { label: "Доставлено", tone: "green" },
} as const;

function formatEur(value: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function formatWeight(value: number) {
  return `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value)} kg`;
}

function UnitStatus({ unit }: { unit: OceanContainerUnit }) {
  return unit.assignmentStatus === "assigned" ? (
    <StatusBadge tone="green">Призначено</StatusBadge>
  ) : (
    <StatusBadge tone="amber">Не призначено</StatusBadge>
  );
}

function UnitCollection({ container }: { container: OceanContainer }) {
  const detail = container.detail;
  if (!detail) return null;

  return (
    <>
      <div className={styles.unitTableWrap}>
        <table className={`data-table ${styles.unitTable}`}>
          <thead>
            <tr>
              <th>#</th>
              <th>Модель</th>
              <th>EUR</th>
              <th>VIN</th>
              <th>Engine #</th>
              <th>Дилер</th>
              <th>Статус</th>
              <th>Інвойс</th>
            </tr>
          </thead>
          <tbody>
            {detail.units.map((unit) => (
              <tr key={unit.id}>
                <td>{unit.number}</td>
                <td><span className={styles.unitCode}>{unit.code}</span>{unit.model}</td>
                <td>{formatEur(unit.eur)}</td>
                <td className="font-mono">{unit.vin}</td>
                <td className="font-mono">{unit.engine}</td>
                <td>{unit.dealer ?? "Не призначено"}</td>
                <td><UnitStatus unit={unit} /></td>
                <td>{unit.invoiceNumber ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.unitCards}>
        {detail.units.map((unit) => (
          <article key={`${unit.id}-card`} className={styles.unitCard}>
            <div className={styles.unitCardHeader}>
              <div><span className={styles.unitCode}>{unit.code}</span><strong>{unit.model}</strong></div>
              <strong>{formatEur(unit.eur)}</strong>
            </div>
            <div className={styles.unitCardMeta}>
              <span>VIN · {unit.vin}</span>
              <span>Engine · {unit.engine}</span>
            </div>
            <UnitStatus unit={unit} />
          </article>
        ))}
      </div>
    </>
  );
}

function EvidenceLimitedContainer({ bill, container }: { bill: OceanBillOfLading; container: OceanContainer }) {
  const quantityLabel = container.cargoType === "parts" ? "Позиції" : "Одиниці";
  return (
    <div className={styles.evidenceSummary}>
      <div className={styles.summaryFacts}>
        <div className={styles.summaryFact}><span>BL</span><strong>{bill.id}</strong></div>
        <div className={styles.summaryFact}><span>Проформа</span><strong>{container.proforma}</strong></div>
        <div className={styles.summaryFact}><span>{quantityLabel}</span><strong>{container.assigned}/{container.total}</strong></div>
        <div className={styles.summaryFact}><span>EUR</span><strong>{formatEur(container.eur)}</strong></div>
      </div>
      <InlineNotice>
        Джерело підтверджує підсумок контейнера, але не повний VIN-склад. Рядки техніки не домодельовані.
      </InlineNotice>
    </div>
  );
}

function ExactContainerContent({
  bill,
  container,
  showFacts,
}: {
  bill: OceanBillOfLading;
  container: OceanContainer;
  showFacts: boolean;
}) {
  const detail = container.detail;
  if (!detail) return <EvidenceLimitedContainer bill={bill} container={container} />;

  return (
    <div className={showFacts ? styles.inlineGrid : undefined}>
      <div className={styles.unitRegion}>
        <div className={styles.unitRegionHeader}>
          <span>Одиниці ({detail.units.length})</span>
          <span>Confirmed by invoice: {detail.units.filter((unit) => unit.invoiceNumber).length}/{container.total}</span>
        </div>
        <UnitCollection container={container} />
      </div>
      {showFacts ? (
        <aside className={styles.factsRail} aria-label={`Інформація про контейнер ${container.number}`}>
          <h3 className={styles.sectionEyebrow}>Інформація про контейнер</h3>
          <dl className={styles.factList}>
            <dt>Номер контейнера</dt><dd>{container.number}</dd>
            <dt>Тип</dt><dd>{container.name}</dd>
            <dt>Номер BL</dt><dd>{bill.id}</dd>
            <dt>Проформа</dt><dd>{container.proforma}</dd>
            <dt>Вага</dt><dd>{formatWeight(detail.weightKg)}</dd>
            <dt>ETA</dt><dd>{detail.etaIso}</dd>
          </dl>
        </aside>
      ) : null}
    </div>
  );
}

export function OceanContainerDisclosure({
  bill,
  container,
  id,
  onOpenBill,
}: {
  bill: OceanBillOfLading;
  container: OceanContainer;
  id: string;
  onOpenBill: () => void;
}) {
  const meta = statusMeta[container.status];
  return (
    <section id={id} className={styles.inlineDetail} aria-label={`Вміст контейнера ${container.number}`}>
      <header className={styles.inlineHeader}>
        <Box size={15} className="text-[var(--blue)]" />
        <strong>Контейнер <span className="font-mono">{container.number}</span></strong>
        <span className={styles.inlineHeaderMeta}>— {container.name}</span>
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        {container.detail ? (
          <span className={styles.inlineHeaderMeta}>
            {container.detail.isoType} · Seal: {container.detail.seal} · {formatWeight(container.detail.weightKg)}
          </span>
        ) : null}
        <button type="button" className="button button-outline ml-auto min-h-7 px-2 text-[10px]" onClick={onOpenBill} aria-haspopup="dialog">
          <Maximize2 size={12} /> На весь екран
        </button>
      </header>
      <ExactContainerContent bill={bill} container={container} showFacts />
    </section>
  );
}

function DocumentState({ document }: { document: OceanBillDocumentItem }) {
  const label = document.state === "uploaded"
    ? "завантажено"
    : document.state === "awaiting"
      ? "очікується"
      : "Відсутнє";
  const toneClass = document.state === "uploaded"
    ? styles.documentUploaded
    : document.state === "awaiting"
      ? styles.documentAwaiting
      : styles.documentMissing;

  return <span className={`${styles.documentStatus} ${toneClass}`}>{label}</span>;
}

function Milestone({ item }: { item: OceanTrackingMilestone }) {
  const stateClass = item.state === "complete"
    ? styles.milestoneComplete
    : item.state === "current"
      ? styles.milestoneCurrent
      : "";
  return (
    <li className={`${styles.milestone} ${stateClass}`}>
      {item.label}
      {item.date ? <span className={styles.milestoneDetail}>{item.date}</span> : null}
    </li>
  );
}

export function OceanBillDetailModal({
  bill,
  open,
  onClose,
}: {
  bill: OceanBillOfLading;
  open: boolean;
  onClose: () => void;
}) {
  const [expandedContainerId, setExpandedContainerId] = useState<string | null>(bill.containers[0]?.id ?? null);

  const detail = bill.detail;
  const unitCount = bill.containers.reduce((total, container) => total + container.total, 0);
  const assignedCount = bill.containers.reduce((total, container) => total + container.assigned, 0);
  const totalWeight = bill.containers.reduce((total, container) => total + (container.detail?.weightKg ?? 0), 0);
  const route = bill.route ?? "— → —";
  const isPartsBill = bill.containers.every((container) => container.cargoType === "parts");
  const quantityNoun = isPartsBill ? "позицій" : "одиниць";
  const modalEta = detail?.modalEtaLabel ?? bill.eta;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={bill.id}
      className={styles.billModal}
      bodyClassName={styles.billModalBody}
      headerMeta={(
        <div className={styles.billHeaderMeta}>
          <span className={styles.billHeaderRoute}>{route}</span>
          <span className="text-[var(--muted-foreground)]">ETA</span>
          <strong>{modalEta}</strong>
          <StatusBadge tone={statusMeta[bill.status === "mixed" ? "transit" : bill.status].tone}>
            {bill.status === "mixed" ? "Змішаний" : statusMeta[bill.status].label}
          </StatusBadge>
        </div>
      )}
      headerActions={(
        <>
          <ReadOnlyButton className="!h-8 !min-h-8 !px-2" aria-label="Оновити ETA для цього коносамента">
            <RefreshCw size={13} /><span className={styles.headerActionLabel}>Оновити ETA</span>
          </ReadOnlyButton>
          <ReadOnlyButton className="!h-8 !min-h-8 !px-2" aria-label="Завантажити документи цього коносамента">
            <Upload size={13} /><span className={styles.headerActionLabel}>Завантажити документи</span>
          </ReadOnlyButton>
        </>
      )}
    >
      <div className={styles.billLayout}>
        <div className={styles.billMain}>
          <section className={styles.detailSection}>
            <header className={styles.detailSectionHeader}>
              <Box size={14} />
              <strong>Контейнери</strong>
              <span>{bill.containers.length} container · {unitCount} {quantityNoun}{totalWeight ? ` · ${formatWeight(totalWeight)}` : ""}</span>
            </header>
            <div className={styles.billContainerList}>
              {bill.containers.map((container) => {
                const isExpanded = expandedContainerId === container.id;
                const contentId = `bill-${bill.id}-container-${container.id}`;
                return (
                  <article key={container.id} className={styles.billContainer}>
                    <button
                      type="button"
                      className={styles.billContainerSummary}
                      aria-expanded={isExpanded}
                      aria-controls={contentId}
                      onClick={() => setExpandedContainerId((current) => current === container.id ? null : container.id)}
                    >
                      <ChevronDown size={14} className={`${styles.disclosureChevron} ${isExpanded ? styles.disclosureChevronOpen : ""}`} />
                      <strong className="font-mono">{container.number}</strong>
                      {container.detail ? <StatusBadge tone="orange">{container.detail.isoType}</StatusBadge> : null}
                      <span className={styles.billContainerSummaryMeta}>
                        {container.detail ? `Seal: ${container.detail.seal} · ` : ""}{container.total} {container.cargoType === "parts" ? "позицій" : "одиниць"}{container.detail ? ` · ${formatWeight(container.detail.weightKg)}` : ""}
                      </span>
                      {container.detail ? <StatusBadge tone="green">Loaded</StatusBadge> : null}
                    </button>
                    {isExpanded ? (
                      <div id={contentId} className={styles.billContainerBody}>
                        <ExactContainerContent bill={bill} container={container} showFacts={false} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.detailSection}>
            <header className={styles.detailSectionHeader}>
              <Link2 size={14} />
              <strong>Пов&apos;язані проформи</strong>
            </header>
            <ul className={styles.proformaList}>
              {bill.containers.map((container) => (
                <li key={container.proforma} className={styles.proformaRow}>
                  <span><Link2 size={11} className="mr-2 inline text-[var(--blue)]" /><strong className="font-mono text-[var(--blue)]">{container.proforma}</strong></span>
                  <span className="text-[var(--muted-foreground)]">{container.total} {container.cargoType === "parts" ? "позицій" : "одиниць"}</span>
                  <strong>{formatEur(container.eur)}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.billRail} aria-label={`Деталі BL ${bill.id}`}>
          <section className={styles.railSection}>
            <h3 className={styles.sectionEyebrow}>Інформація про BL</h3>
            <dl className={styles.factList}>
              <dt>Номер BL</dt><dd>{bill.id}</dd>
              <dt>Судно</dt><dd>{detail?.vessel ?? "—"}</dd>
              <dt>Маршрут</dt><dd>{route}</dd>
              <dt>ETD</dt><dd>{detail?.etd ?? "—"}</dd>
              <dt>ETA</dt><dd>{modalEta}</dd>
              <dt>Днів у дорозі</dt><dd>{detail?.daysInTransit ?? "—"}</dd>
              <dt>Контейнери</dt><dd>{bill.containers.length}</dd>
              <dt>Всього {quantityNoun}</dt><dd>{unitCount}</dd>
              <dt>Загальна вага</dt><dd>{totalWeight ? formatWeight(totalWeight) : "Не зафіксовано"}</dd>
            </dl>
          </section>

          <section className={styles.railSection}>
            <h3 className={styles.sectionEyebrow}>Приходные 1C</h3>
            {detail ? (
              <div className={styles.receiptState}>
                <CheckCircle2 size={16} />
                <div>
                  <strong>Техніка · проведена</strong>
                  <span>1C документів: {detail.oneCReceipt.documentCount} · проведено: {detail.oneCReceipt.postedCount} · {detail.oneCReceipt.postedAt}</span>
                </div>
              </div>
            ) : (
              <InlineNotice>Деталі 1C не зафіксовані у source evidence.</InlineNotice>
            )}
          </section>

          <section className={styles.railSection}>
            <h3 className={styles.sectionEyebrow}>Зведення по відправці</h3>
            <div className={styles.metricGrid}>
              <div className={styles.metricCard}><strong className="text-[var(--green)]">{assignedCount}</strong><span>{isPartsBill ? "Зафіксовано" : "Призначено"}</span></div>
              <div className={styles.metricCard}><strong className="text-[var(--amber)]">{unitCount - assignedCount}</strong><span>{isPartsBill ? "Не зафіксовано" : "Не призначено"}</span></div>
              <div className={styles.metricCard}><strong className="text-[var(--blue)]">{detail ? detail.freeWarehouseUnits : "—"}</strong><span>Вільний склад</span></div>
              <div className={styles.metricCard}><strong>{unitCount}</strong><span>Всього {quantityNoun}</span></div>
            </div>
          </section>

          <section className={styles.railSection}>
            <h3 className={styles.sectionEyebrow}>Документи</h3>
            {detail ? (
              <ul className={styles.documentList}>
                {detail.documents.map((document) => (
                  <li key={document.id} className={styles.documentRow}>
                    <FileText size={13} />
                    <span>{document.label}</span>
                    <span className="flex items-center gap-2">
                      <DocumentState document={document} />
                      {document.action !== "none" ? (
                        <button type="button" disabled className="icon-button !h-6 !w-6" title="Демо: лише перегляд" aria-label={`${document.action === "download" ? "Завантажити" : "Додати"} ${document.label}`}>
                          {document.action === "download" ? <Download size={12} /> : <Upload size={12} />}
                        </button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <InlineNotice>Склад документів не зафіксований у source evidence.</InlineNotice>
            )}
          </section>

          <section className={styles.railSection}>
            <h3 className={styles.sectionEyebrow}>Хронологія відстеження</h3>
            {detail ? <ol className={styles.timeline}>{detail.milestones.map((item) => <Milestone key={item.id} item={item} />)}</ol> : (
              <InlineNotice>Milestones не зафіксовані у source evidence.</InlineNotice>
            )}
          </section>
        </aside>
      </div>
    </Modal>
  );
}
