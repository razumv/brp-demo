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
import { useDemoStore } from "@/components/providers/demo-store-provider";
import { LockedOperation } from "@/components/dealer/locked-operation";
import { EmptyState, InlineNotice, Modal, PageHeader, Panel, StatusBadge } from "@/components/shared/ui";
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
  name: "Локальний тестовий клієнт",
  phone: "+380000000000",
  email: "demo.customer@example.invalid",
  address: "Демонстраційна адреса",
  notes: "Локальний запис для тестування клону.",
};

export function CartPage() {
  const router = useRouter();
  const {
    state,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    addCustomer,
    createOrder,
  } = useDemoStore();
  const [draftTitle, setDraftTitle] = useState("Нове замовлення");
  const [customerId, setCustomerId] = useState("");
  const [po, setPo] = useState("");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState<"standard" | "pickup">("standard");
  const [manualPart, setManualPart] = useState("");
  const [manualFeedback, setManualFeedback] = useState("");
  const [validation, setValidation] = useState<string[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>(initialCustomer);
  const [customerError, setCustomerError] = useState("");

  const lines = useMemo(() => state.cart.flatMap((line) => {
    const part = getPart(line.partNumber);
    return part ? [{ ...line, part }] : [];
  }), [state.cart]);
  const total = orderTotal(lines.map((line) => ({ quantity: line.quantity, dealerPrice: line.part.dealerPrice })));

  const addManualPart = () => {
    const normalized = manualPart.trim();
    if (normalized !== "9779150") {
      setManualFeedback("Запчастину не знайдено. Спробуйте 9779150.");
      return;
    }
    addToCart("9779150", 1);
    setManualPart("");
    setManualFeedback("9779150 · COOLANT,EXT LIFE додано до замовлення.");
    setValidation([]);
  };

  const quickCreateCustomer = () => {
    if (!customerDraft.name.trim()) {
      setCustomerError("Вкажіть ім’я клієнта.");
      return;
    }
    if (!customerDraft.phone.trim() && !customerDraft.email.trim()) {
      setCustomerError("Вкажіть принаймні телефон або email.");
      return;
    }
    const customer = addCustomer({
      name: customerDraft.name.trim(),
      phone: customerDraft.phone.trim(),
      email: customerDraft.email.trim(),
      address: customerDraft.address.trim(),
      notes: customerDraft.notes.trim(),
    });
    setCustomerId(customer.id);
    setCustomerOpen(false);
    setCustomerError("");
    setValidation([]);
    setCustomerDraft(initialCustomer);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const errors: string[] = [];
    if (lines.length === 0) errors.push("Додайте хоча б одну запчастину.");
    if (!customerId) errors.push("Оберіть або створіть клієнта.");
    if (errors.length) {
      setValidation(errors);
      return;
    }
    const order = createOrder({ customerId, po: po.trim(), note: note.trim(), delivery });
    router.push(orderConfirmationHref(order.id));
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
              <div><h2>Чернетка замовлення</h2><p>Зберігається локально у цьому браузері</p></div>
              <StatusBadge tone="amber">Автозбереження</StatusBadge>
            </div>
            <div className={styles.formGrid}>
              <label className="field">
                <span>Назва чернетки</span>
                <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Нове замовлення" />
              </label>
              <label className="field">
                <span>PO / номер замовлення</span>
                <input value={po} onChange={(event) => setPo(event.target.value)} placeholder="напр. PO-2026-041" />
              </label>
              <div className={`field ${styles.customerField}`}>
                <span>Покупець</span>
                <div className={styles.customerPicker}>
                  <select value={customerId} onChange={(event) => {
                    setCustomerId(event.target.value);
                    setValidation([]);
                  }} aria-label="Оберіть покупця">
                    <option value="">Оберіть клієнта…</option>
                    {state.customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
                  </select>
                  <button type="button" className="button button-outline" onClick={() => setCustomerOpen(true)}><UserPlus size={15} /> Швидко створити</button>
                </div>
              </div>
              <label className={`field ${styles.fullField}`}>
                <span>Примітка до замовлення</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Уточнення для менеджера або складу" />
              </label>
            </div>
          </Panel>

          <Panel className={styles.formPanel}>
            <div className={styles.panelHeading}>
              <div><h2>Позиції</h2><p>{lines.length} позицій у чернетці</p></div>
              {lines.length ? <button type="button" className={styles.clearButton} onClick={clearCart}><Trash2 size={14} /> Очистити все</button> : null}
            </div>

            <div className={styles.orderTools}>
              <div className={styles.manualPartForm}>
                <PackagePlus size={16} />
                <input aria-label="Номер запчастини" value={manualPart} onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addManualPart();
                  }
                }} onChange={(event) => {
                  setManualPart(event.target.value);
                  setManualFeedback("");
                }} placeholder="Додати за номером, напр. 9779150" />
                <button type="button" className="button button-primary" onClick={addManualPart}><Plus size={15} /> Додати</button>
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
            {manualFeedback ? <p className={manualFeedback.startsWith("977") ? styles.successMessage : styles.errorMessage} aria-live="polite">{manualFeedback}</p> : null}

            {lines.length === 0 ? (
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
                    <div><strong>{line.part.number}</strong><p>{line.part.description}</p><small>{line.part.stock} на складі</small></div>
                    <div className="quantity-control">
                      <button type="button" aria-label={`Зменшити кількість ${line.part.number}`} onClick={() => setCartQuantity(line.partNumber, line.quantity - 1)}>−</button>
                      <span>{line.quantity}</span>
                      <button type="button" aria-label={`Збільшити кількість ${line.part.number}`} onClick={() => setCartQuantity(line.partNumber, line.quantity + 1)}>+</button>
                    </div>
                    <span>{formatMoney(line.part.dealerPrice)}</span>
                    <strong>{formatMoney(line.quantity * line.part.dealerPrice)}</strong>
                    <button type="button" className={styles.removeLine} aria-label={`Видалити ${line.part.number}`} onClick={() => removeFromCart(line.partNumber)}><Trash2 size={15} /></button>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel className={styles.formPanel}>
            <div className={styles.panelHeading}><div><h2>Спосіб отримання</h2><p>Оберіть доставку або самовивіз</p></div></div>
            <div className={styles.deliveryGrid}>
              <label className={delivery === "standard" ? styles.deliveryActive : ""}>
                <input type="radio" name="delivery" value="standard" checked={delivery === "standard"} onChange={() => setDelivery("standard")} />
                <span><strong>Стандартна доставка</strong><small>Доставка перевізником після комплектації</small></span>
                {delivery === "standard" ? <Check size={17} /> : null}
              </label>
              <label className={delivery === "pickup" ? styles.deliveryActive : ""}>
                <input type="radio" name="delivery" value="pickup" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} />
                <span><strong>Самовивіз</strong><small>Забрати зі складу після підтвердження</small></span>
                {delivery === "pickup" ? <Check size={17} /> : null}
              </label>
            </div>
          </Panel>
        </div>

        <aside className={styles.orderSummary}>
          <Panel className={styles.summaryPanel}>
            <h2>Підсумок</h2>
            <dl>
              <div><dt>Позицій</dt><dd>{lines.length}</dd></div>
              <div><dt>Одиниць</dt><dd>{lines.reduce((sum, line) => sum + line.quantity, 0)}</dd></div>
              <div><dt>Доставка</dt><dd>{delivery === "standard" ? "Стандартна" : "Самовивіз"}</dd></div>
              <div className={styles.summaryTotal}><dt>Разом</dt><dd>{formatMoney(total)}</dd></div>
            </dl>
            {validation.length ? (
              <InlineNotice tone="danger"><span>{validation.map((error) => <span className={styles.validationLine} key={error}>{error}</span>)}</span></InlineNotice>
            ) : null}
            <button type="submit" className="button button-primary button-wide"><Check size={16} /> Перевірити і відправити</button>
            <p>Замовлення збережеться у цьому браузері та одразу з’явиться в «Мої замовлення».</p>
          </Panel>
        </aside>
      </form>

      <Modal
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        title="Швидке створення клієнта"
        description="Локальний синтетичний запис для демонстрації"
        footer={<><button type="button" className="button button-outline" onClick={() => setCustomerOpen(false)}>Скасувати</button><button type="button" className="button button-primary" onClick={quickCreateCustomer}><UserPlus size={15} /> Створити клієнта</button></>}
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
