# Dealer Order Detail Specification

## Certification contract

The LOG-01 detail capture and source QA record are historical dealer evidence from 2026-07-18. Fresh dealer-authenticated desktop 1440px and mobile 390px detail evidence is **PENDING**. A 2026-07-20 admin-session observation is not a substitute.

## Layout

Desktop uses a two-column layout: order summary and line table at left; information, chat, timelines and shipments at right. Mobile stacks all cards.

## Content

Summary shows code, New status, created date, customer, PO, delivery, part count and total. Lines show part number, description, source/status, quantity, dealer price and total.

## Local interactions

- A private line note can be edited and saved locally.
- Chat accepts text and attachment metadata; sent messages appear immediately in the local order record without a `Demo` badge or any other demo/test/environment label.
- Order and item timelines expand/collapse.
- Status and fulfilment controls do not appear in dealer detail.

## Message and attachment boundary

Message send is a deterministic local state update. It does not send a remote message. A selected attachment may be represented only by its local filename/metadata until a backend upload contract exists; the interface must not imply that a file was uploaded. Any upload/transfer control is locked with a persistent reason available to pointer, touch, and keyboard users.

## Locked operational controls

Approval, confirmation, fulfillment, shipment, delivery, permissions, and real file transfer are absent or locked. They are not dealer-local detail interactions. The lock explanation must be exposed beyond a native title tooltip; see [dealer-workflow-boundaries.spec.md](./dealer-workflow-boundaries.spec.md).

## Future source capture

In a dealer-authenticated session, capture the summary, line note, chat composer, timeline/disclosure, attachment affordance, and mobile stacked layout. Do not send source chat, upload a file, approve, fulfill, or ship an order.
