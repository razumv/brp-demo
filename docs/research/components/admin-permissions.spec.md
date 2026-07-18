# Admin Permissions — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. Both role tabs and their independent search states were inspected. No permission switch, quick action or access state was changed; before/after counts remained Manager 33/54 and Dealer 35/47.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/permissions`.
- Role selection and search keep the base URL and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-permissions-manager-desktop.png`
  - `docs/design-references/source-admin-permissions-manager-bottom.png`
  - `docs/design-references/source-admin-permissions-manager-search-result.png`
  - `docs/design-references/source-admin-permissions-manager-no-result.png`
  - `docs/design-references/source-admin-permissions-dealer-desktop.png`
  - `docs/design-references/source-admin-permissions-dealer-bottom.png`
  - `docs/design-references/source-admin-permissions-dealer-search-result.png`
  - `docs/design-references/source-admin-permissions-dealer-no-result.png`
  - `docs/design-references/source-admin-permissions-tablet.png`
  - `docs/design-references/source-admin-permissions-mobile.png`
  - `docs/design-references/source-admin-permissions-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper + admin note -> search -> role tabs + unsafe quick actions -> role-specific permission matrix`.

- H1: `Контроль доступу`.
- Helper: `Налаштуйте, що може робити кожна роль. Адміністратор завжди має повний доступ.`
- Right-side note: `Роль адміністратора завжди має повний доступ і не показана тут.`
- Search placeholder: `Пошук за правами, об'єктом, дією...`.
- Role selectors are source buttons styled as tabs:
  - `Менеджер` with `33/54`;
  - `Дилер` with `35/47`.
- Quick controls: `Дати читання`, `Дати все`, `Відкликати все`.
- Every quick control is enabled in the source and has no evidenced confirmation step. It may persist immediately, so none was clicked.
- Desktop/tablet use a semantic table. Mobile renders a separate card representation while the desktop table remains hidden in the DOM.

## Every-tab state inventory

Both role tabs were selected and inventoried independently. Their schemas are not interchangeable.

| Role tab | Entities | Applicable switches | Checked | Unchecked | Action columns |
|---|---:|---:|---:|---:|---|
| `Менеджер` | 15 | 54 | 33 | 21 | Read, Create, Update, Delete, Request, Approve, Ship |
| `Дилер` | 16 + one section divider | 47 | 35 | 12 | Read, Create, Update, Delete, Request, Approve, Export, Ship |

The Dealer tab uniquely adds `Експорт`; the Manager tab omits it. The Dealer matrix also includes a full-width `Документи` section divider before the Documents entity row.

## Manager matrix

| Entity | Read | Create | Update | Delete | Request | Approve | Ship |
|---|---|---|---|---|---|---|---|
| `Замовлення` | on | on | on | off | N/A | N/A | N/A |
| `Пайплайн` | on | on | on | off | N/A | N/A | N/A |
| `Консигнація` | on | N/A | N/A | N/A | off | on | on |
| `Повернення` | on | on | N/A | N/A | N/A | on | N/A |
| `Авіафрахт` | on | on | on | off | N/A | N/A | N/A |
| `Приймання` | on | on | on | off | N/A | N/A | N/A |
| `Морський фрахт` | on | on | on | off | N/A | N/A | N/A |
| `Компанії` | on | on | on | off | N/A | N/A | N/A |
| `Користувачі` | on | off | off | off | N/A | N/A | N/A |
| `Інвойси` | off | off | off | off | N/A | N/A | N/A |
| `Взаєморозрахунки` | on | N/A | N/A | N/A | N/A | N/A | N/A |
| `Каталог` | on | off | on | off | N/A | N/A | N/A |
| `Розклад` | on | on | on | off | N/A | N/A | N/A |
| `Завдання` | on | off | off | off | N/A | N/A | N/A |
| `Звіти` | on | off | N/A | N/A | N/A | N/A | N/A |

## Dealer matrix

| Entity | Read | Create | Update | Delete | Request | Approve | Export | Ship |
|---|---|---|---|---|---|---|---|---|
| `Консигнація` | on | N/A | N/A | N/A | on | off | N/A | on |
| `Повернення` | on | off | N/A | N/A | N/A | off | N/A | N/A |
| `Каталог` | on | off | off | off | N/A | N/A | N/A | N/A |
| `Розклад` | on | off | off | off | N/A | N/A | N/A | N/A |
| `Панель дилера` | on | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `Команда і доступи` | on | N/A | on | N/A | N/A | N/A | N/A | N/A |
| `Мої замовлення` | on | on | on | off | N/A | N/A | N/A | N/A |
| `Взаєморозрахунки дилера` | on | N/A | N/A | N/A | N/A | N/A | on | N/A |
| `Склад запчастин` | on | on | on | off | N/A | N/A | N/A | N/A |
| `Юніти` | on | on | on | off | N/A | N/A | N/A | N/A |
| `Дилерська мережа` | on | on | on | on | N/A | N/A | N/A | N/A |
| `Клієнти` | on | on | on | on | N/A | N/A | N/A | N/A |
| `Майстерня` | on | on | on | on | N/A | N/A | N/A | N/A |
| `Пошук запчастини` | on | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `permissions.dealer_prices` | on | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `Документи` | on | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

`permissions.dealer_prices` is the exact untranslated source label and must remain evidence-backed instead of being silently replaced by an invented localization.

## Search behavior in each tab

Search is immediate, role-local and matches entity labels and applicable action labels. It does not change role totals or URL.

### Manager

- `Схвалення` returns `Консигнація` and `Повернення`, with seven applicable switches across the two rows.
- `NO_SUCH_PERMISSION_9000` leaves only the table header; the source provides no empty-state title or helper.
- Clearing restores 15 rows and 54 switches.

### Dealer

- `Каталог` returns the Catalog row with four switches (one on, three off).
- `Експорт` returns only `Взаєморозрахунки дилера`, proving the additional Dealer-only action column participates in search.
- `NO_SUCH_PERMISSION_9000` leaves only the nine-column header; again there is no empty-state copy.
- Clearing restores 16 entity rows, the Documents divider and 47 switches.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Manager baseline | 15 rows, 33/54 | exact schema and matrix |
| Dealer baseline | 16 rows + divider, 35/47 | exact schema including Export and untranslated label |
| Manager action search | two Approve-capable rows | role-local search over action labels |
| Dealer object search | one Catalog row | four exact switch states |
| Dealer action search | one settlements row | Export column remains role-specific |
| No result | header only, no copy | do not invent an empty illustration/message |
| Mobile | one card per entity | render only applicable actions inside each card |
| Loading/error | no durable source state forced | do not invent an operational path |

## Safety boundary

Safe and inspected: route navigation, both role selectors, object/action/no-result search, clear, DOM state inventory, responsive layouts and theme.

Unsafe and never invoked:

- all 54 Manager switches and all 47 Dealer switches;
- `Дати читання`, `Дати все`, `Відкликати все`;
- any direct role-access save or mutation request.

There is no save footer or evidenced second-step confirmation. Therefore each switch and quick button itself is the last safe point before a possible immediate mutation. Locally they must be hard-disabled, retain their exact visual state, and have no `onClick`, `onCheckedChange`, reducer, dispatch or network path.

## Responsive, dark and exact tokens

- Desktop 1440: persistent 255px sidebar; H1/helper share a line with the admin note; compact search sits below; role tabs and three quick actions share one bordered toolbar; the matrix fills the content width.
- Tablet 768: compact top header replaces the sidebar; hierarchy remains, with the wide matrix constrained inside the page.
- Mobile 390: compact top header; helper/admin note stack; role tabs and quick actions wrap into a compact toolbar; the matrix transforms into a long card list. Each entity card renders only its applicable action rows and right-aligned 32x20 switches. The full Manager mobile page is 4188px tall.
- Dark mode preserves green checked switches, neutral unchecked switches and action-colored header icons on a GitHub-like surface.
- Measured light: body `rgb(246,248,250)`, text `rgb(31,35,40)`, border `rgb(208,215,222)`; H1 30px/36px weight 700; selected role 13px/18.57px, 36px height, 6px radius, 12px horizontal padding; quick button 11px/14.67px weight 500, 36px height; switch 32x20.
- Measured dark: body `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`; H1 28px/33.6px weight 700; selected role 12px/17.14px with `rgb(13,17,23)` background; quick controls retain 36px height and 6px radius; switch remains 32x20.
- Shared font: `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

## Clone acceptance

- Dedicated route component with typed role, entity, action and applicable-permission models.
- Manager and Dealer tabs are independent and render their exact different schemas, counts and matrices.
- Search works locally over both entity and action labels, including the Dealer-only Export path and header-only no-result state.
- Desktop table and mobile entity-card representations preserve only applicable actions.
- Every switch and bulk quick action is hard-disabled and has no mutation callback, reducer or network request.
- No Admin tab is invented; the exact source note explains why the administrator role is omitted.
