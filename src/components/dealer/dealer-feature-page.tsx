"use client";

import { AccessoriesPage } from "./features/accessories-page";
import { BossWebPage } from "./features/bossweb-page";
import { SchedulePage } from "./features/schedule-page";
import {
  ConsignmentPage,
  DocumentsPage,
  DraftsPage,
  InventoryPage,
  NetworkPage,
  PartsReportPage,
  SettlementsPage,
  UnknownFeature,
} from "./features/secondary-data-pages";
import { UnitsPage } from "./features/units-page";
import { WorkshopPage } from "./features/workshop-page";

export function DealerFeaturePage({ feature }: { feature: string }) {
  switch (feature) {
    case "accessories": return <AccessoriesPage />;
    case "units": return <UnitsPage />;
    case "schedule": return <SchedulePage />;
    case "bossweb": return <BossWebPage />;
    case "workshop": return <WorkshopPage />;
    case "documents": return <DocumentsPage />;
    case "order-drafts": return <DraftsPage />;
    case "consignment": return <ConsignmentPage />;
    case "settlements": return <SettlementsPage />;
    case "parts-inventory": return <InventoryPage />;
    case "network": return <NetworkPage />;
    case "parts-report": return <PartsReportPage />;
    default: return <UnknownFeature feature={feature} />;
  }
}
