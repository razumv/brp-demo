# DealerDashboard Specification

## Overview
- Target file: `src/components/DealerDashboard.tsx`
- Screenshots: dealer-dashboard-viewport.png, dealer-dashboard-scrolled.png, dealer-dashboard-mobile.png
- Interaction model: navigation shortcuts

## DOM Structure
Title/CTA -> four KPI cards -> two-column recent/attention panels -> available-sections grid -> four compact summary cards.

## Computed Styles
- Content padding: 32px desktop, 16px mobile.
- H1: 24px/32px, 700. CTA: 40px high, orange, radius 6px.
- KPI cards: white, 1px border, radius 6px, 16px padding, ~102px high.
- KPI title: 11px/600 uppercase; value 24px/32px.
- Recent panel: two-thirds width; attention: one-third; both white, 1px border, 8px radius.
- Empty-state area: centered icon, heading 18px, copy 13px, outline CTA 40px.
- Section tiles: three columns desktop, two tablet, one mobile; 96px high, 16px padding, border-separated.

## States & Behaviors
- New order and catalog shortcuts route to `/catalog`.
- Shortcut hover uses muted surface and arrow movement.
- No scroll-triggered animation; header scrolls away normally.

## Text Content
Use captured source strings. Values derive from local demo orders; the observed populated state is 1 total, 1 processing, $13.09 month and $13.09 total.

## Responsive
- >=1024: four KPI columns and 2:1 panels.
- 768: two KPI columns and stacked panels.
- 390: one/two compact columns as space allows, single-column shortcuts.
