"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { publicAssetPath } from "@/lib/public-base-path";
import styles from "./offline.module.css";

export default function OfflinePage() {
  useEffect(() => {
    const reloadWhenOnline = () => window.location.reload();
    window.addEventListener("online", reloadWhenOnline);
    return () => window.removeEventListener("online", reloadWhenOnline);
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="offline-title">
        <span className={styles.icon} aria-hidden="true"><WifiOff size={30} /></span>
        <p className={styles.eyebrow}>BRP Parts Catalog</p>
        <h1 id="offline-title">Немає з’єднання</h1>
        <p className={styles.copy}>Перевірте інтернет і спробуйте ще раз. Уже відкриті сторінки залишаються доступними офлайн.</p>
        <div className={styles.actions}>
          <button type="button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} aria-hidden="true" />
            Спробувати знову
          </button>
          <a href={publicAssetPath("/")}>На головну</a>
        </div>
      </section>
    </main>
  );
}
