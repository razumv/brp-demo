# Dealer Catalog, Documents, and Drafts Parity Design

**Date:** 2026-07-21

## Goal

Restore the source-backed dealer catalog workflows and compact dealer document controls without changing any admin route, component, data contract, or styling.

## Reference lock

- Primary parts-catalog reference: the supplied source screenshot with a persistent five-column browser and a selected `Can-Am SXS → 2021 → 005 → 002` path.
- Primary accessories reference: the supplied source screenshot with two independent layers: vehicle selection and product facets.
- Preserve from the current clone: the three family cards at the top of the accessories page.
- Density reference: the compact search/filter row already used elsewhere in the product. Dealer components remain dealer-owned; no admin component is imported.
- Visual language remains the existing BRP portal system: neutral raised surfaces, thin borders, orange active/action accents, dense information layout, and mobile-first controls.

## Global constraints

- Dealer routes only. Files below `src/components/admin`, `src/lib/admin-*`, and `src/app/admin` are out of scope.
- Do not display the words `демо`, `демонстраційний`, `тестовий`, or equivalent mode labels in the interface.
- Do not report a successful network/export operation when no backend operation exists.
- Keep current local dealer workflows compatible with the future `brp-dev1` backend boundary.
- Preserve GitHub Pages static-export and base-path behavior.
- Desktop and 390 px mobile layouts must not introduce document-level horizontal overflow.

## Parts catalog

### Information architecture

The deep catalog is one persistent cascade instead of separate list pages:

1. product family/category;
2. year;
3. series;
4. model/configuration;
5. diagrams.

Each selected parent remains visible and highlighted. The breadcrumb contains the complete selected path. Selection state is encoded in the catalog URL/query so reload, browser back, and browser forward restore the same cascade.

The evidenced branch must exist:

`Can-Am SXS → 2021 → 005 - SSV - North America - Maverick Trail Series → 002 - Maverick Trail 1000 - BASE_DPS…`

The diagram column uses the source names visible in the reference, including `00- Model Numbers`, `01- Rotax - Air Intake Manifold And Throttle Body`, `01- Rotax - Crankcase`, and `04- Drive - Front Section - Common Parts`.

Rows without evidenced downstream data remain visibly unavailable instead of acting as inert links. Existing supported ATV routes remain reachable.

### Responsive behavior

- Desktop: two through five panes fill the available dealer main width.
- Narrow desktop/tablet: the cascade is internally horizontally scrollable; the document itself does not overflow.
- Mobile: only the selected path and current/next pane need to be prominent. Earlier selections remain accessible through breadcrumb/back controls and URL state.

## Accessories catalog

### Independent filter layers

The current family cards remain at the top and control `family` only. They are not the product category filter.

Below them, add the source-style vehicle selector:

- mode: `За моделлю` active;
- `За VIN` disabled with a concise availability explanation;
- year → model → trim → engine cascade;
- changing a parent resets incompatible descendants.

The product facet layer contains independent product category, availability, compatibility, and purpose filters. Options derive from the same typed product rows used by the cards. Across groups filters compose with AND; multiple values inside one group compose with OR.

Product search and sorting continue to operate over that same filtered collection.

### Responsive behavior

- Desktop: vehicle selectors sit below family cards and facets remain in the left rail.
- Mobile: search consumes remaining width; one icon filter button opens a single collapsed filter disclosure containing vehicle selectors and product facets.
- The disclosure is closed by default, has an accessible name, and exposes `aria-expanded` and `aria-controls`.

## Documents navigation badge

Restore the source-backed new-document badge `5` beside `Документи` in dealer navigation. It is a separate source count, not `dealerDocuments.length`; the table is only a representative three-row sample. The badge is visible in desktop navigation and the mobile navigation drawer.

## Drafts toolbar

Use one compact toolbar row at desktop and 390 px:

1. search grows to use remaining width;
2. icon-only filter trigger;
3. Excel action;
4. info trigger explaining why Excel is unavailable.

The filter disclosure is closed by default and contains only fields represented by the current draft contract:

- content: all / with items / empty;
- buyer: all / assigned / unassigned;
- reset action and active-filter count.

Search composes with both filters. Excel remains disabled and never reports success. The existing info explanation remains interactive and contains no mode wording.

## Data and component boundaries

- Add a typed dealer catalog cascade data module rather than expanding `mock-data.ts` with route logic.
- Extend accessory product records with category and vehicle-fitment fields.
- Keep pure filter/cascade functions in dealer data modules so they can be tested without the browser.
- Keep interactive cascade/filter state in existing client components or focused dealer-only child components.
- Export a semantic `dealerNewDocumentCount` from dealer secondary data and use it in `DealerRoleNav`.

## Acceptance tests

- Parts: exact SXS/2021/005/002 path exposes five labelled panes, exact breadcrumb, source diagram names, and stable reload/back state.
- Accessories: family and category are independent; vehicle parent changes reset invalid descendants; filters/search/sort compose; mobile disclosure is closed by default and page has no horizontal overflow.
- Documents: navigation badge is exactly `5` and is not tied to the three visible table rows.
- Drafts: compact toolbar remains one row at 1440 and 390; filter disclosure works on actual draft fields; Excel stays disabled; info reason is available.
- Existing dealer state, cart, drafts, orders, mobile shell, static export, and authentication tests remain green.

## Deployment acceptance

After implementation and review: push a feature branch, create and merge a pull request, wait for the GitHub Pages workflow, and verify the published dealer pages on desktop and mobile widths.
