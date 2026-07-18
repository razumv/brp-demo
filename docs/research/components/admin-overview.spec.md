# AdminOverview Specification

## Overview
- Target file: `src/components/AdminOverview.tsx`
- Screenshots: `admin-overview-desktop.png`, `admin-overview-mobile.png`
- Interaction model: search-filtered shortcuts

## DOM Structure
Title block -> shortcut card -> KPI grid -> queue card -> redistribution card -> recent orders.

## Computed Styles
- Content: desktop padding 32px, mobile 16px, max usable width fills main.
- H1: 30px/36px, 700. Intro: 15px muted.
- Panels: white, 1px `#d0d7de`, radius 6-8px, subtle `0 1px 3px rgba(0,0,0,.08)`.
- Shortcut grid: four columns desktop, two tablet, one mobile; 8px gap.
- Shortcut tile: minimum 51px, 12px padding, 1px border, radius 6px; title 13px, section 11px.
- KPI grid: four equal columns desktop; 1-2 columns responsive. Value 24px/700; semantic green/blue/amber.
- Recent table: 100% width, ~271px high on desktop; stacked rows on mobile.

## States & Behaviors
- Search input filters shortcut names and group labels; exact captured example `Склад` leaves one tile.
- Hover: tile background becomes muted and border strengthens; 100ms.

## Text Content
Use the captured Ukrainian shortcut labels, KPI values `$42,914.61`, `123`, `20`, `74`, queue values, and five recent orders.

## Responsive
- >=1024: 4-column shortcuts with sidebar.
- 768: sidebar hidden, 2-column shortcuts.
- 390: single column, 16px content padding, recent orders stack.
