"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Size, MenuItem, StoreSettings, Order, StoreState, OrderStatus } from './types'

// Initial seed data
const initialSizes: Size[] = [
  { id: 'p', name: 'P (200g)', price: 18.90, maxPastas: 1, maxIngredients: 4, maxSauces: 1 },
  { id: 'm', name: 'M (350g)', price: 26.90, maxPastas: 2, maxIngredients: 8, maxSauces: 2 },
  { id: 'g', name: 'G (500g)', price: 34.90, maxPastas: 2, maxIngredients: 10, maxSauces: 3 },
]

const initialMenuItems: MenuItem[] = [
  // Pastas
  { id: 'penne', name: 'Penne', category: 'pasta', isActive: true },
  { id: 'spaghetti', name: 'Spaghetti', category: 'pasta', isActive: true },
  { id: 'fusilli', name: 'Fusilli', category: 'pasta', isActive: true },
  { id: 'fettuccine', name: 'Fettuccine', category: 'pasta', isActive: true },
  // Sauces
  { id: 'tomate', name: 'Molho de Tomate', category: 'sauce', isActive: true },
  { id: 'branco', name: 'Molho Branco', category: 'sauce', isActive: true },
  { id: 'bolonhesa', name: 'Bolonhesa', category: 'sauce', isActive: true },
  { id: 'alfredo', name: 'Alfredo', category: 'sauce', isActive: true },
  // Seasonings (always free)
  { id: 'oregano', name: 'Orégano', category: 'seasoning', isActive: true },
  { id: 'parmesao', name: 'Parmesão Ralado', category: 'seasoning', isActive: true },
  { id: 'pimenta', name: 'Pimenta', category: 'seasoning', isActive: true },
  { id: 'manjericao', name: 'Manjericão', category: 'seasoning', isActive: true },
  // Ingredients
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
}

interface StoreActions {
  // Size actions
  addSize: (size: Size) => void
  updateSize: (id: string, updates: Partial<Size>) => void
  deleteSize: (id: string) => void
  
  // Menu item actions
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  toggleMenuItemActive: (id: string) => void
  deleteMenuItem: (id: string) => void
  
  // Settings actions
  updateSettings: (updates: Partial<StoreSettings>) => void
  
  // Order actions
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  toggleOrderPaid: (id: string) => void
  
  // Helpers
  getActiveMenuItems: () => MenuItem[]
  getSizeById: (id: string) => Size | undefined
  calculateOrderTotal: (items: Order['items']) => number
}

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      sizes: initialSizes,
      menuItems: initialMenuItems,
      settings: initialSettings,
      orders: [],

      // Size actions
      addSize: (size) => set((state) => ({ sizes: [...state.sizes, size] })),
      updateSize: (id, updates) => set((state) => ({
        sizes: state.sizes.map((s) => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteSize: (id) => set((state) => ({
        sizes: state.sizes.filter((s) => s.id !== id)
      })),

      // Menu item actions
      addMenuItem: (item) => set((state) => ({
        menuItems: [...state.menuItems, item]
      })),
      updateMenuItem: (id, updates) => set((state) => ({
        menuItems: state.menuItems.map((item) => 
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      toggleMenuItemActive: (id) => set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item.id === id ? { ...item, isActive: !item.isActive } : item
        )
      })),
      deleteMenuItem: (id) => set((state) => ({
        menuItems: state.menuItems.filter((item) => item.id !== id)
      })),

      // Settings actions
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),

      // Order actions
      addOrder: (order) => set((state) => ({
        orders: [...state.orders, {
          ...order,
          id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString()
        }]
      })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      })),
      toggleOrderPaid: (id) => set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, isPaid: !order.isPaid } : order
        )
      })),

      // Helpers
      getActiveMenuItems: () => get().menuItems.filter((item) => item.isActive),
      getSizeById: (id) => get().sizes.find((s) => s.id === id),
      calculateOrderTotal: (items) => {
        const { sizes, settings } = get()
        let total = 0

        for (const item of items) {
          const size = sizes.find((s) => s.id === item.sizeId)
          if (!size) continue

          total += size.price

          // Extra ingredients
          const extraIngredients = Math.max(0, item.ingredients.length - size.maxIngredients)
          total += extraIngredients * settings.extraIngredientPrice

          // Extra sauces count as extra ingredients
          const extraSauces = Math.max(0, item.sauces.length - size.maxSauces)
          total += extraSauces * settings.extraIngredientPrice

          // Extra cheese
          if (item.extraCheese) {
            total += settings.extraCheesePrice
          }
        }

        return total
      },
    }),
    {
      name: 'casa-do-macarrao-storage',
    }
  )
)
