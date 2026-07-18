# Admin Dealer Access — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. No access switch, profile assignment or account state was changed. Source account identifiers are redacted from stored evidence and intentionally absent from clone fixtures.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/dealer-access`.
- Company context: `https://brp-dev1.k8s.artemahr.tech/admin/dealer-access?company=<opaque-company-id>`.
- The `company` query value is a source-only identifier and is intentionally represented as a placeholder in documentation and as a harmless slug locally.
- Search does not add query parameters.
- Evidence:
  - `docs/design-references/source-admin-dealer-access-desktop.png`
  - `docs/design-references/source-admin-dealer-access-company-menu.png`
  - `docs/design-references/source-admin-dealer-access-search-result.png`
  - `docs/design-references/source-admin-dealer-access-profile-search.png`
  - `docs/design-references/source-admin-dealer-access-no-result.png`
  - `docs/design-references/source-admin-dealer-access-tablet.png`
  - `docs/design-references/source-admin-dealer-access-mobile.png`
  - `docs/design-references/source-admin-dealer-access-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper + company combobox -> shared search -> dealer-team panel -> company-policy panel`.

- H1: `Доступи дилерської компанії`.
- Helper: `Задайте максимальний набір функцій для дилерської компанії.`
- Company selector baseline: `BRP Вышгород`.
- Search: `Пошук за командою, профілем, правом...`.
- Team panel:
  - heading `Команда дилера`;
  - helper `Імена, акаунти та призначені профілі, які бачить дилер.`;
  - columns `НАЗВА`, `EMAIL`, `РОЛЬ`, `ПРОФІЛЬ`, `СТАТУС ДОСТУПУ`.
- Policy panel heading: `Політика компанії`.
- Policy is a vertical list of command/action rows. Every row ends in a 32x20 switch with `data-state=checked|unchecked` and an accessible label `Перемкнути <command>: <action>`.
- There is no save/apply/footer action: a source switch may persist immediately, so no switch was clicked.

## Dealer team state

The baseline company has five rows:

| Role | Profile | Access status | Count |
|---|---|---|---:|
| `Головний дилер` | `Full Access` | `Основний акаунт` | 1 |
| `Співробітник` | `Full Access` | `Доступ призначено` | 1 |
| `Співробітник` | `Без доступу` | `Потрібно призначити доступ` | 3 |

Profile cells are plain read-only table cells on this route, not comboboxes or links. Names/account identifiers are not necessary for the clone interaction model and must remain synthetic/non-login-capable.

## Company selector

The selector opens a listbox with all 20 company labels already verified on `/admin/companies`: BRP Vышгород, Dnipro, Zhytomyr, two Zaporizhzhia entries, Kyiv, Kyiv (Logos), Lviv, Mukachevo, Odesa, Poltava, Rivne, Kharkiv, Kherson, Cherkasy, Chernihiv, BRP Center Cherkasy 2, Logos, Service Logos-sport M and PE Single Salon NEW.

Opening and closing the listbox is read-only. An attempted alternative option selection did not change the source query or selected label in this session, so no alternate policy/team data is claimed. The local selector may safely update only the selected label and harmless query slug; it must never mutate access data.

## Exact company policy

47 permission switches are present: 35 checked and 12 unchecked.

| Command | Actions and source states |
|---|---|
| `Каталог` | Створення off; Видалення off; Читання on; Оновлення off |
| `Консигнація` | Схвалення off; Відвантаження on; Читання on; Запит on |
| `Пошук запчастини` | Читання on |
| `Клієнти` | Створення on; Видалення on; Читання on; Оновлення on |
| `Дашборд` | Читання on |
| `Документи` | Читання on, preceded by the `ДОКУМЕНТИ` section divider |
| `Дилерська мережа` | Створення on; Видалення on; Читання on; Оновлення on |
| `Мої замовлення` | Створення on; Видалення off; Читання on; Оновлення on |
| `Склад запчастин` | Створення on; Видалення off; Читання on; Оновлення on |
| `Дилерські ціни` | Читання on |
| `Взаєморозрахунки дилера` | Експорт on; Читання on |
| `Команда і доступи` | Читання on; Оновлення on |
| `Техніка` | Створення on; Видалення off; Читання on; Оновлення on |
| `Майстерня` | Створення on; Видалення on; Читання on; Оновлення on |
| `Повернення` | Схвалення off; Створення off; Читання on |
| `Розклад` | Створення off; Видалення off; Читання on; Оновлення off |

The switch track is 24x10 inside a 32x20 control. In light mode the checked track is `rgb(26,127,55)` and the knob/background is `rgb(246,248,250)`; unchecked uses the neutral background/border treatment.

## Search states

Search filters the team and policy independently:

- `Каталог` produces zero team rows with `Немає користувачів дилера` and exactly four Catalog policy switches (off/off/on/off).
- `Full Access` produces the two matching team rows and zero policy rows with `Немає доступних дилерських прав`.
- `NO_SUCH_PERMISSION_9000` produces both empty copies: `Немає користувачів дилера` and `Немає доступних дилерських прав`.
- Clearing restores five team rows and all 47 switches.
- The query and all visible source policy states remain unchanged.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Baseline | 5 team rows; 47 rights (35/12) | exact representative matrix, disabled switches |
| Company list | 20-option listbox | working open/close and harmless selection/query only |
| Command search | Catalog: 0 team + 4 rights | filter both collections independently |
| Profile search | Full Access: 2 team + 0 rights | exact empty-policy copy |
| No result | 0 team + 0 rights | both source empty copies |
| Loading/error | no durable source copy forced | do not invent an operational error state |

## Safety boundary

Safe and inspected: base/query navigation, selector open/close, search hit/miss/clear, DOM state inventory, responsive and theme.

Unsafe and never invoked:

- every one of the 47 permission switches;
- assigning/changing a dealer profile;
- any user activation/deactivation;
- any save/apply request, direct API request or access-state reducer.

Because the page has no confirmation or save step, the baseline switch itself is the last safe point. Locally every switch must be hard-disabled while preserving its visual checked/unchecked state; there must be no `onCheckedChange`, `onClick`, reducer or network path.

## Responsive, dark and exact tokens

- Desktop 1440: persistent 255px sidebar; H1/helper and 320x36 company selector share the page header; search is a separate compact 202px shell; team table and policy list span the content width.
- Tablet 768: compact top header; H1 ellipsizes; company selector sits to the right of the helper, search spans below; team remains a horizontally constrained five-column table; policy rows remain full-width.
- Mobile 390: compact top header; H1 ellipsizes; selector and search stack full-width; team table transforms into five bordered cards; policy remains a vertical list with right-aligned switches.
- Dark mode preserves green checked switches, green/amber access badges and dense GitHub-like panels.
- Measured light: body `rgb(246,248,250)`, text `rgb(31,35,40)`, border `rgb(208,215,222)`; H1 30px/36px weight 700; company control background `rgb(234,238,242)`, 13px, 6px radius; search/input height 36px, 11px text; policy row padding 12px 16px.
- Measured dark: body `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`; H1 28px/33.6px; company control background `rgb(1,4,9)`, 12px, 6px radius; policy row padding remains 12px 16px.

## Clone acceptance

- Dedicated route component and typed company option, dealer-team summary, permission-group and permission-entry models.
- Company listbox and dual-domain search work locally without external requests.
- Exact five-row representative team state, 47-right matrix and 35/12 split are present.
- Account fields use non-sensitive display-only placeholders; no source login identifiers are stored.
- Every permission switch is disabled and has no mutation callback; profile cells remain read-only.
- Desktop/tablet/mobile and light/dark preserve the observed source hierarchy.
