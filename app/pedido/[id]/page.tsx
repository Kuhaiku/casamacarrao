"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { dbDispatch } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { 
  ChefHat, 
  Clock, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Package, 
  Bike, 
  CheckCircle2, 
  ShoppingBag, 
  Ban,
  MapPin,
  Star,
  Loader2
} from "lucide-react"

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function getOrderType(address: string) {
  if (!address) return "ENTREGA";
  const trimmed = address.trim().toLowerCase();
  const isMesa = trimmed.startsWith("mesa") || /^\d+$/.test(trimmed);
  return isMesa ? "LOCAL" : "ENTREGA";
}

function OrderTrackingContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const orderId = params.id as string
  const statusPagamento = searchParams.get("status")
  
  const { orders, sync, sizes, menuItems, products } = useStore()
  const [isMounted, setIsMounted] = useState(false)
  const [retryCount, setRetryCount] = useState(0) // Contador para a inteligência de espera

  const order = orders.find(o => o.id === orderId)

  useEffect(() => {
    setIsMounted(true)
    sync() 
    
    if (statusPagamento === "sucesso" && orderId) {
      dbDispatch("CONFIRM_ONLINE_PAYMENT", { id: orderId }).then(() => {
        sync()
      }).catch(err => console.error("Erro ao aprovar pagamento:", err))
    }

    const interval = setInterval(() => {
      sync()
    }, 5000)
    return () => clearInterval(interval)
  }, [sync, statusPagamento, orderId])

  // LÓGICA DE ESPERA: Se não achou o pedido ainda, tenta buscar de novo a cada 1 segundo (até 5x)
  useEffect(() => {
    if (!order && retryCount < 5) {
      const timer = setTimeout(() => {
        sync();
        setRetryCount(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [order, retryCount, sync])

  if (!isMounted) return null

  // Se ainda não achou e está dentro das 5 tentativas, mostra tela de carregamento (Impede o erro visual)
  if (!order && retryCount < 5) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-stone-800">Localizando seu pedido...</h2>
        <p className="text-sm text-stone-500">Aguarde um instante.</p>
      </div>
    )
  }

  // Se já tentou 5 vezes e o pedido realmente não existe, aí sim mostra erro.
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <AlertCircle className="w-16 h-16 text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-800">Pedido não encontrado</h2>
        <p className="text-sm text-stone-500 mb-6">Não conseguimos localizar o pedido #{orderId}</p>
        <button onClick={() => router.push("/")} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg transition-colors">
          Voltar ao Início
        </button>
      </div>
    )
  }

  const orderType = getOrderType(order.address);
  const isCanceled = order.status === "cancelado";

  const steps = orderType === "LOCAL" ? [
    { key: "novo", label: "Aguardando", icon: Clock, desc: "Recebemos o pedido na sua mesa." },
    { key: "aprovado", label: "Preparando", icon: ChefHat, desc: "A cozinha já está preparando seu macarrão." },
    { key: "entregue", label: "Entregue", icon: CheckCircle2, desc: "Bom apetite!" },
  ] : [
    { key: "novo", label: "Aguardando", icon: Clock, desc: "Recebemos seu pedido e vamos analisá-lo logo." },
    { key: "aprovado", label: "Preparando", icon: ChefHat, desc: "Nossos chefs já estão preparando a sua comida." },
    { key: "pronto", label: "Aguardando Coleta", icon: Package, desc: "Seu pedido está embalado aguardando o motoboy." },
    { key: "despachado", label: "Saiu para Entrega", icon: Bike, desc: "O entregador já está a caminho do seu endereço." },
    { key: "entregue", label: "Entregue", icon: CheckCircle2, desc: "Pedido entregue com sucesso! Bom apetite." },
  ];

  const statusOrder = steps.map(s => s.key);
  let currentStepIndex = statusOrder.indexOf(order.status);
  
  if (currentStepIndex === -1 && !isCanceled) {
    if (order.status === "entregue") currentStepIndex = steps.length - 1;
    else currentStepIndex = 0;
  }

  const getSizeName = (sizeId: string) => sizes.find((s) => s.id === sizeId)?.name || "Tamanho Indefinido";
  const getItemName = (itemId: string) => menuItems.find((i) => i.id === itemId)?.name || itemId;
  const getProductName = (prodId: string) => products.find((p) => p.id === prodId)?.name || prodId;

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-10">
      <div className="bg-stone-900 text-white px-4 sm:px-6 py-6 shadow-md rounded-b-3xl">
        <div className="max-w-md mx-auto flex items-center gap-4">
          {/* <button onClick={() => router.push("/")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button> */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Acompanhar Pedido</h1>
            <p className="text-orange-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">ID: #{order.id.slice(0,8)}</p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 mt-2 space-y-5 animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-lg text-stone-800">Status do Pedido</h2>
            <button onClick={sync} className="text-stone-500 hover:text-orange-600 flex items-center gap-1.5 text-xs font-bold bg-stone-100 hover:bg-orange-50 px-2 py-1 rounded-md transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>
          
          {isCanceled ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                <Ban className="w-8 h-8" />
              </div>
              <h3 className="font-black text-red-600 text-lg">Pedido Cancelado</h3>
              <p className="text-stone-500 text-sm mt-1">Este pedido foi cancelado pelo estabelecimento.</p>
            </div>
          ) : (
            <div className="relative space-y-6 sm:space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-orange-600 before:via-stone-200 before:to-transparent">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const Icon = step.icon

                return (
                  <div key={step.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10 ${
                      isCompleted ? 'bg-orange-600 border-white text-white' : 'bg-stone-100 border-white text-stone-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex flex-col bg-white p-1">
                        <h3 className={`font-black text-sm sm:text-base ${isCurrent ? 'text-orange-700' : 'text-stone-800'}`}>
                          {step.label}
                        </h3>
                        {isCurrent && (
                          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-snug">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
          <h2 className="font-black text-lg text-stone-800 mb-4 border-b border-stone-100 pb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" /> Resumo do Pedido
          </h2>
          
          <div className="space-y-4 text-sm text-stone-600">
            {order.items?.map((item: any, idx: number) => (
              <div key={`mac-${idx}`} className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-xs sm:text-sm">
                <div className="font-black text-stone-800 mb-2.5 flex items-center justify-between">
                  <span>Macarrão {getSizeName(item.sizeId)}</span>
                </div>
                
                <div className="space-y-1.5 pl-3 border-l-2 border-stone-200">
                  {item.pastaId && (
                    <div><span className="font-bold text-stone-500">Massa:</span> <span className="font-semibold text-stone-700">{getItemName(item.pastaId)}</span></div>
                  )}
                  {item.sauces?.length > 0 && (
                    <div><span className="font-bold text-stone-500">Molhos:</span> <span className="font-semibold text-stone-700">{item.sauces.map(getItemName).join(', ')}</span></div>
                  )}
                  {item.temperos?.length > 0 && (
                    <div><span className="font-bold text-stone-500">Temperos:</span> <span className="font-semibold text-stone-700">{item.temperos.map(getItemName).join(', ')}</span></div>
                  )}
                  {item.ingredients?.length > 0 && (
                    <div><span className="font-bold text-stone-500">Ingredientes:</span> <span className="font-semibold text-stone-700 leading-relaxed">{item.ingredients.map(getItemName).join(', ')}</span></div>
                  )}
                  
                  {item.extras?.length > 0 && (
                    <div className="mt-2 pt-1 border-t border-stone-200">
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> Extras Pagos:
                      </span> 
                      <span className="font-black text-amber-800 leading-relaxed">
                        {item.extras.map(getItemName).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {order.products && order.products.length > 0 && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs sm:text-sm">
                <div className="font-black text-blue-900 mb-2">Outros Itens</div>
                <div className="space-y-1 pl-3 border-l-2 border-blue-200">
                  {order.products.map((prod: any, idx: number) => (
                    <div key={`prod-${idx}`} className="font-semibold text-stone-700">
                      {prod.quantity}x {getProductName(prod.productId)}
                    </div>
                  ))}
                </div>
              </div>
            )}

         {/* BLOCO DA OBSERVAÇÃO COM QUEBRA DE TEXTO FORÇADA */}
            {order.observation && (
              <div className="bg-amber-50 p-3 sm:p-4 rounded-xl border border-amber-200 mt-4 w-full">
                <span className="text-[10px] sm:text-xs font-black text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Observação do Cliente
                </span>
                <p className="text-amber-900 font-medium text-xs sm:text-sm italic break-words whitespace-pre-wrap w-full">
                  "{order.observation}"
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm mb-8">
          <h2 className="font-black text-lg text-stone-800 mb-4 border-b border-stone-100 pb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" /> Dados da Entrega
          </h2>
          <div className="space-y-3.5 text-sm text-stone-600">
            <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="font-bold text-stone-500">Cliente:</span>
              <span className="font-black text-stone-800">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-start bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="font-bold text-stone-500 whitespace-nowrap mr-4">Endereço:</span>
              <span className="font-bold text-stone-800 text-right leading-snug">{order.address}</span>
            </div>
            
            <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="font-bold text-stone-500">Pagamento:</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-stone-800 uppercase">{order.paymentMethod}</span>
                <Badge variant="outline" className={`${order.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} text-[10px] font-black`}>
                  {order.isPaid ? 'PAGO' : 'A PAGAR'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-stone-200">
              <span className="font-black text-stone-800 text-lg">Total do Pedido:</span>
              <span className="text-2xl font-black text-green-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600"/></div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}