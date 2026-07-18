# CatalogHome Specification

## Overview
- Target file: `src/components/CatalogHome.tsx`
- Screenshots: `dealer-catalog-desktop.png`, `dealer-catalog-mobile.png`
- Interaction model: text search and card navigation

## DOM Structure
Title/recent orders -> quick-search panel -> four manufacturer cards.

## Computed Styles
- H1: 30px/36px, 700. Description 15px muted.
- Search panel: white, 1px border, radius 6px, 24px padding. Two equal fields desktop.
- Inputs: 36px high, `#f6f8fa`, 1px border, radius 4px, 13px, 12px left padding.
- Manufacturer grid: three columns desktop, one mobile, 16px gap.
- Card: 222px high, white, 1px border, radius 6px, subtle shadow.
- Logo zone: 112px with 56px object-contain logo at .75 opacity.
- Body zone: 110px, 16px padding, 13px description and 11px action.

## States & Behaviors
- Card hover raises logo opacity to 1 and strengthens border, 300ms logo transition.
- Quick search unmatched state shows `Моделей не знайдено`.

## Assets
Use all four real images in `public/images/catalog/`.

## Responsive
- Desktop grid 3 + 1 next row; mobile one 358px-wide card per row.
