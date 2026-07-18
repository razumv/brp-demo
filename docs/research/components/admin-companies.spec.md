# Admin Companies — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. No company, employee assignment, access policy or profile data was created, updated, deleted or saved.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/companies`.
- Search, employee popover and create/edit/assignment previews keep the base URL and add no query parameters.
- `Політика доступу` is a normal route link to `https://brp-dev1.k8s.artemahr.tech/admin/dealer-access?company=<company-id>`; the opaque source identifier is intentionally not copied into clone data.
- Evidence:
  - `docs/design-references/source-admin-companies-desktop.png`
  - `docs/design-references/source-admin-companies-search-result.png`
  - `docs/design-references/source-admin-companies-no-result.png`
  - `docs/design-references/source-admin-companies-employees-modal.png`
  - `docs/design-references/source-admin-companies-create-preview.png`
  - `docs/design-references/source-admin-companies-edit-preview.png`
  - `docs/design-references/source-admin-companies-assign-preview.png`
  - `docs/design-references/source-admin-companies-policy-preview.png`
  - `docs/design-references/source-admin-companies-tablet.png`
  - `docs/design-references/source-admin-companies-mobile.png`
  - `docs/design-references/source-admin-companies-dark.png`

Employee account identifiers and prefilled form values were deliberately redacted from stored screenshots and are not part of the clone fixture. Evidence keeps the component geometry, labels, roles, counts and states without retaining login-capable data.

## Page and DOM structure

`Admin shell -> H1/helper -> search + create CTA -> company table/card list -> four KPI cards -> popover/modal/route-link state`.

- H1: `Управління компаніями`.
- Helper: `Створюйте компанії та призначайте працівників. Працівники заповнюють дані профілю у своєму порталі.`
- Search placeholder: `Пошук компаній...`.
- Primary CTA: `Нова компанія`.
- Desktop/tablet columns: `КОМПАНІЯ`, `ПРАЦІВНИКИ`, `ПРОФІЛЬ`, `СТВОРЕНА`, `ДІЇ`.
- Each row contains company icon/name, optional `Менеджер: ...`, employee count button, profile badge, creation date and four action icons: access policy, edit, assign employee and delete.
- There is no source pagination: all 20 companies are present in one list.

Exact KPI after every safe preview and search state:

| KPI | Value |
|---|---:|
| `Всього компаній` | 20 |
| `Всього працівників` | 102 |
| `З працівниками` | 20 |
| `Профілі заповнені` | 15 |

## Source data and row variants

- 20 companies are visible.
- 19 companies have five employees; `BRP Херсон` has seven, producing the exact total 102.
- 15 profile badges are `Заповнений`; five are `Не заповнений`.
- Populated examples include BRP Вышгород (five employees, manager Oleg Dubovyk, filled, Apr 30 2026), BRP Dnipro (five, filled, Feb 4 2026), BRP Kyiv (five, filled, Feb 6 2026), BRP Rivne (five, filled, May 20 2026) and BRP Kherson (seven, filled, Apr 30 2026).
- Unfilled examples include BRP Zaporizhzhia (Park-S), BRP Center Cherkasy 2, Logos, Service Logos-sport M and PE Single Salon NEW.
- Source company names are rendered in the language/casing captured in the screenshots; the implementation may retain those exact visible strings while source-only person/account identifiers remain excluded.

## Interaction model

### Search

- `BRP Киев (Логос)` returns exactly one row.
- `NO_SUCH_COMPANY_9000` removes the list and shows `Компаній не знайдено`.
- KPI remain global at 20 / 102 / 20 / 15 in both states.
- Search changes neither URL nor source data.

### Employees popover

The employee-count chip safely opens an anchored popover titled `Працівники` with the selected company name and five employee entries for the representative BRP Vышгород row. Entries carry the role `Dealer`. Account identifiers are intentionally redacted and must not be added to local fixtures. The popover closes through the same trigger/outside interaction and changes no count.

### Create preview

`Нова компанія` opens `Створити нову компанію` with helper `Заповніть дані компанії. Усі поля, крім назви, необов'язкові.` Fields:

- `Назва компанії *` — `Введіть назву компанії`;
- section `Інформація про менеджера`;
- `Ім'я менеджера` — `Введіть повне ім'я менеджера`;
- `Телефон менеджера` — `0XXXXXXXXX` and `Український формат: 0XXXXXXXXX (10 цифр)`;
- section `Адреса доставки`;
- `Область` — `напр., Київська`;
- `Місто` — `напр., Київ`;
- `Склад/Поштомат` — `напр., Відділення №5 або Поштомат №12`;
- `Ім'я отримувача` — `Повне ім'я отримувача`;
- `Телефон отримувача` with the same Ukrainian-format helper;
- `Скасувати`, unsafe `Створити компанію`, and Close.

The preview was closed without submitting; KPI remained 20 / 102 / 20 / 15.

### Edit preview

The first row edit icon opens `Редагувати компанію` with helper `Оновіть дані компанії BRP Вышгород`. It has the same eight fields and two phone helpers as create, prefilled from source data, plus `Скасувати`, unsafe `Оновити компанію`, and Close. Prefilled values were redacted from screenshot evidence and must not be persisted. The modal was closed through Close; KPI and row state were unchanged.

### Assignment preview

The assignment icon opens `Призначити працівника` with helper `Призначте працівника в BRP Вышгород. Він заповнить дані профілю компанії.` It contains required `Оберіть працівника *`, `Скасувати`, final `Призначити працівника` (disabled before a selection), and Close. The employee selector was not expanded because its options can expose login identifiers. The modal was cancelled and all counts remained unchanged.

### Access-policy route

The shield icon labelled `Політика доступу` performs safe GET navigation to `/admin/dealer-access?company=<id>`. It is neither a drawer nor a modal. The destination has its own route specification and local route state.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Baseline | 20 rows, four global KPI | exact counts and representative row variants |
| Search hit | one BRP Kyiv (Logos) row | working case-insensitive search; global KPI unchanged |
| Search miss | `Компаній не знайдено` | stable no-result copy |
| Employees | anchored five-entry popover | local role-only entries; no account identifiers |
| Create | empty eight-field dialog | preview opens; final create hard-disabled |
| Edit | prefilled eight-field dialog | use non-sensitive fixture values; final update hard-disabled |
| Assignment | required employee combobox | selector remains non-operational; final assign hard-disabled |
| Policy | GET navigation with `company` query | safe local navigation only |
| Loading/error | no durable source copy forced | do not invent operational errors |

## Safe and unsafe boundary

Safe and inspected: list, search hit/miss, employee popover, create/edit/assignment dialogs up to the final action, policy navigation, responsive layouts and theme.

Never invoked and hard-blocked locally:

- create or update company;
- select/assign an employee;
- delete company (the source delete icon may execute immediately and was not clicked);
- save profile/address data;
- mutate company access policy;
- any POST/PUT/PATCH/DELETE, upload, external request or operational reducer.

The last safe point for deletion is the baseline row with the trash icon visible. The last safe point for create/edit/assignment is the open dialog with the final CTA visible but never actionable.

## Responsive, dark and visual tokens

- Desktop 1440: persistent 255px sidebar; search and orange create CTA share one row; dense five-column table; four KPI in one footer row.
- Tablet 768: compact top header replaces the sidebar; search and CTA share a two-column row; dense table remains readable; KPI begin as a two-column grid.
- Mobile 390: compact header; H1 28px; search and CTA stack full-width; table transforms into bordered company cards. Each card places company/profile count at the top, creation copy below and four evenly distributed action icons at the bottom.
- Dark mode retains the dense table, blue employee chips, green/amber profile badges and orange CTA on GitHub-like surfaces.
- Measured light tokens: body `rgb(246,248,250)`, text `rgb(31,35,40)`, border `rgb(208,215,222)`; H1 30px/36px, weight 700; CTA `rgb(234,88,12)`, white text, 6px radius, 13px/18.57px.
- Measured dark tokens: body `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`; H1 28px/33.6px, weight 700; CTA `rgb(249,115,22)`, white text, 6px radius.
- Shared font: `Inter, -apple-system, system-ui, Segoe UI Variable, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`.

## Clone acceptance

- Dedicated route component and typed company, non-sensitive employee-summary and company-form models.
- Search, empty result, employee popover and create/edit/assignment previews work locally with no external requests.
- Policy icon navigates to a local dealer-access route while preserving a harmless `company` query parameter.
- Final create/update/assign/delete actions are hard-disabled and have no mutating callback or reducer.
- Desktop/tablet/mobile and light/dark states preserve the observed hierarchy without storing source account identifiers or prefilled sensitive values.
