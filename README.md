# BRP demo portal

A responsive, interactive reconstruction of the BRP parts catalog, dealer portal and manager portal. The manager workspace is deliberately read-only: operational and destructive final actions are disabled.

Public presentation: [https://razumv.github.io/brp-demo/](https://razumv.github.io/brp-demo/)

## Run

Requirements: Node.js 24 or newer.

1. Install dependencies with npm install.
2. Start development with npm run dev.
3. Open http://localhost:3000/login.

The login form is a presentation-only role switch, not production authentication. Ordinary addresses open the dealer portal; addresses that explicitly contain `admin`, `manager`, or `razumv` open the manager portal. Any non-empty password enables the local form and is cleared immediately rather than stored. The GitHub Pages build is therefore a public read-only demo.

## Deep demo flows

- Model 0001KTB00 and part 9779150 search.
- Full Can-Am catalog path through year, series, model, configuration and diagram.
- Zoomable maintenance diagram with 17-part table and cart integration.
- Customer/equipment creation, cart checkout, order confirmation, order notes and chat.
- Dealer dashboard, orders, workshop, units, accessories, schedule and BossWeb views.
- Manager overview, pipeline, order details, companies, users and operations pages.

Approval, status advancement, receiving, synchronisation, permission changes and destructive operations are disabled. Safe preview dialogs may be opened, but their final action is disabled and no external API requests are made.

Dealer demo state is localStorage-backed in the browser. Manager operational state is not mutated.

## GitHub Pages

Pushes to `main` are checked by CI and deployed by the Pages workflow. The deployment build uses a static export under the `/brp-demo` base path; normal local builds keep the standalone Next.js output.

## Quality checks

- npm run lint
- npm run typecheck
- npm run build
- npm run check

Research notes and source screenshots are under docs/research and docs/design-references.
