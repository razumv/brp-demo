# Customer Management Specification

## Certification contract

The populated customer capture and the allowed QA-record creation are historical dealer evidence from 2026-07-18. Fresh dealer-authenticated customer and equipment captures at desktop 1440px and mobile 390px are **PENDING**. The current intended scope is a single Logos / Финансы dealer profile.

## List and create

Page header contains title, search/filters and New client. Client dialog fields are name, phone, email, address and notes. Require name and either phone or email.

Every enabled category filter must deterministically filter typed local customer data. Do not render service, fleet, VIP, or any other category as enabled unless its local data and resulting empty state are defined. Search covers the documented local fields while typing.

## Detail

Selected client shows contact data, statistics and tabs/sections for equipment, orders and sold units. Edit and a confirmed delete are local deterministic actions only. A delete confirmation must name the affected local record and return focus safely; it must not imply a remote deletion.

## Equipment

Add equipment dialog fields: Model, VIN, Year, Engine number, purchase date and notes. New equipment is attached to the selected client and visible immediately. Any enabled edit/remove capability must similarly update the selected local customer deterministically; otherwise it is locked with an accessible reason.

## Historical record boundary

The 2026-07-18 source QA record is evidence only. Do not present QA/test/environment wording as product-facing copy or a user-visible state label. A local fixture may support search and detail behavior, but must use the ordinary customer presentation defined above.

## Future source capture

Capture list, query, each exposed filter, create/edit/delete affordance, equipment section, and empty state at 1440px and 390px under dealer authentication. The allowed source policy permits only clearly QA-labelled source records; do not delete or otherwise mutate existing source records during certification.
