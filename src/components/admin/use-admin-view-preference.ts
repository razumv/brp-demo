"use client";

import {useCallback} from "react";
import {usePersistedBooleanPreference} from "@/components/shell/use-shell-preferences";

export type AdminViewMode = "cards" | "list";
type AdminViewRouteKey = "companies" | "users";

function storageKey(routeKey: AdminViewRouteKey) {
  return `brp-clone-ui-v1:astryx-admin-${routeKey}-view-list`;
}

/**
 * Stores only presentation preference. Filtering, record identity, and every
 * business action remain owned by the route controller.
 */
export function useAdminViewPreference(routeKey: "companies" | "users"): readonly [AdminViewMode, (mode: AdminViewMode) => void] {
  const [isList, setIsList] = usePersistedBooleanPreference(storageKey(routeKey), false);
  const setMode = useCallback((mode: AdminViewMode) => setIsList(mode === "list"), [setIsList]);

  return [isList ? "list" : "cards", setMode] as const;
}
