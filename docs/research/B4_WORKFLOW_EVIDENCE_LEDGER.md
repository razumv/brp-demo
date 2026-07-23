# B4 workflow evidence ledger

Date: 2026-07-23

This ledger separates behavior that is implemented and testable in the client from behavior that requires an external service. It is a release contract: the interface must never turn an unavailable backend operation into a simulated success.

| Workflow | Evidence class | Implemented client states | External dependency / safe boundary | Verification |
| --- | --- | --- | --- | --- |
| Shell language, theme, sidebar, view and collapsible preferences | Confirmed client behavior | selected, persisted, restored after refresh | None for the preference itself | `shell-functionality-contract`, route and appearance suites |
| Notification center | Confirmed client behavior | unread, read, mark-all-read, empty/read state, navigation | Server-sourced notifications and cross-device read state are not claimed | `shell-functionality-contract` |
| User identity and company menu | Confirmed client behavior | identity, role, company, language/theme controls, logout | Profile mutation requires the account service and is not reported as successful | shell interaction suites |
| Dealer catalog navigation and search | Confirmed client behavior | loading route, results, empty search, clear, URL-preserving navigation | Availability and pricing refresh require connected services | catalog E2E and catalog-search contract |
| Dealer workshop | Confirmed durable browser behavior | drag/drop, keyboard-select fallback, optimistic state, persisted success, rollback/error | Server persistence is not claimed | `dealer-order-state`, local-adapter and operational E2E |
| Dealer schedule timeline | Confirmed client behavior | expanded/collapsed, persisted after refresh | Live logistics updates are not claimed | operational E2E |
| BossWeb lookup | Confirmed reference-directory behavior | automatic debounced search, found, empty, clear | Online BossWeb stock, substitutions and ETA are explicitly service-dependent | operational E2E |
| Ocean BL/container inspection | Confirmed client behavior | BL grouping, container expansion, filters, empty state, modal details | ETA mutation, document upload and receipt posting remain preview/disabled until services are connected | ocean E2E and B4 operations contract |
| Admin order preflight | Confirmed inspection behavior | line filtering, panel expansion, validation preview, modal close/reopen | Confirmation and business mutations require the backend and never emit fake success | admin order E2E |
| Companies, users and permissions | Confirmed inspection/form behavior | open, validate, cancel, repeat-open, responsive overflow | Create/update/permission persistence requires account and authorization services | admin companies/users E2E |
| Returns, invoices, supplier and warehouse operations | Confirmed inspection behavior | search/filter, rows/cards, empty/disabled/error explanations where available | Posting, scanning, supplier submission and document generation require their services | route matrix and domain E2E |

## State policy

- Loading is shown while a route or asynchronous client adapter is pending.
- Validation errors stay next to the affected control and keep the dialog open.
- Empty results are rendered inside the owning surface with a recovery action when one exists.
- Disabled actions include an accessible reason tied to the missing service or permission.
- A success state is allowed only after the client adapter has durably completed its supported operation.
- Failed durable writes roll back optimistic UI and expose an error; they are never silently retained as success.
- Dialogs must restore focus, close with Escape, trap focus while open, and keep their header/footer reachable when content overflows.

## Source confidence

The current repository and automated browser behavior are the primary evidence for the client contracts above. Workflows that depend on the external BRP, BossWeb, account, authorization, logistics, warehouse or document services remain explicitly backend-dependent. No production service response, business-rule mutation or permission grant is inferred from static fixture data.
