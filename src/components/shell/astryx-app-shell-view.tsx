"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type Ref,
} from "react";
import {Badge} from "@astryxdesign/core/Badge";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Dialog} from "@astryxdesign/core/Dialog";
import {Heading} from "@astryxdesign/core/Heading";
import {IconButton} from "@astryxdesign/core/IconButton";
import {MobileNav} from "@astryxdesign/core/MobileNav";
import {
  Popover,
  usePopover,
  type PopoverTriggerRenderProps,
} from "@astryxdesign/core/Popover";
import {
  SideNav,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import {Tab, TabList} from "@astryxdesign/core/TabList";
import {Text} from "@astryxdesign/core/Text";
import {TextInput} from "@astryxdesign/core/TextInput";
import {TopNav, TopNavHeading} from "@astryxdesign/core/TopNav";
import {useFocusTrap} from "@astryxdesign/core/hooks";
import {
  Bell,
  Check,
  CircleUserRound,
  Globe2,
  Menu,
  Minus,
  Moon,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";
import type {
  AppShellController,
  DealerAppShellController,
  ShellNavGroup,
} from "@/components/shell/app-shell-controller";
import {astryxShellClasses as styles} from "@/components/shell/astryx-shell.css";
import {
  GLOBAL_PARTS_SEARCH_TABS,
  type GlobalPartsSearchTab,
} from "@/lib/global-parts-search-data";
import {formatMoney} from "@/lib/mock-data";

type AstryxShellViewProps = {
  controller: AppShellController;
} & AstryxRendererViewProps;

function useRendererReady(onReady: () => void) {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);
}

function ShellLogo() {
  return <span className={styles.logo} aria-hidden="true">BRP</span>;
}

function AstryxNavigationContent({
  groups,
  onNavigate,
}: {
  groups: ShellNavGroup[];
  onNavigate?: () => void;
}) {
  return groups.map((group, index) => (
    <SideNavSection
      key={(group.label || "main") + index}
      title={(group.label || "Головне").toLocaleUpperCase("uk-UA")}
      isHeaderHidden={!group.label}
    >
      {group.items.map((item) => {
        const Icon = item.icon;
        return (
          <SideNavItem
            key={item.href}
            href={item.href}
            icon={<Icon size={17} strokeWidth={1.8} />}
            isSelected={item.isSelected}
            label={item.label}
            onClick={onNavigate}
            endContent={item.badge ? <Badge label={item.badge} variant="neutral" /> : undefined}
          />
        );
      })}
    </SideNavSection>
  ));
}

function AstryxSearchResults({
  controller,
  panelId,
}: {
  controller: DealerAppShellController["dealerSearch"];
  panelId: string;
}) {
  const activeTab = controller.activeTab;
  return (
    <div className={styles.searchBody}>
      <div className={styles.searchTabsFrame}>
        <div className={styles.searchTabsScroller} data-search-tabs-scroller>
          <TabList
            aria-label="Фільтр доступності"
            role="tablist"
            hasDivider
            layout="fill"
            size="sm"
            value={activeTab}
            onChange={(value) => controller.setActiveTab(value as GlobalPartsSearchTab)}
          >
            {GLOBAL_PARTS_SEARCH_TABS.map((tab) => (
              <Tab
                key={tab.id}
                id={`${panelId}-${tab.id}-tab`}
                aria-controls={panelId}
                aria-selected={activeTab === tab.id}
                role="tab"
                value={tab.id}
                label={`${tab.label} (${tab.sourceCount})`}
              />
            ))}
          </TabList>
        </div>
      </div>
      <div
        id={panelId}
        className={styles.searchList}
        role="tabpanel"
        aria-labelledby={`${panelId}-${activeTab}-tab`}
        aria-live="polite"
      >
        {controller.visibleParts.length ? controller.visibleParts.map((part) => {
          const added = controller.addedParts[part.number];
          const adding = controller.addingParts[part.number];
          const failed = controller.failedParts[part.number];
          return (
            <Card className={styles.searchRow} key={part.number} padding={3}>
              <div className={styles.searchCopy}>
                <div>
                  <Text weight="semibold">{part.number}</Text>
                  <Badge label="АКТИВНО" variant="success" />
                </div>
                {part.description ? <Text color="secondary" display="block">{part.description}</Text> : null}
                {part.availabilityLabel ? <Text type="supporting" display="block">{part.availabilityLabel}</Text> : null}
              </div>
              <div className={styles.searchPrice}>
                <Text weight="semibold" hasTabularNumbers>{formatMoney(part.dealerPrice)}</Text>
                {part.comparePrice !== null ? (
                  <Text color="secondary" hasStrikethrough hasTabularNumbers>{formatMoney(part.comparePrice)}</Text>
                ) : null}
              </div>
              <div className={styles.searchQuantity} aria-label={`Кількість ${part.number}`}>
                <IconButton
                  icon={<Minus size={14} />}
                  label={`Зменшити кількість ${part.number}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => controller.changeQuantity(part.number, -1)}
                />
                <Text hasTabularNumbers weight="semibold">{controller.quantityFor(part.number)}</Text>
                <IconButton
                  icon={<Plus size={14} />}
                  label={`Збільшити кількість ${part.number}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => controller.changeQuantity(part.number, 1)}
                />
              </div>
              <Button
                label={`Додати ${part.number} до кошика`}
                isDisabled={adding}
                isLoading={adding}
                size="sm"
                variant="primary"
                onClick={() => void controller.addPart(part.number)}
              >
                {added ? <><Check size={14} /> Додано</> : failed ? "Повторити" : "+ Кошик"}
              </Button>
            </Card>
          );
        }) : (
          <div className={styles.empty}>
            <Text color="secondary">Немає результатів для цього фільтра.</Text>
          </div>
        )}
      </div>
    </div>
  );
}

function AstryxDealerDesktopSearch({
  controller,
  isRendererActive,
}: {
  controller: DealerAppShellController;
  isRendererActive: boolean;
}) {
  const search = controller.dealerSearch;
  const setDesktopOpen = search.setDesktopOpen;
  const inputRef = useRef<HTMLInputElement>(null);
  const resultOpen = isRendererActive && search.desktopOpen && Boolean(search.trimmedQuery);
  const handlePopoverHide = useCallback(() => {
    setDesktopOpen(false);
  }, [setDesktopOpen]);
  const {
    hide: hideResults,
    isOpen: isResultsOpen,
    render: renderResults,
    show: showResults,
    triggerProps: resultsTriggerProps,
    triggerRef: resultsTriggerRef,
  } = usePopover({
    closeButtonLabel: "Закрити результати пошуку",
    dialogLabel: "Результати пошуку запчастин",
    hasAutoFocus: false,
    hasCloseButton: false,
    isModal: false,
    onHide: handlePopoverHide,
  });

  useEffect(() => {
    inputRef.current?.setAttribute("autocomplete", "off");
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    resultsTriggerRef(input);
    return () => resultsTriggerRef(null);
  }, [resultsTriggerRef]);

  useEffect(() => {
    if (resultOpen && !isResultsOpen) {
      showResults({skipAutoFocus: true});
    } else if (!resultOpen && isResultsOpen) {
      hideResults();
    }
  }, [hideResults, isResultsOpen, resultOpen, showResults]);

  return (
    <div className={styles.desktopSearch}>
      <TextInput
        ref={inputRef}
        aria-autocomplete="list"
        aria-controls={resultsTriggerProps["aria-controls"]}
        aria-expanded={resultsTriggerProps["aria-expanded"]}
        aria-haspopup={resultsTriggerProps["aria-haspopup"]}
        hasClear
        isLabelHidden
        label="Глобальний пошук запчастин"
        placeholder="напр. 507032473, brake..."
        role="combobox"
        startIcon={<Search size={16} />}
        value={search.query}
        width="100%"
        onChange={(value) => search.updateQuery(value, "desktop")}
        onEnter={() => search.setDesktopOpen(Boolean(search.trimmedQuery))}
        onFocus={() => {
          if (search.trimmedQuery) search.setDesktopOpen(true);
        }}
      />
      {renderResults(
        <div>
          <div className={styles.dialogHeader}>
            <div>
              <Heading level={2}>Результати пошуку запчастин</Heading>
              <Text color="secondary" display="block">Запит: {search.trimmedQuery}</Text>
            </div>
            <IconButton
              icon={<X size={17} />}
              label="Закрити результати пошуку"
              onClick={hideResults}
              variant="ghost"
            />
          </div>
          <AstryxSearchResults controller={search} panelId="astryx-dealer-global-parts-results" />
        </div>,
        {
          alignment: "start",
          className: styles.searchDialog,
          placement: "below",
        },
      )}
    </div>
  );
}

function AstryxAdminSearch({controller}: {controller: AppShellController}) {
  return (
    <div className={styles.desktopSearch}>
      <TextInput
        isLabelHidden
        label="Глобальний пошук"
        placeholder="напр. 507032417, brake..."
        startIcon={<Search size={16} />}
        value={controller.globalQuery}
        width="100%"
        onChange={controller.setGlobalQuery}
        onEnter={controller.runAdminSearch}
      />
    </div>
  );
}

function AstryxLanguagePopover({controller}: {controller: AppShellController}) {
  const open = controller.renderedDesignSystem === "astryx" && controller.popover === "language";
  return (
    <Popover
      label="Мова інтерфейсу"
      className={styles.popover}
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && controller.popover !== "language") controller.togglePopover("language");
        if (!nextOpen) controller.closePopover();
      }}
      content={(
        <div className={styles.popover}>
          {[
            {label: "English", selected: false},
            {label: "Русский", selected: false},
            {label: "Українська", selected: true},
          ].map((language) => (
            <Button
              key={language.label}
              label={language.label}
              endContent={language.selected ? <Check size={14} /> : undefined}
              variant="ghost"
              width="100%"
              onClick={controller.closePopover}
            />
          ))}
        </div>
      )}
    >
      {(triggerProps: PopoverTriggerRenderProps) => (
        <IconButton
          ref={triggerProps.ref as Ref<HTMLButtonElement>}
          icon={<Globe2 size={18} />}
          label="language_switcher"
          variant="ghost"
          onClick={triggerProps.onClick}
          aria-haspopup={triggerProps["aria-haspopup"]}
          aria-expanded={triggerProps["aria-expanded"]}
          aria-controls={triggerProps["aria-controls"]}
        />
      )}
    </Popover>
  );
}

function AstryxProfilePopover({controller}: {controller: AppShellController}) {
  const open = controller.renderedDesignSystem === "astryx" && controller.popover === "profile";
  return (
    <Popover
      label="Профіль користувача"
      className={styles.popover}
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && controller.popover !== "profile") controller.togglePopover("profile");
        if (!nextOpen) controller.closePopover();
      }}
      content={(
        <div className={styles.popover}>
          <Heading level={3}>{controller.identity.name}</Heading>
          <Text color="secondary" display="block">
            {controller.role === "admin" ? "Адміністратор" : "Дилер"} · {controller.identity.company}
          </Text>
          <Button label="Вийти" variant="ghost" width="100%" onClick={controller.logout} />
        </div>
      )}
    >
      {(triggerProps: PopoverTriggerRenderProps) => (
        <IconButton
          ref={triggerProps.ref as Ref<HTMLButtonElement>}
          icon={<CircleUserRound size={19} />}
          label="Профіль"
          variant="secondary"
          onClick={triggerProps.onClick}
          aria-haspopup={triggerProps["aria-haspopup"]}
          aria-expanded={triggerProps["aria-expanded"]}
          aria-controls={triggerProps["aria-controls"]}
        />
      )}
    </Popover>
  );
}

export function AstryxAppShellHeader({controller, onReady}: AstryxShellViewProps) {
  useRendererReady(onReady);
  const isDealer = controller.role === "dealer";
  const renderer = "astryx" as const;
  const isRendererActive = controller.renderedDesignSystem === "astryx";
  const homeHref = isDealer ? "/" : "/admin";

  return (
    <header className={styles.header}>
      <TopNav
        className={styles.topNav}
        label="Головна навігація"
        heading={(
          <div className={styles.headingCluster}>
            <IconButton
              ref={controller.triggerRefs[renderer]["mobile-navigation"]}
              className={styles.mobileMenu}
              icon={<Menu size={19} />}
              label="Меню"
              variant="ghost"
              onClick={() => controller.openOverlay("mobile-navigation")}
            />
            <TopNavHeading
              className={styles.heading}
              heading={isDealer ? "PARTS CATALOG" : "BRP CRM"}
              headingHref={homeHref}
              logo={<ShellLogo />}
              subheading={isDealer ? "ENTERPRISE PORTAL" : "MANAGER PORTAL"}
            />
          </div>
        )}
        centerContent={isDealer
          ? <AstryxDealerDesktopSearch controller={controller} isRendererActive={isRendererActive} />
          : <AstryxAdminSearch controller={controller} />}
        endContent={(
          <div className={styles.actions}>
            <IconButton
              ref={controller.triggerRefs[renderer]["mobile-search"]}
              className={styles.mobileSearch}
              icon={<Search size={18} />}
              label="Пошук"
              variant="ghost"
              onClick={() => {
                if (controller.role === "admin") controller.openAdminSearch();
                else controller.openOverlay("mobile-search");
              }}
            />
            <IconButton
              icon={controller.resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              label={controller.resolvedTheme === "dark" ? "switch_to_light" : "switch_to_dark"}
              variant="ghost"
              onClick={controller.toggleTheme}
            />
            {controller.role === "admin" ? (
              <>
                <AstryxLanguagePopover controller={controller} />
                <IconButton icon={<Bell size={18} />} label="Сповіщення" variant="ghost" />
              </>
            ) : null}
            <div className={styles.identity}>
              <div>
                <Text weight="semibold" display="block">{controller.identity.name}</Text>
                <Text type="supporting" color="secondary" display="block">{controller.identity.company}</Text>
              </div>
              <AstryxProfilePopover controller={controller} />
            </div>
            {controller.role === "dealer" ? (
              <Button
                ref={controller.triggerRefs[renderer]["dealer-cart"]}
                icon={<ShoppingCart size={17} />}
                label={`Кошик (${controller.cart.count})`}
                variant="primary"
                onClick={() => controller.openOverlay("dealer-cart")}
              />
            ) : null}
          </div>
        )}
      />
    </header>
  );
}

export function AstryxAppShellNavigation({controller, onReady}: AstryxShellViewProps) {
  useRendererReady(onReady);
  return (
    <SideNav className={styles.sideNav}>
      <AstryxNavigationContent groups={controller.navGroups} />
    </SideNav>
  );
}

function AstryxMobileSearchDialog({controller}: {controller: DealerAppShellController}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const open = controller.overlay === "mobile-search";
  useEffect(() => {
    inputRef.current?.setAttribute("autocomplete", "off");
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({preventScroll: true}));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Dialog
      aria-label="Пошук запчастин"
      isOpen={open}
      padding={0}
      purpose="info"
      variant="fullscreen"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) controller.closeOverlay();
      }}
    >
      <div className={styles.dialogBody}>
        <div className={styles.dialogHeader}>
          <Heading level={2}>Пошук запчастин</Heading>
          <IconButton
            icon={<X size={18} />}
            label="Закрити пошук"
            variant="ghost"
            onClick={controller.closeOverlay}
          />
        </div>
        <div className={styles.searchBody}>
          <TextInput
            ref={inputRef}
            aria-autocomplete="list"
            aria-controls="astryx-mobile-parts-results"
            aria-expanded={Boolean(controller.dealerSearch.trimmedQuery)}
            aria-haspopup="dialog"
            hasClear
            isLabelHidden
            label="Глобальний пошук запчастин"
            placeholder="напр. 507032473, brake..."
            role="combobox"
            startIcon={<Search size={16} />}
            value={controller.dealerSearch.query}
            width="100%"
            onChange={(value) => controller.dealerSearch.updateQuery(value, "mobile")}
          />
          <div id="astryx-mobile-parts-results">
            {controller.dealerSearch.trimmedQuery ? (
              <AstryxSearchResults
                controller={controller.dealerSearch}
                panelId="astryx-mobile-parts-panel"
              />
            ) : (
              <div className={styles.empty}>
                <Text color="secondary">Почніть вводити номер або назву запчастини.</Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function AstryxDealerCartDialog({controller}: {controller: DealerAppShellController}) {
  const cart = controller.cart;
  const isOpen = controller.overlay === "dealer-cart";
  const {containerRef, focusFirst} = useFocusTrap<HTMLDivElement>({isActive: isOpen});

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(focusFirst);
    return () => window.cancelAnimationFrame(frame);
  }, [focusFirst, isOpen]);

  return (
    <Dialog
      aria-label="Кошик"
      isOpen={isOpen}
      maxHeight="min(88vh, 760px)"
      padding={0}
      purpose="info"
      width="min(480px, calc(100vw - 24px))"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) controller.closeOverlay();
      }}
    >
      <div ref={containerRef} className={styles.dialogBody}>
        <div className={styles.dialogHeader}>
          <div>
            <Heading level={2}>Кошик</Heading>
            <Text color="secondary" display="block">
              {cart.lines.length ? `${cart.lines.length} позицій` : "Нове замовлення"}
            </Text>
          </div>
          <IconButton icon={<X size={18} />} label="Закрити кошик" variant="ghost" onClick={controller.closeOverlay} />
        </div>
        {cart.error ? (
          <Card variant="red" padding={3} role="alert">
            <Text display="block">{cart.error}</Text>
          </Card>
        ) : null}
        {cart.lines.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingCart size={30} />
            <Heading level={3}>Кошик порожній</Heading>
            <Text color="secondary">Відкрийте каталог, щоб додати запчастини.</Text>
            <Button label="Відкрити каталог" variant="primary" onClick={cart.openCatalog} />
          </div>
        ) : (
          <>
            <div className={styles.cartSummary}>
              <Text weight="semibold">До найближчої поставки</Text>
              <Button
                icon={<Trash2 size={14} />}
                label="Очистити"
                size="sm"
                variant="ghost"
                onClick={() => void cart.clear()}
              />
            </div>
            <div className={styles.dialogBody}>
              {cart.lines.map((line) => (
                <Card className={styles.cartLine} key={line.partNumber} padding={3}>
                  <div className={styles.cartLineHeader}>
                    <div>
                      <Text weight="semibold" display="block">{line.part.number}</Text>
                      {line.part.description ? <Text color="secondary" display="block">{line.part.description}</Text> : null}
                    </div>
                    <IconButton
                      icon={<X size={14} />}
                      label={`Видалити ${line.part.number}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => void cart.remove(line.partNumber)}
                    />
                  </div>
                  <div className={styles.cartLineFooter}>
                    <div className={styles.searchQuantity}>
                      <IconButton
                        icon={<Minus size={14} />}
                        label="Зменшити"
                        size="sm"
                        variant="ghost"
                        onClick={() => void cart.setQuantity(line.partNumber, line.quantity - 1)}
                      />
                      <Text hasTabularNumbers weight="semibold">{line.quantity}</Text>
                      <IconButton
                        icon={<Plus size={14} />}
                        label="Збільшити"
                        size="sm"
                        variant="ghost"
                        onClick={() => void cart.setQuantity(line.partNumber, line.quantity + 1)}
                      />
                    </div>
                    <Text hasTabularNumbers weight="semibold">
                      {formatMoney(line.quantity * line.part.dealerPrice)}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
            <div className={styles.cartFooter}>
              <div>
                <Text color="secondary">Разом</Text>
                <Heading level={3}>{cart.formattedTotal}</Heading>
              </div>
              <Button label="Оформити замовлення" variant="primary" onClick={cart.openCheckout} />
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

export function AstryxAppShellOverlays({controller, onReady}: AstryxShellViewProps) {
  useRendererReady(onReady);

  // RendererViewSwitch preloads this tree while hidden. Native dialogs must not
  // enter the browser top layer until Astryx is the committed renderer.
  if (controller.renderedDesignSystem !== "astryx") return null;

  return (
    <>
      <MobileNav
        className={styles.mobileNav}
        header={(
          <div className={styles.identity}>
            <ShellLogo />
            <Text weight="semibold">{controller.role === "dealer" ? "PARTS CATALOG" : "BRP CRM"}</Text>
          </div>
        )}
        isOpen={controller.overlay === "mobile-navigation"}
        label="Навігація"
        side="start"
        onOpenChange={(nextOpen) => {
          if (!nextOpen) controller.closeOverlay();
        }}
      >
        <AstryxNavigationContent groups={controller.navGroups} onNavigate={controller.closeTransientUi} />
      </MobileNav>
      {controller.role === "dealer" ? (
        <>
          <AstryxMobileSearchDialog controller={controller} />
          <AstryxDealerCartDialog controller={controller} />
        </>
      ) : null}
    </>
  );
}
