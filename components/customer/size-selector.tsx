"use client"

import { useStore } from "@/lib/store"
import { useOrder } from "@/lib/order-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function SizeSelector() {
  const { sizes } = useStore()
  const { startNewItem, items } = useOrder()

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-3">
          {items.length > 0 ? "Adicionar mais um macarrão" : "Monte seu Macarrão"}
        </h1>
        <p className="text-lg text-muted-foreground">
          Escolha o tamanho e personalize com suas massas, molhos e ingredientes favoritos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {sizes.map((size) => (
          <Card 
            key={size.id} 
            className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => startNewItem(size.id)}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{size.name}</CardTitle>
              <CardDescription className="text-3xl font-bold text-primary">
                {formatCurrency(size.price)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 bg-muted rounded-lg">
                  <div className="font-bold text-lg">{size.maxPastas}</div>
                  <div className="text-muted-foreground text-xs">Massas</div>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="font-bold text-lg">{size.maxIngredients}</div>
                  <div className="text-muted-foreground text-xs">Ingredientes</div>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="font-bold text-lg">{size.maxSauces}</div>
                  <div className="text-muted-foreground text-xs">Molhos</div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Temperos à vontade
              </p>
              <Button className="w-full group-hover:bg-primary/90">
                Escolher
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {sizes.length === 0 && (
        <Card className="max-w-md mx-auto p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum tamanho disponível no momento.
          </p>
        </Card>
      )}
    </div>
  )
}
