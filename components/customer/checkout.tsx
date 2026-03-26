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
import { CreditCard, Banknote, QrCode, ChevronLeft, Check, PartyPopper } from "lucide-react"
import type { PaymentMethod } from "@/lib/types"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: "pix", label: "PIX", icon: QrCode },
  { id: "cartao", label: "Cartão", icon: CreditCard },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
]

function OrderSummary() {
  const { sizes, menuItems, settings, calculateOrderTotal } = useStore()
  const { items } = useOrder()

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || sizeId
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId
  const getSize = (sizeId: string) => sizes.find((s) => s.id === sizeId)

  const total = calculateOrderTotal(items)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
        <CardDescription>{items.length} {items.length === 1 ? "item" : "itens"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => {
          const size = getSize(item.sizeId)
          return (
            <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="font-medium mb-1">{getSizeName(item.sizeId)}</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{item.pastas.map(getItemName).join(", ")}</div>
                <div>{item.sauces.map(getItemName).join(", ")}</div>
                {item.ingredients.length > 0 && (
                  <div>{item.ingredients.map(getItemName).join(", ")}</div>
                )}
                {item.extraCheese && <div className="text-primary">+ Queijo Extra</div>}
              </div>
              <div className="text-right font-medium mt-2">
                {formatCurrency(
                  (size?.price || 0) +
                  Math.max(0, item.ingredients.length - (size?.maxIngredients || 0)) * settings.extraIngredientPrice +
                  Math.max(0, item.sauces.length - (size?.maxSauces || 0)) * settings.extraIngredientPrice +
                  (item.extraCheese ? settings.extraCheesePrice : 0)
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full flex items-center justify-between text-xl font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

function SuccessScreen() {
  const { resetOrder } = useOrder()

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <PartyPopper className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">Pedido Enviado!</h1>
      <p className="text-muted-foreground mb-8">
        Seu pedido foi recebido e está aguardando aprovação. Em breve começaremos a preparar seu macarrão!
      </p>
      <Button size="lg" onClick={resetOrder}>
        Fazer Novo Pedido
      </Button>
    </div>
  )
}

export function Checkout() {
  const { addOrder, calculateOrderTotal } = useStore()
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
      status: "novo",
      isPaid: false,
      total: calculateOrderTotal(items),
    })

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return <SuccessScreen />
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
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
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
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
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
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
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
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
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Selecionado
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" size="lg">
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
        </form>
      </Card>

      <OrderSummary />
    </div>
  )
}