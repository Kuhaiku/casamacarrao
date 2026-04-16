// lib/types.ts

export type CategoryType = "pasta" | "sauce" | "seasoning" | "ingredient" | "extra";
export type TipoPedido = "delivery" | "mesa";

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
  taxaEmbalagem?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryType;
  isActive: boolean;
  price?: number;
}

export interface DaySchedule {
  active: boolean;
  start: string;
  end: string;
}

export interface Bairro {
  id: string;
  nome: string;
  taxaEntrega: number;
  ativo: boolean;
}

export interface StoreSettings {
  extraPastaPrice?: number; 
  extraSaucePrice?: number; 
  extraIngredientPrice: number;
  whatsappMessage?: string;
  autoApprove?: boolean; // Aprovação automática do Delivery
  autoApproveMesa?: boolean; // Trava de aprovação da mesa
  acceptCard?: boolean; // Trava de cartão
  isOpen?: boolean; // Ligar/Desligar Delivery
  deliveryMessage?: string; // Mensagem de loja fechada
  deliverySchedule?: Record<string, DaySchedule>; // Horários programados de funcionamento
  bairros?: Bairro[]; // Lista de bairros e taxas de entrega
  taxaEmbalagemGlobal?: number;
  mercadoPagoAtivo?: boolean;
  taxaCartaoPercentual?: number;
  taxaCartaoFixa?: number;
}

export interface OrderItem {
  sizeId: string;
  pastas: string[];
  sauces: string[];
  seasonings: string[];
  ingredients: string[];
  extras?: string[];
  extraCheese?: boolean;
}

export interface BairroValidation {
  valido: boolean;
  taxa_entrega: number;
  mensagem?: string;
}

export type OrderStatus =
  | "novo"
  | "pendente" // Estado para quando a mesa pede, mas precisa passar pelo caixa
  | "aprovado"
  | "pronto"
  | "despachado"
  | "entregue"
  | "cancelado";

export type PaymentMethod = "cartao" | "dinheiro" | "pix" | "pendente"; // "pendente" é crucial para a mesa aberta

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
  tem_embalagem?: boolean;
  tipoEmbalagem?: "nenhuma" | "padrao" | "personalizada";
  taxaEmbalagem?: number;
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
  tipoPedido?: TipoPedido;
  approvalMethod?: "auto" | "operator"; // Tag para o painel adm
  approvedAt?: string; // Para ordenar a fila da cozinha corretamente
  taxaEntrega?: number;
  taxaEmbalagem?: number;
  taxaCartao?: number;
  subtotal?: number;
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
  isOpen?: boolean;
}