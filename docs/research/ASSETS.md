# Asset Inventory

- Fonts: Inter 400/500/600/700/800, source Google Fonts WOFF2 files.
- SEO/PWA: `favicon.png`, `favicon.svg`, manifest, PWA icon.
- Catalog logos:
  - `CAN_OFF_EN_US.png`
  - `CAN_ONR_EN_US.png`
  - `SEA_DOO_EN_US.png`
  - `SKI_DOO_EN_US.png`
- Source catalog page exposed 34 inline SVG instances. They were predominantly Lucide-style operational icons; the clone deduplicates them into named React icon exports instead of preserving repeated markup.
- Diagram: maintenance-diagram-source.png is the authorised source capture used inside a clipped/zoomable diagram viewport; surrounding source chrome is not shown.
- Runtime rule: all source visual assets are local under public; the finished clone makes no asset requests to the source host.
