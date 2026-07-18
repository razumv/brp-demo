# Dealer Orders Specification

## List

Header, status total cards, search/filter controls and List/Kanban toggle. Captured status is New for a freshly submitted local order.

Each card/row shows code, dealer/company, creator, date, parts count, amount and status/stage chips. Search covers code, customer, PO and part number.

## Order builder lifecycle

Catalog/quick check -> Cart -> customer/PO/note/delivery -> submit -> confirmation -> order detail. Dashboard, Dealer Orders, Admin Overview and Admin Pipeline update from the same store.

## Empty and responsive

Before local submission, render the observed empty illustration/title/helper. Mobile cards stack metadata and keep the amount/status visible without horizontal scroll.
