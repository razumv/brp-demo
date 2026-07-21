# Astryx migration baseline

## Snapshot identity

| Field | Recorded value |
| --- | --- |
| UTC baseline started | 2026-07-21T16:21:00Z |
| Commit under test | `f356dd9863db073d966d7ef83b3fee8ef39d7a5d` |
| Worktree | `/Users/razumv/brp-clone/.worktrees/astryx-task0-baseline` |
| Branch | `codex/astryx-task0-baseline` |
| Common Git directory | `/Users/razumv/brp-clone/.git` |
| Required ancestor | `e557383` (verified with `git merge-base --is-ancestor`) |
| Application renderer | Current shadcn/Tailwind renderer; no Astryx package or CSS was added in this task |
| Static build routes | 102 (`.next/prerender-manifest.json`, excluding no routes) |

The task brief was authored for the integration branch; this evidence was intentionally captured in the isolated Task 0 worktree named above. The branch is clean before the deliverables in this commit, shares the required common Git directory, and descends from `e557383`.

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

Visual baselines are production-server captures, not development-server captures. The server is the built artifact served at `http://127.0.0.1:3107`; captures use Chromium headless with no browser chrome, `animations: "disabled"`, transitions disabled before navigation, deterministic role login, and the persisted `brp-clone-theme` value set before the first page request.

- Widths: `390`, `768`, `1280`, and `1440` CSS pixels.
- Heights: `844` at 390 and `1000` at the other widths.
- Themes: `light` and `dark`.
- File convention: `<surface>--<theme>--<width>.png`.
- Expected count: 15 surfaces × 2 themes × 4 widths = **120 PNG files**.
- Directory: [`docs/design-references/astryx-baseline/`](../design-references/astryx-baseline/).

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
| `dealer-catalog-diagram` | `/catalog/CAN_OFF_EN_US/6e4abcb9-35a4-4a55-8801-c5fb2cb41603` | dealer | standalone parts diagram; deliberate horizontal diagram/parts-domain scroller |
| `dealer-cart` | `/cart` | dealer | cart drawer/page and quantity controls |
| `dealer-orders` | `/dealer/orders` | dealer | order filters and status workflow |
| `dealer-accessories` | `/dealer/accessories` | dealer | brand/model/category filters and product grid |
| `dealer-workshop` | `/dealer/workshop` | dealer | operational board and drag/status controls |
| `dealer-team-access` | `/dealer/team-access` | dealer | team-access forms and permission controls |

The deterministic filename convention above enumerates every visual artifact unambiguously. The exact resolved file set is recorded in `.superpowers/sdd/task-0-screenshots.json` during capture and verified before commit.

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

Task 1 may begin only when these four gates remain green, the prerender count remains 102, and the 120 current-renderer PNG files are present and non-empty. This task intentionally changes neither runtime markup nor styling, so a later Astryx regression must be reviewed against this exact current-renderer reference rather than against an already migrated page.
