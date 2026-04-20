"use client";

import { useEffect, useState } from "react";
import { Package, ChevronDown, ChevronUp, Clock, ArrowRight } from "lucide-react";

// Função para salvar o ID do pedido no celular do cliente (Expira em 3 dias)
export function saveOrderLocally(id: string) {
  try {
    const stored = localStorage.getItem("casamacarrao_orders");
    const orders = stored ? JSON.parse(stored) : [];
    orders.push({ id, date: Date.now() });
    localStorage.setItem("casamacarrao_orders", JSON.stringify(orders));
    window.dispatchEvent(new Event("order_updated"));
  } catch (e) {
    console.error("Erro ao salvar localmente", e);
  }
}

export function OrderHistoryWidget({ isMobile }: { isMobile?: boolean }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkOrders = () => {
      const stored = localStorage.getItem("casamacarrao_orders");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 dias em milissegundos
          
          // Filtra apenas pedidos recentes
          const validOrders = parsed.filter((o: any) => now - o.date < threeDays);

          // Atualiza se algum expirou
          if (validOrders.length !== parsed.length) {
            localStorage.setItem("casamacarrao_orders", JSON.stringify(validOrders));
          }

          // Ordena do mais recente para o mais antigo
          validOrders.sort((a: any, b: any) => b.date - a.date);
          setOrders(validOrders);
        } catch (e) {
          localStorage.removeItem("casamacarrao_orders");
        }
      }
    };

    checkOrders();
    window.addEventListener("storage", checkOrders);
    window.addEventListener("order_updated", checkOrders);

    return () => {
      window.removeEventListener("storage", checkOrders);
      window.removeEventListener("order_updated", checkOrders);
    };
  }, []);

  if (orders.length === 0) return null;

  // LAYOUT PARA CELULAR: Fica logo abaixo da sacola e expande a lista
  if (isMobile) {
    return (
      <div className="mt-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 font-bold transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="text-sm">Acompanhar Pedidos ({orders.length})</span>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {isOpen && (
          <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => window.location.href = `/pedido/${order.id}`}
                className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 rounded-xl hover:border-orange-300 transition-colors shadow-sm"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-stone-600">Pedido #{order.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5 font-medium">
                    <Clock className="w-3 h-3" /> 
                    {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <ArrowRight className="w-4 h-4 text-orange-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // LAYOUT PARA DESKTOP: Botão flutuante que abre um mini-menu
  return (
    <div className="fixed bottom-10 right-4 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-stone-900 p-3 text-white font-bold flex items-center gap-2">
            <Package className="w-4 h-4" /> Histórico de Pedidos
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => window.location.href = `/pedido/${order.id}`}
                className="w-full flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-stone-700 group-hover:text-orange-700 transition-colors">#{order.id.slice(0, 8)}</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">
                    {new Date(order.date).toLocaleDateString('pt-BR')} - {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-orange-600 text-white p-3.5 rounded-full shadow-2xl hover:bg-orange-700 transition-transform active:scale-95 flex items-center gap-2 border-2 border-white"
      >
        <Package className="w-6 h-6 animate-pulse" />
        <span className="font-black text-sm pr-1">Meus Pedidos</span>
        {isOpen ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
      </button>
    </div>
  );
}