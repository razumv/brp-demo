# Changelog

All notable changes to the BRP demo portal are documented here.

## [Unreleased]

### Added

- Evidence-backed dealer and administrator workflows for the BRP demonstration portal.
- A shared admin UI foundation for page headers, toolbars, searches, tabs, filters, KPI cards, tables, icon actions, and modal forms.
- Route-specific read-only workflows for logistics, orders, warehouse, finance, catalog, people, access control, reports, and settings.
- Responsive desktop, tablet, mobile, light, and dark presentation states.
- A GitHub Pages export and deployment workflow for the `/brp-demo` base path.

### Changed

- Standardized admin tabs and filters using the warehouse interaction pattern as the visual reference.
- Made the delivery schedule timeline derive its visible range from actual events instead of showing empty distant periods.
- Moved ocean-freight receipt previews to bill-of-lading level; container rows remain read-only.
- Made dealer header part search open live results while typing, without requiring Enter.
- Raised the project Node.js baseline to 24 across local development, CI, and Docker.

### Security

- Kept the source administrator portal strictly read-only during research.
- Disabled final local admin actions that could approve, send, save, delete, synchronize, cancel, or change operational state.
- Kept the presentation self-contained without external operational API mutations.
- Updated the framework patch level and pinned the patched PostCSS runtime so the production dependency audit reports no known vulnerabilities.

[Unreleased]: https://github.com/razumv/brp-demo/commits/main
