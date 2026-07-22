"use client";

import {Palette} from "lucide-react";
import type {ColorMode, DesignSystem} from "@/lib/appearance";
import styles from "./appearance-settings.module.css";

export interface AppearanceSettingsViewProps {
  designSystem: DesignSystem;
  activeDesignSystem: DesignSystem;
  colorMode: ColorMode;
  busy: boolean;
  error: string | null;
  onDesignSystemChange(designSystem: DesignSystem): void;
  onColorModeChange(colorMode: ColorMode): void;
}

const designSystemChoices: readonly {
  value: DesignSystem;
  label: string;
  description: string;
}[] = [
  {
    value: "shadcn",
    label: "shadcn/ui",
    description: "Поточне оформлення та компоненти порталу.",
  },
  {
    value: "astryx",
    label: "Astryx Neutral",
    description: "Нейтральна тема на компонентах Astryx.",
  },
];

const colorModeChoices: readonly {value: ColorMode; label: string}[] = [
  {value: "system", label: "Системна"},
  {value: "light", label: "Світла"},
  {value: "dark", label: "Темна"},
];

export function CurrentAppearanceSettingsView({
  designSystem,
  activeDesignSystem,
  colorMode,
  busy,
  error,
  onDesignSystemChange,
  onColorModeChange,
}: AppearanceSettingsViewProps) {
  return (
    <section
      className={styles.currentPanel}
      aria-labelledby="settings-appearance-title"
      aria-busy={busy || undefined}
    >
      <header className={styles.currentHeader}>
        <span className={styles.currentHeaderIcon}>
          <Palette size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 id="settings-appearance-title">Оформлення</h2>
          <p>Оберіть дизайн-систему та колірний режим для всього порталу.</p>
        </div>
      </header>

      <div className={styles.currentBody}>
        <fieldset className={styles.currentFieldset} disabled={busy}>
          <legend>Дизайн-система</legend>
          <div className={styles.currentChoiceGrid}>
            {designSystemChoices.map((choice) => (
              <label key={choice.value} className={styles.currentChoiceCard}>
                <input
                  type="radio"
                  name="appearance-design-system"
                  value={choice.value}
                  checked={designSystem === choice.value}
                  onChange={() => onDesignSystemChange(choice.value)}
                />
                <span className={styles.currentChoiceCopy}>
                  <span className={styles.currentChoiceTitle}>
                    {choice.label}
                    {activeDesignSystem === choice.value ? (
                      <span className={styles.currentBadge}>Поточна</span>
                    ) : null}
                  </span>
                  <span className={styles.currentChoiceDescription}>{choice.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.currentFieldset} disabled={busy}>
          <legend>Колірна тема</legend>
          <div className={styles.currentSegmented} role="radiogroup" aria-label="Колірна тема">
            {colorModeChoices.map((choice) => (
              <label key={choice.value}>
                <input
                  type="radio"
                  name="appearance-color-mode"
                  value={choice.value}
                  checked={colorMode === choice.value}
                  onChange={() => onColorModeChange(choice.value)}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? <p className={styles.currentError} role="alert">{error}</p> : null}
      </div>
    </section>
  );
}
