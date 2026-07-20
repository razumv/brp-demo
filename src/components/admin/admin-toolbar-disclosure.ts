export const ADMIN_TOOLBAR_SECTIONS = ["filters", "view", "actions"] as const;

export type AdminToolbarSection = (typeof ADMIN_TOOLBAR_SECTIONS)[number];

export type AdminToolbarMobileDisclosure = {
  readonly sections?: readonly AdminToolbarSection[];
  readonly activeCount?: number;
  readonly label?: string;
  readonly iconOnly?: boolean;
};

export function getDisclosedToolbarSections(
  controls: Readonly<Record<AdminToolbarSection, boolean>>,
  mobileDisclosure?: AdminToolbarMobileDisclosure,
) {
  if (!mobileDisclosure) return [];
  const configured = new Set(mobileDisclosure?.sections ?? ["filters"]);
  return ADMIN_TOOLBAR_SECTIONS.filter((section) => controls[section] && configured.has(section));
}
