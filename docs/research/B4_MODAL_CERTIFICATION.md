# B4 modal certification inventory

The executable registry is `src/lib/appearance/modal-certification-inventory.ts`. It covers the representative admin families in both Current and Astryx renderers:

- Ocean BL detail and receipt preview
- Return creation
- Order preflight
- Company creation
- User editing
- Invoice/document preview

Each registered family is certified for semantic dialog naming, focus trap, focus restoration, Escape close and scroll-safe overflow. Route-specific tests remain responsible for form validation and domain behavior. Popovers and destructive confirmations are tested with their owning route rather than being promoted to modal families.

Certification viewports:

- 390 × 844
- 430 × 932
- 768 × 1024
- 1280 × 800
- 1440 × 900
- 1920 × 1080

The full appearance matrix runs Chromium at every viewport and adds Firefox and WebKit coverage at the canonical desktop width.
