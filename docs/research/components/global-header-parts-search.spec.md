# Global dealer header parts search — source specification

Status: user-supplied source evidence on 2026-07-18, reinforced by the explicit interaction requirement that search starts while typing and does not require Enter. This specification covers the dealer header. The admin hand-off to BossWeb is documented separately below.

## Source evidence

- User capture: `docs/design-references/user-source-header-live-parts-search.png` (1768x574).
- Observed page underneath the overlay: dealer `Техніка`/units workflow; the search dropdown is a shell-level overlay and is not confined to the page table.
- Exact route and query threshold are not visible in the capture and remain unclaimed.

## Interaction contract

1. Focusing the desktop global header input and typing updates results on `onChange`.
2. Enter is not required. Local results must appear synchronously from in-memory fixtures and must not make an external request.
3. A non-empty matching query opens a dropdown directly below the pill input and above page content.
4. Clear `X` resets the input and closes the dropdown.
5. Escape/outside click closes the dropdown without clearing the query; refocus/retyping can reopen it.
6. Keyboard focus must remain usable across the input, filter tabs, quantity controls and add-to-cart buttons.
7. Adding a result updates only the existing local dealer cart. Admin role must retain cart isolation.

The source capture shows query `507`. A minimum character threshold or debounce duration is not proven. The local clone should therefore filter immediately for any non-empty trimmed input rather than invent a server delay.

## Desktop visual structure

`Header search pill -> absolute dropdown -> availability tabs -> vertically scrollable result rows`.

- Header pill is approximately 448x40 with a leading search icon and trailing clear X.
- Dropdown aligns to the input left edge, is approximately 600px wide, uses a white/light surface, 1px border and subtle shadow, and overlays the page at high z-index.
- Tab strip: `Усі (10)` selected in orange, `В наявності (1)`, `В дорозі (0)`, `Замовлено (0)`, `Під замовлення (9)`.
- Result rows use compact separators and contain a monospace bold number, green `АКТИВНО` badge, compact description, orange dealer price, muted struck-through comparison price, availability, `− / quantity / +` stepper and orange `+ Кошик` button.
- Seven rows are visible at once; the dropdown continues vertically for the source total of ten.

## Observed result evidence

| Part | Description | Dealer | Compare | Availability evidence |
|---|---|---:|---:|---|
| `507032473` | `PAD_BRAKE KIT` | $51.29 | $71.81 | `3 в наявності` |
| `507020200` | `RELEASE SPRING` | $8.04 | $11.26 | under-order family |
| `507021300` | `KEY` | $11.64 | $16.30 | under-order family |
| `507021500` | `LEVER` | $8.53 | $11.94 | under-order family |
| `507022600` | `WEAR INDICATOR` | $6.92 | $9.69 | under-order family |
| `507023600` | `TAB LOCK` | $6.92 | $9.69 | under-order family |
| `507029000` | description below the capture crop | $76.40 | not visible | under-order family |

Only these seven identities are visible in the supplied evidence. The tab count proves ten total, but the three off-screen identities are not guessed.

## Filter states

| Tab | Source count | Local behavior |
|---|---:|---|
| All | 10 | show all evidence-backed fixture rows |
| In stock | 1 | only `507032473` |
| In transit | 0 | exact empty result in dropdown |
| Ordered | 0 | exact empty result in dropdown |
| Under order | 9 | filter under-order rows; source total badge remains 9 |

The exact empty-state sentence is not visible. Use neutral local copy rather than claiming a source phrase.

## Responsive and theme

- The supplied evidence is desktop light only.
- Existing shell behavior below 720px replaces the pill with a search icon. The mobile icon should open an accessible full-width search surface using the same live results and filters.
- Dark mode maps the same hierarchy to existing shell tokens; no additional source-specific dark values are claimed.

## Admin hand-off

For admin role, the global query remains operationally read-only and routes to `/admin/bossweb-lookup?part=<encoded-query>`. The BossWeb page must read `?part=` on initial render and parameter changes, populate its field and immediately display the matching local result/no-result state. No external BossWeb request or Enter-only dependency is allowed.

## Safety and acceptance

- Dedicated typed search-result/status fixtures; no external calls.
- Dealer results appear during typing without Enter.
- Tabs, clear, Escape/outside close, quantity stepper and local cart add work.
- The result overlay never appears for admin as a dealer-cart surface.
- Admin `?part=` hand-off is honored by BossWeb.
- Preserve role isolation: no admin cart/reset controls and no dealer access to admin routes.
