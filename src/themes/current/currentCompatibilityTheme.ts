import { defineTheme } from "@astryxdesign/core/theme";

/** Keeps the future stable Astryx provider mounted for the current renderer. */
export const currentCompatibilityTheme = defineTheme({
  name: "brp-current-compatibility",
  typography: {
    body: {
      family: "Inter",
      fallbacks: "ui-sans-serif, system-ui, sans-serif",
    },
    heading: {
      family: "Inter",
      fallbacks: "ui-sans-serif, system-ui, sans-serif",
    },
    code: {
      family: "ui-monospace",
      fallbacks: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
  },
});
