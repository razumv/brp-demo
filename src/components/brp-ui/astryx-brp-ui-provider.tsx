"use client";

import type {ReactNode} from "react";
import {BrpUiProvider} from "./brp-ui-provider";
import {astryxAdapter} from "./astryx-adapter";

export function AstryxBrpUiProvider({children}: {children: ReactNode}) {
  return <BrpUiProvider adapter={astryxAdapter}>{children}</BrpUiProvider>;
}
