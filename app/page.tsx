"use client"

import { OrderProvider } from "@/lib/order-context"
import { CustomerHeader } from "@/components/customer/header"
import { SizeSelector } from "@/components/customer/size-selector"
import { OrderBuilder } from "@/components/customer/order-builder"
import { Cart } from "@/components/customer/cart"
import { Checkout } from "@/components/customer/checkout"
import { useOrder } from "@/lib/order-context"

function OrderFlow() {
  const { step, items } = useOrder()

  if (step === 0 && items.length === 0) {
    return <SizeSelector />
  }

  if (step === 0 && items.length > 0) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SizeSelector />
        </div>
        <div>
          <Cart />
        </div>
      </div>
    )
  }

  if (step >= 1 && step <= 5) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderBuilder />
        </div>
        <div>
          <Cart />
        </div>
      </div>
    )
  }

  if (step === 6) {
    return <Checkout />
  }

  return <SizeSelector />
}

export default function HomePage() {
  return (
    <OrderProvider>
      <div className="min-h-screen bg-background">
        <CustomerHeader />
        <main className="container py-8 px-4">
          <OrderFlow />
        </main>
      </div>
    </OrderProvider>
  )
}
