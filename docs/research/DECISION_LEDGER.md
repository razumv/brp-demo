# Decision Ledger

| Decision | Source | Source rule / role | Why |
|---|---|---|---|
| Inter as the sole UI family | Live BRP computed styles | All headings, labels, body, and controls | Matches the target and keeps the dense UI legible |
| Orange `#ea580c` | Live BRP + Orderful | Primary actions, active navigation, focus, selected state only | Preserves the strongest brand cue without flooding the page |
| 64px header / 256px sidebar | Live BRP measurements | Shared authenticated shell | Keeps both role interfaces aligned with the source topology |
| 11/13/15/24/30px type scale | Live BRP measurements | Labels / controls / body / dealer H1 / admin H1 | Avoids generic oversized SaaS typography |
| White cards on `#f6f8fa` | Live BRP + Orderful | Data and operational content surfaces | Provides the exact quiet hierarchy of the source |
| 6px controls and 8px cards | Live BRP measurements | Inputs/buttons vs. larger containers | Maintains the target's compact geometry |
| Lucide code-native icons | Live BRP SVG sweep | Functional icons only | Source uses simple stroke icons; bitmap recreation would reduce clarity |
| Desktop sidebar hides below 1024px | Live BRP responsive sweep | Replaced by modal drawer | Exact observed breakpoint behavior |
| Static header, normal page scroll | Live BRP scroll sweep | No sticky or parallax behavior | Prevents an invented interaction model |
| Local mock role routing | User scope + no-backend default | Dealer emails route to dealer demo; other accounts to admin demo | Demonstrates both shells without storing supplied credentials |
