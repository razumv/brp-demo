/**
 * Stable semantic class names for the Astryx shell composition.
 *
 * Astryx owns every interactive primitive. These names only provide the BRP
 * application geometry that cannot be expressed by the content-owning Astryx
 * AppShell without remounting the active Next.js route subtree.
 */
export const astryxShellClasses = {
  header: "brp-astryx-shell-header",
  topNav: "brp-astryx-shell-top-nav",
  logo: "brp-astryx-shell-logo",
  heading: "brp-astryx-shell-heading",
  headingCluster: "brp-astryx-shell-heading-cluster",
  desktopSearch: "brp-astryx-shell-desktop-search",
  mobileMenu: "brp-astryx-shell-mobile-menu",
  mobileSearch: "brp-astryx-shell-mobile-search",
  mobileTheme: "brp-astryx-shell-mobile-theme",
  actions: "brp-astryx-shell-actions",
  identity: "brp-astryx-shell-identity",
  notificationControl: "brp-astryx-shell-notification-control",
  notificationsHeader: "brp-astryx-shell-notifications-header",
  sideNav: "brp-astryx-shell-side-nav",
  sideNavControls: "brp-astryx-shell-side-nav-controls",
  mobileNav: "brp-astryx-shell-mobile-nav",
  popover: "brp-astryx-shell-popover",
  searchDialog: "brp-astryx-shell-search-dialog",
  searchBody: "brp-astryx-shell-search-body",
  searchTabsFrame: "brp-astryx-shell-search-tabs-frame",
  searchTabsScroller: "brp-astryx-shell-search-tabs-scroller",
  searchList: "brp-astryx-shell-search-list",
  searchRow: "brp-astryx-shell-search-row",
  searchCopy: "brp-astryx-shell-search-copy",
  searchPrice: "brp-astryx-shell-search-price",
  searchQuantity: "brp-astryx-shell-search-quantity",
  empty: "brp-astryx-shell-empty",
  dialogHeader: "brp-astryx-shell-dialog-header",
  dialogBody: "brp-astryx-shell-dialog-body",
  cartSummary: "brp-astryx-shell-cart-summary",
  cartLine: "brp-astryx-shell-cart-line",
  cartLineHeader: "brp-astryx-shell-cart-line-header",
  cartLineFooter: "brp-astryx-shell-cart-line-footer",
  cartFooter: "brp-astryx-shell-cart-footer",
} as const;
