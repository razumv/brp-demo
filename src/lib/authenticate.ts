import type { Role, Session } from "@/lib/types";

const ADMIN_EMAIL_MARKERS = ["admin", "manager", "razumv"] as const;
const REMEMBER_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthenticationCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

export async function authenticateCredentials({
  email,
  password,
  remember,
}: AuthenticationCredentials): Promise<Session | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const role: Role = ADMIN_EMAIL_MARKERS.some((marker) => normalizedEmail.includes(marker))
    ? "admin"
    : "dealer";

  return {
    role,
    email: normalizedEmail,
    displayName: role === "dealer" ? "Финансы" : "Razumv Admin",
    company: "Logos",
    remember,
    expiresAt: remember
      ? new Date(Date.now() + REMEMBER_DURATION_MS).toISOString()
      : null,
  };
}
