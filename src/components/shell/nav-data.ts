import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Container,
  FileSpreadsheet,
  FileText,
  Gauge,
  Handshake,
  History,
  LayoutDashboard,
  Network,
  PackageCheck,
  PackageOpen,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Truck,
  Users,
  UsersRound,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const dealerNav: NavGroup[] = [
  { items: [{ label: "Головна", href: "/", icon: LayoutDashboard }] },
  {
    label: "Замовлення",
    items: [
      { label: "Каталог", href: "/catalog", icon: ShoppingBasket },
      { label: "Каталог аксесуарів", href: "/dealer/accessories", icon: Store },
      { label: "Мої замовлення", href: "/dealer/orders", icon: ShoppingCart, badge: "1" },
      { label: "Документи", href: "/dealer/documents", icon: FileText },
      { label: "Чернетки", href: "/dealer/order-drafts", icon: History },
      { label: "Консигнація", href: "/dealer/consignment", icon: Handshake },
      { label: "Взаєморозрахунки", href: "/dealer/settlements", icon: CircleDollarSign },
    ],
  },
  {
    label: "Склад",
    items: [
      { label: "Запчастини", href: "/dealer/parts-inventory", icon: Wrench },
      { label: "Юніти", href: "/dealer/units", icon: Boxes },
    ],
  },
  {
    label: "Дилерська мережа",
    items: [{ label: "Дилерська мережа", href: "/dealer/network", icon: Network }],
  },
  {
    label: "Операції",
    items: [
      { label: "Клієнти", href: "/dealer/customers", icon: Users },
      { label: "Майстерня", href: "/dealer/workshop", icon: Wrench },
    ],
  },
  {
    label: "Інструменти",
    items: [
      { label: "Команда і доступи", href: "/dealer/team-access", icon: UsersRound },
      { label: "Звіт ЗЧ", href: "/dealer/parts-report", icon: BarChart3 },
      { label: "Пошук запчастини", href: "/dealer/bossweb", icon: Search },
    ],
  },
  { items: [{ label: "Графік доставки", href: "/dealer/schedule", icon: CalendarDays }] },
];

export const adminNav: NavGroup[] = [
  { items: [{ label: "Огляд", href: "/admin", icon: LayoutDashboard }] },
  {
    label: "Операції",
    items: [
      { label: "Воронка замовлень", href: "/admin/order-pipeline", icon: Boxes, badge: "10" },
      { label: "Замовлення постачальнику", href: "/admin/supplier-orders", icon: ClipboardList },
      { label: "Консигнація", href: "/admin/consignment", icon: Handshake },
      { label: "Повернення", href: "/admin/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Логістика",
    items: [
      { label: "Авіа-доставка", href: "/admin/air-freight", icon: Truck },
      { label: "Морська доставка", href: "/admin/ocean-freight", icon: Container },
      { label: "Відправка юнітів", href: "/admin/unit-shipping", icon: PackageCheck },
      { label: "Склад", href: "/admin/warehouse", icon: Warehouse },
    ],
  },
  { label: "Фінанси", items: [{ label: "Взаєморозрахунки", href: "/admin/settlements", icon: CircleDollarSign }] },
  { label: "Документообіг", items: [{ label: "Інвойси", href: "/admin/invoices", icon: FileText }] },
  {
    label: "Каталог",
    items: [
      { label: "Каталог", href: "/admin/catalog", icon: PackageOpen },
      { label: "Графік доставки", href: "/admin/schedule", icon: CalendarDays },
    ],
  },
  {
    label: "Люди",
    items: [
      { label: "Компанії", href: "/admin/companies", icon: Building2 },
      { label: "Доступи дилерів", href: "/admin/dealer-access", icon: ShieldCheck },
      { label: "Користувачі", href: "/admin/users", icon: Users },
      { label: "Доступи", href: "/admin/permissions", icon: ShieldCheck },
    ],
  },
  {
    label: "Інструменти",
    items: [
      { label: "Завдання", href: "/admin/tasks", icon: FileSpreadsheet },
      { label: "Аналітика", href: "/admin/analytics", icon: ChartNoAxesCombined },
      { label: "Звіт ЗЧ", href: "/admin/parts-report", icon: BarChart3 },
      { label: "Швидкість БД", href: "/admin/performance", icon: Gauge },
      { label: "Пошук запчастини", href: "/admin/bossweb-lookup", icon: Search },
      { label: "Інтеграції", href: "/admin/integrations", icon: RefreshCcw },
      { label: "Налаштування", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function navForRole(role: Role) {
  return role === "admin" ? adminNav : dealerNav;
}

export function navLabelForPath(role: Role, pathname: string) {
  const item = navForRole(role)
    .flatMap((group) => group.items)
    .sort((a, b) => b.href.length - a.href.length)
    .find((candidate) => candidate.href === pathname || (candidate.href !== "/" && pathname.startsWith(candidate.href + "/")));
  return item?.label;
}

export const navIconFallback = Activity;
