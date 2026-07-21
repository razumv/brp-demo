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
import { getPart, initialDemoState } from "@/lib/mock-data";
import type {
  Customer,
  CustomerInput,
  DemoState,
  Equipment,
  EquipmentInput,
  Order,
  OrderInput,
  OrderMessage,
  Session,
  WorkshopOrder,
  WorkshopOrderInput,
} from "@/lib/types";

const STORAGE_KEY = "brp-clone-demo-state-v1";

type DemoStoreValue = {
  state: DemoState;
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  addToCart: (partNumber: string, quantity?: number, sourceDiagramId?: string) => void;
  setCartQuantity: (partNumber: string, quantity: number) => void;
  removeFromCart: (partNumber: string) => void;
  clearCart: () => void;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, input: CustomerInput) => void;
  addEquipment: (input: EquipmentInput) => Equipment;
  createOrder: (input: OrderInput) => Order;
  addOrderMessage: (orderId: string, body: string, role?: "dealer" | "admin") => void;
  setLineNote: (orderId: string, partNumber: string, note: string) => void;
  addWorkshopOrder: (input: WorkshopOrderInput) => WorkshopOrder;
  resetDemoData: () => void;
};

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function cloneInitialState(): DemoState {
  return JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPersistedState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.version !== 1) return false;
  if (!Array.isArray(value.customers) || !value.customers.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.name === "string")) return false;
  if (!Array.isArray(value.equipment) || !value.equipment.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.customerId === "string")) return false;
  if (!Array.isArray(value.cart) || !value.cart.every((item) => isRecord(item) && typeof item.partNumber === "string" && Number.isInteger(item.quantity) && Number(item.quantity) > 0)) return false;
  if (!Array.isArray(value.orders) || !value.orders.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.code === "string" && Array.isArray(item.lines))) return false;
  if (!Array.isArray(value.workshopOrders) || !value.workshopOrders.every((item) => isRecord(item) && typeof item.id === "string")) return false;
  return true;
}

function restoreSession(value: unknown): Session | null {
  if (!isRecord(value) || value.remember !== true || (value.role !== "dealer" && value.role !== "admin")) return null;
  if (typeof value.email !== "string" || typeof value.displayName !== "string" || typeof value.company !== "string" || typeof value.expiresAt !== "string") return null;
  const expiresAt = Date.parse(value.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? value as Session : null;
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => cloneInitialState());
  const [hydrated, setHydrated] = useState(false);
  const createOrderLock = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isPersistedState(parsed)) setState({ ...parsed, session: restoreSession(parsed.session) });
        else window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // A blocked storage implementation must not prevent the session shell from loading.
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const persisted = {
        ...state,
        session: state.session?.remember ? state.session : null,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // The live in-memory demo remains usable when storage is unavailable.
    }
  }, [hydrated, state]);

  const setSession = useCallback((session: Session | null) => {
    setState((current) => ({ ...current, session }));
  }, []);

  const addToCart = useCallback((partNumber: string, quantity = 1, sourceDiagramId?: string) => {
    if (!getPart(partNumber) || !Number.isInteger(quantity) || quantity <= 0) return;
    setState((current) => {
      const existing = current.cart.find((line) => line.partNumber === partNumber);
      const cart = existing
        ? current.cart.map((line) => line.partNumber === partNumber ? { ...line, quantity: line.quantity + quantity } : line)
        : [...current.cart, { partNumber, quantity, sourceDiagramId }];
      return { ...current, cart };
    });
  }, []);

  const setCartQuantity = useCallback((partNumber: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    setState((current) => ({
      ...current,
      cart: quantity <= 0
        ? current.cart.filter((line) => line.partNumber !== partNumber)
        : current.cart.map((line) => line.partNumber === partNumber ? { ...line, quantity } : line),
    }));
  }, []);

  const removeFromCart = useCallback((partNumber: string) => {
    setState((current) => ({ ...current, cart: current.cart.filter((line) => line.partNumber !== partNumber) }));
  }, []);

  const clearCart = useCallback(() => {
    setState((current) => ({ ...current, cart: [] }));
  }, []);

  const addCustomer = useCallback((input: CustomerInput) => {
    const customer: Customer = {
      ...input,
      id: "customer-" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, customers: [customer, ...current.customers] }));
    return customer;
  }, []);

  const updateCustomer = useCallback((id: string, input: CustomerInput) => {
    setState((current) => ({
      ...current,
      customers: current.customers.map((customer) => customer.id === id ? { ...customer, ...input } : customer),
    }));
  }, []);

  const addEquipment = useCallback((input: EquipmentInput) => {
    const equipment: Equipment = { ...input, id: "equipment-" + Date.now() };
    setState((current) => ({ ...current, equipment: [equipment, ...current.equipment] }));
    return equipment;
  }, []);

  const createOrder = useCallback((input: OrderInput) => {
    if (createOrderLock.current) throw new Error("Order creation is already in progress");
    if (state.cart.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)) {
      throw new Error("Cannot create an order with invalid quantities");
    }
    const timestamp = Date.now();
    const lines = state.cart.flatMap((cartLine) => {
      const part = getPart(cartLine.partNumber);
      return part ? [{
        partNumber: part.number,
        description: part.description,
        quantity: cartLine.quantity,
        dealerPrice: part.dealerPrice,
        source: cartLine.sourceDiagramId ? "catalog" as const : "warehouse" as const,
      }] : [];
    });
    if (!lines.length) throw new Error("Cannot create an order without valid cart lines");
    if (!state.customers.some((customer) => customer.id === input.customerId)) {
      throw new Error("Cannot create an order without a valid customer");
    }
    createOrderLock.current = true;
    const sequence = Math.max(0, ...state.orders.map((order) => {
      const match = order.code.match(/^LOG-(\d+)$/);
      return match ? Number.parseInt(match[1], 10) : 0;
    })) + 1;
    const created: Order = {
      id: "demo-order-" + timestamp,
      code: "LOG-" + String(sequence).padStart(2, "0"),
      company: "Logos",
      creator: state.session?.displayName || "Финансы",
      customerId: input.customerId,
      po: input.po,
      note: input.note,
      delivery: input.delivery,
      status: "new",
      stage: "Очікує постачання",
      createdAt: new Date(timestamp).toISOString(),
      lines,
      messages: [],
      timeline: [{
        id: "event-" + timestamp,
        label: "Замовлення створено",
        detail: "Локальне демонстраційне замовлення",
        createdAt: new Date(timestamp).toISOString(),
      }],
    };
    setState((current) => ({ ...current, orders: [created, ...current.orders], cart: [] }));
    window.queueMicrotask(() => {
      createOrderLock.current = false;
    });
    return created;
  }, [state.cart, state.customers, state.orders, state.session?.displayName]);

  const addOrderMessage = useCallback((orderId: string, body: string, role: "dealer" | "admin" = "dealer") => {
    const message: OrderMessage = {
      id: "message-" + Date.now(),
      author: role === "dealer" ? "Финансы" : "Razumv Admin",
      role,
      body,
      createdAt: new Date().toISOString(),
      demo: true,
    };
    setState((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId
        ? { ...order, messages: [...order.messages, message] }
        : order),
    }));
  }, []);

  const setLineNote = useCallback((orderId: string, partNumber: string, note: string) => {
    setState((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId
        ? { ...order, lines: order.lines.map((line) => line.partNumber === partNumber ? { ...line, privateNote: note } : line) }
        : order),
    }));
  }, []);

  const addWorkshopOrder = useCallback((input: WorkshopOrderInput) => {
    const order: WorkshopOrder = { ...input, id: "workshop-" + Date.now(), status: "new" };
    setState((current) => ({ ...current, workshopOrders: [order, ...current.workshopOrders] }));
    return order;
  }, []);

  const resetDemoData = useCallback(() => {
    setState((current) => ({ ...cloneInitialState(), session: current.session }));
  }, []);

  const value = useMemo<DemoStoreValue>(() => ({
    state,
    hydrated,
    setSession,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    addCustomer,
    updateCustomer,
    addEquipment,
    createOrder,
    addOrderMessage,
    setLineNote,
    addWorkshopOrder,
    resetDemoData,
  }), [
    state,
    hydrated,
    setSession,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    addCustomer,
    updateCustomer,
    addEquipment,
    createOrder,
    addOrderMessage,
    setLineNote,
    addWorkshopOrder,
    resetDemoData,
  ]);

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return value;
}
