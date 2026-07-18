import { CatalogRouter } from "@/components/catalog/catalog-router";
import { AppShell } from "@/components/shell/app-shell";
import { RoleGate } from "@/components/shell/role-gate";
import { CATALOG_IDS, catalogBrands } from "@/lib/mock-data";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug?: string[] }> {
  return [
    { slug: undefined },
    ...catalogBrands.map((brand) => ({ slug: [brand.code] })),
    { slug: [CATALOG_IDS.brand, "sxs"] },
    { slug: [CATALOG_IDS.brand, CATALOG_IDS.category] },
    { slug: [CATALOG_IDS.brand, CATALOG_IDS.series] },
    { slug: [CATALOG_IDS.brand, CATALOG_IDS.model] },
    { slug: [CATALOG_IDS.brand, CATALOG_IDS.configuration] },
    { slug: [CATALOG_IDS.brand, CATALOG_IDS.diagram] },
  ];
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const standalone = slug.at(-1) === CATALOG_IDS.diagram;

  if (standalone) {
    return (
      <RoleGate role="dealer">
        <CatalogRouter slug={slug} />
      </RoleGate>
    );
  }

  return (
    <AppShell role="dealer">
      <CatalogRouter slug={slug} />
    </AppShell>
  );
}
