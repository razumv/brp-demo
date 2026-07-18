"use client";

import { type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Gauge,
  Handshake,
  KeyRound,
  ListChecks,
  PackageOpen,
  Plane,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Ship,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/shared/ui";
import { AdminAirFreightPage } from "./admin-air-freight-page";
import { AdminAnalyticsPage } from "./admin-analytics-page";
import { AdminCatalogPage } from "./admin-catalog-page";
import { AdminCompaniesPage } from "./admin-companies-page";
import { AdminConsignmentPage } from "./admin-consignment-page";
import { AdminDealerAccessPage } from "./admin-dealer-access-page";
import { AdminInvoicesPage } from "./admin-invoices-page";
import { AdminIntegrationsPage } from "./admin-integrations-page";
import { AdminOceanFreightPage } from "./admin-ocean-freight-page";
import { AdminBossWebLookupPage } from "./admin-bossweb-lookup-page";
import { AdminPerformancePage } from "./admin-performance-page";
import { AdminPermissionsPage } from "./admin-permissions-page";
import { AdminPartsReportPage } from "./admin-parts-report-page";
import { AdminReturnsPage } from "./admin-returns-page";
import { AdminSchedulePage } from "./admin-schedule-page";
import { AdminSettlementsPage } from "./admin-settlements-page";
import { AdminSettingsPage } from "./admin-settings-page";
import { AdminSupplierOrdersPage } from "./admin-supplier-orders-page";
import { AdminTasksPage } from "./admin-tasks-page";
import { AdminUnitShippingPage } from "./admin-unit-shipping-page";
import { AdminUsersPage } from "./admin-users-page";
import { AdminWarehousePage } from "./admin-warehouse-page";
import styles from "./admin.module.css";

type FeatureDefinition = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const featureDefinitions: Record<string, FeatureDefinition> = {
  "supplier-orders": { title: "Замовлення постачальнику", description: "Консолідація позицій для замовлення у постачальника.", icon: ListChecks },
  consignment: { title: "Консигнація", description: "Залишки консигнації, дилерська мережа та запити.", icon: Handshake },
  returns: { title: "Повернення", description: "Заявки дилерів на повернення запчастин.", icon: RotateCcw },
  "air-freight": { title: "Авіа-доставка", description: "Оперативна консолідація і відстеження авіа-відправлень.", icon: Plane },
  "ocean-freight": { title: "Морська доставка", description: "Контейнери, документи та планові дати прибуття.", icon: Ship },
  "unit-shipping": { title: "Відправка юнітів", description: "Планування відправок техніки дилерам.", icon: Truck },
  warehouse: { title: "Склад", description: "Приймання постачань, розбіжності та складські операції.", icon: Warehouse },
  settlements: { title: "Взаєморозрахунки", description: "Рух коштів і поточні баланси дилерської мережі.", icon: CircleDollarSign },
  invoices: { title: "Інвойси", description: "Документообіг та рахунки дилерів.", icon: FileText },
  catalog: { title: "Каталог", description: "Адміністративний перегляд товарів, цін та запчастин.", icon: PackageOpen },
  schedule: { title: "Графік доставки", description: "Планові вікна поставок техніки по категоріях.", icon: CalendarDays },
  companies: { title: "Управління компаніями", description: "Створюйте компанії та призначайте працівників. Працівники заповнюють дані профілю у своєму порталі.", icon: Building2 },
  "dealer-access": { title: "Доступи дилерів", description: "Політики доступу користувачів дилерських компаній.", icon: ShieldCheck },
  users: { title: "Користувачі", description: "Облікові записи працівників і стани їх активації.", icon: Users },
  permissions: { title: "Доступи", description: "Матриця ролей і дозволів адміністративного порталу.", icon: KeyRound },
  tasks: { title: "Завдання", description: "Черга фонових задач, воркери та інструменти синхронізації.", icon: FileSpreadsheet },
  analytics: { title: "Аналітика", description: "Зведені показники продажів та операцій.", icon: BarChart3 },
  "parts-report": { title: "Звіт ЗЧ", description: "Деталізація замовлених запчастин за дилерами й періодами.", icon: BarChart3 },
  performance: { title: "Швидкість БД", description: "Метрики відповіді бази даних і найактивніші запити.", icon: Gauge },
  "bossweb-lookup": { title: "Пошук запчастини", description: "Порівняння наявності BossWeb і локального каталогу.", icon: Search },
  integrations: { title: "Інтеграції", description: "Стан підключень 1C OData та BossWeb.", icon: RefreshCcw },
  settings: { title: "Налаштування", description: "Діагностика сервісів, черги й бази даних.", icon: Settings },
};

function FeatureShell({ feature, action, children }: { feature: string; action?: ReactNode; children: ReactNode }) {
  const definition = featureDefinitions[feature];
  const Icon = definition?.icon || Settings;
  return (
    <main className="page page-narrow">
      <div className={styles.pageStack}>
        <PageHeader admin icon={<Icon size={20} />} title={definition?.title || "Розділ"} description={definition?.description} action={action} />
        {children}
      </div>
    </main>
  );
}

export function AdminFeaturePage({ feature }: { feature: string }) {
  const normalized = feature.replace(/^\/+|\/+$/g, "");
  switch (normalized) {
    case "supplier-orders": return <AdminSupplierOrdersPage />;
    case "consignment": return <AdminConsignmentPage />;
    case "returns": return <AdminReturnsPage />;
    case "air-freight": return <AdminAirFreightPage />;
    case "ocean-freight": return <AdminOceanFreightPage />;
    case "unit-shipping": return <AdminUnitShippingPage />;
    case "warehouse": return <AdminWarehousePage />;
    case "settlements": return <AdminSettlementsPage />;
    case "invoices": return <AdminInvoicesPage />;
    case "catalog": return <AdminCatalogPage />;
    case "schedule": return <AdminSchedulePage />;
    case "companies": return <AdminCompaniesPage />;
    case "dealer-access": return <AdminDealerAccessPage />;
    case "users": return <AdminUsersPage />;
    case "permissions": return <AdminPermissionsPage />;
    case "tasks": return <AdminTasksPage />;
    case "analytics": return <AdminAnalyticsPage />;
    case "parts-report": return <AdminPartsReportPage />;
    case "performance": return <AdminPerformancePage />;
    case "bossweb-lookup": return <AdminBossWebLookupPage />;
    case "integrations": return <AdminIntegrationsPage />;
    case "settings": return <AdminSettingsPage />;
    default:
      return (
        <FeatureShell feature={normalized}>
          <Panel><EmptyState title="Розділ не знайдено" description="Цей адміністративний маршрут не входить до дослідженого набору." /></Panel>
        </FeatureShell>
      );
  }
}
