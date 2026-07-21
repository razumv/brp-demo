import type { DemoState, Part } from "@/lib/types";
import { getDealerAccessoryCartPart } from "@/lib/dealer/accessories-data";
import { GLOBAL_PARTS_SEARCH_FIXTURES } from "@/lib/global-parts-search-data";
import { publicAssetPath } from "@/lib/public-base-path";

export const CATALOG_IDS = {
  brand: "CAN_OFF_EN_US",
  category: "7560bdc0-e7f3-4d84-9812-b8ecb55d948a",
  series: "152970b5-6fc4-427c-b0c4-0b44f69baa8e",
  model: "33c5dc49-42ec-4f09-87c6-bd6cf1417de2",
  configuration: "6e4abcb9-35a4-4a55-8801-c5fb2cb41603",
  diagram: "062bdf9d-05c3-470a-a043-8d10bd287a25",
} as const;

export const parts: Part[] = [
  { number: "705602167", reference: "10a", description: "LEFT_&_RIGHT_PADS_KIT", stock: 17, dealerPrice: 97.96, retailPrice: 135.18 },
  { number: "705602167", reference: "20a", description: "LEFT_&_RIGHT_PADS_KIT", stock: 17, dealerPrice: 97.96, retailPrice: 135.18 },
  { number: "705602168", reference: "40a", description: "RIGHT_PADS_KIT", stock: 0, dealerPrice: 51.29, retailPrice: 70.78 },
  { number: "715900785", reference: "10b", description: "SPARK PLUG NGK LMAR8AI-8", stock: 31, dealerPrice: 21.77, retailPrice: 30.05 },
  { number: "422280226", reference: "10c", description: "BELT-V", stock: 11, dealerPrice: 134.19, retailPrice: 176.93 },
  { number: "861805586", reference: "11c1", description: "PDRIVE RAMPES ROLLERS MAINTENANCE KIT", stock: 0, dealerPrice: 119.43, retailPrice: 158.16 },
  { number: "861805587", reference: "12c1", description: "PDRIVE TORQUE ROLLERS MAINTENANCE KIT", stock: 0, dealerPrice: 157, retailPrice: 207.38 },
  { number: "420256188", reference: "12a", description: "OIL FILTER", stock: 0, dealerPrice: 14.76, retailPrice: 20.37 },
  { number: "703501247", reference: "13a", description: "AIR FILTER WITH PRE FILTER", stock: 2, dealerPrice: 53.38, retailPrice: 73.66, supersededBy: "707800846" },
  { number: "9779480", reference: "120", description: "CAN-AM OIL CHANGE KIT 5W40 ACE 650 CC", stock: 0, dealerPrice: 69.79, retailPrice: 96.31 },
  { number: "9779481", reference: "121", description: "CAN-AM OIL CHANGE KIT 0W40 ACE 650 CC", stock: 8, dealerPrice: 72.15, retailPrice: 99.56 },
  { number: "9779150", reference: "330", description: "COOLANT,EXT LIFE", stock: 240, dealerPrice: 13.09, retailPrice: 18.33 },
  { number: "9779156", reference: "400a", description: "XPS SYNTHETIC GEAR OIL 75W90", stock: 19, dealerPrice: 25.44, retailPrice: 35.11 },
  { number: "9779160", reference: "410a", description: "XPS SYNTHETIC GEAR OIL 75W140", stock: 6, dealerPrice: 28.35, retailPrice: 39.12 },
  { number: "705400383", reference: "N", description: "TIRE 25X10-12", stock: 7, dealerPrice: 116.7, retailPrice: 161.05 },
  { number: "705403767", reference: "M", description: "TIRE 25X8-12", stock: 12, dealerPrice: 104.9, retailPrice: 144.76 },
  { number: "861805586", reference: "S", description: "RAMP ROLLERS MAINTENANCE KIT", stock: 3, dealerPrice: 89.45, retailPrice: 123.44 },
];

// Search-only parts stay out of the exported diagram inventory. The empty
// description and dealer-price retail fallback satisfy the private cart contract
// without presenting an unobserved source description or comparison price.
const globalPartsSearchCartParts: readonly Part[] = GLOBAL_PARTS_SEARCH_FIXTURES.map((fixture) => ({
  number: fixture.number,
  reference: "header-search",
  description: fixture.description ?? "",
  stock: fixture.status === "in-stock" ? 3 : 0,
  dealerPrice: fixture.dealerPrice,
  retailPrice: fixture.comparePrice ?? fixture.dealerPrice,
}));

export const catalogBrands = [
  { code: "CAN_OFF_EN_US", name: "CAN-AM OFF-ROAD", tag: "ORV", logo: publicAssetPath("/images/catalog/CAN_OFF_EN_US.png"), description: "Повний каталог запчастин, схем та аксесуарів для Can-Am Off-Road." },
  { code: "CAN_ONR_EN_US", name: "CAN-AM ON-ROAD", tag: "ONR", logo: publicAssetPath("/images/catalog/CAN_ONR_EN_US.png"), description: "Оригінальні запчастини та схеми для Can-Am On-Road." },
  { code: "SEA_DOO_EN_US", name: "SEA-DOO", tag: "PWC", logo: publicAssetPath("/images/catalog/SEA_DOO_EN_US.png"), description: "Каталог деталей, сервісних комплектів та аксесуарів Sea-Doo." },
  { code: "SKI_DOO_EN_US", name: "SKI-DOO", tag: "SNO", logo: publicAssetPath("/images/catalog/SKI_DOO_EN_US.png"), description: "Запчастини та технічні схеми для снігоходів Ski-Doo." },
];

export const catalogSeries = [
  "001 - North America - Outlander 500/700 Series",
  "002 - North America - Outlander MAX 500/700 Series",
  "003 - Europe - Outlander 500/700 Series",
  "004 - Europe - Outlander MAX 500/700 Series",
  "005 - North America - Outlander PRO Series",
  "006 - North America - Renegade 650/1000R",
  "007 - Europe - Renegade 650/1000R",
  "008 - North America - Defender HD7/HD9",
  "009 - North America - Defender HD10",
  "010 - Europe - Defender HD7/HD9",
  "011 - Europe - Defender HD10",
  "012 - North America - Maverick Trail",
  "013 - Europe - Maverick Trail",
  "014 - North America - Maverick Sport",
  "015 - Europe - Maverick Sport",
  "016 - North America - Commander",
  "017 - Europe - Commander",
  "018 - North America - DS",
  "019 - Europe - DS",
  "020 - North America - Traxter",
  "021 - Europe - Traxter",
];

export const diagramNames = [
  "00- Service - Maintenance Parts & Fluids",
  "01- Engine And Air Intake",
  "02- Engine Cooling",
  "03- Exhaust System",
  "04- CVT Drive",
  "05- Gearbox",
  "06- Front Suspension",
  "07- Rear Suspension",
  "08- Steering",
  "09- Brakes",
  "10- Frame",
  "11- Body And Accessories",
  "12- Electrical System",
  "13- Fuel System",
  "14- Wheels And Tires",
  "15- Decals",
  "16- Tools And Service",
  ...Array.from({ length: 24 }, (_, index) => String(index + 17).padStart(2, "0") + "- Supplemental Diagram"),
];

export const adminSampleOrders = [
  { code: "LSM-10", dealer: "Сервис Логос-спорт М", contact: "dealer-logos-sport-m@gmail.com", date: "06.06.2026", parts: 1, amount: 142.24, status: "new" },
  { code: "KHA-08", dealer: "BRP Харьков", contact: "Slava", date: "06.06.2026", parts: 2, amount: 452.54, status: "new" },
  { code: "KIE-ST-31", dealer: "BRP Киев", contact: "Буренко Владислав", date: "06.06.2026", parts: 1, amount: 296.56, status: "new" },
  { code: "ZAP-E-04", dealer: "BRP Запорожье (Элитспорт)", contact: "dealer-zaporozhe-elit@gmail.com", date: "05.06.2026", parts: 3, amount: 402.57, status: "waiting" },
  { code: "DNE-08", dealer: "BRP Днепр", contact: "Лугабой", date: "05.06.2026", parts: 1, amount: 706.48, status: "waiting" },
  { code: "KHA-07", dealer: "BRP Харьков", contact: "Slava", date: "05.06.2026", parts: 2, amount: 452.54, status: "done" },
  { code: "ZAP-E-03", dealer: "BRP Запорожье (Элитспорт)", contact: "dealer-zaporozhe-elit@gmail.com", date: "03.06.2026", parts: 1, amount: 402.57, status: "done" },
  { code: "KS-07", dealer: "BRP Херсон", contact: "dealer-kherson-user3@gmail.com", date: "05.06.2026", parts: 8, amount: 519.19, status: "cancelled" },
] as const;

export const companies = [
  "BRP Вышгород", "BRP Днепр", "BRP Житомир", "BRP Запорожье (Парк-С)", "BRP Запорожье (Элитспорт)",
  "BRP Киев", "BRP Киев (Логос)", "BRP Львов", "BRP Мукачево", "BRP Одесса", "BRP Полтава",
  "BRP Ровно", "BRP Харьков", "BRP Херсон", "BRP Черкассы", "BRP Чернигов",
  "BRP центр Черкассы 2", "Logos", "Сервис Логос-спорт М", "ЧП Сингл Салон NEW",
];

export const initialDemoState: DemoState = {
  version: 1,
  session: null,
  customers: [
    {
      id: "codex-qa-client",
      name: "CODEX QA Client 2026-07-18",
      phone: "+380000000000",
      email: "codex.qa.client.20260718@example.invalid",
      address: "CODEX QA Demo Address",
      notes: "CODEX QA — тестова запис для демонстраційного середовища.",
      createdAt: "2026-07-18T10:00:00.000Z",
    },
  ],
  equipment: [],
  cart: [],
  orders: [
    {
      id: "a20b2bdd-2a1f-4322-a50a-fe68a17f4963",
      code: "LOG-01",
      company: "Logos",
      creator: "Финансы",
      customerId: "codex-qa-client",
      po: "CODEX-QA-20260718",
      note: "CODEX QA — тестовий заказ для аналізу демонстраційного сайту; не підтверджувати в адмінці.",
      delivery: "standard",
      status: "new",
      stage: "Очікує постачання",
      createdAt: "2026-07-18T10:15:00.000Z",
      lines: [
        {
          partNumber: "9779150",
          description: "COOLANT,EXT LIFE",
          quantity: 1,
          dealerPrice: 13.09,
          source: "warehouse",
          privateNote: "CODEX QA — перевірена картка позиції",
        },
      ],
      messages: [
        {
          id: "qa-message-1",
          author: "Финансы",
          role: "dealer",
          body: "CODEX QA — тестове повідомлення по демонстраційному замовленню",
          createdAt: "2026-07-18T10:19:00.000Z",
          demo: true,
        },
      ],
      timeline: [
        { id: "event-1", label: "Замовлення створено", detail: "Дилер відправив замовлення", createdAt: "2026-07-18T10:15:00.000Z" },
        { id: "event-2", label: "Повідомлення", detail: "Додано тестове повідомлення", createdAt: "2026-07-18T10:19:00.000Z" },
      ],
    },
  ],
  workshopOrders: [],
};

export function getPart(partNumber: string) {
  return parts.find((part) => part.number === partNumber)
    ?? globalPartsSearchCartParts.find((part) => part.number === partNumber)
    ?? getDealerAccessoryCartPart(partNumber);
}

export function orderTotal(lines: readonly { quantity: number; dealerPrice: number }[]) {
  return lines.reduce((total, line) => total + line.quantity * line.dealerPrice, 0);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
