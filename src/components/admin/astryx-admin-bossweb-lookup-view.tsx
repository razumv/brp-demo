"use client";

import {useLayoutEffect, type FormEvent} from "react";
import {AlertTriangle, Clock3, RefreshCw, Search} from "lucide-react";
import {Badge} from "@astryxdesign/core/Badge";
import {Banner} from "@astryxdesign/core/Banner";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {EmptyState} from "@astryxdesign/core/EmptyState";
import {Heading} from "@astryxdesign/core/Heading";
import {StatusDot} from "@astryxdesign/core/StatusDot";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {normalizeBossWebPartQuery, type AdminBossWebLookupFixture} from "@/lib/admin-bossweb-lookup-data";
import type {BossWebLookupViewProps} from "./admin-bossweb-lookup-page";
import styles from "./astryx-admin-tools.module.css";

function formatUsd(value: number) { return `$${value.toFixed(2)}`; }
function formatEur(value: number) { return `€${value.toFixed(2)}`; }

function FoundResult({fixture}: {fixture: AdminBossWebLookupFixture}) {
  return (
    <section className={styles.lookupGrid} aria-label={`Результат пошуку ${fixture.query}`}>
      <Card padding={0} width="100%">
        <div className={styles.sectionHeading}><Heading level={2}>Наявність BossWeb</Heading><Badge label={fixture.bossWeb.currencyLabel} variant="info" /><Text type="supporting" color="secondary">{fixture.bossWeb.cacheAge}</Text><Button label="Оновити BossWeb" variant="ghost" size="sm" icon={<RefreshCw size={14} />} isIconOnly isDisabled tooltip="Потрібне підключення до BossWeb" /></div>
        <div className={styles.lookupBody}>
          <div className={styles.cardHeading}><StatusDot label={fixture.bossWeb.status} variant="warning" /><Text type="supporting" color="secondary">{fixture.bossWeb.family}</Text></div>
          <Heading level={3}>{fixture.bossWeb.partNumber}</Heading>
          <Text color="secondary">{fixture.bossWeb.description}</Text>
          <Banner status="warning" title="Потрібне уточнення" description={fixture.bossWeb.warning} icon={<AlertTriangle size={16} />} />
          <dl className={styles.lookupFacts}><div><dt>В наявності</dt><dd>{fixture.bossWeb.inStock}</dd></div><div><dt>Бекордер</dt><dd>{fixture.bossWeb.backorder}</dd></div><div><dt>Нетто</dt><dd>{formatUsd(fixture.bossWeb.netUsd)}</dd></div></dl>
        </div>
      </Card>
      <Card padding={0} width="100%">
        <div className={styles.sectionHeading}><Heading level={2}>Локальний каталог</Heading><Badge label={fixture.localCatalog.currencyLabel} variant="warning" /></div>
        <dl className={`${styles.lookupFacts} ${styles.lookupBody}`}><div><dt>На складі</dt><dd>{fixture.localCatalog.inStock}</dd></div><div><dt>Статус</dt><dd>{fixture.localCatalog.status}</dd></div><div><dt>Дилерська ціна</dt><dd>{formatUsd(fixture.localCatalog.dealerPriceUsd)}</dd></div><div><dt>Роздрібна ціна</dt><dd>{formatUsd(fixture.localCatalog.retailPriceUsd)}</dd></div><div><dt>Дистр. ціна</dt><dd>{formatEur(fixture.localCatalog.distributorPriceEur)}</dd></div></dl>
      </Card>
    </section>
  );
}

export default function AstryxAdminBossWebLookupView({input, resolution, onInputChange, onSearch, onReady}: BossWebLookupViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSearch(); };

  return (
    <AstryxBrpUiProvider>
      <main className={styles.page} data-admin-bossweb-renderer="astryx">
        <header className={styles.performanceHeader}><div><Text type="supporting" color="secondary"><Search size={13} /> BOSSWEB</Text><Heading level={1}>Пошук запчастин</Heading><Text color="secondary">Перевіряйте наявність BRP, заміни, ETA і локальний склад перед створенням замовлення.</Text></div></header>
        <Card padding={3} width="100%">
          <form className={styles.lookupForm} onSubmit={submit}>
            <div className={styles.searchGrow}><TextInput label="Номер запчастини" value={input} onChange={onInputChange} placeholder="Введіть номер запчастини (напр. 9779150)" hasClear startIcon={<Search size={15} />} width="100%" /></div>
            <Button type="submit" label="Пошук" variant="primary" icon={<Search size={15} />} isDisabled={!normalizeBossWebPartQuery(input)} />
          </form>
        </Card>
        {resolution.state === "found" ? <FoundResult fixture={resolution.fixture} /> : null}
        {resolution.state === "not-found" ? <Card padding={4}><EmptyState title="Даних не знайдено" description={`Для ${resolution.query} немає даних у каталозі. Підключення до BossWeb недоступне.`} icon={<Search size={26} />} /></Card> : null}
        {resolution.state === "empty" ? <Card padding={4}><EmptyState title="Введіть номер запчастини" description="Пошук покаже дані BossWeb і локального каталогу в одному місці." icon={<Clock3 size={26} />} /></Card> : null}
      </main>
    </AstryxBrpUiProvider>
  );
}
