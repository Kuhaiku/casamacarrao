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

// NOVO: Textos visualmente renomeados
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }> = {
  novo: { label: "Aguardando Confirmação", variant: "default", icon: Clock },
  aprovado: { label: "Em Preparação", variant: "secondary", icon: ChefHat },
  pronto: { label: "Saiu para Entrega", variant: "outline", icon: Check },
}

const paymentIcons: Record<string, React.ElementType> = {
  cartao: CreditCard,
  dinheiro: Banknote,
  pix: QrCode,
}

function OrderCard({ order }: { order: any }) {
  const { updateOrderStatus, toggleOrderPaid, sizes, menuItems, products, settings } = useStore()
  const { label, variant, icon: StatusIcon } = statusConfig[order.status] || statusConfig.novo
  const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido"
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId
  const getProductName = (prodId: string) => products.find((p) => p.id === prodId)?.name || prodId

  const handleCopyPhone = () => {
    if (order.phone) {
      navigator.clipboard.writeText(order.phone)
      alert("Telefone copiado para a área de transferência!")
    }
  }

  const handleWhatsApp = () => {
    if (order.phone) {
      const cleanPhone = order.phone.replace(/\D/g, '')
      const template = settings.whatsappMessage || "Olá, {nome}, recebemos seu pedido! Acompanhe o status aqui: {link}"
      
      // NOVO: Gera a URL exata do acompanhamento de pedido
      const trackingUrl = `${window.location.origin}/pedido/${order.id}`
      
      const message = template
        .replace(/{nome}/g, order.customerName)
        .replace(/{link}/g, trackingUrl) // Substitui a tag {link} pela URL gerada

      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  return (
    <Card className={order.status === "pronto" ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{order.customerName}</CardTitle>
              <span className="text-xs text-stone-400">#{order.id}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {order.phone || "Telefone não informado"}
              </span>
              {order.phone && (
                <>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleCopyPhone} title="Copiar telefone">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-6 w-6 border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={handleWhatsApp} title="Chamar no WhatsApp">
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            <CardDescription>{order.address}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={variant} className="flex items-center gap-1 text-center leading-tight">
              <StatusIcon className="h-3 w-3 shrink-0" />
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {order.items && order.items.map((item: any, idx: number) => (
          <div key={`mac-${idx}`} className="p-3 bg-muted/50 rounded-lg text-sm space-y-2 border border-stone-100">
            <div className="font-bold text-stone-800">Macarrão {getSizeName(item.sizeId)}</div>
            <div className="grid gap-1 text-stone-600 text-xs">
              {item.pastaId && <div><span className="font-semibold text-stone-800">Massa:</span> {getItemName(item.pastaId)}</div>}
              {item.sauces?.length > 0 && <div><span className="font-semibold text-stone-800">Molhos:</span> {item.sauces.map(getItemName).join(", ")}</div>}
              {item.temperos?.length > 0 && <div><span className="font-semibold text-stone-800">Temperos:</span> {item.temperos.map(getItemName).join(", ")}</div>}
              {item.ingredients?.length > 0 && <div><span className="font-semibold text-stone-800">Ingredientes:</span> {item.ingredients.map(getItemName).join(", ")}</div>}
              {item.extraCheese && <div className="text-amber-600 font-bold">+ Queijo Extra</div>}
            </div>
          </div>
        ))}

        {order.products && order.products.length > 0 && (
          <div className="p-3 rounded-lg text-sm space-y-1.5 border border-stone-200">
            <div className="font-bold text-stone-800 mb-1">Outros Itens:</div>
            {order.products.map((prod: any, idx: number) => (
              <div key={`prod-${idx}`} className="flex justify-between items-center text-stone-600">
                <span>{prod.quantity}x {getProductName(prod.productId)}</span>
              </div>
            ))}
          </div>
        )}

        {order.observation && (
          <div className="p-3 bg-amber-50 rounded-lg text-sm border border-amber-200">
            <div className="font-bold text-amber-800 mb-1">Observação do Cliente:</div>
            <p className="text-amber-700 italic">{order.observation}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-600">
              <PaymentIcon className="h-4 w-4" />
              <span className="uppercase">{order.paymentMethod}</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id={`paid-${order.id}`} checked={order.isPaid} onCheckedChange={() => toggleOrderPaid(order.id)} />
              <label htmlFor={`paid-${order.id}`} className="text-sm font-medium cursor-pointer">Pago</label>
            </div>
          </div>
          <div className="text-xl font-bold text-orange-700">{formatCurrency(order.total)}</div>
        </div>

        {/* Botões de Ação Atualizados */}
        {order.status === "novo" && (
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={() => updateOrderStatus(order.id, "aprovado")}>
            <Check className="h-4 w-4 mr-2" /> Aceitar (Mover p/ Em Preparação)
          </Button>
        )}
        {order.status === "aprovado" && (
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => updateOrderStatus(order.id, "pronto")}>
            <Check className="h-4 w-4 mr-2" /> Marcar como Saiu para Entrega
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminOrdersPage() {
  const { orders, settings, updateSettings } = useStore()
  
  const [isEditingMsg, setIsEditingMsg] = useState(false)
  const [msgTemplate, setMsgTemplate] = useState(settings.whatsappMessage || "Olá, {nome}, recebemos seu pedido! Acompanhe o status aqui: {link}")

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
        <p className="text-muted-foreground mt-1">Aprove pedidos, acompanhe o status e fale com o cliente.</p>

        <div className="mt-4">
          {isEditingMsg ? (
            <Card className="p-4 border-dashed bg-muted/30 max-w-2xl">
              <Label className="mb-2 block font-semibold">Mensagem Padrão do WhatsApp</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Use <strong className="text-primary">{'{nome}'}</strong> e <strong className="text-primary">{'{link}'}</strong> no texto para o sistema substituir automaticamente.
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
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary">{newOrders.length}</div>
            <div className="text-sm text-muted-foreground">Aguardando Confirmação</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-orange-500">{approvedOrders.length}</div>
            <div className="text-sm text-muted-foreground">Em Preparação</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-green-600">{completedOrders.length}</div>
            <div className="text-sm text-muted-foreground">Saiu para Entrega</div>
          </CardContent>
        </Card>
      </div>

      {newOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Aguardando Confirmação
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {newOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      )}

      {approvedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" /> Em Preparação
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {approvedOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" /> Saiu para Entrega
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {completedOrders.slice(0, 6).map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum pedido recebido ainda.
        </Card>
      )}
    </div>
  )
}