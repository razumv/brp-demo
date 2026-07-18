"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CircleUserRound,
  Eye,
  Globe2,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getPart, formatMoney } from "@/lib/mock-data";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/components/providers/demo-store-provider";
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

function RoleNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { state } = useDemoStore();
  const groups = navForRole(role);
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
              ? String(state.orders.length)
              : item.href === "/admin/order-pipeline"
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

function CartPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { state, setCartQuantity, removeFromCart, clearCart } = useDemoStore();
  const lines = state.cart.flatMap((line) => {
    const part = getPart(line.partNumber);
    return part ? [{ ...line, part }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.quantity * line.part.dealerPrice, 0);

  return (
    <div className="drawer-overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <aside className="side-drawer cart-drawer" role="dialog" aria-modal="true" aria-label="Кошик">
        <header className="drawer-header">
          <div>
            <h2>Кошик</h2>
            <p>{lines.length ? String(lines.length) + " позицій" : "Нове замовлення"}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Закрити кошик" onClick={onClose}><X size={19} /></button>
        </header>
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
                <button type="button" onClick={clearCart}><Trash2 size={13} /> Очистити</button>
              </div>
              {lines.map((line) => (
                <article className="cart-line" key={line.partNumber}>
                  <div className="cart-line-head">
                    <div>
                      <strong>{line.part.number}</strong>
                      {line.part.description ? <p>{line.part.description}</p> : null}
                    </div>
                    <button type="button" className="icon-button icon-button-small" aria-label={"Видалити " + line.part.number} onClick={() => removeFromCart(line.partNumber)}><X size={14} /></button>
                  </div>
                  <div className="cart-line-foot">
                    <div className="quantity-control">
                      <button type="button" aria-label="Зменшити" onClick={() => setCartQuantity(line.partNumber, line.quantity - 1)}>−</button>
                      <span>{line.quantity}</span>
                      <button type="button" aria-label="Збільшити" onClick={() => setCartQuantity(line.partNumber, line.quantity + 1)}>+</button>
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
}

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const { state, hydrated, setSession, resetDemoData } = useDemoStore();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobilePartsSearchOpen, setMobilePartsSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const mobileSearchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("brp-clone-theme");
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
    window.localStorage.setItem("brp-clone-theme", next);
  };

  const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
  const identity = useMemo(() => role === "admin"
    ? { name: "Razumv Admin", company: "Logos" }
    : { name: state.session?.displayName || "Финансы", company: "Logos" }, [role, state.session?.displayName]);

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
      <header className="app-header">
        <button type="button" className="icon-button mobile-menu-button" aria-label="Меню" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
        <Brand role={role} />
        {role === "dealer" ? (
          <DealerGlobalPartsSearch
            query={globalQuery}
            onQueryChange={setGlobalQuery}
            mobileOpen={mobilePartsSearchOpen}
            onMobileClose={() => setMobilePartsSearchOpen(false)}
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
          {role === "dealer" ? (
            <button type="button" className="icon-button header-secondary-action" aria-label="Режим клієнта" title="Режим клієнта"><Eye size={18} /></button>
          ) : null}
          <button type="button" className="icon-button" aria-label={theme === "dark" ? "switch_to_light" : "switch_to_dark"} onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
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
          <button type="button" className="icon-button notification-button" aria-label="Сповіщення"><Bell size={18} />{role === "admin" ? <span>9+</span> : null}</button>
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
                  {role === "dealer" ? (
                    <button type="button" onClick={() => {
                      resetDemoData();
                      setProfileOpen(false);
                    }}><Trash2 size={15} /> Скинути демо-дані</button>
                  ) : null}
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
            <button type="button" className="cart-button" aria-label={"Кошик (" + cartCount + ")"} onClick={() => setCartOpen(true)}>
              <ShoppingCart size={17} /><span>Кошик ({cartCount})</span>
            </button>
          ) : null}
        </div>
      </header>

      <div className="app-body">
        <aside className="desktop-sidebar"><RoleNav role={role} /></aside>
        <main className="app-main">{children}</main>
      </div>

      {mobileMenu ? (
        <div className="drawer-overlay mobile-nav-overlay" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setMobileMenu(false);
        }}>
          <aside className="side-drawer mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Навігація">
            <header className="drawer-header"><Brand role={role} /><button type="button" className="icon-button" onClick={() => setMobileMenu(false)} aria-label="Закрити меню"><X size={19} /></button></header>
            <div className="drawer-scroll"><RoleNav role={role} onNavigate={() => setMobileMenu(false)} /></div>
          </aside>
        </div>
      ) : null}
      {cartOpen ? <CartPanel onClose={() => setCartOpen(false)} /> : null}
    </div>
  );
}
