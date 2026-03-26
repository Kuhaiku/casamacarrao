// components/customer/checkout.tsx
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
import { CreditCard, Banknote, QrCode, ChevronLeft, Check, PartyPopper, Plus, Minus } from "lucide-react"
import type { PaymentMethod, OrderProduct } from "@/lib/types"

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
      <p className="text-muted-foreground mb-8">
        Seu pedido foi recebido e está aguardando aprovação. Em breve começaremos a preparar!
      </p>
      <Button size="lg" onClick={resetOrder}>
        Fazer Novo Pedido
      </Button>
    </div>
  )
}

export function Checkout() {
  const { addOrder, calculateOrderTotal, sizes, menuItems, productCategories, products } = useStore()
  const { 
    items, 
    customerName, 
    address, 
    paymentMethod,
    setCustomerName,
    setAddress,
    setPaymentMethod,
    setStep,
  } = useOrder()

  const [phone, setPhone] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; address?: string; phone?: string }>({})
  
  // Estado local para os produtos avulsos selecionados no carrinho
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])

  const total = calculateOrderTotal(items, selectedProducts)

  const handleUpdateProduct = (productId: string, delta: number) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId)
      if (existing) {
        const newQuantity = existing.quantity + delta
        if (newQuantity <= 0) return prev.filter(p => p.productId !== productId)
        return prev.map(p => p.productId === productId ? { ...p, quantity: newQuantity } : p)
      }
      if (delta > 0) return [...prev, { productId, quantity: 1 }]
      return prev
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: typeof errors = {}
    if (!customerName.trim()) newErrors.name = "Nome é obrigatório"
    if (!phone.trim()) newErrors.phone = "Telefone é obrigatório"
    if (!address.trim()) newErrors.address = "Endereço é obrigatório"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    addOrder({
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod,
      items,
      products: selectedProducts,
      status: "novo",
      isPaid: false,
      total,
    })

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return <SuccessScreen />
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* SELEÇÃO DE PRODUTOS ADICIONAIS */}
        {productCategories.filter(c => c.isActive).map(cat => {
          const catProds = products.filter(p => p.categoryId === cat.id && p.isActive)
          if (catProds.length === 0) return null
          return (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Adicionar {cat.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {catProds.map(prod => {
                  const qty = selectedProducts.find(p => p.productId === prod.id)?.quantity || 0
                  return (
                    <div key={prod.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{prod.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(prod.price)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateProduct(prod.id, -1)} disabled={qty === 0}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center font-medium">{qty}</span>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateProduct(prod.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}

        {/* DADOS DO CLIENTE */}
        <Card>
          <form id="checkout-form" onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Finalizar Pedido</CardTitle>
              <CardDescription>Preencha seus dados para entrega</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(22) 99999-9999"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço de Entrega</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setErrors((prev) => ({ ...prev, address: undefined }))
                  }}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>

              <div className="space-y-3">
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all",
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <method.icon className={cn(
                        "h-6 w-6",
                        paymentMethod === method.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        paymentMethod === method.id ? "text-primary" : "text-muted-foreground"
                      )}>
                        {method.label}
                      </span>
                      {paymentMethod === method.id && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Check className="h-3 w-3 mr-1" />
                          Selecionado
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      {/* RESUMO DO PEDIDO */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* MASSAS */}
            {items.map((item, idx) => {
              const size = sizes.find((s) => s.id === item.sizeId)
              return (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="font-medium mb-1">{size?.name || item.sizeId}</div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{item.pastas.map(id => menuItems.find(i => i.id === id)?.name || id).join(", ")}</div>
                    <div>{item.sauces.map(id => menuItems.find(i => i.id === id)?.name || id).join(", ")}</div>
                    {item.ingredients.length > 0 && (
                      <div>{item.ingredients.map(id => menuItems.find(i => i.id === id)?.name || id).join(", ")}</div>
                    )}
                    {item.extraCheese && <div className="text-primary">+ Queijo Extra</div>}
                  </div>
                </div>
              )
            })}
            
            {/* BEBIDAS E PRODUTOS ADICIONAIS NO RESUMO */}
            {selectedProducts.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2 mt-2 border-t">
                <div className="font-medium mb-1">Itens Adicionais</div>
                {selectedProducts.map(sp => {
                  const p = products.find(prod => prod.id === sp.productId)
                  if (!p) return null
                  return (
                    <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{sp.quantity}x {p.name}</span>
                      <span>{formatCurrency(p.price * sp.quantity)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex-col gap-4">
            <div className="w-full flex items-center justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button type="submit" form="checkout-form" className="w-full" size="lg">
              Confirmar Pedido
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep(0)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao Carrinho
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}