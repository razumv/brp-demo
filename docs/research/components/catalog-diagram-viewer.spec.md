# Catalog Diagram Viewer Specification

## Desktop

The route header contains back, title, breadcrumbs, previous, diagram selector 1 / 41, next, Print, Share and Cart. Below it, the left 55% is a white diagram canvas and the right 45% is a parts table.

## Mobile

Header compresses to back/title/share/cart and a second selector row. Tabs Schema and Parts replace split panes. Schema is selected initially.

## Diagram

- Title: 00- Service - Maintenance Parts & Fluids.
- Use a locally stored representative maintenance diagram.
- Floating controls: show/hide callouts, zoom in, zoom out and reset.
- Zoom range 0.75–1.75; reset returns 1.
- Selector includes 41 named diagram items; previous/next clamp at ends.

## Parts

Render 17 representative rows with reference, number, description, stock, dealer price, retail price and add-to-cart. The first captured rows include 705602167, 705602168, 715900785, 422280226 and 9779480. Include 9779150 as the quick-search/cart demonstration line.

## Accessibility

All icon buttons have labels, table headers remain available to assistive technology and mobile tabs use tab semantics.
