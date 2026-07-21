export type DealerUnitStage = "incoming" | "stock" | "sold";
export type DealerUnitTab = "summary" | DealerUnitStage;

export type DealerUnitRecord = Readonly<{
  id: string;
  container: string;
  bl: string;
  proforma: string;
  arrivalDate: string;
  route: string;
  model: string;
  sku: string;
  year: number;
  vin: string | null;
  engineNumber: string | null;
  stage: DealerUnitStage;
}>;

export type DealerUnitShipment = Readonly<{
  container: string;
  bl: string;
  proforma: string;
  arrivalDate: string;
  route: string;
  units: readonly DealerUnitRecord[];
}>;

export type DealerUnitCounts = Readonly<{
  all: number;
  incoming: number;
  stock: number;
  sold: number;
  readyToReceive: number;
  awaitingIdentifiers: number;
  containers: number;
}>;

export const dealerUnitRecords = [
  {
    id: "HAMU4124410-H7TD",
    container: "HAMU4124410",
    bl: "260101582",
    proforma: "1032132118",
    arrivalDate: "2026-07-28",
    route: "Роттердам → Гданськ",
    model: "RD SPYDER F3 LTD 1330 SE6 RD S",
    sku: "H7TD",
    year: 2026,
    vin: "2BXREDD27TV000101",
    engineNumber: "M101",
    stage: "incoming",
  },
  {
    id: "HAMU4124410-J3TB",
    container: "HAMU4124410",
    bl: "260101582",
    proforma: "1032132118",
    arrivalDate: "2026-07-28",
    route: "Роттердам → Гданськ",
    model: "RD CANYON REDR 1330 SE6 GN EU",
    sku: "J3TB",
    year: 2026,
    vin: "2BXREDD28TV000102",
    engineNumber: null,
    stage: "incoming",
  },
  {
    id: "HAMU4124410-G1TC",
    container: "HAMU4124410",
    bl: "260101582",
    proforma: "1032132118",
    arrivalDate: "2026-07-28",
    route: "Роттердам → Гданськ",
    model: "RD SPYDER RT LTD 1330 SE6 BK D",
    sku: "G1TC",
    year: 2026,
    vin: null,
    engineNumber: null,
    stage: "incoming",
  },
  {
    id: "HAMU4124410-H9TC",
    container: "HAMU4124410",
    bl: "260101582",
    proforma: "1032132118",
    arrivalDate: "2026-07-28",
    route: "Роттердам → Гданськ",
    model: "RD SPYDER F3 LTD 1330 SE6 WH E",
    sku: "H9TC",
    year: 2026,
    vin: null,
    engineNumber: null,
    stage: "incoming",
  },
  {
    id: "FANU1099065-26TR",
    container: "FANU1099065",
    bl: "262101511",
    proforma: "1032132384",
    arrivalDate: "2026-08-12",
    route: "Монреаль → Гданськ",
    model: "GTX Limited 325 - Teal Metallic",
    sku: "26TR",
    year: 2026,
    vin: "YDV26TR000001",
    engineNumber: "1630ACE-26001",
    stage: "incoming",
  },
  {
    id: "FANU1099065-23TB",
    container: "FANU1099065",
    bl: "262101511",
    proforma: "1032132384",
    arrivalDate: "2026-08-12",
    route: "Монреаль → Гданськ",
    model: "RXP X 325 - Gulfstream Blue Premium",
    sku: "23TB",
    year: 2026,
    vin: null,
    engineNumber: "1630ACE-26002",
    stage: "incoming",
  },
  {
    id: "FANU1099065-22TF",
    container: "FANU1099065",
    bl: "262101511",
    proforma: "1032132384",
    arrivalDate: "2026-08-12",
    route: "Монреаль → Гданськ",
    model: "RXT X 325 - Ice Metal / Manta Green",
    sku: "22TF",
    year: 2026,
    vin: null,
    engineNumber: null,
    stage: "incoming",
  },
  {
    id: "CAAU9339653-25BT",
    container: "CAAU9339653",
    bl: "262102090",
    proforma: "1032132452",
    arrivalDate: "2026-09-05",
    route: "Валькур → Гамбург",
    model: "OUTLANDER MAX LTD 1000R",
    sku: "25BT",
    year: 2026,
    vin: "3JBVXAV4XTK000201",
    engineNumber: "ROTAX-1000R-201",
    stage: "incoming",
  },
  {
    id: "CAAU9339653-27TC",
    container: "CAAU9339653",
    bl: "262102090",
    proforma: "1032132452",
    arrivalDate: "2026-09-05",
    route: "Валькур → Гамбург",
    model: "MAVERICK R X RS WITH SMART-SHOX",
    sku: "27TC",
    year: 2026,
    vin: null,
    engineNumber: null,
    stage: "incoming",
  },
  {
    id: "FANU1882023-13TB",
    container: "FANU1882023",
    bl: "262102091",
    proforma: "1032131988",
    arrivalDate: "2026-06-18",
    route: "Гданськ → Київ",
    model: "Wake PRO 230 - Sand / Dazzling Blue",
    sku: "13TB",
    year: 2026,
    vin: "YDV13TB000011",
    engineNumber: "1630ACE-25011",
    stage: "stock",
  },
  {
    id: "FANU1882023-25TB",
    container: "FANU1882023",
    bl: "262102091",
    proforma: "1032131988",
    arrivalDate: "2026-06-18",
    route: "Гданськ → Київ",
    model: "GTX PRO 130 (Rental) - White / Neo Mint",
    sku: "25TB",
    year: 2026,
    vin: "YDV25TB000012",
    engineNumber: "1630ACE-25012",
    stage: "stock",
  },
  {
    id: "FFAU6292730-28TD",
    container: "FFAU6292730",
    bl: "262101576",
    proforma: "1032131844",
    arrivalDate: "2026-05-25",
    route: "Гамбург → Київ",
    model: "DEFENDER MAX LIMITED HD11",
    sku: "28TD",
    year: 2026,
    vin: "3JBUKAX4XTK000301",
    engineNumber: "ROTAX-HD11-301",
    stage: "stock",
  },
  {
    id: "FFAU6292730-26BC",
    container: "FFAU6292730",
    bl: "262101576",
    proforma: "1032131844",
    arrivalDate: "2026-05-25",
    route: "Гамбург → Київ",
    model: "RENEGADE X XC 110 EFI",
    sku: "26BC",
    year: 2026,
    vin: "3JBVNAV2XTK000302",
    engineNumber: "ROTAX-110-302",
    stage: "sold",
  },
] as const satisfies readonly DealerUnitRecord[];

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("uk-UA");
}

export function filterDealerUnitRecords(
  records: readonly DealerUnitRecord[],
  tab: DealerUnitTab,
  query: string,
) {
  const normalizedQuery = normalizeSearchValue(query);

  return records.filter((record) => {
    if (tab !== "summary" && record.stage !== tab) return false;
    if (!normalizedQuery) return true;

    return [
      record.container,
      record.bl,
      record.model,
      record.sku,
      record.vin ?? "",
      record.engineNumber ?? "",
    ].some((value) => normalizeSearchValue(value).includes(normalizedQuery));
  });
}

export function groupDealerUnitRecords(records: readonly DealerUnitRecord[]): DealerUnitShipment[] {
  const groups = new Map<string, DealerUnitRecord[]>();

  for (const record of records) {
    const key = `${record.container}:${record.bl}`;
    const current = groups.get(key) ?? [];
    current.push(record);
    groups.set(key, current);
  }

  return Array.from(groups.values(), (units) => {
    const first = units[0];
    if (!first) throw new Error("A dealer unit shipment requires at least one unit.");
    return {
      container: first.container,
      bl: first.bl,
      proforma: first.proforma,
      arrivalDate: first.arrivalDate,
      route: first.route,
      units,
    };
  });
}

export function getDealerUnitCounts(records: readonly DealerUnitRecord[]): DealerUnitCounts {
  const incoming = records.filter((record) => record.stage === "incoming");
  const readyToReceive = incoming.filter((record) => record.vin && record.engineNumber).length;

  return {
    all: records.length,
    incoming: incoming.length,
    stock: records.filter((record) => record.stage === "stock").length,
    sold: records.filter((record) => record.stage === "sold").length,
    readyToReceive,
    awaitingIdentifiers: incoming.length - readyToReceive,
    containers: new Set(records.map((record) => record.container)).size,
  };
}

export function formatDealerUnitDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}
