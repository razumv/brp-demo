# CatalogBrowser Specification

## Overview
- Target files: `src/components/catalog/catalog-router.tsx`, `src/lib/dealer/catalog-data.ts`
- Source screenshot: `/var/folders/pr/9bzjzvj91k15pgtgdy3w0j4c0000gn/T/codex-clipboard-57bb5aa1-e003-4ede-a295-394314812826.png`
- Interaction model: click-driven, URL/query-backed hierarchy
- Supported source branch: `Can-Am SXS` → `2021` → `005 - SSV - North America - Maverick Trail Series` → `002 - Maverick Trail 1000 - BASE_DPS - North America, 2021`

## DOM Structure
Breadcrumbs → horizontally contained catalog viewport → one grid with category, year, series, model, and diagram columns. The grid grows from two to five columns from the same resolved selection; it does not replace levels with standalone pages.

## Computed Visual Contract
- Breadcrumbs: compact bordered white row with muted links and a bold current item.
- Catalog viewport: full available dealer-content width, 1px neutral border, 6px radius, white surface, internal horizontal overflow.
- Columns: minimum 210px, neutral right divider, independently vertical-scrollable.
- Rows: minimum 36px, 13px text, 8px × 12px padding, bottom hairline divider.
- Selected row: neutral gray surface, orange 2px leading rule, dark semibold text.
- Unsupported/source-unverified descendants: non-links with no fabricated detail route.

## States and Behaviors
- `/catalog/CAN_OFF_EN_US/sxs` resolves to the supported source branch above and renders all five columns.
- Year, series, and model links write a validated query prefix in the order `year`, `series`, `model`.
- Reloading a query-backed selection reconstructs selected rows and breadcrumbs from the same typed resolver.
- Choosing another series omits the former model query. Choosing another model omits the former diagram content.
- `Can-Am ATV` continues to enter the captured 2026 legacy route; its supported series/model/configuration/DiagramViewer route chain remains unchanged.
- Diagram labels are source-evidenced but non-interactive until a source-backed detail route exists.
- Hover uses the subtle surface; focus-visible behavior inherits the repository link focus contract.

## Source-Evidenced Diagram Content
- `00- Model Numbers`
- `01- Rotax - Air Intake Manifold And Throttle Body`
- `01- Rotax - Crankcase`
- `01- Rotax - Crankshaft, Piston And Cylinder`
- `01- Rotax - Cylinder Head, Front`
- `01- Rotax - Cylinder Head, Rear`
- `01- Rotax - Drive Shaft`
- `01- Rotax - Engine Cooling`
- `01- Rotax - Engine Harness And Electronic Module`
- `01- Rotax - Engine Lubrication`
- `01- Rotax - Gear Box 1`
- `01- Rotax - Gear Box 2 - 795`
- `01- Rotax - Gear Box And Components - 795`
- `01- Rotax - Magneto And Electric Starter`
- `01- Rotax - Transmission`
- `02- Engine - Air Intake`
- `02- Engine - Cooling`
- `02- Engine - Exhaust`
- `02- Engine - Fuel - EVAP System`
- `02- Engine - Fuel - NO EVAP System`
- `02- Engine - System`
- `03- Mechanic - Brakes`
- `03- Mechanic - Steering`
- `04- Drive - Front Section - Common Parts`

## Responsive Behavior
- Desktop: all resolved columns share the full dealer content width.
- Tablet: the same grid remains intact and scrolls internally when its 210px minimum columns exceed the available width.
- Mobile (390px): the document remains viewport-width; only the cascade viewport scrolls horizontally. Columns remain 210px wide and 620px high so selected/current rows remain usable without collapsing the hierarchy.
