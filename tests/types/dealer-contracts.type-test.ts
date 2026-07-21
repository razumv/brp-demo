import type { DealerSnapshot, DealerWorkflow } from "@/lib/dealer/contracts";

declare const snapshot: DealerSnapshot;
declare const workflow: DealerWorkflow;

// @ts-expect-error Dealer collections are immutable outside the command boundary.
snapshot.customers.push(snapshot.customers[0]);

const firstCustomer = snapshot.customers[0];
if (firstCustomer) {
  // @ts-expect-error Dealer entities are immutable outside the command boundary.
  firstCustomer.name = "Changed outside a command";
}

const firstOrder = snapshot.orders[0];
if (firstOrder) {
  // @ts-expect-error Nested order collections are immutable outside the command boundary.
  firstOrder.lines.push(firstOrder.lines[0]);

  const firstLine = firstOrder.lines[0];
  if (firstLine) {
    // @ts-expect-error Nested order records are immutable outside the command boundary.
    firstLine.quantity = 99;
  }
}

// @ts-expect-error Dealer identity cannot be rewritten by consumers.
workflow.identity.displayName = "Different actor";

// @ts-expect-error Capability values cannot be rewritten by consumers.
workflow.capabilities.sync.status = "available";

export {};
