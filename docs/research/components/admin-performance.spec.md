# Admin Performance — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. All four ranking modes, module/query search, no-result behavior, desktop/tablet/mobile and light/dark states were inspected independently. No refresh, mutation or direct API request was performed.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/performance`.
- Search and ranking state stay on the base URL and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-performance-desktop.png`
  - `docs/design-references/source-admin-performance-sort-menu.png`
  - `docs/design-references/source-admin-performance-search-accessories.png`
  - `docs/design-references/source-admin-performance-search-no-result.png`
  - `docs/design-references/source-admin-performance-tablet.png`
  - `docs/design-references/source-admin-performance-mobile.png`
  - `docs/design-references/source-admin-performance-dark.png`

## Page and DOM structure

`Admin shell -> eyebrow/title/helper -> search + ranking combobox + Refresh -> four KPI cards -> Query leaderboard header -> desktop/tablet table OR mobile query cards`.

- Eyebrow: `POSTGRES QUERY ANALYTICS`.
- H1: `DB Performance`.
- Helper: `Find slow, frequent, or module-specific database queries before they become production bottlenecks.`
- Search placeholder: `Search module or query`.
- Source header action: `Refresh`.
- Leaderboard badge: `pg_stat_statements`.
- Desktop/tablet columns: `MODULE`, `CALLS`, `MEAN`, `MAX`, `TOTAL`, `ROWS`, `QUERY`.
- The route has no tabs, pagination, row link, drawer, modal or detail page in the observed state. The four ranking options are independent data states and were each clicked separately.

The page renders 40 query records at a time. SQL text is visibly truncated with an ellipsis; there is no safe expansion control or tooltip in the observed DOM.

## Ranking states

The ranking control is not a cosmetic reorder. Each option selects a different top-40 source set, so KPI aggregates and module composition also change. Live `pg_stat_statements` call counts can increment between captures; the exact figures below are the evidence-locked observation, not a promise that the production counter is static.

| Ranking option | Calls | Total SQL time | Slowest average | Modules | Top-set module distribution |
|---|---:|---:|---:|---:|---|
| `Slowest average` | 126 | 1887.89s | 94.80s | 4 | Parts catalog 32, Accessories 5, Other 2, Settlements 1 |
| `Slowest peak` | 990 | 1888.88s | 94.80s | 4 | Parts catalog 33, Accessories 5, Other 1, Settlements 1 |
| `Highest total time` | 73,232 | 1890.24s | 94.80s | 7 | Parts catalog 30, Accessories 4, Other 2, Logistics 1, Notifications 1, People & access 1, Settlements 1 |
| `Most frequent` | 98,535 | 4.56s | 4.24ms | 9 | Other 13, People & access 13, Orders 6, Consignment 3, plus five single-row modules |

The observed first three records for the three time-oriented rankings are the same expensive Parts catalog records:

1. 3 calls; mean 94.80s; max 119.25s; total 284.39s; 3 rows.
2. 3 calls; mean 84.81s; max 95.13s; total 254.44s; 3 rows.
3. 3 calls; mean 79.67s; max 88.21s; total 239.00s; 75 rows.

Their order is still independently source-confirmed for each ranking, and records later in the top 40 differ. The first three `Most frequent` records are:

1. `Other`, 32,428 calls, 0.01ms mean, 2.35ms max, 293.3ms total.
2. `Other`, 20,764 calls, 0.02ms mean, 14.1ms max, 371.6ms total.
3. `People & access`, 9,982 calls, 0.05ms mean, 12.4ms max, 469.7ms total.

## Search states

Search filters the currently selected ranking set by module label or SQL text and does not change the URL.

| Input | Observed state |
|---|---|
| empty | complete selected 40-row set |
| `Accessories` | 5 matching rows in `Slowest average` |
| `catalog_nodes` | 2 matching Parts catalog SQL rows |
| `zzzz-no-result` | table header plus exact row copy `No query statistics yet.` |

The no-result copy is the same durable copy that can also represent an unavailable statistics set; no additional error illustration or reset action is rendered. Search is immediate client UI behavior in the observed page and requires no Enter.

## Representative record model

Every record contains:

- module label;
- call count;
- mean duration;
- maximum duration;
- total duration;
- returned/affected row count;
- sanitized/truncated SQL preview.

Observed module badges across all ranking modes include `Parts catalog`, `Accessories`, `Other`, `Settlements`, `Logistics`, `Notifications`, `People & access`, `Orders`, `Consignment` and `Invoices`. The clone should use typed, deterministic evidence fixtures and must not embed operational database identifiers, connection data or a live SQL endpoint.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Slowest average | 40 records, KPI 126 / 1887.89s / 94.80s / 4 | baseline ranking and exact evidence snapshot |
| Slowest peak | different top 40 and KPI 990 / 1888.88s / 94.80s / 4 | independent selectable fixture set |
| Highest total time | different top 40 and seven modules | independent selectable fixture set |
| Most frequent | frequency-oriented top 40 and KPI 98,535 / 4.56s / 4.24ms / 9 | independent selectable fixture set |
| Module search | `Accessories` -> five records | immediate local filtering |
| SQL search | `catalog_nodes` -> two records | query-text filtering |
| No result | header + `No query statistics yet.` | exact durable empty row |
| Refresh | enabled in source, boundary not evidenced | hard-disabled locally with no handler |
| Loading/error | no durable state safely forced | do not invent a synchronization result |

## Safety boundary

Safe and inspected: all ranking options, module/query/no-result searches, responsive layouts and theme.

Unsafe/not invoked:

- `Refresh`, because it can trigger a live statistics query and its synchronization/request boundary was not evidenced;
- direct database/statistics requests;
- any attempt to execute the displayed SQL.

Locally all ranking and search behavior must operate only over typed fixtures. `Refresh` is hard-disabled and no component may issue a network request, execute SQL, persist state or mutate operational data.

## Responsive and dark behavior

- Desktop 1440: persistent 255px admin sidebar; controls are one row; KPI are four columns; the leaderboard is a dense seven-column table. Full observed page height is 3774px.
- Tablet 768: compact app header and no persistent sidebar; controls wrap while the 1100px leaderboard remains a horizontally scrollable table. Full observed page height is 3795px.
- Mobile 390: compact app header; search, ranking and Refresh stack; KPI become one column; the table is replaced by 40 vertical cards, not a horizontal table. Each card shows module + call count, Mean/Max/Total, then truncated SQL; the `Rows` value is omitted in the mobile card. Full observed page height is 7393px.
- Dark capture preserves the orange/blue KPI accents, dense borders, module pills and SQL hierarchy on dark surfaces.

## Exact visual tokens

Measured light state:

- page background `rgb(246,248,250)`;
- primary text `rgb(31,35,40)`;
- shared border `rgb(208,215,222)`;
- H1 30px / 36px, weight 700;
- search background `rgb(234,238,242)`, 13px / 18.57px, 6px radius, padding `4px 12px 4px 36px`;
- table header text `rgb(101,109,118)`, 11px / 14.67px, weight 600, padding `8px 12px`;
- shared font: `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

Dark mode uses the shared admin-shell dark tokens already evidence-locked on adjacent routes: page `rgb(13,17,23)`, primary text `rgb(230,237,243)`, borders `rgb(48,54,61)` and dark input/card surfaces.

## Clone acceptance

- Dedicated route component and typed ranking/query fixture models.
- Every ranking state selects its own 40-record set and recalculates its evidence-locked KPI/module composition; it is not a label-only dropdown.
- Search filters both module and SQL immediately and reproduces module, query and no-result states.
- Desktop/tablet table and mobile card families match source behavior; light/dark are supported.
- Refresh is visibly disabled with no callback; there is no external request, database execution, persistence or operational mutation.
