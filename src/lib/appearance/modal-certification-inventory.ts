export type ModalRenderer = "current" | "astryx";

export type ModalCertificationEntry = {
  readonly id: string;
  readonly route: string;
  readonly trigger: string;
  readonly dialogName: string;
  readonly renderers: readonly ModalRenderer[];
  readonly verification: readonly ("focus-trap" | "focus-restore" | "escape" | "overflow")[];
};

/**
 * The B4 release gate uses this register to keep modal coverage deliberate.
 * Entries describe informative/preview dialogs only; destructive confirmations
 * and single-field popovers retain their route-level interaction tests.
 */
export const MODAL_CERTIFICATION_INVENTORY = [
  {
    id: "ocean-bl-detail",
    route: "/admin/ocean-freight",
    trigger: "Деталі BL",
    dialogName: "BL {number}",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
  {
    id: "ocean-receipt",
    route: "/admin/ocean-freight",
    trigger: "Створити прибуткову",
    dialogName: "Прибуткова техніки або запчастин",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
  {
    id: "returns-create",
    route: "/admin/returns",
    trigger: "Оформити повернення",
    dialogName: "Оформити повернення від дилера",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
  {
    id: "order-preflight",
    route: "/admin/orders/{id}",
    trigger: "Перевірити перед підтвердженням",
    dialogName: "Перевірка перед підтвердженням",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
  {
    id: "company-form",
    route: "/admin/companies",
    trigger: "Створити нову компанію",
    dialogName: "Створити нову компанію",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
  {
    id: "user-edit",
    route: "/admin/users",
    trigger: "Редагувати користувача",
    dialogName: "Редагувати користувача",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
  {
    id: "invoice-preview",
    route: "/admin/invoices",
    trigger: "Переглянути",
    dialogName: "Інвойс, контракт, додаток або собівартість",
    renderers: ["current", "astryx"],
    verification: ["focus-trap", "focus-restore", "escape", "overflow"],
  },
] as const satisfies readonly ModalCertificationEntry[];
