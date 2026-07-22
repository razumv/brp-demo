# UI/UX surface-pass verification

## Scope

- Source candidate: `9543606` (`codex/ui-ux-surface-pass`)
- Evidence report revision: `eeda2fb` (this report was added after the source candidate and does not change product code)
- Comparison base: `d6e06a198740933e0af02160fecf56feadc6710c` (`origin/main` merge base)
- Scope: the shared shell, the shadcn and Astryx renderers, responsive admin and dealer routes, search/filter toolbars, catalog discovery, and user/company/permission density changes introduced by this surface pass.

This is a UI certification pass. It does not claim that unavailable external integrations have become live.

## Environment and contract review

- The certification worktree used the exact dependency lockfile as the implementation worktree (`sha256: 6b3bc762361230ebae73ab26928d7947b31866aef96a19a3bf8c5534b92ecea4`).
- The relevant Next.js 16 guidance was reviewed before verification: Server/Client Components, CSS, and Static Exports under `node_modules/next/dist/docs/`.
- `git diff --check origin/main...HEAD` completed with no whitespace errors.

## Automated checks

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | Passed | ESLint completed with exit code 0. |
| `npm run typecheck` | Passed | TypeScript completed with exit code 0. |
| `npm run test:dealer-state` | Passed | 26/26 dealer state tests passed. |
| `npm run test:appearance` | Passed | 87/87 appearance and Astryx tests passed. |
| `npm run build` | Passed | Production Next.js build completed successfully. |
| `npm run build:pages` | Passed | Static GitHub Pages export, PWA generation, and validation completed successfully. |
| `node scripts/validate-pwa.mjs` | Passed | Manifest, restricted precache, safe navigation fallback, and a 32 KiB service worker validated. |
| Focused browser reproductions | Passed | The two exact serial commands below each passed 1/1. |

The Pages export contains `out/index.html` and `out/manifest.webmanifest` after the successful build.

Exact focused browser commands:

```sh
npx playwright test tests/e2e/appearance-admin-catalog.spec.ts --grep 'astryx dark catalog is usable at 768px' --workers=1
npx playwright test tests/e2e/admin-mobile-schedule.spec.ts --grep 'compact operational Schedule actions remain explained and hard-disabled' --workers=1
```

## Browser certification evidence and bounded runs

The intended browser matrix covers shadcn/Astryx light/dark across Chromium desktop (1280 and 1440), Chromium tablet (768), Chromium mobile (390), Firefox, and WebKit. The configuration is `playwright.appearance-matrix.config.ts` and has one worker so that renderer/theme state cannot race.

Two broad browser commands were intentionally bounded and **are not recorded as passing**:

1. `npm run test:e2e` first ran with the local non-CI worker default. Its concurrent browser workers caused chunk-readiness timeouts and rapidly accumulated failure videos/traces. The two representative failures above were rerun serially and passed.
2. `CI=1 npm run test:e2e:appearance:matrix` was stopped after 4m35s before a project completed. Although it was serial and no completed test had reported a product failure, its all-browser artifact output reached 258 MB and reduced the shared host below the safe disk threshold. Only its generated Playwright output was removed.

An attempted expanded focused suite after `build:pages` was also stopped and excluded from the result: its `next start` server was using the just-created Pages output with the `/brp-demo` base path, while the test navigated root-relative local routes. That left the client in the access-check shell. A Pages/base-path ordering issue is the plausible explanation, but it remains unclosed until a clean rerun against a normal production build completes.

No Playwright screenshots, videos, traces, or artifact bundles are retained with this evidence: all temporary output was removed to protect the shared host. Consequently, no visual reference-lock comparison is certified by this local pass.

For a complete release-runner certification, run on a runner with several free gigabytes and retain the output long enough to review:

1. `npm run test:e2e`
2. `CI=1 npm run test:e2e:appearance:matrix`
3. Screenshot/reference-lock coverage at 390, 768, 1280, and 1440 px for both renderers and both color modes.

Keep the normal production build active for root-relative Playwright tests; run the Pages export check in a separate final job.

## UI acceptance coverage

- Appearance tests cover persistence and renderer switching for both design systems and both color modes.
- Dealer state tests cover local workflow persistence and isolation contracts.
- The passed focused browser cases cover Astryx catalog usability at the tablet breakpoint and compact, explained disabled Schedule actions.
- Source-backed route inventory drives the full matrix for responsive routes, theme attributes, keyboard reachability, runtime errors, and page-width overflow. It is ready to run on the release runner, but it was not completed locally for the host-capacity reason above.

## Genuine backend-only limitations

The current front end intentionally preserves state in the browser while the BRP backend integration is pending. The following are not UI regressions and require service/API work rather than another UI pass:

- Dealer workflow and demo store persistence use browser `localStorage` (`src/components/dealer/dealer-workflow-provider.tsx` and `src/components/providers/demo-store-provider.tsx`).
- Access-profile changes in the dealer team view remain safely disabled until the account/access service is connected (`src/components/dealer/team-access.tsx`).
- 1C refresh/receiving and Excel import/export operations remain explanatory disabled controls where the corresponding backend endpoint is unavailable.
- Static Pages cannot provide server-side authentication or live BRP/1C synchronization; Pages validation here certifies the exported client/PWA surface only.

## Certification verdict

The completed local checks are green, but **local UI certification is incomplete**. Do not treat this report as release-ready or as approval for Pages deployment. Mandatory `npm run test:e2e`, the complete appearance matrix, and retained screenshot/reference-lock review remain pending on a release runner with sufficient artifact capacity.
