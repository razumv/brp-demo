# Behaviors

## Shared shell

- Theme switches between light and dark locally and persists to localStorage.
- Language opens English, Русский and Українська options; Ukrainian is selected initially.
- At widths below 1024px the sidebar becomes a modal drawer and header text collapses to icons.
- The header uses normal document flow. No parallax, scroll snap or reveal animation was observed.
- Dealer header actions include global search, customer mode, quick part check and cart. Admin has global search, notifications and profile.
- Focus-visible is always explicit; orange is reserved for focus, active navigation and primary actions.

## Authentication

- Submit is disabled until email and password are non-empty.
- Dealer-looking emails enter the dealer demo; other emails enter the admin demo.
- Only role and display name are stored. Password values are never persisted or printed.
- A role switch in the profile menu is available only as a clone convenience after sign-in.

## Dealer catalog

- Model search returns the captured 0001KTB00 Outlander configuration and routes into the hierarchy.
- Part search returns 9779150 across compatible model/configuration rows.
- An unmatched search displays Моделей не знайдено / Запчастин не знайдено.
- Each hierarchy card updates breadcrumbs and the URL.
- Diagram desktop view is a split canvas/table. Mobile view switches between Схема and Запчастини.
- Diagram controls zoom in/out/reset, previous/next and list selection are local and deterministic.
- Adding a part from the diagram or quick-check panel updates the global cart badge, drawer and /cart.

## Cart and orders

- Cart line quantity, removal and clear-all update totals immediately and persist locally.
- Checkout captures customer, PO, note and delivery method.
- Submission creates a local demo order, clears the cart and routes through confirmation to the order detail.
- Dealer order search/status/list/Kanban filters are functional.
- Dealer order detail permits a local private line note and local chat message. Both are visibly marked Demo.
- The order status itself never advances automatically.

## Customers, workshop and team

- Dealer client creation validates name and one contact method, adds the record to the list and opens the detail.
- Client detail exposes edit fields, equipment and orders; adding demo equipment is functional.
- Workshop creation opens the observed fields and creates a local card only after explicit confirmation.
- The observed dealer account has no add-employee control. Team Access therefore shows the primary account and policy switches as read-only.
- Admin Companies exposes the observed assignment dialog as a preview only; the clone does not mutate people or permissions.

## Admin safety contract

- Admin is an explorable read-only mirror.
- Search, date filters, tabs, list/Kanban, status filters, card expansion, order detail, chat history and timelines are functional.
- Buttons that approve, confirm, send, cancel, advance, receive, start, reset, clear, synchronise, assign, edit access or delete are disabled and carry the explanation Демо: лише перегляд.
- The dealer-created demo order appears in admin metrics and the New pipeline column, but no admin action can change it.
- The pipeline open/pause control is rendered as a status label, not a mutation.

## Responsive and visual states

- Desktop: four-column KPIs, sidebar, tables and diagram split panes.
- Tablet: hidden sidebar, two-column KPIs and stacked secondary panels.
- Mobile: 16px page padding, one-column panels, horizontally scrollable data tables and drawer navigation.
- Dark mode uses #0d1117 canvas, #161b22 cards/sidebar, #010409 header and #30363d borders.
- Loading uses short skeletons; empty states retain the source icon/title/helper/action hierarchy.
