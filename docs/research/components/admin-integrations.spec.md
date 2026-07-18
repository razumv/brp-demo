# Admin Integrations — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. The overview, both integration families, every tab in each family, all 1C export-history pages, representative safe row expansions, mapping filters/search states, desktop/tablet/mobile and light/dark states were inspected independently. No final save, token, mapping, resume, link, download, upload, confirmation, direct API mutation or manual synchronization control was invoked.

## Source routes and evidence

Observed routes:

- `https://brp-dev1.k8s.artemahr.tech/admin/integrations`
- `https://brp-dev1.k8s.artemahr.tech/admin/integrations/1c`
- `https://brp-dev1.k8s.artemahr.tech/admin/integrations/1c/unit-mapping`
- `https://brp-dev1.k8s.artemahr.tech/admin/settlements/mapping`
- `https://brp-dev1.k8s.artemahr.tech/admin/integrations/bossweb`

The integration tabs, overview search and mapping filters keep their base URL and add no query parameters in the observed source.

Evidence:

- overview:
  - `docs/design-references/source-admin-integrations-desktop.png`
  - `docs/design-references/source-admin-integrations-search-no-result.png`
  - `docs/design-references/source-admin-integrations-tablet.png`
  - `docs/design-references/source-admin-integrations-mobile.png`
  - `docs/design-references/source-admin-integrations-dark.png`
- 1C:
  - `docs/design-references/source-admin-integrations-1c-sync-desktop.png`
  - `docs/design-references/source-admin-integrations-1c-api-tokens.png`
  - `docs/design-references/source-admin-integrations-1c-history-page-1.png`
  - `docs/design-references/source-admin-integrations-1c-history-last-page.png`
  - `docs/design-references/source-admin-integrations-1c-api-docs.png`
  - `docs/design-references/source-admin-integrations-1c-mobile.png`
  - `docs/design-references/source-admin-integrations-1c-tablet.png`
  - `docs/design-references/source-admin-integrations-1c-dark.png`
- mappings:
  - `docs/design-references/source-admin-integrations-unit-mapping-pending.png`
  - `docs/design-references/source-admin-integrations-unit-mapping-expanded.png`
  - `docs/design-references/source-admin-integrations-dealer-mapping-desktop.png`
  - `docs/design-references/source-admin-integrations-dealer-mapping-no-result.png`
- BossWeb:
  - `docs/design-references/source-admin-integrations-bossweb-settings-syncing.png`
  - `docs/design-references/source-admin-integrations-bossweb-orders.png`
  - `docs/design-references/source-admin-integrations-bossweb-order-expanded.png`
  - `docs/design-references/source-admin-integrations-bossweb-price-lists.png`
  - `docs/design-references/source-admin-integrations-bossweb-matching.png`
  - `docs/design-references/source-admin-integrations-bossweb-mobile.png`
  - `docs/design-references/source-admin-integrations-bossweb-tablet.png`
  - `docs/design-references/source-admin-integrations-bossweb-dark.png`

## Integration overview

DOM hierarchy:

`Admin shell -> H1/helper -> immediate search -> two integration cards OR no-result panel`.

- H1: `Інтеграції`.
- Helper: `Керування підключеннями до зовнішніх систем`.
- Search placeholder: `Пошук інтеграцій, 1С, BossWeb...`.
- Search is immediate and does not require Enter.

Observed cards:

| Integration | Badge/state | Helper and telemetry | Safe navigation |
|---|---|---|---|
| `Інтеграція 1С` | `Збій OData` | order/stock synchronization via webhook; OData polling; roughly 5000ms response; poller paused; timeout copy | `Налаштувати` opens `/admin/integrations/1c` |
| `BossWeb` | `49 замовлень` | BossWeb order and catalog integration summary | `Налаштувати` opens `/admin/integrations/bossweb` |

The 1C telemetry is live and varied slightly between reads (`5000–5003 ms`). An earlier transient source render reported FTP/CSV, unknown response and stopped state before the stable OData timeout state loaded. The clone must use a deterministic source-evidence snapshot and must not suggest live connectivity.

Overview search states:

| Input | Result |
|---|---|
| empty | both cards |
| `1С` | 1C only |
| `BossWeb` | BossWeb only |
| unmatched value | exact title `Нічого не знайдено` and the original search placeholder as helper |

## 1C detail

DOM hierarchy:

`Admin shell -> H1/helper + New token -> three KPI cards -> four-tab list -> selected tab panel`.

- H1: `Інтеграції`.
- Helper: `Керування токенами вебхуків та налаштування експорту для синхронізації з 1С`.
- Header action: `Новий токен`.
- KPI: `Очікує експорту` 262, `Усього експортовано` 0, `Усього позицій` 262.

Each of the four tabs was clicked and inspected as an independent workflow.

### Tab: `Синхронізація складу`

Structure:

`mode header -> OData health panel -> background polling panel -> two mode cards -> explanatory notice -> three navigation cards`.

- Health: `1С недоступна`, response around 5001ms, HTTP `невідомо`, timeout error `The operation was aborted due to timeout` and a checked time.
- Background OData requests: status `на паузі`; `Відновити` is an operational action.
- Modes:
  - `FTP / CSV`: legacy scheduled/manual SKU CSV mode;
  - `OData Polling`: active mode, but poller stopped.
- Source warns that changing mode takes effect immediately. Therefore both mode cards are operational controls, not harmless display tabs.
- Safe GET navigation cards:
  - `Одиниця -> Номенклатура 1С` -> unit mapping;
  - `Дилер -> Контрагент 1С` -> dealer mapping;
  - settlements report.

### Tab: `API-токени`

One token row was visible with:

- a human-readable name;
- a deliberately masked token value;
- an active switch;
- last-use and creation dates;
- copy, regenerate and delete controls.

The token suffix is intentionally excluded from screenshots/spec fixtures and must not be reproduced in the clone. Copy, active-state toggle, regenerate, delete and `Новий токен` are all unsafe. The local clone may render a generic masked placeholder only; every control is hard-disabled with no handler.

### Tab: `Історія експорту`

- 262 positions.
- 20 rows per page.
- 14 pages total: pages 1–13 contain 20 rows; page 14 contains 2 rows.
- Columns: order, part number, quantity, dealer, status, created date.
- Every observed row had status `Очікує`.
- Both Back and Next pagination are present.

All 14 pages were clicked independently. This established that pagination changes the actual record set and is not a cosmetic counter. The clone should provide deterministic representative page fixtures, preserve the 262/20/14 pagination contract, and make both directions work without a network request.

### Tab: `Документація API`

Read-only documentation includes:

- base webhook API URL presentation;
- `Authorization: Bearer <token>` guidance;
- explicit note that query-string token authentication is not supported;
- Phase 1 GET orders endpoint and JSON example;
- Phase 2 POST confirmation endpoint and JSON example;
- a warning that confirmation changes state.

The clone may present endpoint shapes and placeholder snippets, but must never include a real host secret, real token or executable request button. The POST example is documentation only and must never be executed.

## Unit-to-1C mapping

Route: `/admin/integrations/1c/unit-mapping`.

Structure:

`H1/helper + auto-link action -> four KPI cards -> three filters -> mapping table -> optional inline unit expansion`.

- KPI: 600 total units, 53 codes, 324 linked, 276 pending, 54% linked.
- Filters are independent data states:
  - `Усі` 53 codes;
  - `Пов'язані` 17;
  - `Очікують` 36.
- Columns: expansion affordance, code, category, family, units, linked, pending, status.
- Representative pending row: code `4WTJ`, category ATV, family Outlander, 90 units / 32 linked / 58 pending.
- Expanding the representative row changes the DOM row count from 53 to 143 and reveals 90 VIN-level records inline.
- Each unit record exposes a `Зв'язати` action.

The filter pills and row disclosure are safe local UI state. `Автоматично за VIN` and every `Зв'язати` action are operational and hard-disabled locally. The clone needs representative typed unit records, not 90 copies of one generic row.

## Dealer-to-1C mapping

Route: `/admin/settlements/mapping`.

- H1 describes dealer-to-counterparty mapping.
- KPI: 20 dealers, 19 mapped, 72 links.
- Immediate dealer search.
- `Logos` produces one dealer with no links.
- Unmatched search renders exact copy `Немає збігів`.
- 20 dealer rows were visible; columns are Dealer, links and actions.
- Edit, delete and add-link controls are operational and unsafe.

The local fixture must use synthetic/redacted company identifiers and tax/registration values. Search may filter typed fixtures, but add/edit/delete controls are hard-disabled.

## BossWeb detail

DOM hierarchy:

`Admin shell -> H1/helper + status summary -> four-tab list -> selected tab panel`.

The observed header initially showed an active cookie/session age, last sync about eight hours earlier and 232 orders. After the source-side incident described in the safety section, the last-sync timestamp changed to just now while the order count remained 232.

All four tabs were clicked and inspected independently.

### Tab: settings

- Session/authentication explanation and active-session status.
- Automatic-period number input initially 30, with 30/90/180 presets.
- A date input initially `2026-07-18`, with 30d/90d/180d/360d/720d presets.
- Changing 30/90/180 updated only an unsaved field and exposed Save; Save was never clicked.
- Reload discarded the unsaved period and restored 30/date baseline.

Locally these controls are evidence previews only. Inputs and presets may show values but must be disabled because the source proved that a visually similar date preset can start synchronization immediately. Save is hard-disabled.

### Tab: orders (232)

- Source rendered 200 rows in one long table and exposed no search or pagination.
- Status distribution: 25 `Not Delivered`, 175 `Totally Delivered`.
- Columns: disclosure, BossWeb order, date, customer order, type, status, linked sales order and collected age.
- Safe expansion of the first row revealed 13 positions.
- Expanded columns: position, part, description, ordered, backordered, shipped and ETA.
- Link-to-sales-order controls are operational and unsafe.

The local clone should keep representative orders of both statuses and a real 13-position expansion for at least one order. It must not reuse one position for every order. Expansion changes rendered UI only; linking is hard-disabled.

### Tab: price lists

Five source rows:

| Family | BossWeb document date | File size |
|---|---|---:|
| ATV | 11.07.2026 | 2.8 MB |
| Roadster | 11.07.2026 | 1.5 MB |
| Side-by-Side | 11.07.2026 | 2.3 MB |
| Snowmobile | 11.07.2026 | 4.3 MB |
| Watercraft | 11.07.2026 | 2.8 MB |

The source also showed last automatic sync about one hour ago, last saved/imported about six days ago, 168,877 new records, 142,422 prices and a 304-second run. Sync and download controls are unsafe and hard-disabled locally.

### Tab: matching (0)

- Badge/count: 0 matched.
- 232 unmatched rows.
- Status distribution: 25 `Not Delivered`, 207 `Totally Delivered`.
- Columns: BossWeb order, customer order, status and actions.
- Re-match and link-to-sales-order controls are operational.

The tab has a different row set and status distribution from Orders and must have a separate typed state. Re-match/link controls are hard-disabled.

## State matrix

| Route/state | Source behavior | Local requirement |
|---|---|---|
| overview empty search | two cards | exact deterministic summary |
| overview `1С` | one card | immediate local filter |
| overview `BossWeb` | one card | immediate local filter |
| overview no result | `Нічого не знайдено` | exact empty state |
| 1C sync tab | health, poller, modes, mapping navigation | exact read-only snapshot; operational controls disabled |
| 1C tokens tab | one sensitive token row | generic masked value; all controls disabled |
| 1C history tab | 262 records / 14 pages | functional local pagination |
| 1C docs tab | GET and POST documentation | inert code samples only |
| unit mapping all/linked/pending | 53/17/36 code sets | independent filters |
| unit mapping expansion | VIN-level inline rows | functional UI-only disclosure |
| dealer mapping search/no result | one Logos row / `Немає збігів` | immediate typed filtering |
| BossWeb settings | session and period fields | disabled preview due unsafe immediate sync boundary |
| BossWeb orders | 200 rendered / 232 total, expandable rows | representative typed orders and positions |
| BossWeb price lists | five documents + import telemetry | exact rows; sync/download disabled |
| BossWeb matching | independent 232-row unmatched set | separate typed fixture; operational controls disabled |
| loading/error | live 1C timeout visible | deterministic observed error; do not simulate requests |

## Safety boundary and source incident

Safe and inspected:

- GET route navigation;
- all overview and mapping searches;
- all 1C and BossWeb tabs;
- all 14 export-history pagination states;
- unit/order row expansions;
- responsive layouts and theme.

Unsafe and not invoked:

- new/copy/regenerate/delete/toggle token;
- resume OData polling or change sync mode;
- save period/settings;
- auto-link, link, edit or delete mappings;
- link/re-match BossWeb orders;
- sync/download price lists;
- any direct POST/PUT/PATCH/DELETE or external API request.

Source-side incident: the BossWeb `30d` date-preset control appeared to be a form-only preset but started synchronization immediately without a confirmation dialog. It was not a visible `Sync` or `Save` button. Before the click, the header showed last sync about eight hours earlier; afterward it showed just now. The total remained 232, the same 200 order rows and first/last records remained visible, and status distribution remained 25 Not Delivered / 175 Totally Delivered. Matching remained 0 with 232 unmatched. Collected-age labels changed from about eight hours to a few minutes. No final CTA was clicked because none was presented. The action was stopped at observation; no further date preset or sync control was touched.

This incident changes the local boundary: every BossWeb setting input/preset, Save, synchronization, download, match and link control is hard-disabled with no callback. No clone component may contain a reducer or handler that changes integration, order or operational state.

## Responsive and dark behavior

- Desktop 1440: persistent 255px sidebar; integration cards and KPI cards are horizontal; 1C/BossWeb tab lists fit one row; dense tables use available main width.
- Tablet 768: compact header with no persistent sidebar; KPI remain three columns where space allows; tab lists remain horizontal; wide tables require horizontal overflow.
- Mobile 390: compact header; cards and KPI stack; 1C tab list wraps to a two-by-two layout; panels become vertical. The sync page becomes a long card stack. BossWeb's tab strip is wider than the viewport and scrolls horizontally instead of silently dropping tabs.
- Dark mode preserves orange active tabs/actions, red timeout health, amber polling warning and semantic green/blue pills on dark surfaces.

## Exact visual tokens

Measured light state:

- page background `rgb(246,248,250)`;
- primary text `rgb(31,35,40)`;
- shared border `rgb(208,215,222)`;
- card surface white; 8px radius; 24px card padding on overview;
- H1 30px / 36px, weight 700;
- overview H3 17px / 26.44px, weight 600;
- shared input background `rgb(234,238,242)`, 6px radius;
- shared font `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

Dark mode uses the shared shell evidence tokens: page `rgb(13,17,23)`, text `rgb(230,237,243)`, borders `rgb(48,54,61)` and dark card/input surfaces.

## Clone acceptance

- Dedicated typed integration models; overview, 1C and BossWeb are not one generic diagnostics card.
- All tabs are interactive and select genuinely different, evidence-backed content.
- Overview/mapping search, 1C history pagination and representative unit/order expansions work locally.
- Routes `/admin/integrations`, `/admin/integrations/1c`, `/admin/integrations/1c/unit-mapping`, `/admin/settlements/mapping` and `/admin/integrations/bossweb` resolve locally.
- No real token, secret, account identifier or operational endpoint credential is embedded.
- Every final/operational control is hard-disabled and has no mutation callback.
- No fetch/request client, upload/download, storage, synchronization, cache invalidation or status-changing reducer exists.
- Desktop/tablet/mobile and light/dark UI reproduce the observed component families.
