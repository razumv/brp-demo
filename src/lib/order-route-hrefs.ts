function isRuntimeDemoOrderId(id: string) {
  return id.startsWith("demo-order-");
}

function isDealerRuntimeOrderId(id: string) {
  return isRuntimeDemoOrderId(id) || id.startsWith("dealer-order-");
}

function queryOrderHref(path: string, id: string) {
  return `${path}?id=${encodeURIComponent(id)}`;
}

export function dealerOrderHref(id: string) {
  return isDealerRuntimeOrderId(id)
    ? queryOrderHref("/dealer/order-detail", id)
    : `/dealer/orders/${id}`;
}

export function adminOrderHref(id: string) {
  return isRuntimeDemoOrderId(id)
    ? queryOrderHref("/admin/order-detail", id)
    : `/admin/orders/${id}`;
}

export function orderConfirmationHref(id: string) {
  return isDealerRuntimeOrderId(id)
    ? queryOrderHref("/order-confirmation", id)
    : `/order-confirmation/${id}`;
}
