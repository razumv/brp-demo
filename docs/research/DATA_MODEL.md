# Shared Demo Data Model

## Entities

- Session: role, email, displayName, company.
- Customer: id, name, phone, email, address, notes, equipmentIds, createdAt.
- Equipment: id, customerId, model, vin, year, engineNumber, purchasedAt, notes.
- Part: number, description, reference, stock, dealerPrice, retailPrice, supersededBy.
- CatalogNode: id, kind, code, title, subtitle, parentId, children.
- Diagram: id, title, index, total, image, parts.
- CartLine: partNumber, quantity, sourceDiagramId.
- Order: id, code, customerId, po, note, delivery, status, stage, createdAt, lines, messages, timeline.
- Message: id, author, role, body, createdAt, demo.
- WorkshopOrder: id, type, customerId, description, mechanic, scheduledAt, notes, status.

## Store guarantees

- Demo state is persisted under one versioned localStorage key.
- Passwords and source credentials are never part of the store.
- Derived totals are calculated from line price × quantity.
- Dealer-created customers, equipment, orders, notes and chat immediately appear on relevant dealer pages.
- The same local orders appear in Admin Overview, Pipeline and Parts Report.
- Admin reducers expose no transition for status changes, permission edits or operational workflow mutations.
- A Reset demo data action exists in the profile menu and only clears clone-local storage.
