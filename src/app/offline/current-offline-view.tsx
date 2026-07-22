"use client";

import {RefreshCw, WifiOff} from "lucide-react";
import styles from "./offline.module.css";

type CurrentOfflineViewProps = {
  homeHref: string;
  onRetry(): void;
};

export function CurrentOfflineView({homeHref, onRetry}: CurrentOfflineViewProps) {
  return (
    <main className={styles.page} data-brp-offline-renderer="current">
      <section className={styles.card} aria-labelledby="offline-title">
        <span className={styles.icon} aria-hidden="true"><WifiOff size={30} /></span>
        <p className={styles.eyebrow}>BRP Parts Catalog</p>
        <h1 id="offline-title">Немає з’єднання</h1>
        <p className={styles.copy}>Перевірте інтернет і спробуйте ще раз. Сторінка автоматично оновиться після відновлення з’єднання.</p>
        <div className={styles.actions}>
          <button type="button" onClick={onRetry}>
            <RefreshCw size={16} aria-hidden="true" />
            Спробувати знову
          </button>
          <a href={homeHref}>На головну</a>
        </div>
      </section>
    </main>
  );
}
