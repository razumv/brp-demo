"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminOrderDetail } from "@/components/admin/admin-order-detail";
import { AppShell } from "@/components/shell/app-shell";

function AdminOrderQueryContent() {
  const id = useSearchParams().get("id") ?? "";
  return (
    <AppShell role="admin">
      <AdminOrderDetail id={id} />
    </AppShell>
  );
}

export default function AdminOrderQueryRoute() {
  return (
    <Suspense fallback={<main className="auth-loading" aria-live="polite"><span className="skeleton" /><p>Завантаження замовлення…</p></main>}>
      <AdminOrderQueryContent />
    </Suspense>
  );
}
