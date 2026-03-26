// lib/store.ts
"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  Size, MenuItem, StoreSettings, Order, StoreState, OrderStatus, 
  FinancialEntry, CashRegister 
} from './types'

const initialSizes: Size[] = [
  { id: 'p', name: 'P (200g)', price: 18.90, maxPastas: 1, strictMaxPastas: true, maxIngredients: 4, strictMaxIngredients: false, maxSauces: 1, strictMaxSauces: false },
  { id: 'm', name: 'M (350g)', price: 26.90, maxPastas: 2, strictMaxPastas: true, maxIngredients: 8, strictMaxIngredients: false, maxSauces: 2, strictMaxSauces: false },
  { id: 'g', name: 'G (500g)', price: 34.90, maxPastas: 2, strictMaxPastas: true, maxIngredients: 10, strictMaxIngredients: false, maxSauces: 3, strictMaxSauces: false },
]

const initialMenuItems: MenuItem[] = [
  { id: 'penne', name: 'Penne', category: 'pasta', isActive: true },
  { id: 'spaghetti', name: 'Spaghetti', category: 'pasta', isActive: true },
  { id: 'fusilli', name: 'Fusilli', category: 'pasta', isActive: true },
  { id: 'fettuccine', name: 'Fettuccine', category: 'pasta', isActive: true },
  { id: 'tomate', name: 'Molho de Tomate', category: 'sauce', isActive: true },
  { id: 'branco', name: 'Molho Branco', category: 'sauce', isActive: true },
  { id: 'bolonhesa', name: 'Bolonhesa', category: 'sauce', isActive: true },
  { id: 'alfredo', name: 'Alfredo', category: 'sauce', isActive: true },
  { id: 'oregano', name: 'Orégano', category: 'seasoning', isActive: true },
  { id: 'parmesao', name: 'Parmesão Ralado', category: 'seasoning', isActive: true },
  { id: 'pimenta', name: 'Pimenta', category: 'seasoning', isActive: true },
  { id: 'manjericao', name: 'Manjericão', category: 'seasoning', isActive: true },
  { id: 'bacon', name: 'Bacon', category: 'ingredient', isActive: true },
  { id: 'milho', name: 'Milho', category: 'ingredient', isActive: true },
  { id: 'frango', name: 'Frango Desfiado', category: 'ingredient', isActive: true },
  { id: 'brocolis', name: 'Brócolis', category: 'ingredient', isActive: true },
  { id: 'cogumelos', name: 'Cogumelos', category: 'ingredient', isActive: true },
  { id: 'tomate-seco', name: 'Tomate Seco', category: 'ingredient', isActive: true },
  { id: 'azeitonas', name: 'Azeitonas', category: 'ingredient', isActive: true },
  { id: 'camarao', name: 'Camarão', category: 'ingredient', isActive: true },
]

const initialSettings: StoreSettings = {
  extraIngredientPrice: 3.00,
  extraCheesePrice: 8.00,
  whatsappMessage: "Olá, {nome}, seu pedido acabou de sair para entrega! 🛵", // NOVA MENSAGEM
}

interface StoreActions {
  addSize: (size: Size) => void
  updateSize: (id: string, updates: Partial<Size>) => void
  deleteSize: (id: string) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  toggleMenuItemActive: (id: string) => void
  deleteMenuItem: (id: string) => void
  updateSettings: (updates: Partial<StoreSettings>) => void
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  toggleOrderPaid: (id: string) => void
  getActiveMenuItems: () => MenuItem[]
  getSizeById: (id: string) => Size | undefined
  calculateOrderTotal: (items: Order['items']) => number
  addExpense: (expense: Omit<FinancialEntry, 'id' | 'date' | 'isAccounted'>) => void
  deleteExpense: (id: string) => void
  addTip: (tip: Omit<FinancialEntry, 'id' | 'date' | 'isAccounted'>) => void
  deleteTip: (id: string) => void
  closeRegister: () => void
}

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      sizes: initialSizes,
      menuItems: initialMenuItems,
      settings: initialSettings,
      orders: [],
      expenses: [],
      tips: [],
      cashRegisters: [],
      registerOpenedAt: new Date().toISOString(),

      addSize: (size) => set((state) => ({ sizes: [...state.sizes, size] })),
      updateSize: (id, updates) => set((state) => ({ sizes: state.sizes.map((s) => s.id === id ? { ...s, ...updates } : s) })),
      deleteSize: (id) => set((state) => ({ sizes: state.sizes.filter((s) => s.id !== id) })),
      addMenuItem: (item) => set((state) => ({ menuItems: [...state.menuItems, item] })),
      updateMenuItem: (id, updates) => set((state) => ({ menuItems: state.menuItems.map((item) => item.id === id ? { ...item, ...updates } : item) })),
      toggleMenuItemActive: (id) => set((state) => ({ menuItems: state.menuItems.map((item) => item.id === id ? { ...item, isActive: !item.isActive } : item) })),
      deleteMenuItem: (id) => set((state) => ({ menuItems: state.menuItems.filter((item) => item.id !== id) })),
      updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),

      addOrder: (order) => set((state) => ({
        orders: [...state.orders, {
          ...order,
          id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          isAccounted: false
        }]
      })),
      updateOrderStatus: (id, status) => set((state) => ({ orders: state.orders.map((order) => order.id === id ? { ...order, status } : order) })),
      toggleOrderPaid: (id) => set((state) => ({ orders: state.orders.map((order) => order.id === id ? { ...order, isPaid: !order.isPaid } : order) })),

      getActiveMenuItems: () => get().menuItems.filter((item) => item.isActive),
      getSizeById: (id) => get().sizes.find((s) => s.id === id),
      
      calculateOrderTotal: (items) => {
        const { sizes, settings } = get()
        let total = 0

        for (const item of items) {
          const size = sizes.find((s) => s.id === item.sizeId)
          if (!size) continue

          total += size.price

          if (!size.strictMaxIngredients) {
            const extraIngredients = Math.max(0, item.ingredients.length - size.maxIngredients)
            total += extraIngredients * settings.extraIngredientPrice
          }

          if (!size.strictMaxSauces) {
            const extraSauces = Math.max(0, item.sauces.length - size.maxSauces)
            total += extraSauces * settings.extraIngredientPrice
          }

          if (item.extraCheese) {
            total += settings.extraCheesePrice
          }
        }

        return total
      },

      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, { ...expense, id: `exp-${Date.now()}`, date: new Date().toISOString(), isAccounted: false }]
      })),
      
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(e => e.id !== id)
      })),

      addTip: (tip) => set((state) => ({
        tips: [...state.tips, { ...tip, id: `tip-${Date.now()}`, date: new Date().toISOString(), isAccounted: false }]
      })),
      
      deleteTip: (id) => set((state) => ({
        tips: state.tips.filter(t => t.id !== id)
      })),

      closeRegister: () => set((state) => {
        const currentOrders = state.orders.filter(o => !o.isAccounted && o.isPaid)
        const currentExpenses = state.expenses.filter(e => !e.isAccounted)
        const currentTips = state.tips.filter(t => !t.isAccounted)

        const totalSales = currentOrders.reduce((acc, o) => acc + o.total, 0)
        const totalExpenses = currentExpenses.reduce((acc, e) => acc + e.amount, 0)
        const totalTips = currentTips.reduce((acc, t) => acc + t.amount, 0)

        const newRegister: CashRegister = {
          id: `reg-${Date.now()}`,
          openedAt: state.registerOpenedAt,
          closedAt: new Date().toISOString(),
          totalSales,
          totalExpenses,
          totalTips,
          netTotal: (totalSales + totalTips) - totalExpenses,
          orderCount: currentOrders.length
        }

        return {
          cashRegisters: [newRegister, ...state.cashRegisters],
          orders: state.orders.map(o => o.isPaid && !o.isAccounted ? { ...o, isAccounted: true } : o),
          expenses: state.expenses.map(e => ({ ...e, isAccounted: true })),
          tips: state.tips.map(t => ({ ...t, isAccounted: true })),
          registerOpenedAt: new Date().toISOString()
        }
      })
    }),
    {
      name: 'casa-do-macarrao-storage',
    }
  )
)