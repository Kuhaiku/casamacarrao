// app/admin/orders/page.tsx
"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Check, Clock, ChefHat, CreditCard, Banknote, QrCode, 
  Copy, MessageCircle, Settings2 
} from "lucide-react"
import type { Order, PaymentMethod, OrderStatus } from "@/lib/types"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }> = {
  novo: { label: "Novo", variant: "default", icon: Clock },
  aprovado: { label: "Aprovado", variant: "secondary", icon: ChefHat },
  pronto: { label: "Pronto", variant: "outline", icon: Check },
}

const paymentIcons: Record<PaymentMethod, React.ElementType> = {
  cartao: CreditCard,
  dinheiro: Banknote,
  pix: QrCode,
}

const paymentLabels: Record<PaymentMethod, string> = {
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  pix: "PIX",
}

function OrderCard({ order }: { order: Order }) {
  const { updateOrderStatus, toggleOrderPaid, sizes, menuItems, settings } = useStore()
  const { label, variant, icon: StatusIcon } = statusConfig[order.status]
  const PaymentIcon = paymentIcons[order.paymentMethod]

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || sizeId
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId

  const handleCopyPhone = () => {
    if (order.phone) {
      navigator.clipboard.writeText(order.phone)
      alert("Telefone copiado para a área de transferência!")
    }
  }

  const handleWhatsApp = () => {
    if (order.phone) {
      // Remove tudo que não for número
      const cleanPhone = order.phone.replace(/\D/g, '')
      // Pega o template do admin ou usa um fallback seguro
      const template = settings.whatsappMessage || "Olá, {nome}, seu pedido saiu para entrega!"
      const message = template.replace(/{nome}/g, order.customerName)
      
      // Abre o link do WhatsApp (Adicionando o 55 do Brasil por padrão)
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  return (
    <Card className={order.status === "pronto" ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.customerName}</CardTitle>
            
            {/* NOVO: Área do Telefone com Botões de Ação */}
            <div className="flex items-center gap-2 mt-1 mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {order.phone || "Telefone não informado"}
              </span>
              {order.phone && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={handleCopyPhone} 
                    title="Copiar telefone"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6 border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700" 
                    onClick={handleWhatsApp} 
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>

            <CardDescription>{order.address}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
            <div className="font-medium">{getSizeName(item.sizeId)}</div>
            <div className="grid gap-1 text-muted-foreground">
              {item.pastas.length > 0 && (
                <div><span className="font-medium text-foreground">Massa:</span> {item.pastas.map(getItemName).join(", ")}</div>
              )}
              {item.sauces.length > 0 && (
                <div><span className="font-medium text-foreground">Molhos:</span> {item.sauces.map(getItemName).join(", ")}</div>
              )}
              {item.ingredients.length > 0 && (
                <div><span className="font-medium text-foreground">Ingredientes:</span> {item.ingredients.map(getItemName).join(", ")}</div>
              )}
              {item.seasonings.length > 0 && (
                <div><span className="font-medium text-foreground">Temperos:</span> {item.seasonings.map(getItemName).join(", ")}</div>
              )}
              {item.extraCheese && (
                <div className="text-primary font-medium">+ Queijo Extra</div>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <PaymentIcon className="h-4 w-4 text-muted-foreground" />
              <span>{paymentLabels[order.paymentMethod]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`paid-${order.id}`}
                checked={order.isPaid}
                onCheckedChange={() => toggleOrderPaid(order.id)}
              />
              <label
                htmlFor={`paid-${order.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                Pago
              </label>
            </div>
          </div>
          <div className="text-xl font-bold text-primary">{formatCurrency(order.total)}</div>
        </div>

        {order.status === "novo" && (
          <Button 
            className="w-full" 
            onClick={() => updateOrderStatus(order.id, "aprovado")}
          >
            <Check className="h-4 w-4 mr-2" />
            Aprovar Pedido
          </Button>
        )}
        {order.status === "aprovado" && (
          <div className="text-center text-sm text-muted-foreground py-2">
            Pedido enviado para a cozinha
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminOrdersPage() {
  const { orders, settings, updateSettings } = useStore()
  
  // Controle do formulário de mensagem do WhatsApp
  const [isEditingMsg, setIsEditingMsg] = useState(false)
  const [msgTemplate, setMsgTemplate] = useState(settings.whatsappMessage || "Olá, {nome}, seu pedido saiu para entrega!")

  const handleSaveMsg = () => {
    updateSettings({ whatsappMessage: msgTemplate })
    setIsEditingMsg(false)
  }

  const newOrders = orders.filter((o) => o.status === "novo")
  const approvedOrders = orders.filter((o) => o.status === "aprovado")
  const completedOrders = orders.filter((o) => o.status === "pronto")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Aprove pedidos, acompanhe o status e fale com o cliente.
        </p>

        {/* NOVO: Área de Configuração da Mensagem do WhatsApp */}
        <div className="mt-4">
          {isEditingMsg ? (
            <Card className="p-4 border-dashed bg-muted/30 max-w-2xl">
              <Label className="mb-2 block font-semibold">Mensagem Padrão do WhatsApp</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Use <strong className="text-primary">{'{nome}'}</strong> no texto para que o sistema substitua automaticamente pelo nome do cliente.
              </p>
              <Textarea 
                value={msgTemplate} 
                onChange={(e) => setMsgTemplate(e.target.value)}
                className="mb-3 h-24"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMsg}>Salvar Mensagem</Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingMsg(false)}>Cancelar</Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditingMsg(true)}>
              <Settings2 className="h-4 w-4 mr-2"/> 
              Configurar Mensagem do WhatsApp
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{newOrders.length}</div>
              <div className="text-sm text-muted-foreground">Novos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">{approvedOrders.length}</div>
              <div className="text-sm text-muted-foreground">Na Cozinha</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">{completedOrders.length}</div>
              <div className="text-sm text-muted-foreground">Finalizados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {newOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Aguardando Aprovação
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {newOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {approvedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-accent" />
            Na Cozinha
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {approvedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Check className="h-5 w-5" />
            Finalizados
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {completedOrders.slice(0, 6).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            Nenhum pedido recebido ainda.
          </div>
        </Card>
      )}
    </div>
  )
}