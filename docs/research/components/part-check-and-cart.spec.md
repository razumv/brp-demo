# Part Check and Cart Specification

## Quick part check

Header search/button opens a right panel. Query 9779150 displays COOLANT,EXT LIFE, current stock 240, dealer $13.09 and retail $18.33. Quantity begins at 1 and Add to cart updates the global store.

## Cart drawer

Width 420px desktop, full viewport mobile. Line has number, description, quantity controls, price and remove. Footer shows subtotal and Open cart. Empty state uses a cart icon and the source helper copy.

## Cart page

Order form contains:

- draft title;
- customer typeahead plus quick create;
- PO;
- notes;
- manual part add;
- Excel import/export visual controls;
- standard delivery or pickup;
- line table and totals;
- Check and submit.

Validation requires at least one line and a customer. Successful submit creates an id/code, clears cart and routes to confirmation.
