export type DesignSystem = "shadcn" | "astryx";
export type ColorMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface AppearancePreferenceV1 {
  version: 1;
  designSystem: DesignSystem;
  colorMode: ColorMode;
}

export interface AppearanceWriteContext {
  operationId: string;
}

export interface AppearancePublicationContext {
  origin: "local-write" | "external";
  operationId: string | null;
}

export interface AppearancePreferencesRepository {
  read(): Promise<AppearancePreferenceV1 | null>;
  write(preference: AppearancePreferenceV1, context?: AppearanceWriteContext): Promise<void>;
  subscribe(
    listener: (
      preference: AppearancePreferenceV1,
      context: AppearancePublicationContext,
    ) => void,
  ): () => void;
}

export interface AppearanceBootstrapSnapshot {
  read(): AppearancePreferenceV1 | null;
  write(preference: AppearancePreferenceV1): void;
}
