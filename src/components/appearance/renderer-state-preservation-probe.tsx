"use client";

import {useLayoutEffect} from "react";
import {Button} from "@astryxdesign/core/Button";
import {Card} from "@astryxdesign/core/Card";
import {Link} from "@astryxdesign/core/Link";
import {proportional, Table} from "@astryxdesign/core/Table";
import {TextInput} from "@astryxdesign/core/TextInput";
import type {
  RendererHarnessState,
  RendererStateHarnessProps,
} from "@/components/appearance/renderer-state-harness";
import {useAppearance} from "@/components/appearance/use-appearance";
import type {AstryxRendererViewProps} from "@/components/appearance/renderer-view-switch";

const foundationRows = [{part: "Foundation row"}];
const foundationColumns = [{
  key: "part",
  header: "Foundation column",
  width: proportional(1),
}];

/**
 * Real, query-gated Astryx view used by the production foundation tests. Unlike a
 * readiness-only output, this branch mounts official interactive primitives and is the
 * visible slot whose commit permits the semantic renderer to advance.
 */
export function RendererStatePreservationProbe({
  state,
  onCategoryChange,
  onExpandedChange,
  onPageChange,
  onQueryChange,
  onSelectedChange,
  onSortChange,
  onReady,
}: RendererStateHarnessProps & AstryxRendererViewProps) {
  const appearance = useAppearance();
  if (new URLSearchParams(window.location.search).get("renderer-failure") === "render") {
    throw new Error("Injected Astryx lazy view render failure.");
  }

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(onReady);
    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <section
      data-color-mode={appearance.renderedColorMode}
      data-testid="renderer-state-preservation-probe"
    >
      <Button label="Foundation action" variant="primary" />
      <TextInput
        label="Renderer query"
        onChange={onQueryChange}
        value={state.query}
      />
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
      <Button
        label="Renderer previous page"
        onClick={() => onPageChange(Math.max(1, state.page - 1))}
      />
      <output aria-label="Renderer page">{state.page}</output>
      <Button label="Renderer next page" onClick={() => onPageChange(state.page + 1)} />
      <label>
        <input
          checked={state.selected}
          onChange={(event) => onSelectedChange(event.target.checked)}
          type="checkbox"
        />
        Renderer selected
      </label>
      <Button
        label={state.expanded ? "Collapse renderer details" : "Expand renderer details"}
        onClick={() => onExpandedChange(!state.expanded)}
      />
      {state.expanded ? <p data-testid="renderer-details">Renderer details</p> : null}
      <Card data-testid="astryx-foundation-card" padding={4}>
        {state.query || "Foundation card"}
      </Card>
      <Table columns={foundationColumns} data={foundationRows} />
      <Link href="/" label="Foundation link">
        Foundation link
      </Link>
    </section>
  );
}
