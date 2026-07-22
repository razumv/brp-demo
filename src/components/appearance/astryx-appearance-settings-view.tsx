"use client";

import {useLayoutEffect} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Card} from "@astryxdesign/core/Card";
import {Heading} from "@astryxdesign/core/Heading";
import {RadioList, RadioListItem} from "@astryxdesign/core/RadioList";
import {SegmentedControl, SegmentedControlItem} from "@astryxdesign/core/SegmentedControl";
import {Text} from "@astryxdesign/core/Text";
import {Palette} from "lucide-react";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import type {ColorMode, DesignSystem} from "@/lib/appearance";
import type {AppearanceSettingsViewProps} from "./current-appearance-settings-view";
import styles from "./appearance-settings.module.css";

const colorModeChoices: readonly {value: ColorMode; label: string}[] = [
  {value: "system", label: "Системна"},
  {value: "light", label: "Світла"},
  {value: "dark", label: "Темна"},
];

function isDesignSystem(value: string): value is DesignSystem {
  return value === "shadcn" || value === "astryx";
}

function isColorMode(value: string): value is ColorMode {
  return value === "system" || value === "light" || value === "dark";
}

export default function AstryxAppearanceSettingsView({
  designSystem,
  activeDesignSystem,
  colorMode,
  busy,
  error,
  onDesignSystemChange,
  onColorModeChange,
  onReady,
}: AppearanceSettingsViewProps & AstryxRendererViewProps) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <AstryxBrpUiProvider>
      <Card className={styles.astryxPanel} width="100%" padding={0}>
        <header className={styles.astryxHeader}>
          <span className={styles.astryxHeaderIcon}>
            <Palette size={18} aria-hidden="true" />
          </span>
          <div className={styles.astryxHeaderCopy}>
            <Heading level={2}>Оформлення</Heading>
            <Text color="secondary">Оберіть дизайн-систему та колірний режим для всього порталу.</Text>
          </div>
        </header>

        <div className={styles.astryxBody} aria-busy={busy || undefined}>
          <RadioList
            label="Дизайн-система"
            value={designSystem}
            onChange={(value) => {
              if (isDesignSystem(value)) onDesignSystemChange(value);
            }}
            orientation="horizontal"
            isDisabled={busy}
            width="100%"
            className={styles.astryxRadioList}
          >
            <RadioListItem
              value="shadcn"
              label="shadcn/ui"
              description="Поточне оформлення та компоненти порталу."
              endContent={activeDesignSystem === "shadcn" ? <Badge label="Поточна" variant="neutral" /> : undefined}
              className={styles.astryxRadioItem}
            />
            <RadioListItem
              value="astryx"
              label="Astryx Neutral"
              description="Нейтральна тема на компонентах Astryx."
              endContent={activeDesignSystem === "astryx" ? <Badge label="Поточна" variant="neutral" /> : undefined}
              className={styles.astryxRadioItem}
            />
          </RadioList>

          <div className={styles.astryxModeGroup}>
            <Text weight="semibold">Колірна тема</Text>
            <SegmentedControl
              label="Колірна тема"
              value={colorMode}
              onChange={(value) => {
                if (isColorMode(value)) onColorModeChange(value);
              }}
              layout="fill"
              isDisabled={busy}
            >
              {colorModeChoices.map((choice) => (
                <SegmentedControlItem key={choice.value} value={choice.value} label={choice.label} />
              ))}
            </SegmentedControl>
          </div>

          {error ? <div className={styles.astryxError} role="alert">{error}</div> : null}
        </div>
      </Card>
    </AstryxBrpUiProvider>
  );
}
