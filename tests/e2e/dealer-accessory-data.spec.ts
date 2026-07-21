import { expect, test } from "@playwright/test";
import {
  ACCESSORY_PRODUCTS,
  filterAccessories,
  type AccessoryFilters,
} from "@/lib/dealer/accessories-data";
import { getPart, parts } from "@/lib/mock-data";

const defaults: AccessoryFilters = {
  family: "all",
  year: "all",
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
