# BRP Clone Reference Lock

## Design Brief

Designing an authenticated BRP parts-catalog clone for internal administrators and dealers on the web.
Goal: reproduce the operational overview, catalog discovery, and order-pipeline experience with mock data and no live backend.
Tone: precise, compact, industrial, and utilitarian.
Main risk: drifting into a generic dashboard or mixing admin and dealer permissions.
Must remember: orange is a rare action/active-state signal; the interface is primarily cool gray, white, and dark graphite.
Constraints: pixel-focused responsive implementation, Inter typography, desktop sidebar, mobile drawer, light/dark themes, no stored credentials.
Research needed: exact source screens plus dashboard/catalog quality references.
Path: direct build against an existing UI target.

## Build Target

- Source truth: authenticated captures from `https://brp-dev1.k8s.artemahr.tech`.
- Admin target: `admin-overview-*` and `admin-order-pipeline-desktop.png`.
- Dealer target: `dealer-dashboard-viewport.png`, `dealer-catalog-*`, and catalog drill-down captures.
- Login target: `login-desktop.png` and `login-mobile.png`.
- What must not drift: 64px shell header, 256px desktop sidebar, Inter type, compact 11/13/15px UI scale, #f6f8fa canvas, white cards, hairline #d0d7de borders, #ea580c action orange, 6-8px radii, flat/minimal elevation.

## Supporting Refero Research

- Orderful: strongest secondary reference for a white/fog canvas, single orange-red action color, light card elevation, and operational B2B clarity.
- shadcn/ui: control reference for compact spacing, neutral borders, monochrome icons, and disciplined form states.
- Andercore: dark-theme contrast reference only; its red accent and near-black canvas are not copied into the light theme.

## Reference Lock

- Primary reference/direction: the live BRP application itself.
- Preserve: cool gray canvas, white shell header, narrow sidebar, compact Inter hierarchy, rectangular cards, orange-only active/action accents, high information density.
- Borrow only: Orderful's accent discipline; shadcn/ui's focus/border clarity; Andercore's dark-surface contrast hierarchy.
- Role rules: orange is reserved for primary CTA, active navigation, focus, and selected state; green/blue/amber/red remain semantic status colors; gray remains structure and secondary copy.
- Media strategy: use the four real catalog logos and source favicon; use code-native Lucide icons for operational UI.
- Reject: gradients, large marketing typography, glass effects, oversized pill controls, decorative illustration, purple/indigo default accents, soft cream canvases.
- Token commitments: `#f6f8fa` page, `#ffffff` surface, `#1f2328` text, `#656d76` muted text, `#d0d7de` border, `#ea580c` action, `6px` controls, `8px` cards, `0 1px 3px rgba(0,0,0,.08)` elevation.
