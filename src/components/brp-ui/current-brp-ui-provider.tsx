"use client";

import type {ReactNode} from "react";
import {BrpUiProvider} from "./brp-ui-provider";
import {currentAdapter} from "./current-adapter";

export function CurrentBrpUiProvider({children}: {children: ReactNode}) {
  return <BrpUiProvider adapter={currentAdapter}>{children}</BrpUiProvider>;
}
