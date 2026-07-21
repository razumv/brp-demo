"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrderConfirmationPage } from "@/components/catalog/order-confirmation-page";
import { AppShell } from "@/components/shell/app-shell";

function OrderConfirmationQueryContent() {
  const id = useSearchParams().get("id") ?? "";
  return (
    <AppShell role="dealer">
      <OrderConfirmationPage id={id} />
    </AppShell>
  );
}

export default function OrderConfirmationQueryRoute() {
  return (
    <Suspense fallback={<main className="auth-loading" aria-live="polite"><span className="skeleton" /><p>Завантаження замовлення…</p></main>}>
      <OrderConfirmationQueryContent />
    </Suspense>
  );
}
