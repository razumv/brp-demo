# Catalog Model and Part Search Specification

## Layout

Two compact inputs appear in the Quick Search card: Model and Part. Results open directly below the matching field in a bordered list with code, title, year/category and an arrow.

## Known data

- Model query 0001KTB00 returns North America - OUTLANDER - 2X4 - STD - 500 and its full ancestry.
- Part query 9779150 returns COOLANT,EXT LIFE and compatible Outlander configurations.
- Query Outlander may show no exact model result, matching the observed source behavior.

## Behavior

- Search is case-insensitive and trims whitespace.
- Enter or result click opens the corresponding hierarchy/configuration.
- Empty text hides results; a completed unmatched query shows a compact no-result row.
- Results use 13px titles, 11px metadata and an orange code/highlight.
- On mobile results stay in document flow and never overflow the viewport.
