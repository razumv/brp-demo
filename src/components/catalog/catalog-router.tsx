"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileSearch,
  Folder,
  Home,
  PackageSearch,
  Search,
  Wrench,
} from "lucide-react";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
import {
  CATALOG_IDS,
  catalogBrands,
  catalogSeries,
  diagramNames,
} from "@/lib/mock-data";
import { DiagramViewer } from "@/components/catalog/diagram-viewer";
import styles from "@/components/catalog/catalog.module.css";

type CatalogRouterProps = {
  slug: string[];
};

const categoryPath = `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.category}`;
const seriesPath = `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.series}`;
const modelPath = `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.model}`;
const configurationPath = `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.configuration}`;
const diagramPath = `/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.diagram}`;

const modelResults = [
  "Outlander 500 2X4 - North America, 2026",
  "Outlander 500 - North America, 2026",
  "Outlander MAX 500 - North America, 2026",
  "Outlander 700 XT - North America, 2026",
  "Outlander PRO HD5 - North America, 2026",
  "Outlander PRO HD7 - North America, 2026",
];

const configurationResults = [
  { code: "0001KTB00", name: "North America - OUTLANDER - 2X4 - STD - 500" },
  { code: "0001KTA00", name: "North America - OUTLANDER - 4X4 - STD - 500" },
  { code: "0001KTC00", name: "North America - OUTLANDER - DPS - 500" },
  { code: "0001KTD00", name: "North America - OUTLANDER - XT - 700" },
];

function CatalogPage({ children }: { children: ReactNode }) {
  return <div className={`page page-narrow ${styles.catalogPage}`}>{children}</div>;
}

function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Хлібні крихти">
      <Link href="/catalog" aria-label="Каталог"><Home size={14} /></Link>
      {items.map((item) => (
        <span key={`${item.label}-${item.href || "current"}`}>
          <ChevronRight size={13} aria-hidden="true" />
          {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
        </span>
      ))}
    </nav>
  );
}

function SearchResult({
  code,
  title,
  meta,
  href,
}: {
  code: string;
  title: string;
  meta: string;
  href: string;
}) {
  return (
    <Link className={styles.searchResult} href={href}>
      <span className={styles.resultIcon}><FileSearch size={16} /></span>
      <span className={styles.resultCopy}>
        <strong>{title}</strong>
        <small><b>{code}</b>{meta}</small>
      </span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

function QuickSearch() {
  const [modelQuery, setModelQuery] = useState("");
  const [partQuery, setPartQuery] = useState("");
  const [modelSearched, setModelSearched] = useState(false);
  const [partSearched, setPartSearched] = useState(false);

  const normalizedModel = modelQuery.trim().toLowerCase();
  const normalizedPart = partQuery.trim().toLowerCase();
  const hasModel = normalizedModel === "0001ktb00";
  const hasPart = normalizedPart === "9779150";

  const submitModel = (event: FormEvent) => {
    event.preventDefault();
    if (normalizedModel) setModelSearched(true);
  };

  const submitPart = (event: FormEvent) => {
    event.preventDefault();
    if (normalizedPart) setPartSearched(true);
  };

  return (
    <Panel className={styles.quickSearchPanel}>
      <div className={styles.quickSearchTitle}>
        <Search size={16} />
        <strong>Швидкий пошук</strong>
        <span>Знайдіть модель або запчастину за точним номером</span>
      </div>
      <div className={styles.searchColumns}>
        <form className={styles.searchField} onSubmit={submitModel}>
          <label htmlFor="catalog-model-search">Модель</label>
          <div className={styles.searchInput}>
            <input
              id="catalog-model-search"
              value={modelQuery}
              onChange={(event) => {
                setModelQuery(event.target.value);
                setModelSearched(false);
              }}
              placeholder="напр. 4STF, Outlander..."
              autoComplete="off"
            />
            <button type="submit" aria-label="Знайти модель"><Search size={16} /></button>
          </div>
          {modelSearched ? (
            hasModel ? (
              <SearchResult
                code="0001KTB00"
                title="North America - OUTLANDER - 2X4 - STD - 500"
                meta=" · Can-Am ATV · 2026 · Outlander 500"
                href={configurationPath}
              />
            ) : (
              <p className={styles.noResult}>Моделей не знайдено</p>
            )
          ) : null}
        </form>

        <form className={styles.searchField} onSubmit={submitPart}>
          <label htmlFor="catalog-part-search">Запчастина</label>
          <div className={styles.searchInput}>
            <input
              id="catalog-part-search"
              value={partQuery}
              onChange={(event) => {
                setPartQuery(event.target.value);
                setPartSearched(false);
              }}
              placeholder="напр. 507032417, brake..."
              autoComplete="off"
            />
            <button type="submit" aria-label="Знайти запчастину"><Search size={16} /></button>
          </div>
          {partSearched ? (
            hasPart ? (
              <SearchResult
                code="9779150"
                title="COOLANT,EXT LIFE"
                meta=" · 240 на складі · сумісно з Outlander 500/700"
                href={diagramPath}
              />
            ) : (
              <p className={styles.noResult}>Запчастин не знайдено</p>
            )
          ) : null}
        </form>
      </div>
    </Panel>
  );
}

function CatalogHome() {
  return (
    <CatalogPage>
      <PageHeader
        title="Каталог запчастин"
        description="Оберіть виробника для перегляду або пошуку запчастин."
        action={<Link className="button button-outline" href="/dealer/orders">Нещодавні замовлення</Link>}
      />
      <QuickSearch />
      <div className={styles.brandGrid}>
        {catalogBrands.map((brand) => (
          <Link className={styles.brandCard} href={`/catalog/${brand.code}`} key={brand.code}>
            <div className={styles.brandLogoRow}>
              <Image src={brand.logo} width={220} height={72} alt={brand.name} />
              <StatusBadge tone={brand.code === CATALOG_IDS.brand ? "orange" : "blue"}>{brand.tag}</StatusBadge>
            </div>
            <div className={styles.brandMeta}>{brand.name}</div>
            <div className={styles.brandBody}>
              <p>{brand.description}</p>
              <span>Переглянути каталог <ArrowRight size={14} /></span>
            </div>
          </Link>
        ))}
      </div>
    </CatalogPage>
  );
}

function BrandCatalog({ brandCode }: { brandCode: string }) {
  const brand = catalogBrands.find((item) => item.code === brandCode);
  if (!brand) return <UnknownCatalogState />;

  if (brandCode !== CATALOG_IDS.brand) {
    return (
      <CatalogPage>
        <Breadcrumbs items={[{ label: brand.name }]} />
        <PageHeader title={brand.name} description="Каталог виробника" />
        <Panel>
          <EmptyState
            icon={<BookOpen size={25} />}
            title="Розділ представлено оглядово"
            description="Для наскрізної демонстрації схем відкрийте каталог Can-Am Off-Road."
            action={<Link className="button button-primary" href={`/catalog/${CATALOG_IDS.brand}`}>Can-Am Off-Road</Link>}
          />
        </Panel>
      </CatalogPage>
    );
  }

  return (
    <CatalogPage>
      <Breadcrumbs items={[{ label: "Can-Am Off-Road" }]} />
      <div className={styles.brandHeading}>
        <Image src={brand.logo} width={190} height={62} alt="Can-Am Off-Road" />
        <div><h1>Can-Am Off-Road</h1><p>Оберіть категорію техніки</p></div>
      </div>
      <div className={styles.categoryGrid}>
        <Link className={styles.categoryCard} href={categoryPath}>
          <span><Wrench size={20} /></span>
          <div><strong>Can-Am ATV</strong><small>Категорія · моделі 2008–2026</small></div>
          <ChevronRight size={18} />
        </Link>
        <Link className={styles.categoryCard} href={`/catalog/${CATALOG_IDS.brand}/sxs`}>
          <span><Wrench size={20} /></span>
          <div><strong>Can-Am SXS</strong><small>Категорія · оглядовий розділ</small></div>
          <ChevronRight size={18} />
        </Link>
      </div>
    </CatalogPage>
  );
}

function BrowserRow({
  children,
  active = false,
  href,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = `${styles.browserRow} ${active ? styles.browserRowActive : ""}`;
  const content = <><Folder size={15} /><span>{children}</span><ChevronRight size={14} /></>;
  if (href) return <Link className={className} href={href}>{content}</Link>;
  return <button type="button" className={className} aria-pressed={active} onClick={onClick}>{content}</button>;
}

function CategoryBrowser() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const years = Array.from({ length: 19 }, (_, index) => String(2026 - index));

  return (
    <CatalogPage>
      <Breadcrumbs items={[
        { label: "Can-Am Off-Road", href: `/catalog/${CATALOG_IDS.brand}` },
        { label: "Can-Am ATV" },
        { label: selectedYear },
      ]} />
      <div className={styles.browserGrid}>
        <section className={styles.browserColumn} aria-label="Категорії">
          <BrowserRow active>Can-Am ATV</BrowserRow>
          <BrowserRow href={`/catalog/${CATALOG_IDS.brand}/sxs`}>Can-Am SXS</BrowserRow>
        </section>
        <section className={`${styles.browserColumn} ${styles.yearColumn}`} aria-label="Роки">
          <BrowserRow>Accessories</BrowserRow>
          {years.map((year) => (
            <BrowserRow key={year} active={selectedYear === year} onClick={() => setSelectedYear(year)}>{year}</BrowserRow>
          ))}
        </section>
        <section className={`${styles.browserColumn} ${styles.seriesColumn}`} aria-label="Серії">
          {selectedYear === "2026" ? catalogSeries.map((series, index) => (
            <BrowserRow key={series} href={`${seriesPath}?series=${index + 1}`}>{series}</BrowserRow>
          )) : (
            <div className={styles.columnEmpty}>
              <Folder size={22} />
              <strong>{selectedYear}</strong>
              <span>У демонстрації детально відтворено каталог 2026 року.</span>
              <button type="button" className="button button-outline" onClick={() => setSelectedYear("2026")}>Показати 2026</button>
            </div>
          )}
        </section>
      </div>
    </CatalogPage>
  );
}

function SelectionList({
  title,
  description,
  breadcrumbs,
  children,
}: {
  title: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  children: ReactNode;
}) {
  return (
    <CatalogPage>
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader title={title} description={description} />
      <Panel className={styles.selectionPanel}>{children}</Panel>
    </CatalogPage>
  );
}

function ModelList() {
  return (
    <SelectionList
      title="001 - North America - Outlander 500/700 Series"
      description="Оберіть модель для перегляду конфігурацій."
      breadcrumbs={[
        { label: "Can-Am Off-Road", href: `/catalog/${CATALOG_IDS.brand}` },
        { label: "Can-Am ATV", href: categoryPath },
        { label: "2026", href: categoryPath },
        { label: "001 - Outlander 500/700" },
      ]}
    >
      {modelResults.map((model, index) => (
        <Link className={styles.selectionRow} href={`${modelPath}?model=${index + 1}`} key={model}>
          <span className={styles.selectionNumber}>{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{model}</strong><small>ATV · модельний рік 2026</small></div>
          <ChevronRight size={16} />
        </Link>
      ))}
    </SelectionList>
  );
}

function ConfigurationList() {
  return (
    <SelectionList
      title="Outlander 500 2X4 - North America, 2026"
      description="Оберіть код комплектації."
      breadcrumbs={[
        { label: "Can-Am Off-Road", href: `/catalog/${CATALOG_IDS.brand}` },
        { label: "Can-Am ATV", href: categoryPath },
        { label: "2026", href: categoryPath },
        { label: "Outlander 500/700", href: seriesPath },
        { label: "Outlander 500 2X4" },
      ]}
    >
      {configurationResults.map((configuration, index) => (
        <Link className={styles.selectionRow} href={`${configurationPath}?configuration=${index + 1}`} key={configuration.code}>
          <span className={`${styles.selectionNumber} ${styles.codeBadge}`}>{configuration.code}</span>
          <div><strong>{configuration.name}</strong><small>North America · 2026 · Rotax 500</small></div>
          <ChevronRight size={16} />
        </Link>
      ))}
    </SelectionList>
  );
}

function DiagramList() {
  return (
    <SelectionList
      title="North America - OUTLANDER - 2X4 - STD - 500"
      description="0001KTB00 · 41 технічна схема"
      breadcrumbs={[
        { label: "Can-Am Off-Road", href: `/catalog/${CATALOG_IDS.brand}` },
        { label: "Can-Am ATV", href: categoryPath },
        { label: "Outlander 500/700", href: seriesPath },
        { label: "Outlander 500 2X4", href: modelPath },
        { label: "0001KTB00" },
      ]}
    >
      <div className={styles.diagramListHeader}><span>Схеми</span><StatusBadge tone="orange">41</StatusBadge></div>
      <div className={styles.diagramList}>
        {diagramNames.map((diagram, index) => (
          <Link className={styles.diagramListRow} href={`${diagramPath}?diagram=${index + 1}`} key={diagram}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{diagram}</strong><small>Деталі, посилання та ціни</small></div>
            <ChevronRight size={16} />
          </Link>
        ))}
      </div>
    </SelectionList>
  );
}

function UnknownCatalogState() {
  return (
    <CatalogPage>
      <Breadcrumbs items={[{ label: "Розділ каталогу" }]} />
      <Panel>
        <EmptyState
          icon={<PackageSearch size={25} />}
          title="Розділ не знайдено"
          description="Поверніться до виробників і відкрийте наскрізний каталог Can-Am Off-Road."
          action={<Link className="button button-primary" href="/catalog">До каталогу</Link>}
        />
      </Panel>
    </CatalogPage>
  );
}

export function CatalogRouter({ slug }: CatalogRouterProps) {
  const normalized = slug || [];
  if (normalized.length === 0) return <CatalogHome />;

  const current = normalized[normalized.length - 1];
  if (current === CATALOG_IDS.diagram) return <DiagramViewer />;
  if (current === CATALOG_IDS.configuration) return <DiagramList />;
  if (current === CATALOG_IDS.model) return <ConfigurationList />;
  if (current === CATALOG_IDS.series) return <ModelList />;
  if (current === CATALOG_IDS.category) return <CategoryBrowser />;
  if (catalogBrands.some((brand) => brand.code === current)) return <BrandCatalog brandCode={current} />;
  if (current === "sxs") {
    return (
      <CatalogPage>
        <Breadcrumbs items={[{ label: "Can-Am Off-Road", href: `/catalog/${CATALOG_IDS.brand}` }, { label: "Can-Am SXS" }]} />
        <Panel>
          <EmptyState
            title="Can-Am SXS"
            description="Цей розділ збережено як оглядовий. Детальна демонстрація доступна для Can-Am ATV 2026."
            action={<Link className="button button-primary" href={categoryPath}>Відкрити Can-Am ATV</Link>}
          />
        </Panel>
      </CatalogPage>
    );
  }
  return <UnknownCatalogState />;
}

export { CatalogHome };
