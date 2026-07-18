import { CartPage } from "@/components/catalog/cart-page";
import { AppShell } from "@/components/shell/app-shell";

export default function CartRoute() {
  return (
    <AppShell role="dealer">
      <CartPage />
    </AppShell>
  );
}
