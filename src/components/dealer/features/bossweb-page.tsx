"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmptyState, InlineNotice, Panel, StatusBadge } from "@/components/shared/ui";
import {
  findBossWebReferencePart,
  normalizeBossWebQuery,
  type BossWebReferencePart,
} from "@/lib/dealer/bossweb-data";
import { formatMoney } from "@/lib/mock-data";
import { SectionHeading } from "../common";
import dealerStyles from "../dealer.module.css";
import operationalStyles from "./operational-features.module.css";
import { FeatureFrame } from "./feature-frame";

type BossWebLookupState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "found"; part: BossWebReferencePart }>
  | Readonly<{ status: "not-found"; query: string }>;

const initialQuery = "9779150";
const initialPart = findBossWebReferencePart(initialQuery);

function initialLookupState(): BossWebLookupState {
  return initialPart
    ? { status: "found", part: initialPart }
    : { status: "idle" };
}

export function BossWebPage() {
  const [input, setInput] = useState(initialQuery);
  const [lookup, setLookup] = useState<BossWebLookupState>(initialLookupState);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = normalizeBossWebQuery(input);
    if (!query) {
      setLookup({ status: "idle" });
      return;
    }
    const part = findBossWebReferencePart(query);
    setLookup(part
      ? { status: "found", part }
      : { status: "not-found", query });
  };

  return (
    <FeatureFrame feature="bossweb">
      <InlineNotice>
        Пошук виконується лише в локальному довіднику. Онлайн-наявність BossWeb, заміни та ETA не завантажуються.
      </InlineNotice>

      <form className={`${dealerStyles.bossSearch} ${operationalStyles.bossSearch}`} onSubmit={submit} aria-label="Пошук у локальному довіднику">
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Номер запчастини"
          placeholder="Введіть номер запчастини"
          autoComplete="off"
          spellCheck={false}
        />
        <button className="button button-primary" type="submit"><Search size={16} /> Пошук</button>
      </form>

      {lookup.status === "found" ? (
        <section className={dealerStyles.bossGrid} aria-live="polite">
          <Panel>
            <SectionHeading title="Результат локального пошуку" action={<StatusBadge tone="neutral">{lookup.part.category}</StatusBadge>} />
            <div className={dealerStyles.bossContent}>
              <strong className={dealerStyles.mono}>{lookup.part.number}</strong>
              <p>{lookup.part.description}</p>
              <dl className={operationalStyles.bossMeta}>
                <div><dt>Позначення на схемі</dt><dd>{lookup.part.reference}</dd></div>
                <div><dt>Джерело</dt><dd>Локальний довідник</dd></div>
              </dl>
              <InlineNotice>Дані про віддалену наявність і терміни постачання відсутні.</InlineNotice>
            </div>
          </Panel>
          <Panel>
            <SectionHeading title="Локальний каталог" />
            <dl className={dealerStyles.catalogStock}>
              <div><dt>На складі:</dt><dd>{lookup.part.localStock}</dd></div>
              <div><dt>Статус:</dt><dd><StatusBadge tone={lookup.part.localStock ? "green" : "neutral"}>{lookup.part.localStock ? "В наявності" : "Немає"}</StatusBadge></dd></div>
              <div><dt>Дилерська ціна:</dt><dd>{formatMoney(lookup.part.dealerPrice)}</dd></div>
              <div><dt>Роздрібна ціна:</dt><dd>{formatMoney(lookup.part.retailPrice)}</dd></div>
            </dl>
          </Panel>
        </section>
      ) : null}

      {lookup.status === "not-found" ? (
        <Panel>
          <div aria-live="polite">
            <EmptyState
              icon={<Search size={25} />}
              title="Запчастину не знайдено"
              description={`У локальному довіднику немає номера ${lookup.query}. Перевірте введене значення.`}
            />
          </div>
        </Panel>
      ) : null}

      {lookup.status === "idle" ? (
        <Panel>
          <EmptyState
            icon={<Search size={25} />}
            title="Введіть номер запчастини"
            description="Пошук доступний для записів локального довідника."
          />
        </Panel>
      ) : null}
    </FeatureFrame>
  );
}
