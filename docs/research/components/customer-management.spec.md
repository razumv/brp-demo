# Customer Management Specification

## List and create

Page header contains title, search/filters and New client. Client dialog fields are name, phone, email, address and notes. Require name and either phone or email.

## Detail

Selected client shows contact data, statistics and tabs/sections for equipment, orders and sold units. Edit is local. Delete requires confirmation but only affects clone-local data.

## Equipment

Add equipment dialog fields: Model, VIN, Year, Engine number, purchase date and notes. New equipment is attached to the selected client and visible immediately.

## Source-shaped defaults

The seed record is CODEX QA Client 2026-07-18 with synthetic contacts, one linked order and no equipment. Search must find it by name/email/phone.
