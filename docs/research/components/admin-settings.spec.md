# Admin Settings — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. Baseline, each searchable section, no-result, control-disabled states, desktop/tablet/mobile and light/dark layouts were inspected. The source route has no tabs; the worker selector and every refresh/reset/clear action were treated as operational and were not invoked.

## Source URL and evidence

- Route: `https://brp-dev1.k8s.artemahr.tech/admin/settings`.
- Search state stays on the base URL and adds no query parameters.
- Evidence:
  - `docs/design-references/source-admin-settings-desktop.png`
  - `docs/design-references/source-admin-settings-search-no-result.png`
  - `docs/design-references/source-admin-settings-tablet.png`
  - `docs/design-references/source-admin-settings-mobile.png`
  - `docs/design-references/source-admin-settings-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper + Refresh -> immediate search -> worker settings panel -> queue management panel -> database panel OR no-result panel`.

- H1: `Налаштування`.
- Helper: `Конфігурація системних налаштувань та керування фоновими завданнями`.
- Header action: `Оновити`.
- Search placeholder: `Пошук за налаштуваннями, чергою, воркерами, базою...`.
- The route has no tab list, sort, pagination, row navigation, drawer, modal or confirmation preview in the observed baseline.

Search filters whole settings panels immediately as the user types. It does not require Enter and it does not change the URL.

## Worker settings

Panel structure:

`orange icon + Налаштування воркерів -> Паралельність воркерів label -> explanatory copy -> native combobox`.

Exact explanatory copy:

`Кількість паралельних завдань, які може обробляти воркер. Більші значення пришвидшують обробку, але споживають більше ресурсів.`

The observed selected value is `2 воркерів`. Available options:

- `1 воркер`;
- `2 воркерів`;
- `3 воркерів`;
- `4 воркерів`;
- `5 воркерів`;
- `10 воркерів`;
- `20 воркерів`;
- `50 воркерів`.

The source selector is enabled and has no separate Save button, so changing it may take effect immediately. It was not changed. The local selector must show the observed value/options but be hard-disabled with no change handler.

## Queue management

Panel structure:

`blue icon + Керування чергою -> four KPI cards -> four queue actions`.

Observed queue KPI:

| Metric | Value | Tone |
|---|---:|---|
| `В очікуванні` | 0 | neutral |
| `Активних` | 0 | blue |
| `Виконано` | 0 | green |
| `З помилкою` | 0 | red |

Actions:

- `Очистити виконані (0)` — source-disabled because the count is zero;
- `Очистити з помилкою (0)` — source-disabled because the count is zero;
- `Скинути лічильники` — source-enabled but explicitly destructive/operational;
- `Очистити всі в очікуванні` — source-disabled because the count is zero.

All four controls are hard-disabled locally, including `Скинути лічильники`. There must be no queue reducer, mutation callback, confirmation that can be submitted, request client or optimistic state change.

## Database

Panel structure:

`blue database icon + База даних -> three key/value rows`.

Observed values:

- `Підключення` -> green `Підключено` badge;
- `Тип` -> `PostgreSQL 16`;
- `База даних` -> `brp_catalog`.

There is no connect/disconnect, edit, copy, query or migration control in the observed panel. The database metadata is display-only locally.

## Search states

Every distinct panel family was isolated independently through the search input.

| Input | Source result |
|---|---|
| empty | worker + queue + database panels |
| `воркер` | worker panel only |
| `черг` | queue panel only |
| `база` | database panel only |
| `zzzz-no-result` | exact copy `Нічого не знайдено` in a dashed empty panel |

Search is case-insensitive immediate client UI state in the observed page. Clearing by reloading the same GET route restored all three panels and did not change any source value.

## State matrix

| State | Source behavior | Local requirement |
|---|---|---|
| baseline | three panels | exact deterministic snapshot |
| worker search | one worker panel | immediate local filtering |
| queue search | one queue panel | immediate local filtering |
| database search | one database panel | immediate local filtering |
| no result | `Нічого не знайдено` | exact empty state |
| worker selector | selected 2; eight enabled options | visible but hard-disabled locally |
| Refresh | enabled; boundary not evidenced | hard-disabled locally |
| reset counters | enabled destructive action | hard-disabled locally |
| zero-count clear actions | source-disabled | disabled locally |
| loading/error | no durable state safely forced | do not invent request progress or a mutation result |

## Safety boundary

Safe and inspected:

- GET route navigation/reload;
- immediate search for every panel family and no-result;
- DOM inventory and selected-option inspection without changing it;
- responsive layouts and theme.

Unsafe and not invoked:

- `Оновити`, because its request boundary was not evidenced;
- changing worker parallelism, because there is no final Save step and it may persist immediately;
- resetting counters;
- clearing completed, failed or pending queue items;
- any direct database, queue or worker request.

The local page may change only its search/render state. All operational controls must be actual disabled elements without event handlers. No fetch/request client, storage, queue worker command, database command, counter reducer or operational state callback is permitted.

## Responsive and dark behavior

- Desktop 1440: persistent 255px sidebar; main content starts around x=289 and is roughly 1023px wide. H1/action share a row; the search is compact (about 174px); worker/database panels span the main width; queue KPI form four columns and actions share one row.
- Tablet 768: compact header and no sidebar; H1/action remain on one row; search expands to available width; queue KPI remain four columns; action buttons wrap to two rows.
- Mobile 390: compact header; H1/helper and Refresh stack; search is full width; worker select stays compact; queue KPI become a two-by-two grid; actions stack/wrap; database key/value rows preserve right-aligned values. The full observed page is about 1236px tall.
- Dark mode preserves the orange worker icon, blue database/queue accents, semantic green/red counters and card hierarchy on dark surfaces.

## Exact visual tokens

Measured/DOM-confirmed light state:

- page background `rgb(246,248,250)`;
- primary heading `rgb(31,35,40)`;
- shared border `rgb(208,215,222)`;
- H1 class resolves to 24px on compact view and 30px desktop, weight 700;
- H2 resolves to 14px compact / 16px desktop, weight 600;
- combobox uses `12px 16px`-equivalent control padding, secondary background, 1px border and 8px radius;
- search uses the shared secondary input surface and 6–8px radius;
- cards use white surfaces, 1px border and subtle one-pixel shadow;
- shared font `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

Dark mode uses the shared shell evidence tokens: page `rgb(13,17,23)`, text `rgb(230,237,243)`, borders `rgb(48,54,61)` and dark card/input surfaces.

## Clone acceptance

- Dedicated Settings component and typed section/KPI/worker-option data.
- Exact worker, queue and database content; selected worker value remains 2.
- Immediate search filters all three panel families and reproduces the exact no-result copy.
- Refresh, worker selector, every clear/reset action are hard-disabled with no callback.
- No queue/database/worker/API mutation, external request, persistence or status reducer exists.
- Desktop/tablet/mobile and light/dark layouts match the observed families.
