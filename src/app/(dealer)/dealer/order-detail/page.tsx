"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DealerOrderDetail } from "@/components/dealer/dealer-orders";
import { AppShell } from "@/components/shell/app-shell";

function DealerOrderQueryContent() {
  const id = useSearchParams().get("id") ?? "";
  return (
    <AppShell role="dealer">
      <DealerOrderDetail id={id} />
    </AppShell>
  );
}

export default function DealerOrderQueryRoute() {
  return (
    <Suspense fallback={<main className="auth-loading" aria-live="polite"><span className="skeleton" /><p>Завантаження замовлення…</p></main>}>
      <DealerOrderQueryContent />
    </Suspense>
  );
}
