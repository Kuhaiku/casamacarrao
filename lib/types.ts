// lib/types.ts

export type CategoryType = "pasta" | "sauce" | "seasoning" | "ingredient";

export interface Size {
  id: string;
  name: string;
  price: number;
  maxPastas: number;
  strictMaxPastas: boolean;
  maxIngredients: number;
  strictMaxIngredients: boolean;
  maxSauces: number;
  strictMaxSauces: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryType;
  isActive: boolean;
}

export interface StoreSettings {
  extraIngredientPrice: number;
  extraCheesePrice: number;
  whatsappMessage?: string;
  autoApprove?: boolean;
}

export interface OrderItem {
  sizeId: string;
  pastas: string[];
  sauces: string[];
  seasonings: string[];
  ingredients: string[];
  extraCheese: boolean;
}

// ADICIONADO "despachado" (Saiu para entrega)
export type OrderStatus =
  | "novo"
  | "aprovado"
  | "pronto"
  | "despachado"
  | "entregue"
  | "cancelado";
export type PaymentMethod = "cartao" | "dinheiro" | "pix";

export interface ProductCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface OrderProduct {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  products?: OrderProduct[];
  status: OrderStatus;
  isPaid: boolean;
  total: number;
  createdAt: string;
  isAccounted?: boolean;
  deliveredAt?: string;
  observation?: string;
}

export interface FinancialEntry {
  id: string;
  description: string;
  amount: number;
  date: string;
  isAccounted: boolean;
}

export interface CashRegister {
  id: string;
  openedAt: string;
  closedAt: string;
  totalSales: number;
  totalExpenses: number;
  totalTips: number;
  netTotal: number;
  orderCount: number;
}

export interface StoreState {
  sizes: Size[];
  menuItems: MenuItem[];
  productCategories: ProductCategory[];
  products: Product[];
  settings: StoreSettings;
  orders: Order[];
  expenses: FinancialEntry[];
  tips: FinancialEntry[];
  cashRegisters: CashRegister[];
  registerOpenedAt: string;
}