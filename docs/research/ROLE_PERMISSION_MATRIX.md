# Role Permission Matrix

| Capability | Dealer source | Admin source | Clone |
|---|---|---|---|
| Browse full parts hierarchy and diagrams | Yes | Catalog management view | Dealer P0, admin catalog read-only |
| Model/part search | Yes | Yes | Yes |
| Manage cart and submit order | Yes | No | Dealer local demo state |
| View own orders/chat/timeline | Yes | Yes, all dealers | Yes |
| Add clients/equipment | Yes | Not primary flow | Dealer local demo state |
| Create workshop order | Yes | No | Dealer local demo state |
| View own team/policy | Yes | Yes, all companies | Yes |
| Add/assign employee | Not exposed for observed dealer | Yes | Admin preview only |
| Edit roles/permissions | Not exposed | Yes | Read-only |
| Approve/confirm/send/cancel order | No | Yes | Always disabled |
| Receive/sync/start/reset operations | No | Yes | Always disabled |

The clone must not invent an employee-creation affordance in Dealer Team Access because the observed dealer account did not expose one.
