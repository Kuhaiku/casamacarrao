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
    extraIngredientPrice: 3.0,
    extraCheesePrice: 8.0,
    whatsappMessage: "",
    autoApprove: false,
  }, // PREVINE ERROS NO FRONTEND
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
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
    await dbDispatch("UPDATE_ORDER_STATUS", { id, status });
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
    const { sizes, settings, products: storeProducts } = get();
    let total = 0;

    for (const item of items) {
      const size = sizes.find((s) => s.id === item.sizeId);
      if (!size) continue;
      total += size.price;

      if (!size.strictMaxIngredients) {
        total +=
          Math.max(0, item.ingredients.length - size.maxIngredients) *
          settings.extraIngredientPrice;
      }
      if (!size.strictMaxSauces) {
        total +=
          Math.max(0, item.sauces.length - size.maxSauces) *
          settings.extraIngredientPrice;
      }
      if (item.extraCheese) {
        total += settings.extraCheesePrice;
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
