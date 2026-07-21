import type { AppearancePreferenceV1, ColorMode, ResolvedTheme } from "./contracts";

export const APPEARANCE_STORAGE_KEY = "brp-appearance-v1";
export const LEGACY_THEME_STORAGE_KEY = "brp-clone-theme";
export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreferenceV1 = {
  version: 1,
  designSystem: "shadcn",
  colorMode: "light",
};

export function normalizeAppearancePreference(value: unknown): AppearancePreferenceV1 | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1) {
    return null;
  }
  if (candidate.designSystem !== "shadcn" && candidate.designSystem !== "astryx") {
    return null;
  }
  if (
    candidate.colorMode !== "system" &&
    candidate.colorMode !== "light" &&
    candidate.colorMode !== "dark"
  ) {
    return null;
  }

  return {
    version: 1,
    designSystem: candidate.designSystem,
    colorMode: candidate.colorMode,
  };
}

export function parseAppearancePreference(raw: string | null): AppearancePreferenceV1 | null {
  if (raw === null) {
    return null;
  }

  try {
    return normalizeAppearancePreference(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function resolveColorMode(mode: ColorMode, systemPrefersDark: boolean): ResolvedTheme {
  return mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
}

export function migrateLegacyTheme(raw: string | null): AppearancePreferenceV1 | null {
  return raw === "light" || raw === "dark"
    ? {
        version: 1,
        designSystem: "shadcn",
        colorMode: raw,
      }
    : null;
}
