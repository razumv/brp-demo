"use client";

import {createContext, useContext, type ReactNode} from "react";
import type {BrpUiAdapter} from "./contracts";

const BrpUiContext = createContext<BrpUiAdapter | null>(null);

export function BrpUiProvider({
  children,
  adapter,
}: {
  children: ReactNode;
  adapter: BrpUiAdapter;
}) {
  return <BrpUiContext.Provider value={adapter}>{children}</BrpUiContext.Provider>;
}

export function useBrpUi(): BrpUiAdapter {
  const adapter = useContext(BrpUiContext);
  if (!adapter) throw new Error("useBrpUi must be used within BrpUiProvider.");
  return adapter;
}
