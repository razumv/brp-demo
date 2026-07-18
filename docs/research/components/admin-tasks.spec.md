# Admin Tasks — source specification

Status: source-observed on 2026-07-18 under strict read-only rules. All four form-only preset states were selected and restored to the initial dry-run state. No queue, synchronization, import, pause, clear or reset action was started; queue counters remained Workers 1 / Active 0 / Waiting 0 / Done 0 / Failed 0.

## Source URLs and evidence

- Base route: `https://brp-dev1.k8s.artemahr.tech/admin/tasks`.
- Search and preset choices keep the base URL and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-tasks-desktop.png`
  - `docs/design-references/source-admin-tasks-bottom.png`
  - `docs/design-references/source-admin-tasks-preset-1.png`
  - `docs/design-references/source-admin-tasks-preset-2.png`
  - `docs/design-references/source-admin-tasks-preset-3.png`
  - `docs/design-references/source-admin-tasks-preset-4.png`
  - `docs/design-references/source-admin-tasks-tablet.png`
  - `docs/design-references/source-admin-tasks-mobile.png`
  - `docs/design-references/source-admin-tasks-dark.png`

## Page and DOM structure

`Admin shell -> H1/helper + inert search -> queue status -> unified catalog sync form -> four safe-order presets -> integration note -> 1C SKU task -> danger zone`.

- H1: `Фонові завдання`.
- Helper: `Запуск адміністративних завдань та операцій обслуговування`.
- Search placeholder: `Пошук за завданнями, чергою, синхронізаціями...`.
- This route has no tabs, table, pagination, modal or drawer in the observed state.

## Queue status

Card title: `Статус черги`.

- Exact status line: `Workers: 1 | Active: 0 | Waiting: 0 | Done: 0 | Failed: 0`.
- Unsafe enabled buttons: `Пауза`, `Очистити`.
- The route has no surrounding HTML form and neither button exposes a durable confirmation marker in the DOM. Both may execute immediately and were not clicked.

## Unified catalog synchronization

Card title: `Єдина синхронізація каталогу`.

Helper: `Об'єднана синхронізація дерева каталогу, зображень та запчастин з пробним режимом`.

Controls:

- unsafe primary `Запустити`;
- checkboxes `Дерево каталогу`, `Зображення`, `Запчастини`;
- `Бренд` select: `Усі бренди`, `Can-Am Off-Road`, `Can-Am On-Road`, `Sea-Doo`, `Ski-Doo`;
- `Режим` select: `Пробний запуск (без запису)`, `Бойовий`.

Initial values are tree on, images off, parts off, all brands and dry mode. The dry helper reads:

`Пробний запуск: дерево каталогу буде обійдено та зміни показано без модифікації БД. Зображення та запчастини покажуть статистику без завантаження та запису.`

Changing checkboxes/selects and selecting a preset only modifies the unsaved form state. It does not start a task. The local clone may reproduce those harmless choices; final Run must remain disabled.

## All four preset states

Section label: `БЕЗПЕЧНИЙ ПОРЯДОК ОНОВЛЕННЯ`.

Helper: `Запускайте кроки по черзі: спочатку перевірка дерева, потім запис дерева, далі зображення та черга запчастин.`

Every `Обрати` button is `type=button`. All four were selected separately; only form values changed.

| Step | Title | Source helper | Checkbox state | Mode |
|---:|---|---|---|---|
| 1 | `Dry-run дерева` | `Позначте тільки дерево каталогу та пробний режим. Перевірте нові, змінені та missing вузли.` | tree on | dry |
| 2 | `Live дерева` | `Позначте тільки дерево каталогу та бойовий режим. Зображення й запчастини поки не вмикайте.` | tree on | live |
| 3 | `Зображення new-only` | `Позначте тільки зображення в бойовому режимі. Завантажаться відсутні картинки збірок.` | images on | live |
| 4 | `Черга запчастин` | `Позначте тільки запчастини в бойовому режимі. Перед запуском перевірте Redis/чергу.` | parts on | live |

Brand remains `Усі бренди` for all four presets. After inspection, step 1 was reselected and the exact initial tree/dry state was restored.

## Integration note

Label: `BossWeb і 1C працюють окремо`.

- `BossWeb сам перевіряє прайс-листи кожні 24 години та імпортує нові файли при зміні.`
- `1C зазвичай оновлює залишки через OData polling. FTP SKU_BRP.csv лишаємо як актуальний аварійний fallback, а не як крок ARI-оновлення.`
- `Після черги запчастин перевірте health: останній BossWeb import, 1C polling, unmapped parts та помилки черги.`

## 1C SKU task and danger zone

- Card `Оновлення SKU з 1С`.
- Helper: `Синхронізація кількості з 1С через FTP (SKU_BRP.csv)`.
- Enabled source `Запустити` has no evidenced confirmation and was not clicked.

Danger section:

- H2 `Небезпечна зона`.
- Card `Скидання замовлень та авіафрахту`.
- Warning: `Видаляє ВСІ замовлення дилерів, замовлення постачальникам, авіафрахт, сесії приймання, резервації, сповіщення та журнали аудиту. Потім синхронізує залишки з 1С. Використовуйте для чистого MVP-тестування.`
- Enabled source button `Скинути все` may execute or open a destructive flow. Because a safe first-step confirmation was not established, it was never clicked.

## Search behavior

`SKU` remained in the textbox after more than one second while every card, heading, control and the 1416px desktop page height remained unchanged. The observed search control is therefore visually present but does not filter this route. No hidden no-result copy was produced. Clearing through keyboard input restored the empty field.

The local clone should not invent task filtering or a no-result state unless later source evidence proves it.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Baseline | queue 1/0/0/0/0; tree + all brands + dry | exact cards, copy and controls |
| Preset 1 | tree/dry | harmless local form state |
| Preset 2 | tree/live | harmless local form state; Run disabled |
| Preset 3 | images/live | harmless local form state; Run disabled |
| Preset 4 | parts/live | harmless local form state; Run disabled |
| Search text | no visible filtering | preserve non-filtering behavior |
| Queue actions | enabled at source, unsafe | disabled locally |
| Run actions | two enabled source buttons | disabled locally |
| Reset all | enabled danger button | disabled locally |
| Loading/error/results | no durable source state forced | do not invent output logs or operational results |

## Safety boundary

Safe and inspected: route navigation, search typing/clearing, all four `Обрати` preset buttons, unsaved checkbox/select state inventory, responsive layouts and theme.

Unsafe and never invoked:

- queue `Пауза` and `Очистити`;
- both `Запустити` actions;
- any live tree/image/parts synchronization;
- SKU FTP/OData import;
- `Скинути все`;
- any direct mutation request, queue command or operational-state reducer.

Locally every operational button must be hard-disabled with no handler. Presets and form controls may update only local, ephemeral preview state and must never call an API, alter queue counters or produce a fake successful task result.

## Responsive, dark and exact tokens

- Desktop 1440: persistent 255px sidebar; 1416px full page; cards stack in one content column; queue status/actions form a compact row; four presets form a four-column row inside the unified sync card.
- Tablet 768: compact top header; cards remain stacked; form groups and presets wrap within the card.
- Mobile 390: compact header; page is 2479px tall; headings/actions stack; checkboxes and selects remain full-width usable controls; four presets stack vertically; the danger zone remains visually separated at the end.
- Dark mode preserves the orange Run CTA, muted queue/preset cards and red danger treatment.
- Measured light: body `rgb(246,248,250)`, text `rgb(31,35,40)`, border `rgb(208,215,222)`; H1 30px/36px weight 700; search 40px high, 13px/18.57px, 6px radius, `rgb(234,238,242)` background; Run `rgb(234,88,12)`, white, 40px, 8px radius; select 36px, 13px, 8px radius; danger copy/button `rgb(209,36,47)` treatment.
- Measured dark: body `rgb(13,17,23)`, text `rgb(230,237,243)`, border `rgb(48,54,61)`; H1 28px/33.6px weight 700; search background `rgb(1,4,9)`; Run `rgb(249,115,22)`; danger `rgb(248,81,73)` on 12% red; select background `rgb(13,17,23)`.

## Clone acceptance

- Dedicated route component with typed queue summary, task card, brand, mode and four preset models.
- Exact baseline copy, controls and 1/0/0/0/0 counters.
- All four preset buttons and form choices work as local-only previews and restore deterministically.
- Search remains evidence-faithful and non-filtering.
- Pause, clear, both Run actions and Reset all are hard-disabled with no mutation callback, reducer, queue command or network request.
- Desktop/tablet/mobile and light/dark preserve the observed card hierarchy and danger boundary.
