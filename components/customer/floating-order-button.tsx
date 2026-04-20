"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

// Função para salvar o ID do pedido no celular do cliente (Expira em 3 dias)
export function saveOrderLocally(id: string) {
  try {
    const stored = localStorage.getItem("meus_pedidos_macarrao");
    const orders = stored ? JSON.parse(stored) : [];
    orders.push({ id, date: Date.now() });
    localStorage.setItem("meus_pedidos_macarrao", JSON.stringify(orders));
    window.dispatchEvent(new Event("order_added"));
  } catch (e) {
    console.error("Erro ao salvar pedido localmente", e);
  }
}

export function FloatingOrderButton() {
  const [latestOrder, setLatestOrder] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkOrders = () => {
      const stored = localStorage.getItem("meus_pedidos_macarrao");
      if (stored) {
        try {
          const orders = JSON.parse(stored);
          const now = Date.now();
          const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 dias em milissegundos

          // Filtra apenas os pedidos dos últimos 3 dias
          const validOrders = orders.filter((o: any) => now - o.date < threeDays);

          // Atualiza o local storage se algum pedido expirou
          if (validOrders.length !== orders.length) {
            localStorage.setItem("meus_pedidos_macarrao", JSON.stringify(validOrders));
          }

          if (validOrders.length > 0) {
            // Pega o pedido mais recente
            validOrders.sort((a: any, b: any) => b.date - a.date);
            setLatestOrder(validOrders[0].id);
          } else {
            setLatestOrder(null);
          }
        } catch (e) {
          localStorage.removeItem("meus_pedidos_macarrao");
        }
      }
    };

    checkOrders();
    window.addEventListener("storage", checkOrders);
    window.addEventListener("order_added", checkOrders);

    return () => {
      window.removeEventListener("storage", checkOrders);
      window.removeEventListener("order_added", checkOrders);
    };
  }, []);

  if (!latestOrder) return null;

  return (
    <button
      onClick={() => router.push(`/pedido/${latestOrder}`)}
      className="fixed bottom-24 lg:bottom-10 right-4 z-[60] bg-orange-600 text-white p-3.5 rounded-full shadow-xl hover:bg-orange-700 transition-transform active:scale-95 flex items-center gap-2 border-2 border-white animate-in zoom-in duration-300"
    >
      <Package className="w-6 h-6 animate-pulse" />
      <span className="font-black text-sm pr-1">Acompanhar Pedido</span>
    </button>
  );
}