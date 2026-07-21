"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CircleUserRound,
  Globe2,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { getPart, formatMoney, orderTotal } from "@/lib/mock-data";
import { dealerNewDocumentCount } from "@/lib/dealer/secondary-data";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import type { DealerCommandResult } from "@/lib/dealer/contracts";
import { DealerGlobalPartsSearch } from "@/components/shell/global-parts-search";
import { navForRole } from "@/components/shell/nav-data";

function Brand({ role }: { role: Role }) {
  return (
    <Link href={role === "admin" ? "/admin" : "/"} className="brand" aria-label="BRP">
      <span className="brand-tile">BRP</span>
      <span className="brand-copy">
        <strong>{role === "admin" ? "BRP CRM" : "PARTS CATALOG"}</strong>
        <small>{role === "admin" ? "MANAGER PORTAL" : "ENTERPRISE PORTAL"}</small>
      </span>
    </Link>
  );
}

function AdminRoleNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { state } = useDemoStore();
  const groups = navForRole("admin");
  return (
    <nav className="role-nav">
      {groups.map((group, groupIndex) => (
        <div className="nav-group" key={(group.label || "main") + groupIndex}>
          {group.label ? <p className="nav-group-label">{group.label}</p> : null}
          {group.items.map((item) => {
            const exactRoot = item.href === "/" && pathname === "/";
            const active = exactRoot || (item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/")));
            const Icon = item.icon;
            const badge = item.href === "/admin/order-pipeline"
              ? String(9 + state.orders.filter((order) => order.status === "new").length)
              : item.badge;
            return (
              <Link
                href={item.href}
                className={cn("nav-link", active && "nav-link-active")}
                key={item.href}
                onClick={onNavigate}
              >
                <Icon size={16} strokeWidth={1.7} />
                <span>{item.label}</span>
                {badge ? <span className="nav-badge">{badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function DealerRoleNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { snapshot } = useDealerWorkflow();
  const groups = navForRole("dealer");

  return (
    <nav className="role-nav">
      {groups.map((group, groupIndex) => (
        <div className="nav-group" key={(group.label || "main") + groupIndex}>
          {group.label ? <p className="nav-group-label">{group.label}</p> : null}
          {group.items.map((item) => {
            const exactRoot = item.href === "/" && pathname === "/";
            const active = exactRoot || (item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/")));
            const Icon = item.icon;
            const badge = item.href === "/dealer/orders"
              ? String(snapshot.orders.length)
              : item.href === "/dealer/documents"
                ? String(dealerNewDocumentCount)
                : item.badge;
            return (
              <Link
                href={item.href}
                className={cn("nav-link", active && "nav-link-active")}
                key={item.href}
                onClick={onNavigate}
              >
                <Icon size={16} strokeWidth={1.7} />
                <span>{item.label}</span>
                {badge ? <span className="nav-badge">{badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function RoleNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return role === "dealer"
    ? <DealerRoleNav onNavigate={onNavigate} />
    : <AdminRoleNav onNavigate={onNavigate} />;
}

function DealerCartPanel({
  onClose,
  returnFocusRef,
  inertTargets,
}: {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  inertTargets: readonly RefObject<HTMLElement | null>[];
}) {
  const router = useRouter();
  const { snapshot, commands } = useDealerWorkflow();
  const [cartError, setCartError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  useDealerDrawerAccessibility({
    open: true,
    onClose,
    dialogRef,
    returnFocusRef,
    inertTargets,
  });
  const lines = snapshot.cart.flatMap((line) => {
    const part = getPart(line.partNumber);
    return part ? [{ ...line, part }] : [];
  });
  const total = orderTotal(lines.map((line) => ({
    quantity: line.quantity,
    dealerPrice: line.part.dealerPrice,
  })));

  const runCartMutation = async (operation: Promise<DealerCommandResult<void>>) => {
    const result = await operation;
    if (result.ok) {
      setCartError("");
      return;
    }
    setCartError(result.kind === "local-error"
      ? result.message
      : result.kind === "validation-error"
        ? result.issues[0]?.message ?? "Не вдалося оновити кошик."
        : "Не вдалося оновити кошик.");
  };

  const dialog = (
    <div className="drawer-overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <aside ref={dialogRef} className="side-drawer cart-drawer" role="dialog" aria-modal="true" aria-label="Кошик" tabIndex={-1}>
        <header className="drawer-header">
          <div>
            <h2>Кошик</h2>
            <p>{lines.length ? String(lines.length) + " позицій" : "Нове замовлення"}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Закрити кошик" onClick={onClose}><X size={19} /></button>
        </header>
        {cartError ? <p className="drawer-error" role="alert">{cartError}</p> : null}
        {lines.length === 0 ? (
          <div className="cart-empty">
            <span><ShoppingCart size={28} /></span>
            <h3>Кошик порожній</h3>
            <p>Відкрийте каталог, щоб додати запчастини.</p>
            <button type="button" className="button button-primary" onClick={() => {
              onClose();
              router.push("/catalog");
            }}>Відкрити каталог</button>
          </div>
        ) : (
          <>
            <div className="drawer-scroll">
              <div className="drawer-inline-header">
                <span>До найближчої поставки</span>
                <button type="button" onClick={() => void runCartMutation(commands.clearCart())}><Trash2 size={13} /> Очистити</button>
              </div>
              {lines.map((line) => (
                <article className="cart-line" key={line.partNumber}>
                  <div className="cart-line-head">
                    <div>
                      <strong>{line.part.number}</strong>
                      {line.part.description ? <p>{line.part.description}</p> : null}
                    </div>
                    <button type="button" className="icon-button icon-button-small" aria-label={"Видалити " + line.part.number} onClick={() => void runCartMutation(commands.removeCartLine({ partNumber: line.partNumber }))}><X size={14} /></button>
                  </div>
                  <div className="cart-line-foot">
                    <div className="quantity-control">
                      <button type="button" aria-label="Зменшити" onClick={() => void runCartMutation(commands.setCartQuantity({ partNumber: line.partNumber, quantity: line.quantity - 1 }))}>−</button>
                      <span>{line.quantity}</span>
                      <button type="button" aria-label="Збільшити" onClick={() => void runCartMutation(commands.setCartQuantity({ partNumber: line.partNumber, quantity: line.quantity + 1 }))}>+</button>
                    </div>
                    <strong>{formatMoney(line.quantity * line.part.dealerPrice)}</strong>
                  </div>
                </article>
              ))}
            </div>
            <footer className="cart-footer">
              <div><span>Разом</span><strong>{formatMoney(total)}</strong></div>
              <button type="button" className="button button-primary button-wide" onClick={() => {
                onClose();
                router.push("/cart");
              }}>Оформити замовлення</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}

function DealerCartControl({ inertTargets }: { inertTargets: readonly RefObject<HTMLElement | null>[] }) {
  const { snapshot } = useDealerWorkflow();
  const [cartOpen, setCartOpen] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const cartCount = snapshot.cart.reduce((sum, line) => sum + line.quantity, 0);
  const closeCart = useCallback(() => setCartOpen(false), []);

  return (
    <>
      <button ref={cartButtonRef} type="button" className="cart-button" aria-label={`Кошик (${cartCount})`} onClick={() => setCartOpen(true)}>
        <ShoppingCart size={17} /><span>Кошик ({cartCount})</span>
      </button>
      {cartOpen ? <DealerCartPanel onClose={closeCart} returnFocusRef={cartButtonRef} inertTargets={inertTargets} /> : null}
    </>
  );
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function useDealerDrawerAccessibility({
  open,
  onClose,
  dialogRef,
  returnFocusRef,
  inertTargets,
}: {
  open: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement | null>;
  returnFocusRef: RefObject<HTMLElement | null>;
  inertTargets: readonly RefObject<HTMLElement | null>[];
}) {
  useEffect(() => {
    if (!open) return;

    const returnTarget = returnFocusRef.current;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const targetStates = inertTargets.map((target) => ({
      element: target.current,
      hadInert: target.current?.hasAttribute("inert") ?? false,
      ariaHidden: target.current?.getAttribute("aria-hidden") ?? null,
    }));
    const focusDialog = () => {
      const focusTarget = dialogRef.current?.querySelector<HTMLElement>("button:not([disabled]), [href], input:not([disabled])")
        ?? dialogRef.current;
      focusTarget?.focus({ preventScroll: true });
    };

    for (const target of targetStates) {
      target.element?.setAttribute("inert", "");
      target.element?.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.requestAnimationFrame(focusDialog);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => element.tabIndex >= 0 && element.offsetParent !== null && !element.hasAttribute("hidden"));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      for (const target of targetStates) {
        if (!target.element) continue;
        if (!target.hadInert) target.element.removeAttribute("inert");
        if (target.ariaHidden === null) target.element.removeAttribute("aria-hidden");
        else target.element.setAttribute("aria-hidden", target.ariaHidden);
      }
      window.requestAnimationFrame(() => returnTarget?.focus({ preventScroll: true }));
    };
  }, [dialogRef, inertTargets, onClose, open, returnFocusRef]);
}

function DealerMobileNavigation({
  onClose,
  returnFocusRef,
  inertTargets,
}: {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  inertTargets: readonly RefObject<HTMLElement | null>[];
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useDealerDrawerAccessibility({
    open: true,
    onClose,
    dialogRef,
    returnFocusRef,
    inertTargets,
  });

  return (
    <div className="drawer-overlay mobile-nav-overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <aside ref={dialogRef} className="side-drawer mobile-nav-drawer dealer-mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Навігація" tabIndex={-1}>
        <header className="drawer-header"><Brand role="dealer" /><button type="button" className="icon-button" onClick={onClose} aria-label="Закрити меню"><X size={19} /></button></header>
        <div className="drawer-scroll"><DealerRoleNav onNavigate={onClose} /></div>
      </aside>
    </div>
  );
}

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const { state, hydrated, setSession } = useDemoStore();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobilePartsSearchOpen, setMobilePartsSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const mobileSearchButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dealerInertTargets = useMemo(() => [headerRef, bodyRef] as const, []);
  const closeMobileMenu = useCallback(() => setMobileMenu(false), []);
  const closeMobilePartsSearch = useCallback(() => setMobilePartsSearchOpen(false), []);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem("brp-clone-theme");
    } catch {
      // Keep the default theme when browser storage is unavailable.
    }
    const nextTheme = saved === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    const frame = window.requestAnimationFrame(() => setTheme(nextTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated && state.session?.role !== role) router.replace("/login");
  }, [hydrated, role, router, state.session?.role]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem("brp-clone-theme", next);
    } catch {
      // Theme changes remain usable for the current tab without persistence.
    }
  };

  const identity = useMemo(() => ({
    name: state.session?.displayName || (role === "admin" ? "Razumv Admin" : "Финансы"),
    company: state.session?.company || "Logos",
  }), [role, state.session?.company, state.session?.displayName]);

  if (!hydrated || state.session?.role !== role) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="skeleton" />
        <p>Перевіряємо доступ…</p>
      </main>
    );
  }

  const submitGlobalSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!globalQuery.trim()) return;
    if (role === "admin") router.push("/admin/bossweb-lookup?part=" + encodeURIComponent(globalQuery.trim()));
  };

  return (
    <div className="app-shell">
      <header ref={headerRef} className="app-header">
        <button ref={mobileMenuButtonRef} type="button" className="icon-button mobile-menu-button" aria-label="Меню" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
        <Brand role={role} />
        {role === "dealer" ? (
          <DealerGlobalPartsSearch
            query={globalQuery}
            onQueryChange={setGlobalQuery}
            mobileOpen={mobilePartsSearchOpen}
            onMobileClose={closeMobilePartsSearch}
            returnFocusRef={mobileSearchButtonRef}
          />
        ) : (
          <form className="global-search" onSubmit={submitGlobalSearch}>
            <button type="submit" className="global-search-submit" aria-label="Виконати глобальний пошук">
              <Search size={17} />
            </button>
            <input
              aria-label="Глобальний пошук"
              placeholder="напр. 507032417, brake..."
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
            />
          </form>
        )}
        <button ref={mobileSearchButtonRef} type="button" className="icon-button mobile-search-button" aria-label="Пошук" onClick={() => {
          if (role === "admin") router.push("/admin/bossweb-lookup");
          else setMobilePartsSearchOpen(true);
        }}><Search size={19} /></button>
        <div className="header-actions">
          <button type="button" className="icon-button" aria-label={theme === "dark" ? "switch_to_light" : "switch_to_dark"} onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {role === "admin" ? (
            <>
              <div className="menu-anchor">
                <button type="button" className="header-language" aria-label="language_switcher" onClick={() => {
                  setLanguageOpen(!languageOpen);
                  setProfileOpen(false);
                }}><Globe2 size={17} /><span>UA</span></button>
                {languageOpen ? (
                  <div className="popover-menu language-menu">
                    {["English", "Русский", "Українська"].map((language) => (
                      <button type="button" key={language} onClick={() => setLanguageOpen(false)}>
                        <span>{language}</span>{language === "Українська" ? <Check size={14} /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="icon-button notification-button" aria-label="Сповіщення"><Bell size={18} /><span>9+</span></button>
            </>
          ) : null}
          <div className="profile-summary">
            <div><strong>{identity.name}</strong><small>{identity.company}</small></div>
            <div className="menu-anchor">
              <button type="button" className="avatar-button" aria-label="Профіль" onClick={() => {
                setProfileOpen(!profileOpen);
                setLanguageOpen(false);
              }}><CircleUserRound size={20} /></button>
              {profileOpen ? (
                <div className="popover-menu profile-menu">
                  <div className="popover-profile"><strong>{identity.name}</strong><span>{role === "admin" ? "Адміністратор" : "Дилер"}</span></div>
                  <button type="button" onClick={() => {
                    setSession(null);
                    setProfileOpen(false);
                    router.push("/login");
                  }}>Вийти</button>
                </div>
              ) : null}
            </div>
          </div>
          {role === "dealer" ? (
            <DealerCartControl inertTargets={dealerInertTargets} />
          ) : null}
        </div>
      </header>

      <div ref={bodyRef} className="app-body">
        <aside className="desktop-sidebar"><RoleNav role={role} /></aside>
        <main className="app-main">{children}</main>
      </div>

      {mobileMenu ? (
        role === "dealer"
          ? <DealerMobileNavigation onClose={closeMobileMenu} returnFocusRef={mobileMenuButtonRef} inertTargets={dealerInertTargets} />
          : <div className="drawer-overlay mobile-nav-overlay" role="presentation" onMouseDown={(event) => {
            if (event.currentTarget === event.target) setMobileMenu(false);
          }}>
            <aside className="side-drawer mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Навігація">
              <header className="drawer-header"><Brand role={role} /><button type="button" className="icon-button" onClick={() => setMobileMenu(false)} aria-label="Закрити меню"><X size={19} /></button></header>
              <div className="drawer-scroll"><RoleNav role={role} onNavigate={() => setMobileMenu(false)} /></div>
            </aside>
          </div>
      ) : null}
    </div>
  );
}
