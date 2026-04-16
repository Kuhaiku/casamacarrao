// lib/store.ts
"use client";

import { create } from "zustand";
import { getStoreData, dbDispatch } from "./actions";
import type {
  Size,
  MenuItem,
  StoreSettings,
  Order,
  StoreState,
  OrderStatus,
  FinancialEntry,
  ProductCategory,
  Product,
  OrderProduct,
} from "./types";

interface OrderWithObs extends Omit<Order, "id" | "createdAt"> {
  id?: string;
  observation?: string;
}

interface StoreActions {
  sync: () => Promise<void>;
  addSize: (size: Size) => void;
  updateSize: (id: string, updates: Partial<Size>) => void;
  deleteSize: (id: string) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  toggleMenuItemActive: (id: string) => void;
  deleteMenuItem: (id: string) => void;
  addProductCategory: (cat: Partial<ProductCategory>) => void;
  updateProductCategory: (
    id: string,
    updates: Partial<ProductCategory>,
  ) => void;
  deleteProductCategory: (id: string) => void;
  addProduct: (prod: Partial<Product>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  toggleProductActive: (id: string) => void;
  deleteProduct: (id: string) => void;
  updateSettings: (updates: Partial<StoreSettings>) => void;
  addOrder: (order: OrderWithObs) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  toggleOrderPaid: (id: string) => void;
  getActiveMenuItems: () => MenuItem[];
  getSizeById: (id: string) => Size | undefined;
  calculateOrderTotal: (
    items: Order["items"],
    products?: OrderProduct[],
  ) => number;
  addExpense: (
    expense: Omit<FinancialEntry, "id" | "date" | "isAccounted">,
  ) => void;
  deleteExpense: (id: string) => void;
  addTip: (tip: Omit<FinancialEntry, "id" | "date" | "isAccounted">) => void;
  deleteTip: (id: string) => void;
  closeRegister: () => void;
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  sizes: [],
  menuItems: [],
  productCategories: [],
  products: [],
  settings: {
    extraPastaPrice: 0.0,
    extraSaucePrice: 3.0,
    extraIngredientPrice: 3.0,
    whatsappMessage: "",
    autoApprove: false,
    autoApproveMesa: false,
    acceptCard: true,
    isOpen: true,
    deliveryMessage: "Estamos fechados para delivery no momento.",
    deliverySchedule: {
      "0": { active: true, start: "18:00", end: "23:59" }, // Domingo
      "1": { active: true, start: "18:00", end: "23:59" }, // Segunda
      "2": { active: true, start: "18:00", end: "23:59" }, // Terça
      "3": { active: true, start: "18:00", end: "23:59" }, // Quarta
      "4": { active: true, start: "18:00", end: "23:59" }, // Quinta
      "5": { active: true, start: "18:00", end: "23:59" }, // Sexta
      "6": { active: true, start: "18:00", end: "23:59" }, // Sábado
    }
  },
  orders: [],
  expenses: [],
  tips: [],
  cashRegisters: [],
  registerOpenedAt: new Date().toISOString(),

  sync: async () => {
    const data = await getStoreData();
    set(data);
  },

  addSize: async (size) => {
    await dbDispatch("ADD_SIZE", size);
    get().sync();
  },
  updateSize: async (id, updates) => {
    await dbDispatch("UPDATE_SIZE", { id, updates });
    get().sync();
  },
  deleteSize: async (id) => {
    await dbDispatch("DELETE_SIZE", { id });
    get().sync();
  },
  addMenuItem: async (item) => {
    await dbDispatch("ADD_MENU_ITEM", item);
    get().sync();
  },
  updateMenuItem: async (id, updates) => {
    await dbDispatch("UPDATE_MENU_ITEM", { id, updates });
    get().sync();
  },
  toggleMenuItemActive: async (id) => {
    await dbDispatch("TOGGLE_MENU_ITEM", { id });
    get().sync();
  },
  deleteMenuItem: async (id) => {
    await dbDispatch("DELETE_MENU_ITEM", { id });
    get().sync();
  },
  addProductCategory: async (cat) => {
    await dbDispatch("ADD_PRODUCT_CATEGORY", cat);
    get().sync();
  },
  updateProductCategory: async (id, updates) => {
    await dbDispatch("UPDATE_PRODUCT_CATEGORY", { id, updates });
    get().sync();
  },
  deleteProductCategory: async (id) => {
    await dbDispatch("DELETE_PRODUCT_CATEGORY", { id });
    get().sync();
  },
  addProduct: async (prod) => {
    await dbDispatch("ADD_PRODUCT", prod);
    get().sync();
  },
  updateProduct: async (id, updates) => {
    await dbDispatch("UPDATE_PRODUCT", { id, updates });
    get().sync();
  },
  toggleProductActive: async (id) => {
    await dbDispatch("TOGGLE_PRODUCT", { id });
    get().sync();
  },
  deleteProduct: async (id) => {
    await dbDispatch("DELETE_PRODUCT", { id });
    get().sync();
  },
  updateSettings: async (updates) => {
    await dbDispatch("UPDATE_SETTINGS", updates);
    get().sync();
  },

  addOrder: async (order) => {
    set((state) => ({
      orders: [
        ...state.orders,
        {
          ...order,
          id: order.id || "loading",
          createdAt: new Date().toISOString(),
        } as Order,
      ],
    }));
    await dbDispatch("ADD_ORDER", order);
    get().sync();
  },

  updateOrderStatus: async (id, status) => {
    const deliveredAt = status === "entregue" ? new Date().toISOString() : undefined;
    const isApprovedNow = status === "aprovado";

    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status,
            deliveredAt: status === "entregue" ? (o.deliveredAt || deliveredAt) : o.deliveredAt,
            // Registra a data exata da aprovação caso seja aprovado pelo painel
            approvedAt: isApprovedNow && !o.approvedAt ? new Date().toISOString() : o.approvedAt,
            // Tag automática se for aprovação do operador e não tinha tag antes
            approvalMethod: isApprovedNow && !o.approvalMethod ? "operator" : o.approvalMethod,
          };
        }
        return o;
      }),
    }));
    
    // Passa os novos campos para o DB caso precise salvar
    await dbDispatch("UPDATE_ORDER_STATUS", { 
      id, 
      status, 
      deliveredAt,
      // No futuro da sua API, ela pode ler esses extras se necessário
      approvedAt: isApprovedNow ? new Date().toISOString() : undefined,
      approvalMethod: isApprovedNow ? "operator" : undefined
    });
    get().sync();
  },

  toggleOrderPaid: async (id) => {
    await dbDispatch("TOGGLE_ORDER_PAID", { id });
    get().sync();
  },
  addExpense: async (expense) => {
    await dbDispatch("ADD_EXPENSE", expense);
    get().sync();
  },
  deleteExpense: async (id) => {
    await dbDispatch("DELETE_EXPENSE", { id });
    get().sync();
  },
  addTip: async (tip) => {
    await dbDispatch("ADD_TIP", tip);
    get().sync();
  },
  deleteTip: async (id) => {
    await dbDispatch("DELETE_TIP", { id });
    get().sync();
  },
  closeRegister: async () => {
    await dbDispatch("CLOSE_REGISTER", {});
    get().sync();
  },

  getActiveMenuItems: () => get().menuItems.filter((item) => item.isActive),
  getSizeById: (id) => get().sizes.find((s) => s.id === id),

  calculateOrderTotal: (items, products = []) => {
    const { sizes, settings, products: storeProducts, menuItems } = get();
    let total = 0;

    for (const item of items) {
      const size = sizes.find((s) => s.id === item.sizeId);
      if (!size) continue;
      total += size.price;

      if (!size.strictMaxPastas && item.pastas?.length) {
        total +=
          Math.max(0, item.pastas.length - size.maxPastas) *
          (settings.extraPastaPrice || 0);
      }

      if (!size.strictMaxIngredients && item.ingredients?.length) {
        total +=
          Math.max(0, item.ingredients.length - size.maxIngredients) *
          (settings.extraIngredientPrice || 0);
      }

      if (!size.strictMaxSauces && item.sauces?.length) {
        total +=
          Math.max(0, item.sauces.length - size.maxSauces) *
          (settings.extraSaucePrice || 0);
      }

      if (item.extras?.length) {
        for (const extraId of item.extras) {
          const extraItem = menuItems.find(m => m.id === extraId);
          if (extraItem && extraItem.price) {
            total += extraItem.price;
          }
        }
      }

      if (item.extraCheese) {
        total += 3.0;
      }
    }

    for (const prod of products) {
      const dbProd = storeProducts.find((p) => p.id === prod.productId);
      if (dbProd) {
        total += dbProd.price * prod.quantity;
      }
    }

    return total;
  },
}));