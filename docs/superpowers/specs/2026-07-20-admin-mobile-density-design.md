# Admin Mobile Density And Responsive Data Design

**Date:** 2026-07-20  
**Status:** Approved in conversation  
**Scope:** Admin pages on phone-sized viewports; existing desktop behavior remains unchanged

## Problem

The admin area is functionally available on phones, but several pages still behave like compressed desktop screens:

- KPI grids stack into long vertical blocks before the operational content.
- Toolbars turn each filter into a full-width row, making common actions slow to reach.
- Wide catalog and user tables remain desktop-width and are merely scaled or horizontally scrolled.
- Some diagnostic panels consume a full viewport even when they are secondary information.
- A few pages retain fixed minimum widths that make the entire document appear zoomed out.

The goal is to make the existing admin experience feel intentional on a phone without changing data, permissions, read-only behavior, or desktop interaction.

## Chosen Direction

Use a hybrid responsive architecture:

1. Shared opt-in mobile behavior for KPI grids, toolbars, tabs, and collapsible filter panels.
2. Page-local mobile cards for primary data sets that cannot be understood as narrow tables.
3. Existing desktop tables, grids, controls, and actions remain mounted only at desktop/tablet widths.
4. Secondary audit/detail tables may keep horizontal scrolling when that is the clearest representation.

This avoids brittle page-by-page CSS patches and avoids a separate mobile application or duplicated route tree.

## Alternatives Considered

### CSS-only compression

Reduce padding and font sizes while retaining every desktop table and toolbar.

Rejected because it preserves the main failure mode: users still receive wide tables and long stacks rather than a phone-native information hierarchy.

### Separate mobile routes

Create a second mobile implementation of each admin page.

Rejected because it duplicates data-flow and interaction logic, increases drift risk, and is unnecessary for a responsive web application.

## Reference Lock

The current BRP visual language remains the primary design foundation:

- white and cool-gray surfaces;
- thin neutral borders and restrained elevation;
- orange used only for active states and primary actions;
- compact sans-serif hierarchy;
- direct, operational controls.

Borrowed reference details:

- **shadcn UI style** (`c14c0a94-1037-449e-bf5b-4cb972656ac7`): 8px control gaps, 10–14px radii, thin borders, compact information density;
- **Shopify mobile orders** (`daf60fc6-238e-49b0-9bed-14b9e4783bd5`): search-first hierarchy, scannable rows, right-aligned metadata, status badges;
- **Monday mobile filtering** (`492008c5-8fab-40d2-b181-2ecee14cebf9`): progressive disclosure for secondary filters and a clear active-filter count;
- **UGLYCASH portfolio** (`be9ece22-7011-48be-9539-4d0b4358ac88`): collapsible secondary sections with persistent access to status and summary information.

Explicit rejects:

- vertically stacked KPI cards on phones;
- shrinking the whole page to fit a fixed-width desktop table;
- icon-only controls without accessible names;
- reducing touch targets below 44px;
- changing BRP color roles or introducing decorative mobile-only styling.

## Responsive Contract

The primary mobile breakpoint is below `768px`.

- `< 768px`: mobile KPI visibility, mobile data cards, compact page spacing, mobile-only disclosures, and stacked schedule structure.
- `>= 768px`: current desktop/tablet representations and behavior remain unchanged.
- Existing narrower control rules may still use `640px` internally when they do not create an inconsistent 641–767px layout.

Desktop and mobile representations must never be simultaneously exposed to assistive technology or keyboard navigation. CSS hiding must use `display: none` at the inactive breakpoint.

## Shared Components

### Mobile-hidden KPI sections

`AdminKpiGrid` gains an opt-in mobile visibility contract rather than changing every current consumer.

Recommended API:

```tsx
<AdminKpiGrid hideOnMobile items={items} />
```

Custom page KPI sections receive the equivalent page-local class. Hiding is complete on mobile, not a collapsed KPI drawer.

### Compact mobile toolbar

`AdminToolbar` gains an opt-in compact mobile layout. Desktop markup and layout stay the same.

On mobile:

- search occupies the full available width;
- a `Фільтри` trigger exposes secondary controls inline;
- the trigger shows the active-filter count when non-zero;
- selects remain native/selectable and retain current labels;
- reset remains a textual action;
- view controls remain visible when they change the primary representation;
- the filter disclosure is not persisted because filters themselves already preserve their state in page state.

The disclosure uses the existing BRP surface and focus treatment. It must not introduce a modal or route change.

### Mobile tabs

Where a page already supplies a mobile label, desktop segmented tabs become a labelled native select below the mobile breakpoint. The selected value and tab-panel semantics remain unchanged.

### Responsive persisted section

The existing persisted collapsible section is extended or wrapped to support a mobile-only collapse mode:

- mobile default: closed;
- desktop/tablet: always presented open;
- mobile open/closed state stored under a stable `localStorage` key;
- storage failure falls back safely to the default;
- reduced-motion users receive no height animation.

This prevents the settlements desktop page from changing while making the diagnostic panel compact on phones.

## Page Decisions

### Order pipeline

- Hide the horizontal status-summary card row on mobile.
- Keep counts visible in the corresponding section headings/badges.
- Convert the search/filter toolbar to the compact disclosure pattern.
- Keep list/kanban choice visible.
- Do not change order grouping, pagination, or row actions.

### Supplier orders

- Hide the four KPI cards on mobile.
- Keep the order-state selector visible.
- Use search as the primary full-width control; period and sorting/status live in the filter disclosure.
- Preserve the empty state and existing filter semantics.

### Air freight

- Hide the workflow stage strip and KPI card row on mobile.
- Keep attention items and recent activity because they are operational content, not summary decoration.
- Keep the section selector and shipment search available.

### Ocean freight

- Hide the four KPI cards on mobile.
- Preserve the transport-section selector.
- Put status, collection view, and grouping controls behind the compact filter disclosure while retaining the search field.
- Do not change BL/container grouping behavior.

### Unit shipping

- Keep shipment-state selection visible.
- Keep search full width.
- Move type, period, model, and reset into the compact filter disclosure.
- Preserve every existing date, model, and type value and the current BossWeb/read-only state.

### Warehouse

- Hide KPI rows for each warehouse process on mobile.
- Preserve process and supply selectors as primary controls.
- Keep action buttons and read-only/disabled states unchanged.
- Stack primary content and side panels into one column without fixed page width.

### Settlements

- Hide KPI cards on mobile.
- Turn the 1C synchronization diagnostic into a mobile-only persisted collapsible section.
- Closed state shows title, current status badge, and disclosure affordance.
- Open state shows timestamps, mapping summary, error message, and refresh action.
- Default closed on mobile; desktop remains open.

### Invoices and documents

- Hide page-level, appendix, and cost KPI sections on mobile.
- Keep the document-section selector and search/action row.
- Preserve direct access to contract/invoice actions and all current disabled states.
- Secondary high-column cost/audit tables may remain labelled horizontal scroll regions.

### Catalog

- Hide global catalog KPIs, vehicle KPIs, and distributor count summaries on mobile.
- Keep catalog-section selection, search, category filters, and advanced-filter disclosure.
- Replace primary vehicle, distributor, and parts tables with page-local mobile record cards below 768px.
- Cards use the exact filtered arrays already used by desktop tables.
- Each card prioritizes identity, status, key technical attributes, price, and the existing action menu.
- Import history and dense secondary audit data remain horizontally scrollable, labelled regions.
- Remove mobile fixed-width behavior that causes the entire document to scale down.

### Delivery schedule

- Hide the four KPI cards on mobile.
- Keep the existing persisted delivery chronology section.
- Retain the mobile date-group chronology representation and remove any fixed minimum width that scales the page.
- Stack delivery-slot list and selected-slot detail in one column.
- Use mobile cards/rows for slots and preserve pagination and selection.
- Keep section selection and search/category controls accessible through the compact toolbar pattern.

### Companies

- Keep the existing mobile card representation.
- Reduce card padding and vertical gaps.
- Keep company count, profile status, date, and all four direct actions.
- Maintain 44px minimum action targets; compactness comes from spacing, not smaller controls.

### Users

- Hide user KPI cards on mobile.
- Replace the active-user desktop ARIA grid with mobile cards below 768px.
- Reuse the same filtered user collection and existing identity, contact, company, role, status, registration, and action components.
- Preserve all direct actions with labelled 44px targets.
- Keep the visible result count after the mobile list.

### Permissions

- Keep the existing mobile permission matrix representation.
- Use compact search sizing.
- Keep role selection compact and labelled.
- Wrap or disclose the read-only bulk actions so they do not each occupy a full row.
- Preserve applicable-action filtering and every switch state.

## Data And State

- Responsive representations consume the same derived arrays as the desktop tables.
- No duplicate filtering, sorting, pagination, or permission logic is introduced.
- Mobile disclosures store only presentation state where explicitly required.
- KPI visibility does not change data requests or calculations.
- Switching viewport size does not reset filters, selected tabs, selected records, or pagination.

## Accessibility

- Interactive controls keep a minimum 44px touch target on phones.
- Every mobile card has a meaningful accessible label or heading.
- Icon actions retain visible tooltips where applicable and explicit `aria-label` values.
- Disclosures expose correct `aria-expanded` and labelled-region relationships.
- Mobile and desktop duplicates are mutually hidden from the accessibility tree.
- Horizontal scroll regions retain `role="region"`, a label, and keyboard focus where needed.
- Status is never communicated by color alone.
- Focus outlines and reduced-motion behavior use the current shared system.

## Verification Strategy

Implementation follows test-first behavior contracts:

1. Add a failing mobile admin contract test before production changes.
2. Verify KPI opt-in behavior and responsive visibility classes.
3. Verify mobile cards use the same records, labels, and actions as desktop representations.
4. Verify settlements mobile persistence/default and desktop-open behavior.
5. Verify compact filter disclosure states, active-filter count, and accessible naming.
6. Run lint, TypeScript, production build, and PWA validation.
7. Browser-test target pages at representative phone and desktop widths.
8. Confirm no document-level horizontal overflow on catalog, users, or schedule.

Representative mobile width: `390px`.  
Representative desktop width: `1440px`.

## Acceptance Criteria

- The listed KPI/status widget groups do not appear below 768px and remain unchanged at 768px and above.
- Search is immediately reachable and secondary filters are compact on each targeted phone view.
- Catalog and Users show scannable cards instead of scaled desktop tables.
- Schedule no longer renders as a miniaturized desktop page and its chronology remains usable.
- Settlements diagnostics are closed by default on mobile, persist their mobile state, and stay open on desktop.
- Companies cards use less vertical space without shrinking actions below 44px.
- Permissions filtering fits the phone width without a stack of full-width bulk buttons.
- No functional action, filter value, result count, disabled state, or read-only constraint is lost.
- No targeted page introduces document-level horizontal scrolling.
- Desktop screenshots remain visually and functionally equivalent outside the intentionally shared component internals.

## Non-goals

- Redesigning the global mobile header or navigation drawer.
- Changing application permissions, data sources, or business logic.
- Turning the admin site into a separate native application.
- Reworking unrelated dealer-portal pages.
- Replacing every secondary technical table with cards.

