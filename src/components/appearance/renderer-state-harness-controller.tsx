"use client";

import {useState} from "react";
import {
  INITIAL_RENDERER_HARNESS_STATE,
  type RendererHarnessState,
  type RendererStateHarnessProps,
} from "@/components/appearance/renderer-state-harness";
import {
  RendererViewSwitch,
  type AstryxRendererViewLoader,
} from "@/components/appearance/renderer-view-switch";
import type {RendererAtomicityProbeProps} from "@/components/appearance/renderer-atomicity-probe";

function CurrentRendererStateView({
  state,
  onCategoryChange,
  onExpandedChange,
  onPageChange,
  onQueryChange,
  onSelectedChange,
  onSortChange,
}: RendererStateHarnessProps) {
  return (
    <section data-testid="renderer-current-foundation-view">
      <label>
        Renderer query
        <input
          onChange={(event) => onQueryChange(event.target.value)}
          value={state.query}
        />
      </label>
      <label>
        Renderer category
        <select
          onChange={(event) => onCategoryChange(event.target.value as RendererHarnessState["category"])}
          value={state.category}
        >
          <option value="all">All</option>
          <option value="parts">Parts</option>
        </select>
      </label>
      <label>
        Renderer sort
        <select
          onChange={(event) => onSortChange(event.target.value as RendererHarnessState["sort"])}
          value={state.sort}
        >
          <option value="name">Name</option>
          <option value="date">Date</option>
        </select>
      </label>
      <button onClick={() => onPageChange(Math.max(1, state.page - 1))} type="button">
        Renderer previous page
      </button>
      <output aria-label="Renderer page">{state.page}</output>
      <button onClick={() => onPageChange(state.page + 1)} type="button">
        Renderer next page
      </button>
      <label>
        <input
          checked={state.selected}
          onChange={(event) => onSelectedChange(event.target.checked)}
          type="checkbox"
        />
        Renderer selected
      </label>
      <button onClick={() => onExpandedChange(!state.expanded)} type="button">
        {state.expanded ? "Collapse renderer details" : "Expand renderer details"}
      </button>
      {state.expanded ? <p data-testid="renderer-details">Renderer details</p> : null}
    </section>
  );
}

export function RendererStateHarnessController({
  loadAstryxView,
  loadSecondaryAstryxView,
}: {
  loadAstryxView: AstryxRendererViewLoader<RendererStateHarnessProps>;
  loadSecondaryAstryxView?: AstryxRendererViewLoader<RendererAtomicityProbeProps>;
}) {
  const [state, setState] = useState(INITIAL_RENDERER_HARNESS_STATE);
  const viewProps: RendererStateHarnessProps = {
    state,
    onCategoryChange: (category) => setState((current) => ({...current, category})),
    onExpandedChange: (expanded) => setState((current) => ({...current, expanded})),
    onPageChange: (page) => setState((current) => ({...current, page})),
    onQueryChange: (query) => setState((current) => ({...current, query})),
    onSelectedChange: (selected) => setState((current) => ({...current, selected})),
    onSortChange: (sort) => setState((current) => ({...current, sort})),
  };

  return (
    <>
      <RendererViewSwitch
        astryxViewProps={viewProps}
        currentView={<CurrentRendererStateView {...viewProps} />}
        loadAstryxView={loadAstryxView}
        slotId="astryx-foundation-probe"
      />
      {loadSecondaryAstryxView ? (
        <RendererViewSwitch
          astryxViewProps={{label: "Secondary renderer slot"}}
          currentView={(
            <section data-testid="renderer-secondary-current-view">
              Secondary current renderer slot
            </section>
          )}
          loadAstryxView={loadSecondaryAstryxView}
          slotId="astryx-foundation-secondary-probe"
        />
      ) : null}
    </>
  );
}
