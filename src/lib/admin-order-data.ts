export type AdminOrderStatus = "new" | "waiting" | "supplier" | "ready" | "sent" | "done" | "cancelled";

export type AdminLineStatus = "pending" | "waiting" | "ready" | "sent" | "delivered" | "cancelled";

export type AdminTone = "neutral" | "orange" | "amber" | "blue" | "purple" | "green" | "red";

export interface AdminStatusBadgeCount {
  label: string;
  count: number;
  tone: AdminTone;
}

export interface AdminPipelineRow {
  id: string;
  code: string;
  company: string;
  contact: string;
  date: string;
  parts: number;
  amount: number;
  status: AdminOrderStatus;
  page: 1 | 2 | 3;
  ready: number;
  total: number;
  badges: readonly AdminStatusBadgeCount[];
  unread?: boolean;
  detailEvidence?: boolean;
}

export interface AdminOrderLine {
  id: string;
  partNumber: string;
  description: string;
  note?: string;
  status: AdminLineStatus;
  statusLabel: string;
  bossWebOrSupplier: string;
  stockSource: string;
  quantity: number;
  unitPrice: number;
  disabled?: boolean;
}

export interface AdminOrderMessage {
  id: string;
  author: string;
  role: "dealer" | "manager";
  body: string;
  time: string;
}

export interface AdminTimelineEvent {
  id: string;
  time: string;
  text: string;
}

export interface AdminOneCDocument {
  id: string;
  kind: "РН" | "ПН";
  source: string;
  reference: string;
  lines: string;
  sync: "синхр." | "очікує";
  posting: "проведено" | "не проведено";
}

export interface AdminDealerShipment {
  id: string;
  carrier: string;
  status: string;
  method: string;
  shippedAt: string;
  destination: string;
  tracking?: string;
}

export interface AdminTotalBreakdown {
  label: string;
  value: number;
  tone: AdminTone;
}

export interface AdminOrderFixture {
  id: string;
  code: string;
  company: string;
  contact: string;
  dealer?: string;
  created: string;
  confirmed?: string;
  cancelled?: string;
  po?: string;
  delivery: "Доставка" | "Самовивіз";
  notes?: string;
  status: AdminOrderStatus;
  statusLabel: string;
  stage: string;
  age?: string;
  progress?: string;
  activeParts: number;
  totalUnits: number;
  total: number;
  lineBadges: readonly AdminStatusBadgeCount[];
  lines: readonly AdminOrderLine[];
  totals: readonly AdminTotalBreakdown[];
  messages: readonly AdminOrderMessage[];
  timeline: readonly AdminTimelineEvent[];
  documents: readonly AdminOneCDocument[];
  shipments: readonly AdminDealerShipment[];
  evidenceComplete: boolean;
}

export const ADMIN_PIPELINE_COUNTS: Readonly<Record<AdminOrderStatus, number>> = {
  new: 10,
  waiting: 28,
  supplier: 0,
  ready: 0,
  sent: 0,
  done: 74,
  cancelled: 12,
};

export const ADMIN_PIPELINE_TOTAL = 124;

const badge = (label: string, count: number, tone: AdminTone): AdminStatusBadgeCount => ({ label, count, tone });

export const ADMIN_PIPELINE_ROWS: readonly AdminPipelineRow[] = [
  { id: "LSM-10", code: "LSM-10", company: "Сервис Логос-спорт М", contact: "dealer-logos-sport-m@gmail.com", date: "05.06.2026", parts: 1, amount: 122.11, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 1, "amber")] },
  { id: "7c5495ea-6549-4fc5-9421-e62e62cf5509", code: "KHA-08", company: "BRP Харьков", contact: "Slava", date: "05.06.2026", parts: 1, amount: 383.78, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 2, "amber")], detailEvidence: true },
  { id: "KIE-ST-31", code: "KIE-ST-31", company: "BRP Киев", contact: "Горошко Максим", date: "05.06.2026", parts: 1, amount: 117.30, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 10, "amber")] },
  { id: "KIE-ST-30", code: "KIE-ST-30", company: "BRP Киев", contact: "Буренко Владислав", date: "05.06.2026", parts: 1, amount: 199.41, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 17, "amber")] },
  { id: "KS-09", code: "KS-09", company: "BRP Херсон", contact: "Вінниця", date: "05.06.2026", parts: 1, amount: 53.38, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 1, "amber")] },
  { id: "KIE-ST-29", code: "KIE-ST-29", company: "BRP Киев", contact: "Буренко Владислав", date: "05.06.2026", parts: 1, amount: 369.12, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 1, "amber")] },
  { id: "LSM-09", code: "LSM-09", company: "Сервис Логос-спорт М", contact: "dealer-logos-sport-m@gmail.com", date: "05.06.2026", parts: 2, amount: 53.39, status: "new", page: 1, ready: 0, total: 2, badges: [badge("Очікування", 4, "amber")] },
  { id: "KS-08", code: "KS-08", company: "BRP Херсон", contact: "Вінниця", date: "05.06.2026", parts: 1, amount: 108.69, status: "new", page: 1, ready: 0, total: 1, badges: [badge("Очікування", 1, "amber")] },
  { id: "CHK-2-02", code: "CHK-2-02", company: "BRP центр Черкассы 2", contact: "dealer-cherkassi2-user1@gmail.com", date: "05.06.2026", parts: 4, amount: 803.54, status: "new", page: 1, ready: 0, total: 4, badges: [badge("Очікування", 14, "amber")] },

  { id: "847a33b6-c168-46bf-9d5e-f4c0dabb2c7b", code: "KS-05", company: "BRP Херсон", contact: "SERVICE_Херсон", date: "04.06.2026", parts: 1, amount: 70.83, status: "waiting", page: 1, ready: 0, total: 1, badges: [badge("Очікує замовлення", 1, "amber")], detailEvidence: true },
  { id: "KIE-ST-28", code: "KIE-ST-28", company: "BRP Киев", contact: "Буренко Владислав", date: "04.06.2026", parts: 1, amount: 84.96, status: "waiting", page: 1, ready: 0, total: 1, badges: [badge("Очікує замовлення", 1, "amber")] },
  { id: "386960e7-2e28-4bb0-8fa9-83e45f84df7a", code: "KIE-ST-23", company: "BRP Киев", contact: "Горошко Максим", date: "04.06.2026", parts: 9, amount: 796.36, status: "waiting", page: 1, ready: 1, total: 9, badges: [badge("Відправлено", 4, "purple"), badge("Очікує замовлення", 17, "amber"), badge("Скасовано", 8, "red")], detailEvidence: true },
  { id: "KS-06", code: "KS-06", company: "BRP Херсон", contact: "Вінниця", date: "04.06.2026", parts: 1, amount: 70.83, status: "waiting", page: 1, ready: 0, total: 1, badges: [badge("Очікує замовлення", 1, "amber")] },
  { id: "KHA-05", code: "KHA-05", company: "BRP Харьков", contact: "Leontiev", date: "04.06.2026", parts: 3, amount: 99.63, status: "waiting", page: 1, ready: 1, total: 3, badges: [badge("Відправлено", 1, "purple"), badge("Очікує замовлення", 2, "amber")] },
  { id: "CHK-03", code: "CHK-03", company: "BRP Черкассы", contact: "dealer-cherkassi@gmail.com", date: "04.06.2026", parts: 7, amount: 310.58, status: "waiting", page: 1, ready: 6, total: 7, badges: [badge("Відправлено", 9, "purple"), badge("Очікує замовлення", 1, "amber")] },
  { id: "LSM-07", code: "LSM-07", company: "Сервис Логос-спорт М", contact: "dealer-logos-sport-m@gmail.com", date: "03.06.2026", parts: 1, amount: 138.22, status: "waiting", page: 1, ready: 0, total: 1, badges: [badge("Очікує замовлення", 1, "amber")] },
  { id: "ZHY-06", code: "ZHY-06", company: "BRP Житомир", contact: "Юлия Житомир", date: "03.06.2026", parts: 4, amount: 333.33, status: "waiting", page: 1, ready: 0, total: 4, badges: [badge("Очікує замовлення", 5, "amber")] },
  { id: "VYS-04", code: "VYS-04", company: "BRP Вышгород", contact: "dealer-vyshgorod@gmail.com", date: "02.06.2026", parts: 1, amount: 423.36, status: "waiting", page: 1, ready: 0, total: 1, badges: [badge("Очікує замовлення", 1, "amber"), badge("Скасовано", 11, "red")] },

  { id: "659fb637-d5c6-4d10-8739-baf0e30d4449", code: "KHA-07", company: "BRP Харьков", contact: "Slava", date: "05.06.2026", parts: 2, amount: 452.54, status: "done", page: 2, ready: 2, total: 2, badges: [badge("Доставлено", 2, "green")], detailEvidence: true },
  { id: "ZAP-E-03", code: "ZAP-E-03", company: "BRP Запорожье (Элитспорт)", contact: "dealer-zaporozhe-elit@gmail.com", date: "03.06.2026", parts: 1, amount: 402.57, status: "done", page: 2, ready: 1, total: 1, badges: [badge("Доставлено", 1, "green")], unread: true },
  { id: "KIE-ST-20", code: "KIE-ST-20", company: "BRP Киев", contact: "Буренко Владислав", date: "03.06.2026", parts: 2, amount: 296.56, status: "done", page: 2, ready: 2, total: 2, badges: [badge("Доставлено", 2, "green")], unread: true },
  { id: "KS-07", code: "KS-07", company: "BRP Херсон", contact: "Вінниця", date: "05.06.2026", parts: 8, amount: 519.19, status: "done", page: 2, ready: 8, total: 8, badges: [badge("Доставлено", 9, "green"), badge("Скасовано", 1, "red")] },
  { id: "DNE-07", code: "DNE-07", company: "BRP Днепр", contact: "Лугабой", date: "05.06.2026", parts: 1, amount: 706.48, status: "done", page: 2, ready: 1, total: 1, badges: [badge("Доставлено", 2, "green"), badge("Скасовано", 3, "red")] },
  { id: "ZHY-07", code: "ZHY-07", company: "BRP Житомир", contact: "dealer-zhytomyr@gmail.com", date: "05.06.2026", parts: 1, amount: 147.61, status: "done", page: 2, ready: 1, total: 1, badges: [badge("Доставлено", 1, "green")] },

  { id: "aa12301e-0294-4cb2-8bcb-3ec8f13f0ba6", code: "KS-01", company: "BRP Херсон", contact: "Автопланета", date: "28.05.2026", parts: 0, amount: 0, status: "cancelled", page: 3, ready: 0, total: 1, badges: [badge("Скасовано", 1, "red")], detailEvidence: true },
  { id: "RVN-01", code: "RVN-01", company: "BRP Ровно", contact: "dealer-koshelap-termbud@gmail.com", date: "28.05.2026", parts: 0, amount: 0, status: "cancelled", page: 3, ready: 0, total: 2, badges: [badge("Скасовано", 2, "red")] },
];

const line = (
  id: string,
  partNumber: string,
  description: string,
  status: AdminLineStatus,
  statusLabel: string,
  quantity: number,
  unitPrice: number,
  options: Partial<Pick<AdminOrderLine, "note" | "bossWebOrSupplier" | "stockSource" | "disabled">> = {},
): AdminOrderLine => ({
  id,
  partNumber,
  description,
  status,
  statusLabel,
  quantity,
  unitPrice,
  bossWebOrSupplier: options.bossWebOrSupplier ?? "—",
  stockSource: options.stockSource ?? "—",
  note: options.note,
  disabled: options.disabled,
});

export const ADMIN_ORDER_FIXTURES: readonly AdminOrderFixture[] = [
  {
    id: "a20b2bdd-2a1f-4322-a50a-fe68a17f4963", code: "LOG-01", company: "Logos", contact: "Финансы", dealer: "Logos", created: "Jul 18, 2026", po: "CODEX-QA-20260718", delivery: "Доставка", notes: "CODEX QA — тестовый заказ для анализа демонстрационного сайта; не аппрувить в админке", status: "new", statusLabel: "Новий", stage: "Очікує постачання", age: "0d old", activeParts: 1, totalUnits: 1, total: 13.09, lineBadges: [badge("Очікування", 1, "amber")],
    lines: [line("log-01-9779150", "9779150", "COOLANT,EXT LIFE", "pending", "Очікування · Склад", 1, 13.09, { stockSource: "1" })],
    totals: [{ label: "Замовлено (1)", value: 13.09, tone: "amber" }],
    messages: [{ id: "log-chat-1", author: "Финансы", role: "dealer", body: "CODEX QA — тестовое сообщение по демонстрационному заказу", time: "10h" }],
    timeline: [{ id: "log-tl-1", time: "Jul 18 01:40 AM", text: "Order LOG-01 — $13.09" }, { id: "log-tl-2", time: "Jul 18 01:42 AM", text: "LOG-01: CODEX QA — тестовое сообщение по демонстрационному заказу" }],
    documents: [], shipments: [], evidenceComplete: true,
  },
  {
    id: "7c5495ea-6549-4fc5-9421-e62e62cf5509", code: "KHA-08", company: "BRP Харьков", contact: "Slava", created: "Jun 5, 2026", delivery: "Доставка", notes: "Отправка: Харьков НП 14, тел 0967597111 Хабленко Вячеслав", status: "new", statusLabel: "Новий", stage: "Очікує постачання", age: "42d old", progress: "0 з 2 готово (0%)", activeParts: 1, totalUnits: 2, total: 383.78, lineBadges: [badge("Очікування", 2, "amber")],
    lines: [line("kha08-715009218", "715009218", "BOX_DASHBOARD STORAGE KIT", "pending", "Очікування · Склад", 2, 191.89)],
    totals: [{ label: "Замовлено (2)", value: 383.78, tone: "amber" }], messages: [], timeline: [{ id: "kha08-tl-1", time: "Jun 5", text: "Order KHA-08 — $383.78" }], documents: [], shipments: [], evidenceComplete: true,
  },
  {
    id: "847a33b6-c168-46bf-9d5e-f4c0dabb2c7b", code: "KS-05", company: "BRP Херсон", contact: "SERVICE_Херсон", created: "Jun 4, 2026", confirmed: "Jun 4, 2026", delivery: "Доставка", status: "waiting", statusLabel: "В процесі", stage: "Очікує постачання", age: "44d old", activeParts: 1, totalUnits: 1, total: 70.83, lineBadges: [badge("Очікує замовлення", 1, "amber")],
    lines: [line("ks05-507032601", "507032601", "MICROSWITCH", "waiting", "Очікує замовлення", 1, 70.83)], totals: [{ label: "Замовлено (1)", value: 70.83, tone: "amber" }], messages: [{ id: "ks05-chat-1", author: "SERVICE_Херсон", role: "dealer", body: "Довтавка в: м. Коломия. ІваноФранківська обл. Поштомат 61007 0951689683 Шаіпов Станіслав", time: "04.06" }], timeline: [{ id: "ks05-tl-1", time: "Jun 4", text: "Order KS-05 — $70.83" }, { id: "ks05-tl-2", time: "Jun 4", text: "Order confirmed by manager" }], documents: [], shipments: [], evidenceComplete: true,
  },
  {
    id: "386960e7-2e28-4bb0-8fa9-83e45f84df7a", code: "KIE-ST-23", company: "BRP Киев", contact: "Горошко Максим", created: "Jun 4, 2026", confirmed: "Jun 5, 2026", delivery: "Доставка", status: "waiting", statusLabel: "Частково відправлено", stage: "4/21 Готово", age: "43d old", progress: "4 з 21 готово (19%)", activeParts: 9, totalUnits: 29, total: 796.36, lineBadges: [badge("Очікує замовлення", 17, "amber"), badge("Відправлено", 4, "purple"), badge("Скасовано", 8, "red")],
    lines: [
      line("kie23-276000415", "276000415", "INTERCOOLER ASSY", "waiting", "Очікує замовлення", 1, 441.88),
      line("kie23-278002203", "278002203", "SAFETY LANYARD, LEARNING KEY", "waiting", "Очікує замовлення", 1, 56.90),
      line("kie23-291002838", "291002838", "RH FRONT SCRAPER JOINT", "waiting", "Очікує замовлення", 1, 25.86),
      line("kie23-293730010", "293730010", "BLACK DART", "sent", "Відправлено", 4, 1.36, { stockSource: "4" }),
      line("kie23-295100833", "295100833", "EXTINGUISHER", "waiting", "Очікує замовлення", 2, 36.20),
      line("kie23-707602002", "707602002", "EXHAUST SEAL", "waiting", "Очікує замовлення", 2, 16.64),
      line("kie23-709402094", "709402094", "UPPER ANTI-VIBRATION GASKET", "waiting", "Очікує замовлення", 8, 5.56),
      line("kie23-710002183", "710002183", "GREY-ELECTRONIC KEY", "waiting", "Очікує замовлення", 1, 58.06),
      line("kie23-710004408", "710004408", "KEY COUPLE", "waiting", "Очікує замовлення", 1, 58.06),
      line("kie23-710004964", "710004964", "KEY", "cancelled", "Скасовано", 5, 63.92, { note: "Резерв Океан РАС 4", disabled: true }),
      line("kie23-710005232", "710005232", "KEY", "cancelled", "Скасовано", 3, 63.92, { note: "Резерв Океан РАС 4", disabled: true }),
    ],
    totals: [{ label: "Склад (4)", value: 5.44, tone: "green" }, { label: "Замовлено (17)", value: 790.92, tone: "amber" }, { label: "Скасовано", value: 511.36, tone: "red" }], messages: [],
    timeline: [{ id: "kie23-tl-1", time: "Jun 4 03:21 PM", text: "Order KIE-ST-23 — $1307.72" }, { id: "kie23-tl-2", time: "Jun 5 12:13 PM", text: "710004964: item cancelled by manager — Резерв Океан РАС 4" }, { id: "kie23-tl-3", time: "Jun 5 12:13 PM", text: "710005232: item cancelled by manager — Резерв Океан РАС 4" }, { id: "kie23-tl-4", time: "Jun 5 12:13 PM", text: "Your order has been confirmed by manager — 4 in stock, 17 awaiting order" }, { id: "kie23-tl-5", time: "Jun 5 12:13 PM", text: "Order KIE-ST-23 has been shipped" }],
    documents: [{ id: "kie23-rn", kind: "РН", source: "Склад", reference: "РН-00001955", lines: "293730010 x4", sync: "синхр.", posting: "проведено" }], shipments: [{ id: "kie23-shipment", carrier: "Nova Poshta", status: "shipped", method: "branch", shippedAt: "Jun 5, 2026", destination: "Київ, НП-66, Сапига Андрей, 380676307053" }], evidenceComplete: true,
  },
  {
    id: "659fb637-d5c6-4d10-8739-baf0e30d4449", code: "KHA-07", company: "BRP Харьков", contact: "Slava", created: "Jun 5, 2026", confirmed: "Jun 5, 2026", delivery: "Доставка", status: "done", statusLabel: "Доставлено", stage: "Все готово", progress: "2 з 2 готово (100%)", activeParts: 2, totalUnits: 2, total: 452.54, lineBadges: [badge("Доставлено", 2, "green")],
    lines: [line("kha07-2859420684", "2859420684", "FREEDOM PFD (US/CA) MEN M", "delivered", "Доставлено · BRP Харьков", 1, 99.30, { stockSource: "1" }), line("kha07-295101161", "295101161", "COVER_TRAILERING KIT 3UP", "delivered", "Доставлено", 1, 353.24, { stockSource: "1" })], totals: [{ label: "Комісія (1)", value: 99.30, tone: "purple" }, { label: "Замовлено (1)", value: 353.24, tone: "amber" }], messages: [{ id: "kha07-chat-1", author: "Slava", role: "dealer", body: "отправка со склада", time: "05.06" }, { id: "kha07-chat-2", author: "Slava", role: "dealer", body: "Харьков НП 14 тел 0967597111 Хабленко Вчеслав", time: "05.06" }],
    timeline: [{ id: "kha07-tl-1", time: "Jun 5 12:32 PM", text: "Order KHA-07 — $452.54" }, { id: "kha07-tl-2", time: "Jun 5 12:36 PM", text: "KHA-07: отправка со склада" }, { id: "kha07-tl-3", time: "Jun 5 12:36 PM", text: "KHA-07: Харьков НП 14 тел 0967597111 Хабленко Вчеслав" }, { id: "kha07-tl-4", time: "Jun 5 12:59 PM", text: "Your order has been confirmed by manager — 1 in stock, 1 from consignment" }, { id: "kha07-tl-5", time: "Jun 5 01:00 PM", text: "Order KHA-07 has been shipped" }, { id: "kha07-tl-6", time: "Jun 8 01:22 PM", text: "Order KHA-07 has been marked as delivered" }],
    documents: [{ id: "kha07-rn-1", kind: "РН", source: "Склад", reference: "РН-00001964", lines: "295101161 x1", sync: "синхр.", posting: "не проведено" }, { id: "kha07-rn-2", kind: "РН", source: "Своя консигнація · BRP Харьков", reference: "РН-00001965", lines: "2859420684 x1", sync: "синхр.", posting: "не проведено" }], shipments: [{ id: "kha07-shipment", carrier: "Nova Poshta", status: "shipped", method: "branch", shippedAt: "Jun 5, 2026", destination: "Харьков НП 14 тел 0967597111 Хабленко Вчеслав" }], evidenceComplete: true,
  },
  {
    id: "aa12301e-0294-4cb2-8bcb-3ec8f13f0ba6", code: "KS-01", company: "BRP Херсон", contact: "Автопланета", created: "May 28, 2026", cancelled: "May 28, 2026", delivery: "Доставка", notes: "НП поштомат 61007 Пшеничка Михайло 0503109370", status: "cancelled", statusLabel: "Скасовано", stage: "Все готово", activeParts: 0, totalUnits: 1, total: 0, lineBadges: [badge("Скасовано", 1, "red")],
    lines: [line("ks01-703501249", "703501249", "AIR FILTER WITH PRE FILTER", "cancelled", "Скасовано", 1, 53.38, { note: "це замовлення не потрібне, було зроблено помилково - це був тест", disabled: true })], totals: [{ label: "Скасовано", value: 53.38, tone: "red" }], messages: [{ id: "ks01-chat-1", author: "Автопланета", role: "dealer", body: "це замовлення не потрібне, було зроблено помилково - це був тест", time: "28.05" }], timeline: [{ id: "ks01-tl-1", time: "May 28 09:22 AM", text: "Order KS-01 — $53.38" }, { id: "ks01-tl-2", time: "May 28 10:46 AM", text: "KS-01: це замовлення не потрібне, було зроблено помилково - це був тест" }, { id: "ks01-tl-3", time: "May 28 01:00 PM", text: "703501249: item cancelled by manager — це замовлення не потрібне, було зроблено помилково - це був тест" }], documents: [], shipments: [], evidenceComplete: true,
  },
];

export const ADMIN_ORDER_BY_ID: ReadonlyMap<string, AdminOrderFixture> = new Map(
  ADMIN_ORDER_FIXTURES.flatMap((order) => [[order.id, order], [order.code, order]] as const),
);

export const ADMIN_ORDER_STATUS_META: Readonly<Record<AdminOrderStatus, { label: string; groupLabel: string; kanbanLabel: string; tone: AdminTone }>> = {
  new: { label: "Нові", groupLabel: "Нові замовлення", kanbanLabel: "Нові", tone: "orange" },
  waiting: { label: "Очікування", groupLabel: "Очікує консолідації", kanbanLabel: "Очікує замовлення", tone: "amber" },
  supplier: { label: "Очікує", groupLabel: "Очікує постачальника", kanbanLabel: "Очікує постачальника", tone: "blue" },
  ready: { label: "Готово", groupLabel: "Готово до відправки", kanbanLabel: "Готово до відправки", tone: "green" },
  sent: { label: "Відправлено", groupLabel: "В дорозі", kanbanLabel: "В дорозі", tone: "purple" },
  done: { label: "Готово", groupLabel: "Завершено", kanbanLabel: "Доставлено", tone: "green" },
  cancelled: { label: "Скасовано", groupLabel: "Скасовано", kanbanLabel: "Скасовано", tone: "red" },
};

export const ADMIN_ORDER_STATUS_ORDER: readonly AdminOrderStatus[] = ["new", "waiting", "supplier", "ready", "sent", "done", "cancelled"];
