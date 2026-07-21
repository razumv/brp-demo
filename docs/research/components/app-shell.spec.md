# AppShell Specification

## Overview
- Target file: `src/components/shell/app-shell.tsx`
- Screenshots: admin/dealer desktop, mobile menu, dark captures
- Interaction model: click-driven theme/drawers/navigation, with language and notifications retained only for the admin role

## DOM Structure
Top-level app contains header then row with aside and main. Drawer mirrors aside below 1024px. Overlay dialogs render for language/profile/cart.

## Computed Styles
- Header: 64px, white, 1px bottom border, padding 0 24px desktop / 0 12px mobile.
- Logo tile: 40px orange square, radius 6px, white `BRP`.
- Search: up to ~672px, 40px pill, `#eaedf2` background.
- Sidebar: 256px, `#f6f8fa`, 1px right border, navigation padding 12px (admin) or 12px 16px (dealer).
- Main: flex 1, `#f6f8fa`, min-width 0.
- Nav labels: 11px uppercase muted. Links: 13px, ~32px high. Active link has orange left rule and `#eaedf2` surface.
- Dark: body/main `#0d1117`, sidebar `#161b22`, header `#010409`, border `#30363d`, text `#e6edf3`.

## States & Behaviors
- Desktop sidebar visible at >=1024px; modal drawer below.
- Theme and menu transitions: 150ms.
- Dealer header: brand, global parts search, theme, profile/logout and cart only. Unsupported client-mode, language, notification and help controls are not rendered.
- Admin header: retains its language menu and notification control unchanged.
- Cart dialog: right-side panel, empty-state by default.

## Responsive
- Tablet/mobile: brand wordmark collapses; search becomes icon button; account text hides; menu button appears.
