export type RendererHarnessState = {
  query: string;
  category: "all" | "parts";
  sort: "name" | "date";
  page: number;
  selected: boolean;
  expanded: boolean;
};

export type RendererStateHarnessProps = {
  state: RendererHarnessState;
  onCategoryChange(category: RendererHarnessState["category"]): void;
  onExpandedChange(expanded: boolean): void;
  onPageChange(page: number): void;
  onQueryChange(query: string): void;
  onSelectedChange(selected: boolean): void;
  onSortChange(sort: RendererHarnessState["sort"]): void;
};

export const INITIAL_RENDERER_HARNESS_STATE: RendererHarnessState = {
  query: "",
  category: "all",
  sort: "name",
  page: 1,
  selected: false,
  expanded: true,
};
