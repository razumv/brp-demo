"use client";

import {useLayoutEffect} from "react";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {Text} from "@astryxdesign/core/Text";
import {RefreshCw, WifiOff} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import styles from "./offline.module.css";

export type AstryxOfflineViewProps = {
  homeHref: string;
  onRetry(): void;
};

export default function AstryxOfflineView({
  homeHref,
  onRetry,
  onReady,
}: AstryxOfflineViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
      <main className={styles.astryxPage} data-brp-offline-renderer="astryx">
        <Card className={styles.astryxCard} padding={6} width="100%">
          <span className={styles.astryxIcon} aria-hidden="true"><WifiOff size={28} /></span>
          <Text color="secondary" display="block" type="label">BRP Parts Catalog</Text>
          <Heading level={1}>Немає з’єднання</Heading>
          <Text className={styles.astryxCopy} color="secondary" display="block">
            Перевірте інтернет і спробуйте ще раз. Сторінка автоматично оновиться після відновлення з’єднання.
          </Text>
          <div className={styles.astryxActions}>
            <Button icon={<RefreshCw size={16} aria-hidden="true" />} label="Спробувати знову" onClick={onRetry} variant="primary" />
            <Button href={homeHref} label="На головну" variant="secondary" />
          </div>
        </Card>
      </main>
    </AstryxBrpUiProvider>
  );
}
