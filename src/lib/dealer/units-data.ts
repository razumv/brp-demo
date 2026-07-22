import { normalizeDealerSearch } from "@/lib/dealer/format";

export type DealerUnitStage = "incoming" | "stock" | "sold";
export type DealerUnitTab = "summary" | DealerUnitStage;
export type DealerUnitShipmentStatus = "in_transit" | "at_warehouse" | "sold";
export type DealerUnitShipmentAction = "free_stock" | "awaiting_registration";
export type DealerUnitActionFilter = "all" | DealerUnitShipmentAction;
export type DealerUnitRowStatus = "free_stock" | "awaiting_registration";

export type DealerUnitRecord = Readonly<{
  id: string;
  number: number;
  model: string;
  sku: string;
  year: number;
  vin: string | null;
  status: DealerUnitRowStatus;
  action: "none";
}>;

export type DealerUnitShipment = Readonly<{
  id: string;
  container: string;
  bl: string;
  proforma: string;
  eta: string;
  route: string;
  assignedUnits: number;
  totalUnits: number;
  readyToReceiveUnits: number;
  awaitingRegistrationUnits: number;
  acceptedUnits: number;
  stage: DealerUnitStage;
  status: DealerUnitShipmentStatus;
  action: DealerUnitShipmentAction;
  units: readonly DealerUnitRecord[];
}>;

export type DealerUnitCounts = Readonly<{
  shipments: number;
  all: number;
  incoming: number;
  stock: number;
  sold: number;
  readyToReceive: number;
  awaitingRegistration: number;
  accepted: number;
  owned: number;
}>;

export type DealerUnitQuery = Readonly<{
  tab: DealerUnitTab;
  query: string;
  action: DealerUnitActionFilter;
}>;

const incomingDefaults = {
  readyToReceiveUnits: 0,
  acceptedUnits: 0,
  stage: "incoming",
  status: "in_transit",
  route: "—",
} as const;

export const dealerUnitShipments = [
  {
    ...incomingDefaults,
    id: "HAMU4124410:260101582",
    container: "HAMU4124410",
    bl: "260101582",
    proforma: "1032132118",
    eta: "May 11",
    assignedUnits: 1,
    totalUnits: 4,
    awaitingRegistrationUnits: 1,
    action: "free_stock",
    units: [
      { id: "HAMU4124410-H7TD", number: 1, model: "RD SPYDER F3 LTD 1330 SE6 RD S", sku: "H7TD", year: 2026, vin: null, status: "free_stock", action: "none" },
      { id: "HAMU4124410-J3TB", number: 2, model: "RD CANYON REDR 1330 SE6 GN EU", sku: "J3TB", year: 2026, vin: null, status: "free_stock", action: "none" },
      { id: "HAMU4124410-G1TC", number: 3, model: "RD SPYDER RT LTD 1330 SE6 BK D", sku: "G1TC", year: 2026, vin: null, status: "free_stock", action: "none" },
      { id: "HAMU4124410-H9TC", number: 4, model: "RD SPYDER F3 LTD 1330 SE6 WH E", sku: "H9TC", year: 2026, vin: null, status: "free_stock", action: "none" },
    ],
  },
  {
    ...incomingDefaults,
    id: "FANU1099065:262101511",
    container: "FANU1099065",
    bl: "262101511",
    proforma: "1032132384",
    eta: "May 25",
    assignedUnits: 1,
    totalUnits: 10,
    awaitingRegistrationUnits: 1,
    action: "free_stock",
    units: [{ id: "FANU1099065-26TR", number: 1, model: "GTX Limited 325 - Teal Metallic", sku: "26TR", year: 2026, vin: null, status: "free_stock", action: "none" }],
  },
  {
    ...incomingDefaults,
    id: "CAAU9339653:262102090",
    container: "CAAU9339653",
    bl: "262102090",
    proforma: "1032132452",
    eta: "May 25",
    assignedUnits: 1,
    totalUnits: 10,
    awaitingRegistrationUnits: 1,
    action: "free_stock",
    units: [{ id: "CAAU9339653-25BT", number: 1, model: "OUTLANDER MAX LTD 1000R", sku: "25BT", year: 2026, vin: null, status: "free_stock", action: "none" }],
  },
  {
    ...incomingDefaults,
    id: "FANU1882023:262102090",
    container: "FANU1882023",
    bl: "262102090",
    proforma: "1032131988",
    eta: "May 25",
    assignedUnits: 1,
    totalUnits: 6,
    awaitingRegistrationUnits: 1,
    action: "free_stock",
    units: [{ id: "FANU1882023-13TB", number: 1, model: "Wake PRO 230 - Sand / Dazzling Blue", sku: "13TB", year: 2026, vin: null, status: "free_stock", action: "none" }],
  },
  {
    ...incomingDefaults,
    id: "FFAU6292730:262101576",
    container: "FFAU6292730",
    bl: "262101576",
    proforma: "1032131844",
    eta: "May 25",
    assignedUnits: 2,
    totalUnits: 12,
    awaitingRegistrationUnits: 2,
    action: "awaiting_registration",
    units: [
      { id: "FFAU6292730-28TD", number: 1, model: "DEFENDER MAX LIMITED HD11", sku: "28TD", year: 2026, vin: null, status: "awaiting_registration", action: "none" },
      { id: "FFAU6292730-26BC", number: 2, model: "RENEGADE X XC 110 EFI", sku: "26BC", year: 2026, vin: null, status: "awaiting_registration", action: "none" },
    ],
  },
  {
    ...incomingDefaults,
    id: "TRHU8844218:262101576",
    container: "TRHU8844218",
    bl: "262101576",
    proforma: "1032131844",
    eta: "May 25",
    assignedUnits: 1,
    totalUnits: 14,
    awaitingRegistrationUnits: 1,
    action: "awaiting_registration",
    units: [{ id: "TRHU8844218-25TB", number: 1, model: "GTX PRO 130 - White / Neo Mint", sku: "25TB", year: 2026, vin: "YDV26TR000001", status: "awaiting_registration", action: "none" }],
  },
  ...[
    ["MSCU4827710", "262101610", "1032132901", "PWC RXT 325", "22TF"],
    ["TLLU5912348", "262101611", "1032132902", "OUTLANDER XT 850", "24BE"],
    ["OOLU7319452", "262101612", "1032132903", "MAVERICK X3 MAX", "27TC"],
    ["HLXU3297614", "262101613", "1032132904", "DEFENDER HD10", "28TD"],
    ["CMAU5821640", "262101614", "1032132905", "SPYDER RT LIMITED", "G1TC"],
    ["TEMU7482135", "262101615", "1032132906", "SPARK TRIXX 90", "66TD"],
  ].map(([container, bl, proforma, model, sku], index) => ({
    ...incomingDefaults,
    id: `${container}:${bl}`,
    container,
    bl,
    proforma,
    eta: "May 25",
    assignedUnits: 1,
    totalUnits: 6 + index,
    awaitingRegistrationUnits: 1,
    action: "awaiting_registration" as const,
    units: [{ id: `${container}-${sku}`, number: 1, model, sku, year: 2026, vin: null, status: "awaiting_registration" as const, action: "none" as const }],
  })),
  ...[
    ["SEGU4129056", "262101616", "1032132907"],
    ["UETU6391742", "262101617", "1032132908"],
    ["MRKU7284519", "262101618", "1032132909"],
  ].map(([container, bl, proforma], index) => ({
    ...incomingDefaults,
    id: `${container}:${bl}`,
    container,
    bl,
    proforma,
    eta: "May 25",
    assignedUnits: 0,
    totalUnits: 4 + index,
    awaitingRegistrationUnits: 0,
    action: "free_stock" as const,
    units: [],
  })),
] satisfies readonly DealerUnitShipment[];

export function filterDealerUnitShipments(
  shipments: readonly DealerUnitShipment[],
  input: DealerUnitQuery,
) {
  const query = normalizeDealerSearch(input.query);

  return shipments.filter((shipment) => {
    if (input.tab !== "summary" && shipment.stage !== input.tab) return false;
    if (input.action !== "all" && shipment.action !== input.action) return false;
    if (!query) return true;

    return [
      shipment.container,
      shipment.bl,
      ...shipment.units.flatMap((unit) => [unit.model, unit.sku, unit.vin ?? ""]),
    ].some((value) => normalizeDealerSearch(value).includes(query));
  });
}

export function getDealerUnitCounts(shipments: readonly DealerUnitShipment[]): DealerUnitCounts {
  const sumAssigned = (stage?: DealerUnitStage) => shipments.reduce(
    (total, shipment) => total + (!stage || shipment.stage === stage ? shipment.assignedUnits : 0),
    0,
  );

  return {
    shipments: shipments.length,
    all: sumAssigned(),
    incoming: sumAssigned("incoming"),
    stock: sumAssigned("stock"),
    sold: sumAssigned("sold"),
    readyToReceive: shipments.reduce((total, shipment) => total + shipment.readyToReceiveUnits, 0),
    awaitingRegistration: shipments.reduce((total, shipment) => total + shipment.awaitingRegistrationUnits, 0),
    accepted: shipments.reduce((total, shipment) => total + shipment.acceptedUnits, 0),
    owned: sumAssigned(),
  };
}
