"use client";

import {useCallback, useEffect, useState} from "react";

/**
 * Reads browser-only preferences after hydration so the server and first client
 * render retain the supplied fallback. Storage failures leave the in-memory
 * preference usable for the current session.
 */
export function usePersistedBooleanPreference(key: string, fallback: boolean): readonly [boolean, (value: boolean) => void, boolean] {
  const [value, setValue] = useState(fallback);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === "true") setValue(true);
      if (storedValue === "false") setValue(false);
    } catch {
      // Private browsing and embedded contexts can deny localStorage access.
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  const setPersistedValue = useCallback((nextValue: boolean) => {
    setValue(nextValue);
    try {
      window.localStorage.setItem(key, String(nextValue));
    } catch {
      // Keep the live control responsive even when the browser rejects writes.
    }
  }, [key]);

  return [value, setPersistedValue, isHydrated] as const;
}

/**
 * Keeps a small, browser-local preference hydration-safe. Values outside the
 * supplied contract are ignored so stale storage cannot put the shell in an
 * unsupported state.
 */
export function usePersistedChoicePreference<Value extends string>(
  key: string,
  fallback: Value,
  isAllowed: (value: string) => value is Value,
): readonly [Value, (value: Value) => void, boolean] {
  const [value, setValue] = useState<Value>(fallback);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue && isAllowed(storedValue)) setValue(storedValue);
    } catch {
      // Private browsing and embedded contexts can deny localStorage access.
    } finally {
      setIsHydrated(true);
    }
  }, [isAllowed, key]);

  const setPersistedValue = useCallback((nextValue: Value) => {
    setValue(nextValue);
    try {
      window.localStorage.setItem(key, nextValue);
    } catch {
      // Keep the live control responsive even when the browser rejects writes.
    }
  }, [key]);

  return [value, setPersistedValue, isHydrated] as const;
}
