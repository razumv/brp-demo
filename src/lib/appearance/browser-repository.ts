import type {
  AppearancePreferenceV1,
  AppearancePublicationContext,
  AppearancePreferencesRepository,
  AppearanceWriteContext,
} from "./contracts";
import {
  APPEARANCE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  migrateLegacyTheme,
  normalizeAppearancePreference,
  parseAppearancePreference,
} from "./preference-codec";

export interface AppearanceStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AppearanceStorageEvent {
  key: string | null;
  newValue: string | null;
}

export interface BrowserAppearanceRepositoryDependencies {
  storage: AppearanceStoragePort;
  addStorageListener(listener: (event: AppearanceStorageEvent) => void): void;
  removeStorageListener(listener: (event: AppearanceStorageEvent) => void): void;
}

type AppearanceListener = (
  preference: AppearancePreferenceV1,
  context: AppearancePublicationContext,
) => void;

function copyAppearancePreference(
  preference: AppearancePreferenceV1,
): AppearancePreferenceV1 {
  return {
    version: 1,
    designSystem: preference.designSystem,
    colorMode: preference.colorMode,
  };
}

export class BrowserAppearancePreferencesRepository implements AppearancePreferencesRepository {
  private readonly listeners = new Set<AppearanceListener>();
  private lastKnownGood: AppearancePreferenceV1 | null = null;
  private listening = false;

  constructor(private readonly dependencies: BrowserAppearanceRepositoryDependencies) {}

  async read(): Promise<AppearancePreferenceV1 | null> {
    const current = parseAppearancePreference(
      this.dependencies.storage.getItem(APPEARANCE_STORAGE_KEY),
    );
    if (current) {
      this.lastKnownGood = copyAppearancePreference(current);
      return copyAppearancePreference(this.lastKnownGood);
    }

    const migrated = migrateLegacyTheme(
      this.dependencies.storage.getItem(LEGACY_THEME_STORAGE_KEY),
    );
    if (!migrated) {
      return this.lastKnownGood ? copyAppearancePreference(this.lastKnownGood) : null;
    }

    this.dependencies.storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(migrated));
    this.lastKnownGood = copyAppearancePreference(migrated);
    try {
      this.dependencies.storage.removeItem(LEGACY_THEME_STORAGE_KEY);
    } catch {
      // The v1 record now has precedence; leaving the legacy value is non-fatal.
    }
    return copyAppearancePreference(this.lastKnownGood);
  }

  async write(
    preference: AppearancePreferenceV1,
    context?: AppearanceWriteContext,
  ): Promise<void> {
    const normalized = normalizeAppearancePreference(preference);
    if (!normalized) {
      throw new TypeError("Appearance preference must use the supported v1 contract.");
    }

    this.dependencies.storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(normalized));
    this.lastKnownGood = copyAppearancePreference(normalized);
    this.publish(this.lastKnownGood, {
      origin: "local-write",
      operationId: context?.operationId ?? null,
    });
  }

  subscribe(listener: AppearanceListener): () => void {
    const registration: AppearanceListener = (preference, context) =>
      listener(preference, context);
    this.listeners.add(registration);
    if (!this.listening) {
      this.dependencies.addStorageListener(this.handleStorageEvent);
      this.listening = true;
    }

    return () => {
      this.listeners.delete(registration);
      if (this.listeners.size === 0 && this.listening) {
        this.dependencies.removeStorageListener(this.handleStorageEvent);
        this.listening = false;
      }
    };
  }

  private readonly handleStorageEvent = (event: AppearanceStorageEvent): void => {
    if (event.key !== APPEARANCE_STORAGE_KEY) {
      return;
    }

    const preference = parseAppearancePreference(event.newValue);
    if (!preference) {
      return;
    }

    this.lastKnownGood = copyAppearancePreference(preference);
    this.publish(this.lastKnownGood, {origin: "external", operationId: null});
  };

  private publish(
    preference: AppearancePreferenceV1,
    context: AppearancePublicationContext,
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(copyAppearancePreference(preference), context);
      } catch {
        // Observer code is isolated so durable persistence and other observers continue.
      }
    }
  }
}

export function createBrowserAppearanceRepository(): BrowserAppearancePreferencesRepository | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return new BrowserAppearancePreferencesRepository({
      storage: window.localStorage,
      addStorageListener(listener) {
        window.addEventListener("storage", listener);
      },
      removeStorageListener(listener) {
        window.removeEventListener("storage", listener);
      },
    });
  } catch {
    return null;
  }
}
