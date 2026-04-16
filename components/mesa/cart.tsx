"use client"

import { useStore } from "@/lib/store"
import { useOrder } from "@/lib/order-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, ShoppingCart } from "lucide-react"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function Cart() {
  const { sizes, menuItems, settings, calculateOrderTotal } = useStore()
  const { items, removeItem, setStep } = useOrder()

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha um tamanho para começar
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || sizeId
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId
  const getSize = (sizeId: string) => sizes.find((s) => s.id === sizeId)
  
  const calculateItemExtras = (item: typeof items[0]) => {
    const size = getSize(item.sizeId)
    if (!size) return 0
    
    let extras = 0
    const extraIngredients = Math.max(0, item.ingredients.length - size.maxIngredients)
    extras += extraIngredients * settings.extraIngredientPrice
    
    const extraSauces = Math.max(0, item.sauces.length - size.maxSauces)
    extras += extraSauces * settings.extraIngredientPrice
    
    
    
    return extras
  }

  const total = calculateOrderTotal(items)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrinho
          <Badge variant="secondary" className="ml-auto">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, idx) => {
          const size = getSize(item.sizeId)
          const extras = calculateItemExtras(item)
          
          return (
            <div key={idx} className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium">{getSizeName(item.sizeId)}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {item.pastas.length > 0 && (
                  <div>Massa: {item.pastas.map(getItemName).join(", ")}</div>
                )}
                {item.sauces.length > 0 && (
                  <div>
                    Molho: {item.sauces.map(getItemName).join(", ")}
                    {size && item.sauces.length > size.maxSauces && (
                      <span className="text-primary ml-1">
                        (+{item.sauces.length - size.maxSauces} extra)
                      </span>
                    )}
                  </div>
                )}
                {item.ingredients.length > 0 && (
                  <div>
                    Ingredientes: {item.ingredients.map(getItemName).join(", ")}
                    {size && item.ingredients.length > size.maxIngredients && (
                      <span className="text-primary ml-1">
                        (+{item.ingredients.length - size.maxIngredients} extra)
                      </span>
                    )}
                  </div>
                )}
                {item.seasonings.length > 0 && (
                  <div>Temperos: {item.seasonings.map(getItemName).join(", ")}</div>
                )}
                {item.extraCheese && (
                  <div className="text-primary">+ Queijo Extra</div>
                )}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50 text-sm">
                <span>{formatCurrency(size?.price || 0)}</span>
                {extras > 0 && (
                  <span className="text-primary">+{formatCurrency(extras)}</span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <div className="w-full flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
        <Button className="w-full" size="lg" onClick={() => setStep(6)}>
          Finalizar Pedido
        </Button>
      </CardFooter>
    </Card>
  )
}
