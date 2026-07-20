# Dealer single-tenant frontend identity design

**Date:** 2026-07-21
**Status:** Proposed for implementation
**Scope:** Login/session identity only; dealer workflow parity is handled separately.

## Goal

Keep the current frontend usable with one dealer company (`Logos`) while preserving a clean boundary for later authentication through the existing `brp-dev1` backend.

The login and session UI must look like a normal product interface. This change must not add or depend on visible copy about a demo mode, mocked authentication, localStorage, or the `brp-dev1` environment. Existing fixture copy inside unrelated dealer workflows is outside this identity change.

## Product contract

- A non-empty ordinary email and password open the dealer portal.
- The local dealer identity is always:
  - role: `dealer`;
  - display name: `Финансы`;
  - company: `Logos`.
- Until `brp-dev1` supplies the authenticated identity, the session email is the normalized email submitted through the login form.
- Emails containing `admin`, `manager`, or `razumv` keep the existing local admin route and open the admin portal.
- The current frontend does not promise separate dealer accounts or company isolation.
- Existing dealer data remains one shared `Logos` dataset, including the current `LOG-*` order numbering.
- No visible copy is added to explain these temporary local rules.

## Login screen

- Preserve the existing source-like login layout and ordinary email/password fields.
- Do not add banners, helper text, badges, environment names, or notices about temporary behavior.
- Remove the inert registration action so the interface does not advertise a workflow that does not exist.
- Remove the dealer-only `Скинути демо-дані` profile action because it is not part of the future backend session contract.
- Keep standard loading and validation behavior for required fields.
- Never persist or expose the entered password.

## Authentication boundary

The local role classification and session creation must live behind one small authentication function rather than inside the login component.

The login component supplies credentials and consumes a `Session` result. It must not know how the role, display name, company, or future backend token are resolved.

This boundary is intentionally compatible with a later `brp-dev1` adapter:

1. submit credentials;
2. receive an authenticated session result;
3. store the session through the existing session mechanism;
4. route by the returned role.

Connecting to `brp-dev1`, defining its request/response DTOs, handling real backend errors, and storing backend tokens are not part of this change.

## Session and data behavior

- Keep the current `Session` shape; no schema migration is required.
- Keep the existing demo-state storage version and shared dealer collections unchanged.
- Use the session as the single UI source for the displayed person and company.
- Dealer header and dealer overview must consistently display `Финансы` and `Logos`.
- Do not infer tenant ownership from the email entered on the login form.
- Do not introduce account aliases from fixture emails or admin contact data.

## Responsive and accessibility requirements

- The login form must remain usable at the existing mobile viewport without horizontal overflow.
- Removing the registration action must not leave an empty interactive container or misleading focus target.
- Form labels, validation messages, submit state, and keyboard submission remain accessible.
- No password value may appear in session storage, localStorage, URLs, logs, or rendered text.

## Verification

Automated coverage must prove:

1. an ordinary email opens the dealer portal;
2. the resulting dealer shell displays `Финансы` and `Logos`;
3. two different ordinary emails resolve to the same local dealer identity;
4. an email with an explicit admin marker still opens the admin portal;
5. the login screen contains no demo-mode or environment disclosure;
6. the inert registration action is absent;
7. the normalized submitted email is stored as the temporary session email;
8. the entered password is not written into browser storage;
9. the dealer profile contains no demo-data reset action;
10. a backend-shaped stored session can supply the displayed name and company without changing the shell.

The existing dealer login role tests remain the baseline and are extended before implementation code is changed.

## Non-goals

- Real authentication or network calls to `brp-dev1`.
- Multi-company tenant isolation.
- Dealer permissions or workflow parity changes.
- Data-store migrations or fixture replacement.
- Visual redesign of the login screen.
- Production-grade authorization or security claims for the current static build.

## Migration path to `brp-dev1`

When the backend contract is available, replace the local authentication function with a backend implementation that returns the same frontend session result. Dealer screens, shell identity rendering, and role-based routing should not require structural changes.

Any backend-specific tokens, refresh behavior, tenant identifiers, and authorization rules must be designed from the actual `brp-dev1` API contract rather than guessed in this frontend change.
