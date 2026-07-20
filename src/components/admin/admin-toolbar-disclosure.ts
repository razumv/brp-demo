export const ADMIN_TOOLBAR_SECTIONS = ["filters", "view", "actions"] as const;

export type AdminToolbarSection = (typeof ADMIN_TOOLBAR_SECTIONS)[number];

export type AdminToolbarMobileDisclosure = {
  readonly sections?: readonly AdminToolbarSection[];
  readonly activeCount?: number;
  readonly label?: string;
};

export function getDisclosedToolbarSections(
  controls: Readonly<Record<AdminToolbarSection, boolean>>,
  mobileDisclosure?: AdminToolbarMobileDisclosure,
) {
  const configured = new Set(mobileDisclosure?.sections ?? ["filters"]);
  return ADMIN_TOOLBAR_SECTIONS.filter((section) => controls[section] && configured.has(section));
}
