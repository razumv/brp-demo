"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Clock3,
  LockKeyhole,
  RefreshCw,
  Search,
} from "lucide-react";
import { RendererViewSwitch } from "@/components/appearance/renderer-view-switch";
import {
  normalizeBossWebPartQuery,
  resolveAdminBossWebLookup,
  type AdminBossWebLookupFixture,
  type AdminBossWebLookupResolution,
} from "@/lib/admin-bossweb-lookup-data";

const loadAstryxAdminBossWebLookupView = () => import("./astryx-admin-bossweb-lookup-view");

export type BossWebLookupViewProps = {
  input: string;
  resolution: AdminBossWebLookupResolution;
  onInputChange: (value: string) => void;
  onSearch: () => void;
};

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatEur(value: number) {
  return `€${value.toFixed(2)}`;
}

function LookupHeading() {
  return (
    <header>
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.04em] text-[var(--muted-foreground)]">
        <Search size={14} className="text-[var(--blue)] dark:text-[#58a6ff]" />
        <span>BOSSWEB</span>
      </div>
      <h1 className="page-title page-title-admin mt-3">Пошук запчастин</h1>
      <p className="page-description mt-1 max-w-none">Перевіряйте наявність BRP, заміни, ETA і локальний склад перед створенням замовлення.</p>
    </header>
  );
}

function LookupForm({
  value,
  onChange,
  onSubmit,
  fallback = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  fallback?: boolean;
}) {
  const disabled = fallback || !normalizeBossWebPartQuery(value);

  return (
    <form className="mt-1 flex w-full max-w-[576px] flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
      <input
        className="h-10 min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[#eaedf2] px-3 font-mono text-[13px] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--orange)] dark:bg-[#010409]"
        aria-label="Номер запчастини"
        placeholder="Введіть номер запчастини (напр. 715000005)"
        value={value}
        disabled={fallback}
        autoComplete="off"
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
      <button
        type="submit"
        disabled={disabled}
        className="button button-primary h-10 shrink-0 rounded-md px-4 text-[13px] sm:w-[108px]"
      >
        <Search size={16} />
        Пошук
      </button>
    </form>
  );
}

function BossWebCard({ fixture }: { fixture: AdminBossWebLookupFixture["bossWeb"] }) {
  return (
    <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex min-h-[53px] items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <h2 className="m-0 min-w-0 text-[15px] font-semibold">Наявність BossWeb</h2>
        <span className="shrink-0 rounded-full border border-[#b6d6f6] bg-[var(--blue-soft)] px-2 py-0.5 text-[10px] text-[var(--blue)] dark:border-[#274d70] dark:text-[#58a6ff]">
          {fixture.currencyLabel}
        </span>
        <span className="min-w-0 truncate text-[10px] text-[var(--muted-foreground)]">{fixture.cacheAge}</span>
        <button
          type="button"
          disabled
          aria-label="Оновлення даних BossWeb вимкнено"
          title="Оновлення потребує підключення до BossWeb"
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-md text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <LockKeyhole size={11} className="sr-only" />
          <RefreshCw size={15} />
        </button>
      </header>

      <div className="p-4 text-[12px]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#e3d694] bg-[var(--amber-soft)] px-2 py-0.5 text-[10px] text-[var(--amber)]">
            <Clock3 size={11} />
            {fixture.status}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]">{fixture.family}</span>
        </div>

        <strong className="mt-4 block font-mono text-[13px] font-medium">{fixture.partNumber}</strong>
        <p className="mb-0 mt-1 text-[12px] text-[var(--muted-foreground)]">{fixture.description}</p>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-[#d8d2bd] bg-[#f7f5f0] px-3 py-3 text-[12px] text-[#8a6500] dark:border-[#4b4322] dark:bg-[#221f15] dark:text-[#d4a72c]">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{fixture.warning}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-[12px] text-[var(--muted-foreground)]">
          <span>В наявності: <strong className="font-medium text-[var(--foreground)]">{fixture.inStock}</strong></span>
          <span>Бекордер: <strong className="font-medium text-[var(--amber)]">{fixture.backorder}</strong></span>
        </div>
        <div className="mt-4 border-t border-[var(--border)] pt-3 text-[12px] text-[var(--muted-foreground)]">
          Нетто: <strong className="font-medium text-[var(--foreground)]">{fixture.netUsd.toFixed(2)}</strong>
        </div>
      </div>
    </section>
  );
}

function LocalCatalogCard({ fixture }: { fixture: AdminBossWebLookupFixture["localCatalog"] }) {
  return (
    <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex min-h-[53px] items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <h2 className="m-0 text-[15px] font-semibold">Локальний каталог</h2>
        <span className="rounded-full border border-[#e3d694] bg-[var(--amber-soft)] px-2 py-0.5 text-[10px] text-[var(--amber)]">
          {fixture.currencyLabel}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 p-4 text-[12px]">
        <div className="flex items-center gap-1">
          <dt className="text-[var(--muted-foreground)]">На складі:</dt>
          <dd className="m-0 font-medium">{fixture.inStock}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="text-[var(--muted-foreground)]">Статус:</dt>
          <dd className="m-0 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px]">{fixture.status}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="text-[var(--muted-foreground)]">Дилерська ціна:</dt>
          <dd className="m-0 font-medium">{formatUsd(fixture.dealerPriceUsd)}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="text-[var(--muted-foreground)]">Роздрібна ціна:</dt>
          <dd className="m-0 font-medium">{formatUsd(fixture.retailPriceUsd)}</dd>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <dt className="text-[var(--muted-foreground)]">Дистр. ціна:</dt>
          <dd className="m-0 font-medium">{formatEur(fixture.distributorPriceEur)}</dd>
        </div>
      </dl>
    </section>
  );
}

function FoundResult({ fixture }: { fixture: AdminBossWebLookupFixture }) {
  return (
    <section className="mt-5 grid gap-4 xl:grid-cols-2" aria-label={`Результат пошуку ${fixture.query}`}>
      <BossWebCard fixture={fixture.bossWeb} />
      <LocalCatalogCard fixture={fixture.localCatalog} />
    </section>
  );
}

function LocalNoResult({ query }: { query: string }) {
  return (
    <section className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface)] p-6 text-center" role="status">
      <Search size={32} strokeWidth={1.6} className="mx-auto text-[var(--faint)]" />
      <h2 className="mb-0 mt-3 text-[15px] font-semibold">Локальних даних не знайдено</h2>
      <p className="mb-0 mt-1 text-[12px] text-[var(--muted-foreground)]">
        Для <span className="font-mono text-[var(--foreground)]">{query}</span> немає даних у каталозі. Підключення до BossWeb недоступне.
      </p>
    </section>
  );
}

function CurrentAdminBossWebLookupView({
  input,
  resolution,
  onInputChange,
  onSearch,
}: BossWebLookupViewProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <main className="page" data-admin-bossweb-renderer="current">
      <div>
        <LookupHeading />
        <LookupForm value={input} onChange={onInputChange} onSubmit={submit} />
        {resolution.state === "found" ? <FoundResult fixture={resolution.fixture} /> : null}
        {resolution.state === "not-found" ? <LocalNoResult query={resolution.query} /> : null}
      </div>
    </main>
  );
}

function AdminBossWebLookupContent() {
  const searchParams = useSearchParams();
  const parameterPart = normalizeBossWebPartQuery(searchParams.get("part"));
  const [input, setInput] = useState(parameterPart);
  const [resolvedQuery, setResolvedQuery] = useState(parameterPart);

  useEffect(() => {
    setInput(parameterPart);
    setResolvedQuery(parameterPart);
  }, [parameterPart]);

  const resolution = resolveAdminBossWebLookup(resolvedQuery);
  const search = () => {
    const normalized = normalizeBossWebPartQuery(input);
    if (!normalized) return;
    setInput(normalized);
    setResolvedQuery(normalized);
  };
  const viewProps: BossWebLookupViewProps = {
    input,
    resolution,
    onInputChange: setInput,
    onSearch: search,
  };

  return (
    <RendererViewSwitch
      slotId="admin-bossweb-lookup"
      currentView={<CurrentAdminBossWebLookupView {...viewProps} />}
      loadAstryxView={loadAstryxAdminBossWebLookupView}
      astryxViewProps={viewProps}
    />
  );
}

function BossWebLookupFallback() {
  return (
    <main className="page" aria-busy="true">
      <div>
        <LookupHeading />
        <LookupForm value="" fallback />
      </div>
    </main>
  );
}

export function AdminBossWebLookupPage() {
  return (
    <Suspense fallback={<BossWebLookupFallback />}>
      <AdminBossWebLookupContent />
    </Suspense>
  );
}
