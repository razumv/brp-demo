"use client";

import {RendererViewSwitch} from "@/components/appearance/renderer-view-switch";
import {useAdminOrderPipelineController} from "./admin-order-pipeline-controller";
import {CurrentAdminOrderPipelineView} from "./current-admin-order-pipeline-view";

const loadAstryxAdminOrderPipelineView = () => import("./astryx-admin-order-pipeline-view")
  .then((module) => ({default: module.AstryxAdminOrderPipelineView}));

export function AdminOrderPipeline() {
  const model = useAdminOrderPipelineController();
  return (
    <RendererViewSwitch
      slotId="admin-order-pipeline"
      currentView={<CurrentAdminOrderPipelineView model={model} />}
      loadAstryxView={loadAstryxAdminOrderPipelineView}
      astryxViewProps={{model}}
    />
  );
}
