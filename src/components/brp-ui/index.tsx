"use client";

import {
  createElement,
  type ComponentType,
  type RefAttributes,
} from "react";
import {useBrpUi} from "./brp-ui-provider";
import type {
  BrpAlertDialogProps,
  BrpBadgeProps,
  BrpButtonProps,
  BrpCardProps,
  BrpDialogProps,
  BrpEmptyStateProps,
  BrpIconButtonProps,
  BrpMoreMenuProps,
  BrpPopoverProps,
  BrpSegmentedControlProps,
  BrpSelectProps,
  BrpSkeletonProps,
  BrpStatusDotProps,
  BrpSwitchProps,
  BrpTableProps,
  BrpTabsProps,
  BrpTextInputProps,
  BrpToolbarProps,
  BrpUiAdapter,
} from "./contracts";

function facade<Props extends object>(key: keyof BrpUiAdapter) {
  return function BrpFacade(props: Props) {
    const adapter = useBrpUi();
    const Component = adapter[key] as ComponentType<Props>;
    return createElement(Component, props);
  };
}

function refFacade<Props extends object, Element extends HTMLElement>(
  key: keyof BrpUiAdapter,
): ComponentType<Props & RefAttributes<Element>> {
  return function BrpRefFacade(props: Props & RefAttributes<Element>) {
    const adapter = useBrpUi();
    const Component = adapter[key] as ComponentType<Props & RefAttributes<Element>>;
    return createElement(Component, props);
  };
}

export const BrpButton = refFacade<BrpButtonProps, HTMLButtonElement>("BrpButton");
export const BrpIconButton = refFacade<BrpIconButtonProps, HTMLButtonElement>("BrpIconButton");
export const BrpTextInput = refFacade<BrpTextInputProps, HTMLInputElement>("BrpTextInput");
export const BrpSelect = facade<BrpSelectProps>("BrpSelect");
export const BrpSwitch = refFacade<BrpSwitchProps, HTMLInputElement>("BrpSwitch");
export const BrpTabs = refFacade<BrpTabsProps, HTMLElement>("BrpTabs");
export const BrpSegmentedControl = refFacade<BrpSegmentedControlProps, HTMLDivElement>("BrpSegmentedControl");
export const BrpToolbar = refFacade<BrpToolbarProps, HTMLDivElement>("BrpToolbar");
export const BrpCard = facade<BrpCardProps>("BrpCard");
export const BrpBadge = facade<BrpBadgeProps>("BrpBadge");
export const BrpStatusDot = facade<BrpStatusDotProps>("BrpStatusDot");
export const BrpTable = facade<BrpTableProps>("BrpTable");
export const BrpDialog = facade<BrpDialogProps>("BrpDialog");
export const BrpAlertDialog = facade<BrpAlertDialogProps>("BrpAlertDialog");
export const BrpMoreMenu = refFacade<BrpMoreMenuProps, HTMLButtonElement>("BrpMoreMenu");
export const BrpPopover = facade<BrpPopoverProps>("BrpPopover");
export const BrpEmptyState = facade<BrpEmptyStateProps>("BrpEmptyState");
export const BrpSkeleton = facade<BrpSkeletonProps>("BrpSkeleton");

export {BrpUiProvider, useBrpUi} from "./brp-ui-provider";
export type * from "./contracts";
