# Admin Mobile Controls Refinement Design

**Date:** 2026-07-20

**Status:** Approved in conversation

**Extends:** `2026-07-20-admin-mobile-density-design.md`

**Scope:** Mobile admin controls below `768px`; desktop behavior remains unchanged

## Goal

Remove the remaining mobile whitespace and tall control stacks without hiding real functionality. Search remains the primary control, secondary controls move behind one consistent icon trigger, segmented choices use the available width, and permission matrices become short scan-first disclosures.

## Reference Lock

The current BRP admin visual language remains authoritative: light neutral surfaces, thin borders, compact typography, restrained elevation, and orange only for active/primary states. The shared toolbar keeps the approved inline-disclosure model from the parent design rather than introducing a bottom sheet or modal.

Reference ingredients remain:

- shadcn-style compact spacing, explicit focus states, and 44px mobile targets;
- Rows-style efficient full-width control bars;
- Operate-style ledger density for permission and operational data.

Explicitly reject decorative filters, fabricated operational workflows, hover-only explanations, and mobile-only changes that alter desktop behavior at `768px` or wider.

## Shared Mobile Toolbar Contract

Below `768px`:

- Search and a 44×44 icon-only filter trigger share the first row.
- Search grows to consume all remaining width.
- The trigger has an accessible name, `aria-expanded`, `aria-controls`, and an active-filter count badge when non-zero.
- The visible `Фільтри` label and chevron are removed on mobile only; desktop controls keep their labels.
- Activating the trigger expands the existing inline panel immediately below the search row.
- Only real secondary controls enter the disclosure. Primary page/section selectors stay outside it.
- Segmented controls explicitly marked full-width distribute their buttons evenly without changing all existing segmented controls globally.
- Omitting `mobileDisclosure` means no mobile disclosure. Supplying `{}` uses the default `filters` section. Supplying `{ sections: [] }` deliberately discloses nothing and must not suppress the controls.

At `768px` and wider the current toolbar ordering, labels, dimensions, and controls remain unchanged.

## Page Contracts

### Order pipeline

- Keep period and unread-only controls inside the icon disclosure.
- Do not present the current notifications-only control as a working filter: its predicate currently rejects every order and no notification data is evidenced.
- Stretch List/Kanban across the toolbar width below the search row.

### Consignment

- Keep Warehouse/Network/Requests as the primary full-width section selector.
- Add the icon disclosure beside search.
- Warehouse and Network may filter the evidenced representative rows by dealer/holder.
- Requests retain the existing status filter. No request data or counts are invented.

### Returns

- Put the existing status control behind the icon disclosure.
- Keep the create-return action and disabled refresh semantics unchanged.

### Ocean freight

- Put status, collection view, and BL grouping behind the icon disclosure.
- Remove the mobile `visible/total BL · visible/total containers` toolbar copy.
- Preserve grouping and card/table behavior.

### Unit shipping

- Place the two BossWeb synchronization-window dates in two equal columns on one row at 390–767px.
- Keep the disabled synchronization action on the next full-width row.
- Do not merge these local sync-window dates with the shipped-record filter dates.

### Warehouse receiving

- Keep the shipment selector full-width.
- Show the three disabled receiving operations as an equal three-column icon action row on mobile.
- Each icon has an accessible name. Tap, keyboard focus, and pointer hover can reveal the explanation; a persistent compact read-only note provides the reason without depending on tooltip availability.
- No receipt, scan, 1C, or inventory mutation is added.

### Settlements

- Add an icon disclosure beside search using real fixture fields: sort by dealer name, movement count, or last movement date, plus a recent-movement quick filter.
- Remove the mobile `19 з 19 дилерів` copy.
- Keep the persisted synchronization diagnostic and detail-period state independent from list filters.

### Invoices

- Remove the mobile contracts/appendices `visible з total` copy where it duplicates the collection itself.
- Preserve existing search, section selection, previews, and locked actions.

### Catalog

- Keep the category controls and advanced filters behind the icon disclosure.
- Stretch All/ATV/SSV/PWC evenly across the available mobile width.
- Preserve the existing filtered arrays, record cards, action menu, and desktop tables.

### Schedule

- Place Open Excel and Synchronize in one two-column mobile row.
- Both remain disabled. Source inspection never invoked them and the clone has no endpoint, workbook, callback, job state, or evidenced success/error workflow.
- Do not fabricate exports, timestamps, counts, downloads, or synchronization results.

### Companies

- Keep New Company as the primary action.
- Add an icon disclosure beside search for real fields: profile complete/incomplete and manager assigned/unassigned.
- Preserve the existing mobile company cards and all actions.

### Dealer access

- Add an icon disclosure beside search for team access/profile state and company-policy permission state.
- Keep the company selector primary and outside the filter disclosure.

### Role permissions

- Search and the icon trigger share the first row.
- Role selection, enabled/disabled permission-state filtering, and read-only bulk actions live in the disclosure.
- Role remains explicitly labelled; it is not represented as an unlabelled filter.

## Compact Permission Rows

The shared permission matrix keeps its desktop table unchanged. Below `768px`, each object becomes a collapsed summary row rather than a full card with one vertical row per action.

Collapsed state contains:

- object icon and name;
- enabled/applicable summary such as `3/4 увімкнено`;
- disclosure affordance.

Expanded state contains a two-column action grid. Each action keeps its icon, label, switch state, read-only semantics, and accessible name. Rows use `aria-expanded` and a labelled controlled region. Search results remain collapsed by default unless the query specifically matches an action, in which case the matching row may start open for discoverability. Expansion is presentation state only and is not persisted.

The same component serves Role Permissions and Dealer Company Policy so the two screens do not drift.

## Data And Safety

- Filters consume existing fixture fields and derived collections; no remote request or new source data is introduced.
- Presentation changes do not reset search, selected tabs, selected role/company, pagination, or expanded business records.
- Read-only operational buttons remain unable to mutate local fixtures or call external services.
- Duplicate mobile result metadata may be visually hidden, but accessible collection meaning and empty states remain.

## Accessibility

- Mobile interactive targets are at least 44×44px.
- Icon-only controls have explicit accessible names and visible focus treatment.
- Disabled operational explanations are available without hover.
- Disclosures expose `aria-expanded` and `aria-controls`.
- Full-width segmented controls retain one selected/pressed state and do not become unlabeled icons.
- Mobile and desktop permission representations are mutually hidden with `display: none` at the breakpoint.

## Verification

- Test-first shared-contract tests for toolbar disclosure semantics and full-width mobile controls.
- Playwright geometry/behavior checks at 390, 767, and 768px.
- Desktop regression checks at 1440px.
- Permission disclosure keyboard and accessible-name checks.
- Assertions that Schedule, Warehouse, and BossWeb operational actions remain disabled/no-op.
- No document-level horizontal overflow on every affected route.
- Final lint, TypeScript, production build, PWA validation, and affected mobile browser suite.
