"use client";

import {
  useCallback,
  useEffect,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

const storageNamespace = "brp-clone-ui-v1:collapsible:";
const memoryValues = new Map<string, boolean>();
const sameDocumentListeners = new Map<string, Set<() => void>>();

function readStoredBoolean(storageKey: string, fallback: boolean) {
  const memoryValue = memoryValues.get(storageKey);
  if (memoryValue !== undefined) return memoryValue;

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === "1") return true;
    if (storedValue === "0") return false;
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
  return fallback;
}

function notifySameDocument(storageKey: string) {
  sameDocumentListeners.get(storageKey)?.forEach((listener) => listener());
}

function subscribeToStoredBoolean(storageKey: string, listener: () => void) {
  const listeners = sameDocumentListeners.get(storageKey) ?? new Set<() => void>();
  listeners.add(listener);
  sameDocumentListeners.set(storageKey, listeners);

  function handleStorage(event: StorageEvent) {
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    if (event.key !== null && event.key !== storageKey) return;
    if (event.key === null) {
      memoryValues.delete(storageKey);
      listener();
      return;
    }
    if (event.newValue === "1") memoryValues.set(storageKey, true);
    else if (event.newValue === "0") memoryValues.set(storageKey, false);
    else memoryValues.delete(storageKey);
    listener();
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
    listeners.delete(listener);
    if (listeners.size === 0) sameDocumentListeners.delete(storageKey);
  };
}

export function usePersistedBoolean(persistenceId: string, defaultValue: boolean) {
  const storageKey = `${storageNamespace}${persistenceId}`;
  const subscribe = useCallback(
    (listener: () => void) => subscribeToStoredBoolean(storageKey, listener),
    [storageKey],
  );
  const getSnapshot = useCallback(
    () => readStoredBoolean(storageKey, defaultValue),
    [defaultValue, storageKey],
  );
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue !== null && storedValue !== "1" && storedValue !== "0") {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Invalid or unavailable storage must not break the in-memory control.
    }
  }, [storageKey]);

  const setValue = useCallback<Dispatch<SetStateAction<boolean>>>((nextValue) => {
    const previousValue = readStoredBoolean(storageKey, defaultValue);
    const resolvedValue = typeof nextValue === "function" ? nextValue(previousValue) : nextValue;
    memoryValues.set(storageKey, resolvedValue);
    try {
      window.localStorage.setItem(storageKey, resolvedValue ? "1" : "0");
    } catch {
      // The control remains usable in memory when persistence is unavailable.
    }
    notifySameDocument(storageKey);
  }, [defaultValue, storageKey]);

  return { value, setValue, storageKey } as const;
}
