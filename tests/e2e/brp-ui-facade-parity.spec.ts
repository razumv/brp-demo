import {expect, test} from "@playwright/test";

test.skip(
  process.env.NEXT_PUBLIC_APPEARANCE_FOUNDATION_PROBE !== "1",
  "The facade parity probe is compiled only for its focused production regression suite.",
);

test("current and Astryx facade adapters preserve controlled behavior, semantics, refs, and overlay focus", async ({page}) => {
  await page.goto("/login?brp-ui-facade-probe=1", {waitUntil: "domcontentloaded"});
  await expect(page.getByTestId("brp-ui-facade-probe")).toBeVisible();

  for (const renderer of ["current", "astryx"] as const) {
    const probe = page.getByTestId(`${renderer}-facade-probe`);
    const state = page.getByTestId(`${renderer}-facade-state`);

    await probe.getByRole("button", {name: "Primary action"}).click();
    await expect(state).toContainText('"buttonPresses":1');
    await expect(state).toContainText('"buttonRef":"BUTTON"');
    await expect(probe.getByRole("button", {name: "Disabled action"})).toBeDisabled();
    await expect(state).toContainText('"disabledPresses":0');

    await probe.getByRole("button", {name: "Focus facade input"}).click();
    const input = probe.getByRole("textbox", {name: "Facade query"});
    await expect(input).toBeFocused();
    await input.fill("invalid");
    await expect(probe.getByText("Invalid facade query")).toBeVisible();
    await expect(state).toContainText('"inputRef":"INPUT"');

    const selector = renderer === "current"
      ? probe.getByRole("combobox", {name: "Facade selector"})
      : probe.getByRole("button", {name: "Facade selector"});
    await selector.click();
    const betaOption = page.getByRole("option", {name: "Beta"}).last();
    await betaOption.click();
    await expect(betaOption).toHaveCount(0);
    await expect(state).toContainText('"selectValue":"beta"');

    await probe.getByRole("switch", {name: "Facade switch"}).click();
    await expect(state).toContainText('"switchValue":true');
    const secondTab = renderer === "current"
      ? probe.getByRole("tab", {name: "Second"})
      : probe.getByRole("button", {name: "Second"});
    await secondTab.click();
    await expect(state).toContainText('"tabValue":"second"');
    await secondTab.press("ArrowRight");
    const thirdTab = renderer === "current"
      ? probe.getByRole("tab", {name: "Third"})
      : probe.getByRole("button", {name: "Third"});
    await expect(thirdTab).toBeFocused();
    await expect(state).toContainText('"tabValue":"second"');
    await thirdTab.press("Enter");
    await expect(state).toContainText('"tabValue":"third"');
    await thirdTab.press("Home");
    const firstTab = renderer === "current"
      ? probe.getByRole("tab", {name: "First"})
      : probe.getByRole("button", {name: "First"});
    await expect(firstTab).toBeFocused();
    await firstTab.press("End");
    await expect(thirdTab).toBeFocused();
    await expect(state).toContainText('"tabsRef":');
    await expect(state).toContainText('"toolbarRef":"DIV"');

    const firstSegments = probe.getByTestId(`${renderer}-first-duplicate-segments`);
    const secondSegments = probe.getByTestId(`${renderer}-second-duplicate-segments`);
    const firstAlpha = firstSegments.getByRole("radio", {name: "Alpha"});
    const secondBeta = secondSegments.getByRole("radio", {name: "Beta"});
    if (renderer === "current") {
      await secondBeta.check({force: true});
      await expect(firstAlpha).toBeChecked();
      await expect(secondBeta).toBeChecked();
    } else {
      await secondBeta.click();
      await expect(firstAlpha).toHaveAttribute("aria-checked", "true");
      await expect(secondBeta).toHaveAttribute("aria-checked", "true");
    }
    await expect(state).toContainText('"firstSegmentValue":"alpha"');
    await expect(state).toContainText('"secondSegmentValue":"beta"');

    const table = probe.getByRole("table", {name: "Facade table"});
    await expect(table.getByRole("columnheader", {name: "Visible ID"})).toBeVisible();
    await expect(table.getByRole("cell", {name: "visible-id"})).toBeVisible();

    const menuTrigger = probe.getByRole("button", {name: "Facade actions"});
    await menuTrigger.click();
    const menuItem = page.getByRole("menuitem", {name: "Choose item"});
    await menuItem.click();
    await expect(menuItem).toHaveCount(0);
    await expect(state).toContainText('"menuSelection":"chosen"');
    await menuTrigger.press("Enter");
    await expect(menuItem).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuItem).toHaveCount(0);
    await expect(menuTrigger).toBeFocused();
    await expect(state).toContainText('"menuRef":"BUTTON"');

    const popoverTrigger = probe.getByRole("button", {name: "Open popover"});
    await expect(popoverTrigger.locator("button")).toHaveCount(0);
    await popoverTrigger.click();
    const popoverAction = page.getByRole("button", {name: "Popover action"});
    await expect(popoverAction).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(popoverTrigger).toBeFocused();

    const infoDialogTrigger = probe.getByRole("button", {name: "Open info dialog"});
    await infoDialogTrigger.click();
    const infoDialog = page.getByRole("dialog", {name: "Facade dialog"});
    await expect(infoDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(infoDialog).toHaveCount(0);
    await expect(infoDialogTrigger).toBeFocused();

    await probe.getByRole("button", {name: "Open required dialog"}).press("Enter");
    const requiredDialog = page.getByRole("alertdialog", {name: "Required facade dialog"});
    await expect(requiredDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(requiredDialog).toBeVisible();
    await requiredDialog.getByRole("button", {name: "Complete required dialog"}).click();
    await expect(requiredDialog).toHaveCount(0);

    const alertTrigger = probe.getByRole("button", {name: "Open alert dialog"});
    await alertTrigger.press("Enter");
    const alert = page.getByRole("alertdialog", {name: "Facade alert"});
    await expect(alert.getByRole("button", {name: "Скасувати"})).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(alert).toHaveCount(0);
    await expect(alertTrigger).toBeFocused();
  }
});
