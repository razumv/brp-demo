export type DesignSystem = "shadcn" | "astryx";
export type ColorMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface AppearancePreferenceV1 {
  version: 1;
  designSystem: DesignSystem;
  colorMode: ColorMode;
}

export interface AppearancePreferencesRepository {
  read(): Promise<AppearancePreferenceV1 | null>;
  write(preference: AppearancePreferenceV1): Promise<void>;
  subscribe(listener: (preference: AppearancePreferenceV1) => void): () => void;
}

export interface AppearanceBootstrapSnapshot {
  read(): AppearancePreferenceV1 | null;
  write(preference: AppearancePreferenceV1): void;
}
