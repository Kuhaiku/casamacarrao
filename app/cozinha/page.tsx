"use client"

import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ChefHat, Clock, Package } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function getTimeSince(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Agora"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}min`
}

function KitchenOrderCard({ order }: { order: Order }) {
  const { updateOrderStatus, sizes, menuItems } = useStore()

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || sizeId
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId

  return (
    <Card className="border-2 border-primary/20 bg-card">
      <CardHeader className="pb-3 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{order.customerName}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{formatTime(order.createdAt)}</span>
              <Badge variant="secondary">{getTimeSince(order.createdAt)}</Badge>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1">
            #{order.id.slice(-4)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="p-4 bg-muted rounded-lg">
            <div className="text-xl font-bold mb-3 text-primary">
              {getSizeName(item.sizeId)}
            </div>
            <div className="space-y-2 text-lg">
              <div className="flex gap-2">
                <span className="font-semibold min-w-24">Massa:</span>
                <span>{item.pastas.map(getItemName).join(", ") || "-"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-24">Molho:</span>
                <span>{item.sauces.map(getItemName).join(", ") || "-"}</span>
              </div>
              {item.ingredients.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-semibold min-w-24">Ingredientes:</span>
                  <span>{item.ingredients.map(getItemName).join(", ")}</span>
                </div>
              )}
              {item.seasonings.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-semibold min-w-24">Temperos:</span>
                  <span>{item.seasonings.map(getItemName).join(", ")}</span>
                </div>
              )}
              {item.extraCheese && (
                <div className="flex gap-2">
                  <span className="font-bold text-primary text-xl">+ QUEIJO EXTRA</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <Button 
          size="lg" 
          className="w-full text-lg py-6"
          onClick={() => updateOrderStatus(order.id, "pronto")}
        >
          <Check className="h-6 w-6 mr-2" />
          Marcar como Pronto
        </Button>
      </CardContent>
    </Card>
  )
}

export default function KitchenPage() {
  const { orders } = useStore()
  
  const approvedOrders = orders.filter((o) => o.status === "aprovado")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl text-foreground">Cozinha</span>
            <Badge variant="secondary" className="text-lg px-3">
              {approvedOrders.length} {approvedOrders.length === 1 ? "pedido" : "pedidos"}
            </Badge>
          </div>
          <nav className="flex items-center gap-4">
        
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-6 px-4">
        {approvedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ChefHat className="h-24 w-24 text-muted-foreground/30 mb-6" />
            <h2 className="text-3xl font-bold text-muted-foreground mb-2">
              Nenhum pedido na fila
            </h2>
            <p className="text-lg text-muted-foreground">
              Os pedidos aprovados aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {approvedOrders.map((order) => (
              <KitchenOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
