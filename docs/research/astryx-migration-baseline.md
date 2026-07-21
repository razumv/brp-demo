# Astryx migration baseline

## Snapshot identity

| Field | Recorded value |
| --- | --- |
| UTC baseline started | 2026-07-21T16:21:00Z |
| Commit under test | `1dffa0deebdef2f2e7ebf36f07c47618aa8386f1` |
| Worktree | `/Users/razumv/brp-clone/.worktrees/astryx-task0-baseline` |
| Branch | `codex/astryx-task0-baseline` |
| Target integration branch | `codex/astryx-dual-design-system` |
| Common Git directory | `/Users/razumv/brp-clone/.git` |
| Required ancestor | `e557383` (verified with `git merge-base --is-ancestor`) |
| Application renderer | Current shadcn/Tailwind renderer; no Astryx package or CSS was added in this task |
| Static build routes | 102 (`.next/prerender-manifest.json`, excluding no routes) |

The task brief was authored for the target integration branch; this evidence was intentionally captured in the isolated Task 0 worktree named above, then is intended to be integrated into `codex/astryx-dual-design-system`. The child branch shares the required common Git directory and descends from `e557383`.

## Baseline gates

All commands were run in the task worktree against the production source at the recorded SHA.

| UTC finish | Command | Result | Primary signal |
| --- | --- | --- | --- |
| 2026-07-21T16:21:10Z | `npm run lint` | PASS | ESLint exited 0 |
| 2026-07-21T16:21:20Z | `npm run typecheck` | PASS | TypeScript exited 0 |
| 2026-07-21T16:21:21Z | `npm run test:dealer-state` | PASS | 21 passing, 0 failed |
| 2026-07-21T16:21:37Z | `npm run build` | PASS | Next 16 production build and 102 prerender routes |

The non-blocking build environment warning is that Next selected `/Users/razumv/brp-clone/package-lock.json` as the Turbopack workspace root because the isolated worktree also has a lockfile. The production build itself completed successfully and this task does not alter its configuration.

## Screenshot capture contract

Visual baselines are production-server captures, not development-server captures. The capture procedure is committed in [`scripts/capture-astryx-baseline.mjs`](../../scripts/capture-astryx-baseline.mjs): run the four gates, start `next start` from the fresh project output, verify a linked `/_next/static/*.css` response is HTTP 200, then run `BASELINE_BASE_URL=http://127.0.0.1:<port> node scripts/capture-astryx-baseline.mjs --all --manifest --verify`. It uses Chromium headless with no browser chrome, `animations: "disabled"`, transitions disabled before navigation, deterministic dealer/admin login, and the persisted `brp-clone-theme` value set before the first page request. The script never injects a root theme class: it records the marker applied by the rendered application itself.

- Widths: `390`, `768`, `1280`, and `1440` CSS pixels.
- Heights: `844` at 390 and `1000` at the other widths.
- Themes: `light` and `dark`.
- File convention: `<surface>--<theme>--<width>.png`.
- Expected count: 15 surfaces × 2 themes × 4 widths = **120 PNG files**.
- Directory: [`docs/design-references/astryx-baseline/`](../design-references/astryx-baseline/).
- Tracked provenance: [`docs/research/astryx-baseline-manifest.json`](./astryx-baseline-manifest.json) records source SHA, final URL assertion, root-theme assertion, stylesheet HTTP 200 assertion, PNG dimensions, bytes, and SHA-256 for every image.

| Surface | Route | Login seed | Purpose / exception |
| --- | --- | --- | --- |
| `login` | `/login` | public | shared authentication shell |
| `offline` | `/offline` | public | PWA offline shell |
| `dealer-dashboard` | `/` | dealer | shared shell and dealer overview |
| `admin-order-pipeline` | `/admin/order-pipeline` | admin | responsive toolbar and order state |
| `admin-consignment` | `/admin/consignment` | admin | wide inventory matrix; deliberate horizontal data scroller |
| `admin-warehouse` | `/admin/warehouse` | admin | receiving workflow and dense data panels |
| `admin-catalog` | `/admin/catalog` | admin | catalog filters and table/cards switch |
| `admin-schedule` | `/admin/schedule` | admin | custom delivery timeline visualization |
| `admin-permissions` | `/admin/permissions` | admin | mobile permission-card transformation |
| `dealer-catalog-diagram` | `/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25` | dealer | standalone parts diagram; deliberate horizontal diagram/parts-domain scroller |
| `dealer-cart` | `/cart` | dealer | cart drawer/page and quantity controls |
| `dealer-orders` | `/dealer/orders` | dealer | order filters and status workflow |
| `dealer-accessories` | `/dealer/accessories` | dealer | brand/model/category filters and product grid |
| `dealer-workshop` | `/dealer/workshop` | dealer | operational board and drag/status controls |
| `dealer-team-access` | `/dealer/team-access` | dealer | team-access forms and permission controls |

The deterministic filename convention above enumerates every visual artifact unambiguously. The tracked manifest is the exact resolved file set and is verified before commit.

### Current light-only route exceptions

The existing `/login` and `/offline` public routes do not mount `AppShell`, which is the current owner of the persisted theme UI. The standalone `/catalog/CAN_OFF_EN_US/062bdf9d-05c3-470a-a043-8d10bd287a25` diagram route mounts `RoleGate` rather than `AppShell` and has the same current light-only behavior. Their dark captures are therefore intentionally light and byte-identical to their light captures in this baseline (the manifest SHA-256 values prove this). The capture script records this truth as `rootTheme.expectedDark: false` while still requiring a loaded stylesheet and correct final URL. This task must not mutate runtime to change that behavior. Task 6 owns the public shared-appearance controller; Task 14 must bring the standalone catalog diagram into the dealer appearance contract.

## Static output reconciliation

The product build emits 102 static routes. The reconciliation is:

| Surface family | Count |
| --- | ---: |
| Framework/public (`/_global-error`, `/_not-found`, favicon, manifest, login, offline) | 6 |
| Admin, including overview, features, special routes, and all generated order IDs/codes | 62 |
| Dealer, including dashboard, catalog generations, feature routes, generated order IDs/codes, cart, and confirmations | 34 |
| **Total** | **102** |

The route-by-route owner, behavior coverage, responsive/custom-visualization exception, and Astryx migration batch are frozen in [the companion route inventory](./astryx-route-inventory.md). That document lists every source route and every value emitted by `generateStaticParams`, together with query-compatible order and filter routes.

## Baseline acceptance

Task 1 may begin only when these four gates remain green, the prerender count remains 102, and the 120 current-renderer PNG files validate against the tracked manifest. This task intentionally changes neither runtime markup nor styling, so a later Astryx regression must be reviewed against this exact current-renderer reference rather than against an already migrated page.
