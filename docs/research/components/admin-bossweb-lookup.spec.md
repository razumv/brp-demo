# Admin BossWeb Lookup — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. Initial, disabled, query-parameter handoff, loading, populated, responsive and dark states were inspected. Lookup was treated as a read-only search. The result refresh icon and every integration/synchronization action were not invoked.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/bossweb-lookup`.
- Admin header handoff route: `/admin/bossweb-lookup?part=<encoded-query>`.
- Evidence:
  - `docs/design-references/source-admin-bossweb-query-param-ignored.png`
  - `docs/design-references/source-admin-bossweb-loading.png`
  - `docs/design-references/source-admin-bossweb-found-desktop.png`
  - `docs/design-references/source-admin-bossweb-tablet.png`
  - `docs/design-references/source-admin-bossweb-mobile.png`
  - `docs/design-references/source-admin-bossweb-dark.png`

## Page and DOM structure

`Admin shell -> BossWeb eyebrow -> H1/helper -> part-number input + Search -> optional loading copy -> two-column result grid (BossWeb availability + local catalog)`.

- Eyebrow: `BOSSWEB`.
- H1: `Пошук запчастин`.
- Helper: `Перевіряйте наявність BRP, заміни, ETA і локальний склад перед створенням замовлення.`
- Input placeholder: `Введіть номер запчастини (напр. 715000005)`.
- Submit: `Пошук`.
- The route has no tabs, filters, sort, pagination, table, drawer or modal.

The empty input disables Search. Entering a non-empty known part enables it. During a lookup Search becomes disabled and the page renders `Перевірка BossWeb...` twice in the observed DOM.

## Admin header handoff and required local correction

The source admin header accepts a query and Enter navigates to `/admin/bossweb-lookup?part=507032417`. Directly opening `?part=9779150` likewise preserves that URL.

However, the observed source page does not consume the parameter: its part input remains empty, Search remains disabled and no result starts. `source-admin-bossweb-query-param-ignored.png` is the evidence for that source defect.

The user explicitly requires the clone to complete the intended handoff. Therefore the local behavior intentionally improves this defect:

1. read `?part=` on first render and subsequent URL changes;
2. normalize and populate the form field;
3. immediately resolve a matching typed local fixture or local no-result state;
4. require no second Enter/click;
5. perform no external BossWeb request and never persist the query.

This is a deliberate product requirement, not an assumption about unseen source behavior.

## Populated evidence state

Read-only lookup `9779150` resolves to two sibling cards.

### BossWeb availability

- Header: `Наявність BossWeb`.
- Currency pill: `BossWeb USD`.
- Cache age: `кеш 14h ago`.
- Unlabelled refresh-icon button in the card header; treated as unsafe because it may refresh an external/cache source.
- Status: `Бекордер`.
- Family: `ATV`.
- Part: `9779150`.
- Description: `COOLANT,EXT LIFE`.
- Warning: `Contact PAA Support Quantity : 12`.
- In stock: 0.
- Backorder: 12.
- Net: 4.33.

### Local catalog

- Header: `Локальний каталог`.
- Currency pill: `Локально EUR -> USD`.
- In stock: 240.
- Status: 1.
- Dealer price: `$13.09`.
- Retail price: `$18.33`.
- Distributor price: `€4.33`.

The lookup produced no add-to-cart, create-order, edit or status-change control in the admin route.

## Loading, timeout and no-result coverage

- `9779150` resolved to the populated result after approximately six seconds in the observed run.
- `507032417` remained in the exact loading state for more than 47 seconds. The request was abandoned by safe GET navigation; no retry, refresh or mutation followed.
- A durable admin no-result/error result could not be safely established without repeating a hanging external lookup. It remains explicitly `blocked/unobserved`; clone copy must not pretend it was source-confirmed.
- Locally, the fixture layer may render a restrained no-result state for an unknown `?part=` because the user requires immediate parameter handling, but it must be labelled in implementation/documentation as local deterministic behavior and must not suggest a live BossWeb response.

## State table

| State | Source result | Local requirement |
|---|---|---|
| empty | input blank, Search disabled, no cards | exact initial form |
| `?part=9779150` | URL retained but input ignored | intentionally fix: populate and resolve immediately |
| known manual lookup | populated two-card comparison | exact typed fixture for `9779150` |
| loading | Search disabled; `Перевірка BossWeb...` x2 | optional local transient preview only; no request |
| long-running lookup | durable loading beyond 47s | never emulate a network hang |
| unknown/no-result | not safely source-confirmed | deterministic local empty state, explicitly not source evidence |
| result refresh icon | enabled, unnamed, boundary ambiguous | hard-disabled locally with accessible safety label |

## Safety boundary

Safe and inspected: base/query-parameter GET navigation, admin-header Enter handoff, empty/disabled form, one known read-only lookup, one loading observation, responsive layouts and theme.

Unsafe/not invoked:

- result-card refresh icon, because it may invalidate/refetch cache data;
- any integration sync or direct BossWeb/API request;
- repeatedly submitting unknown values after the first long-running lookup;
- any create-order/cart/operational action.

The clone must resolve only typed in-memory fixtures. Search, URL handoff and no-result UI may change rendered local UI state only. No `fetch`, request client, storage, cache invalidation, order reducer or operational callback is allowed.

## Responsive and dark behavior

- Desktop 1440: persistent 255px admin sidebar; search field and orange Search button share a row; the two result cards are equal columns.
- Tablet 768: compact shell; the result hierarchy is preserved in the available width.
- Mobile 390: compact shell; input and full-width Search stack; BossWeb and Local catalog cards stack vertically. The observed page fits the 844px viewport.
- Dark mode keeps the orange submit, blue/amber currency/status pills, warning band and two-card hierarchy on dark surfaces.

## Exact visual tokens

Measured light state:

- page background `rgb(246,248,250)`;
- primary text `rgb(31,35,40)`;
- shared border `rgb(208,215,222)`;
- H1 30px / 36px, weight 700;
- input: mono stack, 13px / 18.57px, background `rgb(234,238,242)`, 6px radius, padding `4px 12px`;
- Search: 13px / 18.57px, weight 500, white on `rgb(234,88,12)`, 6px radius, padding `0 16px`;
- cards: white, 6px radius, `rgb(208,215,222)` border;
- shared text font: `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

## Clone acceptance

- Dedicated route component and typed BossWeb/local-catalog fixture model.
- Exact initial, known-result and responsive/dark UI.
- `?part=` is read and resolved immediately, including when coming from global admin search.
- `9779150` reproduces all observed quantities, prices, labels and warning copy.
- Unknown values resolve locally without a request or endless loading and without claiming an evidenced source result.
- Refresh is hard-disabled with an accessible explanation; no external request, cache invalidation, order/cart mutation or persistence exists.
