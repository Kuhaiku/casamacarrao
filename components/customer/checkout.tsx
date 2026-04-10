"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { useOrder } from "@/lib/order-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CreditCard, Banknote, QrCode, ChevronLeft, Check, PartyPopper, Plus, Minus, Loader2 } from "lucide-react"
// CORREÇÃO 1: Adicionado o OrderStatus na importação
import type { PaymentMethod, OrderProduct, OrderStatus } from "@/lib/types"
import { createPaymentPreference } from "@/lib/mercadopago-actions"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: "pix", label: "PIX", icon: QrCode },
  { id: "cartao", label: "Cartão", icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
]

function SuccessScreen() {
  const { resetOrder } = useOrder()
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <PartyPopper className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">Pedido Enviado!</h1>
      <p className="text-muted-foreground mb-8">O seu pedido foi recebido e aguarda aprovação.</p>
      <Button size="lg" onClick={resetOrder}>Fazer Novo Pedido</Button>
    </div>
  )
}

export function Checkout() {
  const { addOrder, calculateOrderTotal, sizes, menuItems, products, productCategories } = useStore()
  const { items, customerName, address, paymentMethod, setCustomerName, setAddress, setPaymentMethod, setStep } = useOrder()

  const [phone, setPhone] = useState("")
  const [addressNumber, setAddressNumber] = useState("") 
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; address?: string; phone?: string }>({})
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])

  const total = calculateOrderTotal(items, selectedProducts)

  const handleUpdateProduct = (productId: string, delta: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId)
      if (existing) {
        const newQty = existing.quantity + delta
        return newQty <= 0 ? prev.filter(p => p.productId !== productId) : prev.map(p => p.productId === productId ? { ...p, quantity: newQty } : p)
      }
      return delta > 0 ? [...prev, { productId, quantity: 1 }] : prev
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    const newErrors: typeof errors = {}
    if (!customerName.trim()) newErrors.name = "Nome é obrigatório"
    if (!phone.trim()) newErrors.phone = "Telefone é obrigatório"
    const finalAddress = addressNumber.trim() ? `${address.trim()}, Nº ${addressNumber.trim()}` : address.trim()
    if (!finalAddress) newErrors.address = "Endereço é obrigatório"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsProcessing(false)
      return
    }

    const orderId = crypto.randomUUID()
    const orderData = {
      id: orderId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: finalAddress, 
      paymentMethod,
      items,
      products: selectedProducts,
      // CORREÇÃO 2: Adicionado 'as OrderStatus' para tipagem forte
      status: (paymentMethod === "cartao" ? "aguardando_pagamento" : "novo") as OrderStatus,
      isPaid: false,
      total,
    }

    // Salva o pedido no banco
    await addOrder(orderData)

    // Lógica nova: Mercado Pago para cartão
    if (paymentMethod === "cartao") {
      const res = await createPaymentPreference(orderData, total)
      if (res.success && res.init_point) {
        window.location.href = res.init_point
        return
      }
    }

    setIsProcessing(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) return <SuccessScreen />

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        {/* Renderização de Categorias/Produtos Adicionais igual ao seu código original */}
        {productCategories.filter(c => c.isActive).map(cat => {
            const catProds = products.filter(p => p.categoryId === cat.id && p.isActive)
            if (catProds.length === 0) return null
            return (
                <Card key={cat.id}>
                    <CardHeader className="pb-3"><CardTitle className="text-lg">Adicionar {cat.name}</CardTitle></CardHeader>
                    <CardContent className="grid gap-3">
                        {catProds.map(prod => {
                            const qty = selectedProducts.find(p => p.productId === prod.id)?.quantity || 0
                            return (
                                <div key={prod.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div><p className="font-medium">{prod.name}</p><p className="text-sm text-muted-foreground">{formatCurrency(prod.price)}</p></div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateProduct(prod.id, -1)} disabled={qty === 0}><Minus className="h-3 w-3" /></Button>
                                        <span className="w-4 text-center font-medium">{qty}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateProduct(prod.id, 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            )
        })}

        <Card>
          <form id="checkout-form" onSubmit={handleSubmit}>
            <CardHeader><CardTitle>Finalizar Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(22) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <div className="flex gap-2">
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="flex-1" />
                  <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} className="w-24" placeholder="Nº" />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((m) => (
                    <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)} className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-1", paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border")}>
                      <m.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="text-sm p-2 bg-muted rounded">
                    {sizes.find(s => s.id === item.sizeId)?.name}
                </div>
            ))}
            {selectedProducts.map(sp => (
                <div key={sp.productId} className="flex justify-between text-sm italic">
                    <span>{sp.quantity}x {products.find(p => p.id === sp.productId)?.name}</span>
                </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col gap-3 border-t pt-4">
            <div className="flex justify-between w-full text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button type="submit" form="checkout-form" className="w-full" size="lg" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Pedido"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(0)} className="w-full"><ChevronLeft className="h-4 w-4 mr-2" />Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}