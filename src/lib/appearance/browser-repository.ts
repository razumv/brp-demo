import type {
  AppearancePreferenceV1,
  AppearancePreferencesRepository,
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

export class BrowserAppearancePreferencesRepository implements AppearancePreferencesRepository {
  private readonly listeners = new Set<(preference: AppearancePreferenceV1) => void>();
  private lastKnownGood: AppearancePreferenceV1 | null = null;
  private listening = false;

  constructor(private readonly dependencies: BrowserAppearanceRepositoryDependencies) {}

  async read(): Promise<AppearancePreferenceV1 | null> {
    const current = parseAppearancePreference(
      this.dependencies.storage.getItem(APPEARANCE_STORAGE_KEY),
    );
    if (current) {
      this.lastKnownGood = current;
      return current;
    }

    const migrated = migrateLegacyTheme(
      this.dependencies.storage.getItem(LEGACY_THEME_STORAGE_KEY),
    );
    if (!migrated) {
      return this.lastKnownGood;
    }

    this.dependencies.storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(migrated));
    this.lastKnownGood = migrated;
    try {
      this.dependencies.storage.removeItem(LEGACY_THEME_STORAGE_KEY);
    } catch {
      // The v1 preference is already durable; a later read can retry legacy cleanup.
    }
    return migrated;
  }

  async write(preference: AppearancePreferenceV1): Promise<void> {
    const normalized = normalizeAppearancePreference(preference);
    if (!normalized) {
      throw new TypeError("Appearance preference must use the supported v1 contract.");
    }

    this.dependencies.storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(normalized));
    this.lastKnownGood = normalized;
    this.publish(normalized);
  }

  subscribe(listener: (preference: AppearancePreferenceV1) => void): () => void {
    this.listeners.add(listener);
    if (!this.listening) {
      this.dependencies.addStorageListener(this.handleStorageEvent);
      this.listening = true;
    }

    return () => {
      this.listeners.delete(listener);
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

    this.lastKnownGood = preference;
    this.publish(preference);
  };

  private publish(preference: AppearancePreferenceV1): void {
    for (const listener of this.listeners) {
      listener(preference);
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
