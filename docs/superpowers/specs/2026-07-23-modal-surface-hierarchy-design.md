# Modal Surface Hierarchy Design

## Objective

Make every BRP Parts Catalog dialog readable as a hierarchy of related
surfaces instead of one undifferentiated canvas. The pass covers dealer and
admin routes in both Astryx Neutral and shadcn renderers without changing
business rules or claiming backend success that did not occur.

## Approved Direction

Use hierarchical tiles:

- the dialog frame is the elevated root surface;
- the header and footer are fixed visual bands separated from the scrollable
  content;
- each semantic content group is a `DialogSection` surface;
- repeated entities are rows or inset mini-tiles inside their owning section;
- KPI cards remain visually stronger than informational sections;
- nested surfaces use progressively quieter backgrounds and borders;
- light and dark themes use existing semantic tokens rather than literal white,
  gray, or black colors.

The alternatives rejected were a card around every row, which creates excessive
visual noise and vertical length, and divider-only grouping, which does not
solve the reported blending problem.

## Shared Contracts

### Current/shadcn dialogs

The shared `Modal` in `src/components/shared/ui.tsx` keeps its focus trap,
Escape dismissal, outside-click dismissal, focus restoration, body scroll
locking, accessible title, and optional description. It gains stable semantic
surface classes on frame, header, body, and footer.

The BRP current-renderer adapter in
`src/components/brp-ui/current-adapter.tsx` uses the same geometry and surface
tokens so adapter-backed dialogs do not look like a separate application.

### Astryx dialogs

Astryx continues to own dialog behavior and primitives. Route views compose
semantic section surfaces inside Astryx `Dialog`, while shared class contracts
provide geometry and theme-safe layers only where Astryx composition does not.

### Dialog section pattern

A dialog section has:

- a heading associated with the section;
- optional supporting copy or action;
- a distinct surface, border, radius, and spacing;
- an optional `inset` mode for subordinate groups;
- an optional `muted`, `info`, `warning`, or `danger` tone;
- row separators or inset entity tiles for repeated data;
- a deliberate empty state contained by the section.

## Ocean Freight Reference Fix

The BL detail for `252108627` is the first acceptance reference.

- KPI metrics remain three tiles on desktop and stack on mobile.
- `Контейнери` becomes one section tile; each container remains an accessible
  disclosure row with an inset expanded body.
- `Пов’язані проформи` becomes a separate section tile with aligned rows.
- The rail uses independent tiles for `Інформація про BL`, `Документи`, and
  `Хронологія`.
- The rail background remains a quieter layer but is not used as the only
  grouping signal.
- At widths below 768 px the rail follows the main content and all sections
  become one-column without horizontal overflow.

## Inventory Scope

Audit all dialog implementations found through:

- shared `Modal` consumers in dealer, catalog, and current admin views;
- BRP adapter `Dialog` and `AlertDialog` consumers;
- Astryx admin dialog consumers;
- shell dialogs, drawers, and modal popovers that use `role="dialog"`;
- route-specific native dialog implementations.

Popover menus and non-modal search suggestion panels are checked for surface
contrast but are not converted into modal section layouts unless they contain
multiple semantic groups.

## Accessibility

The pass must preserve or improve:

- accessible title and description linkage;
- `aria-modal`, `aria-expanded`, `aria-selected`, and semantic section headings;
- Escape and outside-click dismissal where allowed;
- focus trap and focus return;
- visible focus;
- reduced motion;
- 44 px mobile touch targets for icon-only dialog controls;
- contrast in Astryx/shadcn light and dark themes;
- status meaning that is not color-only.

## Responsive Behavior

The audited matrix is 390×844, 430×932, 768×1024, 1280×800, 1440×900, and
1920×1080.

- Dialog width is bounded by the viewport.
- Header actions wrap or move below the title instead of colliding.
- Body content scrolls inside the dialog.
- Footer actions wrap on narrow screens while primary ordering remains clear.
- Multi-column content becomes one column below its route-specific breakpoint.
- Wide tables and dense entity lists scroll inside their section surface.
- The page behind a dialog never gains horizontal overflow.

## Testing

1. A source contract inventories dialog owners and asserts the shared semantic
   surface contract.
2. A focused Ocean Freight browser test opens BL `252108627` and verifies the
   named section surfaces, nested container disclosure, and non-overlapping
   layout.
3. A modal matrix test samples every dialog class in both renderers, both
   themes, dealer/admin sessions, and mobile/desktop widths.
4. Existing focus, Escape, renderer, appearance, Pages/PWA, and workflow tests
   remain green.
5. Final verification runs lint, strict typecheck, state/contract tests,
   production build, browser matrix, Pages/PWA tests, deployment, and production
   smoke.

## Non-goals

- No business-rule changes without source evidence.
- No backend integration or fabricated successful mutation.
- No visual redesign of non-dialog pages beyond changes required to open or
  verify their dialogs.
- No replacement of Astryx behavior primitives with local implementations.

