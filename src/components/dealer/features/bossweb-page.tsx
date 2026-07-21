"use client";

import { Clock3, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { EmptyState, InlineNotice, Panel, StatusBadge } from "@/components/shared/ui";
import { formatMoney, getPart } from "@/lib/mock-data";
import { SectionHeading } from "../common";
import styles from "../dealer.module.css";
import { FeatureFrame } from "./feature-frame";

export function BossWebPage() {
  const [input, setInput] = useState("9779150");
  const [query, setQuery] = useState("9779150");
  const part = query === "9779150" ? getPart("9779150") : undefined;
  return (
    <FeatureFrame feature="bossweb">
      <form className={styles.bossSearch} onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()); }}><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Номер запчастини" placeholder="Введіть номер запчастини" /><button className="button button-primary" type="submit"><Search size={16} /> Пошук</button></form>
      {part ? <section className={styles.bossGrid}>
        <Panel><SectionHeading title="Наявність BossWeb" action={<RefreshCw size={15} />} /><div className={styles.bossContent}><div><StatusBadge tone="amber"><Clock3 size={11} /> Бекордер</StatusBadge><small>ATV</small></div><strong className={styles.mono}>{part.number}</strong><p>{part.description}</p><InlineNotice tone="warning">Contact PAA Support Quantity : 12</InlineNotice><footer><span>В наявності: <strong>0</strong></span><span>Бекордер: <strong>12</strong></span></footer></div></Panel>
        <Panel><SectionHeading title="Локальний каталог" /><dl className={styles.catalogStock}><div><dt>На складі:</dt><dd>{part.stock}</dd></div><div><dt>Статус:</dt><dd><StatusBadge tone="neutral">1</StatusBadge></dd></div><div><dt>Дилерська ціна:</dt><dd>{formatMoney(part.dealerPrice)}</dd></div><div><dt>Роздрібна ціна:</dt><dd>{formatMoney(part.retailPrice)}</dd></div></dl></Panel>
      </section> : <Panel><EmptyState icon={<Search size={25} />} title="Запчастину не знайдено" description="Для демонстрації введіть номер 9779150." /></Panel>}
    </FeatureFrame>
  );
}
