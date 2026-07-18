"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  LockKeyhole,
  Pause,
  Play,
  Search,
  Terminal,
  Trash2,
} from "lucide-react";
import {
  adminQueueSummary,
  adminTaskCards,
  adminTasksIntegrationNote,
  catalogBrands,
  catalogSyncModes,
  catalogSyncPresets,
  catalogSyncTargets,
  initialCatalogSyncSelection,
  SAFE_UPDATE_ORDER_HELPER,
  SAFE_UPDATE_ORDER_TITLE,
  type CatalogBrandId,
  type CatalogSyncModeId,
  type CatalogSyncPreset,
  type CatalogSyncSelection,
  type CatalogSyncTargetId,
} from "@/lib/admin-tasks-data";

function sameSelection(left: CatalogSyncSelection, right: CatalogSyncSelection) {
  return left.tree === right.tree
    && left.images === right.images
    && left.parts === right.parts
    && left.brand === right.brand
    && left.mode === right.mode;
}

function DisabledRunButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Запуск вимкнено у read-only демонстрації"
      className="button button-primary min-h-10 shrink-0 rounded-lg px-4 disabled:opacity-70 dark:border-[#f97316] dark:bg-[#f97316]"
    >
      <LockKeyhole size={12} className="sr-only" />
      <Play size={15} />
      {label}
    </button>
  );
}

function QueueStatusCard() {
  const queue = adminQueueSummary;

  return (
    <section className="flex min-h-[92px] items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:items-center">
      <div className="min-w-0">
        <h2 className="m-0 text-[20px] font-bold leading-6">Статус черги</h2>
        <p className="mb-0 mt-0.5 text-[12px] leading-[18px] text-[var(--muted-foreground)]">
          <span className="text-[var(--green)]">Workers: {queue.workers}</span>
          {" | Active: "}{queue.active}
          {" | Waiting: "}{queue.waiting}
          {" | Done: "}{queue.done}
          {" | Failed: "}{queue.failed}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled
          title="Керування чергою вимкнено у read-only демонстрації"
          className="button min-h-9 border border-[#f0c9b5] bg-[var(--orange-soft)] px-3 text-[var(--orange)] disabled:opacity-65"
        >
          <LockKeyhole size={12} className="sr-only" />
          <Pause size={14} />
          Пауза
        </button>
        <button
          type="button"
          disabled
          title="Очищення черги вимкнено у read-only демонстрації"
          className="button min-h-9 border border-[#efc5c7] bg-[var(--red-soft)] px-3 text-[#d1242f] disabled:opacity-65 dark:text-[#f85149]"
        >
          <LockKeyhole size={12} className="sr-only" />
          <Trash2 size={14} />
          Очистити
        </button>
      </div>
    </section>
  );
}

function TargetCheckbox({
  target,
  checked,
  onChange,
}: {
  target: (typeof catalogSyncTargets)[number];
  checked: boolean;
  onChange: (target: CatalogSyncTargetId, checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(target.id, event.target.checked)}
      />
      <span
        className={`grid size-9 shrink-0 place-items-center border text-white ${checked ? "border-[var(--orange)] bg-[var(--orange)] dark:border-[#f97316] dark:bg-[#f97316]" : "border-[var(--faint)] bg-[var(--surface)]"}`}
        aria-hidden="true"
      >
        {checked ? <Check size={28} strokeWidth={3} /> : null}
      </span>
      <span>{target.label}</span>
    </label>
  );
}

function SyncSelects({
  selection,
  onBrandChange,
  onModeChange,
}: {
  selection: CatalogSyncSelection;
  onBrandChange: (brand: CatalogBrandId) => void;
  onModeChange: (mode: CatalogSyncModeId) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex items-center gap-2 text-[12px] font-medium max-sm:justify-between">
        <span>Бренд:</span>
        <select
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-[13px] outline-none focus:border-[var(--orange)] sm:w-[158px] sm:flex-none dark:bg-[#0d1117]"
          value={selection.brand}
          onChange={(event) => onBrandChange(event.target.value as CatalogBrandId)}
        >
          {catalogBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.label}</option>)}
        </select>
      </label>

      <label className="flex items-center gap-2 text-[12px] font-medium max-sm:justify-between">
        <span>Режим:</span>
        <select
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-[13px] outline-none focus:border-[var(--orange)] sm:w-[232px] sm:flex-none dark:bg-[#0d1117]"
          value={selection.mode}
          onChange={(event) => onModeChange(event.target.value as CatalogSyncModeId)}
        >
          {catalogSyncModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
        </select>
      </label>
    </div>
  );
}

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: CatalogSyncPreset;
  selected: boolean;
  onSelect: (preset: CatalogSyncPreset) => void;
}) {
  return (
    <article className="flex min-h-[90px] items-start gap-3 rounded-md border border-[var(--border)] bg-transparent p-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--orange-soft)] text-[11px] font-bold text-[var(--orange)]">
        {preset.step}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 text-[13px] font-semibold leading-[17px]">{preset.title}</h3>
        <p className="mb-0 mt-0.5 text-[11px] leading-[14px] text-[var(--muted-foreground)]">{preset.helper}</p>
      </div>
      <button
        type="button"
        aria-pressed={selected}
        className={`button min-h-9 shrink-0 bg-transparent px-3 text-[11px] ${selected ? "border-2 border-[#d4a72c] text-[var(--foreground)]" : "border border-[var(--border)] text-[var(--foreground)]"}`}
        onClick={() => onSelect(preset)}
      >
        Обрати
      </button>
    </article>
  );
}

function IntegrationNote() {
  return (
    <aside className="flex items-start gap-2 rounded-md border border-[#e7c8b7] bg-[var(--orange-soft)] p-3 text-[11px] leading-[15px] dark:border-[#6f4428]" aria-label={adminTasksIntegrationNote.title}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--orange)]" />
      <div className="min-w-0">
        <h3 className="m-0 text-[13px] font-semibold text-[var(--foreground)]">{adminTasksIntegrationNote.title}</h3>
        {adminTasksIntegrationNote.lines.map((line) => (
          <p key={line} className="mb-0 mt-1 text-[var(--muted-foreground)]">{line}</p>
        ))}
      </div>
    </aside>
  );
}

function CatalogSyncCard() {
  const [selection, setSelection] = useState<CatalogSyncSelection>({ ...initialCatalogSyncSelection });

  const activePresetId = useMemo(
    () => catalogSyncPresets.find((preset) => sameSelection(preset.selection, selection))?.id ?? null,
    [selection],
  );
  const mode = catalogSyncModes.find((item) => item.id === selection.mode) ?? catalogSyncModes[0];

  const setTarget = (target: CatalogSyncTargetId, checked: boolean) => {
    setSelection((current) => ({ ...current, [target]: checked }));
  };

  const applyPreset = (preset: CatalogSyncPreset) => {
    setSelection({ ...preset.selection });
  };

  return (
    <section className="rounded-lg border border-[#efc2a8] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] dark:border-[#75452c] max-sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Terminal size={21} className="mt-0.5 shrink-0 text-[var(--orange)]" />
          <div className="min-w-0">
            <h2 className="m-0 text-[18px] font-bold leading-[22px]">{adminTaskCards.catalogSync.title}</h2>
            <p className="mb-0 mt-1 text-[12px] leading-[17px] text-[var(--muted-foreground)]">{adminTaskCards.catalogSync.description}</p>
          </div>
        </div>
        <DisabledRunButton label={adminTaskCards.catalogSync.actionLabel} />
      </header>

      <div className="mt-4 bg-[var(--surface-subtle)] p-4 dark:bg-[#0d1117]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {catalogSyncTargets.map((target) => (
            <TargetCheckbox
              key={target.id}
              target={target}
              checked={selection[target.id]}
              onChange={setTarget}
            />
          ))}
        </div>

        <div className="mt-3">
          <SyncSelects
            selection={selection}
            onBrandChange={(brand) => setSelection((current) => ({ ...current, brand }))}
            onModeChange={(nextMode) => setSelection((current) => ({ ...current, mode: nextMode }))}
          />
        </div>

        <p className="mb-0 mt-4 text-[11px] leading-[15px] text-[var(--muted-foreground)]">{mode.helper}</p>

        <div className="my-4 border-t border-[var(--border)]" />

        <div>
          <h3 className="m-0 text-[10px] font-semibold tracking-[0.02em] text-[var(--muted-foreground)]">{SAFE_UPDATE_ORDER_TITLE}</h3>
          <p className="mb-0 mt-1 text-[11px] leading-[15px] text-[var(--muted-foreground)]">{SAFE_UPDATE_ORDER_HELPER}</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {catalogSyncPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={activePresetId === preset.id}
              onSelect={applyPreset}
            />
          ))}
        </div>

        <div className="mt-4">
          <IntegrationNote />
        </div>
      </div>
    </section>
  );
}

function SkuTaskCard() {
  return (
    <section className="flex min-h-[100px] items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <Clock3 size={20} className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
        <div className="min-w-0">
          <h2 className="m-0 text-[18px] font-bold leading-[22px]">{adminTaskCards.skuSync.title}</h2>
          <p className="mb-0 mt-1 text-[12px] leading-[17px] text-[var(--muted-foreground)]">{adminTaskCards.skuSync.description}</p>
        </div>
      </div>
      <DisabledRunButton label={adminTaskCards.skuSync.actionLabel} />
    </section>
  );
}

function DangerZone() {
  return (
    <section className="overflow-hidden rounded-lg border border-[#efc5c7] bg-[var(--surface)] shadow-[var(--shadow-card)] dark:border-[#6e3034]">
      <header className="flex min-h-[50px] items-center gap-2 border-b border-[#efc5c7] bg-[var(--red-soft)] px-6 text-[#d1242f] dark:border-[#6e3034] dark:text-[#f85149]">
        <AlertTriangle size={18} />
        <h2 className="m-0 text-[18px] font-bold">Небезпечна зона</h2>
      </header>
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <h3 className="m-0 text-[20px] font-bold leading-6">{adminTaskCards.resetAll.title}</h3>
          <p className="mb-0 mt-1 max-w-[680px] text-[12px] leading-[17px] text-[var(--muted-foreground)]">{adminTaskCards.resetAll.description}</p>
        </div>
        <button
          type="button"
          disabled
          title="Скидання вимкнено у read-only демонстрації"
          className="button min-h-9 shrink-0 border border-transparent bg-[var(--red-soft)] px-4 text-[#d1242f] disabled:opacity-65 dark:text-[#f85149]"
        >
          <LockKeyhole size={12} className="sr-only" />
          <Trash2 size={14} />
          {adminTaskCards.resetAll.actionLabel}
        </button>
      </div>
    </section>
  );
}

export function AdminTasksPage() {
  const [query, setQuery] = useState("");

  return (
    <main className="page">
      <div className="max-w-[896px] space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <Terminal size={27} />
            <h1 className="page-title page-title-admin">Фонові завдання</h1>
          </div>
          <p className="page-description">Запуск адміністративних завдань та операцій обслуговування</p>
        </header>

        <label className="relative block w-full xl:w-[200px]">
          <span className="sr-only">Пошук за завданнями, чергою, синхронізаціями</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[#eaedf2] py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[var(--orange)] dark:bg-[#010409]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук за завданнями, чергою, синхронізаціями..."
            autoComplete="off"
          />
        </label>

        <QueueStatusCard />
        <CatalogSyncCard />
        <SkuTaskCard />
        <DangerZone />
      </div>
    </main>
  );
}
