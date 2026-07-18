export type CompanyProfileStatus = "complete" | "incomplete";

export interface CompanyEmployeeSummary {
  readonly id: string;
  readonly displayLabel: string;
  readonly role: "Dealer";
  readonly sourceIdentityStored: false;
}

export interface CompanyFormFixture {
  readonly companyName: string;
  readonly managerName: string;
  readonly managerPhone: string;
  readonly region: string;
  readonly city: string;
  readonly warehouse: string;
  readonly recipientName: string;
  readonly recipientPhone: string;
}

export interface AdminCompany {
  readonly id: string;
  readonly policySlug: string;
  readonly name: string;
  readonly managerSummary: "Менеджер призначений" | null;
  readonly employeeCount: number;
  readonly employees: readonly CompanyEmployeeSummary[];
  readonly profileStatus: CompanyProfileStatus;
  readonly createdAt: string;
  readonly editFixture: CompanyFormFixture;
  readonly evidence: "source-observed-sanitized";
}

export interface CompanyKpi {
  readonly id: "companies" | "employees" | "staffed" | "completed";
  readonly label: string;
  readonly value: number;
  readonly tone: "neutral" | "blue" | "orange" | "green";
}

export const emptyCompanyForm: CompanyFormFixture = {
  companyName: "",
  managerName: "",
  managerPhone: "",
  region: "",
  city: "",
  warehouse: "",
  recipientName: "",
  recipientPhone: "",
};

export const companyKpis = [
  { id: "companies", label: "Всього компаній", value: 20, tone: "neutral" },
  { id: "employees", label: "Всього працівників", value: 102, tone: "blue" },
  { id: "staffed", label: "З працівниками", value: 20, tone: "orange" },
  { id: "completed", label: "Профілі заповнені", value: 15, tone: "green" },
] as const satisfies readonly CompanyKpi[];

function sanitizedEmployees(companyId: string, count: number): readonly CompanyEmployeeSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${companyId}-employee-${index + 1}`,
    displayLabel: `Працівник ${index + 1}`,
    role: "Dealer" as const,
    sourceIdentityStored: false as const,
  }));
}

function sanitizedEditFixture(companyName: string): CompanyFormFixture {
  return {
    companyName,
    managerName: "Демо менеджер",
    managerPhone: "Демо номер",
    region: "Демо область",
    city: "Демо місто",
    warehouse: "Демо склад",
    recipientName: "Демо отримувач",
    recipientPhone: "Демо номер",
  };
}

type CompanySeed = {
  readonly id: string;
  readonly policySlug: string;
  readonly name: string;
  readonly employeeCount: number;
  readonly profileStatus: CompanyProfileStatus;
  readonly createdAt: string;
};

const companySeeds = [
  { id: "company-vyshhorod", policySlug: "brp-vyshhorod-demo", name: "BRP Вышгород", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-dnipro", policySlug: "brp-dnipro-demo", name: "BRP Днепр", employeeCount: 5, profileStatus: "complete", createdAt: "Feb 4, 2026" },
  { id: "company-zhytomyr", policySlug: "brp-zhytomyr-demo", name: "BRP Житомир", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-zaporizhzhia-park-s", policySlug: "brp-zaporizhzhia-park-s-demo", name: "BRP Запорожье (Парк-С)", employeeCount: 5, profileStatus: "incomplete", createdAt: "Apr 30, 2026" },
  { id: "company-zaporizhzhia-elitsport", policySlug: "brp-zaporizhzhia-elitsport-demo", name: "BRP Запорожье (Элитспорт)", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-kyiv", policySlug: "brp-kyiv-demo", name: "BRP Киев", employeeCount: 5, profileStatus: "complete", createdAt: "Feb 6, 2026" },
  { id: "company-kyiv-logos", policySlug: "brp-kyiv-logos-demo", name: "BRP Киев (Логос)", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-lviv", policySlug: "brp-lviv-demo", name: "BRP Львов", employeeCount: 5, profileStatus: "complete", createdAt: "Feb 6, 2026" },
  { id: "company-mukachevo", policySlug: "brp-mukachevo-demo", name: "BRP Мукачево", employeeCount: 5, profileStatus: "complete", createdAt: "Feb 6, 2026" },
  { id: "company-odesa", policySlug: "brp-odesa-demo", name: "BRP Одесса", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-poltava", policySlug: "brp-poltava-demo", name: "BRP Полтава", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-rivne", policySlug: "brp-rivne-demo", name: "BRP Ровно", employeeCount: 5, profileStatus: "complete", createdAt: "May 20, 2026" },
  { id: "company-kharkiv", policySlug: "brp-kharkiv-demo", name: "BRP Харьков", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-kherson", policySlug: "brp-kherson-demo", name: "BRP Херсон", employeeCount: 7, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-cherkasy", policySlug: "brp-cherkasy-demo", name: "BRP Черкассы", employeeCount: 5, profileStatus: "complete", createdAt: "Feb 6, 2026" },
  { id: "company-chernihiv", policySlug: "brp-chernihiv-demo", name: "BRP Чернигов", employeeCount: 5, profileStatus: "complete", createdAt: "Apr 30, 2026" },
  { id: "company-cherkasy-center-2", policySlug: "brp-cherkasy-center-2-demo", name: "BRP центр Черкассы 2", employeeCount: 5, profileStatus: "incomplete", createdAt: "May 20, 2026" },
  { id: "company-logos", policySlug: "logos-demo", name: "Logos", employeeCount: 5, profileStatus: "incomplete", createdAt: "Jan 29, 2026" },
  { id: "company-logos-service", policySlug: "logos-service-demo", name: "Сервис Логос-спорт М", employeeCount: 5, profileStatus: "incomplete", createdAt: "May 20, 2026" },
  { id: "company-single-new", policySlug: "single-salon-new-demo", name: "ЧП Сингл Салон NEW", employeeCount: 5, profileStatus: "incomplete", createdAt: "May 20, 2026" },
] as const satisfies readonly CompanySeed[];

export const adminCompanies: readonly AdminCompany[] = companySeeds.map((seed) => ({
  ...seed,
  managerSummary: seed.profileStatus === "complete" ? "Менеджер призначений" : null,
  employees: sanitizedEmployees(seed.id, seed.employeeCount),
  editFixture: sanitizedEditFixture(seed.name),
  evidence: "source-observed-sanitized",
}));
