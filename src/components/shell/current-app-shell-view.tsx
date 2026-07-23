"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  ChevronsLeft,
  ChevronsRight,
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
import {
  useEffect,
  useRef,
  type RefObject,
} from "react";
import {createPortal} from "react-dom";
import type {
  AppShellController,
  DealerAppShellController,
  ShellNavGroup,
  ShellPopover,
} from "@/components/shell/app-shell-controller";
import {SHELL_LANGUAGES} from "@/components/shell/app-shell-controller";
import {DealerGlobalPartsSearch} from "@/components/shell/global-parts-search";
import {formatMoney} from "@/lib/mock-data";
import {cn} from "@/lib/utils";

type ShellInertTargets = readonly RefObject<HTMLElement | null>[];

export function CurrentBrand({controller}: {controller: AppShellController}) {
  const isAdmin = controller.role === "admin";
  return (
    <Link href={isAdmin ? "/admin" : "/"} className="brand" aria-label="BRP">
      <span className="brand-tile">BRP</span>
      <span className="brand-copy">
        <strong>{isAdmin ? "BRP CRM" : "PARTS CATALOG"}</strong>
        <small>{isAdmin ? "MANAGER PORTAL" : "ENTERPRISE PORTAL"}</small>
      </span>
    </Link>
  );
}

function CurrentRoleNav({
  groups,
  onNavigate,
  collapsed = false,
}: {
  groups: ShellNavGroup[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className={cn("role-nav", collapsed && "role-nav-collapsed")} aria-label="Основна навігація">
      {groups.map((group, groupIndex) => (
        <div className="nav-group" key={(group.label || "main") + groupIndex}>
          {group.label ? <p className="nav-group-label">{group.label}</p> : null}
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                className={cn("nav-link", item.isSelected && "nav-link-active")}
                key={item.href}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                onClick={onNavigate}
              >
                <Icon size={16} strokeWidth={1.7} />
                <span>{item.label}</span>
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function CurrentAppShellHeader({
  controller,
  headerRef,
}: {
  controller: AppShellController;
  headerRef: RefObject<HTMLElement | null>;
}) {
  const renderer = "current" as const;
  const isDealer = controller.role === "dealer";
  const {closePopover, popover} = controller;
  const languageTriggerRef = useRef<HTMLButtonElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const popoverNodes = (activePopover: Exclude<ShellPopover, null>) => {
    if (activePopover === "language") return {trigger: languageTriggerRef.current, menu: languageMenuRef.current};
    if (activePopover === "notifications") return {trigger: notificationTriggerRef.current, menu: notificationMenuRef.current};
    return {trigger: profileTriggerRef.current, menu: profileMenuRef.current};
  };

  useEffect(() => {
    if (!popover) return;
    const {trigger, menu} = popoverNodes(popover);
    const focusFirstItem = window.requestAnimationFrame(() => {
      menu?.querySelector<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')?.focus({preventScroll: true});
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopover();
        window.requestAnimationFrame(() => trigger?.focus({preventScroll: true}));
        return;
      }
      if (!menu || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]'));
      if (!items.length) return;
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1 + items.length) % items.length
            : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus({preventScroll: true});
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || menu?.contains(target) || trigger?.contains(target)) return;
      closePopover();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(focusFirstItem);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closePopover, popover]);

  const closePopoverAndRestoreFocus = () => {
    if (!popover) return;
    const {trigger} = popoverNodes(popover);
    closePopover();
    window.requestAnimationFrame(() => trigger?.focus({preventScroll: true}));
  };

  return (
    <header ref={headerRef} className="app-header">
      <button
        ref={controller.triggerRefs[renderer]["mobile-navigation"]}
        type="button"
        className="icon-button mobile-menu-button"
        aria-label="Меню"
        onClick={() => controller.openOverlay("mobile-navigation")}
      ><Menu size={20} /></button>
      <CurrentBrand controller={controller} />
      {isDealer ? (
        <DealerGlobalPartsSearch
          controller={controller.dealerSearch}
          mobileOpen={controller.overlay === "mobile-search"}
          onMobileClose={controller.closeOverlay}
          returnFocusRef={controller.triggerRefs[renderer]["mobile-search"]}
        />
      ) : (
        <form className="global-search" onSubmit={controller.submitAdminSearch}>
          <button type="submit" className="global-search-submit" aria-label="Виконати глобальний пошук">
            <Search size={17} />
          </button>
          <input
            aria-label="Глобальний пошук"
            placeholder="напр. 507032417, brake..."
            value={controller.globalQuery}
            onChange={(event) => controller.setGlobalQuery(event.target.value)}
          />
        </form>
      )}
      <button
        ref={controller.triggerRefs[renderer]["mobile-search"]}
        type="button"
        className="icon-button mobile-search-button"
        aria-label="Пошук"
        onClick={() => {
          if (controller.role === "admin") {
            controller.openAdminSearch();
          } else {
            controller.openOverlay("mobile-search");
          }
        }}
      ><Search size={19} /></button>
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          aria-label={controller.resolvedTheme === "dark" ? "switch_to_light" : "switch_to_dark"}
          onClick={controller.toggleTheme}
        >
          {controller.resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {controller.role === "admin" ? (
          <>
            <div className="menu-anchor">
              <button
                ref={languageTriggerRef}
                type="button"
                className="header-language"
                aria-label="language_switcher"
                aria-controls="current-language-menu"
                aria-expanded={controller.popover === "language"}
                aria-haspopup="menu"
                onClick={() => controller.togglePopover("language")}
              ><Globe2 size={17} /><span>{SHELL_LANGUAGES.find((language) => language.id === controller.language)?.shortLabel}</span></button>
              {controller.popover === "language" ? (
                <div
                  ref={languageMenuRef}
                  id="current-language-menu"
                  className="popover-menu language-menu"
                  role="menu"
                  aria-label="Мова інтерфейсу"
                >
                  {SHELL_LANGUAGES.map((language) => (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={language.id === controller.language}
                      key={language.id}
                      onClick={() => {
                        controller.setLanguage(language.id);
                        closePopoverAndRestoreFocus();
                      }}
                    >
                      <span>{language.label}</span>{language.id === controller.language ? <Check size={14} /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="menu-anchor">
              <button
                ref={notificationTriggerRef}
                type="button"
                className="icon-button notification-button"
                aria-label="Сповіщення"
                aria-controls="current-notifications-menu"
                aria-expanded={controller.popover === "notifications"}
                aria-haspopup="menu"
                onClick={() => controller.togglePopover("notifications")}
              >
                <Bell size={18} />
                {controller.unreadNotificationCount ? <span>{controller.unreadNotificationCount}</span> : null}
              </button>
              {controller.popover === "notifications" ? (
                <div
                  ref={notificationMenuRef}
                  id="current-notifications-menu"
                  className="popover-menu notifications-menu"
                  role="menu"
                  aria-label="Сповіщення"
                >
                  <div className="popover-menu-heading">
                    <strong>Сповіщення</strong>
                    {controller.unreadNotificationCount ? (
                      <button type="button" role="menuitem" onClick={controller.markAllNotificationsRead}>Позначити все прочитаним</button>
                    ) : null}
                  </div>
                  {controller.notifications.length ? controller.notifications.map((notification) => (
                    <button
                      type="button"
                      role="menuitem"
                      className={cn("notification-item", !notification.read && "notification-item-unread")}
                      key={notification.id}
                      onClick={() => controller.openNotification(notification)}
                    >
                      <span><strong>{notification.title}</strong><small>{notification.description}</small></span>
                      {!notification.read ? <i aria-label="Непрочитане" /> : null}
                    </button>
                  )) : <p className="notification-empty" role="status">Немає нових сповіщень.</p>}
                  {!controller.unreadNotificationCount ? <p className="notification-empty" role="status">Усі сповіщення прочитані.</p> : null}
                  <p className="notification-note">Статус прочитання зберігається до оновлення сторінки.</p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        <div className="profile-summary">
          <div><strong>{controller.identity.name}</strong><small>{controller.identity.company}</small></div>
          <div className="menu-anchor">
            <button
              ref={profileTriggerRef}
              type="button"
              className="avatar-button"
              aria-label="Профіль"
              aria-controls="current-profile-menu"
              aria-expanded={controller.popover === "profile"}
              aria-haspopup="menu"
              onClick={() => controller.togglePopover("profile")}
            ><CircleUserRound size={20} /></button>
            {controller.popover === "profile" ? (
              <div
                ref={profileMenuRef}
                id="current-profile-menu"
                className="popover-menu profile-menu"
                role="menu"
                aria-label="Меню профілю"
              >
                <div className="popover-profile">
                  <strong>{controller.identity.name}</strong>
                  <span>{controller.role === "admin" ? "Адміністратор" : "Дилер"}</span>
                </div>
                <button type="button" role="menuitem" onClick={controller.logout}>Вийти</button>
              </div>
            ) : null}
          </div>
        </div>
        {isDealer ? (
          <button
            ref={controller.triggerRefs[renderer]["dealer-cart"]}
            type="button"
            className="cart-button"
            aria-label={`Кошик (${controller.cart.count})`}
            onClick={() => controller.openOverlay("dealer-cart")}
          >
            <ShoppingCart size={17} /><span>Кошик ({controller.cart.count})</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function CurrentAppShellNavigation({
  controller,
  sidebarCollapsed,
  onSidebarCollapsedChange,
}: {
  controller: AppShellController;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange(value: boolean): void;
}) {
  return (
    <aside className="desktop-sidebar">
      <CurrentRoleNav groups={controller.navGroups} collapsed={sidebarCollapsed} />
      <div className="desktop-sidebar-controls">
        <button
          type="button"
          className="icon-button desktop-sidebar-toggle"
          aria-label={sidebarCollapsed ? "Розгорнути бічну навігацію" : "Згорнути бічну навігацію"}
          title={sidebarCollapsed ? "Розгорнути бічну навігацію" : "Згорнути бічну навігацію"}
          onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
        </button>
      </div>
    </aside>
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

function useCurrentDrawerAccessibility({
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
  inertTargets: ShellInertTargets;
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
      const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled])",
      ) ?? dialogRef.current;
      focusTarget?.focus({preventScroll: true});
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
      window.requestAnimationFrame(() => {
        if (returnTarget?.isConnected) returnTarget.focus({preventScroll: true});
      });
    };
  }, [dialogRef, inertTargets, onClose, open, returnFocusRef]);
}

function CurrentMobileNavigation({
  controller,
  inertTargets,
}: {
  controller: AppShellController;
  inertTargets: ShellInertTargets;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useCurrentDrawerAccessibility({
    open: true,
    onClose: controller.closeOverlay,
    dialogRef,
    returnFocusRef: controller.triggerRefs.current["mobile-navigation"],
    inertTargets,
  });
  return (
    <div className="drawer-overlay mobile-nav-overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) controller.closeOverlay();
    }}>
      <aside
        ref={dialogRef}
        className={cn("side-drawer mobile-nav-drawer", controller.role === "dealer" && "dealer-mobile-nav-drawer")}
        role="dialog"
        aria-modal="true"
        aria-label="Навігація"
        tabIndex={-1}
      >
        <header className="drawer-header">
          <CurrentBrand controller={controller} />
          <button type="button" className="icon-button" onClick={controller.closeOverlay} aria-label="Закрити меню"><X size={19} /></button>
        </header>
        <div className="drawer-scroll">
          <CurrentRoleNav groups={controller.navGroups} onNavigate={controller.closeTransientUi} />
        </div>
      </aside>
    </div>
  );
}

function CurrentDealerCart({
  controller,
  inertTargets,
}: {
  controller: DealerAppShellController;
  inertTargets: ShellInertTargets;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useCurrentDrawerAccessibility({
    open: true,
    onClose: controller.closeOverlay,
    dialogRef,
    returnFocusRef: controller.triggerRefs.current["dealer-cart"],
    inertTargets,
  });
  const dialog = (
    <div className="drawer-overlay" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) controller.closeOverlay();
    }}>
      <aside ref={dialogRef} className="side-drawer cart-drawer" role="dialog" aria-modal="true" aria-label="Кошик" tabIndex={-1}>
        <header className="drawer-header">
          <div>
            <h2>Кошик</h2>
            <p>{controller.cart.lines.length ? `${controller.cart.lines.length} позицій` : "Нове замовлення"}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Закрити кошик" onClick={controller.closeOverlay}><X size={19} /></button>
        </header>
        {controller.cart.error ? <p className="drawer-error" role="alert">{controller.cart.error}</p> : null}
        {controller.cart.lines.length === 0 ? (
          <div className="cart-empty">
            <span><ShoppingCart size={28} /></span>
            <h3>Кошик порожній</h3>
            <p>Відкрийте каталог, щоб додати запчастини.</p>
            <button type="button" className="button button-primary" onClick={controller.cart.openCatalog}>Відкрити каталог</button>
          </div>
        ) : (
          <>
            <div className="drawer-scroll">
              <div className="drawer-inline-header">
                <span>До найближчої поставки</span>
                <button type="button" onClick={() => void controller.cart.clear()}><Trash2 size={13} /> Очистити</button>
              </div>
              {controller.cart.lines.map((line) => (
                <article className="cart-line" key={line.partNumber}>
                  <div className="cart-line-head">
                    <div>
                      <strong>{line.part.number}</strong>
                      {line.part.description ? <p>{line.part.description}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-button-small"
                      aria-label={`Видалити ${line.part.number}`}
                      onClick={() => void controller.cart.remove(line.partNumber)}
                    ><X size={14} /></button>
                  </div>
                  <div className="cart-line-foot">
                    <div className="quantity-control">
                      <button type="button" aria-label="Зменшити" onClick={() => void controller.cart.setQuantity(line.partNumber, line.quantity - 1)}>−</button>
                      <span>{line.quantity}</span>
                      <button type="button" aria-label="Збільшити" onClick={() => void controller.cart.setQuantity(line.partNumber, line.quantity + 1)}>+</button>
                    </div>
                    <strong>{formatMoney(line.quantity * line.part.dealerPrice)}</strong>
                  </div>
                </article>
              ))}
            </div>
            <footer className="cart-footer">
              <div><span>Разом</span><strong>{controller.cart.formattedTotal}</strong></div>
              <button type="button" className="button button-primary button-wide" onClick={controller.cart.openCheckout}>Оформити замовлення</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
}

export function CurrentAppShellOverlays({
  controller,
  inertTargets,
}: {
  controller: AppShellController;
  inertTargets: ShellInertTargets;
}) {
  if (controller.overlay === "mobile-navigation") {
    return <CurrentMobileNavigation controller={controller} inertTargets={inertTargets} />;
  }
  if (controller.role === "dealer" && controller.overlay === "dealer-cart") {
    return <CurrentDealerCart controller={controller} inertTargets={inertTargets} />;
  }
  return null;
}
