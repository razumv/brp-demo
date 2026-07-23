"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BrpCard, BrpTextInput } from "@/components/brp-ui";
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = normalizeBossWebQuery(input);
      if (!query) {
        setLookup({ status: "idle" });
        return;
      }
      const part = findBossWebReferencePart(query);
      setLookup(part
        ? { status: "found", part }
        : { status: "not-found", query });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [input]);

  return (
    <FeatureFrame feature="bossweb">
      <InlineNotice>
        Дані про онлайн-наявність BossWeb, заміни та ETA стануть доступні після підключення сервісу.
      </InlineNotice>

      <div className={`${dealerStyles.bossSearch} ${operationalStyles.bossSearch}`}>
        <BrpTextInput
          type="search"
          value={input}
          onValueChange={setInput}
          label="Номер запчастини"
          hideLabel
          leadingIcon={<Search size={16} />}
          placeholder="Введіть номер запчастини"
          clearable
        />
      </div>

      {lookup.status === "found" ? (
        <section className={dealerStyles.bossGrid} aria-live="polite">
          <BrpCard padding="md">
            <SectionHeading title="Результат пошуку" action={<StatusBadge tone="neutral">{lookup.part.category}</StatusBadge>} />
            <div className={dealerStyles.bossContent}>
              <strong className={dealerStyles.mono}>{lookup.part.number}</strong>
              <p>{lookup.part.description}</p>
              <dl className={operationalStyles.bossMeta}>
                <div><dt>Позначення на схемі</dt><dd>{lookup.part.reference}</dd></div>
                <div><dt>Джерело</dt><dd>Довідник запчастин</dd></div>
              </dl>
              <InlineNotice>Дані про віддалену наявність і терміни постачання відсутні.</InlineNotice>
            </div>
          </BrpCard>
          <BrpCard padding="md">
            <SectionHeading title="Каталог дилера" />
            <dl className={dealerStyles.catalogStock}>
              <div><dt>На складі:</dt><dd>{lookup.part.localStock}</dd></div>
              <div><dt>Статус:</dt><dd><StatusBadge tone={lookup.part.localStock ? "green" : "neutral"}>{lookup.part.localStock ? "В наявності" : "Немає"}</StatusBadge></dd></div>
              <div><dt>Дилерська ціна:</dt><dd>{formatMoney(lookup.part.dealerPrice)}</dd></div>
              <div><dt>Роздрібна ціна:</dt><dd>{formatMoney(lookup.part.retailPrice)}</dd></div>
            </dl>
          </BrpCard>
        </section>
      ) : null}

      {lookup.status === "not-found" ? (
        <Panel>
          <div aria-live="polite">
            <EmptyState
              icon={<Search size={25} />}
              title="Запчастину не знайдено"
              description={`У довіднику немає номера ${lookup.query}. Перевірте введене значення.`}
            />
          </div>
        </Panel>
      ) : null}

      {lookup.status === "idle" ? (
        <Panel>
          <EmptyState
            icon={<Search size={25} />}
            title="Введіть номер запчастини"
            description="Пошук почнеться автоматично після введення номера."
          />
        </Panel>
      ) : null}
    </FeatureFrame>
  );
}
