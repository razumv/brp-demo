"use client";

import {
  BarChart3,
  BookOpen,
  Box,
  CalendarDays,
  CircleDollarSign,
  FileClock,
  FileText,
  Globe2,
  PackageOpen,
  Search,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAppearance } from "@/components/appearance/use-appearance";
import { PageHeader, PageSurface } from "@/components/shared/ui";
import dealerStyles from "../dealer.module.css";

type FeatureDefinition = {
  title: string;
  description: string;
  icon: typeof Box;
};

const featureDefinitions: Record<string, FeatureDefinition> = {
  accessories: { title: "Каталог аксесуарів", description: "Оригінальні аксесуари BRP за сімейством і моделлю.", icon: BookOpen },
  documents: { title: "Документи", description: "Рахунки, накладні та документи до замовлень.", icon: FileText },
  "order-drafts": { title: "Чернетки", description: "Незавершені замовлення, збережені для подальшої роботи.", icon: FileClock },
  consignment: { title: "Консигнація", description: "Залишки, мережа та запити на відвантаження.", icon: PackageOpen },
  settlements: { title: "Взаєморозрахунки", description: "Баланс та історія руху коштів з дистриб’ютором.", icon: CircleDollarSign },
  "parts-inventory": { title: "Запчастини", description: "Поточні складські залишки та контроль дефіциту.", icon: Wrench },
  units: { title: "Техніка", description: "Вхідні контейнери, склад і продана техніка.", icon: Box },
  network: { title: "Дилерська мережа", description: "Доступні запчастини й техніка в дилерській мережі.", icon: Globe2 },
  workshop: { title: "Майстерня", description: "Дошка сервісних робіт та планування.", icon: Wrench },
  "parts-report": { title: "Звіт ЗЧ", description: "Аналітика замовлень запчастин за обраний період.", icon: BarChart3 },
  bossweb: { title: "Пошук запчастин", description: "Перевіряйте номер запчастини у довіднику перед створенням замовлення.", icon: Search },
  schedule: { title: "Графік поставки", description: "Майбутні поставки техніки, слоти та вільні залишки.", icon: CalendarDays },
};

export function FeatureFrame({ feature, action, children }: { feature: string; action?: ReactNode; children: ReactNode }) {
  const { renderedDesignSystem } = useAppearance();
  const definition = featureDefinitions[feature] || { title: "Розділ", description: "Дилерський робочий розділ.", icon: Box };
  const Icon = definition.icon;
  return (
    <PageSurface
      as="main"
      width="default"
      className="page page-narrow"
      data-dealer-feature={feature}
      data-dealer-feature-renderer={renderedDesignSystem}
    >
      <PageHeader icon={<Icon size={21} />} title={definition.title} description={definition.description} action={action} />
      <section
        className={dealerStyles.workspaceSurface}
        data-dealer-workspace-surface={renderedDesignSystem}
      >
        {children}
      </section>
    </PageSurface>
  );
}
