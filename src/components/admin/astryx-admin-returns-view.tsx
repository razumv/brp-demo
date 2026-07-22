"use client";

import { useLayoutEffect } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { LockKeyhole, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";
import type { AstryxRendererViewProps } from "@/components/appearance/renderer-view-switch";
import { useAppearance } from "@/components/appearance/use-appearance";
import {
  adminReturnStatusFilters,
  returnConditions,
  returnDealers,
  type ReturnCondition,
  type ReturnDealerId,
} from "@/lib/admin-returns-data";
import type { AdminReturnsModel } from "./admin-returns-page";
import styles from "./astryx-admin-returns-view.module.css";

type Props = { model: AdminReturnsModel } & AstryxRendererViewProps;

const refreshReason = "Оновлення вимкнено: доступ лише для читання.";
const createReason = "Створення чернетки заблоковано: доступ лише для читання.";

function useRendererReady(onReady: () => void) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);
}

function ReturnStatusButtons({ model }: { model: AdminReturnsModel }) {
  return (
    <div className={styles.statusScroller} role="group" aria-label="Статус повернення">
      {adminReturnStatusFilters.map((item) => (
        <Button
          key={item.id}
          label={item.label}
          size="sm"
          variant={model.status === item.id ? "primary" : "ghost"}
          aria-pressed={model.status === item.id}
          onClick={() => model.setStatus(item.id)}
        />
      ))}
    </div>
  );
}

function ReturnLinePicker({ model }: { model: AdminReturnsModel }) {
  if (!model.dealer) return null;
  if (model.dealer.eligibleLineCount === 0) {
    return <Card padding={4} variant="muted"><EmptyState isCompact title="Немає позицій для повернення" description="Для цього дилера немає доступних складських позицій." /></Card>;
  }
  if (model.dealerLines.length === 0) {
    return <Card padding={4} variant="muted"><EmptyState isCompact title={`${model.dealer.eligibleLineCount} позицій доступно`} description="Детальний склад рядків для цього дилера не зафіксований." /></Card>;
  }
  return (
    <section className={styles.lines} aria-labelledby="astryx-return-lines-title">
      <div className={styles.sectionHeader}>
        <div>
          <Heading level={3} id="astryx-return-lines-title">Позиції до повернення</Heading>
          <Text type="supporting" color="secondary">{model.dealer.name} · {model.dealer.eligibleLineCount} доступно</Text>
        </div>
        <TextInput
          label="Пошук позицій до повернення"
          isLabelHidden
          startIcon={<Search size={15} />}
          value={model.lineQuery}
          onChange={model.setLineQuery}
          placeholder="Замовлення, артикул або опис..."
          hasClear
          width="min(100%, 360px)"
        />
      </div>
      <div className={styles.lineList} role="region" aria-label="Доступні позиції дилера" tabIndex={0}>
        {model.visibleLines.map((line) => {
          const selected = model.preview.selectedLineIds.includes(line.id);
          return (
            <Card key={line.id} padding={3} variant={selected ? "orange" : "default"}>
              <div className={styles.lineGrid}>
                <CheckboxInput
                  label={`Обрати ${line.orderNumber}, ${line.partNumber}`}
                  isLabelHidden
                  value={selected}
                  onChange={() => model.toggleLine(line)}
                />
                <div>
                  <Text weight="semibold" display="block">{line.orderNumber} · {line.partNumber}</Text>
                  <Text type="supporting" color="secondary" display="block">{line.description}</Text>
                </div>
                <Text hasTabularNumbers>{line.availableQuantity} шт · ${line.unitPriceUsd.toFixed(2)}</Text>
                {selected ? (
                  <div className={styles.lineControls}>
                    <label className={styles.numberField}>
                      <span>Кількість для {line.partNumber}</span>
                      <input
                        type="number"
                        min={1}
                        max={line.availableQuantity}
                        value={model.preview.quantities[line.id] ?? line.availableQuantity}
                        onChange={(event) => model.updateQuantity(line, event.target.value)}
                      />
                    </label>
                    <Selector
                      label={`Стан для ${line.partNumber}`}
                      isLabelHidden
                      options={returnConditions.map((condition) => ({ value: condition.id, label: condition.label }))}
                      value={model.preview.conditions[line.id] ?? "unused"}
                      onChange={(value) => model.updateCondition(line.id, value as ReturnCondition)}
                      width={180}
                    />
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
        {model.visibleLines.length === 0 ? <EmptyState isCompact title="Позицій за пошуком не знайдено" /> : null}
      </div>
    </section>
  );
}

function ReturnDialog({ model, isRendererCommitted }: { model: AdminReturnsModel; isRendererCommitted: boolean }) {
  const isOpen = isRendererCommitted && model.createOpen;
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isRendererCommitted && !open) model.closeCreate();
      }}
      purpose="form"
      aria-label="Оформити повернення від дилера"
      width="min(1120px, calc(100vw - 32px))"
      maxHeight="min(820px, calc(100vh - 32px))"
    >
      <Layout
        height="fill"
        defaultHasDividers
        header={<DialogHeader title="Оформити повернення від дилера" subtitle="Оберіть дилера, позиції, кількість та стан." onOpenChange={() => model.closeCreate()} />}
        content={(
          <LayoutContent padding={4}>
            <div className={styles.dialogBody}>
              <div className={styles.dialogFields}>
                <Selector
                  label="Дилер"
                  options={[
                    { value: "", label: "Оберіть дилера" },
                    ...returnDealers.map((dealer) => ({ value: dealer.id, label: `${dealer.name} (${dealer.code})` })),
                  ]}
                  value={model.dealerId}
                  onChange={(value) => model.selectDealer(value as ReturnDealerId | "")}
                  hasSearch
                  width="100%"
                />
                <TextArea
                  label="Примітка"
                  isOptional
                  value={model.note}
                  onChange={model.setNote}
                  placeholder="Що менеджеру варто знати про це повернення."
                  rows={3}
                  width="100%"
                />
              </div>
              <ReturnLinePicker model={model} />
            </div>
          </LayoutContent>
        )}
        footer={(
          <LayoutFooter hasDivider padding={3}>
            <div className={styles.dialogFooter}>
              <Text type="supporting" hasTabularNumbers>{model.preview.selectedLineIds.length} позицій · {model.selectedUnitCount} шт</Text>
              <div className={styles.footerActions}>
                <Button label="Скасувати" variant="secondary" onClick={model.closeCreate} />
                <Button
                  label="Створити чернетку"
                  variant="primary"
                  icon={<LockKeyhole size={14} />}
                  isDisabled
                  tooltip={createReason}
                />
              </div>
            </div>
          </LayoutFooter>
        )}
      />
    </Dialog>
  );
}

export function AstryxAdminReturnsView({ model, onReady }: Props) {
  useRendererReady(onReady);
  const { renderedDesignSystem } = useAppearance();
  const isRendererCommitted = renderedDesignSystem === "astryx";

  return (
    <main className={styles.page} data-brp-admin-procurement-renderer="astryx">
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}><RotateCcw size={20} /></span>
        <div className={styles.titleCopy}>
          <Heading level={1}>Повернення</Heading>
          <Text color="secondary">Товар, який дилери фізично повернули — оформлення, затвердження, синхронізація з 1С.</Text>
        </div>
        <Button label="Оформити повернення" icon={<Plus size={14} />} variant="primary" onClick={model.openCreate} />
      </header>

      <div className={styles.toolbar}>
        <TextInput
          label="Пошук повернень"
          isLabelHidden
          startIcon={<Search size={15} />}
          value={model.query}
          onChange={model.setQuery}
          placeholder="Повернення, дилер, замовлення або нотатка..."
          hasClear
          width="100%"
        />
        <div className={styles.toolbarEnd}>
          <ReturnStatusButtons model={model} />
          <Button
            label="Оновити"
            icon={<RefreshCw size={14} />}
            variant="secondary"
            isDisabled
            tooltip={refreshReason}
          />
        </div>
      </div>

      <Card padding={6} minHeight={270}>
        <EmptyState icon={<RotateCcw size={32} />} title="Повернень не знайдено" description={model.query || model.status !== "draft" ? "Змініть пошук або статус повернення." : undefined} />
      </Card>
      <ReturnDialog model={model} isRendererCommitted={isRendererCommitted} />
    </main>
  );
}
