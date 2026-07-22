# Astryx Task 10 — design-reference decisions

## Scope

Admin delivery schedule and analytics renderers for the Astryx Neutral appearance.

## Reference decisions

- **Primary language:** official Astryx Neutral controls, tokens, focus behavior, light mode, and dark mode.
- **Preserved from BRP:** compact enterprise density, full-width search, filters aligned after search, data-first tables, BRP orange only for brand or semantic emphasis, and existing workflow/state contracts.
- **Borrowed pattern:** a horizontally bounded timeline with events anchored to real dates, plus a compact agenda below it. The visible range filters both the scale and event list.
- **Borrowed hierarchy:** page context, controls, compact metrics, then operational data. Filters never compete visually with the data surface.
- **Rejected:** oversized dashboard cards, decorative gradients, serif display typography, duplicated controller state, invented workflows, and unexplained disabled actions.

## Implementation consequences

- Current and Astryx renderers consume the same lifted schedule and analytics controller state.
- Schedule period, selected slot, pagination, category, search, timeline disclosure, and analytics filters survive renderer switches.
- Astryx overlays are only interactive when the Astryx renderer is committed.
- Excel and 1C actions remain hard-disabled until their external integrations exist, with the dependency explained in the interface.
- The timeline and data tables are bounded scrollers instead of producing document-level overflow.
- Mobile KPI blocks are suppressed where they would displace the primary workflow.
