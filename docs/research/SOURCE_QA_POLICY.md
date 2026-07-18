# Source QA Policy

## Allowed in the dealer source

- Navigate every card, order, tab, filter and catalog level.
- Search model codes and part numbers.
- Add QA-labelled clients, equipment, cart lines, orders, notes and chat messages.
- Open creation/edit dialogs and save only records whose visible name or notes begin with CODEX QA.

## Allowed in the admin source

- Navigate routes, search, filter, switch display modes and read details/timelines.
- Open company employee lists and assignment/edit dialogs only to inspect fields.

## Forbidden in the admin source

- Approve, confirm, send, cancel or advance an order.
- Receive warehouse stock, start a workflow, sync integrations, pause/clear/reset queues.
- Assign or deactivate users, modify permissions, delete records or save administrative edits.

## Clone rule

Dealer mutations are local demo state. Admin is read-only by construction. Any admin mutation control is disabled and has visible explanatory copy.
