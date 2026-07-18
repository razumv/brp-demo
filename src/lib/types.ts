export type Role = "dealer" | "admin";

export type Session = {
  role: Role;
  email: string;
  displayName: string;
  company: string;
  remember: boolean;
  expiresAt: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
};

export type Equipment = {
  id: string;
  customerId: string;
  model: string;
  vin: string;
  year: string;
  engineNumber: string;
  purchasedAt: string;
  notes: string;
};

export type Part = {
  number: string;
  reference: string;
  description: string;
  stock: number;
  dealerPrice: number;
  retailPrice: number;
  supersededBy?: string;
};

export type CartLine = {
  partNumber: string;
  quantity: number;
  sourceDiagramId?: string;
};

export type OrderStatus =
  | "new"
  | "waiting"
  | "supplier"
  | "ready"
  | "sent"
  | "done"
  | "cancelled";

export type OrderLine = {
  partNumber: string;
  description: string;
  quantity: number;
  dealerPrice: number;
  source: "warehouse" | "bossweb" | "catalog";
  privateNote?: string;
};

export type OrderMessage = {
  id: string;
  author: string;
  role: Role;
  body: string;
  createdAt: string;
  demo: boolean;
};

export type TimelineEvent = {
  id: string;
  label: string;
  detail: string;
  createdAt: string;
};

export type Order = {
  id: string;
  code: string;
  company: string;
  creator: string;
  customerId: string;
  po: string;
  note: string;
  delivery: "standard" | "pickup";
  status: OrderStatus;
  stage: string;
  createdAt: string;
  lines: OrderLine[];
  messages: OrderMessage[];
  timeline: TimelineEvent[];
};

export type WorkshopOrder = {
  id: string;
  type: "maintenance" | "repair" | "warranty" | "inspection" | "recall";
  customerId: string;
  description: string;
  mechanic: string;
  scheduledAt: string;
  notes: string;
  status: "new" | "scheduled" | "in_progress" | "done";
};

export type DemoState = {
  version: 1;
  session: Session | null;
  customers: Customer[];
  equipment: Equipment[];
  cart: CartLine[];
  orders: Order[];
  workshopOrders: WorkshopOrder[];
};

export type CustomerInput = Omit<Customer, "id" | "createdAt">;
export type EquipmentInput = Omit<Equipment, "id">;
export type WorkshopOrderInput = Omit<WorkshopOrder, "id" | "status">;

export type OrderInput = {
  customerId: string;
  po: string;
  note: string;
  delivery: "standard" | "pickup";
};
