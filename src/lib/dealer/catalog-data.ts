export type CatalogKind = "category" | "year" | "series" | "model" | "diagram";

export type CatalogNode<TKind extends CatalogKind, TChild = never> = Readonly<{
  id: string;
  kind: TKind;
  label: string;
  href?: string;
  children?: readonly TChild[];
}>;

export type DiagramNode = CatalogNode<"diagram">;
export type ModelNode = CatalogNode<"model", DiagramNode>;
export type SeriesNode = CatalogNode<"series", ModelNode>;
export type YearNode = CatalogNode<"year", SeriesNode>;
export type CategoryNode = CatalogNode<"category", YearNode>;
export type DealerCatalogNode = CategoryNode | YearNode | SeriesNode | ModelNode | DiagramNode;

export type CatalogSelectionInput = Readonly<{
  year?: string | null;
  series?: string | null;
  model?: string | null;
  diagram?: string | null;
}>;

export type ResolvedCatalogSelection = Readonly<{
  category?: CategoryNode;
  year?: YearNode;
  series?: SeriesNode;
  model?: ModelNode;
  diagram?: DiagramNode;
  path: readonly DealerCatalogNode[];
}>;

export const catalogDiagramThumbnails: Readonly<Record<string, string>> = {
  "00- Service - Maintenance Parts & Fluids": "/images/catalog/maintenance-diagram-source.png",
};

export function filterDiagramNames(
  diagrams: readonly string[],
  query: string,
): readonly string[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
  if (!normalizedQuery) return diagrams;
  return diagrams.filter((diagram) => (
    diagram.toLocaleLowerCase("en-US").includes(normalizedQuery)
  ));
}

const sourceDiagramLabels = [
  "00- Model Numbers",
  "01- Rotax - Air Intake Manifold And Throttle Body",
  "01- Rotax - Crankcase",
  "01- Rotax - Crankshaft, Piston And Cylinder",
  "01- Rotax - Cylinder Head, Front",
  "01- Rotax - Cylinder Head, Rear",
  "01- Rotax - Drive Shaft",
  "01- Rotax - Engine Cooling",
  "01- Rotax - Engine Harness And Electronic Module",
  "01- Rotax - Engine Lubrication",
  "01- Rotax - Gear Box 1",
  "01- Rotax - Gear Box 2 - 795",
  "01- Rotax - Gear Box And Components - 795",
  "01- Rotax - Magneto And Electric Starter",
  "01- Rotax - Transmission",
  "02- Engine - Air Intake",
  "02- Engine - Cooling",
  "02- Engine - Exhaust",
  "02- Engine - Fuel - EVAP System",
  "02- Engine - Fuel - NO EVAP System",
  "02- Engine - System",
  "03- Mechanic - Brakes",
  "03- Mechanic - Steering",
  "04- Drive - Front Section - Common Parts",
] as const;

const sourceDiagrams: readonly DiagramNode[] = sourceDiagramLabels.map((label, index) => ({
  id: `diagram-${String(index).padStart(2, "0")}`,
  kind: "diagram",
  label,
}));

const sxs2021Series: readonly SeriesNode[] = [
  { id: "001", kind: "series", label: "001 - SSV - North America - Commander Series" },
  { id: "002", kind: "series", label: "002 - SSV - North America - Defender Series" },
  { id: "003", kind: "series", label: "003 - SSV - North America - Maverick Series" },
  { id: "004", kind: "series", label: "004 - SSV - North America - Maverick Sport Series" },
  {
    id: "005",
    kind: "series",
    label: "005 - SSV - North America - Maverick Trail Series",
    children: [
      {
        id: "001",
        kind: "model",
        label: "001 - Maverick Trail 800 - BASE_DPS - North America, 2021",
        children: [],
      },
      {
        id: "002",
        kind: "model",
        label: "002 - Maverick Trail 1000 - BASE_DPS - North America, 2021",
        children: sourceDiagrams,
      },
    ],
  },
  { id: "006", kind: "series", label: "006 - SSV - International - Commander Series" },
  { id: "007", kind: "series", label: "007 - SSV - International - Defender Series" },
  { id: "008", kind: "series", label: "008 - SSV - International - Maverick Series" },
  { id: "009", kind: "series", label: "009 - SSV - International - Maverick Sport Series" },
  { id: "010", kind: "series", label: "010 - SSV - International - Maverick Trail Series" },
  {
    id: "011",
    kind: "series",
    label: "011 - SSV - CE - Traxter Series",
    children: [],
  },
  { id: "012", kind: "series", label: "012 - SSV - CE - Maverick Series" },
  { id: "013", kind: "series", label: "013 - SSV - CE - Maverick Sport Series" },
  { id: "014", kind: "series", label: "014 - SSV - T Series - Traxter Series" },
  { id: "015", kind: "series", label: "015 - SSV - T Series - Maverick Sport Series" },
  { id: "016", kind: "series", label: "016 - SSV - T Series - Maverick Trail Series" },
];

const sxsYears: readonly YearNode[] = Array.from({ length: 16 }, (_, index) => {
  const id = String(2026 - index);
  return {
    id,
    kind: "year",
    label: id,
    ...(id === "2021" ? { children: sxs2021Series } : {}),
  };
});

export const dealerCatalogCascade: readonly CategoryNode[] = [
  {
    id: "atv",
    kind: "category",
    label: "Can-Am ATV",
    href: "/catalog/CAN_OFF_EN_US/7560bdc0-e7f3-4d84-9812-b8ecb55d948a",
  },
  {
    id: "sxs",
    kind: "category",
    label: "Can-Am SXS",
    href: "/catalog/CAN_OFF_EN_US/sxs",
    children: sxsYears,
  },
];

const defaultSxsSelection = {
  year: "2021",
  series: "005",
  model: "002",
} as const;

export function resolveCatalogSelection(
  categoryId: string,
  input: CatalogSelectionInput,
): ResolvedCatalogSelection {
  const category = dealerCatalogCascade.find((node) => node.id === categoryId);
  if (!category) return { path: [] };

  const useSourceDefault = categoryId === "sxs"
    && !input.year
    && !input.series
    && !input.model
    && !input.diagram;
  const requested: CatalogSelectionInput = useSourceDefault ? defaultSxsSelection : input;
  const year = category.children?.find((node) => node.id === requested.year);
  const series = year?.children?.find((node) => node.id === requested.series);
  const model = series?.children?.find((node) => node.id === requested.model);
  const diagram = model?.children?.find((node) => node.id === requested.diagram);
  const path: DealerCatalogNode[] = [category];

  if (year) path.push(year);
  if (series) path.push(series);
  if (model) path.push(model);
  if (diagram) path.push(diagram);

  return { category, year, series, model, diagram, path };
}
