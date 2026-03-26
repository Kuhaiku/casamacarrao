"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type { OrderItem, PaymentMethod } from "./types"

interface OrderContextValue {
  currentItem: OrderItem | null
  items: OrderItem[]
  step: number
  customerName: string
  address: string
  paymentMethod: PaymentMethod
  
  startNewItem: (sizeId: string) => void
  updateCurrentItem: (updates: Partial<OrderItem>) => void
  addItemToCart: () => void
  removeItem: (index: number) => void
  clearCart: () => void
  
  setStep: (step: number) => void
  setCustomerName: (name: string) => void
  setAddress: (address: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  
  resetOrder: () => void
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [currentItem, setCurrentItem] = useState<OrderItem | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [step, setStep] = useState(0)
  const [customerName, setCustomerName] = useState("")
  const [address, setAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix")

  const startNewItem = useCallback((sizeId: string) => {
    setCurrentItem({
      sizeId,
      pastas: [],
      sauces: [],
      seasonings: [],
      ingredients: [],
      extraCheese: false,
    })
    setStep(1)
  }, [])

  const updateCurrentItem = useCallback((updates: Partial<OrderItem>) => {
    setCurrentItem((prev) => prev ? { ...prev, ...updates } : null)
  }, [])

  const addItemToCart = useCallback(() => {
    if (currentItem) {
      setItems((prev) => [...prev, currentItem])
      setCurrentItem(null)
      setStep(0)
    }
  }, [currentItem])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const resetOrder = useCallback(() => {
    setCurrentItem(null)
    setItems([])
    setStep(0)
    setCustomerName("")
    setAddress("")
    setPaymentMethod("pix")
  }, [])

  return (
    <OrderContext.Provider
      value={{
        currentItem,
        items,
        step,
        customerName,
        address,
        paymentMethod,
        startNewItem,
        updateCurrentItem,
        addItemToCart,
        removeItem,
        clearCart,
        setStep,
        setCustomerName,
        setAddress,
        setPaymentMethod,
        resetOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider")
  }
  return context
}
