"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Download,
  PackagePlus,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { useDealerWorkflow } from "@/components/dealer/dealer-workflow-provider";
import { LockedOperation } from "@/components/dealer/locked-operation";
import { EmptyState, InlineNotice, Modal, PageHeader, Panel } from "@/components/shared/ui";
import { getAccessoryProduct } from "@/lib/dealer/accessories-data";
import { formatMoney, getPart, orderTotal } from "@/lib/mock-data";
import { orderConfirmationHref } from "@/lib/order-route-hrefs";
import styles from "@/components/catalog/catalog.module.css";

type CustomerDraft = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const initialCustomer: CustomerDraft = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function CartPage() {
  const router = useRouter();
  const { snapshot, commands } = useDealerWorkflow();
  const { builder } = snapshot;
  const [manualPart, setManualPart] = useState("");
  const [manualFeedback, setManualFeedback] = useState("");
  const [validation, setValidation] = useState<string[]>([]);
  const [draftFeedback, setDraftFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>(initialCustomer);
  const [customerError, setCustomerError] = useState("");

  const lines = useMemo(() => snapshot.cart.flatMap((line) => {
    const part = getPart(line.partNumber);
    return part ? [{ ...line, part, accessory: getAccessoryProduct(line.partNumber) }] : [];
  }), [snapshot.cart]);
  const unresolvedLines = useMemo(
    () => snapshot.cart.filter((line) => !getPart(line.partNumber)),
    [snapshot.cart],
  );
  const total = orderTotal(lines.map((line) => ({ quantity: line.quantity, dealerPrice: line.part.dealerPrice })));

  const updateBuilder = (input: Parameters<typeof commands.updateOrderBuilder>[0]) => {
    setDraftFeedback("");
    void commands.updateOrderBuilder(input);
  };

  const addManualPart = async () => {
    const normalized = manualPart.trim();
    const part = getPart(normalized);
    if (!part) {
      setManualFeedback("Запчастину не знайдено в каталозі.");
      return;
    }
    const result = await commands.addCartLine({ partNumber: normalized, quantity: 1 });
    if (!result.ok) {
      setManualFeedback(result.kind === "validation-error" ? result.issues[0]?.message ?? "Не вдалося додати позицію." : "Не вдалося додати позицію.");
      return;
    }
    setManualPart("");
    setManualFeedback(`${part.number} · ${part.description} додано до замовлення.`);
    setValidation([]);
  };

  const quickCreateCustomer = async () => {
    if (!customerDraft.name.trim()) {
      setCustomerError("Вкажіть ім’я клієнта.");
      return;
    }
    if (!customerDraft.phone.trim() && !customerDraft.email.trim()) {
      setCustomerError("Вкажіть принаймні телефон або email.");
      return;
    }
    const result = await commands.createCustomer({
      name: customerDraft.name.trim(),
      phone: customerDraft.phone.trim(),
      email: customerDraft.email.trim(),
      address: customerDraft.address.trim(),
      notes: customerDraft.notes.trim(),
    });
    if (!result.ok) {
      setCustomerError(result.kind === "validation-error" ? result.issues[0]?.message ?? "Не вдалося створити клієнта." : "Не вдалося створити клієнта.");
      return;
    }
    await commands.updateOrderBuilder({ customerId: result.value.id });
    setCustomerOpen(false);
    setCustomerError("");
    setValidation([]);
    setCustomerDraft(initialCustomer);
  };

  const saveDraft = async () => {
    const result = await commands.saveOrderDraft();
    if (!result.ok) {
      setDraftFeedback(result.kind === "validation-error" ? result.issues[0]?.message ?? "Не вдалося зберегти чернетку." : "Не вдалося зберегти чернетку.");
      return;
    }
    setDraftFeedback(`Чернетку «${result.value.title}» збережено.`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const errors: string[] = [];
    if (snapshot.cart.length === 0) errors.push("Додайте хоча б одну запчастину.");
    if (unresolvedLines.length) errors.push("Видаліть недоступні позиції перед створенням замовлення.");
    if (!builder.customerId) errors.push("Оберіть або створіть клієнта.");
    if (errors.length) {
      setValidation(errors);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const result = await commands.stageOrder({
      customerId: builder.customerId,
      po: builder.po.trim(),
      note: builder.note.trim(),
      delivery: builder.delivery,
    });
    if (!result.ok) {
      setValidation(result.kind === "validation-error"
        ? result.issues.map((issue) => issue.message)
        : ["Не вдалося створити замовлення."]);
      setSubmitting(false);
      return;
    }
    router.push(orderConfirmationHref(result.value.id));
  };

  return (
    <div className={`page page-narrow ${styles.cartPage}`}>
      <PageHeader
        icon={<ShoppingCart size={20} />}
        title="Оформлення замовлення"
        description="Перевірте позиції, виберіть клієнта та спосіб доставки."
        action={<Link className="button button-outline" href="/catalog">Продовжити покупки</Link>}
      />

      <form className={styles.orderBuilder} onSubmit={submit} noValidate>
        <div className={styles.orderMain}>
          <Panel className={styles.formPanel}>
            <div className={styles.panelHeading}>
              <div><h2>Чернетка замовлення</h2><p>Збережіть її, щоб продовжити оформлення пізніше</p></div>
              <button type="button" className="button button-outline" onClick={() => void saveDraft()}>Зберегти чернетку</button>
            </div>
            <div className={styles.formGrid}>
              <label className="field">
                <span>Назва чернетки</span>
                <input value={builder.title} onChange={(event) => updateBuilder({ title: event.target.value })} placeholder="Нове замовлення" />
              </label>
              <label className="field">
                <span>PO / номер замовлення</span>
                <input value={builder.po} onChange={(event) => updateBuilder({ po: event.target.value })} placeholder="напр. PO-2026-041" />
              </label>
              <div className={`field ${styles.customerField}`}>
                <span>Покупець</span>
                <div className={styles.customerPicker}>
                  <select value={builder.customerId} onChange={(event) => {
                    updateBuilder({ customerId: event.target.value });
                    setValidation([]);
                  }} aria-label="Оберіть покупця">
                    <option value="">Оберіть клієнта…</option>
                    {snapshot.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
                  </select>
                  <button type="button" className="button button-outline" onClick={() => setCustomerOpen(true)}><UserPlus size={15} /> Швидко створити</button>
                </div>
              </div>
              <label className={`field ${styles.fullField}`}>
                <span>Примітка до замовлення</span>
                <textarea value={builder.note} onChange={(event) => updateBuilder({ note: event.target.value })} placeholder="Уточнення для менеджера або складу" />
              </label>
            </div>
            {draftFeedback ? <p className={styles.successMessage} role="status">{draftFeedback}</p> : null}
          </Panel>

          <Panel className={styles.formPanel}>
            <div className={styles.panelHeading}>
              <div><h2>Позиції</h2><p>{snapshot.cart.length} позицій у чернетці</p></div>
              {snapshot.cart.length ? <button type="button" className={styles.clearButton} onClick={() => void commands.clearCart()}><Trash2 size={14} /> Очистити все</button> : null}
            </div>

            <div className={styles.orderTools}>
              <div className={styles.manualPartForm}>
                <PackagePlus size={16} />
                <input aria-label="Номер запчастини" value={manualPart} onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addManualPart();
                  }
                }} onChange={(event) => {
                  setManualPart(event.target.value);
                  setManualFeedback("");
                }} placeholder="Додати за номером, напр. 9779150" />
                <button type="button" className="button button-primary" onClick={() => void addManualPart()}><Plus size={15} /> Додати</button>
              </div>
              <div className={styles.spreadsheetButtons}>
                <LockedOperation
                  icon={<Upload size={15} />}
                  label="Імпорт Excel"
                  reason="Імпорт файлів поки недоступний."
                />
                <LockedOperation
                  icon={<Download size={15} />}
                  label="Експорт"
                  reason="Експорт файлів поки недоступний."
                />
              </div>
            </div>
            {manualFeedback ? <p className={getPart(manualFeedback.split(" · ")[0] ?? "") ? styles.successMessage : styles.errorMessage} aria-live="polite">{manualFeedback}</p> : null}

            {snapshot.cart.length === 0 ? (
              <EmptyState
                compact
                icon={<ShoppingCart size={23} />}
                title="Кошик порожній"
                description="Додайте запчастину за номером або поверніться до каталогу та відкрийте схему."
                action={<Link className="button button-outline" href="/catalog">Перейти до каталогу</Link>}
              />
            ) : (
              <div className={styles.orderLines}>
                <div className={styles.orderLineHeader}>
                  <span>Запчастина</span><span>Кількість</span><span>Ціна</span><span>Разом</span><span />
                </div>
                {lines.map((line) => (
                  <article className={styles.orderLine} key={line.partNumber}>
                    <div>
                      <strong>{line.part.number}</strong>
                      <p>{line.part.description}</p>
                      <small>{line.part.stock} на складі</small>
                      {line.accessory?.compatibility.length ? (
                        <small>Сумісність: {line.accessory.compatibility.join(", ")}</small>
                      ) : null}
                    </div>
                    <div className="quantity-control">
                      <button type="button" aria-label={`Зменшити кількість ${line.part.number}`} onClick={() => void commands.setCartQuantity({ partNumber: line.partNumber, quantity: line.quantity - 1 })}>−</button>
                      <span>{line.quantity}</span>
                      <button type="button" aria-label={`Збільшити кількість ${line.part.number}`} onClick={() => void commands.setCartQuantity({ partNumber: line.partNumber, quantity: line.quantity + 1 })}>+</button>
                    </div>
                    <span>{formatMoney(line.part.dealerPrice)}</span>
                    <strong>{formatMoney(line.quantity * line.part.dealerPrice)}</strong>
                    <button type="button" className={styles.removeLine} aria-label={`Видалити ${line.part.number}`} onClick={() => void commands.removeCartLine({ partNumber: line.partNumber })}><Trash2 size={15} /></button>
                  </article>
                ))}
                {unresolvedLines.map((line) => (
                  <article className={styles.orderLine} key={line.partNumber}>
                    <div><strong>{line.partNumber}</strong><p>Позиція більше не доступна в каталозі.</p><small>Видаліть її та додайте актуальну позицію.</small></div>
                    <span>—</span>
                    <span>—</span>
                    <strong>—</strong>
                    <button type="button" className={styles.removeLine} aria-label={`Видалити недоступну позицію ${line.partNumber}`} onClick={() => void commands.removeCartLine({ partNumber: line.partNumber })}><Trash2 size={15} /></button>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel className={styles.formPanel}>
            <div className={styles.panelHeading}><div><h2>Спосіб отримання</h2><p>Оберіть доставку або самовивіз</p></div></div>
            <div className={styles.deliveryGrid}>
              <label className={builder.delivery === "standard" ? styles.deliveryActive : ""}>
                <input type="radio" name="delivery" value="standard" checked={builder.delivery === "standard"} onChange={() => updateBuilder({ delivery: "standard" })} />
                <span><strong>Стандартна доставка</strong><small>Доставка перевізником після комплектації</small></span>
                {builder.delivery === "standard" ? <Check size={17} /> : null}
              </label>
              <label className={builder.delivery === "pickup" ? styles.deliveryActive : ""}>
                <input type="radio" name="delivery" value="pickup" checked={builder.delivery === "pickup"} onChange={() => updateBuilder({ delivery: "pickup" })} />
                <span><strong>Самовивіз</strong><small>Забрати зі складу після підтвердження</small></span>
                {builder.delivery === "pickup" ? <Check size={17} /> : null}
              </label>
            </div>
          </Panel>
        </div>

        <aside className={styles.orderSummary}>
          <Panel className={styles.summaryPanel}>
            <h2>Підсумок</h2>
            <dl>
              <div><dt>Позицій</dt><dd>{snapshot.cart.length}</dd></div>
              <div><dt>Одиниць</dt><dd>{snapshot.cart.reduce((sum, line) => sum + line.quantity, 0)}</dd></div>
              <div><dt>Доставка</dt><dd>{builder.delivery === "standard" ? "Стандартна" : "Самовивіз"}</dd></div>
              <div className={styles.summaryTotal}><dt>Разом</dt><dd>{formatMoney(total)}</dd></div>
            </dl>
            {validation.length ? (
              <InlineNotice tone="danger"><span>{validation.map((error) => <span className={styles.validationLine} key={error}>{error}</span>)}</span></InlineNotice>
            ) : null}
            <button type="submit" className="button button-primary button-wide" disabled={submitting}><Check size={16} /> {submitting ? "Створення…" : "Створити замовлення"}</button>
            <p>Після створення замовлення одразу з’явиться в «Мої замовлення».</p>
          </Panel>
        </aside>
      </form>

      <Modal
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        title="Швидке створення клієнта"
        description="Дані клієнта будуть доступні під час оформлення замовлення."
        footer={<><button type="button" className="button button-outline" onClick={() => setCustomerOpen(false)}>Скасувати</button><button type="button" className="button button-primary" onClick={() => void quickCreateCustomer()}><UserPlus size={15} /> Створити клієнта</button></>}
      >
        <div className={styles.quickCustomerForm}>
          <label className="field"><span>Ім’я *</span><input value={customerDraft.name} onChange={(event) => setCustomerDraft({ ...customerDraft, name: event.target.value })} /></label>
          <label className="field"><span>Телефон</span><input value={customerDraft.phone} onChange={(event) => setCustomerDraft({ ...customerDraft, phone: event.target.value })} /></label>
          <label className="field"><span>Email</span><input type="email" value={customerDraft.email} onChange={(event) => setCustomerDraft({ ...customerDraft, email: event.target.value })} /></label>
          <label className="field"><span>Адреса</span><input value={customerDraft.address} onChange={(event) => setCustomerDraft({ ...customerDraft, address: event.target.value })} /></label>
          <label className="field"><span>Примітка</span><textarea value={customerDraft.notes} onChange={(event) => setCustomerDraft({ ...customerDraft, notes: event.target.value })} /></label>
          {customerError ? <p className={styles.errorMessage}>{customerError}</p> : null}
        </div>
      </Modal>
    </div>
  );
}
