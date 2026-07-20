# Dealer Single-Tenant Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move temporary credential resolution behind a replaceable asynchronous authentication boundary, keep one `Финансы / Logos` dealer profile without demo-mode UI, and make the shell consume identity from the returned session.

**Architecture:** A client-safe `authenticateCredentials()` function owns the current local role/session rules and returns the existing `Session` DTO through a Promise, matching the shape a later `brp-dev1` adapter will supply. `LoginScreen` only collects credentials, awaits that function, persists the returned session, and routes by its role. `AppShell` renders name/company from the session and no longer exposes the local data-reset action.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript strict, Playwright 1.61.

## Global Constraints

- Do not call `brp-dev1` or invent its request, response, token, or error contracts.
- Do not add visible copy about demo mode, mocked authentication, localStorage, or the backend environment.
- Ordinary credentials resolve to role `dealer`, display name `Финансы`, and company `Logos`.
- Emails containing `admin`, `manager`, or `razumv` continue to resolve to the admin portal.
- Persist the normalized submitted email, never the password.
- Keep the existing `Session` and `DemoState` schemas and the v1 storage key unchanged.
- Do not change dealer workflow fixtures, tenant behavior, permissions, or data collections.
- Follow TDD: observe each focused Playwright test fail before changing production code.

---

### Task 1: Replace inline login rules with an authentication boundary

**Files:**
- Create: `src/lib/authenticate.ts`
- Modify: `src/components/shell/login-screen.tsx`
- Modify: `tests/e2e/dealer-login-role.spec.ts`

**Interfaces:**
- Consumes: existing `Session` from `src/lib/types.ts` and `setSession(Session | null)` from the store.
- Produces: `AuthenticationCredentials` and `authenticateCredentials(credentials): Promise<Session | null>`.

- [x] **Step 1: Extend the login contract tests so current code is RED**

Add this helper and these assertions to `tests/e2e/dealer-login-role.spec.ts`, retaining the explicit admin test:

```ts
const STORAGE_KEY = "brp-clone-demo-state-v1";

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Електронна пошта").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
}

test("login exposes only supported account actions", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Зареєструватися" })).toHaveCount(0);
  await expect(page.getByText(/demo mode|демо-режим|brp-dev1|localStorage/i)).toHaveCount(0);
});

test("ordinary credentials create the shared Logos identity without storing the password", async ({ page }) => {
  const password = "storage-secret-7f4a";
  await submitLogin(page, "USER.ONE@EXAMPLE.INVALID", password);

  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:3000\/$/);
  await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();

  await page.waitForFunction(
    (storageKey) => window.localStorage.getItem(storageKey)?.includes("user.one@example.invalid"),
    STORAGE_KEY,
  );
  const persisted = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), STORAGE_KEY);
  expect(persisted).not.toBeNull();
  expect(persisted).not.toContain(password);
  const state = JSON.parse(persisted as string) as { session: { email: string; displayName: string; company: string } };
  expect(state.session).toMatchObject({
    email: "user.one@example.invalid",
    displayName: "Финансы",
    company: "Logos",
  });
});

test("different ordinary emails resolve to the same dealer profile", async ({ page }) => {
  await submitLogin(page, "another.dealer@example.invalid", "not-persisted");
  await expect(page.locator(".profile-summary").getByText("Финансы", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Logos", { exact: true })).toBeVisible();
});
```

Also import `type Page` alongside `expect` and `test`.

- [x] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npx playwright test tests/e2e/dealer-login-role.spec.ts --workers=1 --reporter=line
```

Expected: FAIL because the registration button is still rendered and the stored dealer email is `dealer.demo@local.invalid` instead of the normalized submitted email.

- [x] **Step 3: Add the asynchronous authentication boundary**

Create `src/lib/authenticate.ts`:

```ts
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
```

The Promise is intentional: later backend integration replaces this function's internals without changing the component contract.

- [x] **Step 4: Make `LoginScreen` consume only the authentication result**

In `src/components/shell/login-screen.tsx`, import the boundary:

```ts
import { authenticateCredentials } from "@/lib/authenticate";
```

Add submit state:

```ts
const [submitting, setSubmitting] = useState(false);
```

Replace the inline `submit` implementation with:

```ts
const submit = async (event: React.FormEvent) => {
  event.preventDefault();
  if (!email.trim() || !password || submitting) return;

  setSubmitting(true);
  try {
    const session = await authenticateCredentials({ email, password, remember });
    if (!session) return;
    setSession(session);
    setPassword("");
    router.push(session.role === "dealer" ? "/" : "/admin");
  } finally {
    setSubmitting(false);
  }
};
```

Update the submit button without changing its visible copy:

```tsx
<button
  type="submit"
  className="button button-primary button-wide"
  disabled={!email.trim() || !password || submitting}
  aria-busy={submitting}
>
  Увійти
</button>
```

Delete the complete `login-footer` element containing the unsupported registration button. Do not replace it with explanatory copy.

- [x] **Step 5: Run the focused test and confirm GREEN**

Run:

```bash
npx playwright test tests/e2e/dealer-login-role.spec.ts --workers=1 --reporter=line
npm run typecheck
```

Expected: all login-role tests PASS; TypeScript exits 0.

- [x] **Step 6: Commit the completed login boundary**

```bash
git add src/lib/authenticate.ts src/components/shell/login-screen.tsx tests/e2e/dealer-login-role.spec.ts
git commit -m "feat: isolate dealer login identity"
```

---

### Task 2: Render shell identity entirely from the session

**Files:**
- Modify: `src/components/shell/app-shell.tsx`
- Modify: `tests/e2e/dealer-login-role.spec.ts`

**Interfaces:**
- Consumes: the existing persisted `Session` contract (`displayName`, `company`, `role`, `email`).
- Produces: shell profile rendering that accepts any backend-shaped session without hard-coded company data.

- [x] **Step 1: Add a backend-shaped stored-session test so current code is RED**

Add these imports to `tests/e2e/dealer-login-role.spec.ts`:

```ts
import { initialDemoState } from "@/lib/mock-data";
import type { DemoState, Session } from "@/lib/types";
```

Add the helper and tests:

```ts
async function seedDealerSession(page: Page, session: Session) {
  const state = JSON.parse(JSON.stringify(initialDemoState)) as DemoState;
  state.session = session;
  await page.addInitScript(({ storageKey, persistedState }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(persistedState));
  }, { storageKey: STORAGE_KEY, persistedState: state });
}

test("dealer shell renders identity supplied by the stored session", async ({ page }) => {
  await seedDealerSession(page, {
    role: "dealer",
    email: "operator@backend.invalid",
    displayName: "Backend Operator",
    company: "Backend Dealer",
    remember: true,
    expiresAt: "2099-01-01T00:00:00.000Z",
  });

  await page.goto("/");
  await expect(page.locator(".profile-summary").getByText("Backend Operator", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-summary").getByText("Backend Dealer", { exact: true })).toBeVisible();
});

test("dealer profile has no local demo-data reset action", async ({ page }) => {
  await submitLogin(page, "dealer@example.invalid", "not-persisted");
  await page.getByRole("button", { name: "Профіль" }).click();
  await expect(page.getByRole("button", { name: /Скинути демо-дані/i })).toHaveCount(0);
});
```

- [x] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npx playwright test tests/e2e/dealer-login-role.spec.ts --workers=1 --reporter=line
```

Expected: FAIL because the shell still renders hard-coded `Logos`, and the demo-data reset action still exists.

- [x] **Step 3: Use session identity and remove the unsupported profile action**

In `src/components/shell/app-shell.tsx`, stop destructuring `resetDemoData`:

```ts
const { state, hydrated, setSession } = useDemoStore();
```

Replace the identity memo with:

```ts
const identity = useMemo(() => ({
  name: state.session?.displayName || (role === "admin" ? "Razumv Admin" : "Финансы"),
  company: state.session?.company || "Logos",
}), [role, state.session?.company, state.session?.displayName]);
```

Delete the dealer-only profile-menu button that calls `resetDemoData()` and renders `Скинути демо-дані`. Keep the logout action unchanged.

- [x] **Step 4: Run focused and type checks and confirm GREEN**

Run:

```bash
npx playwright test tests/e2e/dealer-login-role.spec.ts --workers=1 --reporter=line
npm run typecheck
```

Expected: all focused tests PASS; TypeScript exits 0.

- [x] **Step 5: Commit the session-driven shell**

```bash
git add src/components/shell/app-shell.tsx tests/e2e/dealer-login-role.spec.ts
git commit -m "fix: render shell identity from session"
```

---

### Task 3: Verify the integrated identity change

**Files:**
- Modify: `docs/superpowers/plans/2026-07-21-dealer-single-tenant-identity.md` (mark completed steps)
- Verify: `docs/superpowers/specs/2026-07-21-dealer-single-tenant-frontend-design.md`

**Interfaces:**
- Consumes: completed authentication boundary and shell contract.
- Produces: reviewable, build-clean branch with evidence for integration.

- [x] **Step 1: Run static validation**

```bash
npm run lint
npm run typecheck
npm run build
```

Expected: all commands exit 0. The existing multiple-lockfile/standalone warnings may appear but must not become errors.

- [x] **Step 2: Run the focused E2E contract against the production build**

```bash
npx playwright test tests/e2e/dealer-login-role.spec.ts --workers=1 --reporter=line
```

Expected: all identity tests PASS.

- [x] **Step 3: Inspect the final diff and forbidden UI copy in changed components**

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
if rg -n 'Зареєструватися|Скинути демо-дані|brp-dev1|демо-режим' src/components/shell/login-screen.tsx src/components/shell/app-shell.tsx; then exit 1; fi
```

Expected: `git diff --check` exits 0; the `rg` command returns no matches.

- [x] **Step 4: Commit updated specification and completed plan records**

```bash
git add docs/superpowers/specs/2026-07-21-dealer-single-tenant-frontend-design.md docs/superpowers/plans/2026-07-21-dealer-single-tenant-identity.md
git commit -m "docs: record dealer identity implementation"
```

- [x] **Step 5: Request an independent code review**

Review must verify spec coverage, password non-persistence, current marker compatibility, no session schema change, no unintended dealer workflow changes, and the evidence from Steps 1-3.

Completed by the final whole-branch review of `3bbe94d..c833351`: ready to merge with 0 Critical, 0 Important, and 0 Minor findings.
