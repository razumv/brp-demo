"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useDemoStore } from "@/components/providers/demo-store-provider";
import type { Role } from "@/lib/types";

export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const { state, hydrated } = useDemoStore();
  const allowed = hydrated && state.session?.role === role;

  useEffect(() => {
    if (hydrated && state.session?.role !== role) router.replace("/login");
  }, [hydrated, role, router, state.session?.role]);

  if (!allowed) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="skeleton" />
        <p>Перевіряємо доступ…</p>
      </main>
    );
  }

  return children;
}
