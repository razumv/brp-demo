# CatalogBrowser Specification

## Overview
- Target file: `src/components/CatalogBrowser.tsx`
- Screenshots: `dealer-catalog-can-am-desktop.png`, `dealer-catalog-atv-desktop.png`, `dealer-catalog-atv-2026.png`
- Interaction model: click-driven hierarchy

## DOM Structure
Breadcrumbs -> manufacturer/category header -> category cards OR three-column selection browser (category, year, series).

## Computed Styles
- Breadcrumbs: 11-13px, muted links, compact 32px row.
- Manufacturer logo: 56px object-contain.
- Category cards: white, 1px border, 8px radius, compact title + `Категорія` meta.
- Browser columns: white bordered panels; each row is full-width, text-left, 13px, 8px 12px, bottom hairline divider.
- Selected row: light orange surface, orange left/border cue.
- Year/model lists scroll within their column when taller than viewport.

## States & Behaviors
- Brand page shows `Can-Am ATV` and `Can-Am SXS`.
- Category defaults to year list only; selecting `2026` reveals 21 captured series.
- Breadcrumb updates after selection.
- Hover: muted background; focus-visible orange outline.

## Responsive
- Desktop: columns side-by-side.
- Tablet/mobile: columns stack; year buttons may wrap into a compact grid before the series list.
