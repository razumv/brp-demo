"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  List,
  Maximize2,
  Minus,
  Package,
  Plus,
  Printer,
  Share2,
  ShoppingCart,
} from "lucide-react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { CATALOG_IDS, diagramNames, formatMoney, parts } from "@/lib/mock-data";
import { publicAssetPath } from "@/lib/public-base-path";
import styles from "@/components/catalog/catalog.module.css";

type MobileTab = "schema" | "parts";
type ZoomLevel = 0.75 | 1 | 1.25 | 1.5 | 1.75;

const zoomLevels: ZoomLevel[] = [0.75, 1, 1.25, 1.5, 1.75];
const zoomClasses: Record<ZoomLevel, string> = {
  0.75: styles.zoom75,
  1: styles.zoom100,
  1.25: styles.zoom125,
  1.5: styles.zoom150,
  1.75: styles.zoom175,
};

function PartsTable({
  onAdd,
  addedPart,
}: {
  onAdd: (partNumber: string) => void;
  addedPart: string;
}) {
  return (
    <section className={styles.partsPane} aria-label="Список запчастин">
      <header className={styles.partsHeader}>
        <div><Package size={21} /><h2>Список запчастин</h2><span>{parts.length} позицій</span></div>
        {addedPart ? <p aria-live="polite"><Check size={14} /> {addedPart} додано</p> : null}
      </header>
      <div className={styles.partsTableWrap}>
        <table className={styles.partsTable}>
          <thead>
            <tr>
              <th scope="col">Посилання</th>
              <th scope="col">Номер запчастини</th>
              <th scope="col">Опис</th>
              <th scope="col">К-ть</th>
              <th scope="col">Дилерська</th>
              <th scope="col">Роздрібна</th>
              <th scope="col"><span className={styles.visuallyHidden}>Дія</span></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, index) => (
              <tr key={`${part.number}-${part.reference}-${index}`}>
                <td><span className={styles.referenceBubble}>{part.reference}</span></td>
                <td>
                  <strong className={styles.partNumber}>{part.number}</strong>
                  {part.stock > 0 ? <small className={styles.inStock}>{part.stock} в наявності</small> : <small className={styles.outOfStock}>Немає на складі</small>}
                  {part.supersededBy ? <small className={styles.replacement}>↪ {part.supersededBy}</small> : null}
                </td>
                <td className={styles.descriptionCell}>{part.description}</td>
                <td>{part.stock}</td>
                <td>{formatMoney(part.dealerPrice)}</td>
                <td><strong>{formatMoney(part.retailPrice)}</strong></td>
                <td>
                  <button
                    type="button"
                    className={styles.tableCartButton}
                    aria-label={`Додати ${part.number} до кошика`}
                    onClick={() => onAdd(part.number)}
                  >
                    {addedPart === part.number ? <Check size={15} /> : <ShoppingCart size={15} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DiagramCanvas({
  zoom,
  calloutsVisible,
  setZoom,
  setCalloutsVisible,
}: {
  zoom: ZoomLevel;
  calloutsVisible: boolean;
  setZoom: (zoom: ZoomLevel) => void;
  setCalloutsVisible: (visible: boolean) => void;
}) {
  const zoomIndex = zoomLevels.indexOf(zoom);
  return (
    <section className={styles.canvasPane} aria-label="Схема технічного обслуговування">
      <div className={styles.diagramCrop}>
        <div className={`${styles.diagramScale} ${zoomClasses[zoom]}`}>
          <Image
            className={`${styles.sourceDiagram} ${calloutsVisible ? "" : styles.calloutsHidden}`}
            src={publicAssetPath("/images/catalog/maintenance-diagram-source.png")}
            width={1440}
            height={900}
            priority
            alt="Схема сервісних деталей та рідин Outlander 500"
          />
        </div>
      </div>
      <div className={styles.diagramControls} aria-label="Керування схемою">
        <button
          type="button"
          aria-label={calloutsVisible ? "Приховати позначки" : "Показати позначки"}
          aria-pressed={!calloutsVisible}
          onClick={() => setCalloutsVisible(!calloutsVisible)}
        >
          {calloutsVisible ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
        <button
          type="button"
          aria-label="Збільшити схему"
          disabled={zoomIndex === zoomLevels.length - 1}
          onClick={() => setZoom(zoomLevels[Math.min(zoomIndex + 1, zoomLevels.length - 1)])}
        ><Plus size={18} /></button>
        <button
          type="button"
          aria-label="Зменшити схему"
          disabled={zoomIndex === 0}
          onClick={() => setZoom(zoomLevels[Math.max(zoomIndex - 1, 0)])}
        ><Minus size={18} /></button>
        <button type="button" aria-label="Скинути масштаб" onClick={() => setZoom(1)}><Maximize2 size={16} /></button>
      </div>
      <span className={styles.zoomIndicator}>{Math.round(zoom * 100)}%</span>
    </section>
  );
}

export function DiagramViewer() {
  const { snapshot, commands } = useDealerWorkflow();
  const [diagramIndex, setDiagramIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("schema");
  const [zoom, setZoom] = useState<ZoomLevel>(1);
  const [calloutsVisible, setCalloutsVisible] = useState(true);
  const [addedPart, setAddedPart] = useState("");
  const [shared, setShared] = useState(false);
  const [commandError, setCommandError] = useState("");
  const shareAttemptRef = useRef(0);
  const shareTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("diagram");
    const parsed = raw ? Number.parseInt(raw, 10) : 1;
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > diagramNames.length) return;
    const frame = window.requestAnimationFrame(() => setDiagramIndex(parsed - 1));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    shareAttemptRef.current += 1;
    if (shareTimeoutRef.current !== null) {
      window.clearTimeout(shareTimeoutRef.current);
    }
  }, []);

  const cartCount = useMemo(() => snapshot.cart.reduce((sum, line) => sum + line.quantity, 0), [snapshot.cart]);
  const title = diagramNames[diagramIndex];

  const addPart = async (partNumber: string) => {
    setCommandError("");
    const result = await commands.addCartLine({
      partNumber,
      quantity: 1,
      sourceDiagramId: CATALOG_IDS.diagram,
    });
    if (!result.ok) {
      const message = result.kind === "validation-error"
        ? result.issues[0]?.message
        : null;
      setCommandError(message ?? "Не вдалося додати запчастину.");
      return;
    }
    setAddedPart(partNumber);
  };

  const share = async () => {
    const attempt = shareAttemptRef.current + 1;
    shareAttemptRef.current = attempt;
    if (shareTimeoutRef.current !== null) {
      window.clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = null;
    }
    setCommandError("");
    const result = await commands.copyText({ text: window.location.href });
    if (attempt !== shareAttemptRef.current) return;
    if (!result.ok) {
      setShared(false);
      setCommandError(
        result.kind === "local-error"
          ? result.message
          : "Не вдалося скопіювати посилання.",
      );
      return;
    }
    setShared(true);
    shareTimeoutRef.current = window.setTimeout(() => {
      if (attempt !== shareAttemptRef.current) return;
      shareTimeoutRef.current = null;
      setShared(false);
    }, 1800);
  };

  return (
    <div className={styles.diagramViewer}>
      <header className={styles.diagramHeader}>
        <div className={styles.diagramIdentity}>
          <Link className={styles.diagramBack} href={`/catalog/${CATALOG_IDS.brand}/${CATALOG_IDS.configuration}`} aria-label="Назад до списку схем"><ArrowLeft size={20} /></Link>
          <span className={styles.diagramBrand}>can-am</span>
          <div>
            <h1>{title}</h1>
            <p>
              <span>Can-Am Off-Road</span><span>Can-Am ATV</span><span>2026</span>
              <span>001 - North America - Outlander 500/700 Series</span><span>0001KTB00</span>
            </p>
          </div>
        </div>
        <div className={styles.diagramActions}>
          <div className={styles.selectorGroup}>
            <button
              type="button"
              aria-label="Попередня схема"
              disabled={diagramIndex === 0}
              onClick={() => setDiagramIndex(Math.max(0, diagramIndex - 1))}
            ><ChevronLeft size={17} /></button>
            <label>
              <List size={16} />
              <span className={styles.visuallyHidden}>Оберіть схему</span>
              <select value={diagramIndex} onChange={(event) => setDiagramIndex(Number(event.target.value))}>
                {diagramNames.map((diagram, index) => <option value={index} key={diagram}>{index + 1}. {diagram}</option>)}
              </select>
              <b>{diagramIndex + 1} / {diagramNames.length}</b>
            </label>
            <button
              type="button"
              aria-label="Наступна схема"
              disabled={diagramIndex === diagramNames.length - 1}
              onClick={() => setDiagramIndex(Math.min(diagramNames.length - 1, diagramIndex + 1))}
            ><ChevronRight size={17} /></button>
          </div>
          <button type="button" className={styles.secondaryAction} onClick={() => window.print()}><Printer size={16} /><span>Друк</span></button>
          <button type="button" className={styles.secondaryAction} onClick={share}><Share2 size={16} /><span>{shared ? "Скопійовано" : "Поділитися"}</span></button>
          <Link className={styles.diagramCart} href="/cart"><ShoppingCart size={16} /><span>Кошик ({cartCount})</span></Link>
          {commandError ? <span className={styles.errorMessage} role="alert">{commandError}</span> : null}
        </div>
      </header>

      <div className={styles.mobileDiagramTabs} role="tablist" aria-label="Вигляд схеми">
        <button type="button" role="tab" aria-selected={mobileTab === "schema"} onClick={() => setMobileTab("schema")}>Схема</button>
        <button type="button" role="tab" aria-selected={mobileTab === "parts"} onClick={() => setMobileTab("parts")}><Package size={16} /> Запчастини <span>{parts.length}</span></button>
      </div>

      <main className={styles.diagramWorkspace}>
        <div className={`${styles.mobilePane} ${mobileTab === "schema" ? styles.mobilePaneActive : ""}`}>
          <DiagramCanvas zoom={zoom} calloutsVisible={calloutsVisible} setZoom={setZoom} setCalloutsVisible={setCalloutsVisible} />
        </div>
        <div className={`${styles.mobilePane} ${mobileTab === "parts" ? styles.mobilePaneActive : ""}`}>
          <PartsTable onAdd={addPart} addedPart={addedPart} />
        </div>
      </main>
    </div>
  );
}
