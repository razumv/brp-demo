"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import type { DealerWorkflow } from "@/lib/dealer/contracts";
import {
  createDealerLocalAdapter,
  dealerCapabilities,
  getDealerIdentity,
} from "@/lib/dealer/local-adapter";

const DealerWorkflowContext = createContext<DealerWorkflow | null>(null);

export function DealerWorkflowProvider({ children }: { children: ReactNode }) {
  const store = useDemoStore();

  const commands = useMemo(() => createDealerLocalAdapter(store, {
    async writeClipboard(text) {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
    },
  }), [store]);

  const value = useMemo<DealerWorkflow>(() => ({
    hydrated: store.hydrated,
    snapshot: {
      customers: store.state.customers,
      equipment: store.state.equipment,
      cart: store.state.cart,
      orders: store.state.orders,
      workshopOrders: store.state.workshopOrders,
    },
    identity: getDealerIdentity(store.state),
    capabilities: dealerCapabilities,
    commands,
  }), [commands, store.hydrated, store.state]);

  return (
    <DealerWorkflowContext.Provider value={value}>
      {children}
    </DealerWorkflowContext.Provider>
  );
}

export function useDealerWorkflow() {
  const value = useContext(DealerWorkflowContext);
  if (!value) {
    throw new Error("useDealerWorkflow must be used inside DealerWorkflowProvider");
  }
  return value;
}
