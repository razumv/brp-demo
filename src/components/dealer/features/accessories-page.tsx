"use client";

import {
  Check,
  ChevronRight,
  Image as ImageIcon,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { Modal, Panel, StatusBadge } from "@/components/shared/ui";
import { formatMoney } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "../common";
import styles from "../dealer.module.css";
import { FeatureFrame } from "./feature-frame";

const accessoryFamilies = [
  { label: "Can-Am Off-Road", count: 1556, photos: 1431, tone: "orange" as const },
  { label: "Can-Am On-Road", count: 385, photos: 354, tone: "blue" as const },
  { label: "Sea-Doo", count: 393, photos: 385, tone: "green" as const },
];

const accessoryProducts = [
  { id: "advex", title: "Advex Helmet LED Utility Light", sku: "929085", current: "9290850090", price: 92.59, stock: 1, family: "Can-Am Off-Road" },
  { id: "linq", title: "LinQ Adventure Tunnel Bag", sku: "860202447", current: "860202447", price: 179.99, stock: 8, family: "Ski-Doo" },
  { id: "coolant", title: "XPS Extended Life Coolant", sku: "9779150", current: "9779150", price: 13.09, stock: 240, family: "Can-Am Off-Road" },
  { id: "holder", title: "LinQ Tool Holder", sku: "715007358", current: "715007358", price: 45.65, stock: 4, family: "Can-Am Off-Road" },
  { id: "cover", title: "Sea-Doo Storage Bin Organizer", sku: "295100835", current: "295100835", price: 79.99, stock: 2, family: "Sea-Doo" },
  { id: "rack", title: "LinQ Rear Cargo Rack", sku: "715001734", current: "715001734", price: 218.5, stock: 0, family: "Can-Am Off-Road" },
];

export function AccessoriesPage() {
  const { addToCart } = useDemoStore();
  const [family, setFamily] = useState("Усі категорії");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const selected = accessoryProducts.find((product) => product.id === selectedId);
  const products = accessoryProducts.filter((product) => {
    const matchesFamily = family === "Усі категорії" || product.family === family;
    const normalized = query.trim().toLowerCase();
    return matchesFamily && (!normalized || `${product.title} ${product.sku}`.toLowerCase().includes(normalized));
  });

  const addRepresentativePart = () => {
    addToCart("9779150", 1);
    setAdded(true);
  };

  return (
    <FeatureFrame feature="accessories">
      <section className={styles.familyGrid}>
        {accessoryFamilies.map((item) => <Panel className={styles.familyCard} key={item.label}><span className={cn(styles.familyIcon, styles[`familyIcon${item.tone[0].toUpperCase()}${item.tone.slice(1)}`])}><ImageIcon size={19} /></span><div><strong>{item.label}</strong><small>{item.count} товарів · {item.photos} фото</small></div><ChevronRight size={16} /></Panel>)}
      </section>
      <div className={styles.accessoryLayout}>
        <Panel className={styles.filterRail}>
          <SectionHeading title="Фільтри" action={<SlidersHorizontal size={16} />} />
          <label className="field"><span>Категорія</span><select value={family} onChange={(event) => setFamily(event.target.value)}>{["Усі категорії", ...accessoryFamilies.map((item) => item.label)].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Рік</span><select defaultValue="2026"><option>2026</option><option>2025</option><option>2024</option></select></label>
          <details><summary>Сумісність <span>9</span></summary><label><input type="checkbox" /> Outlander</label><label><input type="checkbox" /> Defender</label><label><input type="checkbox" /> Maverick</label></details>
          <details><summary>Призначення <span>4</span></summary><label><input type="checkbox" /> Utility</label><label><input type="checkbox" /> Touring</label></details>
        </Panel>
        <div>
          <div className={styles.productToolbar}><div className="toolbar-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Назва або артикул..." /></div><select className="select" defaultValue="featured"><option value="featured">Рекомендовані</option><option value="price">За ціною</option></select></div>
          <div className={styles.productGrid}>
            {products.map((product, index) => (
              <button type="button" className={styles.productCard} key={product.id} onClick={() => { setSelectedId(product.id); setAdded(false); }}>
                <span className={styles.productBadge}>{product.stock ? "Готово до замовлення" : "Під замовлення"}</span>
                <div className={cn(styles.productVisual, styles[`productVisual${(index % 3) + 1}`])}><Sparkles size={38} /></div>
                <div><small>{product.family}</small><h3>{product.title}</h3><p>{product.sku}</p><footer><strong>{formatMoney(product.price)}</strong><span>Детальніше <ChevronRight size={13} /></span></footer></div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.title || "Аксесуар"} description={selected ? `${selected.family} · ${selected.sku}` : undefined} className={styles.accessoryModal}>
        {selected ? <div className={styles.accessoryDetail}>
          <div className={styles.accessoryHero}><Sparkles size={58} /><span>BRP Genuine Accessories</span></div>
          <div>
            <div className={styles.chipRow}><StatusBadge tone="orange">{selected.family}</StatusBadge><StatusBadge tone="neutral">Accessories</StatusBadge><StatusBadge tone="green">Готово до замовлення</StatusBadge></div>
            <p>Оригінальний аксесуар BRP, створений для точної сумісності, надійної роботи та швидкого встановлення.</p>
            <div className={styles.accessorySku}><span><strong>{selected.sku}</strong><small>Актуальний артикул: {selected.current}</small><small>{selected.stock} в наявності</small></span><span><strong>{formatMoney(selected.price)}</strong><small>Готово до замовлення</small></span></div>
            <button type="button" className="button button-primary button-wide" onClick={addRepresentativePart}>{added ? <><Check size={15} /> Додано тестову позицію</> : <><ShoppingCart size={15} /> Додати в кошик</>}</button>
            <p className={styles.accessoryHint}>У локальному кошику використовується доступна тестова позиція 9779150.</p>
          </div>
        </div> : null}
      </Modal>
    </FeatureFrame>
  );
}
