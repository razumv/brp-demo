import { expect, test } from "@playwright/test";
import {
  ACCESSORY_PRODUCTS,
  accessoryVehicleOptions,
  filterAccessories,
  updateAccessoryVehicleFilter,
  type AccessoryFilters,
} from "@/lib/dealer/accessories-data";
import { getPart, parts } from "@/lib/mock-data";

const defaults: AccessoryFilters = {
  family: "all",
  category: "all",
  year: "all",
  model: "all",
  trim: "all",
  engine: "all",
  compatibility: [],
  purposes: [],
  query: "",
  stock: "all",
  sort: "featured",
};

test("every accessories control filters or sorts the same typed records", () => {
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, family: "Sea-Doo" }).map((item) => item.sku))
    .toEqual(["295100835"]);
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, year: "2024" }).map((item) => item.sku))
    .not.toContain("929085");
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, compatibility: ["Outlander"] }).map((item) => item.sku))
    .toContain("929085");
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, purposes: ["Maintenance"] }).map((item) => item.sku))
    .toEqual(["9779150"]);
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, query: "9290850090" }).map((item) => item.sku))
    .toEqual(["929085"]);
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, stock: "under-order" }).map((item) => item.sku))
    .toEqual(["715001734"]);
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, sort: "price-asc" })[0]?.sku)
    .toBe("9779150");
  expect(filterAccessories(ACCESSORY_PRODUCTS, { ...defaults, sort: "price-desc" })[0]?.sku)
    .toBe("715001734");
});

test("family and product category compose without treating category as a family", () => {
  const advex = ACCESSORY_PRODUCTS[0]!;
  const crossFamilyLighting = [
    advex,
    {
      ...advex,
      id: "sea-doo-lighting",
      sku: "295100836",
      activeReplacementNumber: "295100836",
      title: "Sea-Doo Lighting Fixture",
      family: "Sea-Doo" as const,
      compatibility: ["Sea-Doo" as const],
      fitments: [
        { year: "2026", model: "GTX" as const, trim: "GTX Limited" as const, engine: "Rotax 1630 ACE" as const },
      ],
      featuredRank: 2,
    },
  ];
  const categoryOnly = { ...defaults, category: "Lighting" as const };
  const familyAndCategory = {
    ...defaults,
    family: "Can-Am Off-Road" as const,
    category: "Lighting" as const,
  };

  expect(filterAccessories(crossFamilyLighting, categoryOnly).map((item) => item.sku))
    .toEqual(["929085", "295100836"]);
  expect(categoryOnly.family).toBe("all");
  expect(filterAccessories(crossFamilyLighting, familyAndCategory).map((item) => item.sku))
    .toEqual(["929085"]);
});

test("vehicle fitment groups compose with product and checkbox facets", () => {
  expect(filterAccessories(ACCESSORY_PRODUCTS, {
    ...defaults,
    year: "2026",
    model: "Outlander",
    trim: "MAX XT",
    engine: "Rotax 1000R",
  }).map((item) => item.sku)).toContain("929085");

  expect(filterAccessories(ACCESSORY_PRODUCTS, {
    ...defaults,
    compatibility: ["Outlander", "Sea-Doo"],
    purposes: ["Utility", "Storage"],
  }).map((item) => item.sku)).toEqual([
    "929085",
    "715007358",
    "295100835",
    "715001734",
  ]);
  expect(filterAccessories(ACCESSORY_PRODUCTS, {
    ...defaults,
    compatibility: ["Outlander", "Sea-Doo"],
    purposes: ["Maintenance"],
  }).map((item) => item.sku)).toEqual(["9779150"]);
});

test("vehicle option cascade excludes descendants outside selected ancestors", () => {
  const options = accessoryVehicleOptions(ACCESSORY_PRODUCTS, {
    ...defaults,
    year: "2026",
    model: "Outlander",
  });

  expect(options.models).toContain("Outlander");
  expect(options.models).not.toContain("Sea-Doo");
  expect(options.trims).toContain("MAX XT");
  expect(options.trims).not.toContain("GTX Limited");
  expect(options.engines).toEqual([]);
});

test("changing a vehicle ancestor clears each invalid descendant", () => {
  const selected: AccessoryFilters = {
    ...defaults,
    year: "2026",
    model: "Outlander",
    trim: "MAX XT",
    engine: "Rotax 1000R",
  };

  expect(updateAccessoryVehicleFilter(selected, { year: "2025" })).toMatchObject({
    year: "2025",
    model: "all",
    trim: "all",
    engine: "all",
  });
  expect(updateAccessoryVehicleFilter(selected, { model: "Defender" })).toMatchObject({
    year: "2026",
    model: "Defender",
    trim: "all",
    engine: "all",
  });
  expect(updateAccessoryVehicleFilter(selected, { trim: "DPS" })).toMatchObject({
    year: "2026",
    model: "Outlander",
    trim: "DPS",
    engine: "all",
  });
});

test("Advex is a hidden cart-only resolver entry and never expands public parts", () => {
  expect(parts).toHaveLength(17);
  expect(parts.some((part) => part.number === "929085")).toBe(false);
  expect(getPart("929085")).toEqual(expect.objectContaining({
    number: "929085",
    description: "Advex Helmet LED Utility Light",
    dealerPrice: 92.59,
    stock: 1,
    supersededBy: "9290850090",
  }));
});
