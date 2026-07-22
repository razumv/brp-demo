import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const preferenceHookPath = "src/components/admin/use-admin-view-preference.ts";
const companiesViewPath = "src/components/admin/astryx-admin-companies-view.tsx";
const usersViewPath = "src/components/admin/astryx-admin-users-view.tsx";

test("admin view preferences persist cards and list independently after hydration", () => {
  const preferenceHook = readFileSync(preferenceHookPath, "utf8");

  assert.match(preferenceHook, /usePersistedBooleanPreference/);
  assert.match(preferenceHook, /routeKey: "companies" \| "users"/);
  assert.match(preferenceHook, /brp-clone-ui-v1:astryx-admin-\$\{routeKey\}-view-list/);
  assert.match(preferenceHook, /readonly \[AdminViewMode, \(mode: AdminViewMode\) => void\]/);
  assert.match(preferenceHook, /mode === "list"/);
});

test("Astryx people views share their filtered records and action sets across cards and list", () => {
  const companiesView = readFileSync(companiesViewPath, "utf8");
  const usersView = readFileSync(usersViewPath, "utf8");

  for (const source of [companiesView, usersView]) {
    assert.match(source, /useAdminViewPreference\(/);
    assert.match(source, /SegmentedControl/);
    assert.match(source, /SegmentedControlItem/);
    assert.match(source, /data-record-id=/);
    assert.match(source, /model\.visible(?:Companies|Users)/);
    assert.match(source, /viewMode === "cards"/);
  }

  assert.match(companiesView, /CompanyActionSet/);
  assert.match(companiesView, /function companyProfileLabel/);
  assert.match(companiesView, /companyProfileLabel\(company\.profileStatus\)/);
  assert.doesNotMatch(companiesView, /className=\{styles\.tableScroller\} role="region"[\s\S]*tabIndex=\{0\}/);
  assert.match(companiesView, /<CompanyCards/);
  assert.match(companiesView, /<CompanyList/);
  assert.match(usersView, /UserActionSet/);
  assert.match(usersView, /user\.registrationAge/);
  assert.doesNotMatch(usersView, /className=\{styles\.tableScroller\} role="region"[\s\S]*tabIndex=\{0\}/);
  assert.match(usersView, /<UserCards/);
  assert.match(usersView, /<UserList/);
});
