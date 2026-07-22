# BRP UI/UX Surface Pass Design

## Goal

Strengthen the visual hierarchy and responsive usability of the existing dual-renderer BRP application without changing business data, API contracts, route state, or supported workflows.

## Reference lock

- **Primary direction:** the existing shadcn renderer and the Astryx settlements page. Preserve the neutral canvas, clearly raised working surfaces, dense operational rhythm, thin dividers, and restrained BRP orange accent.
- **Secondary references:** the established Ocean Freight toolbar contract for search/filter/view composition, plus the CFMOTO login only for its two-zone desktop composition and form-first mobile hierarchy.
- **Role rules:** BRP orange remains action/selection emphasis; neutral surfaces own page structure; success/warning/error colors remain status-only; elevation separates navigation and work areas instead of decorating every nested element.
- **Media:** use repository-owned catalog artwork with stable aspect ratios, `object-fit: contain`, useful alternative text, lazy loading, and an honest missing-image fallback.
- **Reject:** flat text on the canvas, hard-coded white surfaces, invented filters, unsupported auth links, decorative branding copied from CFMOTO, and route-specific toolbar variants that drift from the shared contract.

## Architecture

The change extends the existing renderer-neutral BRP UI facade and keeps route controllers as the only owners of business state. Shared UI preferences live in a small client-side localStorage hook. Shell geometry, search/filter composition, surface hierarchy, and compact responsive controls become reusable contracts; pages provide only their real data and actions.

Astryx views continue to use `@astryxdesign/core` primitives. CSS modules and vanilla-extract only define application geometry and semantic surface roles that Astryx does not own. The shadcn renderer remains supported and receives only renderer-neutral fixes that do not alter its visual foundation.

## Interaction decisions

1. Desktop navigation collapses to an icon rail and restores its preference after reload; mobile remains a drawer.
2. Search fills remaining width. One icon-only filter trigger exposes real secondary filters, active count, reset, Escape dismissal, light dismissal, and accessible state.
3. Companies and users share one filtered dataset between card and list renderings. View preference persists per route.
4. Permission matrices remain dense tables on desktop and become object accordions with applicable single-line actions on mobile.
5. Diagram search is scoped to the selected model and never clears the upstream catalog cascade.
6. Login preserves the existing auth controller and redirects; only composition and surface hierarchy change.

## Responsive and accessibility contract

Validate 390, 768, 1280, and 1440 pixel widths in shadcn/Astryx and light/dark combinations. Interactive icon controls require accessible labels and tooltips. Disclosures expose `aria-expanded` and `aria-controls`, close with Escape, and retain visible focus. No page may introduce document-level horizontal overflow.

## Verification

Behavior changes use proof-first tests where a practical seam exists. Pure visual changes use existing appearance contracts, screenshot comparison, focus/overflow checks, and the full appearance matrix. Build both the regular target and GitHub Pages target before shipping.
