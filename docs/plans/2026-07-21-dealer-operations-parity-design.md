# Dealer Operations Parity — Design

**Date:** 2026-07-21  
**Status:** Approved  
**Scope:** Dealer application only. Admin routes and components are out of scope.

## Objective

Bring the remaining dealer operational pages into one coherent BRP interface, restore the source-backed Units presentation, remove invented or non-working header/report controls, and make every visible search or filter produce a real, deterministic local result.

This pass targets desktop parity first. Existing mobile behavior must not regress, but mobile-specific density and navigation changes remain a later batch.

## Evidence boundary

The implementation may use:

- the current shipped dealer implementation on `origin/main`;
- the historical dealer screenshots and route inventory under `docs/design-references` and `docs/research`;
- the user's explicit requirements in this task;
- typed local dealer data already used by the clone.

The current source-browser session is authenticated as an administrator and therefore cannot certify dealer-only workflows. An admin redirect or admin page must never be treated as dealer evidence.

Where fresh dealer evidence is missing, the interface must expose only deterministic read or local-create behavior already supported by an explicit local contract. It must not invent remote mutations, lifecycle transitions, exports, synchronization, receipt, shipment, allocation, or assignment behavior.

## Visual reference lock

Preserve the existing BRP shell, typography, orange accent, borders, radii, and compact operational density.

For control composition, use the successful admin toolbar behavior as a structural precedent without importing or changing admin components:

- the search field owns all remaining horizontal width;
- one compact icon-only filter trigger sits immediately to its right;
- detailed controls are disclosed below the row;
- an active-filter count is visible on the trigger;
- tabs remain navigation/view state and are not hidden inside the filter panel.

Supporting product references reinforce a white operational canvas, thin gray borders, restrained shadows, one orange action accent, compact controls, and clear kanban/drop affordances only when a real transition exists. The BRP design system remains authoritative; no restyling or new color system is introduced.

## Shared dealer search and filter contract

Create a dealer-owned primitive such as `DealerDataToolbar`.

```ts
type DealerDataToolbarProps = Readonly<{
  search: {
    value: string;
    onValueChange: (value: string) => void;
    label: string;
    placeholder: string;
  };
  filters?: {
    label: string;
    activeCount: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    panelId: string;
    content: React.ReactNode;
    onClear?: () => void;
  };
  resultMeta?: React.ReactNode;
}>;
```

Required behavior:

1. The root search row is a single line on desktop and mobile.
2. Search uses `flex: 1 1 auto` with `min-width: 0`.
3. The filter trigger is a 44px square icon button with a readable accessible name.
4. The trigger exposes `aria-expanded` and `aria-controls`.
5. The panel renders immediately below the row and contains only controls backed by typed fields and predicates.
6. Reset clears all page filters without clearing unrelated tabs or navigation state.
7. Search results update immediately and announce result metadata through a polite live region where useful.
8. Keyboard and touch users receive the same filter access as pointer users.
9. No admin component or stylesheet is modified or imported to achieve this.

## Page contracts

### Consignment

- Preserve Stock, Network, and Requests as separate tabs.
- Search part number, description, and dealer.
- Filter by the real row status: available, reserved, or requested.
- Correct the current semantic bug where any positive quantity is labeled available even when the row is reserved.
- Keep final operational request submission unavailable unless a real backend mutation contract exists.
- Do not render a disabled action merely to explain that the backend is absent.

### Settlements

- Add the shared full-width search for document code.
- Move the observed 30/60/90/180/360-day period choices into the compact filter disclosure.
- Derive rows, totals, and empty state from the same filtered collection.
- Use an injectable/reference clock so July 2026 fixtures do not silently age into a permanently empty screen.
- Remove inert refresh/export controls rather than leaving decorative disabled controls.

### Parts inventory

- Search part number and description.
- Filter by derived stock state: in stock, low stock, or out of stock.
- Derive KPI totals and table rows from the same filtered collection.
- Keep inventory mutation and synchronization absent.

### Dealer network

- Preserve Parts and Units as separate tabs.
- Parts search covers part number and description.
- Units search covers model and VIN; do not advertise SKU unless the unit model gains a real SKU field.
- Filter by dealer values derived from the active tab's collection.
- Keep allocation, reservation, and cross-dealer writes absent.

### Customers

- Replace the capped search plus wide segmented category control with the shared toolbar.
- Search name, phone, email, address, and notes.
- Filter by the existing Retail, Fleet, VIP, and Wholesale categories.
- Preserve working create/edit/delete and equipment workflows.

### Units

Use `docs/design-references/dealer-units-expanded.png` as the source-backed baseline for the Incoming view.

Restore the evidenced semantics:

- 15 shipments and 13 units in the captured state;
- KPI values `0 / 13 / 0 / 13` for ready, awaiting registration number, accepted, and owned units;
- shipment quantity expressed as assigned/total, for example `1/4`;
- source column families for container, BL number, units, ETA, route, status, and action;
- expanded unit rows with row number, model, SKU, year, VIN, status, and action;
- static status/action badges where evidence does not prove a mutation.

Search must cover only real fields in the typed collection: container, BL, model, SKU, and VIN. The shared compact filter may expose the active view/status only when it changes the rendered collection.

Receiving, status changes, sales, shipment, and synchronization remain absent. Existing local Stock/Sold content must not be presented as source-certified when no matching capture exists.

### Workshop

- Add full-width search over description, customer, mechanic, and notes.
- Add a compact filter for the existing stage and work type fields.
- Preserve local work-order creation, validation, persistence, and reload restoration.
- Surface retryable persistence errors instead of replacing them with a generic message.
- Remove the lock notice and the disabled `Зміна статусу недоступна` button.
- Keep cards static and non-draggable.
- Do not add dropzones, drag handles, transition buttons, or a status mutation command.

The current source evidence does not define an allowed status-transition graph. The four stored status values describe renderable states, not permission to move between them.

### Parts report

Do not copy the admin report schema into the dealer application.

Use a narrow dealer projection derived from the dealer-owned order collection:

```ts
type DealerPartsReportQuery = Readonly<{
  from: string;
  to: string;
  managerId?: string;
}>;

type DealerPartsReportRow = Readonly<{
  orderId: string;
  orderCode: string;
  createdAt: string;
  itemCount: number;
  total: { amount: number; currency: "USD" };
  manager?: { id: string; displayName: string };
}>;
```

- Search by order code.
- Filter by a real date range or source-observed period.
- Expose manager filtering only when the model has a distinct manager identity; never alias order creator as manager.
- Remove the unverified status filter/column, invented KPI cards, and disabled export.
- Keep order-code navigation to safe local order details.

### Dealer header

Keep:

- brand/home navigation;
- live global parts search and its result/cart behavior;
- theme control;
- profile/logout;
- cart and checkout navigation.

Remove:

- the invented disabled client-mode control;
- its help/explanation control;
- disabled language and notification controls and their help affordances;
- any user-facing mockup, clone, local-mode, or future-service copy.

Language or notification controls may return only with actual data/preferences and working interaction semantics. The unknown source corners icon is not restored until its purpose is observed.

## State and error behavior

- Search and filter state is page-local and deterministic.
- Existing dealer entity mutations keep using the dealer workflow provider and atomic local persistence.
- Filter UI state may reset on page reload unless the current page already promises persistence.
- Workshop creation must not show success or mutate in-memory state when persistence fails.
- Empty states name the filter/search action the user can take; they do not blame unavailable services.
- Disabled decorative controls are removed. A disabled control is allowed only when the control itself is required for source parity and the reason is persistently accessible.

## Accessibility

- Minimum 44px pointer targets for compact triggers.
- Visible focus rings for search, filter trigger, disclosure controls, tabs, and row disclosures.
- `aria-expanded`/`aria-controls` on every disclosure.
- Native labels or explicit accessible names for all fields and icon buttons.
- Search/filter result updates announced politely without moving focus.
- Units disclosures work with Enter and Space.
- Workshop cards must not imply drag behavior through cursor, ARIA, or styling.

## Validation contract

Implementation starts with failing tests for:

1. shared toolbar geometry and accessibility;
2. one visible result change for every exposed filter;
3. consignment available/reserved semantics;
4. settlement reference-clock behavior;
5. dealer-network active-tab dealer options and unit search fields;
6. source-evidenced Units counts, assigned/total values, columns, search, and disclosure;
7. Workshop create/reload/error behavior and explicit absence of draggable/dropzone/transition UI;
8. dealer report date/manager projection without creator aliasing or unverified export/status UI;
9. dealer header absence of invented disabled controls and mockup-style copy;
10. an admin-scope diff guard proving no admin source files changed.

Run unit tests, focused Playwright tests at 1440px and 390px, lint, typecheck, and production build. Capture representative desktop screenshots for the affected dealer routes before shipping.

## Non-goals

- Admin UI changes.
- Mobile-specific navigation or density redesign.
- Remote `brp-dev1` integration.
- Workshop status transitions or drag-and-drop.
- Unit receiving, selling, shipping, or synchronization.
- Consignment submission, inventory mutation, cross-dealer allocation, or real exports.
- Claiming fresh source certification without a dealer-authenticated source session.

