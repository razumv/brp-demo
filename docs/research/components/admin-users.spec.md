# Admin Users — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. Every tab was opened independently. No user was approved, deactivated, deleted, reassigned, edited or saved; no permission override was changed. Source account identifiers and contact data are redacted from evidence and intentionally excluded from clone fixtures.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/users`.
- Tab, search and edit-preview state keep the base URL and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-users-desktop.png`
  - `docs/design-references/source-admin-users-pending.png`
  - `docs/design-references/source-admin-users-deactivated.png`
  - `docs/design-references/source-admin-users-search-result.png`
  - `docs/design-references/source-admin-users-no-result.png`
  - `docs/design-references/source-admin-users-edit-preview.png`
  - `docs/design-references/source-admin-users-role-menu.png`
  - `docs/design-references/source-admin-users-company-menu.png`
  - `docs/design-references/source-admin-users-dealer-role-menu.png`
  - `docs/design-references/source-admin-users-manager-edit-preview.png`
  - `docs/design-references/source-admin-users-admin-edit-preview.png`
  - `docs/design-references/source-admin-users-tablet.png`
  - `docs/design-references/source-admin-users-mobile.png`
  - `docs/design-references/source-admin-users-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper -> three KPI cards -> debounced search -> three-tab list -> role-specific edit dialog`.

- H1: `Модерація користувачів`.
- Helper: `Керування обліковими записами, затвердження та дозволи`.
- KPI are global and remain unchanged across tab, search and preview states:

| KPI | Value |
|---|---:|
| `ОЧІКУЮТЬ ЗАТВЕРДЖЕННЯ` | 0 |
| `АКТИВНІ КОРИСТУВАЧІ` | 102 |
| `ВСЬОГО КОРИСТУВАЧІВ` | 102 |

- Search placeholder: `Пошук за ім'ям, email, логіном або компанією...`.
- Tabs: `Очікування (0)`, `Активні (102)`, `Деактивовані`.
- The active tab is a dense div grid rather than a semantic HTML table. Columns are `КОРИСТУВАЧ`, `КОНТАКТ`, `КОМПАНІЯ`, `РОЛЬ`, `СТАТУС`, `РЕЄСТРАЦІЯ`, `ДІЇ`.
- Its row viewport is `max-height: 600px; overflow-y: auto`; the complete source result is 102 users while only the current virtual/scroll viewport is rendered at once.
- Footer in the baseline active tab: `Показано 102 користувачів`.
- Every active row exposes `Деакт.`, `Редагувати` and an unlabeled trash icon. Deactivate and delete may execute operational mutations and were never clicked.

## Every-tab state inventory

All three tabs were clicked and inspected separately.

| Tab | Source state | Distinct behavior |
|---|---|---|
| `Очікування (0)` | empty | `Користувачів не знайдено` + `Немає користувачів у цій категорії`; no row actions |
| `Активні (102)` | populated | seven-column scroll grid, global search, row actions, role-specific edit previews, footer count |
| `Деактивовані` | empty | the same empty title/helper as Pending; no row actions |

No hidden approval CTA exists in the current empty Pending state, so no approval preview is claimed. The two empty tabs are separate source states even though their durable copy is identical.

## Populated row variants

The rendered active viewport contained representative `Дилер`, `Менеджер` and `Адмін` rows, all with source status `Активний`. Observed companies included dealer companies and the Logos administrative company; registration copy included one, two and five months ago variants.

Only role, company class, status and age are required for clone fidelity. Source names, handles, emails and phone numbers are not product behavior and must be replaced by synthetic, non-login-capable display data locally. No aggregate role distribution beyond the visible representative variants is inferred.

## Search behavior

Search is debounced and filters the selected tab without changing the URL or global KPI.

- A representative dealer-company query returns five active rows and footer `Показано 5 користувачів`.
- `NO_SUCH_USER_9000` shows `Користувачів не знайдено` with no rows or footer.
- The clear control has accessible label `Очистити`; clearing restores all 102 active results.
- Source debounce settled after approximately one second; the local clone may use a shorter deterministic debounce while preserving the visible live-filter behavior.

## Edit preview variants

`Редагувати` opens a modal titled `Редагувати користувача` with role-dependent content. Every inspected modal was closed through Close/Cancel without selecting a new value or pressing the final `Зберегти зміни` action. KPI remained 0 / 102 / 102 after every preview.

### Dealer

- Combobox `Роль`: current value `Дилер`; options `Дилер`, `Менеджер`, `Адмін`.
- Combobox `Компанія`: current dealer company; options `Без компанії` plus the 20 companies already evidenced on `/admin/companies`.
- Combobox `Роль у дилерській компанії`: current `Головний дилер`; options `Головний дилер`, `Учасник`.
- Helper: `Тільки адміністратори можуть змінювати ролі`.
- Source also renders the English policy helper `Only the main dealer can manage Team & Access for their company.`
- Actions: `Скасувати`, unsafe `Зберегти зміни`, Close.

### Manager

- Comboboxes `Роль: Менеджер` and `Компанія: Logos`.
- Section `Налаштування доступу`.
- Unsafe control `Скинути до ролі за замовчуванням` was visible but never clicked because it may mutate overrides immediately.
- Permission matrix columns: `Сутність`, `Читання`, `Створення`, `Оновлення`, `Видалення`, `Запит`, `Схвалення`, `Відвантаження`.
- Legend: `За замовчуванням`, `Override ON`, `Override OFF`.

Observed matrix:

| Entity | Read | Create | Update | Delete | Request | Approve | Ship |
|---|---|---|---|---|---|---|---|
| Orders | on | on | on | off | N/A | N/A | N/A |
| Pipeline | on | on | on | off | N/A | N/A | N/A |
| Consignment | on | N/A | N/A | N/A | off | on | on |
| Returns | on | on | N/A | N/A | N/A | on | N/A |
| Air freight | on | on | on | off | N/A | N/A | N/A |
| Receipt | on | on | on | off | N/A | N/A | N/A |
| Ocean freight | on | on | on | off | N/A | N/A | N/A |
| Companies | on | on | on | off | N/A | N/A | N/A |
| Users | on | off | off | off | N/A | N/A | N/A |
| Invoices | off | off | off | off | N/A | N/A | N/A |
| Settlements | on | N/A | N/A | N/A | N/A | N/A | N/A |
| Catalog | on | N/A | on | N/A | N/A | N/A | N/A |
| Schedule | on | on | on | off | N/A | N/A | N/A |
| Tasks | off | off | off | off | N/A | N/A | N/A |
| Reports | on | off | N/A | N/A | N/A | N/A | N/A |

All permission indicators are read-only in the clone. The source controls were not clicked.

### Admin

- Comboboxes `Роль: Адмін` and `Компанія: Logos`.
- No dealer-role selector and no permission matrix are rendered.
- Actions: `Скасувати`, unsafe `Зберегти зміни`, Close.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Pending tab | 0 rows, category-empty copy | separately selectable tab and exact empty copy |
| Active tab | 102 total, scroll grid | representative synthetic rows and exact global/footer counts |
| Deactivated tab | 0 rows, category-empty copy | separately selectable tab and exact empty copy |
| Search hit | five representative company rows | filter active rows and update only footer result count |
| Search miss | `Користувачів не знайдено` | stable no-result state |
| Dealer edit | three comboboxes + policy helper | menus may open; final save disabled |
| Manager edit | two comboboxes + permission matrix | exact representative matrix; all toggles/reset disabled |
| Admin edit | two comboboxes, no matrix | final save disabled |
| Loading/error | no durable source copy forced | do not invent an operational error path |

## Safety boundary

Safe and inspected: route/tab navigation, search hit/miss/clear, active-row edit dialog, read-only combobox option menus, permission matrix inventory, responsive layouts and theme.

Unsafe and never invoked:

- `Деакт.` and trash actions on every row;
- approving a pending account if one later appears;
- changing role, company or dealer-company role;
- any permission switch or `Скинути до ролі за замовчуванням`;
- final `Зберегти зміни`;
- direct mutation request or user-state reducer.

Locally all operational actions must be hard-disabled and have no mutation callback. Safe edit previews may open and close; no local action may change role, status, company or permission state.

## Responsive, dark and exact tokens

- Desktop 1440: persistent 255px sidebar, three KPI cards in one row, dense seven-column user grid with an internal 600px scroll viewport.
- Tablet 768: compact top header replaces the sidebar; KPI and table retain the same hierarchy in the narrower content region.
- Mobile 390: compact top header, H1 ellipsizes, KPI stack vertically, search spans the content width, tabs remain one horizontal row, and the dense grid preserves its desktop column model through horizontal clipping/scroll rather than transforming into cards.
- Dark mode keeps role/status colors and dense borders on the `rgb(13,17,23)` page surface.
- Measured light tokens: body `rgb(246,248,250)`, primary text `rgb(31,35,40)`, border `rgb(208,215,222)`; shared font `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`; H1 30px/36px weight 700; active tab 13px/18.57px weight 500 with bottom border `rgb(234,88,12)` and padding 8px 16px; search text 11px/14.67px; list `max-height: 600px; overflow-y: auto`.
- Measured dark tokens: body `rgb(13,17,23)`, primary text `rgb(230,237,243)`, border `rgb(48,54,61)`.

## Clone acceptance

- Dedicated route component and typed synthetic user, role, company, tab and permission-matrix models.
- All three tabs are independently selectable and preserve their distinct populated/empty behavior.
- Search hit, clear and no-result work locally without external requests.
- Dealer, manager and admin edit previews render their source-specific field sets; option menus may open but selecting/saving is non-operational.
- Deactivate, approve, delete, reset, permission, role/company and save actions are hard-disabled with no state-changing reducer or network path.
- Desktop/tablet/mobile and light/dark preserve the observed hierarchy while source account/contact identifiers never enter fixtures, source code or documentation.
