"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import {usePathname, useRouter} from "next/navigation";
import {useAppearance} from "@/components/appearance/use-appearance";
import {useDealerWorkflow} from "@/components/dealer/dealer-workflow-provider";
import {useDemoStore} from "@/components/providers/demo-store-provider";
import {
  useDealerGlobalPartsSearchController,
  type DealerGlobalPartsSearchController,
} from "@/components/shell/global-parts-search";
import {navForRole, type NavItem} from "@/components/shell/nav-data";
import {usePersistedChoicePreference} from "@/components/shell/use-shell-preferences";
import {dealerNewDocumentCount} from "@/lib/dealer/secondary-data";
import type {DealerCommandResult} from "@/lib/dealer/contracts";
import {formatMoney, getPart, orderTotal} from "@/lib/mock-data";
import type {Part, Role} from "@/lib/types";

export type ShellRenderer = "current" | "astryx";
export type ShellOverlay = "mobile-navigation" | "mobile-search" | "dealer-cart" | null;
export type ShellPopover = "language" | "notifications" | "profile" | null;
export type ShellTrigger = Exclude<ShellOverlay, null>;

export type ShellLanguage = "uk" | "en" | "ru";

export const SHELL_LANGUAGES: readonly {id: ShellLanguage; label: string; shortLabel: string}[] = [
  {id: "uk", label: "Українська", shortLabel: "UA"},
  {id: "en", label: "English", shortLabel: "EN"},
  {id: "ru", label: "Русский", shortLabel: "RU"},
];

function isShellLanguage(value: string): value is ShellLanguage {
  return SHELL_LANGUAGES.some((language) => language.id === value);
}

export type ShellNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  read: boolean;
};

const initialAdminNotifications: readonly ShellNotification[] = [
  {
    id: "orders-awaiting-review",
    title: "Нові замовлення очікують перевірки",
    description: "Відкрийте пайплайн, щоб переглянути поточну чергу.",
    href: "/admin/order-pipeline",
    read: false,
  },
  {
    id: "ocean-eta-updated",
    title: "Оновлено ETA морського перевезення",
    description: "Статуси BL доступні у розділі морських перевезень.",
    href: "/admin/ocean-freight",
    read: false,
  },
];

export type ShellIdentity = {
  name: string;
  company: string;
};

export type ShellNavItem = NavItem & {
  badge?: string;
  isSelected: boolean;
};

export type ShellNavGroup = {
  label?: string;
  items: ShellNavItem[];
};

export type DealerCartLine = {
  partNumber: string;
  quantity: number;
  part: Part;
};

export type ShellTriggerRefs = Record<
  ShellRenderer,
  Record<ShellTrigger, RefObject<HTMLButtonElement | null>>
>;

type CommonShellController = {
  role: Role;
  hydrated: boolean;
  authorized: boolean;
  pathname: string;
  renderedDesignSystem: "shadcn" | "astryx";
  identity: ShellIdentity;
  navGroups: ShellNavGroup[];
  globalQuery: string;
  setGlobalQuery(query: string): void;
  overlay: ShellOverlay;
  popover: ShellPopover;
  resolvedTheme: "light" | "dark";
  language: ShellLanguage;
  notifications: readonly ShellNotification[];
  unreadNotificationCount: number;
  triggerRefs: ShellTriggerRefs;
  openOverlay(overlay: Exclude<ShellOverlay, null>): void;
  closeOverlay(): void;
  togglePopover(popover: Exclude<ShellPopover, null>): void;
  closePopover(): void;
  closeTransientUi(): void;
  toggleTheme(): void;
  setLanguage(language: ShellLanguage): void;
  markNotificationRead(notificationId: string): void;
  markAllNotificationsRead(): void;
  openNotification(notification: ShellNotification): void;
  logout(): void;
  openAdminSearch(): void;
  runAdminSearch(): void;
  submitAdminSearch(event: FormEvent<HTMLFormElement>): void;
};

export type AdminAppShellController = CommonShellController & {
  role: "admin";
  dealerSearch: null;
  cart: null;
};

export type DealerCartController = {
  lines: DealerCartLine[];
  count: number;
  total: number;
  formattedTotal: string;
  error: string;
  clear(): Promise<void>;
  remove(partNumber: string): Promise<void>;
  setQuantity(partNumber: string, quantity: number): Promise<void>;
  openCheckout(): void;
  openCatalog(): void;
};

export type DealerAppShellController = CommonShellController & {
  role: "dealer";
  dealerSearch: DealerGlobalPartsSearchController;
  cart: DealerCartController;
};

export type AppShellController = AdminAppShellController | DealerAppShellController;

function createTriggerRef(): RefObject<HTMLButtonElement | null> {
  return {current: null};
}

function isPathSelected(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function commandErrorMessage(result: Exclude<DealerCommandResult<void>, {ok: true}>) {
  if (result.kind === "local-error") return result.message;
  if (result.kind === "validation-error") {
    return result.issues[0]?.message ?? "Не вдалося оновити кошик.";
  }
  return "Не вдалося оновити кошик.";
}

function useCommonShellController(role: Role) {
  const router = useRouter();
  const pathname = usePathname();
  const {state, hydrated, setSession} = useDemoStore();
  const {
    desiredPreference,
    renderedDesignSystem,
    resolvedTheme,
    updatePreference,
  } = useAppearance();
  const [globalQuery, setGlobalQuery] = useState("");
  const [language, setLanguage] = usePersistedChoicePreference<ShellLanguage>(
    "brp-clone-ui-v1:language",
    "uk",
    isShellLanguage,
  );
  const [notifications, setNotifications] = useState<ShellNotification[]>(() => (
    role === "admin" ? [...initialAdminNotifications] : []
  ));
  const [overlayState, setOverlayState] = useState<{
    value: ShellOverlay;
    pathname: string;
  }>({value: null, pathname});
  const [popoverState, setPopoverState] = useState<{
    value: ShellPopover;
    pathname: string;
  }>({value: null, pathname});
  const overlay = overlayState.pathname === pathname ? overlayState.value : null;
  const popover = popoverState.pathname === pathname ? popoverState.value : null;
  const triggerRefs = useMemo<ShellTriggerRefs>(() => ({
    current: {
      "mobile-navigation": createTriggerRef(),
      "mobile-search": createTriggerRef(),
      "dealer-cart": createTriggerRef(),
    },
    astryx: {
      "mobile-navigation": createTriggerRef(),
      "mobile-search": createTriggerRef(),
      "dealer-cart": createTriggerRef(),
    },
  }), []);

  useEffect(() => {
    if (hydrated && state.session?.role !== role) router.replace("/login");
  }, [hydrated, role, router, state.session?.role]);

  const identity = useMemo<ShellIdentity>(() => ({
    name: state.session?.displayName || (role === "admin" ? "Razumv Admin" : "Финансы"),
    company: state.session?.company || "Logos",
  }), [role, state.session?.company, state.session?.displayName]);

  const openOverlay = useCallback((nextOverlay: Exclude<ShellOverlay, null>) => {
    setPopoverState({value: null, pathname});
    setOverlayState({value: nextOverlay, pathname});
  }, [pathname]);
  const closeOverlay = useCallback(() => {
    const closedOverlay = overlay;
    const activeRenderer: ShellRenderer = renderedDesignSystem === "astryx" ? "astryx" : "current";
    setOverlayState({value: null, pathname});
    if (!closedOverlay) return;
    window.requestAnimationFrame(() => {
      const trigger = triggerRefs[activeRenderer][closedOverlay].current;
      if (trigger?.isConnected) trigger.focus({preventScroll: true});
    });
  }, [overlay, pathname, renderedDesignSystem, triggerRefs]);
  const togglePopover = useCallback((nextPopover: Exclude<ShellPopover, null>) => {
    setOverlayState({value: null, pathname});
    setPopoverState((current) => ({
      value: current.pathname === pathname && current.value === nextPopover ? null : nextPopover,
      pathname,
    }));
  }, [pathname]);
  const closePopover = useCallback(() => {
    setPopoverState({value: null, pathname});
  }, [pathname]);
  const closeTransientUi = useCallback(() => {
    setOverlayState({value: null, pathname});
    setPopoverState({value: null, pathname});
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.brpLanguage = language;
  }, [language]);

  const toggleTheme = useCallback(() => {
    void updatePreference({
      version: 1,
      designSystem: desiredPreference.designSystem,
      colorMode: resolvedTheme === "dark" ? "light" : "dark",
    });
  }, [desiredPreference.designSystem, resolvedTheme, updatePreference]);

  const logout = useCallback(() => {
    setOverlayState({value: null, pathname});
    setPopoverState({value: null, pathname});
    setSession(null);
    router.push("/login");
  }, [pathname, router, setSession]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((current) => current.map((notification) => (
      notification.id === notificationId ? {...notification, read: true} : notification
    )));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({...notification, read: true})));
  }, []);

  const openNotification = useCallback((notification: ShellNotification) => {
    markNotificationRead(notification.id);
    setPopoverState({value: null, pathname});
    router.push(notification.href);
  }, [markNotificationRead, pathname, router]);

  const runAdminSearch = useCallback(() => {
    const query = globalQuery.trim();
    if (!query || role !== "admin") return;
    setPopoverState({value: null, pathname});
    router.push(`/admin/bossweb-lookup?part=${encodeURIComponent(query)}`);
  }, [globalQuery, pathname, role, router]);

  const submitAdminSearch = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runAdminSearch();
  }, [runAdminSearch]);

  const openAdminSearch = useCallback(() => {
    if (role !== "admin") return;
    setPopoverState({value: null, pathname});
    router.push("/admin/bossweb-lookup");
  }, [pathname, role, router]);

  return {
    role,
    hydrated,
    authorized: hydrated && state.session?.role === role,
    pathname,
    renderedDesignSystem,
    identity,
    globalQuery,
    setGlobalQuery,
    overlay,
    popover,
    resolvedTheme,
    language,
    notifications,
    unreadNotificationCount: notifications.filter((notification) => !notification.read).length,
    triggerRefs,
    openOverlay,
    closeOverlay,
    togglePopover,
    closePopover,
    closeTransientUi,
    toggleTheme,
    setLanguage,
    markNotificationRead,
    markAllNotificationsRead,
    openNotification,
    logout,
    openAdminSearch,
    runAdminSearch,
    submitAdminSearch,
  };
}

export function useAdminAppShellController(): AdminAppShellController {
  const common = useCommonShellController("admin");
  const {state} = useDemoStore();
  const navGroups = useMemo<ShellNavGroup[]>(() => navForRole("admin").map((group) => ({
    label: group.label,
    items: group.items.map((item) => ({
      ...item,
      isSelected: isPathSelected(common.pathname, item.href),
      badge: item.href === "/admin/order-pipeline"
        ? String(9 + state.orders.filter((order) => order.status === "new").length)
        : item.badge,
    })),
  })), [common.pathname, state.orders]);

  return {...common, role: "admin", navGroups, dealerSearch: null, cart: null};
}

export function useDealerAppShellController(): DealerAppShellController {
  const common = useCommonShellController("dealer");
  const router = useRouter();
  const {snapshot, commands} = useDealerWorkflow();
  const [cartError, setCartError] = useState("");
  const dealerSearch = useDealerGlobalPartsSearchController({
    query: common.globalQuery,
    onQueryChange: common.setGlobalQuery,
  });
  const navGroups = useMemo<ShellNavGroup[]>(() => navForRole("dealer").map((group) => ({
    label: group.label,
    items: group.items.map((item) => ({
      ...item,
      isSelected: isPathSelected(common.pathname, item.href),
      badge: item.href === "/dealer/orders"
        ? String(snapshot.orders.length)
        : item.href === "/dealer/documents"
          ? String(dealerNewDocumentCount)
          : item.badge,
    })),
  })), [common.pathname, snapshot.orders.length]);
  const lines = useMemo<DealerCartLine[]>(() => snapshot.cart.flatMap((line) => {
    const part = getPart(line.partNumber);
    return part ? [{...line, part}] : [];
  }), [snapshot.cart]);
  const total = useMemo(() => orderTotal(lines.map((line) => ({
    quantity: line.quantity,
    dealerPrice: line.part.dealerPrice,
  }))), [lines]);

  const runCartMutation = useCallback(async (operation: Promise<DealerCommandResult<void>>) => {
    const result = await operation;
    if (result.ok) {
      setCartError("");
      return;
    }
    setCartError(commandErrorMessage(result));
  }, []);

  const cart: DealerCartController = {
    lines,
    count: snapshot.cart.reduce((sum, line) => sum + line.quantity, 0),
    total,
    formattedTotal: formatMoney(total),
    error: cartError,
    clear: () => runCartMutation(commands.clearCart()),
    remove: (partNumber) => runCartMutation(commands.removeCartLine({partNumber})),
    setQuantity: (partNumber, quantity) => runCartMutation(commands.setCartQuantity({partNumber, quantity})),
    openCheckout: () => {
      common.closeTransientUi();
      router.push("/cart");
    },
    openCatalog: () => {
      common.closeTransientUi();
      router.push("/catalog");
    },
  };

  return {
    ...common,
    role: "dealer",
    navGroups,
    dealerSearch,
    cart,
  };
}
