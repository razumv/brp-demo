# Source Test Records

Created on 2026-07-18 in the authorised dealer demonstration environment:

- Customer: CODEX QA Client 2026-07-18, with clearly synthetic contact and address data.
- Order: LOG-01, source id a20b2bdd-2a1f-4322-a50a-fe68a17f4963.
- PO: CODEX-QA-20260718.
- Order line: 9779150, COOLANT,EXT LIFE, quantity 1, dealer total $13.09.
- Private line note: CODEX QA — проверена карточка позиции.
- Dealer chat message: CODEX QA — тестовое сообщение по демонстрационному заказу.

The order note explicitly identifies the record as a demonstration QA order and says not to approve it in admin. No administrative status or workflow mutation was performed.

## Source admin read-only audit incident

During Ocean Freight research, a chip labelled `Jun 8 (Arrived)` was opened under the mistaken assumption that it was a preview. It executed directly: the Ocean KPI changed from `In Transit 37 / Arrived 34` to `In Transit 36 / Arrived 35`; `Total BLs 32` and `Containers 71` stayed unchanged. No order was approved or moved, and `LOG-01` remained `New`.

The action was stopped immediately, disclosed to the project owner, and not repeated. No self-directed rollback was attempted. All ETA/date chips and `Оновити ETA` are now classified unsafe. Subsequent source research is limited to navigation, filters, expansion, and clearly two-step dialogs whose final CTA is never invoked.

## Admin order preview audit

- Read-only detail coverage: LOG-01 (New), KS-05 (Waiting), KIE-ST-23 (Partially shipped), KHA-07 (Done), KS-01 (Cancelled).
- The source bundle proves `Перевірити перед підтвердженням` invokes a GET confirm-preview endpoint; it was opened for LOG-01 and KHA-08.
- Both previews ended in the captured inline error `Failed to build confirm preview`; neither order status changed and no final confirm control was reached or pressed.
- The same source bundle proves `Перевірити старий склад` invokes POST. It was therefore not pressed and is classified unsafe/blocked.
- Cancel, ship/send, mark-delivered, 1C retry/attach and chat/upload controls were not pressed.

## BossWeb integration preset incident

While inspecting `/admin/integrations/bossweb`, the `30d` date preset appeared to be a form-only field helper but immediately started a BossWeb synchronization without a confirmation dialog. No visible `Sync`, `Save` or final confirmation button was clicked.

- Before: last sync was approximately eight hours earlier; 232 orders were reported.
- After: last sync changed to just now; the total remained 232.
- The rendered order set remained 200 rows with the same first/last records and the same `25 Not Delivered / 175 Totally Delivered` distribution.
- Matching remained `0`, with 232 unmatched records; only collected-age timestamps advanced.
- Reload restored the unsaved period/date input values.

The interaction was stopped immediately and no preset, save or synchronization control was touched again. All BossWeb settings inputs/presets and every sync/download/link/rematch control are consequently hard-disabled in the clone.

## Final read-only verification

- Order Pipeline still reports 124 orders with the unchanged `10 / 28 / 0 / 0 / 0 / 74 / 12` status summary. `LOG-01` remains inside `НОВІ ЗАМОВЛЕННЯ 10`; no order was approved or moved.
- BossWeb still reports 232 orders and Matching 0. The later header reports the synchronization/session age at about one hour, consistent with time passing after the preset incident; no further integration control was used.
- Ocean Freight reports `32 BL / 35 in transit / 71 containers / 36 arrived`. This is one additional transit-to-arrived drift from the earlier `32 / 36 / 71 / 35` evidence lock. The later value was already present before the tab-completeness pass touched any ETA/status control; that pass used GET navigation, BL disclosures, table/cards, the previously verified receipt preview and inert inner tabs only. The concurrent live-demo drift is recorded without attributing it to those read-only actions.
- PAC 05 remained `Запчастини · не проведена` before and after all seven receipt tabs were selected and the preview was closed.
