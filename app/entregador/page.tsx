// app/entregador/page.tsx
"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, Phone, User, CheckCircle2, 
  Banknote, CreditCard, Smartphone, Check, Bike 
} from "lucide-react"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const paymentIcons: Record<string, React.ElementType> = {
  cartao: CreditCard,
  dinheiro: Banknote,
  pix: Smartphone,
}

export default function EntregadorPage() {
  const { orders, sync, updateOrderStatus, toggleOrderPaid } = useStore()
  
  useEffect(() => {
    sync()
    const interval = setInterval(() => sync(), 5000)
    return () => clearInterval(interval)
  }, [sync])

  const deliveries = orders.filter(o => o.status === "pronto")

  const openMaps = (address: string) => {
    window.open(`http://googleusercontent.com/maps.google.com/?q=${encodeURIComponent(address)}`, "_blank")
  }

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const message = `Olá ${name}, aqui é o entregador da Casa do Macarrão! Estou a caminho.`
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 pb-8">
      <div className="bg-stone-900 text-white px-4 py-6 shadow-md rounded-b-3xl sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <Bike className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Entregas</h1>
              <p className="text-stone-400 text-xs uppercase tracking-widest">Painel do Motoboy</p>
            </div>
          </div>
          <Badge className="bg-orange-500 text-lg px-3 py-1 font-black">
            {deliveries.length}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4 mt-2 max-w-lg mx-auto">
        {deliveries.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Bike className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-bold">Nenhuma entrega no momento</h2>
            <p className="text-sm">Aguarde novos pedidos.</p>
          </div>
        ) : (
          deliveries.map(order => {
            const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote
            
            return (
              <Card key={order.id} className="border-2 border-stone-200 shadow-lg rounded-2xl overflow-hidden">
                <div className={`px-4 py-2 flex justify-between items-center text-white ${order.isPaid ? 'bg-green-600' : 'bg-red-600'}`}>
                  <span className="font-black text-sm tracking-wider">
                    {order.isPaid ? "PAGO" : "COBRAR NA ENTREGA"}
                  </span>
                  <span className="font-black text-xl">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                <CardContent className="p-5 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-stone-800 text-lg leading-tight">{order.customerName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-stone-700 leading-snug">{order.address}</p>
                        <button 
                          onClick={() => openMaps(order.address)}
                          className="mt-1 text-sm font-bold text-blue-600 flex items-center hover:underline"
                        >
                          Ver no Mapa
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-stone-700">{order.phone || "Não informado"}</p>
                        {order.phone && (
                          <button 
                            onClick={() => openWhatsApp(order.phone, order.customerName)}
                            className="mt-1 text-sm font-bold text-green-600 flex items-center hover:underline"
                          >
                            Chamar no WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-stone-100 p-3 rounded-xl border border-stone-200">
                    <PaymentIcon className="w-6 h-6 text-stone-600" />
                    <span className="font-bold text-stone-700 uppercase">Pagamento via {order.paymentMethod}</span>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    {!order.isPaid ? (
                      <Button 
                        size="lg" 
                        className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-200 font-black h-14 text-lg"
                        onClick={() => toggleOrderPaid(order.id)}
                      >
                        RECEBI O VALOR
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full text-green-700 border-2 border-green-200 bg-green-50 font-black h-14 text-lg opacity-70"
                        onClick={() => toggleOrderPaid(order.id)}
                      >
                        <Check className="w-5 h-5 mr-2" /> VALOR RECEBIDO
                      </Button>
                    )}

                    <Button 
                      size="lg" 
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black h-14 text-lg shadow-xl"
                      onClick={() => {
                        if (!order.isPaid) {
                          // ALERTA DE SEGURANÇA SE NÃO ESTIVER PAGO
                          if(confirm("⚠️ ATENÇÃO: O pedido não foi marcado como pago!\n\nTem certeza que deseja finalizar a entrega SEM registrar o recebimento do valor?")) {
                            updateOrderStatus(order.id, "entregue")
                          }
                        } else {
                          // CONFIRMAÇÃO NORMAL
                          if(confirm("Confirmar que a entrega foi concluída?")) {
                            updateOrderStatus(order.id, "entregue")
                          }
                        }
                      }}
                    >
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      FINALIZAR ENTREGA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}