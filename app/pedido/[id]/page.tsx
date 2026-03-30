// app/pedido/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { ChefHat, Clock, ChefHat as ChefHatIcon, Check, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"

function formatCurrency(value: number) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const { orders, sync } = useStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    sync() 
    setIsMounted(true)
    
    const interval = setInterval(() => {
      sync()
    }, 10000)
    return () => clearInterval(interval)
  }, [sync])

  if (!isMounted) return null

  const order = orders.find(o => o.id === orderId)

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <AlertCircle className="w-16 h-16 text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-800">Pedido não encontrado</h2>
        <p className="text-sm text-stone-500 mb-6">Não conseguimos localizar o pedido #{orderId}</p>
        <button onClick={() => router.push("/")} className="px-6 py-2 bg-orange-700 text-white rounded-lg font-bold">
          Voltar ao Início
        </button>
      </div>
    )
  }

  const steps = [
    { key: "novo", label: "Aguardando Confirmação", icon: Clock },
    { key: "aprovado", label: "Em Preparação", icon: ChefHatIcon },
    { key: "pronto", label: "Saiu para Entrega", icon: Check },
  ]

  let currentStepIndex = 0
  if (order.status === "aprovado") currentStepIndex = 1
  if (order.status === "pronto") currentStepIndex = 2

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-10">
      <div className="bg-stone-900 text-white px-6 py-6 shadow-md rounded-b-3xl">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Acompanhar Pedido</h1>
            <p className="text-stone-400 text-xs uppercase tracking-widest">ID: #{order.id}</p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 mt-4 space-y-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-stone-800">Status do Pedido</h2>
            <button onClick={sync} className="text-stone-400 hover:text-orange-600 flex items-center gap-1 text-xs">
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>
          
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200 before:to-transparent">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              const Icon = step.icon

              return (
                <div key={step.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10 ${
                    isCompleted ? 'bg-orange-600 border-white text-white' : 'bg-stone-100 border-white text-stone-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="flex flex-col">
                      <h3 className={`font-bold text-sm ${isCurrent ? 'text-orange-700' : 'text-stone-800'}`}>
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <p className="text-xs text-stone-500 mt-1">
                          {index === 0 && "Recebemos seu pedido e vamos analisá-lo logo."}
                          {index === 1 && "Nossos chefs já estão preparando a sua comida."}
                          {index === 2 && "O entregador já está a caminho do seu endereço."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="font-bold text-stone-800 mb-4 border-b border-stone-100 pb-2">Detalhes</h2>
          <div className="space-y-3 text-sm text-stone-600">
            <div className="flex justify-between">
              <span className="font-medium">Cliente:</span>
              <span className="text-stone-800">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Endereço:</span>
              <span className="text-stone-800 text-right max-w-[200px]">{order.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Pagamento:</span>
              <span className="text-stone-800 uppercase">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-stone-100">
              <span className="font-bold text-stone-800">Total:</span>
              <span className="text-xl font-black text-orange-700">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}