"use client";

import {
  useCallback,
  useState,
  type ComponentType,
  type ReactNode,
  type Ref,
} from "react";
import {Info, Search} from "lucide-react";
import {AstryxBrpUiProvider} from "@/components/brp-ui/astryx-brp-ui-provider";
import {CurrentBrpUiProvider} from "@/components/brp-ui/current-brp-ui-provider";
import {
  BrpAlertDialog,
  BrpButton,
  BrpDialog,
  BrpMoreMenu,
  BrpPopover,
  BrpSegmentedControl,
  BrpSelect,
  BrpSwitch,
  BrpTable,
  BrpTabs,
  BrpTextInput,
  BrpToolbar,
} from "@/components/brp-ui";

interface ProbeProviderProps {
  children: ReactNode;
}

function AdapterProbe({
  renderer,
  Provider,
}: {
  renderer: "current" | "astryx";
  Provider: ComponentType<ProbeProviderProps>;
}) {
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
  const [tabsElement, setTabsElement] = useState<HTMLElement | null>(null);
  const [toolbarElement, setToolbarElement] = useState<HTMLDivElement | null>(null);
  const [menuElement, setMenuElement] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useCallback((node: HTMLButtonElement | null) => setButtonElement(node), []);
  const inputRef = useCallback((node: HTMLInputElement | null) => setInputElement(node), []);
  const tabsRef = useCallback((node: HTMLElement | null) => setTabsElement(node), []);
  const toolbarRef = useCallback((node: HTMLDivElement | null) => setToolbarElement(node), []);
  const menuRef = useCallback((node: HTMLButtonElement | null) => setMenuElement(node), []);
  const [buttonPresses, setButtonPresses] = useState(0);
  const [disabledPresses, setDisabledPresses] = useState(0);
  const [query, setQuery] = useState("");
  const [selectValue, setSelectValue] = useState("alpha");
  const [switchValue, setSwitchValue] = useState(false);
  const [tabValue, setTabValue] = useState("first");
  const [firstSegmentValue, setFirstSegmentValue] = useState("alpha");
  const [secondSegmentValue, setSecondSegmentValue] = useState("alpha");
  const [menuSelection, setMenuSelection] = useState("none");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requiredDialogOpen, setRequiredDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <Provider>
      <section data-testid={`${renderer}-facade-probe`} aria-label={`${renderer} facade probe`}>
        <h2>{renderer}</h2>
        <BrpButton
          ref={buttonRef}
          label="Primary action"
          variant="primary"
          onPress={() => setButtonPresses((count) => count + 1)}
        />
        <BrpButton
          label="Disabled action"
          disabled
          onPress={() => setDisabledPresses((count) => count + 1)}
        />
        <button type="button" onClick={() => inputElement?.focus()}>Focus facade input</button>
        <BrpTextInput
          ref={inputRef}
          label="Facade query"
          value={query}
          onValueChange={setQuery}
          error={query === "invalid" ? "Invalid facade query" : undefined}
          leadingIcon={<Search aria-hidden="true" />}
          clearable
        />
        <BrpSelect
          label="Facade selector"
          value={selectValue}
          options={[
            {value: "alpha", label: "Alpha"},
            {value: "beta", label: "Beta"},
          ]}
          searchable
          onValueChange={setSelectValue}
        />
        <BrpSwitch label="Facade switch" checked={switchValue} onCheckedChange={setSwitchValue} />
        <BrpTabs
          ref={tabsRef}
          label="Facade tabs"
          value={tabValue}
          options={[
            {value: "first", label: "First"},
            {value: "second", label: "Second"},
            {value: "third", label: "Third"},
          ]}
          onValueChange={setTabValue}
          size="lg"
          fill
          divider
        />
        <div data-testid={`${renderer}-first-duplicate-segments`}>
          <BrpSegmentedControl
            label="Duplicate facade segments"
            value={firstSegmentValue}
            options={[
              {value: "alpha", label: "Alpha"},
              {value: "beta", label: "Beta"},
            ]}
            onValueChange={setFirstSegmentValue}
          />
        </div>
        <div data-testid={`${renderer}-second-duplicate-segments`}>
          <BrpSegmentedControl
            label="Duplicate facade segments"
            value={secondSegmentValue}
            options={[
              {value: "alpha", label: "Alpha"},
              {value: "beta", label: "Beta"},
            ]}
            onValueChange={setSecondSegmentValue}
          />
        </div>
        <BrpToolbar ref={toolbarRef} label="Facade toolbar" size="sm" start={<span>Start</span>} end={<span>End</span>} divided />
        <BrpTable
          label="Facade table"
          columns={[
            {key: "id", label: "Visible ID", align: "end", width: "compact"},
            {key: "name", label: "Name", width: "wide"},
          ]}
          rows={[{id: "internal-row-key", cells: {id: "visible-id", name: "Visible row"}}]}
          dividers="grid"
        />
        <BrpMoreMenu
          ref={menuRef}
          label="Facade actions"
          items={[{id: "choose", label: "Choose item", onSelect: () => setMenuSelection("chosen")}]}
        />
        <BrpPopover
          label="Facade popover"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          placement="after"
          renderTrigger={({ref, ...triggerProps}) => (
            <button type="button" {...triggerProps} ref={ref as Ref<HTMLButtonElement>}>Open popover</button>
          )}
          content={<button type="button">Popover action</button>}
        />
        <button type="button" onClick={() => setDialogOpen(true)}>Open info dialog</button>
        <BrpDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Facade dialog"
          description="Dialog description"
          width="sm"
        >
          <button type="button">Dialog action</button>
        </BrpDialog>
        <button type="button" onClick={() => setRequiredDialogOpen(true)}>Open required dialog</button>
        <BrpDialog
          open={requiredDialogOpen}
          onOpenChange={setRequiredDialogOpen}
          title="Required facade dialog"
          purpose="required"
        >
          <button type="button" onClick={() => setRequiredDialogOpen(false)}>Complete required dialog</button>
        </BrpDialog>
        <button type="button" onClick={() => setAlertOpen(true)}>Open alert dialog</button>
        <BrpAlertDialog
          open={alertOpen}
          onOpenChange={setAlertOpen}
          title="Facade alert"
          description="Confirm the facade action."
          actionLabel="Confirm"
          onAction={() => setAlertOpen(false)}
        />
        <output data-testid={`${renderer}-facade-state`}>
          {JSON.stringify({
            buttonPresses,
            disabledPresses,
            query,
            selectValue,
            switchValue,
            tabValue,
            firstSegmentValue,
            secondSegmentValue,
            menuSelection,
            buttonRef: buttonElement?.tagName ?? null,
            inputRef: inputElement?.tagName ?? null,
            tabsRef: tabsElement?.tagName ?? null,
            toolbarRef: toolbarElement?.tagName ?? null,
            menuRef: menuElement?.tagName ?? null,
          })}
        </output>
        <Info aria-hidden="true" />
      </section>
    </Provider>
  );
}

export default function BrpUiFacadeProbe() {
  return (
    <div data-testid="brp-ui-facade-probe">
      <AdapterProbe renderer="current" Provider={CurrentBrpUiProvider} />
      <AdapterProbe renderer="astryx" Provider={AstryxBrpUiProvider} />
    </div>
  );
}
