# Admin Settlements — source specification

Status: source-observed on 2026-07-18. All 1C synchronization/refresh actions remained untouched.

## Source and evidence

- URL: `https://brp-dev1.k8s.artemahr.tech/admin/settlements`.
- Dealer expansion, search and date presets are client-side and add no query parameters.
- Evidence:
  - `docs/design-references/source-admin-settlements-desktop.png`
  - `docs/design-references/source-admin-settlements-expanded.png`
  - `docs/design-references/source-admin-settlements-search-result.png`
  - `docs/design-references/source-admin-settlements-no-result.png`
  - `docs/design-references/source-admin-settlements-tablet.png`
  - `docs/design-references/source-admin-settlements-mobile.png`
  - `docs/design-references/source-admin-settlements-dark.png`

## Structure and source status

`Back -> H1/helper -> unsafe 1C refresh + sync diagnostic -> three KPI -> dealer/1C search -> accordion dealer list -> expanded period shell`.

- H1: `Взаєморозрахунки з дилерами`.
- Helper: `Баланси дилерів з розбивкою по контрагентах в 1С (Bombardier / Bombardier СД / Sea Doo СД)`.
- Unsafe CTA: `Оновити з 1С (30 днів)`; never clicked.
- Current status copy:
  - `Оновлюється`;
  - `Остання успішна синхронізація: 09.06.2026, 18:40:33`;
  - `Рухи синхронізовано: 09.06.2026, 18:40:33`;
  - `Вдень: кожні 15 хв, вікно 7 дн. · Вночі 02:00: звірка 90 дн.`;
  - `Актуальний баланс 1С читається окремо при відкритті деталізації.`;
  - `77 рухів / 72 маппінгів / 0 помилок`;
  - last error: `getaddrinfo EAI_AGAIN brp-dev1-postgres`.
- Baseline KPI: `Дилерів 19`, `З маппінгом 19`, `Всього рухів 2 359`.
- Search: `Фільтр за дилером або 1С контрагентом…`.

## Dealer rows

| Dealer | Balance mappings | Movements | Last movement |
|---|---:|---:|---|
| BRP Вышгород | 4 | 45 | 08.06.2026 |
| BRP Днепр | 4 | 309 | 09.06.2026 |
| BRP Житомир | 4 | 154 | 09.06.2026 |
| BRP Запорожье (Парк-С) | 4 | 15 | 08.06.2026 |
| BRP Запорожье (Элитспорт) | 4 | 25 | 08.06.2026 |
| BRP Киев | 4 | 520 | 09.06.2026 |
| BRP Киев (Логос) | 4 | 41 | 08.06.2026 |
| BRP Львов | 4 | 257 | 09.06.2026 |
| BRP Мукачево | 3 | 146 | 09.06.2026 |
| BRP Одесса | 4 | 20 | 09.06.2026 |
| BRP Полтава | 4 | 83 | 09.06.2026 |
| BRP Ровно | 4 | 76 | 07.06.2026 |
| BRP Харьков | 4 | 121 | 09.06.2026 |
| BRP Херсон | 5 | 319 | 09.06.2026 |
| BRP Черкассы | 4 | 55 | 09.06.2026 |
| BRP Чернигов | 4 | 22 | 04.06.2026 |
| BRP центр Черкассы 2 | 4 | 59 | 08.06.2026 |
| Сервис Логос-спорт М | 1 | 46 | 08.06.2026 |
| ЧП Сингл Салон NEW | 3 | 46 | 08.06.2026 |

Each row is an accordion button `Відкрити баланси …`; it does not navigate or open a modal/drawer.

## Expanded detail shell

Opening BRP Вышгород exposes date filters beneath its row:

- `Дата початку періоду` / `Дата завершення періоду`;
- presets and exact resulting ranges:
  - `30д`: 2026-06-18 — 2026-07-18;
  - `90д`: 2026-04-19 — 2026-07-18;
  - `6м`: 2026-01-19 — 2026-07-18;
  - `1р`: 2025-07-18 — 2026-07-18;
- nested `Оновити` action.

The presets only changed unsent filter fields and were safe to inspect. Nested `Оновити` was not clicked because it performs a live 1C read. Due the visible database/DNS failure, no actual counterparty balance cards or movement table appeared after expansion. Do not invent those values as source evidence.

## State table

| State | Source result | Local requirement |
|---|---|---|
| Baseline | 19 mapped dealers, 2,359 movements | Exact KPI and all dealer rows |
| Search `BRP Киев` | 2 dealers, 2 mapped, 561 movements | KPI recompute and clear |
| Search miss | KPI all 0, `Немає збігів` | Stable no-result state |
| Dealer collapsed | 60px accordion row | Open locally |
| Dealer expanded | date-range shell; no balances returned | Preserve source failure-limited state |
| Date presets | four exact ranges | Local form state only |
| Loading/sync | persistent `Оновлюється` diagnostic | Show source diagnostic, no polling |
| Error | EAI_AGAIN database host | Exact read-only error copy |

## Safety boundary

Safe: search/clear, accordion open/close, date preset changes, responsive/theme.

Hard-blocked locally and never invoked in source:

- top-level `Оновити з 1С (30 днів)`;
- nested `Оновити` live-balance read;
- any sync, remap, mutation or external request.

No source balance, movement count or synchronization state changed during inspection.

## Responsive, dark and visual tokens

- Desktop 1440: 1084px dealer rows within the persistent-sidebar layout.
- Tablet/mobile: compact admin shell; dealer rows, diagnostics and KPI wrap vertically while date fields remain reachable.
- Dark mode preserves accordion hierarchy and error/status messaging.
- Computed light tokens: H1 `30px/36px`, weight 700, `#1f2328`; dealer outer button approximately `1084px × 60.4px`, 12px padding, transparent outer surface (visible borders/background are on its wrapper); page/background follows `#f6f8fa`, borders `#d0d7de`.

## Clone acceptance

- Dedicated settlements component and typed dealer/mapping/movement/diagnostic models.
- Search, clear, KPI recomputation, accordion and date presets work locally.
- Display the exact sync diagnostics and source failure-limited expanded state.
- All refresh/sync/live-balance controls are hard-disabled and have no network or operational callback.
