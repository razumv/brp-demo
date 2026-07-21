import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { loginAsDealer, openDealerRoute } from "./support/dealer-session";

const featureModules = [
  "accessories-page.tsx",
  "bossweb-page.tsx",
  "feature-frame.tsx",
  "schedule-page.tsx",
  "secondary-data-pages.tsx",
  "units-page.tsx",
  "workshop-page.tsx",
] as const;

const dealerFeatureRoutes = [
  { path: "/dealer/accessories", heading: "Каталог аксесуарів" },
  { path: "/dealer/units", heading: "Техніка" },
  { path: "/dealer/schedule", heading: "Графік поставки" },
  { path: "/dealer/bossweb", heading: "Пошук запчастин" },
  { path: "/dealer/workshop", heading: "Майстерня" },
  { path: "/dealer/documents", heading: "Документи" },
  { path: "/dealer/order-drafts", heading: "Чернетки" },
  { path: "/dealer/consignment", heading: "Консигнація" },
  { path: "/dealer/settlements", heading: "Взаєморозрахунки" },
  { path: "/dealer/parts-inventory", heading: "Запчастини" },
  { path: "/dealer/network", heading: "Дилерська мережа" },
  { path: "/dealer/parts-report", heading: "Звіт ЗЧ" },
] as const;

test("split dealer feature routes retain their visible headings", async ({ page }) => {
  for (const moduleName of featureModules) {
    const modulePath = resolve(process.cwd(), "src/components/dealer/features", moduleName);
    expect(existsSync(modulePath), `${moduleName} should own its dealer feature boundary`).toBeTruthy();
  }

  await loginAsDealer(page);

  for (const route of dealerFeatureRoutes) {
    await openDealerRoute(page, route.path, route.heading);
  }
});
