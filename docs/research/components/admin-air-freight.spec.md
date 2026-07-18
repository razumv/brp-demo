# Admin Air Freight — source specification

Status: source-observed on 2026-07-18. This document describes the live admin UI; it is not an implementation guess.

## Source URLs and evidence

- Source route: `https://brp-dev1.k8s.artemahr.tech/admin/air-freight`
- No tab, filter, modal, or search state changed the URL or added query parameters.
- Desktop overview: `docs/design-references/source-admin-air-freight-desktop.png`
- New-shipment preview: `docs/design-references/source-admin-air-freight-new-shipment-preview.png`
- Mobile, captured with the Shipments tab selected: `docs/design-references/source-admin-air-freight-mobile.png`
- Tablet, captured with the Shipments tab selected: `docs/design-references/source-admin-air-freight-tablet.png`
- Dark desktop: `docs/design-references/source-admin-air-freight-dark.png`

## DOM and page structure

1. Shared admin banner and desktop navigation.
2. Main heading `Air Freight`.
3. Helper text: `Контролюйте замовлення постачальникам, постачання, приймання на склад, нестачі та передачу дилерам в одному робочому екрані.`
4. Header actions: `Пошук постачань`, `Склад`.
5. Tabs: `Огляд`, `Постачання`.
6. Overview tab:
   - seven-step workflow strip;
   - six KPI controls;
   - attention panel;
   - recent event timeline.
7. Shipments tab:
   - four metrics;
   - search;
   - three status filters;
   - `Нове постачання` action;
   - empty shipment region.
8. New-shipment dialog with a PDF dropzone. The dialog does not navigate.

## Real source data and copy

### Workflow strip

| Step | Count |
|---|---:|
| `SO створено` | 0 |
| `Консолідація` | 28 |
| `В дорозі` | 0 |
| `Доставлено` | 0 |
| `Приймання` | 0 |
| `Готово` | 0 |
| `Відправлено дилеру` | 0 |

### KPI controls

| KPI | Value |
|---|---:|
| `Замовлення постачальнику` | 0 |
| `В дорозі` | 0 |
| `Очікує сканування` | 0 |
| `Нестача` | 0 |
| `Виконано` | 0% |
| `Готово до відправки` | 0 |

Attention copy is `28 Pending Consolidation` and `Orders with items awaiting supplier order creation`. The adjacent `Вирішити` control was not opened because a first-click operational side effect could not be ruled out.

The event timeline includes the demonstration order `LOG-01` and repeated BossWeb unmapped supplier-order warning groups. It is an event feed, not a shipment detail.

### Shipments tab

- Metrics: `Всього 0`, `В дорозі 0`, `Доставлено 0`, `Завершено 0`.
- Search placeholder: `Пошук AWB, проформа, номер постачання...`.
- Filters: `Всі`, `В дорозі`, `Отримано`.
- Empty copy: `Немає постачань`.

### New-shipment dialog

- Title: `Нове постачання`.
- Dropzone: `Перетягніть PDF файли сюди або натисніть для завантаження`.
- Helper: `Для авіа-постачання потрібен AWB. Ocean/митні файли ведуться у морській доставці та документообігу.`
- The source exposes a PDF input/dropzone. No file was selected and no upload request was made.

## Interaction model

- `Пошук постачань` selects `Постачання`; it does not navigate.
- Tabs are client-side and preserve `/admin/air-freight`.
- Shipment search and status filters operate on the local list region. With zero records, all states remain the same empty result.
- `Нове постачання` opens a dialog. Closing/navigating away without a file leaves all counts unchanged.
- No shipment row, AWB detail, manifest, milestone, warehouse receipt, shortage detail, pagination, or per-shipment history is observable because the source list is empty.

## State table

| State | Source result | Evidence |
|---|---|---|
| Overview / populated event feed | Seven stages, KPI, 28-item attention panel, event timeline | desktop, dark |
| Shipments / empty | 0 across all four metrics; no rows | mobile, tablet DOM |
| Search / no result | Empty remains `Немає постачань` | DOM observation |
| Filter / all three values | Empty remains `Немає постачань` | DOM observation |
| Create preview | PDF dropzone dialog | new-shipment preview |
| Loading | Not deliberately induced; a transient source loading label was not captured | unverified |
| Error | Not safely inducible without a network or upload action | blocked |
| Populated shipment/detail | No source shipment exists | source-empty, do not invent as source fact |

## Safe and unsafe boundaries

Safe and observed:

- both tabs;
- shipment search/status filters;
- opening the new-shipment dialog;
- closing without selecting a file;
- responsive and theme controls.

Unsafe or blocked:

- `Вирішити` (ambiguous operational first click);
- `Склад` until its exact navigation-only semantics are independently proved;
- selecting or uploading a PDF;
- creating a supplier order, consolidation, receipt, warehouse operation, shortage resolution, dealer transfer, or status change;
- any final `Save`, `Upload`, `Confirm`, `Send`, `Apply`, or equivalent action.

The local clone may open a faithful upload preview, but the file input and final CTA must be disabled and no callback may change operational state.

## Responsive and theme behavior

- Desktop 1440: 1184px main content beside the persistent admin sidebar.
- Tablet 768: sidebar becomes a `Меню` button; global search becomes a compact `Пошук` button; the full portal wordmark remains.
- Mobile 390: same menu pattern, compact `BRP` wordmark, no persistent sidebar; the header actions and tab content wrap vertically.
- The captured mobile/tablet state is the empty Shipments tab and therefore proves wrapping for metrics, filters, search, and the empty result.
- Dark mode uses an `html.dark` theme; the dark surface is `#0d1117` and primary text is approximately `#e6edf3`.

## Exact visual tokens

- Font: Inter.
- Main light surface: `rgb(246, 248, 250)` / `#f6f8fa`.
- Primary light text: `rgb(31, 35, 40)` / `#1f2328`.
- Secondary text: `rgb(101, 109, 118)` / `#656d76`.
- Border: `rgb(208, 215, 222)` / `#d0d7de`.
- Page heading: 30px, 36px line-height, 700.
- Main body: 15px, 21.75px line-height.
- Tab wrapper: 45px high, 1px border, 6px radius, 4px padding/gap.
- Tab: 11px / 14.67px, 36px high, 8px 12px padding, 6px radius.
- Search: 340px × 36px, 13px text, `#f6f8fa`, 1px border, 6px radius.
- Compact button: 32px high, 0 16px padding, 13px/500, 6px radius, 100ms transition.

## Clone acceptance

- Implement a route-specific `AdminAirFreightPage`, not the shared logistics table.
- Preserve the seven-step counts, KPI, attention copy, event feed, empty Shipments tab, working tabs/search/filter controls, and the exact read-only upload preview.
- Model the empty source honestly. Any representative local shipment fixture must be explicitly labelled local-demo data and cannot be asserted as source evidence.
- Final file/upload and all operational actions are hard-disabled and have no status-mutating reducer/callback.

## User refinement lock — 2026-07-18

- Replace the custom inset-underline `Огляд / Постачання` control with shared `AdminTabs` matching Ocean Freight.
- Replace the shipment search/status/view/action row with one contained `AdminToolbar` using `AdminSearchField` and `AdminSegmentedControl`.
- Use the shared page header and KPI cards while preserving the workflow strip, attention panel, event feed and read-only upload preview.
