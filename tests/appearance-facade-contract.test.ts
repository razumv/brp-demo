import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {createElement, createRef} from "react";
import type {BrpUiAdapter} from "../src/components/brp-ui/contracts";
import {
  assertSettingsDataInvariants,
  filterSettingsSections,
  settingsSectionOrder,
} from "../src/lib/admin-settings-data";

const read = (path: string) => readFileSync(path, "utf8");

const facadeFamilies = [
  "BrpButton",
  "BrpIconButton",
  "BrpTextInput",
  "BrpSelect",
  "BrpSwitch",
  "BrpTabs",
  "BrpSegmentedControl",
  "BrpToolbar",
  "BrpCard",
  "BrpBadge",
  "BrpStatusDot",
  "BrpTable",
  "BrpDialog",
  "BrpAlertDialog",
  "BrpMoreMenu",
  "BrpPopover",
  "BrpEmptyState",
  "BrpSkeleton",
] as const;

function compileControlledFacadeExamples(adapter: BrpUiAdapter) {
  createElement(adapter.BrpButton, {
    ref: createRef<HTMLButtonElement>(),
    label: "Save",
    disabled: false,
    onPress: () => undefined,
  });
  createElement(adapter.BrpTextInput, {
    ref: createRef<HTMLInputElement>(),
    label: "Search",
    value: "",
    error: "Required",
    onValueChange: () => undefined,
  });
  createElement(adapter.BrpSwitch, {
    ref: createRef<HTMLInputElement>(),
    label: "Enabled",
    checked: true,
    onCheckedChange: () => undefined,
  });
  createElement(adapter.BrpTabs, {
    ref: createRef<HTMLElement>(),
    label: "Sections",
    value: "one",
    options: [{value: "one", label: "One"}],
    onValueChange: () => undefined,
  });
  createElement(adapter.BrpPopover, {
    label: "Details",
    renderTrigger: (props) => createElement("button", {...props, type: "button"}, "Open"),
    content: "Content",
  });
}

void compileControlledFacadeExamples;

test("the semantic BRP facade stays independent from renderer implementation props", () => {
  const contracts = read("src/components/brp-ui/contracts.ts");

  for (const family of facadeFamilies) {
    assert.match(contracts, new RegExp(`export interface ${family}Props`));
  }
  assert.doesNotMatch(contracts, /\bxstyle\b/);
  assert.doesNotMatch(contracts, /\bclassName\b/);
  assert.doesNotMatch(contracts, /isDisabled|isLoading|isLabelHidden|clickAction/);
  assert.doesNotMatch(contracts, /@astryxdesign|buttonVariants|Admin[A-Z]/);
});

test("both adapters implement every facade family and use real renderer primitives", () => {
  const current = read("src/components/brp-ui/current-adapter.tsx");
  const astryx = read("src/components/brp-ui/astryx-adapter.tsx");
  const provider = read("src/components/brp-ui/brp-ui-provider.tsx");
  const currentProvider = read("src/components/brp-ui/current-brp-ui-provider.tsx");
  const astryxProvider = read("src/components/brp-ui/astryx-brp-ui-provider.tsx");

  for (const family of facadeFamilies) {
    assert.match(current, new RegExp(`${family}:`));
    assert.match(astryx, new RegExp(`${family}:`));
  }
  assert.match(current, /@\/components\/ui\/button/);
  for (const subpath of [
    "Button",
    "IconButton",
    "TextInput",
    "Selector",
    "Switch",
    "TabList",
    "SegmentedControl",
    "Toolbar",
    "Card",
    "Badge",
    "StatusDot",
    "Table",
    "Dialog",
    "AlertDialog",
    "MoreMenu",
    "Popover",
    "EmptyState",
    "Skeleton",
  ]) {
    assert.match(astryx, new RegExp(`@astryxdesign/core/${subpath}`));
  }
  assert.match(provider, /adapter: BrpUiAdapter/);
  assert.doesNotMatch(provider, /astryxAdapter|currentAdapter|@astryxdesign/);
  assert.match(currentProvider, /currentAdapter/);
  assert.doesNotMatch(currentProvider, /astryxAdapter|@astryxdesign/);
  assert.match(astryxProvider, /astryxAdapter/);
  assert.match(read("src/components/appearance/astryx-appearance-settings-view.tsx"), /AstryxBrpUiProvider/);
  assert.doesNotMatch(read("src/components/brp-ui/index.tsx"), /astryxAdapter|AstryxBrpUiProvider|@astryxdesign/);
});

test("the current adapter delegates overlays to accessible primitives and implements declared semantics", () => {
  const current = read("src/components/brp-ui/current-adapter.tsx");
  const astryx = read("src/components/brp-ui/astryx-adapter.tsx");

  for (const primitive of ["Dialog", "AlertDialog", "Menu", "Popover", "Combobox"]) {
    assert.match(current, new RegExp(`@base-ui/react/${primitive.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`).replace(/^-/, "")}`));
  }
  assert.doesNotMatch(current, /text-\$\{/);
  assert.match(current, /disabled=\{disabled\}/);
  assert.match(current, /tableAlignClasses/);
  assert.match(current, /dialogWidthClasses/);
  assert.match(astryx, /aria-labelledby=\{titleId\}/);
  assert.match(astryx, /__brpInternalRowId: row\.id/);
});

test("appearance is the first searchable settings section without changing diagnostics", () => {
  assertSettingsDataInvariants();
  assert.deepEqual(settingsSectionOrder, ["appearance", "workers", "queue", "database"]);
  assert.deepEqual(filterSettingsSections("оформлення"), ["appearance"]);
  assert.deepEqual(filterSettingsSections("Astryx"), ["appearance"]);
  assert.deepEqual(filterSettingsSections("темна"), ["appearance"]);
  assert.deepEqual(filterSettingsSections("воркер"), ["workers"]);
  assert.deepEqual(filterSettingsSections("черга"), ["queue"]);
  assert.deepEqual(filterSettingsSections("база"), ["database"]);
});
