"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import type {
  DealerAttachmentMetadata,
  DealerCustomer,
  DealerCustomerInput,
  DealerIdentity,
  DealerLocalState,
  DealerOrderBuilder,
  DealerWorkflow,
} from "@/lib/dealer/contracts";
import {
  createDealerLocalAdapter,
  dealerCapabilities,
  DealerLocalPersistenceError,
  type DealerStorePort,
} from "@/lib/dealer/local-adapter";
import {
  dealerIdentityKey,
  dealerWorkflowStorageKey,
  getDealerIdentityFromFields,
} from "@/lib/dealer/identity";
import {
  appendDealerOrderMessage,
  createDealerCustomer,
  createEmptyDealerState,
  createInitialDealerState,
  createLocalDealerOrder,
  deleteDealerCustomer,
  deleteDealerEquipment,
  deleteDealerOrderDraft,
  normalizeDealerLocalStateForOwner,
  openDealerOrderDraft,
  saveDealerOrderDraft,
  setDealerOrderLineNote,
  startDealerOrderDraft,
  transitionDealerWorkshopOrder,
  updateDealerCustomer,
  updateDealerEquipment,
  updateDealerOrderBuilder,
} from "@/lib/dealer/order-state";
import {
  readDealerWorkflowPayload,
  removeDealerWorkflowPayload,
  writeDealerWorkflowPayload,
} from "@/lib/dealer/workflow-persistence";
import { getPart } from "@/lib/mock-data";
import type {
  Equipment,
  EquipmentInput,
  OrderInput,
  WorkshopOrder,
  WorkshopOrderInput,
} from "@/lib/types";

const DealerWorkflowContext = createContext<DealerWorkflow | null>(null);

function localId(prefix: string) {
  const id = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

export function DealerWorkflowProvider({ children }: { children: ReactNode }) {
  const sharedStore = useDemoStore();
  const emptyStateRef = useRef<DealerLocalState>(
    createEmptyDealerState(new Date().toISOString(), "submission-unavailable"),
  );
  const [state, setState] = useState<DealerLocalState>(emptyStateRef.current);
  const [dealerHydrated, setDealerHydrated] = useState(false);
  const [activeOwnerKey, setActiveOwnerKey] = useState<string | null>(null);
  const stateRef = useRef(state);
  const sharedStateRef = useRef(sharedStore.state);
  const sessionRole = sharedStore.state.session?.role ?? null;
  const sessionEmail = sharedStore.state.session?.email ?? "";
  const sessionDisplayName = sharedStore.state.session?.displayName ?? "";
  const sessionCompany = sharedStore.state.session?.company ?? "";
  const identity = useMemo(() => getDealerIdentityFromFields(
    sessionRole,
    sessionEmail,
    sessionDisplayName,
    sessionCompany,
  ), [sessionCompany, sessionDisplayName, sessionEmail, sessionRole]);
  const ownerKey = identity ? dealerIdentityKey(identity) : null;
  const storageKey = identity ? dealerWorkflowStorageKey(identity) : null;
  const ready = Boolean(
    dealerHydrated
    && ownerKey
    && activeOwnerKey === ownerKey
    && state.ownerKey === ownerKey,
  );
  const readyRef = useRef(ready);
  const identityRef = useRef<DealerIdentity | null>(identity);

  stateRef.current = state;
  sharedStateRef.current = sharedStore.state;
  readyRef.current = ready;
  identityRef.current = ready ? identity : null;

  const replaceState = useCallback((next: DealerLocalState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const commit = useCallback((update: (current: DealerLocalState) => DealerLocalState) => {
    if (!readyRef.current) throw new Error("Дилерська сесія ще не готова.");
    const next = update(stateRef.current);
    if (!storageKey) throw new DealerLocalPersistenceError();
    try {
      writeDealerWorkflowPayload(window.localStorage, storageKey, next);
    } catch (error) {
      if (error instanceof DealerLocalPersistenceError) throw error;
      throw new DealerLocalPersistenceError();
    }
    replaceState(next);
    return next;
  }, [replaceState, storageKey]);

  useEffect(() => {
    if (!sharedStore.hydrated) return;
    setDealerHydrated(false);
    setActiveOwnerKey(null);
    replaceState(createEmptyDealerState(new Date().toISOString(), "submission-unavailable"));
    if (!identity || !ownerKey || !storageKey) return;

    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }

    try {
      const saved = storage ? readDealerWorkflowPayload(storage, storageKey) : null;
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const normalized = normalizeDealerLocalStateForOwner(parsed, ownerKey);
        if (normalized) replaceState(normalized);
        else {
          if (storage) removeDealerWorkflowPayload(storage, storageKey);
          replaceState(createInitialDealerState(
            sharedStateRef.current,
            ownerKey,
            identity.company,
            new Date().toISOString(),
            localId("submission"),
          ));
        }
      } else {
        replaceState(createInitialDealerState(
          sharedStateRef.current,
          ownerKey,
          identity.company,
          new Date().toISOString(),
          localId("submission"),
        ));
      }
    } catch {
      if (storage) removeDealerWorkflowPayload(storage, storageKey);
      replaceState(createInitialDealerState(
        sharedStateRef.current,
        ownerKey,
        identity.company,
        new Date().toISOString(),
        localId("submission"),
      ));
    } finally {
      setActiveOwnerKey(ownerKey);
      setDealerHydrated(true);
    }
  }, [identity, ownerKey, replaceState, sharedStore.hydrated, storageKey]);

  useEffect(() => {
    if (!ready || !storageKey) return;
    try {
      writeDealerWorkflowPayload(window.localStorage, storageKey, state);
    } catch {
      // The in-memory dealer workflow remains usable when storage is unavailable.
    }
  }, [ready, state, storageKey]);

  const storePort = useMemo<DealerStorePort>(() => ({
    isReady() {
      return readyRef.current && identityRef.current !== null;
    },
    get state() {
      return stateRef.current;
    },
    addToCart(partNumber, quantity = 1, sourceDiagramId) {
      if (!getPart(partNumber) || !Number.isInteger(quantity) || quantity <= 0) return;
      commit((current) => {
        const existing = current.cart.find((line) => line.partNumber === partNumber);
        return {
          ...current,
          cart: existing
            ? current.cart.map((line) => line.partNumber === partNumber
              ? { ...line, quantity: line.quantity + quantity, sourceDiagramId: line.sourceDiagramId ?? sourceDiagramId }
              : line)
            : [...current.cart, { partNumber, quantity, sourceDiagramId }],
        };
      });
    },
    setCartQuantity(partNumber, quantity) {
      commit((current) => ({
        ...current,
        cart: quantity <= 0
          ? current.cart.filter((line) => line.partNumber !== partNumber)
          : current.cart.map((line) => line.partNumber === partNumber ? { ...line, quantity } : line),
      }));
    },
    removeFromCart(partNumber) {
      commit((current) => ({
        ...current,
        cart: current.cart.filter((line) => line.partNumber !== partNumber),
      }));
    },
    clearCart() {
      commit((current) => ({ ...current, cart: [] }));
    },
    addCustomer(input: DealerCustomerInput): DealerCustomer {
      let created: DealerCustomer | null = null;
      commit((current) => {
        const result = createDealerCustomer(current, {
          customer: input,
          category: input.category,
          id: localId("customer"),
          now: new Date().toISOString(),
        });
        created = result.customer;
        return result.state;
      });
      if (!created) throw new Error("Не вдалося створити клієнта.");
      return created;
    },
    updateCustomer(id: string, input: DealerCustomerInput) {
      commit((current) => updateDealerCustomer(current, { id, customer: input, category: input.category }));
    },
    deleteCustomer(id: string) {
      commit((current) => deleteDealerCustomer(current, id));
    },
    addEquipment(input: EquipmentInput): Equipment {
      const equipment: Equipment = { ...input, id: localId("equipment") };
      commit((current) => ({ ...current, equipment: [equipment, ...current.equipment] }));
      return equipment;
    },
    updateEquipment(id: string, customerId: string, input: EquipmentInput) {
      commit((current) => updateDealerEquipment(current, { id, customerId, equipment: input }));
    },
    deleteEquipment(id: string, customerId: string) {
      commit((current) => deleteDealerEquipment(current, { id, customerId }));
    },
    updateOrderBuilder(input: Partial<Pick<DealerOrderBuilder, "title" | "customerId" | "po" | "note" | "delivery">>) {
      commit((current) => updateDealerOrderBuilder(current, input, new Date().toISOString()));
    },
    startOrderDraft() {
      commit((current) => startDealerOrderDraft(
        current,
        new Date().toISOString(),
        localId("submission"),
      ));
    },
    saveOrderDraft() {
      let saved = stateRef.current.drafts[0];
      commit((current) => {
        const result = saveDealerOrderDraft(current, localId("draft"), new Date().toISOString());
        saved = result.draft;
        return result.state;
      });
      if (!saved) throw new Error("Не вдалося зберегти чернетку.");
      return saved;
    },
    openOrderDraft(draftId) {
      commit((current) => openDealerOrderDraft(current, draftId, new Date().toISOString()));
    },
    deleteOrderDraft(draftId) {
      commit((current) => deleteDealerOrderDraft(
        current,
        draftId,
        localId("submission"),
        new Date().toISOString(),
      ));
    },
    refreshOrderDrafts() {
      return stateRef.current.drafts;
    },
    createOrder(input: OrderInput) {
      const activeIdentity = identityRef.current;
      if (!activeIdentity) throw new Error("Дилерська сесія недоступна.");
      let created = stateRef.current.orders[0];
      commit((current) => {
        const withInput = updateDealerOrderBuilder(current, input, new Date().toISOString());
        const result = createLocalDealerOrder(
          withInput,
          activeIdentity,
          new Date().toISOString(),
          localId("dealer-order"),
          localId("submission"),
        );
        created = result.order;
        return result.state;
      });
      if (!created) throw new Error("Не вдалося створити замовлення.");
      return created;
    },
    addOrderMessage(orderId: string, body: string, attachments: readonly DealerAttachmentMetadata[]) {
      const activeIdentity = identityRef.current;
      if (!activeIdentity) throw new Error("Дилерська сесія недоступна.");
      commit((current) => appendDealerOrderMessage(current, {
        orderId,
        body,
        attachments,
        identity: activeIdentity,
        now: new Date().toISOString(),
        messageId: localId("message"),
        eventId: localId("event"),
      }));
    },
    setLineNote(orderId, partNumber, note) {
      commit((current) => setDealerOrderLineNote(current, {
        orderId,
        partNumber,
        note,
        now: new Date().toISOString(),
        eventId: localId("event"),
      }));
    },
    addWorkshopOrder(input: WorkshopOrderInput): WorkshopOrder {
      const order: WorkshopOrder = { ...input, id: localId("workshop"), status: "new" };
      commit((current) => ({
        ...current,
        workshopOrders: [order, ...current.workshopOrders],
      }));
      return order;
    },
    transitionWorkshopOrder(id: string, status: WorkshopOrder["status"]) {
      commit((current) => transitionDealerWorkshopOrder(current, { id, status }));
    },
  }), [commit]);

  const commands = useMemo(() => createDealerLocalAdapter(storePort, {
    async writeClipboard(text) {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
    },
  }), [storePort]);

  const value = useMemo<DealerWorkflow>(() => ({
    hydrated: ready,
    snapshot: ready ? state : emptyStateRef.current,
    identity: ready ? identity : null,
    capabilities: dealerCapabilities,
    commands,
  }), [commands, identity, ready, state]);

  const dealerSessionPresent = sharedStore.hydrated && sharedStore.state.session?.role === "dealer";

  if (dealerSessionPresent && !identity) {
    return (
      <main className="auth-loading" role="alert">
        <p>Не вдалося підтвердити дані дилерського облікового запису.</p>
        <button type="button" className="button button-outline" onClick={() => sharedStore.setSession(null)}>Повернутися до входу</button>
      </main>
    );
  }

  return (
    <DealerWorkflowContext.Provider value={value}>
      {dealerSessionPresent && !ready ? (
        <main className="auth-loading" aria-live="polite">
          <span className="skeleton" />
          <p>Завантажуємо робочі дані…</p>
        </main>
      ) : children}
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
