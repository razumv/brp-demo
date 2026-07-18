# AdminOverview Specification

## Overview
- Target file: `src/components/AdminOverview.tsx`
- Screenshots: `admin-overview-desktop.png`, `admin-overview-mobile.png`
- Interaction model: KPI/status summaries and read-only order navigation; the former shortcut search is intentionally removed.

## DOM Structure
Title block -> KPI grid -> queue card -> redistribution card -> recent orders.

## Computed Styles
- Content: desktop padding 32px, mobile 16px, max usable width fills main.
- H1: 30px/36px, 700. Intro: 15px muted.
- Panels: white, 1px `#d0d7de`, radius 6-8px, subtle `0 1px 3px rgba(0,0,0,.08)`.
- Shortcut grid: four columns desktop, two tablet, one mobile; 8px gap.
- Shortcut tile: minimum 51px, 12px padding, 1px border, radius 6px; title 13px, section 11px.
- KPI grid: four equal columns desktop; 1-2 columns responsive. Value 24px/700; semantic green/blue/amber.
- Recent table: 100% width, ~271px high on desktop; stacked rows on mobile.

## States & Behaviors
- The `Робочі переходи` shortcut/search panel is removed by explicit user request. Navigation remains in the persistent admin sidebar and global search.
- KPI, queue, distribution and recent-order links retain their existing local behavior.

## Text Content
Use the captured KPI values `$42,914.61`, `123`, `20`, `74`, queue values, and five recent orders. Do not restore the former shortcut labels or shortcut search panel.

## Responsive
- >=1024: four-column KPI row with sidebar.
- 768: sidebar hidden and KPI/cards use two columns.
- 390: single-column content, 16px content padding, recent orders stack.
